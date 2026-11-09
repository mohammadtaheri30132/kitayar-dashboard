import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  adminNotificationService,
  type SendTeacherNotificationPayload,
  type FcmSettings,
  type AdminNotificationItem,
} from '../services/adminNotificationService';

export default function NotificationsManagementPage() {
  const [activeTab, setActiveTab] = useState<'send' | 'fcm' | 'history'>('send');

  // Form State
  const [formData, setFormData] = useState<SendTeacherNotificationPayload>({
    title: '',
    body: '',
    priority: 'normal',
    category: 'all',
    position: 'all',
    school: '',
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

  // Load count whenever filters change
  useEffect(() => {
    if (activeTab === 'send') {
      const timer = setTimeout(() => {
        fetchTargetCount();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [formData.category, formData.position, formData.school, activeTab]);

  useEffect(() => {
    if (activeTab === 'fcm') {
      fetchFcmSettings();
    } else if (activeTab === 'history') {
      fetchHistory(historyPage);
    }
  }, [activeTab, historyPage]);

  const fetchTargetCount = async () => {
    setCountingLoading(true);
    try {
      const count = await adminNotificationService.getFilteredCount({
        category: formData.category,
        position: formData.position,
        school: formData.school,
      });
      setTargetCount(count);
    } catch (e) {
      console.error(e);
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

    if (!window.confirm(`آیا مطمئن هستید که می‌خواهید این اعلان را برای ${targetCount ?? 'همه‌ی'} معلمان واجد شرایط ارسال کنید؟`)) {
      return;
    }

    setSendingLoading(true);
    try {
      const res = await adminNotificationService.sendToTeachers(formData);
      toast.success(res.message || 'اعلان با موفقیت ارسال شد');
      setFormData({
        title: '',
        body: '',
        priority: 'normal',
        category: 'all',
        position: 'all',
        school: '',
      });
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-800/60 p-6 rounded-2xl border border-gray-700/50 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <span className="text-3xl">🔔</span>
            مدیریت اعلان‌ها و پیام‌رسانی
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            ارسال پیام و نوتیفیکیشن هدفمند به معلمان بر اساس فیلترهای استانی، مدرسه‌ای و سمتی به همراه تنظیمات FCM
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 bg-gray-900/60 p-1.5 rounded-xl border border-gray-700/60">
          <button
            onClick={() => setActiveTab('send')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'send'
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            ✉️ ارسال به معلمان
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

      {/* TAB 1: Send Notification to Teachers */}
      {activeTab === 'send' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form (2 cols) */}
          <div className="lg:col-span-2 bg-gray-800/40 p-6 rounded-2xl border border-gray-700/50 backdrop-blur-sm space-y-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-gray-700/50 pb-3">
              <span>✍️</span> مشخصات اعلان
            </h2>

            <form onSubmit={handleSendNotification} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  عنوان اعلان <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثلاً: بخشنامه جدید ساعت کاری مدارس / یادآوری ثبت نمرات"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-gray-900/60 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  متن اعلان <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="متن کامل پیامی که در نوتیفیکیشن و در بخش اعلان‌های اپلیکیشن کیتایار به معلمان نمایش داده می‌شود..."
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

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    رسته / دوره تحصیلی معلمان
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-gray-900/60 border border-gray-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-primary-500"
                  >
                    <option value="all">همه دوره‌ها</option>
                    <option value="آموزگار">آموزگار (ابتدایی)</option>
                    <option value="دبیر">دبیر (متوسطه)</option>
                    <option value="هنرآموز">هنرآموز (هنرستان / فنی)</option>
                  </select>
                </div>
              </div>

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

              <div className="pt-4 border-t border-gray-700/50 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={sendingLoading || (targetCount === 0)}
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
                      ارسال اعلان به معلمان منتخب
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
                <span>🎯</span> جامعه هدف مخاطبان
              </h3>
              <p className="text-xs text-gray-400">
                بر اساس فیلترهای انتخابی در فرم سمت راست، تعداد معلمان واجد شرایط دریافت اعلان به صورت زنده محاسبه می‌شود:
              </p>

              <div className="bg-gray-950/60 p-4 rounded-xl border border-gray-800 text-center space-y-1">
                <span className="text-xs text-gray-400">تعداد معلمان منطبق</span>
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
                  <span className="text-gray-400">رسته انتخابی:</span>
                  <span className="font-semibold text-white">{formData.category === 'all' ? 'همه دوره‌ها' : formData.category}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-800">
                  <span className="text-gray-400">سمت انتخابی:</span>
                  <span className="font-semibold text-white">{formData.position === 'all' ? 'همه سمت‌ها' : formData.position}</span>
                </div>
                {formData.school && (
                  <div className="flex justify-between py-1 border-b border-gray-800">
                    <span className="text-gray-400">فیلتر مدرسه:</span>
                    <span className="font-semibold text-amber-300 truncate max-w-[120px]">{formData.school}</span>
                  </div>
                )}
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300 space-y-1">
                <p className="font-semibold">💡 نحوه دریافت در کیتایار:</p>
                <p className="text-amber-200/80 leading-relaxed">
                  این پیام مستقیماً در دیتابیس برای این معلمان ذخیره می‌شود و در صورت فعال بودن سرویس FCM به گوشی آنها پوش نوتیفیکیشن نیز فرستاده خواهد شد.
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
                کلید سرور یا توکن معتبر پروژه‌ی فایربیس خود را اینجا وارد کنید تا نوتیفیکیشن‌های لحظه‌ای روی گوشی کاربران ارسال شوند.
              </p>
            </div>
            <div className="bg-gray-900/80 px-3 py-1.5 rounded-xl border border-gray-700 text-xs text-gray-300">
              دستگاه‌های فعال: <span className="text-emerald-400 font-bold">{fcmSettings.activeTokensCount || 0}</span>
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
                  {fcmSettings.enabled ? 'فعال (اعلان‌ها به FCM ارسال می‌شوند)' : 'غیرفعال (تنها در دیتابیس ثبت می‌شود)'}
                </span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                FCM Server Key (کلید سرور فایربیس)
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  placeholder="AAAA...:APA91b..."
                  value={fcmSettings.serverKey}
                  onChange={(e) => setFcmSettings({ ...fcmSettings, serverKey: e.target.value })}
                  className="w-full bg-gray-900/60 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 font-mono text-sm focus:outline-none focus:border-primary-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute left-3 top-2.5 text-gray-400 hover:text-white text-xs px-2 py-1 rounded bg-gray-800"
                >
                  {showKey ? 'مخفی کردن' : 'نمایش'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                این کلید در تب Cloud Messaging تنظیمات پروژه‌ی کنسول Firebase با عنوان Server Key در بخش Cloud Messaging API (Legacy) یا Server Token قرار دارد.
              </p>
            </div>

            <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-4 text-xs text-sky-300 space-y-2">
              <h4 className="font-bold flex items-center gap-1.5">
                <span>ℹ️</span> راهنمای دریافت کلید فایربیس:
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-sky-200/80 leading-relaxed">
                <li>وارد کنسول فایربیس (<span className="font-mono text-white">console.firebase.google.com</span>) شوید.</li>
                <li>وارد تنظیمات پروژه (Project Settings) و سپس تب <span className="font-semibold text-white">Cloud Messaging</span> شوید.</li>
                <li>کلید Server Key را کپی کرده و در فیلد بالا جایگذاری نمایید و دکمه ذخیره را بزنید.</li>
              </ol>
            </div>

            <div className="pt-4 border-t border-gray-700/50 flex justify-end">
              <button
                type="submit"
                disabled={fcmLoading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {fcmLoading ? 'در حال ذخیره...' : '💾 ذخیره تنظیمات FCM'}
              </button>
            </div>
          </form>
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
                    <th className="py-3 px-4">اولویت</th>
                    <th className="py-3 px-4">فیلترهای اعمال‌شده</th>
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
                      <td className="py-3 px-4 text-xs text-gray-400">
                        {item.filters?.category && <span className="ml-1 bg-gray-800 px-1.5 py-0.5 rounded">رسته: {item.filters.category}</span>}
                        {item.filters?.position && <span className="ml-1 bg-gray-800 px-1.5 py-0.5 rounded">سمت: {item.filters.position}</span>}
                        {item.filters?.school && <span className="ml-1 bg-gray-800 px-1.5 py-0.5 rounded">مدرسه: {item.filters.school}</span>}
                        {!item.filters?.category && !item.filters?.position && !item.filters?.school && (
                          <span className="text-gray-500">همه معلمان</span>
                        )}
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
    </div>
  );
}
