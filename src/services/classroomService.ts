import axios from 'axios'

const getApiBaseUrl = () => {
  return '/api/classroom'
}

const getHeaders = () => {
  const token = localStorage.getItem('auth-token')
  return {
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
  }
}

export interface IParticipantPermissions {
  canSpeak: boolean
  canVideo: boolean
  canDraw: boolean
}

export interface IClassroomParticipant {
  userId: string
  name: string
  role: 'teacher' | 'student' | 'admin'
  joinedAt: string
  leftAt?: string
}

export interface IClassroomTicket {
  ticketCode: string
  role: 'teacher' | 'student'
  name: string
  createdAt: string
  usedAt?: string
  isUsed?: boolean
}

export interface IClassroomPricingData {
  isFree: boolean
  only90Min: boolean
  durationPrices: {
    d15: number
    d30: number
    d45: number
    d60: number
    d75: number
    d90: number
  }
  extraStudentPrice: number
}

export interface IClassroomItem {
  _id: string
  roomName: string
  provider?: 'internal' | 'plugnmeet'
  plugNmeetRoomId?: string
  bookingCode?: string
  title: string
  topic?: string
  status: 'scheduled' | 'waiting' | 'active' | 'paused' | 'completed' | 'expired' | 'cancelled'
  teacherName?: string
  studentName?: string
  inviteTickets?: IClassroomTicket[]
  teacherId?: {
    _id: string
    fullName?: string
    firstName?: string
    lastName?: string
    phoneNumber?: string
  }
  studentId?: {
    _id: string
    fullName?: string
    firstName?: string
    lastName?: string
    phoneNumber?: string
  }
  startedAt?: string
  endedAt?: string
  durationSeconds?: number
  participantsLog?: IClassroomParticipant[]
  whiteboardData?: {
    elements?: any[]
    updatedAt?: string
  }
  createdAt: string
}

