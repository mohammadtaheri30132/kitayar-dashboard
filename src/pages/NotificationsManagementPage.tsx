import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  adminNotificationService,
  type SendTeacherNotificationPayload,
  type FcmSettings,
  type AdminNotificationItem,
} from '../services/adminNotificationService';

type AudienceType = 'teachers' | 'students' | 'all' | 'targeted';

export default function NotificationsManagementPage() {
  const [activeTab, setActiveTab] = useState<'send' | 'fcm' | 'history'>('send');
  const [audience, setAudience] = useState<AudienceType>('teachers');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    priority: 'normal' as 'normal' | 'high' | 'urgent' | 'low',
    category: 'all',
    position: 'all',
    school: '',
    targetedPhones: '',
  });

  const [targetCount, setTargetCount] = useState<number | null>(null);
  const [countingLoading, setCountingLoading] = useState<boolean>(false);
  const [sendingLoading, setSendingLoading] = useState<boolean>(false);

  // FCM Settings State
  const [fcmSettings, setFcmSettings] = useState<FcmSettings>({
    serverKey: '',
    enabled: true,
    activeTokensCount: 0,
  });
  const [fcmLoading, setFcmLoading] = useState<boolean>(false);
  const [showKey, setShowKey] = useState<boolean>(false);

  // History State
  const [history, setHistory] = useState<AdminNotificationItem[]>([]);
  const [historyTotal, setHistoryTotal] = useState<number>(0);
  const [historyPage, setHistoryPage] = useState<number>(1);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  // Test Notification State
  const [isTestModalOpen, setIsTestModalOpen] = useState<boolean>(false);
  const [testPhone, setTestPhone] = useState<string>('09137780061');
  const [testRole, setTestRole] = useState<'teacher' | 'student' | 'all'>('teacher');
  const [testTitle, setTestTitle] = useState<string>('🔔 تست اعلان زنده کیتایار');
  const [testBody, setTestBody] = useState<string>('این یک پیام آزمایشی جهت تایید دریافت نوتیفیکیشن روی گوشی معلم است 🚀');
  const [testLoading, setTestLoading] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
  } | null>(null);

  // Calculate target count when audience or filters change
  useEffect(() => {
    if (activeTab === 'send') {
      const timer = setTimeout(() => {
        fetchTargetCount();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [audience, formData.category, formData.position, formData.school, formData.targetedPhones, activeTab]);

  useEffect(() => {
    if (activeTab === 'fcm') {
      fetchFcmSettings();
    } else if (activeTab === 'history') {
      fetchHistory(historyPage);
    }
  }, [activeTab, historyPage]);

  const fetchTargetCount = async () => {
    if (audience === 'targeted') {
      const phones = formData.targetedPhones
        .split(/[\n,]/)
        .map((p) => p.trim())
        .filter((p) => p.length >= 10);
      setTargetCount(phones.length);
      return;
    }

    setCountingLoading(true);
    try {
      if (audience === 'teachers') {
        const count = await adminNotificationService.getFilteredCount({
          category: formData.category,
          position: formData.position,
          school: formData.school,
        });
        setTargetCount(count);
      } else if (audience === 'students') {
        const count = await adminNotificationService.getStudentsCount();
        setTargetCount(count);
      } else if (audience === 'all') {
        const [teachersCount, studentsCount] = await Promise.all([
          adminNotificationService.getFilteredCount({ category: 'all', position: 'all' }),
          adminNotificationService.getStudentsCount(),
        ]);
        setTargetCount(teachersCount + studentsCount);
      }
    } catch (e) {
      console.error('Error fetching target count:', e);
    } finally {
      setCountingLoading(false);
    }
  };

  const fetchFcmSettings = async () => {
    setFcmLoading(true);
    try {
      const data = await adminNotificationService.getFcmSettings();
      setFcmSettings(data);
    } catch (err: any) {
      toast.error('خطا در دریافت تنظیمات FCM');
    } finally {
      setFcmLoading(false);
    }
  };

  const fetchHistory = async (page: number) => {
    setHistoryLoading(true);
    try {
      const res = await adminNotificationService.getHistory(page, 15);
      setHistory(res.notifications || []);
      setHistoryTotal(res.total || 0);
    } catch (err) {
      toast.error('خطا در دریافت تاریخچه اعلان‌ها');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.body.trim()) {
      toast.error('لطفاً عنوان و متن اعلان را وارد کنید.');
      return;
    }

    let confirmMsg = '';
    if (audience === 'teachers') {
      confirmMsg = `آیا مایل به ارسال اعلان برای ${targetCount ?? 'همه‌ی'} معلمان منتخب هستید؟`;
    } else if (audience === 'students') {
      confirmMsg = `آیا مایل به ارسال اعلان برای تمام دانش‌آموزان (${targetCount ?? ''} نفر) هستید؟`;
    } else if (audience === 'all') {
      confirmMsg = `آیا مایل به ارسال اعلان همگانی برای تمام معلمان و دانش‌آموزان (${targetCount ?? ''} نفر) هستید؟`;
    } else {
      confirmMsg = `آیا مایل به ارسال اعلان برای ${targetCount ?? 0} شماره وارد شده هستید؟`;
    }

    if (!window.confirm(confirmMsg)) return;

    setSendingLoading(true);
    try {
      let res: { success: boolean; message: string; sentCount: number };

      const basePayload = {
        title: formData.title.trim(),
        body: formData.body.trim(),
        priority: formData.priority,
      };

      if (audience === 'teachers') {
        res = await adminNotificationService.sendToTeachers({
          ...basePayload,
          category: formData.category,
          position: formData.position,
          school: formData.school,
        });
      } else if (audience === 'students') {
        res = await adminNotificationService.sendToStudents(basePayload);
      } else if (audience === 'all') {
        res = await adminNotificationService.sendToAll(basePayload);
      } else {
        const phones = formData.targetedPhones
          .split(/[\n,]/)
          .map((p) => p.trim())
          .filter((p) => p.length >= 10);

        if (phones.length === 0) {
          toast.error('حداقل یک شماره تلفن معتبر وارد کنید.');
          setSendingLoading(false);
          return;
        }

        res = await adminNotificationService.sendTargeted({
          ...basePayload,
          phones,
          recipientType: 'all',
        });
      }

      toast.success(res.message || 'اعلان با موفقیت ارسال شد');
      setFormData((prev) => ({
        ...prev,
        title: '',
        body: '',
        targetedPhones: '',
      }));
      fetchTargetCount();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'خطا در ارسال اعلان');
    } finally {
      setSendingLoading(false);
    }
  };

  const handleSaveFcm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFcmLoading(true);
    try {
      const res = await adminNotificationService.updateFcmSettings({
        serverKey: fcmSettings.serverKey.trim(),
        enabled: fcmSettings.enabled,
      });
      toast.success(res.message || 'تنظیمات با موفقیت ذخیره شد');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'خطا در ذخیره تنظیمات');
    } finally {
      setFcmLoading(false);
    }
  };

  const handleSendTest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await adminNotificationService.sendTestNotification({
        phone: testPhone.trim() || undefined,
        targetRole: testRole,
        title: testTitle.trim(),
        body: testBody.trim(),
      });
      setTestResult(res);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'خطا در ارسال نوتیفیکیشن آزمایشی';
      setTestResult({
        success: false,
        message: errMsg,
        data: err.response?.data?.data,
      });
      toast.error(errMsg);
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-800/60 p-6 rounded-2xl border border-gray-700/50 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <span className="text-3xl">🔔</span>
            مرکز مدیریت اعلان‌ها و پیام‌رسانی
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            ارسال پیام و پوش‌نوتیفیکیشن هوشمند به معلمان کیتایار، دانش‌آموزان نوکیتا یا ارسال هدفمند به همراه تنظیمات FCM
          </p>
        </div>

        {/* Actions & Tab switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setIsTestModalOpen(true);
              setTestResult(null);
            }}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 text-sm"
          >
            <span className="text-base">🧪</span>
            <span>ارسال نوتیفیکیشن تستی</span>
          </button>

          <div className="flex items-center gap-2 bg-gray-900/60 p-1.5 rounded-xl border border-gray-700/60">
            <button
              onClick={() => setActiveTab('send')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'send'
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              ✉️ ارسال اعلان جدید
            </button>
            <button
              onClick={() => setActiveTab('fcm')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'fcm'
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🔑 تنظیمات FCM
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📋 تاریخچه اعلان‌ها
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: Send Notification */}
      {activeTab === 'send' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form (2 cols) */}
          <div className="lg:col-span-2 bg-gray-800/40 p-6 rounded-2xl border border-gray-700/50 backdrop-blur-sm space-y-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-gray-700/50 pb-3">
              <span>✍️</span> تنظیم پیام و انتخاب مخاطبان
            </h2>

            {/* Audience Selector Tabs */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                گروه هدف مخاطبین <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setAudience('teachers')}
                  className={`p-3 rounded-xl border text-sm font-bold flex flex-col items-center gap-1.5 transition-all ${
                    audience === 'teachers'
                      ? 'bg-primary-500/20 border-primary-500 text-primary-300 shadow-md shadow-primary-500/10'
                      : 'bg-gray-900/50 border-gray-700 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span className="text-xl">👨‍🏫</span>
                  <span>معلمان (کیتایار)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAudience('students')}
                  className={`p-3 rounded-xl border text-sm font-bold flex flex-col items-center gap-1.5 transition-all ${
                    audience === 'students'
                      ? 'bg-primary-500/20 border-primary-500 text-primary-300 shadow-md shadow-primary-500/10'
                      : 'bg-gray-900/50 border-gray-700 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span className="text-xl">🎒</span>
                  <span>دانش‌آموزان (نوکیتا)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAudience('all')}
                  className={`p-3 rounded-xl border text-sm font-bold flex flex-col items-center gap-1.5 transition-all ${
                    audience === 'all'
                      ? 'bg-primary-500/20 border-primary-500 text-primary-300 shadow-md shadow-primary-500/10'
                      : 'bg-gray-900/50 border-gray-700 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span className="text-xl">👥</span>
                  <span>همه کاربران سامانه</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAudience('targeted')}
                  className={`p-3 rounded-xl border text-sm font-bold flex flex-col items-center gap-1.5 transition-all ${
                    audience === 'targeted'
                      ? 'bg-primary-500/20 border-primary-500 text-primary-300 shadow-md shadow-primary-500/10'
                      : 'bg-gray-900/50 border-gray-700 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span className="text-xl">🎯</span>
                  <span>شماره‌های خاص</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-4 pt-2">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  عنوان اعلان <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثلاً: شروع ثبت نام کلاس‌های تقویتی / بروزرسانی برنامه درسی"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-gray-900/60 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  متن پیام <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="متن کامل پیامی که در نوتیفیکیشن گوشی و همچنین در بخش اعلان‌های اپلیکیشن ثبت خواهد شد..."
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="w-full bg-gray-900/60 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors resize-y"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    اولویت اعلان
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full bg-gray-900/60 border border-gray-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-primary-500"
                  >
                    <option value="normal">عادی (Normal)</option>
                    <option value="high">مهم (High)</option>
                    <option value="urgent">فوری و اضطراری (Urgent)</option>
                    <option value="low">کم‌اهمیت (Low)</option>
                  </select>
                </div>

                {/* If teachers audience, show category filter */}
                {audience === 'teachers' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      دوره تحصیلی معلمان
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-gray-900/60 border border-gray-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-primary-500"
                    >
                      <option value="all">همه دوره‌ها</option>
                      <option value="آموزگار">آموزگار (ابتدایی)</option>
                      <option value="دبیر">دبیر (متوسطه)</option>
                      <option value="هنرآموز">هنرآموز (فنی / هنرستان)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Extra Filters for Teachers */}
              {audience === 'teachers' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      سمت سازمانی
                    </label>
                    <select
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full bg-gray-900/60 border border-gray-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-primary-500"
                    >
                      <option value="all">همه سمت‌ها</option>
                      <option value="معلم">معلم</option>
                      <option value="مدیر">مدیر مدرسه</option>
                      <option value="معاون">معاون</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      فیلتر بر اساس نام مدرسه (اختیاری)
                    </label>
                    <input
                      type="text"
                      placeholder="بخشی از نام مدرسه..."
                      value={formData.school}
                      onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                      className="w-full bg-gray-900/60 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>
              )}

              {/* Targeted Phones Textarea */}
              {audience === 'targeted' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    شماره موبایل‌های دریافت‌کننده (با کاما یا خط جدید جدا کنید)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="09120000000&#10;09350000000"
                    value={formData.targetedPhones}
                    onChange={(e) => setFormData({ ...formData, targetedPhones: e.target.value })}
                    className="w-full bg-gray-900/60 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 font-mono text-sm focus:outline-none focus:border-primary-500 resize-y"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    سامانه پیام را هم در حساب کاربری این شماره‌ها ذخیره می‌کند و هم به دیوایس‌های فعال آنها پوش ارسال خواهد کرد.
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-700/50 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={sendingLoading || targetCount === 0}
                  className="bg-primary-600 hover:bg-primary-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-primary-600/30 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      در حال ارسال...
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      ارسال اعلان به {targetCount !== null ? `${targetCount.toLocaleString('fa-IR')} کاربر` : 'مخاطبان'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar / Live Count Preview (1 col) */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 p-6 rounded-2xl border border-primary-500/30 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>🎯</span> برآورد مخاطبان هدف
              </h3>
              <p className="text-xs text-gray-400">
                تعداد کاربران واجد شرایط دریافت اعلان بر اساس تنظیمات انتخابی به صورت زنده محاسبه می‌شود:
              </p>

              <div className="bg-gray-950/60 p-4 rounded-xl border border-gray-800 text-center space-y-1">
                <span className="text-xs text-gray-400">
                  {audience === 'teachers' && 'معلمان منطبق'}
                  {audience === 'students' && 'کل دانش‌آموزان فعال'}
                  {audience === 'all' && 'مجموع کل کاربران'}
                  {audience === 'targeted' && 'شماره‌های معتبر'}
                </span>
                <div className="text-3xl font-extrabold text-primary-400 flex items-center justify-center gap-2">
                  {countingLoading ? (
                    <div className="w-6 h-6 border-2 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
                  ) : (
                    <span>{targetCount !== null ? targetCount.toLocaleString('fa-IR') : '—'}</span>
                  )}
                  <span className="text-sm font-normal text-gray-400">نفر</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-gray-300">
                <div className="flex justify-between py-1 border-b border-gray-800">
                  <span className="text-gray-400">جامعه هدف:</span>
                  <span className="font-semibold text-white">
                    {audience === 'teachers' && 'معلمان کیتایار'}
                    {audience === 'students' && 'دانش‌آموزان نوکیتا'}
                    {audience === 'all' && 'همه کاربران'}
                    {audience === 'targeted' && 'شماره‌های دستی'}
                  </span>
                </div>
                {audience === 'teachers' && (
                  <>
                    <div className="flex justify-between py-1 border-b border-gray-800">
                      <span className="text-gray-400">رسته انتخابی:</span>
                      <span className="font-semibold text-white">
                        {formData.category === 'all' ? 'همه دوره‌ها' : formData.category}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-800">
                      <span className="text-gray-400">سمت انتخابی:</span>
                      <span className="font-semibold text-white">
                        {formData.position === 'all' ? 'همه سمت‌ها' : formData.position}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300 space-y-1">
                <p className="font-semibold">💡 عملکرد دوگانه ارسال:</p>
                <p className="text-amber-200/80 leading-relaxed">
                  ۱. ذخیره پایدار در دیتابیس (نمایش در بخش اعلانات اپلیکیشن‌ها).<br />
                  ۲. ارسال همزمان پوش‌نوتیفیکیشن لحظه‌ای به گوشی‌های همراه توسط سرور Firebase.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FCM Server Key Settings */}
      {activeTab === 'fcm' && (
        <div className="max-w-3xl mx-auto bg-gray-800/40 p-6 rounded-2xl border border-gray-700/50 backdrop-blur-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-700/50 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🔑</span> پیکربندی Google Firebase Cloud Messaging (FCM)
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                پروژه‌ی Firebase متصل به کیتایار و نوکیتا (پروژه: <span className="font-mono text-primary-300">kitayar-1921c</span>)
              </p>
            </div>
            <div className="bg-gray-900/80 px-3 py-1.5 rounded-xl border border-gray-700 text-xs text-gray-300">
              دستگاه‌های ثبت‌شده: <span className="text-emerald-400 font-bold">{fcmSettings.activeTokensCount || 0}</span>
            </div>
          </div>

          <form onSubmit={handleSaveFcm} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                وضعیت سرویس پوش نوتیفیکیشن
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={fcmSettings.enabled}
                  onChange={(e) => setFcmSettings({ ...fcmSettings, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                <span className="mr-3 text-sm font-medium text-gray-300">
                  {fcmSettings.enabled ? 'فعال (ارسال پوش نوتیفیکیشن زنده به دیوایس‌ها)' : 'غیرفعال (تنها در دیتابیس ذخیره می‌شود)'}
                </span>
              </label>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-xs text-emerald-300 space-y-2">
              <h4 className="font-bold flex items-center gap-1.5 text-sm">
                <span>🛡️</span> وضعیت احراز هویت سرور با کلید اختصاصی Service Account:
              </h4>
              <p className="text-emerald-200/90 leading-relaxed">
                کلید Service Account پروژه فایربیس <span className="font-mono">kitayar-1921c</span> در محیط امن سرور بک‌اند نصب و تایید شده است. اعلان‌های سیستمی، رزروهای آنلاین و پیام‌های چت به طور مستقیم و امن ارسال می‌شوند.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-700/50 flex justify-end">
              <button
                type="submit"
                disabled={fcmLoading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {fcmLoading ? 'در حال ذخیره...' : '💾 ذخیره تغییرات'}
              </button>
            </div>
          </form>

          {/* Test Notification Card inside FCM Settings */}
          <div className="mt-8 pt-6 border-t border-gray-700/60 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>🧪</span> آزمایش و بررسی زنده ارسال نوتیفیکیشن
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  می‌توانید همین حالا یک اعلان آزمایشی به شماره همراه خود ارسال کنید تا از دریافت لحظه‌ای آن روی اپلیکیشن کیتایار مطمئن شوید.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleSendTest()}
                disabled={testLoading}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-orange-500/25 transition-all flex items-center gap-2 text-sm disabled:opacity-50"
              >
                {testLoading ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>🚀</span>
                )}
                <span>ارسال تست به {testPhone || 'معلم'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-900/50 p-4 rounded-xl border border-gray-700/50">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">شماره همراه هدف برای تست:</label>
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="09137780061"
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">نقش هدف:</label>
                <select
                  value={testRole}
                  onChange={(e: any) => setTestRole(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                >
                  <option value="teacher">👨‍🏫 معلمان (کیتایار)</option>
                  <option value="student">🎒 دانش‌آموزان (نوکیتا)</option>
                  <option value="all">👥 همه کاربران</option>
                </select>
              </div>
            </div>

            {testResult && (
              <div
                className={`p-4 rounded-xl border text-xs space-y-1 ${
                  testResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}
              >
                <p className="font-bold flex items-center gap-1.5 text-sm">
                  <span>{testResult.success ? '✅' : '❌'}</span>
                  <span>{testResult.message}</span>
                </p>
                {testResult.data && (
                  <div className="text-gray-300 font-mono text-[11px] pt-1 border-t border-gray-700/40">
                    توکن‌های پیدا شده: {testResult.data.tokensFound || 0} | موفق: {testResult.data.successCount || 0} | ناموفق: {testResult.data.failureCount || 0}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: History */}
      {activeTab === 'history' && (
        <div className="bg-gray-800/40 p-6 rounded-2xl border border-gray-700/50 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-700/50 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>📋</span> تاریخچه اعلان‌های ارسالی مدیریت
            </h2>
            <span className="text-xs text-gray-400">
              مجموع: {historyTotal.toLocaleString('fa-IR')} اعلان
            </span>
          </div>

          {historyLoading ? (
            <div className="py-12 flex justify-center items-center">
              <div className="w-8 h-8 border-3 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-gray-400 space-y-2">
              <div className="text-4xl">📭</div>
              <p>تاکنون اعلانی ارسال نشده است.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-gray-700/70 text-gray-400 text-xs">
                    <th className="py-3 px-4">عنوان اعلان</th>
                    <th className="py-3 px-4">متن</th>
                    <th className="py-3 px-4">مخاطب</th>
                    <th className="py-3 px-4">اولویت</th>
                    <th className="py-3 px-4">تاریخ ارسال</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/40">
                  {history.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-700/20 transition-colors">
                      <td className="py-3 px-4 font-semibold text-white">
                        {item.title}
                      </td>
                      <td className="py-3 px-4 text-gray-300 max-w-xs truncate">
                        {item.body}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <span className="bg-gray-800 px-2.5 py-1 rounded-full text-gray-300">
                          {item.recipientType === 'teacher' && 'معلمان'}
                          {item.recipientType === 'student' && 'دانش‌آموزان'}
                          {item.recipientType === 'all' && 'همه کاربران'}
                          {item.recipientPhone && ` (${item.recipientPhone})`}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            item.priority === 'urgent'
                              ? 'bg-red-500/20 text-red-300'
                              : item.priority === 'high'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {item.priority === 'urgent' ? 'فوری' : item.priority === 'high' ? 'مهم' : 'عادی'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-400 font-mono" dir="ltr">
                        {new Date(item.createdAt).toLocaleString('fa-IR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Test Notification Modal */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🧪</span> ارسال نوتیفیکیشن آزمایشی (تست)
              </h3>
              <button
                type="button"
                onClick={() => setIsTestModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-all text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendTest} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  شماره همراه جهت دریافت نوتیفیکیشن:
                </label>
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="09137780061 (خالی = همه دیوایس‌های فعال معلم)"
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:border-primary-500 focus:outline-none"
                  dir="ltr"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  اگر خالی بگذارید، به تمامی دستگاه‌های ثبت‌شده معلمان ارسال می‌شود.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  نقش مخاطب:
                </label>
                <select
                  value={testRole}
                  onChange={(e: any) => setTestRole(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary-500 focus:outline-none"
                >
                  <option value="teacher">👨‍🏫 معلمان (کیتایار)</option>
                  <option value="student">🎒 دانش‌آموزان (نوکیتا)</option>
                  <option value="all">👥 همه کاربران</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  عنوان اعلان تستی:
                </label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  متن پیام تستی:
                </label>
                <textarea
                  rows={2}
                  value={testBody}
                  onChange={(e) => setTestBody(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary-500 focus:outline-none resize-none"
                />
              </div>

              {testResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                    testResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-red-500/10 border-red-500/30 text-red-300'
                  }`}
                >
                  <p className="font-bold flex items-center gap-1.5">
                    <span>{testResult.success ? '✅' : '❌'}</span>
                    <span>{testResult.message}</span>
                  </p>
                  {testResult.data && (
                    <div className="text-gray-300 font-mono text-[11px] pt-1 border-t border-gray-700/40">
                      دستگاه‌های کشف‌شده: {testResult.data.tokensFound || 0} | موفق: {testResult.data.successCount || 0} | خطا: {testResult.data.failureCount || 0}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-3 border-t border-gray-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
                >
                  بستن
                </button>
                <button
                  type="submit"
                  disabled={testLoading}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold px-6 py-2 rounded-xl shadow-lg shadow-orange-500/25 transition-all flex items-center gap-2 text-sm disabled:opacity-50"
                >
                  {testLoading ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>🚀</span>
                  )}
                  <span>ارسال پیام تست</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
