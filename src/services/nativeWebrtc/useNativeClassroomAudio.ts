import { useState, useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import { NativeAudioMediaManager } from './NativeAudioMediaManager'
import { NativeSignalingClient } from './NativeSignalingClient'
import { NativeMeshPeerManager, type PeerDiagnosticsInfo } from './NativeMeshPeerManager'
import { CLASSROOM_RECORDING_THEME } from '../../theme/eduAdminTokens'
import type {
  INativeParticipant,
  IRoomDetails,
  ISeminarPollView,
  IWhiteboardState,
  IWhiteboardElement,
  ILaserPointerState,
  IChatMessage,
  IClassroomRecordingLiveState,
  ITeacherPresenceState,
  IRoomTimerSyncState,
} from './types'
import type { ISeminarAttendeeRow } from '../classroomService'

export interface DiagnosticLogEntry {
  id: string
  time: string
  category: 'ws' | 'webrtc' | 'ice' | 'audio' | 'error' | 'info'
  message: string
}

interface UseNativeClassroomOptions {
  roomId: string
  token?: string
  ticketCode?: string
  displayName?: string
  requestedRole?: 'teacher' | 'student'
  attendeeKey?: string
  formAnswers?: Record<string, any>
  customWsUrl?: string
  initialMicEnabled?: boolean
  initialCameraEnabled?: boolean
}

export function useNativeClassroomAudio(options: UseNativeClassroomOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [isMicEnabled, setIsMicEnabled] = useState(false)
  const [isMicBlocked, setIsMicBlocked] = useState(false)
  const [isCameraEnabled, setIsCameraEnabled] = useState(false)
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user')
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [localVideoStream, setLocalVideoStream] = useState<MediaStream | null>(null)
  const [remoteVideoStreams, setRemoteVideoStreams] = useState<Map<string, MediaStream>>(new Map())
  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState(false)
  const [participants, setParticipants] = useState<INativeParticipant[]>([])
  const [self, setSelf] = useState<INativeParticipant | null>(null)
  const [room, setRoom] = useState<IRoomDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [removedCode, setRemovedCode] = useState<string | null>(null)
  const [whiteboard, setWhiteboard] = useState<IWhiteboardState>({
    currentPage: 1,
    totalPages: 10,
    gridMode: 'grid',
    allowStudentDraw: false,
    pages: { 1: [] },
    pageBackgrounds: {},
  })
  const [remoteLaser, setRemoteLaser] = useState<ILaserPointerState | null>(null)
  const [remoteDraftElement, setRemoteDraftElement] = useState<{
    page: number
    element: IWhiteboardElement
  } | null>(null)
  const [chatMessages, setChatMessages] = useState<IChatMessage[]>([])
  const [unreadChatCount, setUnreadChatCount] = useState(0)
  const [polls, setPolls] = useState<ISeminarPollView[]>([])
  const [seminarAttendees, setSeminarAttendees] = useState<ISeminarAttendeeRow[]>([])
  const initialIsTestRoom =
    options.roomId.toLowerCase().includes('test') || options.roomId.toLowerCase().startsWith('demo-')
  const [recordingState, setRecordingState] = useState<IClassroomRecordingLiveState>({
    isRecording: false,
    mode: initialIsTestRoom ? 'manual_test' : 'auto',
    status: 'idle',
    chunksCount: 0,
    fileSize: 0,
    isTestRoom: initialIsTestRoom,
  })

  const [diagnosticLogs, setDiagnosticLogs] = useState<DiagnosticLogEntry[]>([])
  const [peersDiagnostics, setPeersDiagnostics] = useState<Map<string, PeerDiagnosticsInfo>>(new Map())
  const [teacherPresence, setTeacherPresence] = useState<ITeacherPresenceState | null>(null)
  const [roomTimer, setRoomTimer] = useState<IRoomTimerSyncState | null>(null)
  const [endWarning, setEndWarning] = useState<{ endsAt?: string; minutesRemaining: number; message: string } | null>(null)

  const mediaManagerRef = useRef<NativeAudioMediaManager | null>(null)
  const signalingClientRef = useRef<NativeSignalingClient | null>(null)
  const meshManagerRef = useRef<NativeMeshPeerManager | null>(null)

  const addLog = useCallback((category: DiagnosticLogEntry['category'], message: string) => {
    const time = new Date().toLocaleTimeString('fa-IR', { hour12: false })
    const entry: DiagnosticLogEntry = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      time,
      category,
      message,
    }
    setDiagnosticLogs(prev => [entry, ...prev.slice(0, 99)])
  }, [])

  useEffect(() => {
    let isMounted = true
    setRemovedCode(null)
    setError(null)
    addLog('info', `آماده‌سازی ورود به کلاس ${options.roomId}`)

    const mediaManager = new NativeAudioMediaManager()
    mediaManagerRef.current = mediaManager

    const signalingClient = new NativeSignalingClient(options.customWsUrl)
    signalingClientRef.current = signalingClient

    const meshManager = new NativeMeshPeerManager((type, targetPeerId, payload) => {
      signalingClient.send({
        type,
        roomId: options.roomId,
        targetPeerId,
        ...payload,
      })
    })
    meshManagerRef.current = meshManager

    meshManager.onLog = (cat, msg) => {
      if (isMounted) addLog(cat, msg)
    }

    meshManager.onPeerStateChange = (peerId, info) => {
      if (!isMounted) return
      setPeersDiagnostics(prev => {
        const next = new Map(prev)
        next.set(peerId, info)
        return next
      })
    }

    meshManager.onRemoteVideoStreamChange = (peerId, stream) => {
      if (!isMounted) return
      setRemoteVideoStreams(prev => {
        const next = new Map(prev)
        if (stream) {
          next.set(peerId, stream)
        } else {
          next.delete(peerId)
        }
        return next
      })
    }

    meshManager.onAutoplayBlocked = () => {
      if (isMounted) setIsAutoplayBlocked(true)
    }

    // Signaling Events
    signalingClient.on('room_joined', async payload => {
      if (!isMounted) return
      setIsConnected(true)
      setError(null)

      // Reset any stale peer connections from previous socket session
      meshManager.closeAll()
      setPeersDiagnostics(new Map())
      setRemoteVideoStreams(new Map())

      meshManager.setSelfPeerId(payload.self.peerId)
      setSelf(payload.self)
      setIsMicBlocked(payload.self.micState === 'blocked')
      if (payload.self.micState === 'blocked') {
        mediaManager.setMicrophoneEnabled(false)
        setIsMicEnabled(false)
      }
      setParticipants(payload.participants || [])
      setRoom(payload.room)
      if (payload.whiteboard && typeof payload.whiteboard === 'object') {
        setWhiteboard(prev => ({
          ...prev,
          ...payload.whiteboard,
          currentPage: payload.whiteboard.currentPage || prev.currentPage || 1,
          pages: payload.whiteboard.pages || prev.pages || { 1: [] },
          pageBackgrounds: payload.whiteboard.pageBackgrounds || prev.pageBackgrounds || {},
        }))
      }
      if (Array.isArray(payload.chatMessages)) {
        setChatMessages(payload.chatMessages)
      }
      if (Array.isArray(payload.polls)) {
        setPolls(payload.polls)
      }
      if (Array.isArray(payload.attendees)) {
        setSeminarAttendees(payload.attendees)
      }
      if (payload.recording) {
        setRecordingState(payload.recording)
      }
      if (payload.teacherPresence) {
        setTeacherPresence(payload.teacherPresence)
      }
      if (payload.roomTimer) {
        setRoomTimer(payload.roomTimer)
      }

      addLog(
        'ws',
        `ورود موفق به اتاق. شناسه من: ${payload.self.peerId} (نقش: ${
          payload.self.role === 'teacher' ? 'معلم' : 'دانش‌آموز'
        })`
      )

      if (payload.iceServers) {
        meshManager.setIceServers(payload.iceServers)
      }

      // Sync current local mic & camera state with server after joining/rejoining
      const currentlyEnabled = mediaManager.isMicrophoneEnabled()
      if (currentlyEnabled) {
        signalingClient.send({
          type: 'set_microphone',
          roomId: options.roomId,
          enabled: true,
        })
      }
      if (mediaManager.isCameraEnabled()) {
        signalingClient.send({
          type: 'set_camera',
          roomId: options.roomId,
          enabled: true,
        })
      }

      // Initiate offers to all existing participants in the room
      if (payload.participants && Array.isArray(payload.participants) && payload.participants.length > 0) {
        addLog(
          'webrtc',
          `تعداد ${payload.participants.length} کاربر در اتاق حاضرند؛ شروع تبادل صوتی و تصویری P2P...`
        )
        for (const p of payload.participants as INativeParticipant[]) {
          await meshManager.createOfferForPeer(p.peerId)
        }
      }
    })

    signalingClient.on('participant_joined', ({ participant }) => {
      if (!isMounted) return
      addLog('webrtc', `کاربر جدید وارد شد: ${participant.name} (${participant.peerId})`)
      setParticipants(prev => {
        const filtered = prev.filter(p => p.peerId !== participant.peerId)
        return [...filtered, participant]
      })
    })

    signalingClient.on('participant_left', ({ peerId }) => {
      if (!isMounted) return
      addLog('webrtc', `کاربر از کلاس خارج شد: ${peerId}`)
      meshManager.removePeer(peerId)
      setParticipants(prev => prev.filter(p => p.peerId !== peerId))
      setPeersDiagnostics(prev => {
        const next = new Map(prev)
        next.delete(peerId)
        return next
      })
      setRemoteVideoStreams(prev => {
        const next = new Map(prev)
        next.delete(peerId)
        return next
      })
    })

    signalingClient.on('offer', async (payload, msg) => {
      if (msg.fromPeerId && payload?.sdp) {
        await meshManager.handleRemoteOffer(msg.fromPeerId, payload.sdp)
      }
    })

    signalingClient.on('answer', async (payload, msg) => {
      if (msg.fromPeerId && payload?.sdp) {
        await meshManager.handleRemoteAnswer(msg.fromPeerId, payload.sdp)
      }
    })

    signalingClient.on('ice_candidate', async (payload, msg) => {
      if (msg.fromPeerId && payload?.candidate) {
        await meshManager.handleRemoteCandidate(msg.fromPeerId, payload.candidate)
      }
    })

    signalingClient.on('microphone_state_changed', ({ peerId, enabled }) => {
      if (!isMounted) return
      addLog('audio', `وضعیت میکروفون کاربر ${peerId}: ${enabled ? 'روشن 🎙️' : 'خاموش 🔇'}`)
      setParticipants(prev =>
        prev.map(p => (p.peerId === peerId ? { ...p, micState: enabled ? 'enabled' : 'disabled' } : p))
      )
      setSelf(prev => {
        if (prev && prev.peerId === peerId) {
          return { ...prev, micState: enabled ? 'enabled' : 'disabled' }
        }
        return prev
      })
    })

    signalingClient.on('camera_state_changed', ({ peerId, enabled }) => {
      if (!isMounted) return
      addLog('webrtc', `وضعیت دوربین کاربر ${peerId}: ${enabled ? 'روشن 📹' : 'خاموش'}`)
      setParticipants(prev => {
        const next = prev.map(p => (p.peerId === peerId ? { ...p, cameraEnabled: enabled } : p))
        const target = next.find(p => p.peerId === peerId)
        if (!enabled && !target?.screenShareEnabled) {
          setRemoteVideoStreams(streams => {
            const copy = new Map(streams)
            copy.delete(peerId)
            return copy
          })
        }
        return next
      })
      setSelf(prev => {
        if (prev && prev.peerId === peerId) {
          return { ...prev, cameraEnabled: enabled }
        }
        return prev
      })
    })

    signalingClient.on('screen_share_state_changed', ({ peerId, enabled }) => {
      if (!isMounted) return
      addLog('webrtc', `اشتراک صفحه کاربر ${peerId}: ${enabled ? 'فعال 🖥️' : 'متوقف شد'}`)
      setParticipants(prev => {
        const next = prev.map(p => (p.peerId === peerId ? { ...p, screenShareEnabled: enabled } : p))
        const target = next.find(p => p.peerId === peerId)
        if (!enabled && !target?.cameraEnabled) {
          setRemoteVideoStreams(streams => {
            const copy = new Map(streams)
            copy.delete(peerId)
            return copy
          })
        }
        return next
      })
      setSelf(prev => {
        if (prev && prev.peerId === peerId) {
          return { ...prev, screenShareEnabled: enabled }
        }
        return prev
      })
    })

    signalingClient.on('chat_message', (chatMsg: IChatMessage) => {
      if (!isMounted || !chatMsg) return
      setChatMessages(prev => {
        if (prev.some(m => m.id === chatMsg.id)) return prev
        return [...prev, chatMsg]
      })
      setUnreadChatCount(c => c + 1)
    })

    signalingClient.on('whiteboard_update', payload => {
      if (!isMounted || !payload) return
      const { action } = payload

      if (action === 'laser_move') {
        if (payload.active) {
          setRemoteLaser({
            peerId: payload.peerId,
            name: payload.name,
            page: Number(payload.page) || undefined,
            x: payload.x,
            y: payload.y,
            active: true,
          })
        } else {
          setRemoteLaser(null)
        }
        return
      }

      if (action === 'draw_progress') {
        if (payload.element) {
          setRemoteDraftElement({
            page: Number(payload.page) || 1,
            element: payload.element,
          })
        }
        return
      }

      // Clear remote draft when element is committed or cleared
      setRemoteDraftElement(null)

      setWhiteboard(prev => {
        if (action === 'sync_state' && payload.whiteboard) {
          return payload.whiteboard
        }
        if (action === 'add_element' && payload.element) {
          const page = Number(payload.page) || prev.currentPage
          const currentElements = prev.pages[page] || []
          if (currentElements.some(e => e.id === payload.element.id)) return prev
          return {
            ...prev,
            pages: {
              ...prev.pages,
              [page]: [...currentElements, payload.element],
            },
          }
        }
        if (action === 'erase_element' && payload.elementId) {
          const page = Number(payload.page) || prev.currentPage
          const currentElements = prev.pages[page] || []
          return {
            ...prev,
            pages: {
              ...prev.pages,
              [page]: currentElements.filter(e => e.id !== payload.elementId),
            },
          }
        }
        if (action === 'clear_page') {
          const page = Number(payload.page) || prev.currentPage
          return {
            ...prev,
            pages: {
              ...prev.pages,
              [page]: [],
            },
          }
        }
        if (action === 'change_page') {
          const nextPage = Number(payload.currentPage) || 1
          return {
            ...prev,
            currentPage: nextPage,
            pages: {
              ...prev.pages,
              [nextPage]: payload.elements || prev.pages[nextPage] || [],
            },
          }
        }
        if (action === 'set_grid' && payload.gridMode) {
          return {
            ...prev,
            gridMode: payload.gridMode,
          }
        }
        if (action === 'toggle_student_draw') {
          return {
            ...prev,
            allowStudentDraw: !!payload.allowStudentDraw,
          }
        }
        return prev
      })
    })

    signalingClient.on('permission_state_changed', ({ peerId, micBlocked }) => {
      if (!isMounted) return
      const newState = micBlocked ? 'blocked' : 'disabled'
      addLog('webrtc', `دسترسی میکروفون کاربر ${peerId} ${micBlocked ? 'مسدود شد' : 'آزاد شد'}`)
      setParticipants(prev =>
        prev.map(p => (p.peerId === peerId ? { ...p, micState: newState } : p))
      )
      setSelf(prev => {
        if (prev && prev.peerId === peerId) {
          setIsMicBlocked(micBlocked)
          if (micBlocked) {
            mediaManager.setMicrophoneEnabled(false)
            setIsMicEnabled(false)
          }
          return { ...prev, micState: newState }
        }
        return prev
      })
    })

    signalingClient.on('screen_share_permission_changed', ({ peerId, canShareScreen }) => {
      if (!isMounted) return
      addLog('webrtc', `دسترسی اشتراک صفحه کاربر ${peerId}: ${canShareScreen ? 'مجاز' : 'مسدود'}`)
      setParticipants(prev =>
        prev.map(p => (p.peerId === peerId ? { ...p, canShareScreen: !!canShareScreen } : p))
      )
      setSelf(prev => {
        if (prev && prev.peerId === peerId) {
          return { ...prev, canShareScreen: !!canShareScreen }
        }
        return prev
      })
    })

    signalingClient.on('hand_raise_changed', ({ peerId, raised }) => {
      if (!isMounted) return
      setParticipants(prev => prev.map(p => (p.peerId === peerId ? { ...p, handRaised: !!raised } : p)))
      setSelf(prev => (prev && prev.peerId === peerId ? { ...prev, handRaised: !!raised } : prev))
    })

    signalingClient.on('speaker_status_changed', ({ peerId, isSpeaker, micState, cameraEnabled, handRaised }) => {
      if (!isMounted) return
      setParticipants(prev =>
        prev.map(p =>
          p.peerId === peerId
            ? { ...p, isSpeaker: !!isSpeaker, micState: micState || p.micState, cameraEnabled, handRaised }
            : p
        )
      )
      setSelf(prev => {
        if (prev && prev.peerId === peerId) {
          const blocked = micState === 'blocked'
          setIsMicBlocked(blocked)
          if (blocked) {
            mediaManager.setMicrophoneEnabled(false)
            setIsMicEnabled(false)
          }
          return { ...prev, isSpeaker: !!isSpeaker, micState: micState || prev.micState, cameraEnabled, handRaised }
        }
        return prev
      })
    })

    signalingClient.on('moderator_status_changed', ({ peerId, isModerator, isSpeaker, micState, cameraEnabled }) => {
      if (!isMounted) return
      setParticipants(prev =>
        prev.map(p =>
          p.peerId === peerId
            ? { ...p, isModerator: !!isModerator, isSpeaker: !!isSpeaker, micState: micState || p.micState, cameraEnabled }
            : p
        )
      )
      setSelf(prev => {
        if (prev && prev.peerId === peerId) {
          const blocked = micState === 'blocked'
          setIsMicBlocked(blocked)
          if (blocked) {
            mediaManager.setMicrophoneEnabled(false)
            setIsMicEnabled(false)
          }
          return { ...prev, isModerator: !!isModerator, isSpeaker: !!isSpeaker, micState: micState || prev.micState, cameraEnabled }
        }
        return prev
      })
    })

    signalingClient.on('polls_sync', ({ polls: nextPolls }) => {
      if (!isMounted) return
      if (Array.isArray(nextPolls)) {
        setPolls(nextPolls)
      }
    })

    signalingClient.on('seminar_attendees_sync', ({ attendees }) => {
      if (!isMounted) return
      if (Array.isArray(attendees)) {
        setSeminarAttendees(attendees)
      }
    })

    signalingClient.on('participant_removed', ({ reason, code }) => {
      if (!isMounted) return
      addLog('error', `اخراج از کلاس: ${reason}`)
      setRemovedCode(code || 'REMOVED')
      setError(reason || 'شما از کلاس خارج شدید')
      cleanup()
    })

    signalingClient.on('room_ended', ({ reason }) => {
      if (!isMounted) return
      addLog('info', `کلاس پایان یافت: ${reason}`)
      setRemovedCode('ROOM_ENDED')
      setError(reason || 'کلاس به پایان رسید')
      cleanup()
    })

    signalingClient.on('teacher_presence', payload => {
      if (!isMounted) return
      setTeacherPresence(payload)
    })

    signalingClient.on('room_timer_sync', payload => {
      if (!isMounted) return
      setRoomTimer(payload)
    })

    signalingClient.on('class_end_warning', payload => {
      if (!isMounted) return
      setEndWarning(payload)
      toast(payload?.message || 'تنها ۵ دقیقه تا پایان کلاس آنلاین باقی مانده است ⏳', {
        icon: '⏳',
        duration: 7000,
      })
    })

    signalingClient.on('recording_state_changed', payload => {
      if (!isMounted || !payload) return
      setRecordingState(payload)
      addLog(
        'info',
        payload.isRecording
          ? `🔴 ضبط کلاس فعال است (${payload.mode === 'manual_test' ? 'حالت تستی دستی' : 'ضبط خودکار'})`
          : '⏹️ ضبط کلاس متوقف و ذخیره شد'
      )
    })

    signalingClient.on('close', () => {
      if (!isMounted) return
      setIsConnected(false)
      addLog('ws', 'ارتباط وب‌سوکت قطع شد؛ در حال تلاش برای اتصال مجدد...')
    })

    signalingClient.on('error', payload => {
      if (!isMounted) return
      const msg = payload?.message || 'خطا در ارتباط'
      addLog('error', `خطای سیگنالینگ: ${msg}`)
      if (
        payload?.code === 'TEACHER_ALREADY_PRESENT' ||
        payload?.code === 'UNAUTHORIZED' ||
        payload?.code === 'ROOM_ENDED' ||
        payload?.code === 'INVALID_TICKET'
      ) {
        setRemovedCode(payload.code)
        setError(msg)
        cleanup()
      }
    })

    // Sequence: 1) Acquire Microphone (& Camera if requested) -> 2) Attach to MeshManager -> 3) Connect Signaling
    const start = async () => {
      const startWithMic = options.initialMicEnabled !== false
      addLog('audio', 'درخواست دسترسی به میکروفون از مرورگر...')
      try {
        const stream = await mediaManager.initLocalAudio(startWithMic)
        await meshManager.setLocalStream(stream)
        if (isMounted) {
          setIsMicEnabled(startWithMic)
        }
        addLog('audio', `دسترسی میکروفون تایید شد (وضعیت اولیه: ${startWithMic ? 'روشن' : 'خاموش'})`)
      } catch (err: any) {
        addLog('error', `هشدار میکروفون: ${err.message} (ورود به صورت شنونده)`)
      }

      if (options.initialCameraEnabled) {
        try {
          const camStream = await mediaManager.initLocalCamera()
          await meshManager.setLocalVideoStream(camStream)
          if (isMounted) {
            setLocalVideoStream(camStream)
            setIsCameraEnabled(true)
          }
          addLog('webrtc', 'دوربین با موفقیت فعال شد 📹')
        } catch (err: any) {
          addLog('error', `هشدار دوربین: ${err.message}`)
        }
      }

      addLog('ws', 'اتصال به سرور وب‌سوکت سیگنالینگ...')
      try {
        await signalingClient.connect({
          roomId: options.roomId,
          token: options.token,
          ticketCode: options.ticketCode,
          displayName: options.displayName,
          requestedRole: options.requestedRole,
          attendeeKey: options.attendeeKey,
          formAnswers: options.formAnswers,
        })
        addLog('ws', 'درخواست ورود به اتاق ارسال شد')
      } catch (err: any) {
        addLog('error', `عدم امکان اتصال اولیه به وب‌سوکت: ${err.message}`)
        if (isMounted) {
          setError('امکان اتصال به سرور سیگنالینگ کلاس وجود ندارد. اتصال اینترنت خود را بررسی کنید.')
        }
      }
    }

    start()

    const cleanup = () => {
      mediaManager.stopAll()
      meshManager.closeAll()
      signalingClient.disconnect()
      if (isMounted) {
        setIsConnected(false)
        setLocalVideoStream(null)
        setIsCameraEnabled(false)
      }
    }

    return () => {
      isMounted = false
      cleanup()
    }
  }, [options.roomId, options.token, options.ticketCode, options.displayName, options.requestedRole, options.initialCameraEnabled, addLog])

  const unlockAudio = useCallback(async () => {
    setIsAutoplayBlocked(false)
    await mediaManagerRef.current?.unlockBrowserAudioContext()
    if (meshManagerRef.current) {
      const ok = await meshManagerRef.current.unlockAudio()
      if (!ok) {
        setIsAutoplayBlocked(true)
      }
    }
  }, [])

  const toggleMicrophone = useCallback(async () => {
    if (isMicBlocked) {
      setError('میکروفون شما توسط معلم مسدود شده است.')
      return
    }

    await unlockAudio()

    const mediaManager = mediaManagerRef.current
    if (!mediaManager) return

    let stream = mediaManager.getLocalStream()
    const nextState = !isMicEnabled

    if (!stream || !mediaManager.getAudioTrack() || mediaManager.getAudioTrack()?.readyState !== 'live') {
      try {
        stream = await mediaManager.initLocalAudio(nextState)
        await meshManagerRef.current?.setLocalStream(stream)
      } catch (err: any) {
        setError(err.message || 'خطا در دسترسی به میکروفون')
        addLog('error', `خطا در فعال‌سازی میکروفون: ${err.message}`)
        return
      }
    } else {
      mediaManager.setMicrophoneEnabled(nextState)
    }

    setIsMicEnabled(nextState)
    addLog('audio', `میکروفون من ${nextState ? 'روشن شد 🎙️' : 'خاموش شد 🔇'}`)

    signalingClientRef.current?.send({
      type: 'set_microphone',
      roomId: options.roomId,
      enabled: nextState,
    })
  }, [isMicEnabled, isMicBlocked, options.roomId, unlockAudio, addLog])

  const toggleCamera = useCallback(async () => {
    await unlockAudio()
    const mediaManager = mediaManagerRef.current
    if (!mediaManager) return

    const nextState = !isCameraEnabled
    if (nextState) {
      try {
        const vStream = await mediaManager.initLocalCamera()
        await meshManagerRef.current?.setLocalVideoStream(vStream)
        setLocalVideoStream(vStream)
        setIsCameraEnabled(true)
        addLog('webrtc', 'دوربین من روشن شد 📹')
        signalingClientRef.current?.send({
          type: 'set_camera',
          roomId: options.roomId,
          enabled: true,
        })
      } catch (err: any) {
        setError(err.message || 'خطا در دسترسی به دوربین')
        addLog('error', `خطا در فعال‌سازی دوربین: ${err.message}`)
      }
    } else {
      mediaManager.stopCamera()
      await meshManagerRef.current?.setLocalVideoStream(null)
      setLocalVideoStream(null)
      setIsCameraEnabled(false)
      addLog('webrtc', 'دوربین من خاموش شد')
      signalingClientRef.current?.send({
        type: 'set_camera',
        roomId: options.roomId,
        enabled: false,
      })
    }
  }, [isCameraEnabled, options.roomId, unlockAudio, addLog])

  const switchCamera = useCallback(async () => {
    await unlockAudio()
    const mediaManager = mediaManagerRef.current
    if (!mediaManager) return

    try {
      const vStream = await mediaManager.switchCameraFacingMode()
      setCameraFacingMode(mediaManager.getFacingMode())
      if (!isScreenSharing) {
        await meshManagerRef.current?.setLocalVideoStream(vStream)
        setLocalVideoStream(vStream)
      }
      setIsCameraEnabled(true)
      addLog(
        'webrtc',
        `دوربین به حالت ${mediaManager.getFacingMode() === 'user' ? 'جلو (سلفی)' : 'عقب'} تغییر یافت 🔄`
      )
      signalingClientRef.current?.send({
        type: 'set_camera',
        roomId: options.roomId,
        enabled: true,
      })
    } catch (err: any) {
      setError(err.message || 'خطا در تغییر جهت دوربین')
      addLog('error', `خطا در تغییر دوربین: ${err.message}`)
    }
  }, [isScreenSharing, options.roomId, unlockAudio, addLog])

  const toggleScreenShare = useCallback(async () => {
    await unlockAudio()
    const mediaManager = mediaManagerRef.current
    if (!mediaManager) return

    const isTeacher = Boolean(self?.isTeacher || self?.role === 'teacher' || self?.role === 'admin' || self?.isModerator)
    if (!isScreenSharing && !isTeacher && !self?.canShareScreen) {
      toast.error('اشتراک صفحه تنها با اجازه دبیر محترم امکان‌پذیر است.')
      return
    }

    if (!isScreenSharing) {
      try {
        const sStream = await mediaManager.startScreenShare(async () => {
          setIsScreenSharing(false)
          signalingClientRef.current?.send({
            type: 'set_screen_share',
            roomId: options.roomId,
            enabled: false,
          })
          if (mediaManager.isCameraEnabled() && mediaManager.getVideoStream()) {
            await meshManagerRef.current?.setLocalVideoStream(mediaManager.getVideoStream())
            setLocalVideoStream(mediaManager.getVideoStream())
          } else {
            await meshManagerRef.current?.setLocalVideoStream(null)
            setLocalVideoStream(null)
          }
        })
        await meshManagerRef.current?.setLocalVideoStream(sStream)
        setLocalVideoStream(sStream)
        setIsScreenSharing(true)
        addLog('webrtc', 'اشتراک‌گذاری صفحه نمایش آغاز شد 🖥️')
        signalingClientRef.current?.send({
          type: 'set_screen_share',
          roomId: options.roomId,
          enabled: true,
        })
      } catch (err: any) {
        addLog('error', `اشتراک صفحه: ${err.message}`)
      }
    } else {
      mediaManager.stopScreenShare()
      setIsScreenSharing(false)
      signalingClientRef.current?.send({
        type: 'set_screen_share',
        roomId: options.roomId,
        enabled: false,
      })
      if (isCameraEnabled && mediaManager.getVideoStream()) {
        await meshManagerRef.current?.setLocalVideoStream(mediaManager.getVideoStream())
        setLocalVideoStream(mediaManager.getVideoStream())
      } else {
        await meshManagerRef.current?.setLocalVideoStream(null)
        setLocalVideoStream(null)
      }
      addLog('webrtc', 'اشتراک‌گذاری صفحه نمایش متوقف شد')
    }
  }, [isScreenSharing, isCameraEnabled, options.roomId, unlockAudio, addLog])

  const sendChatMessage = useCallback(
    (text: string, fileUrl?: string, fileName?: string) => {
      if (!text.trim() && !fileUrl) return
      signalingClientRef.current?.send({
        type: 'chat_message',
        roomId: options.roomId,
        text: text.trim(),
        fileUrl,
        fileName,
      })
    },
    [options.roomId]
  )

  const clearUnreadChat = useCallback(() => {
    setUnreadChatCount(0)
  }, [])

  const teacherMuteParticipant = useCallback(
    (targetPeerId: string) => {
      if (!self?.isTeacher) return
      signalingClientRef.current?.send({
        type: 'teacher_set_permission',
        roomId: options.roomId,
        targetPeerId,
        micBlocked: true,
      })
    },
    [self?.isTeacher, options.roomId]
  )

  const teacherUnblockParticipant = useCallback(
    (targetPeerId: string) => {
      if (!self?.isTeacher) return
      signalingClientRef.current?.send({
        type: 'teacher_set_permission',
        roomId: options.roomId,
        targetPeerId,
        micBlocked: false,
      })
    },
    [self?.isTeacher, options.roomId]
  )

  const teacherRemoveParticipant = useCallback(
    (targetPeerId: string) => {
      if (!self?.isTeacher) return
      signalingClientRef.current?.send({
        type: 'teacher_remove_participant',
        roomId: options.roomId,
        targetPeerId,
      })
    },
    [self?.isTeacher, options.roomId]
  )

  const teacherSetScreenSharePermission = useCallback(
    (targetPeerId: string, allowed: boolean) => {
      if (!self?.isTeacher) return
      signalingClientRef.current?.send({
        type: 'teacher_set_screen_share_permission',
        roomId: options.roomId,
        targetPeerId,
        allowed,
      })
    },
    [self?.isTeacher, options.roomId]
  )

  const teacherEndRoom = useCallback(() => {
    if (!self?.isTeacher) return
    signalingClientRef.current?.send({
      type: 'teacher_end_room',
      roomId: options.roomId,
    })
  }, [self?.isTeacher, options.roomId])

  const sendWhiteboardAction = useCallback(
    (action: string, payload?: any) => {
      signalingClientRef.current?.send({
        type: 'whiteboard_action',
        roomId: options.roomId,
        action,
        payload,
      })
    },
    [options.roomId]
  )

  const startRecording = useCallback(async () => {
    signalingClientRef.current?.send({
      type: 'start_recording',
      roomId: options.roomId,
    })
    try {
      const res = await fetch(
        `/api/classroom/native/rooms/${encodeURIComponent(options.roomId)}/recording/start`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actorName: self?.name || options.displayName || 'کاربر',
            actorRole: self?.role || options.requestedRole || 'teacher',
            peerId: self?.peerId,
            mode: recordingState.isTestRoom ? 'manual_test' : 'auto',
          }),
        }
      )
      const json = await res.json()
      if (json?.success && json?.data) {
        setRecordingState(prev => ({
          ...prev,
          ...json.data,
          isRecording: true,
        }))
      }
    } catch (err: any) {
      addLog('error', `خطا در شروع ضبط: ${err?.message || ''}`)
    }
  }, [options.roomId, options.displayName, options.requestedRole, self, recordingState.isTestRoom, addLog])

  const stopRecording = useCallback(async () => {
    signalingClientRef.current?.send({
      type: 'stop_recording',
      roomId: options.roomId,
    })
    try {
      const res = await fetch(
        `/api/classroom/native/rooms/${encodeURIComponent(options.roomId)}/recording/stop`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actorName: self?.name || options.displayName || 'کاربر',
            actorRole: self?.role || options.requestedRole || 'teacher',
            peerId: self?.peerId,
          }),
        }
      )
      const json = await res.json()
      if (json?.success && json?.data) {
        setRecordingState(prev => ({
          ...prev,
          ...json.data,
          isRecording: false,
        }))
      }
    } catch (err: any) {
      addLog('error', `خطا در پایان ضبط: ${err?.message || ''}`)
    }
  }, [options.roomId, options.displayName, options.requestedRole, self, addLog])

  // Automatic zero-popup classroom compositor (Whiteboard + Videos + Audio -> WebM chunks)
  const roomStateRef = useRef({ room, self, participants, whiteboard })
  useEffect(() => {
    roomStateRef.current = { room, self, participants, whiteboard }
  }, [room, self, participants, whiteboard])

  useEffect(() => {
    if (!isConnected || !recordingState.isRecording) return
    const amRecorder =
      !recordingState.recorderPeerId ||
      (self?.peerId && recordingState.recorderPeerId === self.peerId)
    if (!amRecorder) return

    let active = true
    const offscreen = document.createElement('canvas')
    offscreen.width = 1280
    offscreen.height = 720
    const ctx = offscreen.getContext('2d')

    const drawFrame = () => {
      if (!active || !ctx) return
      const snap = roomStateRef.current
      ctx.fillStyle = CLASSROOM_RECORDING_THEME.canvasBgColor
      ctx.fillRect(0, 0, 1280, 720)

      // Top header bar
      ctx.fillStyle = CLASSROOM_RECORDING_THEME.canvasHeaderBg
      ctx.fillRect(0, 0, 1280, 52)
      ctx.fillStyle = CLASSROOM_RECORDING_THEME.canvasAccentRed
      ctx.beginPath()
      ctx.arc(1248, 26, 7, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = CLASSROOM_RECORDING_THEME.canvasTextLight
      ctx.font = CLASSROOM_RECORDING_THEME.canvasTitleFont
      ctx.textAlign = 'right'
      ctx.fillText(snap.room?.title || `کلاس آنلاین (${options.roomId})`, 1228, 32)

      ctx.fillStyle = CLASSROOM_RECORDING_THEME.canvasTextMuted
      ctx.font = CLASSROOM_RECORDING_THEME.canvasSubFont
      ctx.textAlign = 'left'
      const allMembers = snap.self ? [snap.self, ...snap.participants] : snap.participants
      ctx.fillText(
        `REC • ${new Date().toLocaleTimeString('fa-IR')} • حاضرین: ${allMembers.length} نفر • اسلاید ${
          snap.whiteboard.currentPage || 1
        }`,
        20,
        31
      )

      // Draw Whiteboard Canvas (left/main area 940x648)
      ctx.fillStyle = CLASSROOM_RECORDING_THEME.canvasBoardBg
      ctx.fillRect(16, 62, 940, 642)
      const boardCanvas = document.querySelector(
        'canvas[data-classroom-whiteboard="true"]'
      ) as HTMLCanvasElement | null
      const fallbackCanvas =
        boardCanvas || (document.querySelector('canvas') as HTMLCanvasElement | null)
      if (fallbackCanvas && fallbackCanvas.width > 0 && fallbackCanvas.height > 0) {
        try {
          ctx.drawImage(fallbackCanvas, 16, 62, 940, 642)
        } catch {}
      }

      // Draw Participant Cameras & Status Pod (right area 296x642)
      ctx.fillStyle = CLASSROOM_RECORDING_THEME.canvasHeaderBg
      ctx.fillRect(968, 62, 296, 642)

      const videoEls = Array.from(document.querySelectorAll('video')).filter(
        v => v.readyState >= 2 && v.videoWidth > 0
      )
      let yCursor = 74
      for (let i = 0; i < Math.min(videoEls.length, 2); i++) {
        try {
          ctx.drawImage(videoEls[i], 980, yCursor, 272, 168)
          yCursor += 180
        } catch {}
      }

      // Participant list in sidebar
      ctx.fillStyle = CLASSROOM_RECORDING_THEME.canvasTextLight
      ctx.font = CLASSROOM_RECORDING_THEME.canvasFont
      ctx.textAlign = 'right'
      ctx.fillText(`لیست حاضرین در کلاس (${allMembers.length}):`, 1250, yCursor + 20)
      yCursor += 44
      for (const member of allMembers.slice(0, 10)) {
        ctx.fillStyle =
          member.micState === 'enabled'
            ? CLASSROOM_RECORDING_THEME.canvasAccentEmerald
            : CLASSROOM_RECORDING_THEME.canvasTextMuted
        const roleTag = member.role === 'teacher' ? '[استاد]' : '[دانش‌آموز]'
        const micTag = member.micState === 'enabled' ? '🎙️' : '🔇'
        ctx.fillText(`${micTag} ${member.name} ${roleTag}`, 1248, yCursor)
        yCursor += 26
      }
    }

    drawFrame()
    const frameInterval = window.setInterval(drawFrame, 1000 / 12)

    let recorder: MediaRecorder | null = null
    let audioCtx: AudioContext | null = null

    try {
      const canvasStream = (offscreen as any).captureStream
        ? offscreen.captureStream(12)
        : null
      if (canvasStream && typeof MediaRecorder !== 'undefined') {
        const combinedTracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()]
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
          if (AudioContextClass) {
            audioCtx = new AudioContextClass()
            const dest = audioCtx.createMediaStreamDestination()
            const localAudio = mediaManagerRef.current?.getLocalStream()
            if (localAudio && localAudio.getAudioTracks().length > 0) {
              const src = audioCtx.createMediaStreamSource(localAudio)
              src.connect(dest)
            }
            const audioEls = Array.from(document.querySelectorAll('audio'))
            for (const el of audioEls) {
              const s = (el as any).srcObject as MediaStream | null
              if (s && s.getAudioTracks().length > 0) {
                try {
                  const rSrc = audioCtx.createMediaStreamSource(s)
                  rSrc.connect(dest)
                } catch {}
              }
            }
            if (dest.stream.getAudioTracks().length > 0) {
              combinedTracks.push(dest.stream.getAudioTracks()[0])
            }
          }
        } catch {}

        const mixedStream = new MediaStream(combinedTracks)
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
          ? 'video/webm;codecs=vp8,opus'
          : MediaRecorder.isTypeSupported('video/webm')
            ? 'video/webm'
            : ''
        recorder = mimeType
          ? new MediaRecorder(mixedStream, { mimeType, videoBitsPerSecond: 650_000 })
          : new MediaRecorder(mixedStream)

        recorder.ondataavailable = async ev => {
          if (!ev.data || ev.data.size === 0) return
          try {
            const buf = await ev.data.arrayBuffer()
            const res = await fetch(
              `/api/classroom/native/rooms/${encodeURIComponent(options.roomId)}/recording/chunk`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/octet-stream' },
                body: buf,
              }
            )
            const json = await res.json()
            if (json?.success && json?.data) {
              setRecordingState(prev => ({
                ...prev,
                chunksCount: json.data.chunksCount ?? prev.chunksCount + 1,
                fileSize: json.data.fileSize ?? prev.fileSize,
                videoUrl: json.data.videoUrl || prev.videoUrl,
              }))
            }
          } catch {}
        }

        recorder.start(4000)
      }
    } catch (err: any) {
      addLog('error', `خطا در راه‌اندازی ضبط ویدیو: ${err?.message || ''}`)
    }

    return () => {
      active = false
      window.clearInterval(frameInterval)
      if (recorder && recorder.state !== 'inactive') {
        try {
          recorder.stop()
        } catch {}
      }
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {})
      }
    }
  }, [isConnected, recordingState.isRecording, recordingState.recorderPeerId, self?.peerId, options.roomId, addLog])

  const toggleHandRaise = useCallback(
    (raised?: boolean) => {
      const next = typeof raised === 'boolean' ? raised : !self?.handRaised
      signalingClientRef.current?.send({
        type: 'raise_hand',
        roomId: options.roomId,
        enabled: next,
      })
    },
    [options.roomId, self?.handRaised]
  )

  const grantSpeaker = useCallback(
    (targetPeerId: string) => {
      signalingClientRef.current?.send({
        type: 'grant_speaker',
        roomId: options.roomId,
        targetPeerId,
      })
    },
    [options.roomId]
  )

  const revokeSpeaker = useCallback(
    (targetPeerId: string) => {
      signalingClientRef.current?.send({
        type: 'revoke_speaker',
        roomId: options.roomId,
        targetPeerId,
      })
    },
    [options.roomId]
  )

  const grantModerator = useCallback(
    (targetPeerId: string) => {
      signalingClientRef.current?.send({
        type: 'grant_moderator',
        roomId: options.roomId,
        targetPeerId,
      })
    },
    [options.roomId]
  )

  const revokeModerator = useCallback(
    (targetPeerId: string) => {
      signalingClientRef.current?.send({
        type: 'revoke_moderator',
        roomId: options.roomId,
        targetPeerId,
      })
    },
    [options.roomId]
  )

  const createPoll = useCallback(
    (payload: { question: string; options: string[]; allowMultiple?: boolean }) => {
      signalingClientRef.current?.send({
        type: 'create_poll',
        roomId: options.roomId,
        payload,
      })
    },
    [options.roomId]
  )

  const votePoll = useCallback(
    (pollId: string, optionIds: string[]) => {
      signalingClientRef.current?.send({
        type: 'vote_poll',
        roomId: options.roomId,
        payload: { pollId, optionIds },
      })
    },
    [options.roomId]
  )

  const closePoll = useCallback(
    (pollId: string) => {
      signalingClientRef.current?.send({
        type: 'close_poll',
        roomId: options.roomId,
        payload: { pollId },
      })
    },
    [options.roomId]
  )

  const leaveRoom = useCallback(() => {
    signalingClientRef.current?.send({
      type: 'leave_room',
      roomId: options.roomId,
    })
    mediaManagerRef.current?.stopAll()
    meshManagerRef.current?.closeAll()
    signalingClientRef.current?.disconnect()
    setIsConnected(false)
    setLocalVideoStream(null)
    setIsCameraEnabled(false)
    setIsScreenSharing(false)
  }, [options.roomId])

  return {
    isConnected,
    isMicEnabled,
    isMicBlocked,
    isCameraEnabled,
    cameraFacingMode,
    isScreenSharing,
    localVideoStream,
    remoteVideoStreams,
    isAutoplayBlocked,
    participants,
    self,
    room,
    error,
    setError,
    removedCode,
    whiteboard,
    setWhiteboard,
    remoteLaser,
    remoteDraftElement,
    chatMessages,
    unreadChatCount,
    clearUnreadChat,
    polls,
    seminarAttendees,
    sendChatMessage,
    sendWhiteboardAction,
    diagnosticLogs,
    peersDiagnostics,
    unlockAudio,
    toggleMicrophone,
    toggleCamera,
    switchCamera,
    toggleScreenShare,
    teacherMuteParticipant,
    teacherUnblockParticipant,
    teacherRemoveParticipant,
    teacherSetScreenSharePermission,
    teacherEndRoom,
    recordingState,
    startRecording,
    stopRecording,
    teacherPresence,
    roomTimer,
    endWarning,
    toggleHandRaise,
    grantSpeaker,
    revokeSpeaker,
    grantModerator,
    revokeModerator,
    createPoll,
    votePoll,
    closePoll,
    leaveRoom,
  }
}