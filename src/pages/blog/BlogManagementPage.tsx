import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  BookOpen,
  Plus,
  Search,
  ExternalLink,
  Edit3,
  Trash2,
  Eye,
  Star,
  Image as ImageIcon,
  Settings,
  Globe,
  CheckCircle2,
  FileText,
  Sparkles,
  Save,
  ArrowRight,
  Tag,
  AlertTriangle,
  Rss,
  Map,
} from './BlogIcons'
import type {
  BlogFaqItem,
  BlogPostItem,
  BlogPostSeo,
  BlogSeoAudit,
  BlogSeoSettingsData,
} from '../../services/blogAdminService'
import {
  fetchAdminBlogPosts,
  fetchAdminBlogPost,
  createAdminBlogPost,
  updateAdminBlogPost,
  toggleAdminBlogPostPublish,
  deleteAdminBlogPost,
  fetchBlogSeoSettings,
  saveBlogSeoSettings,
} from '../../services/blogAdminService'
import RichBlogEditor from './RichBlogEditor'
import SeoAnalyzerPanel from './SeoAnalyzerPanel'
import WordPressMediaLibrary from './WordPressMediaLibrary'

const EMPTY_SEO: BlogPostSeo = {
  focusKeyword: '',
  metaTitle: '',
  metaDescription: '',
  canonicalUrl: '',
  ogTitle: '',
  ogDescription: '',
  ogImage: '',
  robotsNoIndex: false,
  robotsNoFollow: false,
  schemaType: 'BlogPosting',
  seoScore: 0,
}

