import type { SignalingIceServer } from './types'

export interface PeerDiagnosticsInfo {
  peerId: string
  iceConnectionState: RTCIceConnectionState
  connectionState: RTCPeerConnectionState
  hasRemoteAudio: boolean
  hasRemoteVideo?: boolean
  audioPlaying: boolean
  localCandidateType?: string
  remoteCandidateType?: string
}

interface PeerEntry {
  peerId: string
  pc: RTCPeerConnection
  audioTransceiver: RTCRtpTransceiver | null
  videoTransceiver: RTCRtpTransceiver | null
  remoteStream: MediaStream
  remoteVideoStream: MediaStream
  audioElement: HTMLAudioElement
  pendingCandidates: RTCIceCandidateInit[]
  makingOffer: boolean
  ignoreOffer: boolean
  isSettingRemoteAnswerPending: boolean
  hasRemoteAudio: boolean
  hasRemoteVideo: boolean
  audioPlaying: boolean
  localCandidateType?: string
  remoteCandidateType?: string
  reconnectTimer?: any
}

export class NativeMeshPeerManager {
  private peers = new Map<string, PeerEntry>()
  private selfPeerId: string = ''
  private iceServers: RTCIceServer[] = [
    { urls: 'stun:193.242.208.157:3478' },
    { urls: 'stun:turn.kitayar.ir:3478' },
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: [
        'turn:193.242.208.157:3478?transport=udp',
        'turn:193.242.208.157:3478?transport=tcp',
        'turn:turn.kitayar.ir:3478?transport=udp',
        'turn:turn.kitayar.ir:3478?transport=tcp',
        'turns:turn.kitayar.ir:5349?transport=tcp',
      ],
      username: 'kitayar',
      credential: 'KitayarTurnSecure2026!',
    },
  ]
  private localStream: MediaStream | null = null
  private localVideoStream: MediaStream | null = null

  public onLog?: (category: 'webrtc' | 'ice' | 'audio' | 'error', message: string) => void
  public onPeerStateChange?: (peerId: string, info: PeerDiagnosticsInfo) => void
  public onRemoteVideoStreamChange?: (peerId: string, stream: MediaStream | null) => void
  public onAutoplayBlocked?: (peerId: string) => void

  constructor(
    private sendSignal: (
      type: 'offer' | 'answer' | 'ice_candidate',
      targetPeerId: string,
      payload: any
    ) => void,
    private onRemoteStreamReceived?: (peerId: string, stream: MediaStream) => void
  ) {}

  private log(category: 'webrtc' | 'ice' | 'audio' | 'error', message: string) {
    if (this.onLog) {
      this.onLog(category, message)
    }
    console.log(`[MeshPeerManager:${category}] ${message}`)
  }

  setSelfPeerId(peerId: string) {
    this.selfPeerId = peerId
  }

  /**
   * Determine if we are the "polite" peer in Perfect Negotiation
   * (Lexicographically smaller peerId is polite, larger is impolite)
   */
  private isPoliteWith(remotePeerId: string): boolean {
    if (!this.selfPeerId) return true
    return this.selfPeerId < remotePeerId
  }

  setIceServers(servers: SignalingIceServer[]) {
    if (servers && servers.length > 0) {
      this.iceServers = servers.map(s => ({
        urls: s.urls,
        username: s.username,
        credential: s.credential,
      }))
      this.log('ice', `سرورهای ICE تنظیم شدند (${this.iceServers.length} سرور)`)
    }
  }

  async setLocalStream(stream: MediaStream | null) {
    this.localStream = stream
    const audioTrack = stream ? stream.getAudioTracks()[0] || null : null

    if (audioTrack) {
      this.log(
        'audio',
        `ترک میکروفون آماده شد: ${audioTrack.label || 'Default Mic'} (وضعیت: ${
          audioTrack.enabled ? 'روشن' : 'خاموش'
        })`
      )
    }

    for (const [peerId, entry] of this.peers.entries()) {
      await this.attachLocalTrackToPeer(entry, audioTrack)
    }
  }

  private async attachLocalTrackToPeer(entry: PeerEntry, audioTrack: MediaStreamTrack | null) {
    try {
      const { pc, peerId } = entry
      const audioTransceivers = pc
        .getTransceivers()
        .filter(t => t.receiver?.track?.kind === 'audio' || t.sender?.track?.kind === 'audio')

      // Prefer the transceiver associated with a negotiated m-line (mid !== null)
      const activeTransceiver =
        audioTransceivers.find(t => t.mid !== null) ||
        entry.audioTransceiver ||
        audioTransceivers[0] ||
        null

      if (activeTransceiver) {
        entry.audioTransceiver = activeTransceiver
        for (const t of audioTransceivers) {
          if (t.direction !== 'sendrecv') {
            try {
              t.direction = 'sendrecv'
            } catch (e) {}
          }
          if (t.sender && t.sender.track !== audioTrack) {
            await t.sender.replaceTrack(audioTrack)
          }
        }
        this.log(
          'audio',
          `ترک میکروفون روی کانال ${peerId} متصل شد (mid=${activeTransceiver.mid ?? 'pending'}, وضعیت: ${
            audioTrack ? (audioTrack.enabled ? 'روشن' : 'خاموش') : 'بدون میکروفون'
          })`
        )
      } else if (audioTrack && this.localStream) {
        const sender = pc.addTrack(audioTrack, this.localStream)
        entry.audioTransceiver = pc.getTransceivers().find(t => t.sender === sender) || null
        if (entry.audioTransceiver && entry.audioTransceiver.direction !== 'sendrecv') {
          try {
            entry.audioTransceiver.direction = 'sendrecv'
          } catch (e) {}
        }
        this.log('audio', `ترک صوتی جدید به کاربر ${peerId} اضافه شد`)
      }
    } catch (err: any) {
      this.log('error', `خطا در اتصال ترک میکروفون برای ${entry.peerId}: ${err.message}`)
    }
  }

  async setLocalVideoStream(stream: MediaStream | null) {
    this.localVideoStream = stream
    const videoTrack = stream ? stream.getVideoTracks()[0] || null : null

    if (videoTrack) {
      this.log('webrtc', `دوربین آماده شد: ${videoTrack.label || 'Camera'}`)
    } else {
      this.log('webrtc', `ارسال تصویر دوربین متوقف شد`)
    }

    for (const [, entry] of this.peers.entries()) {
      await this.attachLocalVideoTrackToPeer(entry, videoTrack, true)
    }
  }

  private async attachLocalVideoTrackToPeer(
    entry: PeerEntry,
    videoTrack: MediaStreamTrack | null,
    allowRenegotiate = false
  ) {
    try {
      const { pc, peerId } = entry
      const videoTransceivers = pc
        .getTransceivers()
        .filter(t => t.receiver?.track?.kind === 'video' || t.sender?.track?.kind === 'video')

      const activeTransceiver =
        videoTransceivers.find(t => t.mid !== null) ||
        entry.videoTransceiver ||
        videoTransceivers[0] ||
        null

      if (activeTransceiver) {
        entry.videoTransceiver = activeTransceiver
        for (const t of videoTransceivers) {
          if (t.direction !== 'sendrecv') {
            try {
              t.direction = 'sendrecv'
            } catch (e) {}
          }
          if (t.sender && t.sender.track !== videoTrack) {
            await t.sender.replaceTrack(videoTrack)
          }
        }
        if (
          allowRenegotiate &&
          videoTrack &&
          activeTransceiver.currentDirection !== 'sendrecv' &&
          pc.signalingState === 'stable'
        ) {
          await this.createOfferForPeer(peerId)
        }
      } else if (videoTrack && this.localVideoStream) {
        const sender = pc.addTrack(videoTrack, this.localVideoStream)
        entry.videoTransceiver = pc.getTransceivers().find(t => t.sender === sender) || null
        if (entry.videoTransceiver && entry.videoTransceiver.direction !== 'sendrecv') {
          try {
            entry.videoTransceiver.direction = 'sendrecv'
          } catch (e) {}
        }
        if (allowRenegotiate && pc.signalingState === 'stable') {
          await this.createOfferForPeer(peerId)
        }
      }
    } catch (err: any) {
      this.log('error', `خطا در اتصال تصویر برای ${entry.peerId}: ${err.message}`)
    }
  }

  private getOrCreatePeer(peerId: string): PeerEntry {
    const existing = this.peers.get(peerId)
    if (existing) return existing

    this.log('webrtc', `ایجاد کانال ارتباطی جدید برای کاربر ${peerId}`)

    const pc = new RTCPeerConnection({
      iceServers: this.iceServers,
      iceTransportPolicy: 'all',
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
      iceCandidatePoolSize: 4,
    })

    const localAudioTrack = this.localStream ? this.localStream.getAudioTracks()[0] || null : null
    let audioTransceiver: RTCRtpTransceiver | null = null
    const videoTransceiver: RTCRtpTransceiver | null = null

    // Use addTrack (not addTransceiver) so WebRTC JSEP matches this transceiver when receiving a remote Offer
    if (localAudioTrack && this.localStream) {
      try {
        const sender = pc.addTrack(localAudioTrack, this.localStream)
        audioTransceiver = pc.getTransceivers().find(t => t.sender === sender) || null
        if (audioTransceiver && audioTransceiver.direction !== 'sendrecv') {
          audioTransceiver.direction = 'sendrecv'
        }
      } catch (err) {}
    }

    const remoteStream = new MediaStream()
    const remoteVideoStream = new MediaStream()

    // Create audio element (Avoid display:none so mobile browsers don't suspend playback)
    const audioElement = document.createElement('audio')
    audioElement.id = `kitayar-remote-audio-${peerId}`
    audioElement.autoplay = true
    audioElement.playsInline = true
    audioElement.controls = false
    audioElement.muted = false
    audioElement.volume = 1.0
    audioElement.style.position = 'fixed'
    audioElement.style.left = '-9999px'
    audioElement.style.top = '-9999px'
    audioElement.style.width = '1px'
    audioElement.style.height = '1px'
    audioElement.style.opacity = '0.01'
    audioElement.style.pointerEvents = 'none'
    document.body.appendChild(audioElement)

    const entry: PeerEntry = {
      peerId,
      pc,
      audioTransceiver,
      videoTransceiver,
      remoteStream,
      remoteVideoStream,
      audioElement,
      pendingCandidates: [],
      makingOffer: false,
      ignoreOffer: false,
      isSettingRemoteAnswerPending: false,
      hasRemoteAudio: false,
      hasRemoteVideo: false,
      audioPlaying: false,
    }

    // Handle incoming audio & video tracks
    pc.ontrack = event => {
      const track = event.track
      this.log(
        track.kind === 'video' ? 'webrtc' : 'audio',
        `دریافت ترک ${track.kind === 'video' ? 'تصویری 📹' : 'صوتی 🔊'} از ${peerId} (وضعیت: ${track.readyState})`
      )

      if (track.kind === 'audio') {
        entry.hasRemoteAudio = true

        // Clean existing tracks if replaced
        remoteStream.getAudioTracks().forEach(oldTrack => {
          if (oldTrack.id !== track.id) {
            remoteStream.removeTrack(oldTrack)
          }
        })

        if (!remoteStream.getTracks().some(t => t.id === track.id)) {
          remoteStream.addTrack(track)
        }

        track.onunmute = () => {
          this.log('audio', `جریان صوتی کاربر ${peerId} فعال شد (unmuted)`)
          if (entry.audioElement) {
            entry.audioElement.srcObject = null
            entry.audioElement.srcObject = remoteStream
          }
          this.tryPlayPeerAudio(entry)
        }

        this.tryPlayPeerAudio(entry)

        if (this.onRemoteStreamReceived) {
          this.onRemoteStreamReceived(peerId, remoteStream)
        }
        this.emitPeerState(entry)
      } else if (track.kind === 'video') {
        remoteVideoStream.getVideoTracks().forEach(oldTrack => {
          if (oldTrack.id !== track.id) {
            remoteVideoStream.removeTrack(oldTrack)
          }
        })

        if (!remoteVideoStream.getTracks().some(t => t.id === track.id)) {
          remoteVideoStream.addTrack(track)
        }

        const notifyVideoActive = () => {
          entry.hasRemoteVideo = true
          if (this.onRemoteVideoStreamChange) {
            this.onRemoteVideoStreamChange(peerId, new MediaStream([track]))
          }
          this.emitPeerState(entry)
        }

        track.onunmute = () => {
          this.log('webrtc', `تصویر دوربین کاربر ${peerId} دریافت شد 📹`)
          notifyVideoActive()
        }

        track.onmute = () => {
          entry.hasRemoteVideo = false
          if (this.onRemoteVideoStreamChange) {
            this.onRemoteVideoStreamChange(peerId, null)
          }
          this.emitPeerState(entry)
        }

        track.onended = () => {
          entry.hasRemoteVideo = false
          if (this.onRemoteVideoStreamChange) {
            this.onRemoteVideoStreamChange(peerId, null)
          }
          this.emitPeerState(entry)
        }

        if (!track.muted && track.readyState === 'live') {
          notifyVideoActive()
        }
      }
    }

    // Handle ICE candidates
    pc.onicecandidate = event => {
      if (event.candidate) {
        const cand = event.candidate
        entry.localCandidateType = cand.type || entry.localCandidateType
        this.log(
          'ice',
          `کاندیدای محلی ${cand.type || 'unknown'} (${cand.protocol || 'udp'}) برای ${peerId} ارسال شد`
        )
        this.sendSignal('ice_candidate', peerId, { candidate: cand.toJSON() })
      }
    }

    // Handle ICE Connection state transitions & Auto-healing
    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState
      this.log('ice', `وضعیت ICE کاربر ${peerId}: ${state}`)

      if (entry.reconnectTimer) {
        clearTimeout(entry.reconnectTimer)
        entry.reconnectTimer = null
      }

      if (state === 'connected' || state === 'completed') {
        this.tryPlayPeerAudio(entry)
      } else if (state === 'disconnected') {
        // Only one side (impolite or polite) triggers ICE restart after 3.5s if still disconnected
        entry.reconnectTimer = setTimeout(() => {
          if (
            pc.iceConnectionState === 'disconnected' ||
            pc.iceConnectionState === 'failed'
          ) {
            this.log('ice', `تلاش برای بازیابی خودکار ارتباط با ${peerId} (ICE Restart)...`)
            this.createOfferForPeer(peerId, true)
          }
        }, 3500)
      } else if (state === 'failed') {
        this.log('error', `ارتباط ICE با ${peerId} دچار خطا شد؛ اجرای مجدد ICE Restart...`)
        this.createOfferForPeer(peerId, true)
      }

      this.emitPeerState(entry)
    }

    pc.onconnectionstatechange = () => {
      this.log('webrtc', `وضعیت اتصال P2P کاربر ${peerId}: ${pc.connectionState}`)
      if (pc.connectionState === 'connected') {
        this.tryPlayPeerAudio(entry)
      }
      this.emitPeerState(entry)
    }

    this.peers.set(peerId, entry)
    this.emitPeerState(entry)
    return entry
  }

  private tryPlayPeerAudio(entry: PeerEntry) {
    const { audioElement, remoteStream, peerId } = entry
    if (!audioElement) return

    if (audioElement.srcObject !== remoteStream) {
      audioElement.srcObject = remoteStream
    }
    audioElement.muted = false
    audioElement.volume = 1.0

    const playPromise = audioElement.play()
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          entry.audioPlaying = true
          this.log('audio', `🔊 پخش صدای کاربر ${peerId} با موفقیت فعال است`)
          this.emitPeerState(entry)
        })
        .catch(err => {
          entry.audioPlaying = false
          this.log(
            'error',
            `پخش خودکار صدا برای ${peerId} متوقف شد (نیاز به کلیک کاربر): ${err.message}`
          )
          if (this.onAutoplayBlocked) {
            this.onAutoplayBlocked(peerId)
          }
          this.emitPeerState(entry)
        })
    }
  }

  private emitPeerState(entry: PeerEntry) {
    if (this.onPeerStateChange) {
      this.onPeerStateChange(entry.peerId, {
        peerId: entry.peerId,
        iceConnectionState: entry.pc.iceConnectionState,
        connectionState: entry.pc.connectionState,
        hasRemoteAudio: entry.hasRemoteAudio,
        audioPlaying: entry.audioPlaying,
        localCandidateType: entry.localCandidateType,
        remoteCandidateType: entry.remoteCandidateType,
      })
    }
  }

  /**
   * Unlock all remote audio elements on user gesture
   */
  async unlockAudio(): Promise<boolean> {
    let allSuccess = true
    for (const entry of this.peers.values()) {
      if (entry.audioElement) {
        try {
          if (entry.audioElement.srcObject !== entry.remoteStream) {
            entry.audioElement.srcObject = entry.remoteStream
          }
          entry.audioElement.muted = false
          entry.audioElement.volume = 1.0
          await entry.audioElement.play()
          entry.audioPlaying = true
          this.emitPeerState(entry)
        } catch (e) {
          allSuccess = false
        }
      }
    }
    this.log('audio', 'بازگشایی دستی خروجی صدای مرورگر انجام شد')
    return allSuccess
  }

  /**
   * Initiate WebRTC Offer towards target peer
   */
  async createOfferForPeer(targetPeerId: string, restartIce = false) {
    const entry = this.getOrCreatePeer(targetPeerId)
    if (entry.makingOffer) return

    try {
      entry.makingOffer = true
      const localAudioTrack = this.localStream ? this.localStream.getAudioTracks()[0] || null : null
      const localVideoTrack = this.localVideoStream
        ? this.localVideoStream.getVideoTracks()[0] || null
        : null

      const hasAudioTransceiver = entry.pc
        .getTransceivers()
        .some(t => t.receiver?.track?.kind === 'audio' || t.sender?.track?.kind === 'audio')
      if (!hasAudioTransceiver) {
        entry.audioTransceiver = entry.pc.addTransceiver('audio', {
          direction: 'sendrecv',
        })
      }

      const hasVideoTransceiver = entry.pc
        .getTransceivers()
        .some(t => t.receiver?.track?.kind === 'video' || t.sender?.track?.kind === 'video')
      if (!hasVideoTransceiver) {
        entry.videoTransceiver = entry.pc.addTransceiver('video', {
          direction: 'sendrecv',
        })
      }

      await this.attachLocalTrackToPeer(entry, localAudioTrack)
      await this.attachLocalVideoTrackToPeer(entry, localVideoTrack, false)

      this.log(
        'webrtc',
        `ارسال Offer برای ${targetPeerId}${restartIce ? ' (ICE Restart)' : ''}`
      )

      const offer = await entry.pc.createOffer({
        iceRestart: restartIce,
      })

      if (entry.pc.signalingState !== 'stable' && !restartIce) {
        return
      }

      await entry.pc.setLocalDescription(offer)
      this.sendSignal('offer', targetPeerId, { sdp: entry.pc.localDescription })
    } catch (err: any) {
      this.log('error', `خطا در ایجاد Offer برای ${targetPeerId}: ${err.message}`)
    } finally {
      entry.makingOffer = false
    }
  }

  /**
   * Handle incoming Offer with Perfect Negotiation (Collision/Glare resolution)
   */
  async handleRemoteOffer(fromPeerId: string, sdp: RTCSessionDescriptionInit) {
    const entry = this.getOrCreatePeer(fromPeerId)
    const { pc } = entry
    const polite = this.isPoliteWith(fromPeerId)

    try {
      const offerCollision =
        entry.makingOffer ||
        pc.signalingState !== 'stable' ||
        entry.isSettingRemoteAnswerPending

      entry.ignoreOffer = !polite && offerCollision
      if (entry.ignoreOffer) {
        this.log(
          'webrtc',
          `چشم‌پوشی از Offer همزمان از ${fromPeerId} (جلوگیری از تداخل Glare)`
        )
        return
      }

      this.log('webrtc', `دریافت و اعمال Offer از کاربر ${fromPeerId}`)

      if (offerCollision) {
        // Polite peer rolls back its local offer to accept remote offer
        await Promise.all([
          pc.setLocalDescription({ type: 'rollback' }),
          pc.setRemoteDescription(new RTCSessionDescription(sdp)),
        ])
      } else {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp))
      }

      // Ensure local audio & video tracks are attached and transceivers are set to sendrecv before creating Answer
      const localAudioTrack = this.localStream ? this.localStream.getAudioTracks()[0] || null : null
      const localVideoTrack = this.localVideoStream
        ? this.localVideoStream.getVideoTracks()[0] || null
        : null
      await this.attachLocalTrackToPeer(entry, localAudioTrack)
      await this.attachLocalVideoTrackToPeer(entry, localVideoTrack, false)

      pc.getTransceivers().forEach(t => {
        if (
          (t.receiver.track.kind === 'audio' || t.receiver.track.kind === 'video') &&
          t.direction !== 'sendrecv'
        ) {
          try {
            t.direction = 'sendrecv'
          } catch (e) {}
        }
      })

      await this.flushPendingCandidates(entry)

      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      this.log('webrtc', `ارسال Answer به کاربر ${fromPeerId}`)
      this.sendSignal('answer', fromPeerId, { sdp: pc.localDescription })
    } catch (err: any) {
      this.log('error', `خطا در پردازش Offer از ${fromPeerId}: ${err.message}`)
    }
  }

  /**
   * Handle incoming Answer
   */
  async handleRemoteAnswer(fromPeerId: string, sdp: RTCSessionDescriptionInit) {
    const entry = this.peers.get(fromPeerId)
    if (!entry) return

    try {
      if (entry.pc.signalingState !== 'have-local-offer') {
        this.log(
          'webrtc',
          `چشم‌پوشی از Answer تکراری از ${fromPeerId} در وضعیت ${entry.pc.signalingState}`
        )
        return
      }

      entry.isSettingRemoteAnswerPending = true
      this.log('webrtc', `دریافت و ثبت Answer از کاربر ${fromPeerId}`)
      await entry.pc.setRemoteDescription(new RTCSessionDescription(sdp))
      entry.isSettingRemoteAnswerPending = false

      await this.flushPendingCandidates(entry)
    } catch (err: any) {
      entry.isSettingRemoteAnswerPending = false
      this.log('error', `خطا در ثبت Answer از ${fromPeerId}: ${err.message}`)
    }
  }

  /**
   * Handle incoming ICE Candidate
   */
  async handleRemoteCandidate(fromPeerId: string, candidate: RTCIceCandidateInit) {
    const entry = this.getOrCreatePeer(fromPeerId)
    try {
      if (entry.ignoreOffer) return

      if (entry.pc.remoteDescription && entry.pc.remoteDescription.type) {
        await entry.pc.addIceCandidate(new RTCIceCandidate(candidate))
        this.extractRemoteCandidateType(entry, candidate)
      } else {
        entry.pendingCandidates.push(candidate)
      }
    } catch (err: any) {
      if (!entry.ignoreOffer) {
        this.log('ice', `خطای جزئی در افزودن ICE candidate از ${fromPeerId}: ${err.message}`)
      }
    }
  }

  private extractRemoteCandidateType(entry: PeerEntry, candidate: RTCIceCandidateInit) {
    if (candidate && candidate.candidate) {
      const match = candidate.candidate.match(/typ\s+([a-zA-Z]+)/)
      if (match && match[1]) {
        entry.remoteCandidateType = match[1]
        this.emitPeerState(entry)
      }
    }
  }

  private async flushPendingCandidates(entry: PeerEntry) {
    while (entry.pendingCandidates.length > 0) {
      const cand = entry.pendingCandidates.shift()
      if (cand) {
        try {
          await entry.pc.addIceCandidate(new RTCIceCandidate(cand))
          this.extractRemoteCandidateType(entry, cand)
        } catch (err) {}
      }
    }
  }

  getPeerDiagnostics(): PeerDiagnosticsInfo[] {
    const list: PeerDiagnosticsInfo[] = []
    this.peers.forEach(entry => {
      list.push({
        peerId: entry.peerId,
        iceConnectionState: entry.pc.iceConnectionState,
        connectionState: entry.pc.connectionState,
        hasRemoteAudio: entry.hasRemoteAudio,
        audioPlaying: entry.audioPlaying,
        localCandidateType: entry.localCandidateType,
        remoteCandidateType: entry.remoteCandidateType,
      })
    })
    return list
  }

  removePeer(peerId: string) {
    const entry = this.peers.get(peerId)
    if (entry) {
      this.log('webrtc', `بستن اتصال کاربر ${peerId}`)
      if (entry.reconnectTimer) {
        clearTimeout(entry.reconnectTimer)
      }
      try {
        entry.pc.ontrack = null
        entry.pc.onicecandidate = null
        entry.pc.oniceconnectionstatechange = null
        entry.pc.onconnectionstatechange = null
        entry.pc.close()
      } catch (e) {}

      if (entry.audioElement) {
        try {
          entry.audioElement.pause()
          entry.audioElement.srcObject = null
          if (entry.audioElement.parentNode) {
            entry.audioElement.parentNode.removeChild(entry.audioElement)
          }
        } catch (e) {}
      }
      this.peers.delete(peerId)
    }
  }

  closeAll() {
    Array.from(this.peers.keys()).forEach(peerId => {
      this.removePeer(peerId)
    })
    this.peers.clear()
  }
}