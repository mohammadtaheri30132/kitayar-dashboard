import React, { useState } from 'react'
import type { DiagnosticLogEntry } from '../../../../services/nativeWebrtc/useNativeClassroomAudio'
import type { PeerDiagnosticsInfo } from '../../../../services/nativeWebrtc/NativeMeshPeerManager'
import type { INativeParticipant } from '../../../../services/nativeWebrtc/types'

interface ClassroomDiagnosticsProps {
  isOpen: boolean
  onClose: () => void
  isConnected: boolean
  isMicEnabled: boolean
  isMicBlocked: boolean
  self: INativeParticipant | null
  roomId: string
  participants: INativeParticipant[]
  logs: DiagnosticLogEntry[]
  peersDiagnostics: Map<string, PeerDiagnosticsInfo>
  onUnlockAudio: () => void
}

export const ClassroomDiagnostics: React.FC<ClassroomDiagnosticsProps> = ({
  isOpen,
  onClose,
  isConnected,
  isMicEnabled,
  isMicBlocked,
  self,
  roomId,
  participants,
  logs,
  peersDiagnostics,
  onUnlockAudio,
}) => {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleCopyLogs = () => {
    let report = `### 📋 گزارش عیب‌یابی سامانه صوتی Native WebRTC کیتایار\n`
    report += `- **زمان گزارش:** ${new Date().toLocaleString('fa-IR')}\n`
    report += `- **شناسه اتاق:** ${roomId}\n`
    report += `- **شناسه کاربر من:** ${self?.peerId || 'نامشخص'} (${self?.name || 'مهمان'} - ${self?.role || 'student'})\n`
    report += `- **وضعیت وب‌سوکت:** ${isConnected ? '🟢 متصل' : '🔴 قطع'}\n`
    report += `- **میکروفون من:** ${isMicBlocked ? 'مسدود' : isMicEnabled ? 'روشن' : 'خاموش'}\n`
    report += `- **تعداد کل افراد:** ${participants.length + (self ? 1 : 0)}\n\n`

    report += `#### وضعیت اتصالات P2P کاربران:\n`
    if (participants.length === 0) {
      report += `هیچ کاربر دیگری در اتاق حضور ندارد.\n`
    } else {
      participants.forEach(p => {
        const diag = peersDiagnostics.get(p.peerId)
        report += `- **${p.name}** (${p.peerId} - ${p.role}):\n`
        report += `  - ICE State: ${diag?.iceConnectionState || 'نامشخص'}\n`
        report += `  - Connection State: ${diag?.connectionState || 'نامشخص'}\n`
        report += `  - کاندیدا: Local=${diag?.localCandidateType || '-'} / Remote=${diag?.remoteCandidateType || '-'}\n`
        report += `  - صدای ورودی: ${diag?.hasRemoteAudio ? 'دریافت شد' : 'در انتظار'}\n`
        report += `  - وضعیت پخش: ${diag?.audioPlaying ? 'در حال پخش' : 'متوقف/بلاک'}\n`
      })
    }

    report += `\n#### آخرین لاگ‌های زنده سیستم:\n\`\`\`\n`
    logs.slice(0, 50).reverse().forEach(l => {
      report += `[${l.time}] [${l.category.toUpperCase()}] ${l.message}\n`
    })
    report += `\`\`\`\n`

    navigator.clipboard.writeText(report).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-right rtl">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛠️</span>
            <div>
              <h3 className="font-bold text-base">مرکز عیب‌یابی و لاگ‌های زنده WebRTC</h3>
              <p className="text-xs text-slate-400">اتاق: {roomId} | مشاهده در لحظه رویدادهای صوتی و اتصالات</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs sm:text-sm">
          {/* Quick Status Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 block mb-1">سیگنالینگ وب‌سوکت</span>
              <span className={`inline-flex items-center gap-1.5 font-bold ${isConnected ? 'text-emerald-600' : 'text-red-500'}`}>
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
                {isConnected ? 'متصل' : 'قطع'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 block mb-1">میکروفون من</span>
              <span className={`font-bold ${isMicBlocked ? 'text-red-500' : isMicEnabled ? 'text-emerald-600' : 'text-slate-600'}`}>
                {isMicBlocked ? '🔒 مسدود' : isMicEnabled ? '🎙️ روشن' : '🔇 خاموش'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 block mb-1">شناسه Peer من</span>
              <span className="font-mono text-xs font-bold text-slate-800 dir-ltr block truncate">
                {self?.peerId || '---'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 block mb-1">نقش کاربری</span>
              <span className="font-bold text-blue-600">
                {self?.role === 'teacher' ? 'مدرس / مدیر' : 'دانش‌آموز / کاربر'}
              </span>
            </div>
          </div>

          {/* Connected Peers Status */}
          <div>
            <h4 className="font-bold text-slate-800 text-xs sm:text-sm mb-2.5 flex items-center gap-1.5">
              <span>👥</span>
              <span>وضعیت اتصال به سایر شرکت‌کنندگان ({participants.length} نفر)</span>
            </h4>

            {participants.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-slate-500 text-xs">
                هنوز دستگاه دوم وارد کلاس نشده است. با گوشی یا تب دیگر وارد شوید.
              </div>
            ) : (
              <div className="space-y-2">
                {participants.map(p => {
                  const diag = peersDiagnostics.get(p.peerId)
                  const iceState = diag?.iceConnectionState || 'new'
                  const isIceConnected = iceState === 'connected' || iceState === 'completed'
                  const isIceChecking = iceState === 'checking'
                  const isIceFailed = iceState === 'failed'

                  return (
                    <div
                      key={p.peerId}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{p.role === 'teacher' ? '👨‍🏫' : '👨‍🎓'}</span>
                        <div>
                          <div className="font-bold text-slate-800">{p.name}</div>
                          <div className="text-[11px] font-mono text-slate-400 dir-ltr">{p.peerId}</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {/* ICE State */}
                        <span
                          className={`px-2.5 py-1 rounded-lg font-bold font-mono text-[11px] ${
                            isIceConnected
                              ? 'bg-emerald-100 text-emerald-800'
                              : isIceChecking
                              ? 'bg-amber-100 text-amber-800 animate-pulse'
                              : isIceFailed
                              ? 'bg-red-100 text-red-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          ICE: {iceState}
                        </span>

                        {/* Candidate type */}
                        {diag?.remoteCandidateType && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[11px]">
                            {diag.remoteCandidateType === 'relay' ? '🛡️ سرور TURN' : diag.remoteCandidateType === 'srflx' ? '🌐 STUN P2P' : '🏠 محلی Host'}
                          </span>
                        )}

                        {/* Audio status */}
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${
                            diag?.hasRemoteAudio ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {diag?.hasRemoteAudio ? '🔊 صوت متصل' : '⏳ در انتظار صوت'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Real-time Logs Console */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                <span>📜</span>
                <span>لاگ‌های زنده سیگنالینگ و WebRTC ({logs.length} رویداد)</span>
              </h4>
              <span className="text-[11px] text-slate-400">جدیدترین در بالا</span>
            </div>

            <div className="bg-slate-950 text-slate-300 font-mono text-[11px] p-3 rounded-2xl h-52 overflow-y-auto space-y-1.5 shadow-inner dir-ltr text-left">
              {logs.length === 0 ? (
                <div className="text-slate-600 text-center py-8">در حال ثبت رویدادها...</div>
              ) : (
                logs.map(log => {
                  let badgeColor = 'text-slate-400'
                  if (log.category === 'ws') badgeColor = 'text-cyan-400'
                  if (log.category === 'webrtc') badgeColor = 'text-blue-400'
                  if (log.category === 'ice') badgeColor = 'text-amber-400'
                  if (log.category === 'audio') badgeColor = 'text-emerald-400'
                  if (log.category === 'error') badgeColor = 'text-red-400 font-bold'

                  return (
                    <div key={log.id} className="leading-relaxed border-b border-slate-900 pb-1">
                      <span className="text-slate-500 mr-2">[{log.time}]</span>
                      <span className={`mr-2 uppercase font-bold text-[10px] ${badgeColor}`}>
                        [{log.category}]
                      </span>
                      <span className={log.category === 'error' ? 'text-red-300' : 'text-slate-200'}>
                        {log.message}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onUnlockAudio}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-2"
          >
            <span>🔊</span>
            <span>فعال‌سازی دستی صدای مرورگر</span>
          </button>

          <button
            onClick={handleCopyLogs}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2 ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            <span>{copied ? '✅' : '📋'}</span>
            <span>{copied ? 'گزارش کامل با موفقیت کپی شد!' : 'کپی کل متن گزارش و لاگ‌ها'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