function makeSlug(input: string): string {
  return (input || '')
    .trim()
    .toLowerCase()
    .replace(/[؟?!،,.;:'"()[\]{}<>@#$%^&*+=~`|\\/]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export const BlogManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'posts' | 'editor' | 'media' | 'seo-settings'>('posts')

  // Posts List State
  const [posts, setPosts] = useState<BlogPostItem[]>([])
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    drafts: 0,
    totalViews: 0,
    avgSeoScore: 0,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterTargetAudience, setFilterTargetAudience] = useState<'all_targets' | 'kitayar' | 'nokita' | 'all'>('all_targets')

  // Editor State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [savingPost, setSavingPost] = useState(false)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [coverImageAlt, setCoverImageAlt] = useState('')
  const [category, setCategory] = useState('طراحی آزمون')
  const [newCategoryInput, setNewCategoryInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [authorName, setAuthorName] = useState('تحریریه کیتایار')
  const [authorRole, setAuthorRole] = useState('کارشناس آموزش و یادگیری')
  const [readingTime, setReadingTime] = useState<number>(5)
  const [isFeatured, setIsFeatured] = useState(false)
  const [isPublished, setIsPublished] = useState(true)
  const [targetAudience, setTargetAudience] = useState<'kitayar' | 'nokita' | 'all'>('kitayar')
  const [seo, setSeo] = useState<BlogPostSeo>(EMPTY_SEO)
  const [faqs, setFaqs] = useState<BlogFaqItem[]>([])
  const [coverModalOpen, setCoverModalOpen] = useState(false)

  // Global SEO Settings State
  const [seoTargetSite, setSeoTargetSite] = useState<'kitayar' | 'nokita'>('kitayar')
  const [seoSettings, setSeoSettings] = useState<BlogSeoSettingsData>({
    blogTitle: 'مجله تخصصی آموزش و فناوری کیتایار',
    blogSubtitle:
      'جدیدترین مقالات، استانداردهای طراحی سوال، روش‌های تدریس خلاق و مدیریت هوشمند کلاس درس ویژه معلمان ایران',
    titleSeparator: '|',
    siteNameSuffix: 'کیتایار',
    defaultMetaDescription: '',
    defaultKeywords: [],
    defaultOgImage: '/images/kitayar_logo.png',
    googleSiteVerification: '',
    bingSiteVerification: '',
    defaultRobotsIndex: true,
    defaultRobotsFollow: true,
    categories: ['طراحی آزمون', 'مدیریت کلاس', 'تکنولوژی آموزشی', 'ارزشیابی تحصیلی', 'کلاس آنلاین'],
    organizationName: 'سامانه آموزشی کیتایار',
    ctaBoxTitle: 'به دنبال طراحی آزمون استاندارد یا برگزاری کلاس آنلاین هستید؟',
    ctaBoxSubtitle:
      'با ابزارهای وب کیتایار در کمتر از ۳ دقیقه آزمون آنلاین، فرم هوشمند یا برگه چاپی A4 بسازید.',
    ctaBoxButtonText: 'شروع رایگان در کیتایار',
    ctaBoxButtonLink: '/exam/create',
  })
  const [seoAudit, setSeoAudit] = useState<BlogSeoAudit>({
    totalPublished: 0,
    missingFocusKeyword: 0,
    missingMetaDescription: 0,
    noIndexCount: 0,
    missingMediaAlt: 0,
  })
  const [savingGlobalSeo, setSavingGlobalSeo] = useState(false)
  const [defaultOgModalOpen, setDefaultOgModalOpen] = useState(false)
  const [newGlobalCat, setNewGlobalCat] = useState('')
  const [keywordsText, setKeywordsText] = useState('')

  const loadPosts = async () => {
    try {
      setLoadingPosts(true)
      const res = await fetchAdminBlogPosts({
        search: searchQuery,
        status: filterStatus,
        category: filterCategory,
        targetAudience: filterTargetAudience,
      })
      setPosts(res.data || [])
      if (res.stats) setStats(res.stats)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'خطا در دریافت لیست مقالات')
    } finally {
      setLoadingPosts(false)
    }
  }

  const loadGlobalSeo = async (targetSite?: 'kitayar' | 'nokita') => {
    try {
      const site = targetSite || seoTargetSite
      const res = await fetchBlogSeoSettings(site)
      if (res.data) {
        setSeoSettings(res.data)
        setKeywordsText((res.data.defaultKeywords || []).join('، '))
      }
      if (res.audit) setSeoAudit(res.audit)
    } catch {
      // silent fallback
    }
  }

  useEffect(() => {
    loadPosts()
    loadGlobalSeo()
  }, [filterStatus, filterCategory, filterTargetAudience])

  const resetEditor = () => {
    setEditingId(null)
    setTitle('')
    setSlug('')
    setSlugManuallyEdited(false)
    setExcerpt('')
    setContent('')
    setCoverImage('')
    setCoverImageAlt('')
    setCategory(seoSettings.categories?.[0] || 'طراحی آزمون')
    setTags([])
    setTagInput('')
    setAuthorName('تحریریه کیتایار')
    setAuthorRole('کارشناس آموزش و یادگیری')
    setReadingTime(5)
    setIsFeatured(false)
    setIsPublished(true)
    setTargetAudience('kitayar')
    setSeo({ ...EMPTY_SEO })
    setFaqs([])
  }

  const handleStartNewPost = () => {
    resetEditor()
    setActiveTab('editor')
  }

  const handleEditPost = async (id: string) => {
    try {
      const toastId = toast.loading('در حال بارگذاری اطلاعات مقاله...')
      const res = await fetchAdminBlogPost(id)
      toast.dismiss(toastId)
      const p = res.data
      setEditingId(p._id)
      setTitle(p.title || '')
      setSlug(p.slug || '')
      setSlugManuallyEdited(true)
      setExcerpt(p.excerpt || '')
      setContent(p.content || '')
      setCoverImage(p.coverImage || '')
      setCoverImageAlt(p.coverImageAlt || '')
      setCategory(p.category || 'آموزشی')
      setTags(p.tags || [])
      setAuthorName(p.author?.name || 'تحریریه کیتایار')
      setAuthorRole(p.author?.role || 'کارشناس آموزش و یادگیری')
      setReadingTime(p.readingTime || 5)
      setIsFeatured(Boolean(p.isFeatured))
      setIsPublished(Boolean(p.isPublished))
      setTargetAudience(p.targetAudience || 'kitayar')
      setSeo({
        ...EMPTY_SEO,
        ...(p.seo || {}),
      })
      setFaqs(p.faqs || [])
      setActiveTab('editor')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'خطا در دریافت اطلاعات مقاله')
    }
  }

  const handleSavePost = async (publishOverride?: boolean) => {
    if (!title.trim()) {
      toast.error('لطفاً عنوان مقاله را وارد کنید')
      return
    }
    if (!content.trim() || content.replace(/<[^>]+>/g, '').trim().length < 5) {
      toast.error('متن مقاله نمی‌تواند خالی باشد')
      return
    }

    const targetPublished = publishOverride !== undefined ? publishOverride : isPublished

    const payload: Partial<BlogPostItem> = {
      title: title.trim(),
      slug: (slug || makeSlug(title)).trim(),
      excerpt: excerpt.trim(),
      content,
      coverImage,
      coverImageAlt,
      category,
      tags,
      author: {
        name: authorName,
        role: authorRole,
      },
      readingTime,
      isFeatured,
      isPublished: targetPublished,
      targetAudience,
      seo,
      faqs,
    }

    try {
      setSavingPost(true)
      if (editingId) {
        const res = await updateAdminBlogPost(editingId, payload)
        toast.success(res.message || 'مقاله با موفقیت بروزرسانی شد')
        setIsPublished(Boolean(res.data.isPublished))
        setSlug(res.data.slug)
      } else {
        const res = await createAdminBlogPost(payload)
        toast.success(res.message || 'مقاله جدید با موفقیت منتشر شد')
        setEditingId(res.data._id)
        setSlug(res.data.slug)
        setSlugManuallyEdited(true)
        setIsPublished(Boolean(res.data.isPublished))
      }
      loadPosts()
      loadGlobalSeo()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'خطا در ذخیره مقاله')
    } finally {
      setSavingPost(false)
    }
  }

  const handleTogglePublish = async (id: string) => {
    try {
      const res = await toggleAdminBlogPostPublish(id)
      toast.success(res.message)
      loadPosts()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'خطا در تغییر وضعیت انتشار')
    }
  }

  const handleDeletePost = async (id: string, postTitle: string) => {
    if (!window.confirm(`آیا از حذف مقاله «${postTitle}» اطمینان دارید؟`)) return
    try {
      await deleteAdminBlogPost(id)
      toast.success('مقاله حذف شد')
      if (editingId === id) resetEditor()
      loadPosts()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'خطا در حذف مقاله')
    }
  }

  const handleAddTag = () => {
    const clean = tagInput.trim().replace(/^#/, '')
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean])
    }
    setTagInput('')
  }

  const handleSaveGlobalSeoSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSavingGlobalSeo(true)
      const parsedKeywords = keywordsText
        .split(/[،,]/)
        .map((k) => k.trim())
        .filter(Boolean)

      const res = await saveBlogSeoSettings(
        {
          ...seoSettings,
          defaultKeywords: parsedKeywords,
        },
        seoTargetSite
      )
      setSeoSettings(res.data)
      toast.success(res.message || `تنظیمات کلی سئو ${seoTargetSite === 'nokita' ? 'نوکیتا' : 'کیتایار'} ذخیره شد`)
      loadGlobalSeo(seoTargetSite)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'خطا در ذخیره تنظیمات سئو')
    } finally {
      setSavingGlobalSeo(false)
    }
  }

  const allCategoryOptions = Array.from(
    new Set([...(seoSettings.categories || []), category].filter(Boolean))
  )

  return (
    <div className="space-y-6 font-sans pb-12" dir="rtl">
      {/* Top Hero Header & Navigation Tabs */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
              <BookOpen size={24} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900">
                مدیریت وبلاگ، رسانه و سئو پیشرفته (Kitayar CMS)
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                ویرایشگر حرفه‌ای مقالات، کتابخانه رسانه وردپرسی و موتور بهینه‌سازی سئو برای kitayar.ir/blog
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href="https://kitayar.ir/blog"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <ExternalLink size={14} />
              <span>مشاهده وبلاگ زنده</span>
            </a>
            <button
              type="button"
              onClick={handleStartNewPost}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition"
            >
              <Plus size={16} />
              <span>نوشتن مقاله جدید</span>
            </button>
          </div>
        </div>

        {/* Main 4 Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          {[
            { id: 'posts', label: `همه مقالات (${stats.total})`, icon: FileText },
            {
              id: 'editor',
              label: editingId ? 'در حال ویرایش مقاله' : 'افزودن مقاله جدید',
              icon: Edit3,
            },
            { id: 'media', label: 'کتابخانه پرونده‌های چندرسانه‌ای', icon: ImageIcon },
            { id: 'seo-settings', label: 'تنظیمات کلی سئو وبلاگ', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                  active
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ==================== TAB 1: POSTS LIST ==================== */}
      {activeTab === 'posts' && (
        <div className="space-y-5">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="text-xs text-slate-500">کل مقالات وبلاگ</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{stats.total}</div>
              <div className="text-[11px] text-emerald-600 mt-1 font-bold">
                {stats.published} منتشرشده • {stats.drafts} پیش‌نویس
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="text-xs text-slate-500">مجموع بازدید مقالات</div>
              <div className="text-2xl font-black text-blue-600 mt-1">
                {stats.totalViews.toLocaleString('fa-IR')}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">بازدید ارگانیک خوانندگان</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="text-xs text-slate-500">میانگین امتیاز سئو</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {stats.avgSeoScore || 75} <span className="text-xs font-bold text-slate-400">/ ۱۰۰</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">بر پایه چک‌لیست استاندارد گوگل</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
              <div className="text-xs text-slate-500">نقشه سایت و فید RSS</div>
              <div className="flex items-center gap-2 mt-2">
                <a
                  href="https://kitayar.ir/sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-bold flex items-center gap-1"
                >
                  <Map size={12} /> Sitemap.xml
                </a>
                <a
                  href="https://kitayar.ir/blog/rss.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-lg bg-orange-50 text-orange-700 text-[11px] font-bold flex items-center gap-1"
                >
                  <Rss size={12} /> RSS
                </a>
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                loadPosts()
              }}
              className="relative flex-1 min-w-[240px] max-w-md"
            >
              <Search size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در عنوان، نامک یا برچسب‌ها..."
                className="w-full pr-10 pl-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
              />
            </form>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="published">منتشرشده در سایت</option>
                <option value="draft">پیش‌نویس‌ها</option>
              </select>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700"
              >
                <option value="all">همه دسته‌بندی‌ها</option>
                {allCategoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={filterTargetAudience}
                onChange={(e) => setFilterTargetAudience(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/50 text-xs font-bold text-purple-900"
              >
                <option value="all_targets">همه بسترها (کیتایار و نوکیتا)</option>
                <option value="kitayar">فقط کیتایار (معلمان)</option>
                <option value="nokita">فقط نوکیتا (دانش‌آموزان)</option>
                <option value="all">مشترک (هر دو سامانه)</option>
              </select>
            </div>
          </div>

          {/* Articles Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            {loadingPosts ? (
              <div className="py-16 text-center text-xs text-slate-400">در حال بارگذاری مقالات...</div>
            ) : posts.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <BookOpen size={40} className="mx-auto text-slate-300" />
                <p className="text-sm font-bold text-slate-700">مقاله‌ای مطابق فیلتر شما یافت نشد</p>
                <button
                  type="button"
                  onClick={handleStartNewPost}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
                >
                  اولین مقاله جدید را بنویسید
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <tr>
                      <th className="py-3.5 px-4">مقاله</th>
                      <th className="py-3.5 px-3">دسته‌بندی</th>
                      <th className="py-3.5 px-3">وضعیت سئو</th>
                      <th className="py-3.5 px-3">بازدید</th>
                      <th className="py-3.5 px-3">وضعیت انتشار</th>
                      <th className="py-3.5 px-4 text-left">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {posts.map((post) => {
                      const score = post.seo?.seoScore || 0
                      const hasRealImage =
                        post.coverImage && !post.coverImage.startsWith('/blog/')
                      return (
                        <tr key={post._id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3.5 px-4 max-w-md">
                            <div className="flex items-center gap-3">
                              {hasRealImage ? (
                                <img
                                  src={post.coverImage}
                                  alt={post.coverImageAlt || post.title}
                                  className="w-14 h-11 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200"
                                />
                              ) : (
                                <div className="w-14 h-11 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200/60 text-blue-600 flex items-center justify-center shrink-0">
                                  <BookOpen size={18} />
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  {post.isFeatured && (
                                    <Star
                                      size={13}
                                      className="text-amber-500 fill-amber-400 shrink-0"
                                    />
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleEditPost(post._id)}
                                    className="font-black text-slate-900 hover:text-blue-600 truncate text-right"
                                  >
                                    {post.title}
                                  </button>
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5" dir="ltr">
                                  /blog/{post.slug}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            <div className="flex flex-col gap-1">
                              <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-bold text-[11px] w-fit">
                                {post.category}
                              </span>
                              {post.targetAudience === 'nokita' ? (
                                <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-black w-fit">
                                  نوکیتا (دانش‌آموز)
                                </span>
                              ) : post.targetAudience === 'all' ? (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black w-fit">
                                  مشترک
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold w-fit">
                                  کیتایار (معلم)
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            <div className="flex flex-col gap-0.5">
                              <span
                                className={`inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-[11px] font-black ${
                                  score >= 75
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : score >= 45
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {score > 0 ? `امتیاز ${score}/100` : 'بررسی نشده'}
                              </span>
                              {post.seo?.focusKeyword && (
                                <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                                  🎯 {post.seo.focusKeyword}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-3 font-bold text-slate-700">
                            <span className="inline-flex items-center gap-1">
                              <Eye size={13} className="text-slate-400" />
                              {(post.views || 0).toLocaleString('fa-IR')}
                            </span>
                          </td>

                          <td className="py-3.5 px-3">
                            <button
                              type="button"
                              onClick={() => handleTogglePublish(post._id)}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition ${
                                post.isPublished
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                              }`}
                            >
                              {post.isPublished ? '● منتشرشده' : '○ پیش‌نویس'}
                            </button>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-end gap-1.5">
                              <a
                                href={`https://kitayar.ir/blog/${encodeURIComponent(post.slug)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="مشاهده در سایت"
                                className="p-2 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition"
                              >
                                <ExternalLink size={14} />
                              </a>
                              <button
                                type="button"
                                onClick={() => handleEditPost(post._id)}
                                title="ویرایش مقاله و سئو"
                                className="p-2 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white transition"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePost(post._id, post.title)}
                                title="حذف مقاله"
                                className="p-2 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white transition"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 2: PROFESSIONAL POST EDITOR ==================== */}
      {activeTab === 'editor' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Main Writing & SEO Column (8 cols) */}
          <div className="xl:col-span-8 space-y-5">
            {/* Title + Permalink Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-700">
                  عنوان اصلی مقاله (تگ H1 صفحه) *
                </label>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      resetEditor()
                      toast('فرم برای نوشتن مقاله جدید آماده شد')
                    }}
                    className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Plus size={12} /> مقاله جدید
                  </button>
                )}
              </div>

              <input
                type="text"
                value={title}
                onChange={(e) => {
                  const val = e.target.value
                  setTitle(val)
                  if (!slugManuallyEdited) {
                    setSlug(makeSlug(val))
                  }
                }}
                placeholder="عنوان جذاب و دقیق مقاله را بنویسید (مثلاً: ۱۰ روش خلاقانه طراحی آزمون آنلاین برای مدارس)..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-base sm:text-lg font-black text-slate-900 focus:outline-none focus:border-blue-600"
              />

              {/* Editable Permalink (Slug) */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="text-slate-500 font-bold">پیوند یکتا (Slug):</span>
                <div
                  className="flex-1 min-w-[240px] flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5"
                  dir="ltr"
                >
                  <span className="text-slate-400 text-[11px] select-none shrink-0">
                    https://kitayar.ir/blog/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      setSlugManuallyEdited(true)
                      setSlug(makeSlug(e.target.value))
                    }}
                    placeholder="article-slug"
                    className="flex-1 bg-transparent text-xs font-bold text-blue-700 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Rich Tiptap Editor */}
            <RichBlogEditor value={content} onChange={setContent} />

            {/* Excerpt Box */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800">
                  چکیده و خلاصه مقاله (Excerpt)
                </label>
                <span className="text-[11px] text-slate-400">{excerpt.length} کاراکتر</span>
              </div>
              <textarea
                rows={3}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="خلاصه ۲ تا ۳ خطی مقاله که در کارت‌های صفحه اصلی وبلاگ نمایش داده می‌شود..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Yoast / RankMath Pro SEO Analyzer */}
            <SeoAnalyzerPanel
              title={title}
              slug={slug}
              excerpt={excerpt}
              content={content}
              category={category}
              coverImage={coverImage}
              coverImageAlt={coverImageAlt}
              seo={seo}
              faqs={faqs}
              siteNameSuffix={seoSettings.siteNameSuffix}
              titleSeparator={seoSettings.titleSeparator}
              onChangeSeo={setSeo}
              onChangeFaqs={setFaqs}
              onAutoFillExcerptAndTags={(genExcerpt, suggestedTags) => {
                if (!excerpt.trim()) setExcerpt(genExcerpt)
                if (tags.length === 0 && suggestedTags.length > 0) setTags(suggestedTags)
                toast.success('عنوان سئو، توضیحات متا و کلمه کلیدی به صورت هوشمند تنظیم شد!')
              }}
            />
          </div>

          {/* Left/Sticky WordPress Sidebar Column (4 cols) */}
          <div className="xl:col-span-4 space-y-5 xl:sticky xl:top-4">
            {/* Publish Box */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-black text-sm text-slate-900">انتشار و وضعیت مقاله</h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    isPublished
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isPublished ? 'آماده انتشار عمومی' : 'پیش‌نویس خصوصی'}
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Star size={14} className="text-amber-500" />
                    نمایش ویژه در بنر اول وبلاگ
                  </span>
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4"
                  />
                </label>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="font-bold text-slate-700">زمان مطالعه (دقیقه):</span>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={readingTime}
                    onChange={(e) => setReadingTime(Math.max(1, Number(e.target.value) || 1))}
                    className="w-16 px-2 py-1 rounded-lg border border-slate-200 bg-white text-center font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  disabled={savingPost}
                  onClick={() => handleSavePost(false)}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
                >
                  ذخیره پیش‌نویس
                </button>
                <button
                  type="button"
                  disabled={savingPost}
                  onClick={() => handleSavePost(true)}
                  className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 transition"
                >
                  <Save size={14} />
                  <span>{editingId ? 'بروزرسانی و انتشار' : 'انتشار در وبلاگ'}</span>
                </button>
              </div>

              {editingId && slug && (
                <a
                  href={targetAudience === 'nokita' ? `https://nokita.kitayar.ir/blog/${encodeURIComponent(slug)}` : `https://kitayar.ir/blog/${encodeURIComponent(slug)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <ExternalLink size={13} />
                  <span>مشاهده مقاله در {targetAudience === 'nokita' ? 'نوکیتا' : 'سایت'}</span>
                </a>
              )}
            </div>

            {/* Target Audience Box */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs">
              <h3 className="font-black text-sm text-slate-900">بستر انتشار و مخاطب هدف</h3>
              <p className="text-[11px] text-slate-500">مشخص کنید این مقاله در وبلاگ کدام سایت نمایش داده شود:</p>
              <div className="space-y-2 text-xs">
                {[
                  { id: 'kitayar', label: 'کیتایار (معلمان و مدارس)', desc: 'نمایش در kitayar.ir/blog', theme: 'blue' },
                  { id: 'nokita', label: 'نوکیتا (دانش‌آموزان و مطالعه)', desc: 'نمایش در nokita.kitayar.ir/blog', theme: 'purple' },
                  { id: 'all', label: 'مشترک (هر دو بستر)', desc: 'نمایش همزمان در کیتایار و نوکیتا', theme: 'emerald' },
                ].map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                      targetAudience === opt.id
                        ? opt.id === 'nokita'
                          ? 'border-purple-500 bg-purple-50/60'
                          : opt.id === 'all'
                          ? 'border-emerald-500 bg-emerald-50/60'
                          : 'border-blue-500 bg-blue-50/60'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/60'
                    }`}
                  >
                    <input
                      type="radio"
                      name="targetAudience"
                      value={opt.id}
                      checked={targetAudience === opt.id}
                      onChange={() => setTargetAudience(opt.id as any)}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="font-black text-slate-800">{opt.label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Featured Image Box (WordPress Style) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs">
              <h3 className="font-black text-sm text-slate-900">تصویر شاخص مقاله (Featured Image)</h3>

              {coverImage && !coverImage.startsWith('/blog/') ? (
                <div className="space-y-2.5">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video">
                    <img
                      src={coverImage}
                      alt={coverImageAlt || title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <input
                    type="text"
                    value={coverImageAlt}
                    onChange={(e) => setCoverImageAlt(e.target.value)}
                    placeholder="متن جایگزین سئو تصویر شاخص (Alt)..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCoverModalOpen(true)}
                      className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                    >
                      تغییر تصویر
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCoverImage('')
                        setCoverImageAlt('')
                      }}
                      className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setCoverModalOpen(true)}
                  className="w-full py-8 px-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/40 text-center space-y-2 transition cursor-pointer"
                >
                  <ImageIcon size={28} className="mx-auto text-blue-600" />
                  <div className="text-xs font-bold text-slate-800">
                    انتخاب یا آپلود تصویر شاخص از کتابخانه رسانه
                  </div>
                  <div className="text-[10px] text-slate-400">
                    ابعاد پیشنهادی: ۱۲۰۰×۶۳۰ پیکسل (نسبت ۱۶:۹)
                  </div>
                </button>
              )}
            </div>

            {/* Categories Box */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs">
              <h3 className="font-black text-sm text-slate-900">دسته‌بندی موضوعی</h3>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800"
              >
                {allCategoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  placeholder="نام دسته جدید..."
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    const c = newCategoryInput.trim()
                    if (c) {
                      setCategory(c)
                      if (!seoSettings.categories.includes(c)) {
                        setSeoSettings((prev) => ({
                          ...prev,
                          categories: [...prev.categories, c],
                        }))
                      }
                      setNewCategoryInput('')
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-bold"
                >
                  افزودن
                </button>
              </div>
            </div>

            {/* Tags Box */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs">
              <h3 className="font-black text-sm text-slate-900">برچسب‌های سئو (Tags)</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                  placeholder="برچسب + کلید Enter..."
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
                >
                  ثبت
                </button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-bold"
                    >
                      <Tag size={11} />
                      {t}
                      <button
                        type="button"
                        onClick={() => setTags(tags.filter((x) => x !== t))}
                        className="text-blue-400 hover:text-rose-600 mr-0.5 font-black"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Author Box */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs">
              <h3 className="font-black text-sm text-slate-900">نویسنده مقاله (E-E-A-T گوگل)</h3>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="نام نویسنده (مثلاً: دکتر علیرضا محمدی)"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
              />
              <input
                type="text"
                value={authorRole}
                onChange={(e) => setAuthorRole(e.target.value)}
                placeholder="سمت علمی / تخصصی نویسنده"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          {/* Cover Image Media Modal */}
          <WordPressMediaLibrary
            mode="modal"
            isOpen={coverModalOpen}
            onClose={() => setCoverModalOpen(false)}
            onSelect={(m) => {
              setCoverImage(m.url)
              if (m.alt) setCoverImageAlt(m.alt)
            }}
            selectButtonLabel="انتخاب به عنوان تصویر شاخص مقاله"
          />
        </div>
      )}

      {/* ==================== TAB 3: STANDALONE WORDPRESS MEDIA LIBRARY ==================== */}
      {activeTab === 'media' && <WordPressMediaLibrary mode="page" />}

      {/* ==================== TAB 4: GLOBAL BLOG SEO SETTINGS ==================== */}
      {activeTab === 'seo-settings' && (
        <form onSubmit={handleSaveGlobalSeoSettings} className="space-y-6">
          {/* Target Site Toggle: Kitayar vs Nokita */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-700">انتخاب سامانه جهت تنظیم سئو:</span>
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setSeoTargetSite('kitayar');
                    loadGlobalSeo('kitayar');
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-black transition ${
                    seoTargetSite === 'kitayar'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  وبلاگ کیتایار (kitayar.ir)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSeoTargetSite('nokita');
                    loadGlobalSeo('nokita');
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-black transition ${
                    seoTargetSite === 'nokita'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  وبلاگ نوکیتا (nokita.kitayar.ir)
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-500 font-bold">
              در حال پیکربندی سئو برای:{' '}
              <span className={seoTargetSite === 'nokita' ? 'text-purple-600 font-black' : 'text-blue-600 font-black'}>
                {seoTargetSite === 'nokita' ? 'پورتال نوکیتا (مخصوص دانش‌آموزان)' : 'سامانه کیتایار (مخصوص معلمان و مدارس)'}
              </span>
            </div>
          </div>

          {/* Live Site-Wide SEO Health Audit */}
          <div className="bg-gradient-to-l from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-black flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-400" />
                  <span>پایش سلامت فنی سئو وبلاگ (SEO Health Radar)</span>
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  وضعیت لحظه‌ای ایندکس، متا تگ‌ها و تصاویر منتشرشده در {seoTargetSite === 'nokita' ? 'nokita.kitayar.ir' : 'kitayar.ir'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={seoTargetSite === 'nokita' ? 'https://nokita.kitayar.ir/sitemap.xml' : 'https://kitayar.ir/sitemap.xml'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Globe size={14} /> بررسی Sitemap.xml
                </a>
                <a
                  href={seoTargetSite === 'nokita' ? 'https://nokita.kitayar.ir/robots.txt' : 'https://kitayar.ir/robots.txt'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  بررسی Robots.txt
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
              <div className="bg-white/10 border border-white/10 rounded-2xl p-3.5">
                <div className="text-[11px] text-slate-300">مقالات فعال در گوگل</div>
                <div className="text-xl font-black text-emerald-400 mt-1">
                  {seoAudit.totalPublished} مقاله
                </div>
              </div>
              <div className="bg-white/10 border border-white/10 rounded-2xl p-3.5">
                <div className="text-[11px] text-slate-300">فاقد کلمه کلیدی کانونی</div>
                <div className="text-xl font-black text-amber-300 mt-1">
                  {seoAudit.missingFocusKeyword} مورد
                </div>
              </div>
              <div className="bg-white/10 border border-white/10 rounded-2xl p-3.5">
                <div className="text-[11px] text-slate-300">فاقد توضیحات متا اختصاصی</div>
                <div className="text-xl font-black text-amber-300 mt-1">
                  {seoAudit.missingMetaDescription} مورد
                </div>
              </div>
              <div className="bg-white/10 border border-white/10 rounded-2xl p-3.5">
                <div className="text-[11px] text-slate-300">تصاویر بدون متن Alt</div>
                <div className="text-xl font-black text-rose-300 mt-1">
                  {seoAudit.missingMediaAlt} تصویر
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Section A: Title Structure & Meta Defaults */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <h3 className="font-black text-sm text-slate-900 pb-2 border-b border-slate-100">
                ۱. ساختار عنوان‌ها و متای اصلی وبلاگ
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  عنوان اصلی صفحه اول وبلاگ (`/blog`)
                </label>
                <input
                  type="text"
                  value={seoSettings.blogTitle}
                  onChange={(e) => setSeoSettings({ ...seoSettings, blogTitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  زیرعنوان هدر مجله آموزشی
                </label>
                <textarea
                  rows={2}
                  value={seoSettings.blogSubtitle}
                  onChange={(e) => setSeoSettings({ ...seoSettings, blogSubtitle: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    جداکننده عنوان سئو (Separator)
                  </label>
                  <select
                    value={seoSettings.titleSeparator}
                    onChange={(e) =>
                      setSeoSettings({ ...seoSettings, titleSeparator: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                  >
                    <option value="|">| (خط عمودی)</option>
                    <option value="•">• (نقطه توپر)</option>
                    <option value="-">- (خط تیره)</option>
                    <option value="—">— (خط کشیده)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    پسوند برند در انتهای عنوان‌ها
                  </label>
                  <input
                    type="text"
                    value={seoSettings.siteNameSuffix}
                    onChange={(e) =>
                      setSeoSettings({ ...seoSettings, siteNameSuffix: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900">
                پیش‌نمایش قالب عنوان مقالات در گوگل:{' '}
                <strong>
                  راهنمای طراحی آزمون استاندارد {seoSettings.titleSeparator}{' '}
                  {seoSettings.siteNameSuffix}
                </strong>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  توضیحات متای پیش‌فرض وبلاگ (Meta Description)
                </label>
                <textarea
                  rows={3}
                  value={seoSettings.defaultMetaDescription}
                  onChange={(e) =>
                    setSeoSettings({ ...seoSettings, defaultMetaDescription: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  کلمات کلیدی پایه وبلاگ (با ویرگول جدا کنید)
                </label>
                <input
                  type="text"
                  value={keywordsText}
                  onChange={(e) => setKeywordsText(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>

            {/* Section B: Search Console, Social Image, Categories & CTA */}
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                <h3 className="font-black text-sm text-slate-900 pb-2 border-b border-slate-100">
                  ۲. اتصال Google Search Console و ایندکس ربات‌ها
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    کد تایید مالکیت گوگل سرچ کنسول (Google Site Verification Code)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={seoSettings.googleSiteVerification}
                    onChange={(e) =>
                      setSeoSettings({
                        ...seoSettings,
                        googleSiteVerification: e.target.value,
                      })
                    }
                    placeholder="مثال: xYz123AbCdEfGhIjKlMnOpQrStUvWxYz"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    فقط مقدار content داخل تگ متای گوگل را وارد کنید تا در تمام صفحات سایت قرار گیرد.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    تصویر پیش‌فرض اشتراک‌گذاری (Default OpenGraph Image)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      dir="ltr"
                      value={seoSettings.defaultOgImage}
                      onChange={(e) =>
                        setSeoSettings({ ...seoSettings, defaultOgImage: e.target.value })
                      }
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setDefaultOgModalOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold"
                    >
                      انتخاب از رسانه
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <label className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs font-bold cursor-pointer">
                    <span>اجازه ایندکس وبلاگ (Index)</span>
                    <input
                      type="checkbox"
                      checked={seoSettings.defaultRobotsIndex}
                      onChange={(e) =>
                        setSeoSettings({
                          ...seoSettings,
                          defaultRobotsIndex: e.target.checked,
                        })
                      }
                    />
                  </label>
                  <label className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs font-bold cursor-pointer">
                    <span>دنبال‌کردن پیوندها (Follow)</span>
                    <input
                      type="checkbox"
                      checked={seoSettings.defaultRobotsFollow}
                      onChange={(e) =>
                        setSeoSettings({
                          ...seoSettings,
                          defaultRobotsFollow: e.target.checked,
                        })
                      }
                    />
                  </label>
                </div>
              </div>

              {/* Section C: Categories & Conversion CTA Box */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                <h3 className="font-black text-sm text-slate-900 pb-2 border-b border-slate-100">
                  ۳. دسته‌بندی‌های رسمی و بنر تبدیل کاربر در انتهای مقالات (CTA)
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    دسته‌بندی‌های موضوعی وبلاگ
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {seoSettings.categories.map((cat) => (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold"
                      >
                        {cat}
                        <button
                          type="button"
                          onClick={() =>
                            setSeoSettings({
                              ...seoSettings,
                              categories: seoSettings.categories.filter((c) => c !== cat),
                            })
                          }
                          className="text-slate-400 hover:text-rose-600 mr-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newGlobalCat}
                      onChange={(e) => setNewGlobalCat(e.target.value)}
                      placeholder="افزودن دسته‌بندی جدید..."
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const c = newGlobalCat.trim()
                        if (c && !seoSettings.categories.includes(c)) {
                          setSeoSettings({
                            ...seoSettings,
                            categories: [...seoSettings.categories, c],
                          })
                          setNewGlobalCat('')
                        }
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold"
                    >
                      افزودن
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2.5">
                  <label className="block text-xs font-bold text-slate-700">
                    عنوان باکس دعوت به اقدام (CTA) داخل مقالات
                  </label>
                  <input
                    type="text"
                    value={seoSettings.ctaBoxTitle}
                    onChange={(e) =>
                      setSeoSettings({ ...seoSettings, ctaBoxTitle: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                  <input
                    type="text"
                    value={seoSettings.ctaBoxSubtitle}
                    onChange={(e) =>
                      setSeoSettings({ ...seoSettings, ctaBoxSubtitle: e.target.value })
                    }
                    placeholder="توضیح زیر عنوان باکس CTA..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={seoSettings.ctaBoxButtonText}
                      onChange={(e) =>
                        setSeoSettings({ ...seoSettings, ctaBoxButtonText: e.target.value })
                      }
                      placeholder="متن دکمه"
                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                    />
                    <input
                      type="text"
                      dir="ltr"
                      value={seoSettings.ctaBoxButtonLink}
                      onChange={(e) =>
                        setSeoSettings({ ...seoSettings, ctaBoxButtonLink: e.target.value })
                      }
                      placeholder="/exam/create"
                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingGlobalSeo}
              className="px-7 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black flex items-center gap-2 shadow-lg shadow-blue-600/25 transition"
            >
              <CheckCircle2 size={18} />
              <span>
                {savingGlobalSeo ? 'در حال ذخیره تنظیمات...' : 'ذخیره تنظیمات کلی سئو وبلاگ'}
              </span>
            </button>
          </div>

          <WordPressMediaLibrary
            mode="modal"
            isOpen={defaultOgModalOpen}
            onClose={() => setDefaultOgModalOpen(false)}
            onSelect={(m) => setSeoSettings({ ...seoSettings, defaultOgImage: m.url })}
            selectButtonLabel="انتخاب به عنوان تصویر پیش‌فرض شبکه اجتماعی"
          />
        </form>
      )}
    </div>
  )
}

export default BlogManagementPage
