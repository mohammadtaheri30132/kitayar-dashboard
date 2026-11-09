import React, { useState, useEffect } from 'react'
import { classroomService, type IClassroomItem, type IClassroomTicket, type IClassroomPricingData } from '../../services/classroomService'
import toast from 'react-hot-toast'

interface Props {
  onJoinRoom?: (sessionId: string) => void
}

export const AdminClassroomMonitoringPage: React.FC<Props> = ({ onJoinRoom }) => {
  const [adminTab, setAdminTab] = useState<'monitoring' | 'pricing'>('monitoring')
  const [sessions, setSessions] = useState<IClassroomItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedSessionLogs, setSelectedSessionLogs] = useState<IClassroomItem | null>(null)
  const [terminatingId, setTerminatingId] = useState<string | null>(null)

  // Pricing State
  const [pricingData, setPricingData] = useState<IClassroomPricingData>({
    isFree: false,
    only90Min: false,
    durationPrices: {
      d15: 15000,
      d30: 25000,
      d45: 35000,
      d60: 40000,
      d75: 45000,
      d90: 50000,
    },
    extraStudentPrice: 50000,
  })
  const [loadingPricing, setLoadingPricing] = useState(false)
  const [savingPricing, setSavingPricing] = useState(false)

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createProvider, setCreateProvider] = useState<'internal' | 'plugnmeet'>('internal')
  const [createTitle, setCreateTitle] = useState('کلاس آنلاین رفع اشکال')
  const [createTopic, setCreateTopic] = useState('فیزیک و ریاضی دوازدهم')
  const [createTeacherName, setCreateTeacherName] = useState('استاد علوی')
  const [createStudentCount, setCreateStudentCount] = useState(2)
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false)

  // Tickets / Links Modal State
  const [selectedSessionForTickets, setSelectedSessionForTickets] = useState<IClassroomItem | null>(null)
  const [ticketsList, setTicketsList] = useState<IClassroomTicket[]>([])
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [copiedTicketCode, setCopiedTicketCode] = useState<string | null>(null)

  // Add more tickets inside modal
  const [addTicketCount, setAddTicketCount] = useState(1)
  const [addTicketRole, setAddTicketRole] = useState<'student' | 'teacher'>('student')
  const [addTicketPrefix, setAddTicketPrefix] = useState('')
  const [isAddingTickets, setIsAddingTickets] = useState(false)

  // Host selection for join links (localhost for two-browser testing vs Wi-Fi IP for phone)
  const [hostType, setHostType] = useState<'wifi' | 'local' | 'custom'>('local')
  const [wifiHost, setWifiHost] = useState<string>('192.168.1.128:5173')
  const [customHost, setCustomHost] = useState<string>('192.168.1.128:5173')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const portStr = window.location.port ? `:${window.location.port}` : ':5173'
      if (window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        setWifiHost(`${window.location.hostname}${portStr}`)
        setCustomHost(`${window.location.hostname}${portStr}`)
      }
    }
  }, [])

  const getActiveHost = () => {
    if (hostType === 'wifi') return wifiHost
    if (hostType === 'local') {
      const portStr = typeof window !== 'undefined' && window.location.port ? `:${window.location.port}` : ':5173'
      return `localhost${portStr}`
    }
    return customHost.trim() || wifiHost
  }

  const fetchPricing = async () => {
    try {
      setLoadingPricing(true)
      const res = await classroomService.getPricing()
      if (res.success && res.data) {
        setPricingData(res.data)
      }
    } catch (err: any) {
      console.error('Fetch pricing error:', err)
    } finally {
      setLoadingPricing(false)
    }
  }

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSavingPricing(true)
      const res = await classroomService.updatePricing(pricingData)
      if (res.success) {
        toast.success(res.message || 'تنظیمات و تعرفه با موفقیت ذخیره شد')
      } else {
        toast.error('خطا در ذخیره تعرفه')
      }
    } catch (err: any) {
      toast.error('خطا در برقراری ارتباط با سرور')
    } finally {
      setSavingPricing(false)
    }
  }

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const res = await classroomService.listSessions(filterStatus)
      if (res.success) {
        setSessions(res.data)
      }
    } catch (err: any) {
      console.error('Fetch monitoring sessions error:', err)
      toast.error('خطا در دریافت لیست کلاس‌های آنلاین')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
    fetchPricing()
    const interval = setInterval(fetchSessions, 15000) // Auto-refresh every 15s
    return () => clearInterval(interval)
  }, [filterStatus])

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createTitle.trim()) {
      toast.error('لطفاً عنوان کلاس را وارد کنید')
      return
    }

    try {
      setIsSubmittingCreate(true)
      let res: any
      if (createProvider === 'internal') {
        res = await classroomService.createNativeSession({
          title: createTitle.trim(),
          topic: createTopic.trim(),
          maxParticipants: createStudentCount + 1,
        })
      } else {
        res = await classroomService.createPlugNmeetSession({
          title: createTitle.trim(),
          topic: createTopic.trim(),
          teacherName: createTeacherName.trim() || 'استاد کلاس',
          studentCount: createStudentCount,
        })
      }

      if (res.success && res.data) {
        toast.success(
          createProvider === 'internal'
            ? 'کلاس صوتی Native کیتایار با موفقیت ایجاد شد!'
            : 'کلاس آنلاین اختصاصی کیتایار با موفقیت ایجاد شد!'
        )
        setShowCreateModal(false)
        fetchSessions()
        // Open the tickets modal right away for testing
        setSelectedSessionForTickets(res.data)
        setTicketsList(res.data.inviteTickets || [])
      } else {
        toast.error(res.message || 'خطا در ایجاد کلاس')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'خطا در ایجاد کلاس آنلاین')
    } finally {
      setIsSubmittingCreate(false)
    }
  }

  const handleOpenTickets = async (session: IClassroomItem) => {
    try {
      setSelectedSessionForTickets(session)
      setLoadingTickets(true)
      const res = await classroomService.listTickets(session._id)
      if (res.success && res.data?.tickets) {
        setTicketsList(res.data.tickets)
      } else {
        setTicketsList(session.inviteTickets || [])
      }
    } catch (err) {
      setTicketsList(session.inviteTickets || [])
    } finally {
      setLoadingTickets(false)
    }
  }

  const handleAddMoreTickets = async () => {
    if (!selectedSessionForTickets) return

    try {
      setIsAddingTickets(true)
      const res = await classroomService.addTickets(selectedSessionForTickets._id, {
        count: addTicketCount,
        role: addTicketRole,
        namePrefix: addTicketPrefix.trim() || undefined,
      })

      if (res.success && res.data?.newTickets) {
        toast.success(`${addTicketCount} لینک جدید صادر شد`)
        setTicketsList(res.data.totalTickets || [])
        fetchSessions()
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'خطا در صدور لینک جدید')
    } finally {
      setIsAddingTickets(false)
    }
  }

  const copyToClipboard = (text: string, ticketCode: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedTicketCode(ticketCode)
        toast.success('لینک عضویت در کلیپ‌بورد کپی شد')
        setTimeout(() => setCopiedTicketCode(null), 2500)
      })
    } else {
      // Fallback
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopiedTicketCode(ticketCode)
      toast.success('لینک عضویت کپی شد')
      setTimeout(() => setCopiedTicketCode(null), 2500)
    }
  }

  const handleForceEnd = async (sessionId: string) => {
    if (!window.confirm('آیا از خاتمه اجباری این جلسه کلاس توسط ادمین اطمینان دارید؟ تمامی اتصالات وب‌آرتی‌سی بسته خواهند شد.')) {
      return
    }

    try {
      setTerminatingId(sessionId)
      await classroomService.endRoom(sessionId)
      toast.success('کلاس با موفقیت توسط مدیر سامانه خاتمه یافت')
      fetchSessions()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'خطا در خاتمه دادن به کلاس')
    } finally {
      setTerminatingId(null)
    }
  }

  const activeCount = sessions.filter((s) => s.status === 'active').length
  const waitingCount = sessions.filter((s) => s.status === 'waiting' || s.status === 'scheduled').length
  const completedCount = sessions.filter((s) => s.status === 'completed').length

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            در حال برگزاری زنده
          </span>
        )
      case 'waiting':
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            در انتظار ورود
          </span>
        )
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
            پایان یافته
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400">
            {status}
          </span>
        )
    }
  }

  const originUrl = window.location.origin

  return (
    <div className="space-y-6">
      {/* Top Admin Mode Switcher */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <button
          onClick={() => setAdminTab('monitoring')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            adminTab === 'monitoring'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <span>🖥️</span>
          <span>مانیتورینگ و کلاس‌های زنده ({sessions.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('pricing')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            adminTab === 'pricing'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <span>💰</span>
          <span>تنظیمات و تعرفه برگزاری کلاس آنلاین</span>
        </button>
      </div>

      {adminTab === 'pricing' ? (
        <form onSubmit={handleSavePricing} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-8 shadow-xl max-w-4xl">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span>💰</span>
              <span>مدیریت تعرفه و قیمت‌گذاری کلاس‌های آنلاین</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              تعیین قیمت بازه‌های زمانی، هزینه افزایش دانش‌آموزان و امکان رایگان‌سازی کامل سیستم برگزاری کلاس
            </p>
          </div>

          {/* Section 1: Is Free Toggle */}
          <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <span>🏷️</span>
              <span>وضعیت هزینه برگزاری کلاس (رایگان / نقدی)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label
                className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                  pricingData.isFree
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <input
                  type="radio"
                  name="isFree"
                  checked={pricingData.isFree}
                  onChange={() => setPricingData({ ...pricingData, isFree: true })}
                  className="w-4 h-4 text-emerald-500"
                />
                <div>
                  <span className="font-bold block text-sm">کلاس‌ها کاملاً رایگان باشد</span>
                  <span className="text-[11px] opacity-80">
                    هیچ هزینه‌ای از معلم کسر نمی‌شود و در فاکتور مبلغی نمایش داده نمی‌شود.
                  </span>
                </div>
              </label>

              <label
                className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                  !pricingData.isFree
                    ? 'bg-purple-950/40 border-purple-500/50 text-purple-200'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <input
                  type="radio"
                  name="isFree"
                  checked={!pricingData.isFree}
                  onChange={() => setPricingData({ ...pricingData, isFree: false })}
                  className="w-4 h-4 text-purple-500"
                />
                <div>
                  <span className="font-bold block text-sm">کلاس‌ها دارای هزینه باشد</span>
                  <span className="text-[11px] opacity-80">
                    معلم موظف به لاگین و پرداخت فاکتور طبق تعرفه مصوب زیر خواهد بود.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Section 2: Duration Mode */}
          <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <span>⏱️</span>
              <span>حالت انتخاب زمان کلاس توسط معلم</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label
                className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                  !pricingData.only90Min
                    ? 'bg-blue-950/40 border-blue-500/50 text-blue-200'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <input
                  type="radio"
                  name="only90Min"
                  checked={!pricingData.only90Min}
                  onChange={() => setPricingData({ ...pricingData, only90Min: false })}
                  className="w-4 h-4 text-blue-500"
                />
                <div>
                  <span className="font-bold block text-sm">انتخاب از بین ۶ بازه زمانی (۱۵ تا ۹۰ دقیقه)</span>
                  <span className="text-[11px] opacity-80">
                    معلم می‌تواند بسته به نیاز، کلاس‌های ۱۵، ۳۰، ۴۵، ۶۰، ۷۵ یا ۹۰ دقیقه‌ای رزرو کند.
                  </span>
                </div>
              </label>

              <label
                className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                  pricingData.only90Min
                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <input
                  type="radio"
                  name="only90Min"
                  checked={pricingData.only90Min}
                  onChange={() => setPricingData({ ...pricingData, only90Min: true })}
                  className="w-4 h-4 text-amber-500"
                />
                <div>
                  <span className="font-bold block text-sm">فقط کلاس ۹۰ دقیقه‌ای (۱ ساعت و نیم)</span>
                  <span className="text-[11px] opacity-80">
                    تمام کلاس‌ها به طور ثابت و حداکثری به صورت ۹۰ دقیقه‌ای تعریف و رزرو می‌شوند.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Section 3: 6 Duration Price Slots */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <span>💳</span>
              <span>تعیین قیمت برگزاری بر اساس زمان کلاس (به تومان)</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              {[
                { key: 'd15', label: '۱۵ دقیقه' },
                { key: 'd30', label: '۳۰ دقیقه' },
                { key: 'd45', label: '۴۵ دقیقه' },
                { key: 'd60', label: '۶۰ دقیقه (۱ ساعت)' },
                { key: 'd75', label: '۷۵ دقیقه' },
                { key: 'd90', label: '۹۰ دقیقه (۱ ساعت و نیم)' },
              ].map((slot) => {
                const k = slot.key as keyof typeof pricingData.durationPrices
                return (
                  <div key={slot.key} className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-300">{slot.label}</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={pricingData.durationPrices[k]}
                        onChange={(e) =>
                          setPricingData({
                            ...pricingData,
                            durationPrices: {
                              ...pricingData.durationPrices,
                              [k]: Number(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white font-mono outline-hidden"
                      />
                      <span className="absolute left-2.5 top-2 text-[10px] text-slate-500">تومان</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Section 4: Extra Student Price */}
          <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="text-xs font-bold text-white block">
                  هزینه افزودن هر دانش‌آموز جدید (بیش از ۱ نفر)
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  معلم در هر درخواست کلاس به طور پیش‌فرض ۱ دانش‌آموز ظرفیت دارد؛ با افزایش هر دانش‌آموز این مبلغ به فاکتور نهایی افزوده می‌شود.
                </p>
              </div>

              <div className="relative w-48 shrink-0">
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={pricingData.extraStudentPrice}
                  onChange={(e) =>
                    setPricingData({
                      ...pricingData,
                      extraStudentPrice: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white font-mono outline-hidden"
                />
                <span className="absolute left-2.5 top-2 text-[10px] text-slate-500">تومان</span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingPricing}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-purple-600/30 transition transform hover:-translate-y-0.5 cursor-pointer"
            >
              {savingPricing ? 'در حال ذخیره‌سازی...' : 'ذخیره و اعمال تعرفه مصوب'}
            </button>
          </div>
        </form>
      ) : (
        <>
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Rooms */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 mb-1">کلاس‌های در حال برگزاری</p>
              <h4 className="text-2xl font-black text-white">{activeCount}</h4>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xl text-emerald-400">
              🔴
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            پخش زنده صوت، تصویر و وایت‌برد
          </div>
        </div>

        {/* Card 2: Waiting Rooms */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 mb-1">جلسات در انتظار شروع</p>
              <h4 className="text-2xl font-black text-white">{waitingCount}</h4>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl text-amber-400">
              ⏳
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-400">درخواست‌های تایید شده منتظر ورود معلم</p>
        </div>

        {/* Card 3: Completed */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 mb-1">جلسات برگزار شده</p>
              <h4 className="text-2xl font-black text-white">{completedCount}</h4>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xl text-blue-400">
              ✅
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-400">ثبت دقیق مدت زمان و لاگ حاضرین</p>
        </div>

        {/* Card 4: SFU Cluster Status */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 mb-1">زیرساخت لایوکیت داخلی</p>
              <h4 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                آنلاین و پایدار
              </h4>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xl text-indigo-400">
              📡
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-400">پورت 443 TURN و رنج UDP فعال است</p>
        </div>
      </div>

      {/* Filter Tabs & Create Action Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: 'همه کلاس‌ها' },
            { id: 'active', label: 'در حال برگزاری' },
            { id: 'waiting', label: 'در انتظار ورود' },
            { id: 'completed', label: 'پایان یافته' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterStatus === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition transform hover:-translate-y-0.5"
          >
            <span className="text-sm">✨</span>
            <span>ایجاد کلاس جدید و صدور لینک‌های عضویت</span>
          </button>

          <button
            onClick={fetchSessions}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            <span>🔄 بروزرسانی</span>
          </button>
        </div>
      </div>

      {/* Classroom Sessions Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#0B1122] text-slate-400 border-b border-slate-800/80 font-bold">
              <tr>
                <th className="py-3.5 px-4">شناسه و موضوع کلاس</th>
                <th className="py-3.5 px-4">معلم</th>
                <th className="py-3.5 px-4">دانش‌آموزان / مدعوین</th>
                <th className="py-3.5 px-4">وضعیت</th>
                <th className="py-3.5 px-4">مدت جلسه</th>
                <th className="py-3.5 px-4">تخته و وایت‌برد</th>
                <th className="py-3.5 px-4 text-center">عملیات و لینک‌ها</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading && sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    در حال دریافت وضعیت اتاق‌های آنلاین...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    هیچ کلاسی با فیلتر انتخابی یافت نشد. می‌توانید با دکمه بالا یک کلاس آزمایشی جدید بسازید.
                  </td>
                </tr>
              ) : (
                sessions.map((item) => {
                  const teacherName =
                    item.teacherName ||
                    item.teacherId?.fullName ||
                    `${item.teacherId?.firstName || ''} ${item.teacherId?.lastName || ''}`.trim() ||
                    'معلم'
                  const studentName =
                    item.studentName ||
                    item.studentId?.fullName ||
                    `${item.studentId?.firstName || ''} ${item.studentId?.lastName || ''}`.trim() ||
                    (item.inviteTickets && item.inviteTickets.length > 0 ? `${item.inviteTickets.length} کاربر با لینک` : 'دانش‌آموز')

                  const ticketCount = item.inviteTickets?.length || 0

                  return (
                    <tr key={item._id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>{item.title || 'کلاس رفع اشکال آنلاین'}</span>
                            {item.provider === 'plugnmeet' ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                🟣 plugNmeet (اختصاصی)
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                🟢 داخلی
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {item.roomName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span>👨‍🏫</span>
                          <span>{teacherName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span>🧑‍🎓</span>
                          <span>{studentName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(item.status)}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {item.durationSeconds
                          ? `${Math.floor(item.durationSeconds / 60)} دقیقه`
                          : item.status === 'active'
                          ? 'در حال برگزاری...'
                          : '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-slate-400 text-[11px]">
                          {item.whiteboardData?.elements?.length || 0} استروک
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* Manage Join Links Button */}
                          <button
                            onClick={() => handleOpenTickets(item)}
                            className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 text-blue-300 hover:text-white font-medium text-[11px] transition shadow flex items-center gap-1"
                            title="مشاهده و کپی لینک‌های عضویت"
                          >
                            <span>🔗</span>
                            <span>لینک‌ها {ticketCount > 0 ? `(${ticketCount})` : ''}</span>
                          </button>

                          {/* Observer Join */}
                          {item.status === 'active' && (
                            <button
                              onClick={() => {
                                if (item.provider === 'internal') {
                                  window.open(`/classroom/native/${item.roomName}`, '_blank')
                                } else {
                                  onJoinRoom?.(item._id)
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] transition shadow"
                              title="ورود به کلاس"
                            >
                              👁️ ورود
                            </button>
                          )}

                          {/* Force End */}
                          {item.status === 'active' && (
                            <button
                              onClick={() => handleForceEnd(item._id)}
                              disabled={terminatingId === item._id}
                              className="px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600 border border-red-500/30 text-red-300 hover:text-white font-medium text-[11px] transition"
                              title="بستن فوری کلاس"
                            >
                              🛑 خاتمه
                            </button>
                          )}

                          {/* Logs */}
                          <button
                            onClick={() => setSelectedSessionLogs(item)}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition"
                            title="مشاهده گزارش لاگ‌ها"
                          >
                            📋 لاگ
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      {/* MODAL 1: Create Class & Generate Links */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#0B1122] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">✨</span>
                <h3 className="text-base font-bold text-white">ایجاد کلاس آنلاین جدید</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4 text-xs">
              {/* Engine Badge */}
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">🚀</span>
                  <div>
                    <span className="font-bold text-xs text-white">موتور اختصاصی کلاس آنلاین کیتایار</span>
                    <p className="text-[11px] text-slate-400">مبتنی بر plugNmeet با پشتیبانی از صوت، تصویر، تخته هوشمند و اشتراک فایل</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  فعال و پایدار
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">عنوان کلاس *</label>
                <input
                  type="text"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="مثلاً: کلاس آنلاین رفع اشکال ریاضی"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">مبحث / توضیحات</label>
                <input
                  type="text"
                  value={createTopic}
                  onChange={(e) => setCreateTopic(e.target.value)}
                  placeholder="مثلاً: حل تست‌های حرکت‌شناسی کنکور"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">نام استاد / دبیر</label>
                <input
                  type="text"
                  value={createTeacherName}
                  onChange={(e) => setCreateTeacherName(e.target.value)}
                  placeholder="نام معلم را وارد کنید"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  تعداد لینک‌های دانش‌آموز (شرکت‌کنندگان)
                </label>
                <div className="flex items-center gap-2 mb-2">
                  {[1, 2, 3, 5, 10].map((num) => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setCreateStudentCount(num)}
                      className={`px-3 py-1 rounded-lg font-bold transition ${
                        createStudentCount === num
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {num} نفر
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={createStudentCount}
                  onChange={(e) => setCreateStudentCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  💡 به ازای هر دانش‌آموز یک لینک عضویت اختصاصی تولید می‌شود و ۱ لینک هم برای معلم ساخته می‌شود.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
                >
                  {isSubmittingCreate ? 'در حال ایجاد...' : 'ایجاد کلاس و صدور لینک‌ها'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: View, Copy & Add Membership Links */}
      {selectedSessionForTickets && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#0B1122] border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>🔗</span>
                  <span>لینک‌های ورود و عضویت در کلاس</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {selectedSessionForTickets.title} • شناسه: {selectedSessionForTickets.roomName}
                </p>
              </div>
              <button
                onClick={() => setSelectedSessionForTickets(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Host / Device Selector */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-indigo-900/40 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <span>🌐</span>
                  <span>آدرس و IP جهت دسترسی و اشتراک لینک‌ها:</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  برای باز کردن در گوشی، حالت «شبکه Wi-Fi» فعال باشد
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHostType('wifi')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    hostType === 'wifi'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span>📱</span>
                  <span>شبکه Wi-Fi (موبایل و تبلت): {wifiHost}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHostType('local')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    hostType === 'local'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span>💻</span>
                  <span>لوکال (localhost)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHostType('custom')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    hostType === 'custom'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span>✏️</span>
                  <span>آدرس دستی</span>
                </button>
              </div>

              {hostType === 'custom' && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-slate-400">آدرس سرور و پورت:</span>
                  <input
                    type="text"
                    value={customHost}
                    onChange={(e) => setCustomHost(e.target.value)}
                    placeholder="192.168.1.128:5173"
                    dir="ltr"
                    className="px-3 py-1 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-indigo-500 w-56"
                  />
                </div>
              )}
            </div>

            {/* Tickets List */}
            <div className="max-h-72 overflow-y-auto space-y-3 custom-scrollbar pr-1">
              {loadingTickets ? (
                <p className="text-xs text-slate-400 text-center py-8">در حال بارگذاری لینک‌ها...</p>
              ) : ticketsList.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">
                  هنوز هیچ لینکی برای این کلاس صادر نشده است. با فرم زیر لینک جدید ایجاد کنید.
                </p>
              ) : (
                ticketsList.map((ticket, idx) => {
                  const basePath = (import.meta.env.BASE_URL || '/kitayar-dashboard/').replace(/\/+$/, '')
                  const activeHost = getActiveHost()
                  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:'
                  const joinUrl = `${protocol}//${activeHost}${basePath}/online-class/invite/${ticket.ticketCode}`
                  const isTeacher = ticket.role === 'teacher'
                  const isCopied = copiedTicketCode === ticket.ticketCode

                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/90 flex flex-col gap-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{isTeacher ? '👨‍🏫' : '🧑‍🎓'}</span>
                          <span className="font-bold text-white text-xs">{ticket.name}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isTeacher
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {isTeacher ? 'نقش: معلم (ادمین)' : 'نقش: دانش‌آموز'}
                          </span>
                        </div>

                        <div>
                          {ticket.isUsed ? (
                            <span className="text-[10px] text-slate-400">استفاده شده</span>
                          ) : (
                            <span className="text-[10px] text-emerald-400 font-medium">آماده ورود</span>
                          )}
                        </div>
                      </div>

                      {/* URL Box & Action Buttons */}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={joinUrl}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px] focus:outline-none"
                          dir="ltr"
                        />
                        <button
                          onClick={() => copyToClipboard(joinUrl, ticket.ticketCode)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                            isCopied
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                          }`}
                        >
                          <span>{isCopied ? '✓' : '📋'}</span>
                          <span>{isCopied ? 'کپی شد' : 'کپی'}</span>
                        </button>
                        <a
                          href={joinUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1 shadow"
                        >
                          <span>🚀</span>
                          <span>ورود</span>
                        </a>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Add More Tickets Section */}
            <div className="p-4 rounded-xl bg-[#070B14] border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>➕</span>
                <span>افزودن لینک‌های بیشتر به این کلاس:</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">تعداد لینک</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={addTicketCount}
                    onChange={(e) => setAddTicketCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">نقش کاربری</label>
                  <select
                    value={addTicketRole}
                    onChange={(e: any) => setAddTicketRole(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="student">دانش‌آموز (شرکت‌کننده)</option>
                    <option value="teacher">معلم (استاد دوم یا دستیار)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">عنوان / پیش‌وند نام (اختیاری)</label>
                  <input
                    type="text"
                    value={addTicketPrefix}
                    onChange={(e) => setAddTicketPrefix(e.target.value)}
                    placeholder={addTicketRole === 'teacher' ? 'استاد کمکی' : 'دانش‌آموز'}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleAddMoreTickets}
                  disabled={isAddingTickets}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow disabled:opacity-50"
                >
                  {isAddingTickets ? 'در حال صدور...' : '+ صدور لینک‌های جدید'}
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedSessionForTickets(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium"
              >
                بستن پنجره
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Participant Logs Modal */}
      {selectedSessionLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0B1122] border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-sm font-bold text-white">
                لاگ ورود و خروج حاضرین • {selectedSessionLogs.roomName}
              </h3>
              <button
                onClick={() => setSelectedSessionLogs(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2">
              {(selectedSessionLogs.participantsLog || []).length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  هنوز کاربری به این اتاق متصل نشده است.
                </p>
              ) : (
                selectedSessionLogs.participantsLog?.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-white">{p.name}</p>
                      <span className="text-[10px] text-slate-400">
                        نقش: {p.role === 'teacher' ? 'معلم' : p.role === 'student' ? 'دانش‌آموز' : 'ادمین'}
                      </span>
                    </div>
                    <div className="text-left text-[11px] text-slate-400 font-mono">
                      <div>ورود: {new Date(p.joinedAt).toLocaleTimeString('fa-IR')}</div>
                      {p.leftAt && (
                        <div className="text-red-400">
                          خروج: {new Date(p.leftAt).toLocaleTimeString('fa-IR')}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedSessionLogs(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium"
              >
                بستن پنجره
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminClassroomMonitoringPage
