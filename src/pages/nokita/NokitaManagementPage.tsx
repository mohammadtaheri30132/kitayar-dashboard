import React, { useState, useEffect } from 'react';
import {
  fetchNokitaSettings,
  saveNokitaSettings,
  type NokitaSiteSettingsData,
} from '../../services/nokitaAdminService';
import {
  Sparkles,
  Smartphone,
  Download,
  HelpCircle,
  FileText,
  Globe,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
} from './NokitaIcons';
import { toast } from 'react-hot-toast';

export default function NokitaManagementPage() {
  const [activeTab, setActiveTab] = useState<'hero' | 'download' | 'faq' | 'pages' | 'seo'>('hero');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NokitaSiteSettingsData | null>(null);

  // FAQ Modal / Form State
  const [newFaqQuestion, setNewFaqQuestion] = useState('');
  const [newFaqAnswer, setNewFaqAnswer] = useState('');
  const [newFaqCategory, setNewFaqCategory] = useState('عمومی');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchNokitaSettings();
      if (res.data) {
        setSettings(res.data);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'خطا در بارگذاری تنظیمات سایت نوکیتا');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      const res = await saveNokitaSettings(settings);
      setSettings(res.data);
      toast.success(res.message || 'تنظیمات سایت نوکیتا با موفقیت ذخیره شد.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'خطا در ذخیره تنظیمات');
    } finally {
      setSaving(false);
    }
  };

  const handleAddFaq = () => {
    if (!newFaqQuestion.trim() || !newFaqAnswer.trim()) {
      toast.error('لطفاً پرسش و پاسخ را وارد کنید');
      return;
    }
    if (!settings) return;

    const newFaq = {
      id: `faq-${Date.now()}`,
      question: newFaqQuestion.trim(),
      answer: newFaqAnswer.trim(),
      category: newFaqCategory.trim() || 'عمومی',
      order: (settings.faqList?.length || 0) + 1,
      isPublished: true,
    };

    setSettings({
      ...settings,
      faqList: [...(settings.faqList || []), newFaq],
    });

    setNewFaqQuestion('');
    setNewFaqAnswer('');
    toast.success('سؤال جدید اضافه شد (دکمه ذخیره تغییرات را بزنید)');
  };

  const handleDeleteFaq = (id: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      faqList: settings.faqList.filter((f) => f.id !== id),
    });
    toast.success('سؤال حذف شد');
  };

  if (loading || !settings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <RefreshCw size={32} className="animate-spin text-purple-600" />
        <span className="text-sm font-bold text-slate-500">در حال دریافت تنظیمات وبسایت نوکیتا...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="bg-gradient-to-l from-purple-950 via-indigo-900 to-purple-900 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl border border-purple-800">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-black border border-purple-500/30">
              <Sparkles size={14} className="text-amber-300" />
              <span>مدیریت وبسایت مستقل دانش‌آموزی نوکیتا</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black">تنظیمات محتوا، لندینگ، دانلود اپ و سئوی نوکیتا</h1>
            <p className="text-xs sm:text-sm text-purple-200">
              کنترل یکپارچه متون، لینک‌های دانلود کافه‌بازار و مایکت، پرسش‌های متداول و متا تگ‌های nokita.kitayar.ir
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href="https://nokita.kitayar.ir"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-black flex items-center gap-1.5 transition"
            >
              <ExternalLink size={14} />
              <span>مشاهده سایت نوکیتا</span>
            </a>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white text-xs font-black flex items-center gap-2 shadow-lg hover:shadow-purple-500/30 transition disabled:opacity-50"
            >
              <Save size={16} />
              <span>{saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'hero', label: 'صفحه اصلی (Hero & Features)', icon: Sparkles },
          { id: 'download', label: 'دانلود اپلیکیشن و مارکت‌ها', icon: Download },
          { id: 'faq', label: 'پرسش‌های متداول (FAQ)', icon: HelpCircle },
          { id: 'pages', label: 'صفحات ثابت (درباره، تماس، قوانین)', icon: FileText },
          { id: 'seo', label: 'سئو و متادیتا', icon: Globe },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition ${
                isActive
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ================= TAB 1: HERO & FEATURES ================= */}
      {activeTab === 'hero' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
            <h2 className="font-black text-sm text-slate-800 flex items-center gap-2">
              <Sparkles size={18} className="text-purple-600" />
              <span>بخش سربرگ صفحه اصلی (Hero Section)</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">متن نشان بالای عنوان (Badge):</label>
                <input
                  type="text"
                  value={settings.homeHero?.badgeText || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      homeHero: { ...settings.homeHero, badgeText: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">عنوان اصلی صفحه (H1):</label>
                <input
                  type="text"
                  value={settings.homeHero?.title || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      homeHero: { ...settings.homeHero, title: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:outline-hidden"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">توضیحات معرفی زیر عنوان:</label>
                <textarea
                  rows={3}
                  value={settings.homeHero?.subtitle || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      homeHero: { ...settings.homeHero, subtitle: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">متن دکمه اول (CTA اصلی):</label>
                <input
                  type="text"
                  value={settings.homeHero?.ctaPrimaryText || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      homeHero: { ...settings.homeHero, ctaPrimaryText: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">لینک دکمه اول:</label>
                <input
                  type="text"
                  value={settings.homeHero?.ctaPrimaryLink || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      homeHero: { ...settings.homeHero, ctaPrimaryLink: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:outline-hidden dir-ltr text-left"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">متن دکمه دوم (دانلود اپ):</label>
                <input
                  type="text"
                  value={settings.homeHero?.ctaSecondaryText || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      homeHero: { ...settings.homeHero, ctaSecondaryText: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">لینک دکمه دوم:</label>
                <input
                  type="text"
                  value={settings.homeHero?.ctaSecondaryLink || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      homeHero: { ...settings.homeHero, ctaSecondaryLink: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:outline-hidden dir-ltr text-left"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: APP DOWNLOAD ================= */}
      {activeTab === 'download' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
          <h2 className="font-black text-sm text-slate-800 flex items-center gap-2">
            <Download size={18} className="text-purple-600" />
            <span>مدیریت لینک‌های دانلود اپلیکیشن نوکیتا</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">عنوان بخش دانلود:</label>
              <input
                type="text"
                value={settings.appDownload?.title || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    appDownload: { ...settings.appDownload, title: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">نسخه فعلی اپلیکیشن:</label>
              <input
                type="text"
                value={settings.appDownload?.version || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    appDownload: { ...settings.appDownload, version: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:outline-hidden"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">توضیحات بنر دانلود:</label>
              <textarea
                rows={2}
                value={settings.appDownload?.description || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    appDownload: { ...settings.appDownload, description: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">لینک مستقیم فایل APK:</label>
              <input
                type="text"
                value={settings.appDownload?.directApkUrl || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    appDownload: { ...settings.appDownload, directApkUrl: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:outline-hidden dir-ltr text-left"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">لینک کافه‌بازار (Cafe Bazaar):</label>
              <input
                type="text"
                value={settings.appDownload?.bazaarUrl || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    appDownload: { ...settings.appDownload, bazaarUrl: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:outline-hidden dir-ltr text-left"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">لینک مایکت (Myket):</label>
              <input
                type="text"
                value={settings.appDownload?.myketUrl || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    appDownload: { ...settings.appDownload, myketUrl: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:outline-hidden dir-ltr text-left"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">آدرس وب‌اپلیکیشن یا نسخه PWA (iOS):</label>
              <input
                type="text"
                value={settings.appDownload?.iosPwaUrl || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    appDownload: { ...settings.appDownload, iosPwaUrl: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:outline-hidden dir-ltr text-left"
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: FAQ ================= */}
      {activeTab === 'faq' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
            <h2 className="font-black text-sm text-slate-800 flex items-center gap-2">
              <Plus size={18} className="text-purple-600" />
              <span>افزودن سؤال متداول جدید</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">متن سؤال:</label>
                <input
                  type="text"
                  value={newFaqQuestion}
                  onChange={(e) => setNewFaqQuestion(e.target.value)}
                  placeholder="مثال: چگونه کارنامه آزمون آنلاین را مشاهده کنم؟"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">دسته‌بندی:</label>
                <select
                  value={newFaqCategory}
                  onChange={(e) => setNewFaqCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:outline-hidden"
                >
                  <option value="عمومی">عمومی</option>
                  <option value="حساب کاربری">حساب کاربری</option>
                  <option value="کلاس‌ها">کلاس‌ها</option>
                  <option value="آزمون‌ها">آزمون‌ها</option>
                  <option value="تکالیف">تکالیف</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block font-bold text-slate-700 mb-1">متن پاسخ:</label>
                <textarea
                  rows={3}
                  value={newFaqAnswer}
                  onChange={(e) => setNewFaqAnswer(e.target.value)}
                  placeholder="پاسخ کامل و راهنمای گام به گام..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddFaq}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black flex items-center gap-1.5 transition"
            >
              <Plus size={16} />
              <span>افزودن به لیست سؤالات</span>
            </button>
          </div>

          {/* FAQ List */}
          <div className="space-y-3">
            <h3 className="font-black text-sm text-slate-800">سؤالات متداول ثبت شده ({settings.faqList?.length || 0}):</h3>
            {settings.faqList?.map((faq, idx) => (
              <div
                key={faq.id || idx}
                className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start justify-between gap-4 shadow-xs"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-black">
                      {faq.category || 'عمومی'}
                    </span>
                    <h4 className="font-black text-xs text-slate-900">{faq.question}</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{faq.answer}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteFaq(faq.id)}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition"
                  title="حذف سؤال"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 4: STATIC PAGES ================= */}
      {activeTab === 'pages' && (
        <div className="space-y-6">
          {/* About */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
            <h3 className="font-black text-sm text-slate-800">صفحه درباره ما (/about)</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">عنوان صفحه:</label>
                <input
                  type="text"
                  value={settings.pages?.about?.title || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      pages: {
                        ...settings.pages,
                        about: { ...settings.pages.about, title: e.target.value },
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">متن معرفی درباره نوکیتا:</label>
                <textarea
                  rows={4}
                  value={settings.pages?.about?.content || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      pages: {
                        ...settings.pages,
                        about: { ...settings.pages.about, content: e.target.value },
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
            <h3 className="font-black text-sm text-slate-800">اطلاعات تماس با پشتیبانی (/contact)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">شماره تماس پشتیبانی:</label>
                <input
                  type="text"
                  value={settings.pages?.contact?.phone || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      pages: {
                        ...settings.pages,
                        contact: { ...settings.pages.contact, phone: e.target.value },
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">ایمیل پشتیبانی:</label>
                <input
                  type="text"
                  value={settings.pages?.contact?.email || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      pages: {
                        ...settings.pages,
                        contact: { ...settings.pages.contact, email: e.target.value },
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:outline-hidden dir-ltr text-left"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">ساعات پاسخگویی:</label>
                <input
                  type="text"
                  value={settings.pages?.contact?.supportHours || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      pages: {
                        ...settings.pages,
                        contact: { ...settings.pages.contact, supportHours: e.target.value },
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">آیدی تلگرام پشتیبانی:</label>
                <input
                  type="text"
                  value={settings.pages?.contact?.telegram || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      pages: {
                        ...settings.pages,
                        contact: { ...settings.pages.contact, telegram: e.target.value },
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:outline-hidden dir-ltr text-left"
                />
              </div>
            </div>
          </div>

          {/* Terms & Privacy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3 shadow-sm text-xs">
              <h3 className="font-black text-sm text-slate-800">قوانین و مقررات (/terms)</h3>
              <textarea
                rows={5}
                value={settings.pages?.terms?.content || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    pages: {
                      ...settings.pages,
                      terms: { ...settings.pages.terms, content: e.target.value },
                    },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:outline-hidden"
              />
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3 shadow-sm text-xs">
              <h3 className="font-black text-sm text-slate-800">حریم خصوصی (/privacy)</h3>
              <textarea
                rows={5}
                value={settings.pages?.privacy?.content || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    pages: {
                      ...settings.pages,
                      privacy: { ...settings.pages.privacy, content: e.target.value },
                    },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 5: SEO ================= */}
      {activeTab === 'seo' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
          <h2 className="font-black text-sm text-slate-800 flex items-center gap-2">
            <Globe size={18} className="text-purple-600" />
            <span>تنظیمات عمومی سئوی وبسایت نوکیتا</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">عنوان پیش‌فرض سایت (Meta Title):</label>
              <input
                type="text"
                value={settings.seo?.siteTitle || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    seo: { ...settings.seo, siteTitle: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">الگوی عنوان صفحات (Template):</label>
              <input
                type="text"
                value={settings.seo?.titleTemplate || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    seo: { ...settings.seo, titleTemplate: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:outline-hidden dir-ltr text-right"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">توضیحات پیش‌فرض متا (Meta Description):</label>
              <textarea
                rows={3}
                value={settings.seo?.metaDescription || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    seo: { ...settings.seo, metaDescription: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:outline-hidden"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">کلمات کلیدی اصلی (با ویرگول جدا کنید):</label>
              <input
                type="text"
                value={(settings.seo?.keywords || []).join('، ')}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    seo: {
                      ...settings.seo,
                      keywords: e.target.value.split(/[،,]/).map((k) => k.trim()).filter(Boolean),
                    },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
