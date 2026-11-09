import React from 'react'
import { NativeClassroomPage } from './native/NativeClassroomPage'

interface PlugNmeetClassroomPageProps {
  sessionId: string
  inviteToken?: string
  onLeave?: () => void
}

/**
 * Unified Classroom Entry Point
 * Replaces legacy PlugNmeet / LiveKit classroom with Kitayar's Native WebRTC Classroom
 */
export const PlugNmeetClassroomPage: React.FC<PlugNmeetClassroomPageProps> = ({
  sessionId,
  inviteToken,
  onLeave,
}) => {
  return (
    <NativeClassroomPage
      roomId={sessionId}
      ticketCode={inviteToken}
      onLeave={onLeave}
    />
  )
}

export default PlugNmeetClassroomPage
