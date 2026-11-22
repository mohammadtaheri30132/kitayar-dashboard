import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { extensionAdminService } from '../services/extensionAdminService';
import type {
  ExtensionShortcutItem,
  ExtensionCalendarEventItem,
  ExtensionNotificationItem,
  ExtensionTeacherItem,
  ExtensionNewsItem,
  ExtensionSettingsItem,
} from '../services/extensionAdminService';

const JALALI_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

export default function ExtensionManagementPage() {
  const [activeTab, setActiveTab] = useState<'shortcuts' | 'news' | 'settings' | 'calendar' | 'notifications' | 'teachers'>('shortcuts');
  const [loading, setLoading] = useState(false);

  // داده‌ها
  const [shortcuts, setShortcuts] = useState<ExtensionShortcutItem[]>([]);
  const [newsList, setNewsList] = useState<ExtensionNewsItem[]>([]);
  const [settings, setSettings] = useState<ExtensionSettingsItem>({
    newsArchiveUrl: 'https://medu.ir/fa/archive?category=news',
    shortcutCategories: ['سامانه‌های رسمی', 'ابزارها', 'آموزشی', 'خدمات اداری'],
    subjects: { elementary: [], highschool: [] },
  });
  const [calendarEvents, setCalendarEvents] = useState<ExtensionCalendarEventItem[]>([]);
  const [notifications, setNotifications] = useState<ExtensionNotificationItem[]>([]);
  const [teachers, setTeachers] = useState<ExtensionTeacherItem[]>([]);
  const [searchTeacher, setSearchTeacher] = useState('');
  const [stats, setStats] = useState({
    teachersCount: 0,
    shortcutsCount: 0,
    eventsCount: 0,
    notificationsCount: 0,
    newsCount: 0,
  });

  // فرم وب‌سایت جدید
  const [newShortcut, setNewShortcut] = useState({
    title: '',
    url: 'https://',
    icon: '🌐',
    description: '',
    category: 'سامانه‌های رسمی',
    isPinned: true,
  });

  // فرم خبر جدید یا در حال ویرایش
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [newsForm, setNewsForm] = useState({
    title: '',
    summary: '',
    content: '',
    category: 'اخبار مهم',
    imageUrl: '',
    externalUrl: '',
    isPublished: true,
  });

  // فرم تنظیمات
  const [settingsForm, setSettingsForm] = useState({
    newsArchiveUrl: '',
    newCategoryInput: '',
    newElementarySubject: '',
    newHighschoolSubject: '',
  });

  // فرم رویداد تقویم جدید
  const [newEvent, setNewEvent] = useState({
    day: 24,
    month: 9,
    title: 'روز امتحانات',
    description: 'امتحانات هماهنگ نوبت اول مدارس',
    isExam: true,
    hasBlueDot: true,
    badgeText: 'امتحانات',
  });

  // فرم اعلان جدید
  const [newNotif, setNewNotif] = useState({
    title: '',
    message: '',
    tag: 'بخشنامه و خبر',
    linkUrl: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [ov, sc, nw, st, ce, nt, tc] = await Promise.all([
        extensionAdminService.getOverview().catch(() => ({})),
        extensionAdminService.getShortcuts().catch(() => []),
        extensionAdminService.getNews().catch(() => []),
        extensionAdminService.getSettings().catch(() => null),
        extensionAdminService.getCalendarEvents().catch(() => []),
        extensionAdminService.getNotifications().catch(() => []),
        extensionAdminService.getTeachers(searchTeacher).catch(() => []),
      ]);

      setStats({
        teachersCount: ov.teachersCount || tc.length || 0,
        shortcutsCount: sc.length || 0,
        eventsCount: ce.length || 0,
        notificationsCount: nt.length || 0,
        newsCount: nw.length || 0,
      });

      setShortcuts(sc);
      setNewsList(nw);
      if (st) {
        setSettings(st);
        setSettingsForm((prev) => ({
          ...prev,
          newsArchiveUrl: st.newsArchiveUrl || '',
        }));
      }
      setCalendarEvents(ce);
      setNotifications(nt);
      setTeachers(tc);
    } catch {
      toast.error('خطا در دریافت اطلاعات سامانه افزونه');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // افزودن وب‌سایت
  const handleAddShortcut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShortcut.title || !newShortcut.url) {
      toast.error('عنوان و آدرس وب‌سایت الزامی است');
      return;
    }
    try {
      await extensionAdminService.createShortcut(newShortcut);
      toast.success('وب‌سایت با موفقیت به ابتدای لیست افزونه اضافه شد');
      setNewShortcut({
        title: '',
        url: 'https://',
        icon: '🌐',
        description: '',
        category: settings.shortcutCategories[0] || 'سامانه‌های رسمی',
        isPinned: true,
      });
      loadData();
    } catch {
      toast.error('خطا در افزودن وب‌سایت');
    }
  };

  // حذف وب‌سایت
  const handleDeleteShortcut = async (id?: string) => {
    if (!id || !confirm('آیا از حذف این وب‌سایت از لیست افزونه اطمینان دارید؟')) return;
    try {
      await extensionAdminService.deleteShortcut(id);
      toast.success('وب‌سایت حذف شد');
      loadData();
    } catch {
      toast.error('خطا در حذف وب‌سایت');
    }
  };

  // ثبت یا ویرایش خبر
  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsForm.title.trim()) {
      toast.error('عنوان خبر الزامی است');
      return;
    }
    try {
      if (editingNewsId) {
        await extensionAdminService.updateNews(editingNewsId, newsForm);
        toast.success('خبر با موفقیت بروزرسانی شد');
      } else {
        await extensionAdminService.createNews(newsForm);
        toast.success('خبر جدید با موفقیت منتشر شد');
      }
      setEditingNewsId(null);
      setNewsForm({
        title: '',
        summary: '',
        content: '',
        category: 'اخبار مهم',
        imageUrl: '',
        externalUrl: '',
        isPublished: true,
      });
      loadData();
    } catch {
      toast.error('خطا در ثبت خبر');
    }
  };

  const handleEditNews = (item: ExtensionNewsItem) => {
    setEditingNewsId(item._id || null);
    setNewsForm({
      title: item.title,
      summary: item.summary || '',
      content: item.content || '',
      category: item.category || 'اخبار مهم',
      imageUrl: item.imageUrl || '',
      externalUrl: item.externalUrl || '',
      isPublished: item.isPublished ?? true,
    });
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleDeleteNews = async (id?: string) => {
    if (!id || !confirm('آیا از حذف این خبر اطمینان دارید؟')) return;
    try {
      await extensionAdminService.deleteNews(id);
      toast.success('خبر حذف شد');
      loadData();
    } catch {
      toast.error('خطا در حذف خبر');
    }
  };

  // ذخیره تنظیمات عمومی (لینک آرشیو و دسته‌بندی‌ها)
  const handleSaveArchiveUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await extensionAdminService.updateSettings({ newsArchiveUrl: settingsForm.newsArchiveUrl });
      toast.success('لینک صفحه مشاهده همه اخبار با موفقیت بروزرسانی شد');
      loadData();
    } catch {
      toast.error('خطا در ذخیره آدرس آرشیو اخبار');
    }
  };

  // افزودن دسته بندی میانبر جدید
  const handleAddCategory = async () => {
    const cat = settingsForm.newCategoryInput.trim();
    if (!cat) return;
    if (settings.shortcutCategories.includes(cat)) {
      toast.error('این دسته‌بندی قبلاً تعریف شده است');
      return;
    }
    const updated = [...settings.shortcutCategories, cat];
    try {
      await extensionAdminService.updateSettings({ shortcutCategories: updated });
      toast.success(`دسته «${cat}» اضافه شد`);
      setSettingsForm((prev) => ({ ...prev, newCategoryInput: '' }));
      loadData();
    } catch {
      toast.error('خطا در ثبت دسته‌بندی');
    }
  };

  const handleDeleteCategory = async (cat: string) => {
    if (!confirm(`آیا از حذف دسته «${cat}» اطمینان دارید؟`)) return;
    const updated = settings.shortcutCategories.filter((c) => c !== cat);
    try {
      await extensionAdminService.updateSettings({ shortcutCategories: updated });
      toast.success('دسته‌بندی حذف شد');
      loadData();
    } catch {
      toast.error('خطا در حذف دسته‌بندی');
    }
  };

  // افزودن یا حذف درس
  const handleAddSubject = async (grade: 'elementary' | 'highschool') => {
    const val = grade === 'elementary' ? settingsForm.newElementarySubject.trim() : settingsForm.newHighschoolSubject.trim();
    if (!val) return;
    const currentList = settings.subjects?.[grade] || [];
    if (currentList.includes(val)) {
      toast.error('این درس قبلاً در لیست وجود دارد');
      return;
    }
    const updated = {
      ...settings.subjects,
      [grade]: [...currentList, val],
    };
    try {
      await extensionAdminService.updateSettings({ subjects: updated });
      toast.success(`درس «${val}» اضافه شد`);
      setSettingsForm((prev) => ({
        ...prev,
        [grade === 'elementary' ? 'newElementarySubject' : 'newHighschoolSubject']: '',
      }));
      loadData();
    } catch {
      toast.error('خطا در ثبت درس');
    }
  };

  const handleDeleteSubject = async (grade: 'elementary' | 'highschool', sub: string) => {
    const currentList = settings.subjects?.[grade] || [];
    const updated = {
      ...settings.subjects,
      [grade]: currentList.filter((s) => s !== sub),
    };
    try {
      await extensionAdminService.updateSettings({ subjects: updated });
      toast.success(`درس «${sub}» حذف شد`);
      loadData();
    } catch {
      toast.error('خطا در حذف درس');
    }
  };

  // ثبت روز خاص تقویم
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title) {
      toast.error('عنوان روز خاص الزامی است');
      return;
    }
    try {
      await extensionAdminService.createCalendarEvent(newEvent);
      toast.success('روز خاص با نقطه آبی با موفقیت در تقویم افزونه ثبت شد');
      loadData();
    } catch {
      toast.error('خطا در ثبت رویداد تقویم');
    }
  };

  // حذف رویداد تقویم
  const handleDeleteEvent = async (id?: string) => {
    if (!id || !confirm('آیا از حذف این رویداد از تقویم اطمینان دارید؟')) return;
    try {
      await extensionAdminService.deleteCalendarEvent(id);
      toast.success('رویداد حذف شد');
      loadData();
    } catch {
      toast.error('خطا در حذف');
    }
  };

  // ارسال اعلان عمومی
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotif.title || !newNotif.message) {
      toast.error('عنوان و متن پیام الزامی است');
      return;
    }
    try {
      await extensionAdminService.broadcastNotification(newNotif);
      toast.success('اعلان خبر با موفقیت ارسال شد و در افزونه کاربران نمایش داده می‌شود');
      setNewNotif({ title: '', message: '', tag: 'بخشنامه و خبر', linkUrl: '' });
      loadData();
    } catch {
      toast.error('خطا در ارسال اعلان');
    }
  };

  // حذف اعلان
  const handleDeleteNotif = async (id?: string) => {
    if (!id || !confirm('آیا از حذف این اعلان اطمینان دارید؟')) return;
    try {
      await extensionAdminService.deleteNotification(id);
      toast.success('اعلان حذف شد');
      loadData();
    } catch {
      toast.error('خطا در حذف');
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans" dir="rtl">
      {/* هدر بالایی */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/20 border border-blue-500/20 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🧩</span>
            <h1 className="text-2xl font-bold text-white">مدیریت افزونه میز کار فرهنگیان (نسخه ۲)</h1>
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium">
              داینامیک و متصل
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">
            مدیریت کامل وب‌سایت‌ها با دسته‌بندی، وبلاگ خبری آموزش و پرورش، تنظیمات دروس مقاطع، تقویم و روزهای امتحانات با نقطه آبی و فهرست همکاران.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-2"
        >
          <span>🔄</span>
          <span>بروزرسانی داده‌ها</span>
        </button>
      </div>

      {/* کارت‌های خلاصه آمار */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-xl">
            👨‍🏫
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono">{stats.teachersCount}</div>
            <div className="text-xs text-slate-400">همکاران ثبت‌نامی</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xl">
            🌐
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono">{stats.shortcutsCount}</div>
            <div className="text-xs text-slate-400">وب‌سایت‌ها</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xl">
            📰
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono">{stats.newsCount}</div>
            <div className="text-xs text-slate-400">اخبار و بخشنامه‌ها</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xl">
            🔵
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono">{stats.eventsCount}</div>
            <div className="text-xs text-slate-400">رویدادها / امتحانات</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-xl">
            🔔
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono">{stats.notificationsCount}</div>
            <div className="text-xs text-slate-400">اعلانات فوری</div>
          </div>
        </div>
      </div>

      {/* تب‌های مدیریت */}
      <div className="flex border-b border-slate-800 text-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('shortcuts')}
          className={`px-5 py-3 border-b-2 font-medium transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'shortcuts'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🌐 وب‌سایت‌ها و دسته‌ها</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800">{shortcuts.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('news')}
          className={`px-5 py-3 border-b-2 font-medium transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'news'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>📰 اخبار و بخشنامه‌ها</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800">{newsList.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-5 py-3 border-b-2 font-medium transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'settings'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>⚙️ دروس مدارس و تنظیمات</span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-5 py-3 border-b-2 font-medium transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'calendar'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🔵 تقویم و امتحانات</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800">{calendarEvents.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-5 py-3 border-b-2 font-medium transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'notifications'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🔔 اعلان فوری</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800">{notifications.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('teachers')}
          className={`px-5 py-3 border-b-2 font-medium transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'teachers'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>👨‍🏫 همکاران ثبت‌نامی</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800">{teachers.length}</span>
        </button>
      </div>

      {/* ۱. تب وب‌سایت‌ها و میانبرها */}
      {activeTab === 'shortcuts' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* فرم افزودن وب‌سایت */}
          <div className="lg:col-span-1 p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>➕</span>
              <span>افزودن وب‌سایت به اول لیست</span>
            </h3>
            <form onSubmit={handleAddShortcut} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">عنوان وب‌سایت:</label>
                <input
                  type="text"
                  placeholder="مثلاً: سامانه ضمن خدمت فرهنگیان"
                  value={newShortcut.title}
                  onChange={(e) => setNewShortcut({ ...newShortcut, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">آدرس اینترنتی (URL):</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={newShortcut.url}
                  onChange={(e) => setNewShortcut({ ...newShortcut, url: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 text-left font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">دسته‌بندی وب‌سایت:</label>
                <select
                  value={newShortcut.category}
                  onChange={(e) => setNewShortcut({ ...newShortcut, category: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                >
                  {settings.shortcutCategories.map((cat, idx) => (
                    <option key={idx} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">آیکون / اموجی:</label>
                  <input
                    type="text"
                    placeholder="🏛️"
                    value={newShortcut.icon}
                    onChange={(e) => setNewShortcut({ ...newShortcut, icon: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none text-center text-lg"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 cursor-pointer text-xs text-slate-200">
                    <input
                      type="checkbox"
                      checked={newShortcut.isPinned}
                      onChange={(e) => setNewShortcut({ ...newShortcut, isPinned: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-0"
                    />
                    <span>پین در اول سایت‌ها</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">توضیح کوتاه:</label>
                <input
                  type="text"
                  placeholder="سامانه ورود معلمان و کادر مدرسه"
                  value={newShortcut.description}
                  onChange={(e) => setNewShortcut({ ...newShortcut, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 transition"
              >
                + افزودن وب‌سایت به افزونه
              </button>
            </form>
          </div>

          {/* لیست وب‌سایت‌های موجود */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-base font-bold text-white mb-2">وب‌سایت‌های فعال در افزونه فرهنگیان:</h3>
            {shortcuts.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">هیچ وب‌سایتی ثبت نشده است.</div>
            ) : (
              shortcuts.map((sc, idx) => (
                <div
                  key={sc._id || idx}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between gap-4 hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl shrink-0">
                      {sc.icon || '🌐'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm truncate">{sc.title}</span>
                        {sc.category && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20">
                            {sc.category}
                          </span>
                        )}
                        {sc.isPinned && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            ⭐ اول لیست
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 truncate mt-0.5 font-mono text-left">{sc.url}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={sc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 text-xs rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                      title="باز کردن لینک"
                    >
                      ↗
                    </a>
                    <button
                      onClick={() => handleDeleteShortcut(sc._id)}
                      className="p-2 text-xs rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                      title="حذف"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ۲. تب اخبار و وبلاگ آموزش و پرورش */}
      {activeTab === 'news' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* فرم ایجاد یا ویرایش خبر */}
          <div className="lg:col-span-1 p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{editingNewsId ? '✏️' : '➕'}</span>
                <span>{editingNewsId ? 'ویرایش خبر' : 'انتشار خبر جدید'}</span>
              </h3>
              {editingNewsId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingNewsId(null);
                    setNewsForm({
                      title: '',
                      summary: '',
                      content: '',
                      category: 'اخبار مهم',
                      imageUrl: '',
                      externalUrl: '',
                      isPublished: true,
                    });
                  }}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  انصراف
                </button>
              )}
            </div>

            <form onSubmit={handleSaveNews} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">عنوان خبر (اجباری):</label>
                <input
                  type="text"
                  placeholder="مثلاً: بخشنامه جدید ساماندهی نیروی انسانی"
                  value={newsForm.title}
                  onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">دسته‌بندی:</label>
                  <select
                    value={newsForm.category}
                    onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none"
                  >
                    <option value="اخبار مهم">اخبار مهم</option>
                    <option value="بخشنامه">بخشنامه</option>
                    <option value="استخدامی">استخدامی</option>
                    <option value="آموزشی">آموزشی</option>
                    <option value="رفاهی">رفاهی و حقوق</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 cursor-pointer text-xs text-slate-200">
                    <input
                      type="checkbox"
                      checked={newsForm.isPublished}
                      onChange={(e) => setNewsForm({ ...newsForm, isPublished: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-0"
                    />
                    <span>وضعیت انتشار در افزونه</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">خلاصه کوتاه خبر:</label>
                <input
                  type="text"
                  placeholder="یک یا دو خط خلاصه برای نمایش در کارت خبر..."
                  value={newsForm.summary}
                  onChange={(e) => setNewsForm({ ...newsForm, summary: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">متن کامل خبر (وبلاگی):</label>
                <textarea
                  rows={4}
                  placeholder="متن کامل خبر جهت مطالعه معلمان..."
                  value={newsForm.content}
                  onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">آدرس تصویر شاخص (اختیاری):</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={newsForm.imageUrl}
                  onChange={(e) => setNewsForm({ ...newsForm, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none text-left font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">لینک منبع خبر (اختیاری):</label>
                <input
                  type="text"
                  placeholder="https://medu.ir/..."
                  value={newsForm.externalUrl}
                  onChange={(e) => setNewsForm({ ...newsForm, externalUrl: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none text-left font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
              >
                <span>{editingNewsId ? '💾' : '📢'}</span>
                <span>{editingNewsId ? 'بروزرسانی خبر' : 'انتشار خبر در افزونه'}</span>
              </button>
            </form>
          </div>

          {/* لیست اخبار */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-base font-bold text-white mb-2">اخبار منتشرشده در افزونه:</h3>
            {newsList.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">هیچ خبری ثبت نشده است.</div>
            ) : (
              newsList.map((item) => (
                <div
                  key={item._id}
                  className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-start justify-between gap-4 hover:border-slate-700 transition"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm">{item.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-medium">
                        {item.category}
                      </span>
                      {item.isPublished ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400">
                          منتشر شده
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-700 text-slate-400">
                          پیش‌نویس
                        </span>
                      )}
                    </div>
                    {item.summary && <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">{item.summary}</p>}
                    {item.externalUrl && (
                      <a
                        href={item.externalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-400 hover:underline font-mono inline-block mt-1"
                      >
                        {item.externalUrl} ↗
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleEditNews(item)}
                      className="p-2 text-xs rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                      title="ویرایش"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteNews(item._id)}
                      className="p-2 text-xs rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                      title="حذف"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ۳. تب تنظیمات عمومی، دسته‌بندی‌ها و دروس مدارس */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* کارت تنظیم لینک آرشیو اخبار */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>🔗</span>
              <span>تنظیم لینک «مشاهده همه اخبار»</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              این آدرس مشخص می‌کند که با کلیک کاربر روی دکمه «مشاهده همه اخبار» در افزونه، چه صفحه‌ای باز شود.
            </p>
            <form onSubmit={handleSaveArchiveUrl} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">آدرس اینترنتی آرشیو اخبار:</label>
                <input
                  type="text"
                  placeholder="https://medu.ir/fa/archive"
                  value={settingsForm.newsArchiveUrl}
                  onChange={(e) => setSettingsForm({ ...settingsForm, newsArchiveUrl: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 text-left font-mono"
                  required
                />
              </div>
              <button
                type="submit"
                className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition"
              >
                ذخیره لینک آرشیو
              </button>
            </form>
          </div>

          {/* کارت مدیریت دسته‌بندی‌های وب‌سایت‌ها */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>📂</span>
              <span>دسته‌بندی‌های وب‌سایت‌ها</span>
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="نام دسته جدید (مثلاً: اداری، ابزارها)"
                value={settingsForm.newCategoryInput}
                onChange={(e) => setSettingsForm({ ...settingsForm, newCategoryInput: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                className="flex-1 px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition"
              >
                + افزودن
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {settings.shortcutCategories.map((cat, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200"
                >
                  <span>{cat}</span>
                  <button
                    onClick={() => handleDeleteCategory(cat)}
                    className="text-red-400 hover:text-red-300 font-bold"
                    title="حذف دسته"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* کارت مدیریت دروس دبستان */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>🎒</span>
              <span>دروس مقطع ابتدایی (دبستان)</span>
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="نام درس (مثلاً: علوم تجربی)"
                value={settingsForm.newElementarySubject}
                onChange={(e) => setSettingsForm({ ...settingsForm, newElementarySubject: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubject('elementary')}
                className="flex-1 px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => handleAddSubject('elementary')}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition"
              >
                + افزودن
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {(settings.subjects?.elementary || []).map((sub, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-blue-300"
                >
                  <span>{sub}</span>
                  <button
                    onClick={() => handleDeleteSubject('elementary', sub)}
                    className="text-red-400 hover:text-red-300 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* کارت مدیریت دروس متوسطه */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>🎓</span>
              <span>دروس مقطع متوسطه</span>
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="نام درس (مثلاً: هندسه تحلیلی)"
                value={settingsForm.newHighschoolSubject}
                onChange={(e) => setSettingsForm({ ...settingsForm, newHighschoolSubject: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubject('highschool')}
                className="flex-1 px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => handleAddSubject('highschool')}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition"
              >
                + افزودن
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {(settings.subjects?.highschool || []).map((sub, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-indigo-300"
                >
                  <span>{sub}</span>
                  <button
                    onClick={() => handleDeleteSubject('highschool', sub)}
                    className="text-red-400 hover:text-red-300 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ۴. تب تقویم و روزهای خاص */}
      {activeTab === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* فرم افزودن روز خاص */}
          <div className="lg:col-span-1 p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <span>🔵</span>
              <span>تعیین روز خاص در تقویم</span>
            </h3>
            <form onSubmit={handleAddEvent} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">ماه شمسی:</label>
                  <select
                    value={newEvent.month}
                    onChange={(e) => setNewEvent({ ...newEvent, month: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none"
                  >
                    {JALALI_MONTHS.map((m, i) => (
                      <option key={i} value={i + 1}>
                        {m} ({i + 1})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">روز (۱ تا ۳۱):</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={newEvent.day}
                    onChange={(e) => setNewEvent({ ...newEvent, day: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none text-center font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">عنوان مناسبت یا رویداد:</label>
                <input
                  type="text"
                  placeholder="مثلاً: ۲۴ روز امتحانات است"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">توضیح کوتاه:</label>
                <input
                  type="text"
                  placeholder="برگزاری امتحانات هماهنگ استانی"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none"
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 cursor-pointer text-xs text-slate-200">
                  <input
                    type="checkbox"
                    checked={newEvent.hasBlueDot}
                    onChange={(e) => setNewEvent({ ...newEvent, hasBlueDot: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                  <span>نمایش نقطه آبی در خانه این روز تقویم 🔵</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 cursor-pointer text-xs text-slate-200">
                  <input
                    type="checkbox"
                    checked={newEvent.isExam}
                    onChange={(e) => setNewEvent({ ...newEvent, isExam: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-0"
                  />
                  <span>روز آزمون یا امتحانات مدرسه 📝</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 transition"
              >
                ثبت در تقویم افزونه
              </button>
            </form>
          </div>

          {/* لیست روزهای خاص */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-base font-bold text-white mb-2">روزهای مشخص‌شده در تقویم افزونه فرهنگیان:</h3>
            {calendarEvents.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">هیچ روز خاصی هنوز تعیین نشده است.</div>
            ) : (
              calendarEvents.map((ev, idx) => (
                <div
                  key={ev._id || idx}
                  className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col items-center justify-center text-blue-400 font-mono">
                      <span className="text-base font-bold leading-none">{ev.day}</span>
                      <span className="text-[10px] text-slate-400">{JALALI_MONTHS[ev.month - 1]}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{ev.title}</span>
                        {ev.hasBlueDot && (
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50 inline-block" title="دارای نقطه آبی" />
                        )}
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-medium">
                          {ev.badgeText || (ev.isExam ? 'امتحانات' : 'رویداد')}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">{ev.description || 'بدون توضیح اضافی'}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteEvent(ev._id)}
                    className="p-2 text-xs rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 shrink-0"
                    title="حذف"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ۵. تب ارسال خبر و اعلان فوری */}
      {activeTab === 'notifications' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <span>📢</span>
              <span>ارسال اعلان و خبر فوری به معلمان</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              پیام ارسال‌شده در نوار اخبار افزونه فرهنگیان قرار می‌گیرد و به عنوان نوتیفیکیشن دسکتاپ برای کاربران فعال نمایش داده می‌شود.
            </p>
            <form onSubmit={handleSendNotification} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">عنوان خبر:</label>
                <input
                  type="text"
                  placeholder="مثلاً: بخشنامه جدید ساعات کاری مدارس"
                  value={newNotif.title}
                  onChange={(e) => setNewNotif({ ...newNotif, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">برچسب / موضوع:</label>
                <input
                  type="text"
                  placeholder="آموزشی / اداری / فوری"
                  value={newNotif.tag}
                  onChange={(e) => setNewNotif({ ...newNotif, tag: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">متن خبر یا اعلان:</label>
                <textarea
                  rows={4}
                  placeholder="متن کامل خبر، جزئیات بخشنامه یا تذکر اداری..."
                  value={newNotif.message}
                  onChange={(e) => setNewNotif({ ...newNotif, message: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">لینک مرتبط (اختیاری):</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={newNotif.linkUrl}
                  onChange={(e) => setNewNotif({ ...newNotif, linkUrl: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none text-left font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2"
              >
                <span>🚀</span>
                <span>ارسال اعلان فوری به افزونه‌ها</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-base font-bold text-white mb-2">تاریخچه اعلانات ارسال‌شده:</h3>
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">هیچ اعلانی ارسال نشده است.</div>
            ) : (
              notifications.map((nt, idx) => (
                <div
                  key={nt._id || idx}
                  className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{nt.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-medium">
                        {nt.tag || 'خبر'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{nt.message}</p>
                    {nt.linkUrl && (
                      <a
                        href={nt.linkUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-400 hover:underline font-mono inline-block mt-1"
                      >
                        {nt.linkUrl} ↗
                      </a>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteNotif(nt._id)}
                    className="p-2 text-xs rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 shrink-0"
                    title="حذف"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ۶. تب همکاران ثبت‌نام‌شده */}
      {activeTab === 'teachers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="w-72">
              <input
                type="text"
                placeholder="جستجو بر اساس نام، شماره، مدرسه یا منطقه..."
                value={searchTeacher}
                onChange={(e) => setSearchTeacher(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadData()}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <span className="text-xs text-slate-400">مجموع: {teachers.length} نفر</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-900/80">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-800/50 text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">نام و مشخصات همکار</th>
                  <th className="px-4 py-3">شماره تلفن همراه</th>
                  <th className="px-4 py-3">محیط کاری</th>
                  <th className="px-4 py-3">مدرسه / اداره</th>
                  <th className="px-4 py-3">سمت</th>
                  <th className="px-4 py-3">شهر</th>
                  <th className="px-4 py-3">فایل یا مدارک بارگذاری‌شده</th>
                  <th className="px-4 py-3">وضعیت تایید</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {teachers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-500">
                      همکاری ثبت‌نام نکرده است.
                    </td>
                  </tr>
                ) : (
                  teachers.map((tc) => (
                    <tr key={tc._id} className="hover:bg-slate-800/30 transition">
                      <td className="px-4 py-3 font-semibold text-white">{tc.fullName}</td>
                      <td className="px-4 py-3 font-mono text-slate-300">{tc.phone}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] ${
                            tc.workMode === 'office'
                              ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                              : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                          }`}
                        >
                          {tc.workMode === 'office' ? '🏢 اداری' : '🏫 مدرسه'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {tc.workMode === 'office'
                          ? tc.districtName || 'اداره آموزش و پرورش'
                          : tc.schoolName || '---'}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{tc.role || 'معلم'}</td>
                      <td className="px-4 py-3 text-slate-400">{tc.city || 'تهران'}</td>
                      <td className="px-4 py-3">
                        {tc.fileUrl ? (
                          <a
                            href={tc.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20"
                          >
                            <span>📎</span>
                            <span>{tc.fileName || 'مشاهده مدرک'}</span>
                          </a>
                        ) : (
                          <span className="text-slate-500">بدون فایل</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          ✓ تایید شده با کد تایید پیامکی
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
