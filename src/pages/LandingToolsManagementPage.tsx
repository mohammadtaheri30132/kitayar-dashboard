import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import {
  fetchLandingToolsConfig,
  updateLandingToolsConfig,
  type LandingToolsConfigData,
} from '../services/landingToolsAdminService'

interface ToolItemInfo {
  id: string
  title: string
  subtitle: string
  category: string
  icon: string
  color: string
}

const ALL_AVAILABLE_TOOLS: ToolItemInfo[] = [
  // 1. فایل و اسناد
  {
    id: 'format-converter',
    title: 'تبدیل فرمت فایل',
    subtitle: 'تبدیل پسوند انواع عکس و سند به یکدیگر و ساخت PDF',
    category: 'فایل و اسناد',
    icon: '🔄',
    color: '#2563EB',
  },
  {
    id: 'photo-scanner',
    title: 'تبدیل عکس به اسکن',
    subtitle: 'حذف سایه، اصلاح زاویه و شفاف‌سازی برگه‌های امتحانی برای چاپ',
    category: 'فایل و اسناد',
    icon: '📄',
    color: '#059669',
  },
  {
    id: 'file-compressor',
    title: 'کاهش حجم فایل و تصویر',
    subtitle: 'فشرده‌سازی هوشمند بدون افت کیفیت جهت ارسال در شاد و ایتا',
    category: 'فایل و اسناد',
    icon: '🗜️',
    color: '#D97706',
  },
  {
    id: 'image-resize-crop',
    title: 'تغییر ابعاد و برش تصویر',
    subtitle: 'تنظیم دقیق رزولوشن و کادربندی عکس‌های آموزشی',
    category: 'فایل و اسناد',
    icon: '✂️',
    color: '#7C3AED',
  },
  {
    id: 'collage-maker',
    title: 'ترکیب عکس‌ها (کلاژ)',
    subtitle: 'کنار هم قرار دادن چند برگه در یک کادر',
    category: 'فایل و اسناد',
    icon: '🖼️',
    color: '#EC4899',
  },

  // 2. کلاس و تدریس
  {
    id: 'classroom-whiteboard',
    title: 'تخته وایت‌برد هوشمند',
    subtitle: 'بوم نقاشی و یادداشت سریع با رسم اشکال هندسی',
    category: 'کلاس درس',
    icon: '🎨',
    color: '#6366F1',
  },
  {
    id: 'random-student-picker',
    title: 'انتخاب تصادفی دانش‌آموز',
    subtitle: 'گردونه شانس کلاسی برای پرسش عادلانه از دانش‌آموزان',
    category: 'کلاس درس',
    icon: '🎲',
    color: '#EC4899',
  },
  {
    id: 'group-divider',
    title: 'تقسیم گروه‌های کلاسی',
    subtitle: 'تیم‌بندی هوشمند و تصادفی برای فعالیت‌های گروهی',
    category: 'کلاس درس',
    icon: '👥',
    color: '#06B6D4',
  },
  {
    id: 'classroom-timer-stopwatch',
    title: 'تایمر و زمان‌سنج کلاسی',
    subtitle: 'شمارش معکوس زمان آزمون و کرنومتر کلاسی',
    category: 'کلاس درس',
    icon: '⏱️',
    color: '#F97316',
  },

  // 3. محاسبه‌گرها
  {
    id: 'calc-grades-tool',
    title: 'محاسبه‌گر نمرات و معدل',
    subtitle: 'معدل وزنی، درصد قبولی و نمره آزمون با نمره منفی',
    category: 'محاسبه‌گرها',
    icon: '🏆',
    color: '#3B82F6',
  },
  {
    id: 'calc-percent-tool',
    title: 'محاسبه‌گر درصد و تخفیف',
    subtitle: 'درصد یک عدد، درصد افزایش و کاهش و تخفیف شهریه',
    category: 'محاسبه‌گرها',
    icon: '٪',
    color: '#F43F5E',
  },
  {
    id: 'calc-geometry-tool',
    title: 'مساحت، محیط و حجم اشکال',
    subtitle: 'فرمول‌های هندسی دایره، مثلث، استوانه و مخروط',
    category: 'محاسبه‌گرها',
    icon: '📐',
    color: '#8B5CF6',
  },
  {
    id: 'calc-sport-bmi',
    title: 'شاخص توده بدنی (BMI)',
    subtitle: 'محاسبه تناسب قد و وزن دانش‌آموزان',
    category: 'محاسبه‌گرها',
    icon: '🏃',
    color: '#10B981',
  },
  {
    id: 'calc-numeric-converter',
    title: 'عدد به حروف و تبدیل مبناها',
    subtitle: 'تبدیل ارقام به حروف فارسی و مبناهای ۲، ۸، ۱۶',
    category: 'محاسبه‌گرها',
    icon: '#️⃣',
    color: '#64748B',
  },

  // 4. تبدیل واحد و زمان
  {
    id: 'unit-converter-tool',
    title: 'تبدیل جامع واحدهای علمی',
    subtitle: 'طول، وزن، دما، حجم، مساحت، سرعت و فشار',
    category: 'تبدیل واحد',
    icon: '⚖️',
    color: '#F97316',
  },
  {
    id: 'date-converter-tool',
    title: 'تبدیل تاریخ شمسی و میلادی',
    subtitle: 'تبدیل دقیق تقویم خورشیدی و میلادی',
    category: 'تاریخ و زمان',
    icon: '📅',
    color: '#A855F7',
  },
  {
    id: 'date-diff-age',
    title: 'محاسبه سن دقیق و اختلاف تاریخ‌ها',
    subtitle: 'محاسبه سال، ماه و روز گذشته از تولد',
    category: 'تاریخ و زمان',
    icon: '⏳',
    color: '#0284C7',
  },

  // 5. سخت‌افزار و بارکد
  {
    id: 'barcode-qr-generator',
    title: 'ساخت بارکد و QR Code',
    subtitle: 'تولید کیوآرکد لینک آزمون و تکالیف برای اسکن با گوشی',
    category: 'بارکد و ارتباطات',
    icon: '🏁',
    color: '#0284C7',
  },
]

