import type {
  SignalingIncomingMessage,
  SignalingOutgoingMessage,
} from './types'

type MessageHandler = (payload: any, message: SignalingOutgoingMessage) => void

export class NativeSignalingClient {
  private ws: WebSocket | null = null
  private handlers = new Map<string, Set<MessageHandler>>()
  private reconnectTimer: any = null
  private pingInterval: any = null
  private isExplicitlyClosed = false
  private connectionOptions: {
    roomId: string
    token?: string
    ticketCode?: string
    displayName?: string
    requestedRole?: 'teacher' | 'student'
  } | null = null

  constructor(private customWsUrl?: string) {}

  private buildEndpointUrl(roomId: string, token?: string, ticket?: string): string {
    if (this.customWsUrl) {
      return this.customWsUrl
    }

    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
    const protocol = isHttps ? 'wss:' : 'ws:'
    const host = typeof window !== 'undefined' ? window.location.host : 'localhost:5001'

    const url = new URL(`${protocol}//${host}/api/classroom/native/ws`)
    url.searchParams.set('roomId', roomId)
    if (token) url.searchParams.set('token', token)
    if (ticket) url.searchParams.set('ticket', ticket)

    return url.toString()
  }

  connect(options: {
    roomId: string
    token?: string
    ticketCode?: string
    displayName?: string
    requestedRole?: 'teacher' | 'student'
  }): Promise<void> {
    this.connectionOptions = options
    this.isExplicitlyClosed = false
    this.clearTimers()

    if (this.ws) {
      try {
        this.ws.onclose = null
        this.ws.onerror = null
        this.ws.onmessage = null
        this.ws.close()
      } catch (e) {}
      this.ws = null
    }

    return new Promise((resolve, reject) => {
      let settled = false
      try {
        const wsUrl = this.buildEndpointUrl(options.roomId, options.token, options.ticketCode)
        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
          settled = true
          this.startHeartbeat(options.roomId)
          this.send({
            type: 'join_room',
            roomId: options.roomId,
            token: options.token,
            ticketCode: options.ticketCode,
            displayName: options.displayName,
            requestedRole: options.requestedRole,
          })
          resolve()
        }

        this.ws.onmessage = event => {
          try {
            const data: SignalingOutgoingMessage = JSON.parse(event.data)
            this.emit(data.type, data.payload, data)
          } catch (e) {
            console.error('[NativeSignaling] Failed to parse message:', e)
          }
        }

        this.ws.onerror = err => {
          this.emit('error', { code: 'SOCKET_ERROR', message: 'اختلال در ارتباط وب‌سوکت سیگنالینگ' })
          if (!settled) {
            settled = true
            reject(err)
          }
        }

        this.ws.onclose = () => {
          this.stopHeartbeat()
          this.emit('close', {})
          if (!this.isExplicitlyClosed) {
            this.scheduleReconnect()
          }
        }
      } catch (err) {
        if (!settled) {
          settled = true
          reject(err)
        }
      }
    })
  }

  private startHeartbeat(roomId: string) {
    this.stopHeartbeat()
    this.pingInterval = setInterval(() => {
      this.send({ type: 'ping', roomId })
    }, 20000)
  }

  private stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }

  private clearTimers() {
    this.stopHeartbeat()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  send(msg: SignalingIncomingMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    }
  }

  on(event: string, handler: MessageHandler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler)
  }

  off(event: string, handler: MessageHandler) {
    this.handlers.get(event)?.delete(handler)
  }

  private emit(event: string, payload: any, message?: any) {
    const listeners = this.handlers.get(event)
    if (listeners) {
      listeners.forEach(fn => fn(payload, message))
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer || this.isExplicitlyClosed) return
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      if (this.connectionOptions && !this.isExplicitlyClosed) {
        this.connect(this.connectionOptions).catch(() => {
          this.scheduleReconnect()
        })
      }
    }, 2500)
  }

  disconnect() {
    this.isExplicitlyClosed = true
    this.clearTimers()
    if (this.ws) {
      try {
        if (this.ws.readyState === WebSocket.OPEN) {
          this.send({ type: 'leave_room', roomId: this.connectionOptions?.roomId || '' })
        }
        this.ws.onclose = null
        this.ws.close()
      } catch (e) {}
      this.ws = null
    }
    this.handlers.clear()
  }
} 