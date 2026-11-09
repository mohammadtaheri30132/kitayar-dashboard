import assert from 'assert'
import { NativeAudioMediaManager } from '../NativeAudioMediaManager.js'
import { NativeMeshPeerManager } from '../NativeMeshPeerManager.js'
import { NativeSignalingClient } from '../NativeSignalingClient.js'

async function runTests() {
  console.log('🧪 Starting Native WebRTC Frontend Engine Tests...\n')

  // ==========================================
  // Test 1: NativeAudioMediaManager
  // ==========================================
  console.log('Test 1: NativeAudioMediaManager hardware & track management')
  let trackStopped = false
  let trackEnabled = false

  const mockTrack = {
    kind: 'audio',
    readyState: 'live',
    get enabled() {
      return trackEnabled
    },
    set enabled(val: boolean) {
      trackEnabled = val
    },
    stop: () => {
      trackStopped = true
    },
  }

  const mockStream = {
    getAudioTracks: () => [mockTrack],
    getTracks: () => [mockTrack],
  }

  // Setup global mock for navigator.mediaDevices
  Object.defineProperty(globalThis, 'navigator', {
    value: {
      mediaDevices: {
        getUserMedia: async (constraints: any) => {
          assert.ok(constraints.audio, 'getUserMedia constraints must include audio')
          assert.strictEqual(constraints.video, false, 'Video must be false for voice mode')
          return mockStream as any
        },
      },
    },
    configurable: true,
    writable: true,
  })

  const audioManager = new NativeAudioMediaManager()
  const stream = await audioManager.initLocalAudio()
  assert.ok(stream, 'Stream should be initialized')
  assert.strictEqual(audioManager.isMicrophoneEnabled(), false, 'Microphone should be muted by default on init')

  // Unmute
  const stateAfterUnmute = audioManager.setMicrophoneEnabled(true)
  assert.strictEqual(stateAfterUnmute, true)
  assert.strictEqual(audioManager.isMicrophoneEnabled(), true)
  console.log('✅ Microphone unmute state toggled successfully')

  // Mute again
  audioManager.setMicrophoneEnabled(false)
  assert.strictEqual(audioManager.isMicrophoneEnabled(), false)
  console.log('✅ Microphone mute state toggled successfully')

  // Stop all
  audioManager.stopAll()
  assert.strictEqual(trackStopped, true, 'Hardware track must be stopped')
  assert.strictEqual(audioManager.getLocalStream(), null, 'Local stream should be cleared')
  console.log('✅ Audio hardware resources freed cleanly')

  // ==========================================
  // Test 2: NativeMeshPeerManager & Candidate Queueing
  // ==========================================
  console.log('\nTest 2: NativeMeshPeerManager PeerConnection & ICE Candidate Buffering')

  // Mock document.createElement('audio') and document.body
  const appendedElements: any[] = []
  ;(globalThis as any).document = {
    createElement: (tag: string) => {
      return {
        tagName: tag.toUpperCase(),
        autoplay: false,
        playsInline: false,
        style: {},
        play: async () => {},
        parentNode: {
          removeChild: (el: any) => {
            const idx = appendedElements.indexOf(el)
            if (idx !== -1) appendedElements.splice(idx, 1)
          },
        },
      }
    },
    body: {
      appendChild: (el: any) => {
        appendedElements.push(el)
      },
    },
  }

  // Mock RTCPeerConnection and related globals
  const addedCandidates: any[] = []
  class MockRTCPeerConnection {
    public remoteDescription: any = null
    public localDescription: any = null
    public ontrack: any = null
    public onicecandidate: any = null
    public onconnectionstatechange: any = null
    public connectionState = 'connected'

    constructor(public config: any) {
      assert.ok(config.iceServers.length > 0, 'RTCPeerConnection must be configured with ICE servers')
    }

    addTrack(track: any, stream: any) {}
    getSenders() {
      return []
    }
    async createOffer() {
      return { type: 'offer', sdp: 'dummy offer sdp' }
    }
    async createAnswer() {
      return { type: 'answer', sdp: 'dummy answer sdp' }
    }
    async setLocalDescription(desc: any) {
      this.localDescription = desc
    }
    async setRemoteDescription(desc: any) {
      this.remoteDescription = desc
    }
    async addIceCandidate(cand: any) {
      addedCandidates.push(cand)
    }
    close() {
      this.connectionState = 'closed'
    }
  }

  ;(globalThis as any).RTCPeerConnection = MockRTCPeerConnection
  ;(globalThis as any).RTCSessionDescription = function (desc: any) {
    return desc
  }
  ;(globalThis as any).RTCIceCandidate = function (cand: any) {
    return cand
  }
  ;(globalThis as any).MediaStream = function () {
    return {
      getTracks: () => [],
      addTrack: () => {},
    }
  }

  const outboundSignals: any[] = []
  const meshManager = new NativeMeshPeerManager((type, targetPeerId, payload) => {
    outboundSignals.push({ type, targetPeerId, payload })
  })

  meshManager.setIceServers([
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'turn:turn.kitayar.ir:3478', username: 'kitayar', credential: 'secret' },
  ])

  // Test Offer creation
  await meshManager.createOfferForPeer('peer_bob')
  assert.strictEqual(outboundSignals.length, 1)
  assert.strictEqual(outboundSignals[0].type, 'offer')
  assert.strictEqual(outboundSignals[0].targetPeerId, 'peer_bob')
  console.log('✅ Local offer generated and dispatched to peer')

  // Test Early ICE Candidate before RemoteDescription
  const earlyCandidate = { candidate: 'candidate:1 1 UDP 1234 192.168.1.50 50000 typ host', sdpMid: '0' }
  await meshManager.handleRemoteCandidate('peer_bob', earlyCandidate)
  assert.strictEqual(addedCandidates.length, 0, 'Candidate must be buffered, not applied before remoteDescription')
  console.log('✅ Candidate arrived early and was queued safely')

  // Receive Remote Answer -> should set remoteDescription and FLUSH candidates
  const answerSdp = { type: 'answer' as const, sdp: 'remote answer sdp' }
  await meshManager.handleRemoteAnswer('peer_bob', answerSdp)
  assert.strictEqual(addedCandidates.length, 1, 'Buffered candidate must be flushed upon setRemoteDescription')
  assert.strictEqual(addedCandidates[0].candidate, earlyCandidate.candidate)
  console.log('✅ Remote answer set and queued candidates flushed')

  // Close all
  meshManager.closeAll()
  assert.strictEqual(appendedElements.length, 0, 'All audio DOM elements must be removed')
  console.log('✅ All PeerConnections and Audio DOM elements closed cleanly')

  console.log('\n🎉 ALL NATIVE WEBRTC FRONTEND ENGINE TESTS PASSED!\n')
  process.exit(0)
}

runTests().catch(err => {
  console.error('❌ Test failed:', err)
  process.exit(1)
})