export default function LandingToolsManagementPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sectionTitle, setSectionTitle] = useState('جعبه‌ابزار کاربردی معلمان در وب')
  const [sectionSubtitle, setSectionSubtitle] = useState(
    'مجموعه ابزارهای هوشمند تحت وب برای تبدیل فرمت فایل‌ها، اسکن و شفاف‌سازی برگه‌های امتحانی و کاهش حجم اسناد بدون افت کیفیت.'
  )
  const [featuredIds, setFeaturedIds] = useState<string[]>([
    'format-converter',
    'photo-scanner',
    'file-compressor',
  ])
  const [filterCategory, setFilterCategory] = useState<string>('all')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const res = await fetchLandingToolsConfig()
      if (res.success && res.data) {
        if (res.data.sectionTitle) setSectionTitle(res.data.sectionTitle)
        if (res.data.sectionSubtitle) setSectionSubtitle(res.data.sectionSubtitle)
        if (Array.isArray(res.data.featuredToolIds) && res.data.featuredToolIds.length > 0) {
          setFeaturedIds(res.data.featuredToolIds)
        }
      }
    } catch (err: any) {
      console.error('Failed to load landing tools settings:', err)
      toast.error('خطا در دریافت تنظیمات ابزارهای صفحه اصلی')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (featuredIds.length === 0) {
      toast.error('حداقل یک ابزار باید برای نمایش در صفحه اصلی انتخاب شود')
      return
    }

    try {
      setSaving(true)
      const res = await updateLandingToolsConfig({
        sectionTitle: sectionTitle.trim(),
        sectionSubtitle: sectionSubtitle.trim(),
        featuredToolIds: featuredIds,
      })

      if (res.success) {
        toast.success('تنظیمات ابزارهای صفحه اصلی با موفقیت ذخیره شد ✅')
      } else {
        toast.error(res.message || 'خطا در ذخیره تنظیمات')
      }
    } catch (err: any) {
      console.error('Error saving settings:', err)
      toast.error('خطا در برقراری ارتباط با سرور')
    } finally {
      setSaving(false)
    }
  }

  const toggleTool = (toolId: string) => {
    setFeaturedIds((prev) => {
      if (prev.includes(toolId)) {
        return prev.filter((id) => id !== toolId)
      } else {
        return [...prev, toolId]
      }
    })
  }

  const moveUp = (index: number) => {
    if (index === 0) return
    setFeaturedIds((prev) => {
      const copy = [...prev]
      const temp = copy[index - 1]
      copy[index - 1] = copy[index]
      copy[index] = temp
      return copy
    })
  }

  const moveDown = (index: number) => {
    if (index === featuredIds.length - 1) return
    setFeaturedIds((prev) => {
      const copy = [...prev]
      const temp = copy[index + 1]
      copy[index + 1] = copy[index]
      copy[index] = temp
      return copy
    })
  }

  const resetToDefault = () => {
    setFeaturedIds(['format-converter', 'photo-scanner', 'file-compressor'])
    setSectionTitle('جعبه‌ابزار کاربردی معلمان در وب')
    setSectionSubtitle(
      'مجموعه ابزارهای هوشمند تحت وب برای تبدیل فرمت فایل‌ها، اسکن و شفاف‌سازی برگه‌های امتحانی و کاهش حجم اسناد بدون افت کیفیت.'
    )
    toast('تنظیمات به حالت پیش‌فرض بازنشانی شد', { icon: '🔄' })
  }

  const categories = ['all', 'فایل و اسناد', 'کلاس درس', 'محاسبه‌گرها', 'تبدیل واحد', 'تاریخ و زمان', 'بارکد و ارتباطات']

  const filteredCatalog = ALL_AVAILABLE_TOOLS.filter((t) => {
    if (filterCategory === 'all') return true
    return t.category === filterCategory
  })

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs">در حال بارگذاری تنظیمات ابزارهای صفحه اصلی...</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-slate-100" dir="rtl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 shadow-xl backdrop-blur-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold mb-2">
            <span>🧰</span>
            <span>ویترین ابزارهای دستیار معلم در kitayar.ir</span>
          </div>
          <h1 className="text-xl font-black text-white">مدیریت ابزارهای صفحه اصلی وب‌سایت</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
            تعیین کنید کدام ابزارها در بخش ویترین صفحه اصلی وب‌سایت به کاربران نمایش داده شوند. کاربران با کلیک روی هر ابزار مستقیماً به آن ابزار در پنل هدایت می‌شوند (نیازمند ورود).
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={resetToDefault}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
          >
            پیش‌فرض (۳ ابزار)
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/25 transition active:scale-95 disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
          >
            <span>{saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات صفحه اصلی'}</span>
          </button>
        </div>
      </div>

      {/* Title & Subtitle Settings */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-3xl p-6 shadow-xl backdrop-blur-xl space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <span>✏️</span>
          <span>عناوین نمایشی بخش ابزارها در صفحه اصلی</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">عنوان اصلی بخش:</label>
            <input
              type="text"
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">توضیح زیر عنوان:</label>
            <input
              type="text"
              value={sectionSubtitle}
              onChange={(e) => setSectionSubtitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Currently Featured Tools on Landing (Active list & ordering) */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-3xl p-6 shadow-xl backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black text-white">
              ابزارهای فعال در صفحه اصلی ({featuredIds.length} ابزار)
            </h2>
            <span className="text-[11px] text-slate-400">
              (توصیه: ۳ الی ۶ ابزار برای چیدمان زیبا)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {featuredIds.map((id, index) => {
            const tool = ALL_AVAILABLE_TOOLS.find((t) => t.id === id)
            if (!tool) return null

            return (
              <div
                key={id}
                className="bg-slate-950/80 border border-indigo-500/40 rounded-2xl p-4 flex flex-col justify-between shadow-md relative group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{tool.icon}</span>
                    <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                      موقعیت {index + 1}
                    </span>
                  </div>
                  <h3 className="font-black text-xs text-white mb-1">{tool.title}</h3>
                  <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                    {tool.subtitle}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveUp(index)}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition cursor-pointer text-xs"
                      title="حرکت به راست / بالاتر"
                    >
                      ▶️
                    </button>
                    <button
                      type="button"
                      disabled={index === featuredIds.length - 1}
                      onClick={() => moveDown(index)}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition cursor-pointer text-xs"
                      title="حرکت به چپ / پایین‌تر"
                    >
                      ◀️
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleTool(id)}
                    className="text-[11px] font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1 rounded-lg border border-rose-500/30 transition cursor-pointer"
                  >
                    حذف از صفحه اصلی
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Catalog of all available tools to pick from */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-3xl p-6 shadow-xl backdrop-blur-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-black text-white flex items-center gap-2">
            <span>📚</span>
            <span>انتخاب از میان تمام ابزارهای سامانه معلم</span>
          </h2>

          {/* Category filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  filterCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {cat === 'all' ? 'همه' : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filteredCatalog.map((tool) => {
            const isFeatured = featuredIds.includes(tool.id)

            return (
              <div
                key={tool.id}
                onClick={() => toggleTool(tool.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  isFeatured
                    ? 'bg-indigo-950/40 border-indigo-500/60 shadow-md ring-1 ring-indigo-500/30'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-950/80'
                }`}
              >
                <span className="text-2xl shrink-0 mt-0.5">{tool.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-black text-xs text-white truncate">{tool.title}</h3>
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={() => {}}
                      className="rounded accent-indigo-600 cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                    {tool.subtitle}
                  </p>
                  <span className="text-[10px] text-slate-500 mt-2 block">
                    دسته‌بندی: {tool.category}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

