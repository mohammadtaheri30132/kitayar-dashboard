import React, { useState, useEffect } from 'react'
import {
  classroomService,
  type ClassroomUiMode,
  type IClassroomItem,
  type IClassroomTicket,
  type IClassroomPricingData,
  type IRegistrationFormField,
  type RegistrationFieldType,
  type IAdminOnlineClassBooking,
} from '../../services/classroomService'
import { ClassroomRecordingPlayerModal } from './components/ClassroomRecordingPlayerModal'
import { AdminSeminarReportsModal } from './components/AdminSeminarReportsModal'
import { EDU_ADMIN_TOKENS, SEMINAR_UI_TOKENS } from '../../theme/eduAdminTokens'
import toast from 'react-hot-toast'

interface Props {
  onJoinRoom?: (sessionId: string) => void
}

export const AdminClassroomMonitoringPage: React.FC<Props> = ({ onJoinRoom }) => {
  const [adminTab, setAdminTab] = useState<'monitoring' | 'pricing' | 'online_classes'>('monitoring')
  const [sessions, setSessions] = useState<IClassroomItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedSessionLogs, setSelectedSessionLogs] = useState<IClassroomItem | null>(null)
  const [selectedRecordingRoomId, setSelectedRecordingRoomId] = useState<string | null>(null)
  const [reportModalTarget, setReportModalTarget] = useState<{
    roomId: string | null
    roomTitle?: string
    initialTab?: 'attendance' | 'telemetry'
  } | null>(null)
  const [terminatingId, setTerminatingId] = useState<string | null>(null)

  // Online Classes & Absence State
  const [onlineClasses, setOnlineClasses] = useState<IAdminOnlineClassBooking[]>([])
  const [onlineClassesLoading, setOnlineClassesLoading] = useState(false)
  const [onlineClassesFilter, setOnlineClassesFilter] = useState<string>('all')
  const [onlineClassesSearch, setOnlineClassesSearch] = useState<string>('')
  const [onlineClassesPage, setOnlineClassesPage] = useState<number>(1)
  const [onlineClassesTotal, setOnlineClassesTotal] = useState<number>(0)
  const [noShowTeachers, setNoShowTeachers] = useState<any[]>([])
  const [loadingNoShowTeachers, setLoadingNoShowTeachers] = useState<boolean>(false)

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
    recordingRetentionHours: 48,
    autoRecordEnabled: true,
  })
  const [loadingPricing, setLoadingPricing] = useState(false)
  const [savingPricing, setSavingPricing] = useState(false)

  // Create Modal State (Seminar & Online Class + Dynamic Registration Form)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createUiMode, setCreateUiMode] = useState<ClassroomUiMode>('seminar')
  const [createTitle, setCreateTitle] = useState('وبینار و سمینار تخصصی کیتایار')
  const [createTopic, setCreateTopic] = useState('همایش زنده آموزشی و پرسش و پاسخ')
  const [createTeacherName, setCreateTeacherName] = useState('استاد علوی')
  const [createStudentCount, setCreateStudentCount] = useState(2)
  const [createMaxParticipants, setCreateMaxParticipants] = useState(100)
  const [enableFormBuilder, setEnableFormBuilder] = useState(true)
  const [formTitle, setFormTitle] = useState('فرم ثبت‌نام ورود به سمینار')
  const [formDescription, setFormDescription] = useState('لطفاً پیش از ورود به سالن سمینار، مشخصات خود را ثبت کنید.')
  const [formFields, setFormFields] = useState<IRegistrationFormField[]>([
    { id: 'fullName', label: 'نام و نام خانوادگی', type: 'text', required: true, placeholder: 'مثلاً: سارا محمدی' },
    { id: 'phone', label: 'شماره موبایل', type: 'phone', required: true, placeholder: '09120000000' },
  ])
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

  // Host selection for join links (current server domain or custom LAN/localhost)
  const [hostType, setHostType] = useState<'wifi' | 'local' | 'custom'>(() => {
    if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return 'wifi'
    }
    return 'local'
  })
  const [wifiHost, setWifiHost] = useState<string>(() =>
    typeof window !== 'undefined' && window.location.host ? window.location.host : 'class.kitayar.ir'
  )
  const [customHost, setCustomHost] = useState<string>(() =>
    typeof window !== 'undefined' && window.location.host ? window.location.host : 'class.kitayar.ir'
  )

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.host) {
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        setWifiHost(window.location.host)
        setCustomHost(window.location.host)
        setHostType('wifi')
      } else {
        setWifiHost(window.location.host)
      }
    }
  }, [])

  const getActiveHost = () => {
    if (hostType === 'wifi') return wifiHost
    if (hostType === 'local') {
      return typeof window !== 'undefined' && window.location.host ? window.location.host : 'localhost:5173'
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

  const fetchAdminOnlineClasses = async (page = 1, status = onlineClassesFilter, search = onlineClassesSearch) => {
    try {
      setOnlineClassesLoading(true)
      const res = await classroomService.getAdminOnlineClasses({
        page,
        limit: 15,
        status: status === 'all' || status === 'no_show' ? undefined : status,
        teacherNoShow: status === 'no_show' ? true : undefined,
        search: search.trim() || undefined,
      })
      if (res.success && res.data) {
        setOnlineClasses(res.data.bookings || [])
        setOnlineClassesTotal(res.data.total || 0)
        setOnlineClassesPage(page)
      }
    } catch (err) {
      console.error('Fetch admin online classes error:', err)
    } finally {
      setOnlineClassesLoading(false)
    }
  }

  const fetchNoShowTeachers = async () => {
    try {
      setLoadingNoShowTeachers(true)
      const res = await classroomService.getNoShowTeachers()
      if (res.success && res.data) {
        setNoShowTeachers(res.data || [])
      }
    } catch (err) {
      console.error('Fetch no show teachers error:', err)
    } finally {
      setLoadingNoShowTeachers(false)
    }
  }

  useEffect(() => {
    fetchSessions()
    fetchPricing()
    const interval = setInterval(fetchSessions, 15000) // Auto-refresh every 15s
    return () => clearInterval(interval)
  }, [filterStatus])

  const handleAddFormField = (preset?: Partial<IRegistrationFormField>) => {
    const uid = `f_${Date.now().toString(36)}_${formFields.length + 1}`
    setFormFields(prev => [
      ...prev,
      {
        id: preset?.id || uid,
        label: preset?.label || `فیلد جدید ${prev.length + 1}`,
        type: preset?.type || 'text',
        required: preset?.required ?? true,
        placeholder: preset?.placeholder || '',
        options: preset?.options || [],
      },
    ])
  }

  const handleUpdateFormField = (index: number, patch: Partial<IRegistrationFormField>) => {
    setFormFields(prev => prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)))
  }

  const handleRemoveFormField = (index: number) => {
    setFormFields(prev => prev.filter((_, idx) => idx !== index))
  }

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createTitle.trim()) {
      toast.error('لطفاً نام سمینار یا عنوان کلاس را وارد کنید')
      return
    }

    const sanitizedFields = formFields
      .map(f => ({ ...f, label: f.label.trim() }))
      .filter(f => f.label.length > 0)

    try {
      setIsSubmittingCreate(true)
      const res = await classroomService.createAdHocSession({
        title: createTitle.trim(),
        topic: createTopic.trim(),
        teacherName: createTeacherName.trim() || (createUiMode === 'seminar' ? 'مجری سمینار' : 'استاد کلاس'),
        studentCount: createUiMode === 'seminar' ? 1 : createStudentCount,
        maxParticipants: Math.max(5, createMaxParticipants),
        uiMode: createUiMode,
        registrationForm: {
          enabled: enableFormBuilder && sanitizedFields.length > 0,
          title: formTitle.trim(),
          description: formDescription.trim(),
          fields: sanitizedFields,
        },
      })

      if (res.success && res.data) {
        toast.success(
          createUiMode === 'seminar'
            ? 'لینک سمینار اختصاصی و فرم ورود با موفقیت ایجاد شد!'
            : 'کلاس آنلاین اختصاصی کیتایار با موفقیت ایجاد شد!'
        )
        setShowCreateModal(false)
        fetchSessions()
        setSelectedSessionForTickets(res.data)
        setTicketsList(res.data.inviteTickets || [])
      } else {
        toast.error(res.message || 'خطا در ایجاد جلسه')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'خطا در ایجاد جلسه یا سمینار')
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

        <button
          onClick={() => {
            setAdminTab('online_classes')
            fetchAdminOnlineClasses(1, onlineClassesFilter, onlineClassesSearch)
            fetchNoShowTeachers()
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            adminTab === 'online_classes'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30'
              : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <span>📋</span>
          <span>کلاس‌های ثبت‌شده و گزارش عدم حضور</span>
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

          {/* Section 5: Auto Recording & Retention Hours */}
          <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="text-xs font-bold text-white block">
                  🎬 زمان حذف خودکار ویدیوی ضبط‌شده کلاس‌ها (ساعت پس از پایان کلاس)
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  تمام کلاس‌های واقعی از لحظه ورود اولین نفر به صورت خودکار ضبط می‌شوند. پس از گذشت این زمان از پایان کلاس، فایل ویدیو به صورت خودکار از سرور پاک می‌شود (عدد ۰ = عدم حذف خودکار).
                </p>
              </div>

              <div className="relative w-48 shrink-0">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={pricingData.recordingRetentionHours ?? 48}
                  onChange={(e) =>
                    setPricingData({
                      ...pricingData,
                      recordingRetentionHours: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white tabular-nums outline-hidden"
                />
                <span className="absolute end-2.5 top-2 text-[10px] text-slate-500">ساعت</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] text-slate-400">انتخاب سریع:</span>
              {[
                { h: 6, label: '۶ ساعت' },
                { h: 12, label: '۱۲ ساعت' },
                { h: 24, label: '۲۴ ساعت (۱ روز)' },
                { h: 48, label: '۴۸ ساعت (۲ روز)' },
                { h: 72, label: '۷۲ ساعت (۳ روز)' },
                { h: 168, label: '۱ هفته' },
                { h: 0, label: 'همیشگی (بدون حذف)' },
              ].map((preset) => (
                <button
                  key={preset.h}
                  type="button"
                  onClick={() =>
                    setPricingData({
                      ...pricingData,
                      recordingRetentionHours: preset.h,
                    })
                  }
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    (pricingData.recordingRetentionHours ?? 48) === preset.h
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section 6: Intelligent Online Classroom Policies & Timing */}
          <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 space-y-5">
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <span>⏱️</span>
                <span>سیاست‌های هوشمند حضور، زمان‌بندی و بازگشایی کلاس آنلاین</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                تنظیم دقیق زمان باز شدن کلاس پیش از شروع، مهلت مجاز تاخیر معلم با استرداد خودکار وجه و کسر امتیاز، زمان جبران قطعی اینترنت و قوانین ورود طرفین.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 block">
                  🔓 بازگشایی کلاس قبل از شروع (دقیقه):
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={pricingData.sessionPolicy?.unlockBeforeMinutes ?? 5}
                  onChange={e =>
                    setPricingData({
                      ...pricingData,
                      sessionPolicy: {
                        ...pricingData.sessionPolicy,
                        unlockBeforeMinutes: Number(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 block">
                  ⏳ مهلت تاخیر مجاز معلم (دقیقه):
                </label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={pricingData.sessionPolicy?.teacherGraceMinutes ?? 30}
                  onChange={e =>
                    setPricingData({
                      ...pricingData,
                      sessionPolicy: {
                        ...pricingData.sessionPolicy,
                        teacherGraceMinutes: Number(e.target.value) || 30,
                      },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
                <span className="text-[10px] text-amber-300/80">پس از این زمان، کلاس لغو و وجه به کیف پول دانش‌آموز برمی‌گردد.</span>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 block">
                  🌐 زمان جبران اینترنت (دقیقه):
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={pricingData.sessionPolicy?.extraMinutes ?? 5}
                  onChange={e =>
                    setPricingData({
                      ...pricingData,
                      sessionPolicy: {
                        ...pricingData.sessionPolicy,
                        extraMinutes: Number(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 block">
                  🔔 هشدار پایان کلاس (دقیقه قبل):
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={pricingData.sessionPolicy?.endWarningMinutes ?? 5}
                  onChange={e =>
                    setPricingData({
                      ...pricingData,
                      sessionPolicy: {
                        ...pricingData.sessionPolicy,
                        endWarningMinutes: Number(e.target.value) || 5,
                      },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 block">
                  💬 مهلت باز بودن چت پس از پایان (ساعت):
                </label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={pricingData.sessionPolicy?.chatOpenHoursAfterEnd ?? 24}
                  onChange={e =>
                    setPricingData({
                      ...pricingData,
                      sessionPolicy: {
                        ...pricingData.sessionPolicy,
                        chatOpenHoursAfterEnd: Number(e.target.value) || 24,
                      },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-indigo-300 block">
                  👨‍🎓 قوانین ورود دانش‌آموز (هر خط یک بند):
                </label>
                <textarea
                  rows={4}
                  value={(pricingData.sessionPolicy?.studentRules || []).join('\n')}
                  onChange={e =>
                    setPricingData({
                      ...pricingData,
                      sessionPolicy: {
                        ...pricingData.sessionPolicy,
                        studentRules: e.target.value.split('\n').filter(Boolean),
                      },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white leading-relaxed outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-purple-300 block">
                  🎓 قوانین ورود دبیر (هر خط یک بند):
                </label>
                <textarea
                  rows={4}
                  value={(pricingData.sessionPolicy?.teacherRules || []).join('\n')}
                  onChange={e =>
                    setPricingData({
                      ...pricingData,
                      sessionPolicy: {
                        ...pricingData.sessionPolicy,
                        teacherRules: e.target.value.split('\n').filter(Boolean),
                      },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white leading-relaxed outline-hidden"
                />
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
      ) : adminTab === 'online_classes' ? (
        <div className="space-y-6">
          {/* Teacher No Show Summary Cards */}
          {noShowTeachers.length > 0 && (
            <div className="bg-slate-900/60 border border-red-500/30 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-red-300 flex items-center gap-2">
                  <span>⚠️</span>
                  <span>دبیران دارای ثبت عدم حضور در کلاس آنلاین ({noShowTeachers.length} دبیر)</span>
                </h4>
                <span className="text-[10px] text-slate-400">
                  به ازای هر عدم حضور، ۱ جریمه در رزومه ثبت و ۱۰۰٪ وجه پرداختی به کیف پول دانش‌آموز مسترد شده است.
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {noShowTeachers.map(t => (
                  <div key={t._id} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white">{t.fullName}</p>
                      <span className="text-[11px] text-slate-400">{t.phoneNumber || t.email || 'بدون تماس'}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 font-bold font-mono">
                      {t.noShowCount} غیبت ⛔
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter Bar & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'همه کلاس‌ها' },
                { id: 'confirmed', label: 'تایید شده' },
                { id: 'in_progress', label: 'در حال برگزاری' },
                { id: 'completed', label: 'برگزار شده' },
                { id: 'cancelled', label: 'لغو شده' },
                { id: 'no_show', label: 'عدم حضور معلم ⚠️' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => {
                    setOnlineClassesFilter(f.id)
                    fetchAdminOnlineClasses(1, f.id, onlineClassesSearch)
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    onlineClassesFilter === f.id
                      ? f.id === 'no_show'
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="جستجو در نام معلم، دانش‌آموز یا موضوع..."
                value={onlineClassesSearch}
                onChange={e => {
                  setOnlineClassesSearch(e.target.value)
                  fetchAdminOnlineClasses(1, onlineClassesFilter, e.target.value)
                }}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none w-64"
              />
              <button
                onClick={() => fetchAdminOnlineClasses(1, onlineClassesFilter, onlineClassesSearch)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
              >
                🔄
              </button>
            </div>
          </div>

          {/* Bookings Table */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 text-start">موضوع و درس</th>
                    <th className="py-3 px-4 text-start">دبیر</th>
                    <th className="py-3 px-4 text-start">دانش‌آموز(ان)</th>
                    <th className="py-3 px-4 text-start">زمان مقرر</th>
                    <th className="py-3 px-4 text-center">وضعیت</th>
                    <th className="py-3 px-4 text-center">حضور / عدم حضور</th>
                    <th className="py-3 px-4 text-center">مبلغ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {onlineClassesLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        در حال بارگذاری کلاس‌ها...
                      </td>
                    </tr>
                  ) : onlineClasses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        کلاسی با این شرایط یافت نشد.
                      </td>
                    </tr>
                  ) : (
                    onlineClasses.map(b => (
                      <tr key={b._id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4">
                          <p className="font-bold text-white">{b.subjectName || 'کلاس آنلاین'}</p>
                          <span className="text-[11px] text-slate-400">{b.topic || b.grade || '-'}</span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-200">{b.teacherName || 'نامشخص'}</p>
                          {b.teacherPhone && <span className="text-[10px] text-slate-500 font-mono">{b.teacherPhone}</span>}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-200">{b.studentName || 'دانش‌آموز'}</p>
                          <span className="text-[10px] text-indigo-400">{b.studentCount || 1} نفر</span>
                        </td>
                        <td className="py-3 px-4">
                          <div>{b.scheduledAt ? new Date(b.scheduledAt).toLocaleDateString('fa-IR') : '-'}</div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {b.scheduledAt ? new Date(b.scheduledAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) : '-'} ({b.durationMinutes || 60} دقیقه)
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {renderStatusBadge(b.status)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {b.teacherNoShow ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                              عدم حضور معلم ⛔ (استرداد ۱۰۰٪)
                            </span>
                          ) : b.teacherJoinedAt ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300">
                              حضور در {new Date(b.teacherJoinedAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })} ✓
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-300">
                          {b.totalPrice ? `${b.totalPrice.toLocaleString('fa-IR')} ت` : 'رایگان'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {onlineClassesTotal > 15 && (
              <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>مجموع: {onlineClassesTotal} مورد</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={onlineClassesPage <= 1}
                    onClick={() => fetchAdminOnlineClasses(onlineClassesPage - 1, onlineClassesFilter, onlineClassesSearch)}
                    className="px-3 py-1 rounded-lg bg-slate-800 disabled:opacity-40 cursor-pointer"
                  >
                    قبلی
                  </button>
                  <span className="text-white font-bold">{onlineClassesPage}</span>
                  <button
                    disabled={onlineClassesPage * 15 >= onlineClassesTotal}
                    onClick={() => fetchAdminOnlineClasses(onlineClassesPage + 1, onlineClassesFilter, onlineClassesSearch)}
                    className="px-3 py-1 rounded-lg bg-slate-800 disabled:opacity-40 cursor-pointer"
                  >
                    بعدی
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
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

      {/* Quick Recording Retention Setting & Test Room Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 bg-slate-900/80 border border-indigo-500/30 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-lg shrink-0">
            🎬
          </div>
          <div>
            <h4 className="text-xs font-black text-white">
              سیستم ضبط خودکار کلاس‌ها (مشابه Adobe Connect) + لاگ همگام سرور و چت‌ها
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              کلاس‌های دانش‌آموز و معلم از لحظه ورود اولین نفر خودکار ضبط می‌شوند. در اتاق تست می‌توانید ضبط را به صورت دستی شروع و متوقف کنید.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
            <span className="text-slate-400">حذف خودکار ویدیو پس از:</span>
            <input
              type="number"
              min="0"
              value={pricingData.recordingRetentionHours ?? 48}
              onChange={(e) =>
                setPricingData({
                  ...pricingData,
                  recordingRetentionHours: Math.max(0, Number(e.target.value) || 0),
                })
              }
              className="w-14 bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-center text-white font-bold tabular-nums"
            />
            <span className="text-slate-400">ساعت</span>
            <button
              type="button"
              onClick={handleSavePricing}
              disabled={savingPricing}
              className="ms-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition"
            >
              {savingPricing ? '...' : 'ذخیره'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => window.open('/classroom/native/test-room', '_blank')}
            className={EDU_ADMIN_TOKENS.btnPrimary}
          >
            🧪 ورود به اتاق تست (با دکمه شروع/پایان ضبط دستی)
          </button>
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

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => setReportModalTarget({ roomId: null, initialTab: 'telemetry' })}
            className={EDU_ADMIN_TOKENS.btnGhost}
            title="مشاهده وضعیت CPU، RAM، Event Loop و ظرفیت بار لحظه‌ای سرور برای تست مهندسی"
          >
            <span>📡</span>
            <span>گزارش ظرفیت و سلامت سرور</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition transform hover:-translate-y-0.5"
          >
            <span className="text-sm">✨</span>
            <span>ایجاد لینک سمینار / کلاس با فرم پویا</span>
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
                <th className="py-3.5 px-4">ضبط، لاگ سرور و چت‌ها</th>
                <th className="py-3.5 px-4 text-center">عملیات و بازپخش</th>
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
                            {item.uiMode === 'seminar' ? (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${EDU_ADMIN_TOKENS.badgePurple}`}>
                                🎤 سمینار / وبینار
                              </span>
                            ) : (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${EDU_ADMIN_TOKENS.badgeInfo}`}>
                                🎓 کلاس تعاملی
                              </span>
                            )}
                            {item.registrationForm?.enabled && (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${EDU_ADMIN_TOKENS.badgeWarning}`}>
                                📝 فرم ورود ({item.registrationForm.fields?.length || 0})
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
                        <div className="flex flex-col gap-1 text-[11px]">
                          {item.recording?.isRecording ? (
                            <span className="inline-flex items-center gap-1 text-rose-400 font-bold">
                              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                              در حال ضبط زنده
                            </span>
                          ) : item.recording?.videoUrl ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                              🎬 فیلم ضبط‌شده آماده
                            </span>
                          ) : item.recording?.status === 'deleted' ? (
                            <span className="text-slate-500">🗑️ ویدیو حذف‌شده (لاگ موجود)</span>
                          ) : (
                            <span className="text-slate-400">
                              {item.whiteboardData?.elements?.length || 0} استروک تخته
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 tabular-nums">
                            📋 {item.recording?.serverLogsCount || item.participantsLog?.length || 0} لاگ • 💬{' '}
                            {item.recording?.chatLogsCount || 0} چت
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          {/* Seminar Attendance & Developer Load Report */}
                          <button
                            onClick={() =>
                              setReportModalTarget({
                                roomId: item.roomName,
                                roomTitle: item.title,
                                initialTab: 'attendance',
                              })
                            }
                            className="px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600 border border-cyan-500/40 text-cyan-300 hover:text-white font-bold text-[11px] transition shadow flex items-center gap-1"
                            title="مشاهده گزارش حضور و غیاب، اطلاعات فرم و تله‌متری مهندسی سرور"
                          >
                            <span>📊</span>
                            <span>گزارش حضور و فنی</span>
                          </button>

                          {/* Adobe Connect Recording + Server Logs + Chat Player */}
                          <button
                            onClick={() => setSelectedRecordingRoomId(item.roomName)}
                            className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600 border border-rose-500/40 text-rose-300 hover:text-white font-bold text-[11px] transition shadow flex items-center gap-1"
                            title="مشاهده فیلم ضبط‌شده کلاس، لاگ لحظه‌ای سرور و چت‌ها (Adobe Connect)"
                          >
                            <span>🎬</span>
                            <span>فیلم و لاگ کلاس</span>
                          </button>

                          {/* Manage Join Links Button */}
                          <button
                            onClick={() => handleOpenTickets(item)}
                            className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 text-blue-300 hover:text-white font-medium text-[11px] transition shadow flex items-center gap-1"
                            title="مشاهده و کپی لینک‌های عضویت"
                          >
                            <span>🔗</span>
                            <span>لینک‌ها {ticketCount > 0 ? `(${ticketCount})` : ''}</span>
                          </button>

                          {/* Observer / Manager Join */}
                          {(item.status === 'active' || item.status === 'waiting') && (
                            <button
                              onClick={() => {
                                if (item.provider === 'internal' || item.uiMode === 'seminar') {
                                  const mgrTicket = item.inviteTickets?.find(t => t.role === 'teacher')?.ticketCode
                                  const targetUrl = mgrTicket
                                    ? `/classroom/native/${item.roomName}?ticket=${encodeURIComponent(mgrTicket)}`
                                    : `/classroom/native/${item.roomName}`
                                  window.open(targetUrl, '_blank')
                                } else {
                                  onJoinRoom?.(item._id)
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] transition shadow"
                              title={item.uiMode === 'seminar' ? 'ورود به عنوان مدیر سمینار' : 'ورود به کلاس'}
                            >
                              {item.uiMode === 'seminar' ? '👑 ورود مدیر' : '👁️ ورود'}
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

      {/* MODAL 1: Create Seminar / Online Class Link + Dynamic Form Builder */}
      {showCreateModal && (
        <div dir="rtl" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto">
          <div className="bg-[#0B1122] border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4 bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">✨</span>
                <div>
                  <h3 className="text-base font-extrabold text-white">ایجاد لینک سمینار یا کلاس آنلاین اختصاصی</h3>
                  <p className="text-[11px] text-slate-400">
                    نام، ظاهر اتاق (سمینار یا کلاس تعاملی) و فرم ثبت‌نام پیش از ورود را به صورت دلخواه طراحی کنید
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Step 1: Choose UI Mode */}
              <div>
                <label className="block text-slate-200 font-bold mb-2">۱. انتخاب ظاهر و ساختار سالن *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCreateUiMode('seminar')
                      setCreateMaxParticipants(100)
                      setEnableFormBuilder(true)
                    }}
                    className={
                      createUiMode === 'seminar'
                        ? SEMINAR_UI_TOKENS.modeCardActive
                        : SEMINAR_UI_TOKENS.modeCardIdle
                    }
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-extrabold text-white">🎤 سمینار / وبینار تخصصی</span>
                      {createUiMode === 'seminar' && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${EDU_ADMIN_TOKENS.badgeSuccess}`}>
                          انتخاب شده
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      استیج بزرگ سخنران و اسلاید، چت زنده، مخاطبان بدون میکروفون پیش‌فرض (حداقل بار سرور) + دکمه دست بالا بردن
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCreateUiMode('online_class')
                      setCreateMaxParticipants(20)
                    }}
                    className={
                      createUiMode === 'online_class'
                        ? SEMINAR_UI_TOKENS.modeCardActive
                        : SEMINAR_UI_TOKENS.modeCardIdle
                    }
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-extrabold text-white">🎓 کلاس آنلاین تعاملی</span>
                      {createUiMode === 'online_class' && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${EDU_ADMIN_TOKENS.badgeSuccess}`}>
                          انتخاب شده
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      تخته هوشمند، تعامل دوطرفه صدا و تصویر بین مدرس و دانش‌آموزان (مناسب گروه‌های کوچک و تدریس خصوصی)
                    </p>
                  </button>
                </div>
              </div>

              {/* Step 2: Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    {createUiMode === 'seminar' ? 'نام سمینار / وبینار *' : 'عنوان کلاس آنلاین *'}
                  </label>
                  <input
                    type="text"
                    value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                    placeholder="مثلاً: سمینار برنامه‌ریزی کنکور ۱۴۰۵"
                    className={EDU_ADMIN_TOKENS.inputClass}
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    {createUiMode === 'seminar' ? 'نام مجری / سخنران اصلی' : 'نام استاد / دبیر'}
                  </label>
                  <input
                    type="text"
                    value={createTeacherName}
                    onChange={(e) => setCreateTeacherName(e.target.value)}
                    placeholder="نام مدرس یا سخنران"
                    className={EDU_ADMIN_TOKENS.inputClass}
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">مبحث / توضیحات زیرعنوان</label>
                  <input
                    type="text"
                    value={createTopic}
                    onChange={(e) => setCreateTopic(e.target.value)}
                    placeholder="توضیح کوتاه برای صفحه ورود مخاطبان"
                    className={EDU_ADMIN_TOKENS.inputClass}
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">حداکثر ظرفیت مجاز (نفر)</label>
                  <input
                    type="number"
                    min="2"
                    max="1000"
                    value={createMaxParticipants}
                    onChange={(e) => setCreateMaxParticipants(Math.max(2, parseInt(e.target.value, 10) || 20))}
                    className={`${EDU_ADMIN_TOKENS.inputClass} tabular-nums`}
                  />
                </div>
              </div>

              {createUiMode === 'online_class' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    تعداد لینک بلیت اختصاصی دانش‌آموز
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {[1, 2, 3, 5, 10].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setCreateStudentCount(num)}
                        className={`px-3 py-1.5 rounded-lg font-bold transition tabular-nums ${
                          createStudentCount === num
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {num} نفر
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Dynamic Pre-Entry Form Builder */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-extrabold text-white flex items-center gap-2">
                      <span>📝</span>
                      <span>فرم‌ساز پویا پیش از ورود (ثبت‌نام مهمانان)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      کاربر قبل از ورود به لینک، باید این فیلدها را پر کند و پاسخ‌های او در گزارش حضور ذخیره می‌شود
                    </p>
                  </div>

                  <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableFormBuilder}
                      onChange={(e) => setEnableFormBuilder(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span className="font-bold text-slate-200">
                      {enableFormBuilder ? 'فرم پیش از ورود فعال است' : 'ورود مستقیم بدون فرم'}
                    </span>
                  </label>
                </div>

                {enableFormBuilder && (
                  <div className="space-y-3 pt-2 border-t border-slate-800/80">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="تیتر بالای فرم ورود"
                        className={EDU_ADMIN_TOKENS.inputClass}
                      />
                      <input
                        type="text"
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder="متن راهنمای کوتاه فرم"
                        className={EDU_ADMIN_TOKENS.inputClass}
                      />
                    </div>

                    {/* Quick Field Presets */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-slate-400">افزودن سریع:</span>
                      <button
                        type="button"
                        onClick={() => handleAddFormField({ label: 'ایمیل', type: 'email', placeholder: 'example@mail.com', required: false })}
                        className={EDU_ADMIN_TOKENS.btnGhost}
                      >
                        + ایمیل
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddFormField({ label: 'مقطع / پایه تحصیلی', type: 'select', options: ['دهم', 'یازدهم', 'دوازدهم', 'دانشجو / سایر'], required: true })}
                        className={EDU_ADMIN_TOKENS.btnGhost}
                      >
                        + لیست انتخابی
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddFormField({ label: 'شهر / استان', type: 'text', placeholder: 'تهران', required: false })}
                        className={EDU_ADMIN_TOKENS.btnGhost}
                      >
                        + شهر
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddFormField()}
                        className={EDU_ADMIN_TOKENS.btnPrimary}
                      >
                        + فیلد سفارشی جدید
                      </button>
                    </div>

                    {/* Dynamic Fields List */}
                    <div className="space-y-2.5">
                      {formFields.map((field, index) => (
                        <div
                          key={field.id}
                          className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                        >
                          <div className="sm:col-span-4">
                            <input
                              type="text"
                              value={field.label}
                              onChange={(e) => handleUpdateFormField(index, { label: e.target.value })}
                              placeholder="عنوان فیلد *"
                              className={EDU_ADMIN_TOKENS.inputClass}
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <select
                              value={field.type}
                              onChange={(e) =>
                                handleUpdateFormField(index, {
                                  type: e.target.value as RegistrationFieldType,
                                })
                              }
                              className={EDU_ADMIN_TOKENS.inputClass}
                            >
                              <option value="text">متن کوتاه</option>
                              <option value="phone">شماره موبایل</option>
                              <option value="email">ایمیل</option>
                              <option value="number">عدد</option>
                              <option value="select">لیست انتخابی</option>
                              <option value="checkbox">تیک تایید</option>
                            </select>
                          </div>

                          <div className="sm:col-span-3">
                            {field.type === 'select' ? (
                              <input
                                type="text"
                                value={(field.options || []).join('، ')}
                                onChange={(e) =>
                                  handleUpdateFormField(index, {
                                    options: e.target.value
                                      .split(/[،,]/)
                                      .map(s => s.trim())
                                      .filter(Boolean),
                                  })
                                }
                                placeholder="گزینه‌ها با ویرگول: الف، ب"
                                className={EDU_ADMIN_TOKENS.inputClass}
                              />
                            ) : (
                              <input
                                type="text"
                                value={field.placeholder || ''}
                                onChange={(e) => handleUpdateFormField(index, { placeholder: e.target.value })}
                                placeholder="متن راهنما"
                                className={EDU_ADMIN_TOKENS.inputClass}
                              />
                            )}
                          </div>

                          <div className="sm:col-span-2 flex items-center justify-end gap-2">
                            <label className="inline-flex items-center gap-1 text-[11px] text-slate-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!field.required}
                                onChange={(e) => handleUpdateFormField(index, { required: e.target.checked })}
                              />
                              <span>اجباری</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => handleRemoveFormField(index)}
                              className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300"
                              title="حذف فیلد"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className={EDU_ADMIN_TOKENS.btnGhost}
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className={EDU_ADMIN_TOKENS.btnPrimary}
                >
                  {isSubmittingCreate
                    ? 'در حال ساخت لینک...'
                    : createUiMode === 'seminar'
                    ? '🎤 ساخت لینک سمینار و فرم ثبت‌نام'
                    : '🎓 ایجاد کلاس آنلاین و صدور لینک‌ها'}
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
                  <span>🌐</span>
                  <span dir="ltr">{wifiHost}</span>
                  <span>(دامنه فعلی)</span>
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

            {/* Public Direct Link Card (Ideal for Seminar & Dynamic Pre-Entry Form) */}
            {(() => {
              const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:'
              const publicDirectUrl = `${protocol}//${getActiveHost()}/classroom/native/${selectedSessionForTickets.roomName}`
              const teacherTicket = ticketsList.find(t => t.role === 'teacher')
              const hostDirectUrl = teacherTicket
                ? `${protocol}//${getActiveHost()}/classroom/native/${selectedSessionForTickets.roomName}?ticket=${teacherTicket.ticketCode}`
                : publicDirectUrl
              return (
                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/35 space-y-2.5 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-extrabold text-emerald-300">
                      🌐 لینک عمومی مستقیم شرکت‌کنندگان (بدون نیاز به لاگین)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(publicDirectUrl, 'public_direct')}
                        className={EDU_ADMIN_TOKENS.btnSuccess}
                      >
                        {copiedTicketCode === 'public_direct' ? '✓ کپی شد' : '📋 کپی لینک عمومی'}
                      </button>
                      <button
                        type="button"
                        onClick={() => window.open(hostDirectUrl, '_blank')}
                        className={EDU_ADMIN_TOKENS.btnPrimary}
                      >
                        {selectedSessionForTickets.uiMode === 'seminar'
                          ? '👑 ورود به عنوان مدیر سمینار'
                          : '🎤 ورود به عنوان استاد کلاس'}
                      </button>
                    </div>
                  </div>
                  <div dir="ltr" className="text-[11px] font-mono text-slate-300 bg-slate-950/80 px-3 py-1.5 rounded-lg truncate border border-slate-800">
                    {publicDirectUrl}
                  </div>
                </div>
              )
            })()}

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
                  const activeHost = getActiveHost()
                  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:'
                  const joinUrl = `${protocol}//${activeHost}/classroom/native/${selectedSessionForTickets.roomName}?ticket=${ticket.ticketCode}`
                  const isTeacher = ticket.role === 'teacher'
                  const isSeminarSession = selectedSessionForTickets.uiMode === 'seminar'
                  const isCopied = copiedTicketCode === ticket.ticketCode

                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/90 flex flex-col gap-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{isTeacher ? (isSeminarSession ? '👑' : '👨‍🏫') : '👤'}</span>
                          <span className="font-bold text-white text-xs">{ticket.name}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isTeacher
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {isSeminarSession
                              ? isTeacher
                                ? 'نقش: مدیر سمینار'
                                : 'نقش: شرکت‌کننده'
                              : isTeacher
                              ? 'نقش: معلم (ادمین)'
                              : 'نقش: دانش‌آموز'}
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
                    <option value="student">
                      {selectedSessionForTickets.uiMode === 'seminar'
                        ? 'شرکت‌کننده'
                        : 'دانش‌آموز (شرکت‌کننده)'}
                    </option>
                    <option value="teacher">
                      {selectedSessionForTickets.uiMode === 'seminar'
                        ? 'مدیر سمینار (دستیار / مجری)'
                        : 'معلم (استاد دوم یا دستیار)'}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">عنوان / پیش‌وند نام (اختیاری)</label>
                  <input
                    type="text"
                    value={addTicketPrefix}
                    onChange={(e) => setAddTicketPrefix(e.target.value)}
                    placeholder={
                      selectedSessionForTickets.uiMode === 'seminar'
                        ? addTicketRole === 'teacher'
                          ? 'مدیر سمینار'
                          : 'شرکت‌کننده'
                        : addTicketRole === 'teacher'
                        ? 'استاد کمکی'
                        : 'دانش‌آموز'
                    }
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

      {/* Adobe Connect Synchronized Classroom Recording & Server Logs Modal */}
      {selectedRecordingRoomId && (
        <ClassroomRecordingPlayerModal
          roomId={selectedRecordingRoomId}
          isOpen={!!selectedRecordingRoomId}
          isAdmin={true}
          onClose={() => setSelectedRecordingRoomId(null)}
          onDeleted={fetchSessions}
        />
      )}

      {/* Seminar Attendance & Developer Telemetry Report Modal */}
      {reportModalTarget && (
        <AdminSeminarReportsModal
          roomId={reportModalTarget.roomId}
          roomTitle={reportModalTarget.roomTitle}
          initialTab={reportModalTarget.initialTab}
          onClose={() => setReportModalTarget(null)}
        />
      )}
    </div>
  )
}

export default AdminClassroomMonitoringPage
