/**
 * Pure Web API Audio Media Manager
 * Handles microphone capture, WebAudio unlock for mobile browsers,
 * audio constraints, and track state without external dependencies.
 */
export class NativeAudioMediaManager {
  private localStream: MediaStream | null = null
  private audioTrack: MediaStreamTrack | null = null
  private videoStream: MediaStream | null = null
  private videoTrack: MediaStreamTrack | null = null
  private screenStream: MediaStream | null = null
  private screenTrack: MediaStreamTrack | null = null
  private currentFacingMode: 'user' | 'environment' = 'user'
  private currentDeviceId: string | undefined = undefined
  private audioContext: AudioContext | null = null

  public static readonly AUDIO_CONSTRAINTS: MediaStreamConstraints = {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      channelCount: 1,
      sampleRate: 48000,
    },
    video: false,
  }

  public static readonly VIDEO_CONSTRAINTS: MediaStreamConstraints = {
    video: {
      width: { ideal: 640, max: 640 },
      height: { ideal: 480, max: 480 },
      frameRate: { ideal: 20, max: 24 },
      facingMode: 'user',
    },
    audio: false,
  }

  /**
   * Unlock browser Web Audio API on user gesture (critical for iOS Safari & Chrome Mobile)
   */
  async unlockBrowserAudioContext(): Promise<void> {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return

      if (!this.audioContext) {
        this.audioContext = new AudioCtx()
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      // Play a tiny silent buffer to force-unlock hardware audio output on mobile
      const buffer = this.audioContext.createBuffer(1, 1, 22050)
      const source = this.audioContext.createBufferSource()
      source.buffer = buffer
      source.connect(this.audioContext.destination)
      source.start(0)
    } catch (e) {
      // Ignore audio context errors
    }
  }

  /**
   * Request microphone access and prepare the local audio track
   */
  async initLocalAudio(initialEnabled = false): Promise<MediaStream> {
    await this.unlockBrowserAudioContext()

    if (this.localStream && this.audioTrack && this.audioTrack.readyState === 'live') {
      this.audioTrack.enabled = initialEnabled
      return this.localStream
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('مرورگر شما از قابلیت ضبط صدا پشتیبانی نمی‌کند (نیاز به HTTPS دارد).')
    }

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(
        NativeAudioMediaManager.AUDIO_CONSTRAINTS
      )
      const tracks = this.localStream.getAudioTracks()

      if (tracks.length === 0) {
        throw new Error('هیچ میکروفونی در دستگاه شما یافت نشد.')
      }

      this.audioTrack = tracks[0]
      this.audioTrack.enabled = initialEnabled

      return this.localStream
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error(
          'دسترسی به میکروفون رد شد. لطفاً در آدرس‌بار مرورگر اجازه دسترسی به میکروفون را بدهید.'
        )
      }
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        throw new Error('میکروفونی به دستگاه متصل نیست.')
      }
      if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        throw new Error('میکروفون توسط برنامه دیگری اشغال شده است.')
      }
      throw new Error(err.message || 'خطا در فعال‌سازی میکروفون.')
    }
  }

  /**
   * Toggle hardware transmission state of local audio track
   */
  setMicrophoneEnabled(enabled: boolean): boolean {
    if (!this.audioTrack || this.audioTrack.readyState !== 'live') {
      return false
    }
    this.audioTrack.enabled = enabled
    return this.audioTrack.enabled
  }

  isMicrophoneEnabled(): boolean {
    return !!this.audioTrack && this.audioTrack.readyState === 'live' && this.audioTrack.enabled
  }

  getLocalStream(): MediaStream | null {
    return this.localStream
  }

  getAudioTrack(): MediaStreamTrack | null {
    return this.audioTrack
  }

  /**
   * Request camera access and prepare the local video track
   */
  async initLocalCamera(): Promise<MediaStream> {
    if (this.videoStream && this.videoTrack && this.videoTrack.readyState === 'live') {
      this.videoTrack.enabled = true
      return this.videoStream
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('مرورگر شما از قابلیت دوربین پشتیبانی نمی‌کند.')
    }

    try {
      this.videoStream = await navigator.mediaDevices.getUserMedia(
        NativeAudioMediaManager.VIDEO_CONSTRAINTS
      )
      const tracks = this.videoStream.getVideoTracks()
      if (tracks.length === 0) {
        throw new Error('هیچ دوربینی در دستگاه شما یافت نشد.')
      }
      this.videoTrack = tracks[0]
      this.videoTrack.enabled = true
      return this.videoStream
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error('دسترسی به دوربین رد شد. لطفاً اجازه دسترسی به دوربین را بدهید.')
      }
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        throw new Error('دوربینی به دستگاه متصل نیست.')
      }
      throw new Error(err.message || 'خطا در فعال‌سازی دوربین.')
    }
  }

  /**
   * Switch between front ('user') and back ('environment') camera on mobile,
   * or cycle through available video input devices on desktop.
   */
  async switchCameraFacingMode(): Promise<MediaStream> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('مرورگر شما از تغییر دوربین پشتیبانی نمی‌کند.')
    }

    const nextFacingMode: 'user' | 'environment' =
      this.currentFacingMode === 'user' ? 'environment' : 'user'

    // Stop current camera stream before requesting the other lens on mobile hardware
    this.stopCamera()

    try {
      // First try switching by facingMode (ideal for phones/tablets)
      this.videoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640, max: 640 },
          height: { ideal: 480, max: 480 },
          frameRate: { ideal: 20, max: 24 },
          facingMode: { exact: nextFacingMode },
        },
        audio: false,
      })
      this.currentFacingMode = nextFacingMode
    } catch (exactErr) {
      // Fallback: enumerate video devices or use non-exact facingMode
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter(d => d.kind === 'videoinput' && d.deviceId)
        if (videoDevices.length > 1) {
          const currentIdx = videoDevices.findIndex(d => d.deviceId === this.currentDeviceId)
          const nextDevice = videoDevices[(currentIdx + 1) % videoDevices.length]
          this.currentDeviceId = nextDevice.deviceId
          this.videoStream = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: { exact: nextDevice.deviceId },
              width: { ideal: 640, max: 640 },
              height: { ideal: 480, max: 480 },
              frameRate: { ideal: 20, max: 24 },
            },
            audio: false,
          })
        } else {
          this.videoStream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 640, max: 640 },
              height: { ideal: 480, max: 480 },
              frameRate: { ideal: 20, max: 24 },
              facingMode: nextFacingMode,
            },
            audio: false,
          })
        }
        this.currentFacingMode = nextFacingMode
      } catch (fallbackErr: any) {
        throw new Error(fallbackErr.message || 'خطا در تغییر جهت دوربین.')
      }
    }

    const tracks = this.videoStream.getVideoTracks()
    if (tracks.length === 0) {
      throw new Error('دوربین یافت نشد.')
    }
    this.videoTrack = tracks[0]
    this.videoTrack.enabled = true
    return this.videoStream
  }

  getFacingMode(): 'user' | 'environment' {
    return this.currentFacingMode
  }

  /**
   * Start Screen Sharing via getDisplayMedia
   */
  async startScreenShare(onEnded?: () => void): Promise<MediaStream> {
    if (!navigator.mediaDevices || !(navigator.mediaDevices as any).getDisplayMedia) {
      throw new Error('مرورگر یا دستگاه شما از اشتراک‌گذاری صفحه نمایش پشتیبانی نمی‌کند.')
    }

    this.stopScreenShare()

    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 15, max: 25 },
        },
        audio: false,
      })

      const tracks = this.screenStream.getVideoTracks()
      if (tracks.length === 0) {
        throw new Error('هیچ تصویری از صفحه نمایش دریافت نشد.')
      }

      this.screenTrack = tracks[0]
      this.screenTrack.onended = () => {
        this.stopScreenShare()
        if (onEnded) onEnded()
      }

      return this.screenStream
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error('اشتراک‌گذاری صفحه نمایش لغو شد.')
      }
      throw new Error(err.message || 'خطا در اشتراک‌گذاری صفحه نمایش.')
    }
  }

  stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => {
        try {
          track.onended = null
          track.stop()
        } catch (e) {}
      })
      this.screenStream = null
    }
    this.screenTrack = null
  }

  isScreenSharing(): boolean {
    return !!this.screenTrack && this.screenTrack.readyState === 'live'
  }

  stopCamera() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => {
        try {
          track.stop()
        } catch (e) {}
      })
      this.videoStream = null
    }
    this.videoTrack = null
  }

  isCameraEnabled(): boolean {
    return !!this.videoTrack && this.videoTrack.readyState === 'live' && this.videoTrack.enabled
  }

  getVideoStream(): MediaStream | null {
    return this.videoStream
  }

  getVideoTrack(): MediaStreamTrack | null {
    return this.videoTrack
  }

  /**
   * Release microphone & camera hardware cleanly
   */
  stopAll() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        try {
          track.stop()
        } catch (e) {}
      })
      this.localStream = null
    }
    this.audioTrack = null
    this.stopCamera()
    this.stopScreenShare()
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {})
      this.audioContext = null
    }
  }
}