export const classroomService = {
  /**
   * Request LiveKit token for authenticated participant, admin, or ticket holder
   */
  async joinRoomToken(sessionId: string, ticket?: string, guestName?: string) {
    const res = await axios.post(
      `${getApiBaseUrl()}/rooms/${sessionId}/token`,
      { clientPlatform: 'web', ticket, guestName },
      getHeaders()
    )
    return res.data
  },

  /**
   * Admin creates an ad-hoc classroom with configurable tickets/links
   */
  async createAdHocSession(data: {
    title: string
    topic?: string
    teacherName?: string
    studentCount?: number
    tickets?: Array<{ role: 'teacher' | 'student'; name: string }>
  }) {
    const res = await axios.post(
      `${getApiBaseUrl()}/admin/create-session`,
      data,
      getHeaders()
    )
    return res.data
  },

  /**
   * Adds additional invite tickets to a classroom session
   */
  async addTickets(
    sessionId: string,
    data: {
      count?: number
      role?: 'teacher' | 'student'
      namePrefix?: string
      tickets?: Array<{ role: 'teacher' | 'student'; name: string }>
    }
  ) {
    const res = await axios.post(
      `${getApiBaseUrl()}/rooms/${sessionId}/tickets`,
      data,
      getHeaders()
    )
    return res.data
  },

  /**
   * Lists all tickets for a classroom session
   */
  async listTickets(sessionId: string): Promise<{
    success: boolean
    data: {
      sessionId: string
      roomName: string
      title: string
      tickets: IClassroomTicket[]
    }
  }> {
    const res = await axios.get(
      `${getApiBaseUrl()}/rooms/${sessionId}/tickets`,
      getHeaders()
    )
    return res.data
  },

  /**
   * Get live metrics of a room
   */
  async getRoomStatus(sessionId: string) {
    const res = await axios.get(`${getApiBaseUrl()}/rooms/${sessionId}/status`, getHeaders())
    return res.data
  },

  /**
   * Teacher or Admin force closes the classroom session
   */
  async endRoom(sessionId: string) {
    const res = await axios.post(`${getApiBaseUrl()}/rooms/${sessionId}/end`, {}, getHeaders())
    return res.data
  },

  /**
   * Fetch all sessions for Admin Monitoring
   */
  async listSessions(status?: string): Promise<{ success: boolean; data: IClassroomItem[] }> {
    const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : ''
    const res = await axios.get(`${getApiBaseUrl()}/monitoring/sessions${query}`, getHeaders())
    return res.data
  },

  /**
   * Real-time sync for presence, participants, permissions, whiteboard, chat and WebRTC signaling
   */
  async syncSession(
    sessionId: string,
    payload: {
      identity: string
      name?: string
      role?: 'teacher' | 'student' | 'admin'
      isTeacher?: boolean
      isMicOn?: boolean
      isCamOn?: boolean
      isScreenSharing?: boolean
      handRaised?: boolean
      clientPlatform?: string
      ticket?: string
      whiteboardStroke?: any
      whiteboardStrokes?: any[]
      signal?: any
      signals?: any[]
      chatMessage?: any
      permissionUpdate?: {
        targetIdentity: string
        permissions: Partial<IParticipantPermissions>
        forceMuteMic?: boolean
        forceMuteCam?: boolean
        lowerHand?: boolean
      }
      presentationUpdate?: {
        activeUrl?: string
        pageNumber?: number
        totalPages?: number
        fileName?: string
      }
      lastSeenEventId?: number
    }
  ): Promise<{
    success: boolean
    data: {
      roomStatus: string
      participants: Array<{
        identity: string
        name: string
        role: string
        isTeacher: boolean
        isMicOn: boolean
        isCamOn: boolean
        isScreenSharing?: boolean
        handRaised?: boolean
        permissions?: IParticipantPermissions
        lastSeen: number
      }>
      teacherOnline: boolean
      studentsOnlineCount: number
      signals?: any[]
      strokes?: any[]
      chats?: any[]
      controlActions?: any[]
      presentation?: {
        activeUrl?: string
        pageNumber?: number
        totalPages?: number
        fileName?: string
      } | null
      events: Array<any>
      latestEventId: number
    }
  }> {
    const res = await axios.post(
      `${getApiBaseUrl()}/rooms/${sessionId}/sync`,
      payload,
      getHeaders()
    )
    return res.data
  },

  /**
   * Save whiteboard state
   */
  async saveWhiteboardSnapshot(sessionId: string, snapshot: { elements: any[]; viewport?: any }) {
    const res = await axios.post(
      `${getApiBaseUrl()}/rooms/${sessionId}/whiteboard/snapshot`,
      snapshot,
      getHeaders()
    )
    return res.data
  },

  /**
   * Retrieve whiteboard state
   */
  async getWhiteboardSnapshot(sessionId: string) {
    const res = await axios.get(
      `${getApiBaseUrl()}/rooms/${sessionId}/whiteboard/snapshot`,
      getHeaders()
    )
    return res.data
  },

  /**
   * plugNmeet: Create a new online class session
   */
  async createPlugNmeetSession(data: {
    title: string
    topic?: string
    teacherName?: string
    studentCount?: number
    tickets?: Array<{ role: 'teacher' | 'student'; name: string }>
    duration?: number
    maxParticipants?: number
  }) {
    const res = await axios.post(
      `${getApiBaseUrl()}/plugnmeet/create`,
      data,
      getHeaders()
    )
    return res.data
  },

  /**
   * plugNmeet: Retrieve Join Token for authenticated user or invite ticket
   */
  async getPlugNmeetJoinToken(sessionId: string, ticketOrToken?: string, guestName?: string) {
    const params = new URLSearchParams()
    if (ticketOrToken) params.append('ticket', ticketOrToken)
    if (guestName) params.append('name', guestName)
    const queryString = params.toString() ? `?${params.toString()}` : ''

    const res = await axios.get(
      `${getApiBaseUrl()}/plugnmeet/rooms/${sessionId}/token${queryString}`,
      getHeaders()
    )
    return res.data
  },

  /**
   * plugNmeet: Get official client JS & CSS asset URLs for Native Embedding
   */
  async getPlugNmeetClientFiles() {
    const res = await axios.get(
      `${getApiBaseUrl()}/plugnmeet/client-files`,
      getHeaders()
    )
    return res.data
  },

  /**
   * plugNmeet: Get live room status
   */
  async getPlugNmeetStatus(sessionId: string) {
    const res = await axios.get(
      `${getApiBaseUrl()}/plugnmeet/rooms/${sessionId}/status`,
      getHeaders()
    )
    return res.data
  },

  /**
   * plugNmeet: Force end class session
   */
  async endPlugNmeetSession(sessionId: string) {
    const res = await axios.post(
      `${getApiBaseUrl()}/plugnmeet/rooms/${sessionId}/end`,
      {},
      getHeaders()
    )
    return res.data
  },

  /**
   * Kitayar Native WebRTC: Create a new native voice classroom session
   */
  async createNativeSession(payload: { title: string; topic?: string; maxParticipants?: number }) {
    const res = await axios.post(`${getApiBaseUrl()}/native/rooms`, payload, getHeaders())
    return res.data
  },

  /**
   * Kitayar Native WebRTC: Get live metadata of native room
   */
  async getNativeRoomInfo(roomId: string) {
    const res = await axios.get(`${getApiBaseUrl()}/native/rooms/${roomId}/info`)
    return res.data
  },

  /**
   * Admin: Fetch classroom pricing configuration
   */
  async getPricing(): Promise<{ success: boolean; data: IClassroomPricingData }> {
    const res = await axios.get('/api/classroom/pricing', getHeaders())
    return res.data
  },

  /**
   * Admin: Update classroom pricing configuration
   */
  async updatePricing(data: Partial<IClassroomPricingData>): Promise<{ success: boolean; message: string; data: IClassroomPricingData }> {
    const res = await axios.put('/api/classroom/pricing', data, getHeaders())
    return res.data
  },
}