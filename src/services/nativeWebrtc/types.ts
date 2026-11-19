export type ParticipantRole = 'teacher' | 'student' | 'admin'

export type ParticipantConnectionState =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'removed'

export type MicrophoneState = 'enabled' | 'disabled' | 'blocked'

export interface INativeParticipant {
  peerId: string
  userId?: string
  attendeeKey?: string
  name: string
  role: ParticipantRole
  micState: MicrophoneState
  cameraEnabled?: boolean
  screenShareEnabled?: boolean
  handRaised?: boolean
  isSpeaker?: boolean
  isModerator?: boolean
  connectionState: ParticipantConnectionState
  joinedAt: number
  isTeacher: boolean
}

export interface ISeminarPollView {
  id: string
  question: string
  allowMultiple?: boolean
  isClosed: boolean
  createdByName: string
  createdAt: number
  closedAt?: number
  totalVoters: number
  myOptionIds: string[]
  options: Array<{
    id: string
    text: string
    votes: number
  }>
}

export interface IRoomDetails {
  roomId: string
  title: string
  uiMode?: 'online_class' | 'seminar'
  status: 'scheduled' | 'active' | 'ended'
  maxParticipants: number
  isTestRoom?: boolean
}

export interface IClassroomRecordingLiveState {
  isRecording: boolean
  mode: 'auto' | 'manual_test'
  status: 'idle' | 'recording' | 'completed' | 'deleted'
  startedAt?: number
  endedAt?: number
  recorderPeerId?: string
  videoUrl?: string
  chunksCount: number
  fileSize: number
  isTestRoom: boolean
}

export interface SignalingIceServer {
  urls: string | string[]
  username?: string
  credential?: string
}

export type WhiteboardTool =
  | 'pan'
  | 'pen'
  | 'highlighter'
  | 'line'
  | 'arrow'
  | 'rect'
  | 'circle'
  | 'text'
  | 'eraser'
  | 'laser'

export type WhiteboardGridMode = 'blank' | 'grid' | 'lined' | 'dots'

export interface IWhiteboardPoint {
  x: number
  y: number
}

export interface IWhiteboardElement {
  id: string
  tool: Exclude<WhiteboardTool, 'eraser' | 'laser'>
  color: string
  size: number
  points?: IWhiteboardPoint[]
  start?: IWhiteboardPoint
  end?: IWhiteboardPoint
  text?: string
}

export interface IWhiteboardState {
  currentPage: number
  totalPages?: number
  gridMode: WhiteboardGridMode
  allowStudentDraw: boolean
  pages: Record<number, IWhiteboardElement[]>
  pageBackgrounds?: Record<number, string>
  activeFileName?: string
}

export interface ILaserPointerState {
  peerId: string
  name: string
  page?: number
  x: number
  y: number
  active: boolean
}

export interface IChatMessage {
  id: string
  senderPeerId: string
  senderName: string
  senderRole: ParticipantRole
  text: string
  fileUrl?: string
  fileName?: string
  timestamp: number
}

export type ClassroomLayoutMode = 'teaching' | 'speaker' | 'grid' | 'board'

export interface SignalingIncomingMessage {
  type:
    | 'join_room'
    | 'offer'
    | 'answer'
    | 'ice_candidate'
    | 'set_microphone'
    | 'set_camera'
    | 'set_screen_share'
    | 'whiteboard_action'
    | 'chat_message'
    | 'teacher_set_permission'
    | 'teacher_remove_participant'
    | 'teacher_end_room'
    | 'raise_hand'
    | 'grant_speaker'
    | 'revoke_speaker'
    | 'grant_moderator'
    | 'revoke_moderator'
    | 'create_poll'
    | 'vote_poll'
    | 'close_poll'
    | 'start_recording'
    | 'stop_recording'
    | 'leave_room'
    | 'ping'
  roomId: string
  targetPeerId?: string
  sdp?: any
  candidate?: any
  enabled?: boolean
  micBlocked?: boolean
  token?: string
  ticketCode?: string
  attendeeKey?: string
  formAnswers?: Record<string, any>
  displayName?: string
  requestedRole?: 'teacher' | 'student'
  action?: string
  text?: string
  fileUrl?: string
  fileName?: string
  payload?: any
}

export interface SignalingOutgoingMessage {
  type:
    | 'room_joined'
    | 'participant_joined'
    | 'participant_left'
    | 'offer'
    | 'answer'
    | 'ice_candidate'
    | 'microphone_state_changed'
    | 'camera_state_changed'
    | 'screen_share_state_changed'
    | 'hand_raise_changed'
    | 'speaker_status_changed'
    | 'moderator_status_changed'
    | 'polls_sync'
    | 'seminar_attendees_sync'
    | 'whiteboard_update'
    | 'chat_message'
    | 'permission_state_changed'
    | 'participant_removed'
    | 'room_ended'
    | 'recording_state_changed'
    | 'pong'
    | 'error'
  roomId?: string
  fromPeerId?: string
  targetPeerId?: string
  payload?: any
  timestamp?: number
}

