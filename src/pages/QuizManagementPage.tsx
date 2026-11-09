import React, { useState, useEffect } from 'react'
import { adminQuizService } from '../services/adminQuizService';
import type { QuizDashboardData, QuizConfigData } from '../services/adminQuizService';
import toast from 'react-hot-toast'

export default function QuizManagementPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bots' | 'rules' | 'players' | 'create-q'>('dashboard')
  const [loading, setLoading] = useState(true)

  // State
  const [dashboardData, setDashboardData] = useState<QuizDashboardData | null>(null)
  const [configData, setConfigData] = useState<QuizConfigData | null>(null)
  const [botsData, setBotsData] = useState<any>(null)
  const [playersData, setPlayersData] = useState<any[]>([])

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

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [dash, conf, bots, players] = await Promise.all([
        adminQuizService.getDashboard(),
        adminQuizService.getConfig(),
        adminQuizService.getBots(),
        adminQuizService.getPlayers(1),
      ])
      if (dash.success) setDashboardData(dash.data)
      if (conf.success) setConfigData(conf.data)
      if (bots.success) setBotsData(bots.data)
      if (players.success) setPlayersData(players.data.players || [])
    } catch (err: any) {
      toast.error('خطا در بارگذاری اطلاعات کوییز')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!configData) return
    try {
      const res = await adminQuizService.updateConfig(configData)
      if (res.success) {
        toast.success('قوانین و تنظیمات بازی با موفقیت به‌روزرسانی شد')
      }
    } catch (err: any) {
      toast.error('خطا در ذخیره تنظیمات: ' + (err.response?.data?.message || err.message))
    }
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <span className="p-2 bg-orange-100 text-orange-600 rounded-xl">🎮</span>
            مدیریت بازی و مسابقات نوکیتا (Quiz Management)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            سیستم داوری سرور، زمان‌بندی ربات‌ها، اقتصاد سکه، قلب، قوانین و مسابقات چندنفره دانش‌آموزی
          </p>
        </div>
        <button
          onClick={loadAllData}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition"
        >
          🔄 به‌روزرسانی اطلاعات
        </button>
      </div>

      {/* تب‌های ناوبری پنل */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'dashboard', label: '📊 داشبورد و آمار مسابقات' },
          { id: 'bots', label: '🤖 هوش مصنوعی و ربات‌ها' },
          { id: 'rules', label: '⚙️ قوانین و اقتصاد بازی' },
          { id: 'players', label: '👥 بازیکنان و حسابرسی سکه' },
          { id: 'create-q', label: '➕ افزودن سوال کوییز' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
              activeTab === tab.id
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                : 'text-slate-600 hover:bg-slate-100'
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
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400">کل مسابقات برگزار شده</span>
              <p className="text-3xl font-black text-slate-800 mt-2">{dashboardData.totalMatches.toLocaleString('fa-IR')}</p>
              <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">
                {dashboardData.completedMatches} مسابقه کامل شده
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400">نسبت بازی با ربات</span>
              <p className="text-3xl font-black text-orange-600 mt-2">
                {dashboardData.botMatchPercentage}%
              </p>
              <span className="text-xs text-slate-500 font-semibold mt-1 inline-block">
                {dashboardData.botMatches} مچ ربات | {dashboardData.humanMatches} مچ کاربر
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400">کل بازیکنان فعال</span>
              <p className="text-3xl font-black text-blue-600 mt-2">{dashboardData.totalPlayers.toLocaleString('fa-IR')}</p>
              <span className="text-xs text-slate-500 font-semibold mt-1 inline-block">پروفایل‌های دانش‌آموزی</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400">تراکنش‌های سکه</span>
              <p className="text-3xl font-black text-amber-500 mt-2">
                {dashboardData.coinTransactionsSummary.reduce((acc, curr) => acc + curr.count, 0)}
              </p>
              <span className="text-xs text-slate-500 font-semibold mt-1 inline-block">تراکنش ثبت‌شده در لجر</span>
            </div>
          </div>

          {/* آخرین مسابقات */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
              <h3 className="font-black text-slate-800 text-sm">آخرین مسابقات برگزار شده</h3>
              <span className="text-xs text-slate-500">۱۰ مسابقه اخیر</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-100 text-slate-600 text-xs font-bold">
                  <tr>
                    <th className="p-3">شناسه مچ</th>
                    <th className="p-3">حالت</th>
                    <th className="p-3">بازیکن اول</th>
                    <th className="p-3">بازیکن دوم / حریف</th>
                    <th className="p-3">وضعیت</th>
                    <th className="p-3">برنده</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dashboardData.recentMatches.map((m) => (
                    <tr key={m._id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-xs text-slate-500">{m.matchId.slice(0, 16)}...</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 font-bold">
                          {m.mode}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-800">
                        {m.player1.username} ({m.player1.score} امتیاز)
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-slate-800">
                          {m.player2.username} {m.player2.isBot && <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded mr-1">ربات</span>}
                        </span>{' '}
                        ({m.player2.score} امتیاز)
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          m.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
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

      {/* تب ۲: تنظیمات و هوش مصنوعی ربات‌ها */}
      {activeTab === 'bots' && configData && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-800">توزیع شانس انتخاب درجه سختی ربات‌ها</h3>
            <p className="text-xs text-slate-500 mt-1">
              در صورت گذشت ۱۰ ثانیه بدون یافتن حریف انسانی، ربات با این درصدها انتخاب می‌شود (مجموع باید ۱۰۰ باشد).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <label className="text-xs font-bold text-emerald-800">درصد ربات‌های ساده (Easy)</label>
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
                  className="w-20 p-2 border rounded-lg text-center font-bold"
                />
                <span className="text-sm font-bold text-emerald-700">درصد (پیش‌فرض: ۷۰٪)</span>
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <label className="text-xs font-bold text-amber-800">درصد ربات‌های متوسط (Medium)</label>
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
                  className="w-20 p-2 border rounded-lg text-center font-bold"
                />
                <span className="text-sm font-bold text-amber-700">درصد (پیش‌فرض: ۲۵٪)</span>
              </div>
            </div>

            <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
              <label className="text-xs font-bold text-rose-800">درصد ربات‌های سخت (Hard)</label>
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
                  className="w-20 p-2 border rounded-lg text-center font-bold"
                />
                <span className="text-sm font-bold text-rose-700">درصد (پیش‌فرض: ۵٪)</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-bold text-sm text-slate-800 mb-3">ربات‌های فعال در سیستم</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {botsData?.roster?.map((bot: any) => (
                <div key={bot.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
                    {bot.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-xs text-slate-800">{bot.name}</p>
                    <span className="text-[10px] text-slate-400">سطح: {bot.difficulty}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSaveConfig}
            className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm transition"
          >
            ذخیره تنظیمات ربات‌ها
          </button>
        </div>
      )}

      {/* تب ۳: قوانین و اقتصاد */}
      {activeTab === 'rules' && configData && (
        <form onSubmit={handleSaveConfig} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-lg font-black text-slate-800">قوانین مسابقه و پارامترهای اقتصادی</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-xs font-bold text-slate-600">تعداد راندهای هر مسابقه</label>
              <input
                type="number"
                min="1"
                max="6"
                value={configData.roundsPerMatch}
                onChange={(e) => setConfigData({ ...configData, roundsPerMatch: Number(e.target.value) })}
                className="w-full mt-1.5 p-2.5 border rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600">تعداد سوال در هر راند</label>
              <input
                type="number"
                min="1"
                max="5"
                value={configData.questionsPerRound}
                onChange={(e) => setConfigData({ ...configData, questionsPerRound: Number(e.target.value) })}
                className="w-full mt-1.5 p-2.5 border rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600">ثانیه تایمر هر سوال</label>
              <input
                type="number"
                min="5"
                max="30"
                value={configData.questionTimerSeconds}
                onChange={(e) => setConfigData({ ...configData, questionTimerSeconds: Number(e.target.value) })}
                className="w-full mt-1.5 p-2.5 border rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600">حداکثر ظرفیت قلب (جان)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={configData.maxHearts}
                onChange={(e) => setConfigData({ ...configData, maxHearts: Number(e.target.value) })}
                className="w-full mt-1.5 p-2.5 border rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600">فاصله بازیابی هر قلب (دقیقه)</label>
              <input
                type="number"
                min="1"
                max="120"
                value={configData.heartRegenMinutes}
                onChange={(e) => setConfigData({ ...configData, heartRegenMinutes: Number(e.target.value) })}
                className="w-full mt-1.5 p-2.5 border rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600">زمان انتظار برای حریف انسانی قبل از ربات (ثانیه)</label>
              <input
                type="number"
                min="5"
                max="30"
                value={configData.matchmakingTimeoutSeconds}
                onChange={(e) => setConfigData({ ...configData, matchmakingTimeoutSeconds: Number(e.target.value) })}
                className="w-full mt-1.5 p-2.5 border rounded-xl font-bold"
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-bold text-sm text-slate-800 mb-3">جوایز مسابقه (سکه‌ها و XP)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-xs font-bold text-slate-600">سکه پیروزی (برد)</label>
                <input
                  type="number"
                  value={configData.winCoinReward}
                  onChange={(e) => setConfigData({ ...configData, winCoinReward: Number(e.target.value) })}
                  className="w-full mt-1.5 p-2.5 border rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600">سکه مساوی</label>
                <input
                  type="number"
                  value={configData.drawCoinReward}
                  onChange={(e) => setConfigData({ ...configData, drawCoinReward: Number(e.target.value) })}
                  className="w-full mt-1.5 p-2.5 border rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600">سکه باخت (پاداش همراهی)</label>
                <input
                  type="number"
                  value={configData.lossCoinReward}
                  onChange={(e) => setConfigData({ ...configData, lossCoinReward: Number(e.target.value) })}
                  className="w-full mt-1.5 p-2.5 border rounded-xl font-bold"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-bold text-sm text-slate-800 mb-3">هزینه راهنماها (سکه)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600">حذف ۲ گزینه</label>
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
                <label className="text-xs font-bold text-slate-600">زمان اضافه</label>
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
                <label className="text-xs font-bold text-slate-600">نظرسنجی تماشاگران</label>
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
                <label className="text-xs font-bold text-slate-600">نکته آموزشی</label>
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-800 text-sm">لیست بازیکنان و کنترل موجودی</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-100 text-slate-600 text-xs font-bold">
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
              <tbody className="divide-y divide-slate-100">
                {playersData.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <p className="font-bold text-slate-800">{p.user?.fullName || p.user?.username || 'ناشناس'}</p>
                      <span className="text-xs text-slate-400">{p.user?.phoneNumber || p.studentCode}</span>
                    </td>
                    <td className="p-3 font-bold text-slate-700">سطح {p.level}</td>
                    <td className="p-3 font-bold text-blue-600">{p.xp}</td>
                    <td className="p-3 font-black text-amber-500">{p.coins} 🪙</td>
                    <td className="p-3 font-bold text-rose-500">{p.hearts} ❤️</td>
                    <td className="p-3 text-xs text-slate-600">
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
          <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl border space-y-4" dir="rtl">
            <h3 className="font-black text-lg text-slate-800">تغییر حسابرسی‌شده سکه بازیکن</h3>
            <p className="text-xs text-slate-500">
              بازیکن: <span className="font-bold text-slate-700">{selectedPlayer.user?.fullName || selectedPlayer.user?.username}</span>
              {' '}| موجودی فعلی: <span className="font-black text-amber-500">{selectedPlayer.coins} سکه</span>
            </p>

            <form onSubmit={handleAdjustCoins} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600">میزان تغییر (برای کسر، منفی وارد کنید)</label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  className="w-full mt-1.5 p-2.5 border rounded-xl font-bold text-center"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600">دلیل تغییر موجودی (الزامی جهت ثبت در لاگ حسابرسی)</label>
                <textarea
                  rows={3}
                  required
                  placeholder="مثال: جایزه ویژه مسابقه درون‌مدرسه‌ای، رفع باگ گزارش‌شده، ..."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full mt-1.5 p-2.5 border rounded-xl text-xs"
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
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* تب ۵: افزودن سوال کوییز */}
      {activeTab === 'create-q' && (
        <form onSubmit={handleCreateQuestion} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-lg font-black text-slate-800">افزودن سوال جدید به بانک کوییز نوکیتا</h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600">متن سوال</label>
              <textarea
                rows={2}
                required
                placeholder="متن سوال را وارد نمایید..."
                value={qText}
                onChange={(e) => setQText(e.target.value)}
                className="w-full mt-1.5 p-3 border rounded-xl text-sm font-semibold"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600">گزینه ۱</label>
                <input
                  required
                  value={opt1}
                  onChange={(e) => setOpt1(e.target.value)}
                  className="w-full mt-1 p-2.5 border rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">گزینه ۲</label>
                <input
                  required
                  value={opt2}
                  onChange={(e) => setOpt2(e.target.value)}
                  className="w-full mt-1 p-2.5 border rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">گزینه ۳</label>
                <input
                  required
                  value={opt3}
                  onChange={(e) => setOpt3(e.target.value)}
                  className="w-full mt-1 p-2.5 border rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">گزینه ۴</label>
                <input
                  required
                  value={opt4}
                  onChange={(e) => setOpt4(e.target.value)}
                  className="w-full mt-1 p-2.5 border rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-emerald-700">پاسخ صحیح (عیناً یکی از ۴ گزینه بالا)</label>
                <select
                  required
                  value={correctOpt}
                  onChange={(e) => setCorrectOpt(e.target.value)}
                  className="w-full mt-1.5 p-2.5 border border-emerald-300 rounded-xl font-bold text-sm bg-emerald-50 text-emerald-900"
                >
                  <option value="">انتخاب پاسخ صحیح...</option>
                  {opt1 && <option value={opt1}>{opt1}</option>}
                  {opt2 && <option value={opt2}>{opt2}</option>}
                  {opt3 && <option value={opt3}>{opt3}</option>}
                  {opt4 && <option value={opt4}>{opt4}</option>}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600">درجه سختی</label>
                <select
                  value={qDiff}
                  onChange={(e) => setQDiff(e.target.value)}
                  className="w-full mt-1.5 p-2.5 border rounded-xl text-sm font-bold"
                >
                  <option value="ساده">ساده</option>
                  <option value="متوسط">متوسط</option>
                  <option value="دشوار">دشوار</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600">دسته‌بندی</label>
                <select
                  value={qCat}
                  onChange={(e) => setQCat(e.target.value)}
                  className="w-full mt-1.5 p-2.5 border rounded-xl text-sm font-bold"
                >
                  <option value="عمومی">اطلاعات عمومی</option>
                  <option value="علوم">علوم تجربی</option>
                  <option value="ریاضی">ریاضی و هوش</option>
                  <option value="ادبیات">ادبیات و فارسی</option>
                  <option value="تاریخ">تاریخ و جغرافیا</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600">توضیح آموزشی پاسخ (برای راهنمای بعد از پاسخ)</label>
              <textarea
                rows={2}
                placeholder="توضیح مختصر علمی یا آموزشی درباره این سوال..."
                value={qExp}
                onChange={(e) => setQExp(e.target.value)}
                className="w-full mt-1.5 p-2.5 border rounded-xl text-xs"
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
      )}
    </div>
  )
}
