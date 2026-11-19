import React, { useState, useEffect } from 'react'
import { adminQuizService } from '../services/adminQuizService';
import type { QuizDashboardData, QuizConfigData, QuizCategoryItem, QuizQuestionItem, QuizBotItem } from '../services/adminQuizService';
import toast from 'react-hot-toast'

const PRESET_ICONS = ['🌍', '⚽', '📚', '🎵', '🏛️', '📖', '🎮', '🎬', '🔬', '💻', '🧠', '🎨', '🧮', '🚀', '🧩', '🏆']
const PRESET_COLORS = ['#7c3aed', '#059669', '#2563eb', '#db2777', '#d97706', '#0d9488', '#4f46e5', '#dc2626', '#0891b2', '#65a30d']

export default function QuizManagementPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bots' | 'rules' | 'players' | 'categories' | 'create-q'>('dashboard')
  const [loading, setLoading] = useState(true)

  // State
  const [dashboardData, setDashboardData] = useState<QuizDashboardData | null>(null)
  const [configData, setConfigData] = useState<QuizConfigData | null>(null)
  const [botsData, setBotsData] = useState<any>(null)
  const [playersData, setPlayersData] = useState<any[]>([])
  const [categoriesData, setCategoriesData] = useState<QuizCategoryItem[]>([])
  const [questionsData, setQuestionsData] = useState<QuizQuestionItem[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)

  // Category Form State
  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [catName, setCatName] = useState('')
  const [catIcon, setCatIcon] = useState('❓')
  const [catColor, setCatColor] = useState('#7c3aed')
  const [isSavingCat, setIsSavingCat] = useState(false)

  // Modal State for Coin Adjustment
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null)
  const [adjustAmount, setAdjustAmount] = useState<number>(50)
  const [adjustReason, setAdjustReason] = useState<string>('')
  const [isAdjusting, setIsAdjusting] = useState(false)

  // Question Creation State
  const [qText, setQText] = useState('')
  const [opt1, setOpt1] = useState('')
  const [opt2, setOpt2] = useState('')
  const [opt3, setOpt3] = useState('')
  const [opt4, setOpt4] = useState('')
  const [correctOpt, setCorrectOpt] = useState('')
  const [qDiff, setQDiff] = useState('ساده')
  const [qCat, setQCat] = useState('عمومی')
  const [qExp, setQExp] = useState('')
  const [isCreatingQ, setIsCreatingQ] = useState(false)

  // Bot Creation State
  const [newBotName, setNewBotName] = useState('')
  const [newBotDifficulty, setNewBotDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [newBotAvatar, setNewBotAvatar] = useState('avatar_opp1')
  const [isSavingBots, setIsSavingBots] = useState(false)

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [dash, conf, bots, players, cats] = await Promise.all([
        adminQuizService.getDashboard(),
        adminQuizService.getConfig(),
        adminQuizService.getBots(),
        adminQuizService.getPlayers(1),
        adminQuizService.getCategories(),
      ])
      if (dash.success) setDashboardData(dash.data)
      if (conf.success) setConfigData(conf.data)
      if (bots.success) setBotsData(bots.data)
      if (players.success) setPlayersData(players.data.players || [])
      if (Array.isArray(cats)) {
        setCategoriesData(cats)
        if (cats.length > 0 && !cats.some((c) => c.name === qCat)) {
          setQCat(cats[0].name)
        }
      }
    } catch (err: any) {
      toast.error('خطا در بارگذاری اطلاعات کوییز')
    } finally {
      setLoading(false)
    }
  }

  const loadQuestions = async (cat?: string) => {
    setLoadingQuestions(true)
    try {
      const list = await adminQuizService.getQuestions(cat)
      setQuestionsData(list || [])
    } catch {
      toast.error('خطا در دریافت سوالات')
    } finally {
      setLoadingQuestions(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'create-q') {
      loadQuestions(qCat)
    }
  }, [activeTab, qCat])

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!catName.trim()) {
      toast.error('نام موضوع الزامی است')
      return
    }
    setIsSavingCat(true)
    try {
      if (editingCatId) {
        const res = await adminQuizService.updateCategory(editingCatId, {
          name: catName.trim(),
          icon: catIcon.trim() || '❓',
          color: catColor,
        })
        if (res.success) toast.success('موضوع با موفقیت ویرایش شد')
      } else {
        const res = await adminQuizService.createCategory({
          name: catName.trim(),
          icon: catIcon.trim() || '❓',
          color: catColor,
          isActive: true,
        })
        if (res.success) toast.success('موضوع جدید ایجاد شد')
      }
      setEditingCatId(null)
      setCatName('')
      setCatIcon('❓')
      setCatColor('#7c3aed')
      const cats = await adminQuizService.getCategories()
      setCategoriesData(cats || [])
    } catch (err: any) {
      toast.error('خطا: ' + (err.response?.data?.message || err.message))
    } finally {
      setIsSavingCat(false)
    }
  }

  const handleToggleCategory = async (cat: QuizCategoryItem) => {
    try {
      await adminQuizService.updateCategory(cat._id, { isActive: !cat.isActive })
      const cats = await adminQuizService.getCategories()
      setCategoriesData(cats || [])
      toast.success(cat.isActive ? 'موضوع غیرفعال شد' : 'موضوع فعال شد')
    } catch {
      toast.error('خطا در تغییر وضعیت موضوع')
    }
  }

  const handleDeleteCategory = async (cat: QuizCategoryItem) => {
    if (!window.confirm(`آیا از حذف موضوع «${cat.name}» اطمینان دارید؟`)) return
    try {
      await adminQuizService.deleteCategory(cat._id)
      const cats = await adminQuizService.getCategories()
      setCategoriesData(cats || [])
      toast.success('موضوع حذف شد')
    } catch {
      toast.error('خطا در حذف موضوع')
    }
  }

  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm('این سوال حذف شود؟')) return
    try {
      await adminQuizService.deleteQuestion(id)
      toast.success('سوال حذف شد')
      loadQuestions(qCat)
    } catch {
      toast.error('خطا در حذف سوال')
    }
  }

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!configData) return
    try {
      const res = await adminQuizService.updateConfig(configData)
      if (res.success) {
        if (res.data) setConfigData(res.data)
        toast.success('قوانین و تنظیمات بازی با موفقیت به‌روزرسانی شد')
      }
    } catch (err: any) {
      toast.error('خطا در ذخیره تنظیمات: ' + (err.response?.data?.message || err.message))
    }
  }

  const persistBotsList = async (nextBots: QuizBotItem[], successMessage: string) => {
    if (!configData) return
    setIsSavingBots(true)
    try {
      const res = await adminQuizService.updateConfig({ ...configData, bots: nextBots })
      if (res.success) {
        const updatedBots = res.data?.bots || nextBots
        setConfigData({ ...configData, bots: updatedBots })
        setBotsData((prev: any) => ({ ...prev, roster: updatedBots }))
        toast.success(successMessage)
      }
    } catch (err: any) {
      toast.error('خطا در ذخیره ربات‌ها: ' + (err.response?.data?.message || err.message))
    } finally {
      setIsSavingBots(false)
    }
  }

  const handleAddBot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBotName.trim() || !configData) {
      toast.error('نام ربات الزامی است')
      return
    }
    const currentBots: QuizBotItem[] = configData.bots || botsData?.roster || []
    const created: QuizBotItem = {
      id: `bot_${Date.now()}`,
      name: newBotName.trim(),
      avatar: newBotAvatar,
      difficulty: newBotDifficulty,
      isActive: true,
    }
    await persistBotsList([...currentBots, created], `ربات «${created.name}» اضافه شد`)
    setNewBotName('')
  }

  const handleUpdateBotDifficulty = async (botId: string, difficulty: 'easy' | 'medium' | 'hard') => {
    if (!configData) return
    const currentBots: QuizBotItem[] = configData.bots || botsData?.roster || []
    const nextBots = currentBots.map((b) => (b.id === botId ? { ...b, difficulty } : b))
    await persistBotsList(nextBots, 'سطح ربات به‌روزرسانی شد')
  }

  const handleToggleBotActive = async (botId: string) => {
    if (!configData) return
    const currentBots: QuizBotItem[] = configData.bots || botsData?.roster || []
    const nextBots = currentBots.map((b) => (b.id === botId ? { ...b, isActive: !b.isActive } : b))
    await persistBotsList(nextBots, 'وضعیت ربات تغییر کرد')
  }

  const handleDeleteBot = async (bot: QuizBotItem) => {
    if (!configData) return
    const currentBots: QuizBotItem[] = configData.bots || botsData?.roster || []
    if (currentBots.length <= 1) {
      toast.error('حداقل یک ربات باید در سیستم فعال بماند')
      return
    }
    const nextBots = currentBots.filter((b) => b.id !== bot.id)
    await persistBotsList(nextBots, `ربات «${bot.name}» حذف شد`)
  }

  const handleAdjustCoins = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlayer || !adjustReason.trim()) {
      toast.error('لطفاً دلیل تغییر موجودی را وارد کنید')
      return
    }
    setIsAdjusting(true)
    try {
      const res = await adminQuizService.adjustCoins(selectedPlayer.user?._id || selectedPlayer.user, adjustAmount, adjustReason)
      if (res.success) {
        toast.success(`موجودی با موفقیت تغییر کرد. موجودی جدید: ${res.data.newBalance} سکه`)
        setSelectedPlayer(null)
        setAdjustReason('')
        loadAllData()
      }
    } catch (err: any) {
      toast.error('خطا در تغییر موجودی: ' + (err.response?.data?.message || err.message))
    } finally {
      setIsAdjusting(false)
    }
  }

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!qText || !opt1 || !opt2 || !opt3 || !opt4 || !correctOpt) {
      toast.error('لطفاً همه گزینه‌ها و پاسخ صحیح را مشخص کنید')
      return
    }
    setIsCreatingQ(true)
    try {
      const res = await adminQuizService.createQuizQuestion({
        question: qText,
        options: [opt1, opt2, opt3, opt4],
        answer: correctOpt,
        difficulty: qDiff,
        category: qCat,
        explanation: qExp,
      })
      if (res.success) {
        toast.success('سوال با موفقیت به بانک سوالات کوییز اضافه شد')
        setQText('')
        setOpt1('')
        setOpt2('')
        setOpt3('')
        setOpt4('')
        setCorrectOpt('')
        setQExp('')
        loadQuestions(qCat)
      }
    } catch (err: any) {
      toast.error('خطا در ثبت سوال: ' + (err.response?.data?.message || err.message))
    } finally {
      setIsCreatingQ(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 font-bold">
        در حال بارگذاری بخش مدیریت کوییز نوکیتا...
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      {/* هدر صفحه */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <span className="p-2 bg-orange-500/150/15 text-orange-400 border border-orange-500/30 rounded-xl">🎮</span>
            مدیریت بازی و مسابقات نوکیتا (Quiz Management)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            سیستم داوری سرور، زمان‌بندی ربات‌ها، اقتصاد سکه، قلب، قوانین و مسابقات چندنفره دانش‌آموزی
          </p>
        </div>
        <button
          onClick={loadAllData}
          className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/80 rounded-xl text-sm font-semibold transition"
        >
          🔄 به‌روزرسانی اطلاعات
        </button>
      </div>

      {/* تب‌های ناوبری پنل */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800/80 pb-2">
        {[
          { id: 'dashboard', label: '📊 داشبورد و آمار مسابقات' },
          { id: 'bots', label: '🤖 هوش مصنوعی و ربات‌ها' },
          { id: 'rules', label: '⚙️ قوانین و اقتصاد بازی' },
          { id: 'players', label: '👥 بازیکنان و حسابرسی سکه' },
          { id: 'categories', label: '🎨 موضوعات و آیکون‌ها' },
          { id: 'create-q', label: '➕ بانک و افزودن سوال کوییز' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
              activeTab === tab.id
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* تب ۱: داشبورد و آمار */}
      {activeTab === 'dashboard' && dashboardData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#0B1122] p-5 rounded-2xl border border-slate-800/80 shadow-xl">
              <span className="text-xs font-bold text-slate-400">کل مسابقات برگزار شده</span>
              <p className="text-3xl font-black text-white mt-2">{dashboardData.totalMatches.toLocaleString('fa-IR')}</p>
              <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">
                {dashboardData.completedMatches} مسابقه کامل شده
              </span>
            </div>

            <div className="bg-[#0B1122] p-5 rounded-2xl border border-slate-800/80 shadow-xl">
              <span className="text-xs font-bold text-slate-400">نسبت بازی با ربات</span>
              <p className="text-3xl font-black text-orange-600 mt-2">
                {dashboardData.botMatchPercentage}%
              </p>
              <span className="text-xs text-slate-500 font-semibold mt-1 inline-block">
                {dashboardData.botMatches} مچ ربات | {dashboardData.humanMatches} مچ کاربر
              </span>
            </div>

            <div className="bg-[#0B1122] p-5 rounded-2xl border border-slate-800/80 shadow-xl">
              <span className="text-xs font-bold text-slate-400">کل بازیکنان فعال</span>
              <p className="text-3xl font-black text-blue-600 mt-2">{dashboardData.totalPlayers.toLocaleString('fa-IR')}</p>
              <span className="text-xs text-slate-500 font-semibold mt-1 inline-block">پروفایل‌های دانش‌آموزی</span>
            </div>

            <div className="bg-[#0B1122] p-5 rounded-2xl border border-slate-800/80 shadow-xl">
              <span className="text-xs font-bold text-slate-400">تراکنش‌های سکه</span>
              <p className="text-3xl font-black text-amber-500 mt-2">
                {dashboardData.coinTransactionsSummary.reduce((acc, curr) => acc + curr.count, 0)}
              </p>
              <span className="text-xs text-slate-500 font-semibold mt-1 inline-block">تراکنش ثبت‌شده در لجر</span>
            </div>
          </div>

          {/* آخرین مسابقات */}
          <div className="bg-[#0B1122] rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden">
            <div className="p-4 border-b bg-slate-900/60 flex items-center justify-between">
              <h3 className="font-black text-slate-100 text-sm">آخرین مسابقات برگزار شده</h3>
              <span className="text-xs text-slate-500">۱۰ مسابقه اخیر</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-800/80 text-slate-300 text-xs font-bold">
                  <tr>
                    <th className="p-3">شناسه مچ</th>
                    <th className="p-3">حالت</th>
                    <th className="p-3">بازیکن اول</th>
                    <th className="p-3">بازیکن دوم / حریف</th>
                    <th className="p-3">وضعیت</th>
                    <th className="p-3">برنده</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {dashboardData.recentMatches.map((m) => (
                    <tr key={m._id} className="hover:bg-slate-900/60">
                      <td className="p-3 font-mono text-xs text-slate-500">{m.matchId.slice(0, 16)}...</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-slate-800/80 text-slate-200 font-bold">
                          {m.mode}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-100">
                        {m.player1.username} ({m.player1.score} امتیاز)
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-slate-100">
                          {m.player2.username} {m.player2.isBot && <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded mr-1">ربات</span>}
                        </span>{' '}
                        ({m.player2.score} امتیاز)
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          m.status === 'completed' ? 'bg-emerald-100 text-emerald-400' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {m.status === 'completed' ? 'تکمیل شده' : m.status}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-emerald-600">
                        {m.winner === 'player1' ? m.player1.username : m.winner === 'player2' ? m.player2.username : 'مساوی'}
                      </td>
                    </tr>
                  ))}
                  {dashboardData.recentMatches.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        هنوز مسابقه‌ای ثبت نشده است
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* تب ۲: تنظیمات و مدل‌های ربات‌ها */}
      {activeTab === 'bots' && configData && (
        <div className="bg-[#0B1122] p-6 rounded-2xl border border-slate-800/80 shadow-xl space-y-6">
          <div>
            <h3 className="text-lg font-black text-white">توزیع شانس انتخاب مدل ربات (ضعیف / متوسط / قوی)</h3>
            <p className="text-xs text-slate-400 mt-1">
              در صورت گذشت ۱۰ ثانیه بدون یافتن حریف انسانی، یکی از ربات‌های تعریف‌شده زیر با توجه به این درصدها انتخاب می‌شود.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/25">
              <label className="text-xs font-bold text-emerald-300">درصد ربات‌های ضعیف (Easy)</label>
              <div className="flex items-center gap-3 mt-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={configData.botDistribution.easy}
                  onChange={(e) =>
                    setConfigData({
                      ...configData,
                      botDistribution: { ...configData.botDistribution, easy: Number(e.target.value) },
                    })
                  }
                  className="w-20 p-2 bg-slate-900 text-white border border-slate-700 rounded-lg text-center font-bold"
                />
                <span className="text-sm font-bold text-emerald-400">درصد</span>
              </div>
            </div>

            <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/25">
              <label className="text-xs font-bold text-amber-300">درصد ربات‌های متوسط (Medium)</label>
              <div className="flex items-center gap-3 mt-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={configData.botDistribution.medium}
                  onChange={(e) =>
                    setConfigData({
                      ...configData,
                      botDistribution: { ...configData.botDistribution, medium: Number(e.target.value) },
                    })
                  }
                  className="w-20 p-2 bg-slate-900 text-white border border-slate-700 rounded-lg text-center font-bold"
                />
                <span className="text-sm font-bold text-amber-400">درصد</span>
              </div>
            </div>

            <div className="p-4 bg-rose-500/10 rounded-xl border border-rose-500/25">
              <label className="text-xs font-bold text-rose-300">درصد ربات‌های قوی (Hard)</label>
              <div className="flex items-center gap-3 mt-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={configData.botDistribution.hard}
                  onChange={(e) =>
                    setConfigData({
                      ...configData,
                      botDistribution: { ...configData.botDistribution, hard: Number(e.target.value) },
                    })
                  }
                  className="w-20 p-2 bg-slate-900 text-white border border-slate-700 rounded-lg text-center font-bold"
                />
                <span className="text-sm font-bold text-rose-400">درصد</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveConfig}
            className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm transition"
          >
            ذخیره درصد توزیع ربات‌ها
          </button>

          {/* افزودن ربات جدید */}
          <form onSubmit={handleAddBot} className="pt-5 border-t border-slate-800 space-y-4">
            <h4 className="font-bold text-sm text-slate-100">تعریف ربات جدید (قوی / متوسط / ضعیف)</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                value={newBotName}
                onChange={(e) => setNewBotName(e.target.value)}
                placeholder="نام نمایشی ربات (مثلاً: حریف هوشمند)"
                className="p-2.5 border border-slate-700/80 bg-slate-900/90 text-slate-100 rounded-xl text-sm font-bold outline-none focus:border-orange-500"
              />
              <select
                value={newBotDifficulty}
                onChange={(e) => setNewBotDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                className="p-2.5 border border-slate-700/80 bg-slate-900/90 text-slate-100 rounded-xl text-sm font-bold outline-none focus:border-orange-500"
              >
                <option value="easy">مدل ضعیف (Easy)</option>
                <option value="medium">مدل متوسط (Medium)</option>
                <option value="hard">مدل قوی (Hard)</option>
              </select>
              <select
                value={newBotAvatar}
                onChange={(e) => setNewBotAvatar(e.target.value)}
                className="p-2.5 border border-slate-700/80 bg-slate-900/90 text-slate-100 rounded-xl text-sm font-bold outline-none focus:border-orange-500"
              >
                <option value="avatar_opp1">آواتار دخترانه</option>
                <option value="avatar_opp2">آواتار استاد</option>
                <option value="avatar_opp3">آواتار پسرانه</option>
              </select>
              <button
                type="submit"
                disabled={isSavingBots}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition"
              >
                {isSavingBots ? 'در حال ثبت...' : '+ افزودن ربات'}
              </button>
            </div>
          </form>

          {/* لیست ربات‌های تعریف‌شده */}
          <div className="pt-4 border-t border-slate-800">
            <h4 className="font-bold text-sm text-slate-100 mb-3">
              ربات‌های تعریف‌شده در سیستم ({(configData.bots || botsData?.roster || []).length} ربات)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(configData.bots || botsData?.roster || []).map((bot: QuizBotItem) => (
                <div
                  key={bot.id}
                  className={`p-3.5 rounded-xl border flex flex-col gap-3 transition ${
                    bot.isActive !== false ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-950/60 border-slate-800/50 opacity-55'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold text-sm">
                        {bot.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-100">{bot.name}</p>
                        <span
                          className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            bot.difficulty === 'hard'
                              ? 'bg-rose-500/20 text-rose-300'
                              : bot.difficulty === 'medium'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {bot.difficulty === 'hard' ? 'قوی (Hard)' : bot.difficulty === 'medium' ? 'متوسط (Medium)' : 'ضعیف (Easy)'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteBot(bot)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 font-bold"
                    >
                      حذف
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                    <select
                      value={bot.difficulty}
                      disabled={isSavingBots}
                      onChange={(e) => handleUpdateBotDifficulty(bot.id, e.target.value as 'easy' | 'medium' | 'hard')}
                      className="text-xs p-1.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 font-bold"
                    >
                      <option value="easy">ضعیف</option>
                      <option value="medium">متوسط</option>
                      <option value="hard">قوی</option>
                    </select>

                    <button
                      type="button"
                      disabled={isSavingBots}
                      onClick={() => handleToggleBotActive(bot.id)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-bold transition ${
                        bot.isActive !== false
                          ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {bot.isActive !== false ? 'فعال' : 'غیرفعال'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* تب ۳: قوانین و اقتصاد */}
      {activeTab === 'rules' && configData && (
        <form onSubmit={handleSaveConfig} className="bg-[#0B1122] p-6 rounded-2xl border border-slate-800/80 shadow-xl space-y-6">
          <h3 className="text-lg font-black text-white">قوانین مسابقه و پارامترهای اقتصادی</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-xs font-bold text-slate-300">تعداد راندهای هر مسابقه</label>
              <input
                type="number"
                min="1"
                max="6"
                value={configData.roundsPerMatch}
                onChange={(e) => setConfigData({ ...configData, roundsPerMatch: Number(e.target.value) })}
                className="w-full mt-1.5 p-2.5 border border-slate-700/80 bg-slate-900/90 text-slate-100 rounded-xl focus:border-orange-500 outline-none font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300">تعداد سوال در هر راند</label>
              <input
                type="number"
                min="1"
                max="5"
                value={configData.questionsPerRound}
                onChange={(e) => setConfigData({ ...configData, questionsPerRound: Number(e.target.value) })}
                className="w-full mt-1.5 p-2.5 border border-slate-700/80 bg-slate-900/90 text-slate-100 rounded-xl focus:border-orange-500 outline-none font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300">ثانیه تایمر هر سوال</label>
              <input
                type="number"
                min="5"
                max="30"
                value={configData.questionTimerSeconds}
                onChange={(e) => setConfigData({ ...configData, questionTimerSeconds: Number(e.target.value) })}
                className="w-full mt-1.5 p-2.5 border border-slate-700/80 bg-slate-900/90 text-slate-100 rounded-xl focus:border-orange-500 outline-none font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300">حداکثر ظرفیت قلب (جان)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={configData.maxHearts}
                onChange={(e) => setConfigData({ ...configData, maxHearts: Number(e.target.value) })}
                className="w-full mt-1.5 p-2.5 border border-slate-700/80 bg-slate-900/90 text-slate-100 rounded-xl focus:border-orange-500 outline-none font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300">فاصله بازیابی هر قلب (دقیقه)</label>
              <input
                type="number"
                min="1"
                max="120"
                value={configData.heartRegenMinutes}
                onChange={(e) => setConfigData({ ...configData, heartRegenMinutes: Number(e.target.value) })}
                className="w-full mt-1.5 p-2.5 border border-slate-700/80 bg-slate-900/90 text-slate-100 rounded-xl focus:border-orange-500 outline-none font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300">زمان انتظار برای حریف انسانی قبل از ربات (ثانیه)</label>
              <input
                type="number"
                min="5"
                max="30"
                value={configData.matchmakingTimeoutSeconds}
                onChange={(e) => setConfigData({ ...configData, matchmakingTimeoutSeconds: Number(e.target.value) })}
                className="w-full mt-1.5 p-2.5 border border-slate-700/80 bg-slate-900/90 text-slate-100 rounded-xl focus:border-orange-500 outline-none font-bold"
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-bold text-sm text-slate-100 mb-3">جوایز مسابقه (سکه‌ها و XP)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-xs font-bold text-slate-300">سکه پیروزی (برد)</label>
                <input
                  type="number"
                  value={configData.winCoinReward}
                  onChange={(e) => setConfigData({ ...configData, winCoinReward: Number(e.target.value) })}
                  className="w-full mt-1.5 p-2.5 border border-slate-700/80 bg-slate-900/90 text-slate-100 rounded-xl focus:border-orange-500 outline-none font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">سکه مساوی</label>
                <input
                  type="number"
                  value={configData.drawCoinReward}
                  onChange={(e) => setConfigData({ ...configData, drawCoinReward: Number(e.target.value) })}
                  className="w-full mt-1.5 p-2.5 border border-slate-700/80 bg-slate-900/90 text-slate-100 rounded-xl focus:border-orange-500 outline-none font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">سکه باخت (پاداش همراهی)</label>
                <input
                  type="number"
                  value={configData.lossCoinReward}
                  onChange={(e) => setConfigData({ ...configData, lossCoinReward: Number(e.target.value) })}
                  className="w-full mt-1.5 p-2.5 border border-slate-700/80 bg-slate-900/90 text-slate-100 rounded-xl focus:border-orange-500 outline-none font-bold"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-bold text-sm text-slate-100 mb-3">هزینه راهنماها (سکه)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300">حذف ۲ گزینه</label>
                <input
                  type="number"
                  value={configData.hintPrices.removeTwo}
                  onChange={(e) =>
                    setConfigData({
                      ...configData,
                      hintPrices: { ...configData.hintPrices, removeTwo: Number(e.target.value) },
                    })
                  }
                  className="w-full mt-1.5 p-2 border rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">زمان اضافه</label>
                <input
                  type="number"
                  value={configData.hintPrices.extraTime}
                  onChange={(e) =>
                    setConfigData({
                      ...configData,
                      hintPrices: { ...configData.hintPrices, extraTime: Number(e.target.value) },
                    })
                  }
                  className="w-full mt-1.5 p-2 border rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">نظرسنجی تماشاگران</label>
                <input
                  type="number"
                  value={configData.hintPrices.audiencePoll}
                  onChange={(e) =>
                    setConfigData({
                      ...configData,
                      hintPrices: { ...configData.hintPrices, audiencePoll: Number(e.target.value) },
                    })
                  }
                  className="w-full mt-1.5 p-2 border rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">نکته آموزشی</label>
                <input
                  type="number"
                  value={configData.hintPrices.learningHint}
                  onChange={(e) =>
                    setConfigData({
                      ...configData,
                      hintPrices: { ...configData.hintPrices, learningHint: Number(e.target.value) },
                    })
                  }
                  className="w-full mt-1.5 p-2 border rounded-lg font-bold"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm transition"
          >
            ذخیره کلیه قوانین و اقتصاد بازی
          </button>
        </form>
      )}

      {/* تب ۴: مدیریت بازیکنان */}
      {activeTab === 'players' && (
        <div className="bg-[#0B1122] rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden space-y-4 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-100 text-sm">لیست بازیکنان و کنترل موجودی</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-800/80 text-slate-300 text-xs font-bold">
                <tr>
                  <th className="p-3">نام و مشخصات</th>
                  <th className="p-3">سطح (Level)</th>
                  <th className="p-3">XP کل</th>
                  <th className="p-3">موجودی سکه</th>
                  <th className="p-3">قلب‌ها</th>
                  <th className="p-3">برد / باخت</th>
                  <th className="p-3">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {playersData.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-900/60">
                    <td className="p-3">
                      <p className="font-bold text-slate-100">{p.user?.fullName || p.user?.username || 'ناشناس'}</p>
                      <span className="text-xs text-slate-400">{p.user?.phoneNumber || p.studentCode}</span>
                    </td>
                    <td className="p-3 font-bold text-slate-200">سطح {p.level}</td>
                    <td className="p-3 font-bold text-blue-600">{p.xp}</td>
                    <td className="p-3 font-black text-amber-500">{p.coins} 🪙</td>
                    <td className="p-3 font-bold text-rose-500">{p.hearts} ❤️</td>
                    <td className="p-3 text-xs text-slate-300">
                      <span className="text-emerald-600 font-bold">{p.wins} برد</span> /{' '}
                      <span className="text-rose-600 font-bold">{p.losses} باخت</span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => setSelectedPlayer(p)}
                        className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-lg text-xs border border-amber-200 transition"
                      >
                        تغییر سکه 🪙
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* مودال تغییر سکه */}
      {selectedPlayer && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0B1122] p-6 rounded-2xl max-w-md w-full shadow-2xl border border-slate-800 space-y-4" dir="rtl">
            <h3 className="font-black text-lg text-slate-100">تغییر حسابرسی‌شده سکه بازیکن</h3>
            <p className="text-xs text-slate-500">
              بازیکن: <span className="font-bold text-slate-200">{selectedPlayer.user?.fullName || selectedPlayer.user?.username}</span>
              {' '}| موجودی فعلی: <span className="font-black text-amber-500">{selectedPlayer.coins} سکه</span>
            </p>

            <form onSubmit={handleAdjustCoins} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300">میزان تغییر (برای کسر، منفی وارد کنید)</label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  className="w-full mt-1.5 p-2.5 border border-slate-700/80 bg-slate-900/90 text-slate-100 rounded-xl focus:border-orange-500 outline-none font-bold text-center"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">دلیل تغییر موجودی (الزامی جهت ثبت در لاگ حسابرسی)</label>
                <textarea
                  rows={3}
                  required
                  placeholder="مثال: جایزه ویژه مسابقه درون‌مدرسه‌ای، رفع باگ گزارش‌شده، ..."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full mt-1.5 p-2.5 border border-slate-700/80 bg-slate-900/90 text-slate-100 rounded-xl focus:border-orange-500 outline-none text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isAdjusting}
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm transition"
                >
                  {isAdjusting ? 'در حال ثبت...' : 'تایید و ثبت در لجر'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPlayer(null)}
                  className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/80 font-bold rounded-xl text-sm transition"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* تب ۵: مدیریت موضوعات و آیکون‌ها */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleSaveCategory} className="bg-[#0B1122] p-6 rounded-2xl border border-slate-800/80 shadow-xl space-y-5 h-fit">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white">
                {editingCatId ? '✏️ ویرایش موضوع' : '✨ ایجاد موضوع جدید'}
              </h3>
              {editingCatId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingCatId(null)
                    setCatName('')
                    setCatIcon('❓')
                    setCatColor('#7c3aed')
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-100"
                >
                  انصراف
                </button>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300">نام موضوع (نمایش در گردونه و بازی)</label>
              <input
                required
                placeholder="مثلاً: نجوم و فضا"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                className="w-full mt-1.5 p-3 border border-slate-700/80 bg-slate-900/90 text-slate-100 rounded-xl focus:border-orange-500 outline-none text-sm font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300">آیکون موضوع (انتخاب سریع یا تایپ ایموجی)</label>
              <div className="flex items-center gap-2 mt-1.5">
                <span
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border"
                  style={{ backgroundColor: `${catColor}20`, borderColor: catColor }}
                >
                  {catIcon || '❓'}
                </span>
                <input
                  value={catIcon}
                  onChange={(e) => setCatIcon(e.target.value)}
                  placeholder="ایموجی دلخواه..."
                  className="w-full p-3 border border-slate-700/80 bg-slate-900/90 text-slate-100 rounded-xl focus:border-orange-500 outline-none text-sm font-bold text-center"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {PRESET_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setCatIcon(icon)}
                    className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border transition ${
                      catIcon === icon ? 'border-orange-500 bg-orange-500/15 scale-105' : 'border-slate-800/80 hover:bg-slate-900/60'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300">رنگ اختصاصی کارت و گردونه</label>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setCatColor(color)}
                    className={`w-7 h-7 rounded-full border-2 transition ${
                      catColor === color ? 'border-slate-900 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <input
                  type="color"
                  value={catColor}
                  onChange={(e) => setCatColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingCat}
              className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl text-sm transition shadow-md shadow-orange-600/20"
            >
              {isSavingCat ? 'در حال ذخیره...' : editingCatId ? 'ذخیره تغییرات موضوع' : 'ثبت موضوع جدید'}
            </button>
          </form>

          <div className="lg:col-span-2 bg-[#0B1122] p-6 rounded-2xl border border-slate-800/80 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white">
                فهرست موضوعات کوییز ({categoriesData.length} موضوع)
              </h3>
              <span className="text-xs text-slate-500">همگام با اپلیکیشن نوکیتا</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categoriesData.map((cat) => (
                <div
                  key={cat._id}
                  className={`p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
                    cat.isActive ? 'bg-slate-900/60 border-slate-800/80' : 'bg-slate-900/40 border-slate-800/80 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border"
                      style={{ backgroundColor: `${cat.color}20`, borderColor: `${cat.color}55` }}
                    >
                      {cat.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-slate-100 truncate">{cat.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {(cat.questionCount ?? 0).toLocaleString('fa-IR')} سوال ثبت‌شده
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleCategory(cat)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                        cat.isActive ? 'bg-emerald-100 text-emerald-400' : 'bg-slate-200 text-slate-300'
                      }`}
                    >
                      {cat.isActive ? 'فعال' : 'غیرفعال'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCatId(cat._id)
                        setCatName(cat.name)
                        setCatIcon(cat.icon)
                        setCatColor(cat.color)
                      }}
                      className="p-2 rounded-lg bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 text-xs font-bold"
                      title="ویرایش"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat)}
                      className="p-2 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 text-xs font-bold"
                      title="حذف"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* تب ۶: افزودن سوال کوییز */}
      {activeTab === 'create-q' && (
        <div className="space-y-6">
          <form onSubmit={handleCreateQuestion} className="bg-[#0B1122] p-6 rounded-2xl border border-slate-800/80 shadow-xl space-y-6">
          <h3 className="text-lg font-black text-white">افزودن سوال جدید به بانک کوییز نوکیتا</h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300">متن سوال</label>
              <textarea
                rows={2}
                required
                placeholder="متن سوال را وارد نمایید..."
                value={qText}
                onChange={(e) => setQText(e.target.value)}
                className="w-full mt-1.5 p-3 border border-slate-700/80 bg-slate-900/90 text-slate-100 rounded-xl focus:border-orange-500 outline-none text-sm font-semibold"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300">گزینه ۱</label>
                <input
                  required
                  value={opt1}
                  onChange={(e) => setOpt1(e.target.value)}
                  className="w-full mt-1 p-2.5 border border-slate-700/80 bg-slate-900/90 text-slate-100 rounded-xl focus:border-orange-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300">گزینه ۲</label>
                <input
                  required
                  value={opt2}
                  onChange={(e) => setOpt2(e.target.value)}
                  className="w-full mt-1 p-2.5 border border-slate-700/80 bg-slate-900/90 text-slate-100 rounded-xl focus:border-orange-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300">گزینه ۳</label>
                <input
                  required
                  value={opt3}
                  onChange={(e) => setOpt3(e.target.value)}
                  className="w-full mt-1 p-2.5 border border-slate-700/80 bg-slate-900/90 text-slate-100 rounded-xl focus:border-orange-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300">گزینه ۴</label>
                <input
                  required
                  value={opt4}
                  onChange={(e) => setOpt4(e.target.value)}
                  className="w-full mt-1 p-2.5 border border-slate-700/80 bg-slate-900/90 text-slate-100 rounded-xl focus:border-orange-500 outline-none text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-emerald-400">پاسخ صحیح (عیناً یکی از ۴ گزینه بالا)</label>
                <select
                  required
                  value={correctOpt}
                  onChange={(e) => setCorrectOpt(e.target.value)}
                  className="w-full mt-1.5 p-2.5 border border-emerald-500/40 rounded-xl font-bold text-sm bg-emerald-950/50 text-emerald-300"
                >
                  <option value="">انتخاب پاسخ صحیح...</option>
                  {opt1 && <option value={opt1}>{opt1}</option>}
                  {opt2 && <option value={opt2}>{opt2}</option>}
                  {opt3 && <option value={opt3}>{opt3}</option>}
                  {opt4 && <option value={opt4}>{opt4}</option>}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">درجه سختی</label>
                <select
                  value={qDiff}
                  onChange={(e) => setQDiff(e.target.value)}
                  className="w-full mt-1.5 p-2.5 border border-slate-700/80 bg-slate-900/90 text-slate-100 rounded-xl focus:border-orange-500 outline-none text-sm font-bold"
                >
                  <option value="ساده">ساده</option>
                  <option value="متوسط">متوسط</option>
                  <option value="دشوار">دشوار</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">موضوع (دسته‌بندی)</label>
                <select
                  value={qCat}
                  onChange={(e) => setQCat(e.target.value)}
                  className="w-full mt-1.5 p-2.5 border border-slate-700/80 bg-slate-900/90 text-slate-100 rounded-xl focus:border-orange-500 outline-none text-sm font-bold"
                >
                  {categoriesData.length > 0 ? (
                    categoriesData.map((c) => (
                      <option key={c._id} value={c.name}>
                        {c.icon} {c.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="اطلاعات عمومی">اطلاعات عمومی</option>
                      <option value="جغرافیا">جغرافیا</option>
                      <option value="ورزشی">ورزشی</option>
                      <option value="علمی">علمی</option>
                      <option value="تاریخ">تاریخ</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300">توضیح آموزشی پاسخ (برای راهنمای بعد از پاسخ)</label>
              <textarea
                rows={2}
                placeholder="توضیح مختصر علمی یا آموزشی درباره این سوال..."
                value={qExp}
                onChange={(e) => setQExp(e.target.value)}
                className="w-full mt-1.5 p-2.5 border border-slate-700/80 bg-slate-900/90 text-slate-100 rounded-xl focus:border-orange-500 outline-none text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isCreatingQ}
            className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm transition"
          >
            {isCreatingQ ? 'در حال ایجاد...' : 'افزودن به بانک سوالات کوییز'}
          </button>
        </form>

        <div className="bg-[#0B1122] p-6 rounded-2xl border border-slate-800/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white">
              سوالات ثبت‌شده در موضوع «{qCat}» ({questionsData.length.toLocaleString('fa-IR')} سوال)
            </h3>
            <button
              type="button"
              onClick={() => loadQuestions(qCat)}
              className="text-xs font-bold text-orange-600 hover:underline"
            >
              🔄 بارگذاری مجدد
            </button>
          </div>
          {loadingQuestions ? (
            <p className="text-sm text-slate-500">در حال دریافت سوالات...</p>
          ) : questionsData.length === 0 ? (
            <p className="text-sm text-slate-400">هنوز سوالی در این موضوع ثبت نشده است.</p>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto">
              {questionsData.map((item) => (
                <div key={item._id} className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/60 flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-bold text-slate-100">{item.question}</p>
                    <p className="text-xs text-emerald-400 font-semibold">پاسخ صحیح: {item.answer}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(item._id)}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 text-xs font-bold shrink-0"
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      )}
    </div>
  )
}
