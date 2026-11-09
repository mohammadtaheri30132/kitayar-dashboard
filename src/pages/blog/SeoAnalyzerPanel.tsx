import React, { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Smartphone,
  Monitor,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Sparkles,
  Share2,
  ShieldCheck,
  HelpCircle,
  Plus,
  Trash2,
  Image as ImageIcon,
} from './BlogIcons'
import type { BlogFaqItem, BlogPostSeo } from '../../services/blogAdminService'
import WordPressMediaLibrary from './WordPressMediaLibrary'

interface Props {
  title: string
  slug: string
  excerpt: string
  content: string
  category: string
  coverImage: string
  coverImageAlt: string
  seo: BlogPostSeo
  faqs: BlogFaqItem[]
  siteNameSuffix?: string
  titleSeparator?: string
  onChangeSeo: (next: BlogPostSeo) => void
  onChangeFaqs: (next: BlogFaqItem[]) => void
  onAutoFillExcerptAndTags?: (generatedExcerpt: string, suggestedTags: string[]) => void
}

interface SeoCheckResult {
  id: string
  label: string
  status: 'good' | 'warn' | 'bad'
  detail: string
  points: number
  maxPoints: number
}

function stripHtmlPlain(html: string): string {
  return (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export const SeoAnalyzerPanel: React.FC<Props> = ({
  title,
  slug,
  excerpt,
  content,
  category,
  coverImage,
  coverImageAlt,
  seo,
  faqs,
  siteNameSuffix = 'کیتایار',
  titleSeparator = '|',
  onChangeSeo,
  onChangeFaqs,
  onAutoFillExcerptAndTags,
}) => {
  const [subTab, setSubTab] = useState<'general' | 'social' | 'technical' | 'faq'>('general')
  const [serpMode, setSerpMode] = useState<'mobile' | 'desktop'>('mobile')
  const [ogPickerOpen, setOgPickerOpen] = useState(false)

  const effectiveMetaTitle =
    seo.metaTitle?.trim() ||
    (title ? `${title} ${titleSeparator} ${siteNameSuffix}` : `عنوان مقاله ${titleSeparator} ${siteNameSuffix}`)
  const effectiveMetaDesc =
    seo.metaDescription?.trim() ||
    excerpt?.trim() ||
    stripHtmlPlain(content).slice(0, 155) ||
    'توضیحات متا برای نمایش در نتایج جستجوی گوگل در این قسمت قرار می‌گیرد...'

  const analysis = useMemo(() => {
    const kw = (seo.focusKeyword || '').trim().toLowerCase()
    const plain = stripHtmlPlain(content)
    const plainLower = plain.toLowerCase()
    const words = plain ? plain.split(/\s+/) : []
    const wordCount = words.length

    // Extract first paragraph text
    const firstParaMatch = (content || '').match(/<p[^>]*>([\s\S]*?)<\/p>/i)
    const firstPara = stripHtmlPlain(firstParaMatch ? firstParaMatch[1] : plain.slice(0, 350)).toLowerCase()

    // Extract headings H2/H3
    const headingMatches = (content || '').match(/<h[23][^>]*>[\s\S]*?<\/h[23]>/gi) || []
    const headingsText = headingMatches.map((h) => stripHtmlPlain(h).toLowerCase()).join(' ')
    const linkMatches = (content || '').match(/<a\b[^>]*>/gi) || []

    const checks: SeoCheckResult[] = []

    // 1. Focus keyword presence
    if (!kw) {
      checks.push({
        id: 'kw-set',
        label: 'تعیین کلمه کلیدی کانونی',
        status: 'bad',
        detail: 'هنوز کلمه کلیدی کانونی تعیین نشده است (مثلاً: طراحی آزمون استاندارد).',
        points: 0,
        maxPoints: 15,
      })
    } else {
      checks.push({
        id: 'kw-set',
        label: 'تعیین کلمه کلیدی کانونی',
        status: 'good',
        detail: `کلمه کلیدی «${seo.focusKeyword}» فعال است.`,
        points: 15,
        maxPoints: 15,
      })
    }

    // 2. Keyword in Title / Meta Title
    const inTitle =
      kw &&
      (title.toLowerCase().includes(kw) || effectiveMetaTitle.toLowerCase().includes(kw))
    checks.push({
      id: 'kw-title',
      label: 'حضور کلمه کلیدی در عنوان سئو (Title)',
      status: !kw ? 'warn' : inTitle ? 'good' : 'bad',
      detail: inTitle
        ? 'کلمه کلیدی در عنوان صفحه به کار رفته است.'
        : 'کلمه کلیدی کانونی را در عنوان مقاله یا عنوان سئو قرار دهید.',
      points: inTitle ? 12 : 0,
      maxPoints: 12,
    })

    // 3. Meta Title Length (35 - 65 chars)
    const titleLen = effectiveMetaTitle.length
    const titleGood = titleLen >= 35 && titleLen <= 65
    checks.push({
      id: 'title-len',
      label: 'طول استاندارد عنوان سئو',
      status: titleGood ? 'good' : titleLen > 0 ? 'warn' : 'bad',
      detail: `طول فعلی ${titleLen} کاراکتر است (بازه طلایی گوگل: ۳۵ تا ۶۵ کاراکتر).`,
      points: titleGood ? 10 : titleLen >= 20 ? 5 : 0,
      maxPoints: 10,
    })

    // 4. Meta Description Length & Keyword (110 - 165 chars)
    const descLen = effectiveMetaDesc.length
    const descHasKw = kw && effectiveMetaDesc.toLowerCase().includes(kw)
    const descLenGood = descLen >= 110 && descLen <= 165
    checks.push({
      id: 'meta-desc',
      label: 'توضیحات متا (Meta Description) و کلمه کلیدی',
      status: descLenGood && (!kw || descHasKw) ? 'good' : descLen >= 70 ? 'warn' : 'bad',
      detail: descLenGood
        ? descHasKw || !kw
          ? `طول توضیحات متا (${descLen} کاراکتر) عالی و بهینه است.`
          : `طول عالی است ولی کلمه کلیدی را هم در توضیحات متا بیاورید.`
        : `طول فعلی ${descLen} کاراکتر است (بازه پیشنهادی: ۱۱۰ تا ۱۶۰ کاراکتر).`,
      points: (descLenGood ? 7 : descLen >= 70 ? 4 : 0) + (descHasKw ? 5 : 0),
      maxPoints: 12,
    })

    // 5. Keyword in First Paragraph
    const inFirstPara = kw && firstPara.includes(kw)
    checks.push({
      id: 'kw-intro',
      label: 'کلمه کلیدی در پاراگراف اول مقدمه',
      status: !kw ? 'warn' : inFirstPara ? 'good' : 'warn',
      detail: inFirstPara
        ? 'عالی! موتورهای جستجو موضوع مقاله را در همان پاراگراف اول تشخیص می‌دهند.'
        : 'پیشنهاد می‌شود کلمه کلیدی کانونی در ۱۰۰ کلمه اول متن ذکر شود.',
      points: inFirstPara ? 10 : 3,
      maxPoints: 10,
    })

    // 6. Subheadings H2/H3 structure
    const hasHeadings = headingMatches.length >= 2
    const kwInHeadings = kw && headingsText.includes(kw)
    checks.push({
      id: 'headings',
      label: 'ساختار زیرعنوان‌ها (H2 و H3)',
      status: hasHeadings && (!kw || kwInHeadings) ? 'good' : headingMatches.length >= 1 ? 'warn' : 'bad',
      detail:
        headingMatches.length === 0
          ? 'هیچ زیرعنوان H2 یا H3 در مقاله وجود ندارد.'
          : kw && !kwInHeadings
          ? `${headingMatches.length} زیرعنوان دارید؛ بهتر است کلمه کلیدی در یکی از آن‌ها باشد.`
          : `${headingMatches.length} زیرعنوان استاندارد و بهینه یافت شد.`,
      points: (hasHeadings ? 7 : headingMatches.length === 1 ? 4 : 0) + (kwInHeadings ? 4 : 0),
      maxPoints: 11,
    })

    // 7. Word Count Depth
    checks.push({
      id: 'word-count',
      label: 'جامعیت و طول محتوای مقاله',
      status: wordCount >= 300 ? 'good' : wordCount >= 150 ? 'warn' : 'bad',
      detail:
        wordCount >= 300
          ? `متن شما ${wordCount} کلمه است (استاندارد سئو بالای ۳۰۰ کلمه).`
          : `متن فعلی ${wordCount} کلمه است؛ مقالات بالای ۳۰۰ کلمه رتبه بهتری در گوگل می‌گیرند.`,
      points: wordCount >= 300 ? 12 : wordCount >= 150 ? 6 : 2,
      maxPoints: 12,
    })

    // 8. Slug Optimization
    const decodedSlug = decodeURIComponent(slug || '')
    const slugClean = decodedSlug.length > 2 && decodedSlug.length <= 75
    checks.push({
      id: 'slug',
      label: 'آدرس یکتا و خوانای مقاله (URL Slug)',
      status: slugClean ? 'good' : 'warn',
      detail: slugClean
        ? 'نامک (Slug) کوتاه و استاندارد است.'
        : 'یک نامک کوتاه و بامعنا برای آدرس مقاله وارد کنید.',
      points: slugClean ? 6 : 2,
      maxPoints: 6,
    })

    // 9. Featured Image + Alt tag
    const hasCoverAndAlt = Boolean(coverImage?.trim() && coverImageAlt?.trim())
    checks.push({
      id: 'image-alt',
      label: 'تصویر شاخص و تگ جایگزین (Image Alt)',
      status: hasCoverAndAlt ? 'good' : coverImage?.trim() ? 'warn' : 'bad',
      detail: hasCoverAndAlt
        ? 'تصویر شاخص به همراه متن جایگزین سئو تنظیم شده است.'
        : coverImage?.trim()
        ? 'تصویر شاخص انتخاب شده اما فیلد Alt آن خالی است.'
        : 'انتخاب تصویر شاخص نرخ کلیک (CTR) را دو برابر می‌کند.',
      points: hasCoverAndAlt ? 6 : coverImage?.trim() ? 3 : 0,
      maxPoints: 6,
    })

    // 10. Internal Links & FAQ Rich Schema
    const hasRichExtras = linkMatches.length >= 1 || faqs.length >= 1
    checks.push({
      id: 'extras',
      label: 'لینک‌سازی داخلی و اسکیمای سوالات متداول (FAQ)',
      status: linkMatches.length >= 1 && faqs.length >= 1 ? 'good' : hasRichExtras ? 'warn' : 'bad',
      detail: `لینک‌های داخل متن: ${linkMatches.length} | سوالات متداول سئو: ${faqs.length}`,
      points: (linkMatches.length >= 1 ? 3 : 0) + (faqs.length >= 1 ? 3 : 0),
      maxPoints: 6,
    })

    const totalScore = Math.min(
      100,
      checks.reduce((acc, c) => acc + c.points, 0)
    )

    // Keyword density
    let density = 0
    if (kw && wordCount > 0) {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const matches = plainLower.match(new RegExp(escaped, 'g'))
      const kwWords = kw.split(/\s+/).length
      density = Number(((((matches?.length || 0) * kwWords) / wordCount) * 100).toFixed(1))
    }

    return { checks, totalScore, density }
  }, [title, slug, excerpt, content, coverImage, coverImageAlt, seo, faqs, effectiveMetaTitle, effectiveMetaDesc])

  // Keep seo.seoScore synced when score changes
  useEffect(() => {
    if ((seo.seoScore || 0) !== analysis.totalScore) {
      onChangeSeo({ ...seo, seoScore: analysis.totalScore })
    }
  }, [analysis.totalScore])

  const handleSmartAutoGenerate = () => {
    const plain = stripHtmlPlain(content)
    const generatedMetaTitle = title ? `${title} ${titleSeparator} ${siteNameSuffix}` : ''
    const generatedDesc =
      excerpt?.trim() || (plain ? plain.slice(0, 152).trim() + '...' : '')

    const suggestedKeyword =
      seo.focusKeyword?.trim() ||
      title
        .replace(/[:|،؟!()-]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2)
        .slice(0, 3)
        .join(' ')

    onChangeSeo({
      ...seo,
      focusKeyword: suggestedKeyword,
      metaTitle: seo.metaTitle || generatedMetaTitle,
      metaDescription: seo.metaDescription || generatedDesc,
      ogTitle: seo.ogTitle || title,
      ogDescription: seo.ogDescription || generatedDesc,
    })

    if (onAutoFillExcerptAndTags && generatedDesc) {
      const stopWords = new Set(['برای', 'های', 'در', 'از', 'به', 'با', 'که', 'این', 'آن', 'یک', 'را', 'است'])
      const words = title
        .replace(/[:|،؟!()-]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 3 && !stopWords.has(w))
        .slice(0, 4)
      onAutoFillExcerptAndTags(generatedDesc, words)
    }
  }

  const scoreColor =
    analysis.totalScore >= 75
      ? 'text-emerald-600 border-emerald-500 bg-emerald-50'
      : analysis.totalScore >= 45
      ? 'text-amber-600 border-amber-500 bg-amber-50'
      : 'text-rose-600 border-rose-500 bg-rose-50'

  const highlightKeywordInText = (text: string) => {
    const kw = seo.focusKeyword?.trim()
    if (!kw) return text
    const idx = text.toLowerCase().indexOf(kw.toLowerCase())
    if (idx === -1) return text
    return (
      <>
        {text.slice(0, idx)}
        <strong className="font-black text-slate-900">{text.slice(idx, idx + kw.length)}</strong>
        {text.slice(idx + kw.length)}
      </>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden" dir="rtl">
      {/* Header with Live SEO Score Ring & Smart Auto-Generator */}
      <div className="p-5 bg-gradient-to-l from-slate-900 via-slate-800 to-indigo-950 text-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center shrink-0 font-black ${scoreColor}`}
          >
            <span className="text-xl leading-none">{analysis.totalScore}</span>
            <span className="text-[9px] font-bold mt-0.5">از ۱۰۰</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-base">دستیار هوشمند سئو و اسکیما (SEO Pro)</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 font-bold">
                Google Rich Results
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              شبیه‌ساز زنده نتایج گوگل، تحلیلگر کلمه کلیدی کانونی، اسکیمای سوالات متداول و تگ‌های شبکه اجتماعی
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSmartAutoGenerate}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-lg transition"
        >
          <Sparkles size={15} />
          <span>تکمیل هوشمند سئو از متن مقاله</span>
        </button>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="px-4 pt-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-1.5">
        {[
          { id: 'general', label: 'کلمه کلیدی و پیش‌نمایش گوگل', icon: Search },
          { id: 'faq', label: `سوالات متداول سئو (${faqs.length})`, icon: HelpCircle },
          { id: 'social', label: 'شبکه‌های اجتماعی (OpenGraph)', icon: Share2 },
          { id: 'technical', label: 'تنظیمات پیشرفته و ربات‌ها', icon: ShieldCheck },
        ].map((t) => {
          const Icon = t.icon
          const active = subTab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id as any)}
              className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-1.5 border-b-2 transition ${
                active
                  ? 'bg-white text-blue-700 border-blue-600'
                  : 'text-slate-600 border-transparent hover:text-slate-900'
              }`}
            >
              <Icon size={14} />
              <span>{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab 1: General SEO + Google SERP Simulator + Checklist */}
      {subTab === 'general' && (
        <div className="p-5 space-y-6">
          {/* Focus Keyword */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-blue-50/50 border border-blue-100 rounded-2xl p-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-black text-slate-800 mb-1.5">
                🎯 کلمه کلیدی کانونی (Focus Keyword)
              </label>
              <input
                type="text"
                value={seo.focusKeyword}
                onChange={(e) => onChangeSeo({ ...seo, focusKeyword: e.target.value })}
                placeholder="مثال: طراحی آزمون آنلاین استاندارد"
                className="w-full px-3.5 py-2.5 rounded-xl border border-blue-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
              <span className="text-slate-500">تراکم کلمه کلیدی:</span>
              <span
                className={`font-black ${
                  analysis.density >= 0.5 && analysis.density <= 2.8
                    ? 'text-emerald-600'
                    : 'text-amber-600'
                }`}
              >
                {analysis.density}%
              </span>
            </div>
          </div>

          {/* Live Google SERP Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800">
                پیش‌نمایش زنده در نتایج گوگل (Google SERP)
              </span>
              <div className="inline-flex rounded-xl border border-slate-200 p-0.5 bg-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => setSerpMode('mobile')}
                  className={`px-3 py-1 rounded-lg flex items-center gap-1 font-bold transition ${
                    serpMode === 'mobile' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  <Smartphone size={13} />
                  <span>موبایل</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSerpMode('desktop')}
                  className={`px-3 py-1 rounded-lg flex items-center gap-1 font-bold transition ${
                    serpMode === 'desktop' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  <Monitor size={13} />
                  <span>دسکتاپ</span>
                </button>
              </div>
            </div>

            <div
              className={`bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs ${
                serpMode === 'mobile' ? 'max-w-md' : 'max-w-2xl'
              }`}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-xs font-black text-blue-700">
                  ک
                </div>
                <div className="leading-tight">
                  <div className="text-xs font-bold text-slate-800">{siteNameSuffix}</div>
                  <div className="text-[11px] text-slate-500" dir="ltr">
                    https://kitayar.ir › blog › {slug || 'article-slug'}
                  </div>
                </div>
              </div>
              <h4 className="text-[#1a0dab] text-base sm:text-lg font-bold leading-snug hover:underline cursor-pointer line-clamp-1">
                {effectiveMetaTitle.slice(0, 65)}
              </h4>
              <p className="text-xs sm:text-[13px] text-slate-600 mt-1 leading-relaxed line-clamp-2">
                <span className="text-slate-400 ml-1">
                  {new Date().toLocaleDateString('fa-IR')} —
                </span>
                {highlightKeywordInText(effectiveMetaDesc.slice(0, 165))}
              </p>
              {faqs.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1">
                  {faqs.slice(0, 2).map((f, idx) => (
                    <div
                      key={idx}
                      className="text-[11px] text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-lg flex items-center justify-between"
                    >
                      <span className="truncate font-medium">▾ {f.question}</span>
                      <span className="text-[10px] text-emerald-600 font-bold shrink-0">FAQ Schema</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Meta Title & Meta Description Inputs with Character Progress Bars */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  عنوان سئو در گوگل (Meta Title)
                </label>
                <span className="text-[11px] text-slate-500">
                  {effectiveMetaTitle.length} / ۶۰ کاراکتر
                </span>
              </div>
              <input
                type="text"
                value={seo.metaTitle}
                onChange={(e) => onChangeSeo({ ...seo, metaTitle: e.target.value })}
                placeholder={`${title || 'عنوان مقاله'} ${titleSeparator} ${siteNameSuffix}`}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5">
                <div
                  className={`h-full transition-all ${
                    effectiveMetaTitle.length >= 35 && effectiveMetaTitle.length <= 65
                      ? 'bg-emerald-500'
                      : effectiveMetaTitle.length > 65
                      ? 'bg-rose-500'
                      : 'bg-amber-400'
                  }`}
                  style={{ width: `${Math.min(100, (effectiveMetaTitle.length / 65) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  توضیحات متای سئو (Meta Description)
                </label>
                <span className="text-[11px] text-slate-500">
                  {effectiveMetaDesc.length} / ۱۶۰ کاراکتر
                </span>
              </div>
              <textarea
                rows={3}
                value={seo.metaDescription}
                onChange={(e) => onChangeSeo({ ...seo, metaDescription: e.target.value })}
                placeholder="خلاصه‌ای جذاب شامل کلمه کلیدی کانونی برای ترغیب کاربر به کلیک روی لینک شما در گوگل..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 leading-relaxed"
              />
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full transition-all ${
                    effectiveMetaDesc.length >= 110 && effectiveMetaDesc.length <= 165
                      ? 'bg-emerald-500'
                      : effectiveMetaDesc.length > 165
                      ? 'bg-rose-500'
                      : 'bg-amber-400'
                  }`}
                  style={{ width: `${Math.min(100, (effectiveMetaDesc.length / 165) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Interactive 10-Point SEO Checklist */}
          <div className="pt-2">
            <h4 className="text-xs font-black text-slate-800 mb-3">
              چک‌لیست تحلیلی سئو محتوا ({analysis.checks.filter((c) => c.status === 'good').length} از{' '}
              {analysis.checks.length} مورد سبز)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {analysis.checks.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                    item.status === 'good'
                      ? 'bg-emerald-50/50 border-emerald-200/80'
                      : item.status === 'warn'
                      ? 'bg-amber-50/50 border-amber-200/80'
                      : 'bg-rose-50/50 border-rose-200/80'
                  }`}
                >
                  {item.status === 'good' ? (
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  ) : item.status === 'warn' ? (
                    <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold text-slate-800">{item.label}</div>
                    <div className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      {item.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: FAQ Schema Builder */}
      {subTab === 'faq' && (
        <div className="p-5 space-y-4">
          <div className="bg-indigo-50 border border-indigo-200/80 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-black text-indigo-950">
                ساختار داده‌های غنی سوالات متداول (FAQPage JSON-LD Schema)
              </h4>
              <p className="text-[11px] text-indigo-700 mt-1 leading-relaxed">
                سوالاتی که اینجا وارد کنید هم در انتهای مقاله به‌صورت آکاردئونی نمایش داده می‌شوند و هم کد اسکیمای رسمی گوگل را برای اشغال فضای بیشتر در صفحه اول نتایج می‌سازند.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onChangeFaqs([...faqs, { question: '', answer: '' }])}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shrink-0"
            >
              <Plus size={14} />
              <span>افزودن سوال متداول</span>
            </button>
          </div>

          {faqs.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              هنوز سوال متداولی برای این مقاله ثبت نشده است.
            </div>
          ) : (
            <div className="space-y-3">
              {faqs.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-700">سوال متداول #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => onChangeFaqs(faqs.filter((_, i) => i !== idx))}
                      className="text-rose-500 hover:text-rose-700 text-xs flex items-center gap-1 font-bold"
                    >
                      <Trash2 size={13} />
                      <span>حذف</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={item.question}
                    onChange={(e) => {
                      const next = [...faqs]
                      next[idx] = { ...next[idx], question: e.target.value }
                      onChangeFaqs(next)
                    }}
                    placeholder="عنوان پرسش پرتکرار معلمان یا دانش‌آموزان..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                  />
                  <textarea
                    rows={2}
                    value={item.answer}
                    onChange={(e) => {
                      const next = [...faqs]
                      next[idx] = { ...next[idx], answer: e.target.value }
                      onChangeFaqs(next)
                    }}
                    placeholder="پاسخ دقیق و شفاف..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: OpenGraph & Social Preview */}
      {subTab === 'social' && (
        <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                عنوان اشتراک‌گذاری (OG Title)
              </label>
              <input
                type="text"
                value={seo.ogTitle}
                onChange={(e) => onChangeSeo({ ...seo, ogTitle: e.target.value })}
                placeholder={effectiveMetaTitle}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                توضیحات اشتراک‌گذاری (OG Description)
              </label>
              <textarea
                rows={3}
                value={seo.ogDescription}
                onChange={(e) => onChangeSeo({ ...seo, ogDescription: e.target.value })}
                placeholder={effectiveMetaDesc}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                تصویر اختصاصی شبکه‌های اجتماعی (OG Image)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  dir="ltr"
                  value={seo.ogImage}
                  onChange={(e) => onChangeSeo({ ...seo, ogImage: e.target.value })}
                  placeholder={coverImage || '/uploads/blog/...'}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setOgPickerOpen(true)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <ImageIcon size={14} />
                  <span>رسانه</span>
                </button>
              </div>
            </div>
          </div>

          {/* Telegram / WhatsApp Card Preview */}
          <div className="bg-slate-100 rounded-2xl p-4 flex flex-col justify-center">
            <p className="text-[11px] font-bold text-slate-500 mb-2">
              پیش‌نمایش کارت لینک در تلگرام، واتساپ و لینکدین:
            </p>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs max-w-sm">
              {(seo.ogImage || coverImage) && !(seo.ogImage || coverImage).startsWith('/blog/') ? (
                <img
                  src={seo.ogImage || coverImage}
                  alt=""
                  className="w-full h-40 object-cover bg-slate-100"
                />
              ) : (
                <div className="w-full h-36 bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-xs font-bold">
                  {category || 'مجله آموزشی کیتایار'}
                </div>
              )}
              <div className="p-3.5 space-y-1">
                <div className="text-[10px] font-bold text-blue-600 uppercase" dir="ltr">
                  kitayar.ir
                </div>
                <div className="text-xs font-black text-slate-900 line-clamp-2">
                  {seo.ogTitle || effectiveMetaTitle}
                </div>
                <div className="text-[11px] text-slate-500 line-clamp-2">
                  {seo.ogDescription || effectiveMetaDesc}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Technical SEO (Canonical, Robots, Schema Type) */}
      {subTab === 'technical' && (
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                آدرس کانونیکال (Canonical URL - اختیاری)
              </label>
              <input
                type="url"
                dir="ltr"
                value={seo.canonicalUrl}
                onChange={(e) => onChangeSeo({ ...seo, canonicalUrl: e.target.value })}
                placeholder={`https://kitayar.ir/blog/${slug || 'post-slug'}`}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                اگر خالی بماند، به صورت خودکار آدرس اصلی همین صفحه تنظیم می‌شود.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                نوع اسکیمای ساخت‌یافته گوگل (Schema.org Type)
              </label>
              <select
                value={seo.schemaType || 'BlogPosting'}
                onChange={(e) =>
                  onChangeSeo({ ...seo, schemaType: e.target.value as BlogPostSeo['schemaType'] })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-bold"
              >
                <option value="BlogPosting">مقاله وبلاگ آموزشی (BlogPosting - پیشنهادی)</option>
                <option value="Article">مقاله تخصصی مرجع (Article)</option>
                <option value="NewsArticle">خبر و اطلاعیه آموزشی (NewsArticle)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <label className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between cursor-pointer">
              <div>
                <div className="text-xs font-bold text-slate-800">عدم ایندکس در گوگل (noindex)</div>
                <div className="text-[10px] text-slate-500">
                  در صورت فعال بودن، مقاله از نقشه سایت و نتایج گوگل مخفی می‌شود.
                </div>
              </div>
              <input
                type="checkbox"
                checked={seo.robotsNoIndex}
                onChange={(e) => onChangeSeo({ ...seo, robotsNoIndex: e.target.checked })}
                className="w-4 h-4"
              />
            </label>

            <label className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between cursor-pointer">
              <div>
                <div className="text-xs font-bold text-slate-800">عدم دنبال‌کردن لینک‌ها (nofollow)</div>
                <div className="text-[10px] text-slate-500">
                  ربات گوگل لینک‌های خروجی داخل این مقاله را دنبال نکند.
                </div>
              </div>
              <input
                type="checkbox"
                checked={seo.robotsNoFollow}
                onChange={(e) => onChangeSeo({ ...seo, robotsNoFollow: e.target.checked })}
                className="w-4 h-4"
              />
            </label>
          </div>
        </div>
      )}

      <WordPressMediaLibrary
        mode="modal"
        isOpen={ogPickerOpen}
        onClose={() => setOgPickerOpen(false)}
        onSelect={(m) => onChangeSeo({ ...seo, ogImage: m.url })}
        selectButtonLabel="انتخاب به عنوان تصویر شبکه اجتماعی"
      />
    </div>
  )
}

export default SeoAnalyzerPanel
