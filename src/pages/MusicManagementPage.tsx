import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { musicAdminService, type MusicCategory, type MusicTrack } from '../services/musicService';

export default function MusicManagementPage() {
  const [activeTab, setActiveTab] = useState<'tracks' | 'categories'>('tracks');
  const [categories, setCategories] = useState<MusicCategory[]>([]);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Search
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Audio preview in admin panel
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Modals state
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<MusicCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    title: '',
    description: '',
    icon: 'music',
    coverUrl: '',
    order: 0,
    isActive: true,
  });

  const [showTrackModal, setShowTrackModal] = useState<boolean>(false);
  const [editingTrack, setEditingTrack] = useState<MusicTrack | null>(null);
  const [trackForm, setTrackForm] = useState({
    title: '',
    artist: '',
    audioUrl: '',
    coverUrl: '',
    lyrics: '',
    categoryId: '',
    duration: 0,
    order: 0,
    isActive: true,
  });

  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const cats = await musicAdminService.getCategories();
      setCategories(cats);
      const tracksRes = await musicAdminService.getTracks();
      setTracks(tracksRes.data);
    } catch (err: any) {
      toast.error('خطا در دریافت اطلاعات موسیقی: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPreview = (track: MusicTrack) => {
    if (playingTrackId === track._id) {
      audioRef.current?.pause();
      setPlayingTrackId(null);
    } else {
      if (audioRef.current) {
        // Construct full URL if relative
        const url = track.audioUrl.startsWith('http')
          ? track.audioUrl
          : `http://localhost:5001${track.audioUrl}`;
        audioRef.current.src = url;
        audioRef.current.play().catch((e) => toast.error('خطا در پخش فایل: ' + e.message));
        setPlayingTrackId(track._id);
      }
    }
  };

  // Category Handlers
  const openNewCategoryModal = () => {
    setEditingCategory(null);
    setCategoryForm({
      title: '',
      description: '',
      icon: 'music',
      coverUrl: '',
      order: categories.length + 1,
      isActive: true,
    });
    setShowCategoryModal(true);
  };

  const openEditCategoryModal = (cat: MusicCategory) => {
    setEditingCategory(cat);
    setCategoryForm({
      title: cat.title,
      description: cat.description || '',
      icon: cat.icon || 'music',
      coverUrl: cat.coverUrl || '',
      order: cat.order,
      isActive: cat.isActive,
    });
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.title.trim()) {
      toast.error('عنوان دسته‌بندی الزامی است');
      return;
    }

    try {
      if (editingCategory) {
        await musicAdminService.updateCategory(editingCategory._id, categoryForm);
        toast.success('دسته‌بندی با موفقیت به‌روزرسانی شد');
      } else {
        await musicAdminService.createCategory(categoryForm);
        toast.success('دسته‌بندی جدید ایجاد شد');
      }
      setShowCategoryModal(false);
      loadData();
    } catch (err: any) {
      toast.error('خطا در ثبت دسته‌بندی: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteCategory = async (id: string, title: string) => {
    if (!window.confirm(`آیا از حذف دسته‌بندی "${title}" و تمامی موزیک‌های زیرمجموعه آن اطمینان دارید؟`)) return;
    try {
      await musicAdminService.deleteCategory(id);
      toast.success('دسته‌بندی حذف شد');
      loadData();
    } catch (err: any) {
      toast.error('خطا در حذف: ' + (err.response?.data?.message || err.message));
    }
  };

  // Track Handlers
  const openNewTrackModal = () => {
    setEditingTrack(null);
    setTrackForm({
      title: '',
      artist: '',
      audioUrl: '',
      coverUrl: '',
      lyrics: '',
      categoryId: categories[0]?._id || '',
      duration: 0,
      order: 0,
      isActive: true,
    });
    setShowTrackModal(true);
  };

  const openEditTrackModal = (track: MusicTrack) => {
    setEditingTrack(track);
    const catId = typeof track.categoryId === 'object' ? track.categoryId._id : track.categoryId;
    setTrackForm({
      title: track.title,
      artist: track.artist,
      audioUrl: track.audioUrl,
      coverUrl: track.coverUrl || '',
      lyrics: track.lyrics || '',
      categoryId: catId,
      duration: track.duration || 0,
      order: track.order,
      isActive: track.isActive,
    });
    setShowTrackModal(true);
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAudio(true);
    const loadToast = toast.loading('در حال بارگذاری فایل صوتی...');
    try {
      const res = await musicAdminService.uploadAudio(file);
      setTrackForm((prev) => ({ ...prev, audioUrl: res.url }));
      toast.success('فایل صوتی با موفقیت بارگذاری شد', { id: loadToast });
    } catch (err: any) {
      toast.error('خطا در بارگذاری صوتی: ' + (err.response?.data?.message || err.message), { id: loadToast });
    } finally {
      setUploadingAudio(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    const loadToast = toast.loading('در حال بارگذاری کاور...');
    try {
      const res = await musicAdminService.uploadCover(file);
      setTrackForm((prev) => ({ ...prev, coverUrl: res.url }));
      toast.success('کاور با موفقیت آپلود شد', { id: loadToast });
    } catch (err: any) {
      toast.error('خطا در بارگذاری تصویر: ' + (err.response?.data?.message || err.message), { id: loadToast });
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSaveTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackForm.title.trim() || !trackForm.artist.trim() || !trackForm.audioUrl || !trackForm.categoryId) {
      toast.error('لطفاً عنوان، نام خواننده، دسته‌بندی و فایل صوتی را وارد نمایید');
      return;
    }

    try {
      if (editingTrack) {
        await musicAdminService.updateTrack(editingTrack._id, trackForm);
        toast.success('موزیک با موفقیت ویرایش شد');
      } else {
        await musicAdminService.createTrack(trackForm);
        toast.success('موزیک جدید افزوده شد');
      }
      setShowTrackModal(false);
      loadData();
    } catch (err: any) {
      toast.error('خطا در ذخیره موزیک: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteTrack = async (id: string, title: string) => {
    if (!window.confirm(`آیا از حذف موزیک "${title}" اطمینان دارید؟`)) return;
    try {
      await musicAdminService.deleteTrack(id);
      toast.success('موزیک حذف شد');
      loadData();
    } catch (err: any) {
      toast.error('خطا در حذف: ' + (err.response?.data?.message || err.message));
    }
  };

  // Filtered tracks
  const filteredTracks = tracks.filter((t) => {
    const catId = typeof t.categoryId === 'object' ? t.categoryId._id : t.categoryId;
    const matchesCat = selectedCategoryFilter === 'all' || catId === selectedCategoryFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.artist.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      {/* Hidden Audio Player for Preview */}
      <audio
        ref={audioRef}
        onEnded={() => setPlayingTrackId(null)}
        onError={() => setPlayingTrackId(null)}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gray-800/60 p-6 rounded-2xl border border-gray-700/50 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-3xl shadow-lg shadow-indigo-500/25">
            🎵
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">مدیریت موسیقی و صوت کیتایار</h1>
            <p className="text-sm text-gray-400 mt-1">مدیریت دسته‌بندی‌ها، بارگذاری آهنگ‌ها، کاورها و متن ترانه‌ها</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3">
          <div className="bg-gray-900/80 px-4 py-2.5 rounded-xl border border-gray-700/40 text-center">
            <span className="text-xs text-gray-400 block">دسته‌بندی‌ها</span>
            <span className="text-lg font-bold text-indigo-400">{categories.length}</span>
          </div>
          <div className="bg-gray-900/80 px-4 py-2.5 rounded-xl border border-gray-700/40 text-center">
            <span className="text-xs text-gray-400 block">کل قطعات صوتی</span>
            <span className="text-lg font-bold text-emerald-400">{tracks.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-700/50 pb-2">
        <button
          onClick={() => setActiveTab('tracks')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'tracks'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/40'
          }`}
        >
          <span>🎧</span>
          <span>لیست قطعات صوتی ({tracks.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'categories'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/40'
          }`}
        >
          <span>📁</span>
          <span>دسته‌بندی‌ها ({categories.length})</span>
        </button>
      </div>

      {/* TRACKS TAB */}
      {activeTab === 'tracks' && (
        <div className="space-y-4">
          {/* Action & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-800/40 p-4 rounded-xl border border-gray-700/40">
            <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
              {/* Search input */}
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  placeholder="جستجوی نام آهنگ یا خواننده..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-900/90 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute left-3 top-2.5 text-gray-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="bg-gray-900/90 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">همه دسته‌بندی‌ها</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={openNewTrackModal}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all"
            >
              <span>+</span>
              <span>افزودن موزیک جدید</span>
            </button>
          </div>

          {/* Tracks Table / Cards */}
          {loading ? (
            <div className="text-center py-16 text-gray-400">در حال بارگذاری اطلاعات...</div>
          ) : filteredTracks.length === 0 ? (
            <div className="text-center py-16 bg-gray-800/20 rounded-2xl border border-dashed border-gray-700">
              <span className="text-4xl block mb-3">🎵</span>
              <p className="text-gray-400 text-sm">هیچ موزیکی یافت نشد.</p>
              <button
                onClick={openNewTrackModal}
                className="mt-4 text-xs font-bold text-indigo-400 hover:text-indigo-300"
              >
                + افزودن اولین موزیک
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-700/50 bg-gray-800/30">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-gray-700/60 bg-gray-900/60 text-gray-400 font-bold">
                    <th className="py-3.5 px-4">پخش / کاور</th>
                    <th className="py-3.5 px-4">عنوان موزیک</th>
                    <th className="py-3.5 px-4">خواننده</th>
                    <th className="py-3.5 px-4">دسته‌بندی</th>
                    <th className="py-3.5 px-4">متن ترانه</th>
                    <th className="py-3.5 px-4">تعداد پخش</th>
                    <th className="py-3.5 px-4">وضعیت</th>
                    <th className="py-3.5 px-4 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/40">
                  {filteredTracks.map((track) => {
                    const isPlaying = playingTrackId === track._id;
                    const catTitle =
                      typeof track.categoryId === 'object' ? track.categoryId.title : 'نامشخص';
                    const coverSrc = track.coverUrl
                      ? track.coverUrl.startsWith('http')
                        ? track.coverUrl
                        : `http://localhost:5001${track.coverUrl}`
                      : null;

                    return (
                      <tr key={track._id} className="hover:bg-gray-700/20 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handlePlayPreview(track)}
                              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                isPlaying
                                  ? 'bg-rose-600 text-white animate-pulse'
                                  : 'bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white'
                              }`}
                              title={isPlaying ? 'توقف' : 'پخش پیش‌نمایش'}
                            >
                              {isPlaying ? '⏸' : '▶'}
                            </button>
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-700 flex items-center justify-center border border-gray-600">
                              {coverSrc ? (
                                <img src={coverSrc} alt={track.title} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs">🎵</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-bold text-white">{track.title}</td>
                        <td className="py-3 px-4 text-gray-300">{track.artist}</td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 rounded-lg bg-gray-700/60 text-xs text-indigo-300 font-medium">
                            {catTitle}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {track.lyrics ? (
                            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                              ✓ دارد
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">ندارد</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-400">{track.playsCount || 0}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              track.isActive
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {track.isActive ? 'فعال' : 'غیرفعال'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEditTrackModal(track)}
                              className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-medium transition-colors"
                            >
                              ویرایش
                            </button>
                            <button
                              onClick={() => handleDeleteTrack(track._id, track.title)}
                              className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-medium transition-colors"
                            >
                              حذف
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CATEGORIES TAB */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-gray-800/40 p-4 rounded-xl border border-gray-700/40">
            <h2 className="text-lg font-bold text-white">دسته‌بندی‌های موسیقی</h2>
            <button
              onClick={openNewCategoryModal}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all"
            >
              <span>+</span>
              <span>افزودن دسته‌بندی جدید</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div
                key={cat._id}
                className="bg-gray-800/40 p-5 rounded-2xl border border-gray-700/50 hover:border-indigo-500/50 transition-all space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-2xl font-bold">
                      {cat.icon || '📁'}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">{cat.title}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{cat.trackCount || 0} قطعه موسیقی</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      cat.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {cat.isActive ? 'فعال' : 'غیرفعال'}
                  </span>
                </div>

                {cat.description && <p className="text-xs text-gray-400 line-clamp-2">{cat.description}</p>}

                <div className="flex items-center justify-between pt-3 border-t border-gray-700/40 text-xs text-gray-400">
                  <span>ترتیب نمایش: {cat.order}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditCategoryModal(cat)}
                      className="text-indigo-400 hover:text-indigo-300 font-bold"
                    >
                      ویرایش
                    </button>
                    <span>•</span>
                    <button
                      onClick={() => handleDeleteCategory(cat._id, cat.title)}
                      className="text-rose-400 hover:text-rose-300 font-bold"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CATEGORY MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-700">
              <h3 className="font-bold text-white text-base">
                {editingCategory ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی جدید'}
              </h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">عنوان دسته‌بندی *</label>
                <input
                  type="text"
                  required
                  value={categoryForm.title}
                  onChange={(e) => setCategoryForm({ ...categoryForm, title: e.target.value })}
                  placeholder="مثال: موسیقی آرامش‌بخش، سرودهای ملی، ورزشی..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">توضیحات کوتاه</label>
                <input
                  type="text"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="توضیح کوتاه درباره این دسته‌بندی"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">آیکون یا ایموجی</label>
                  <input
                    type="text"
                    value={categoryForm.icon}
                    onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                    placeholder="مثال: 🎼 یا 🎸"
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">ترتیب نمایش</label>
                  <input
                    type="number"
                    value={categoryForm.order}
                    onChange={(e) => setCategoryForm({ ...categoryForm, order: Number(e.target.value) })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="catActive"
                  checked={categoryForm.isActive}
                  onChange={(e) => setCategoryForm({ ...categoryForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-gray-900 border-gray-700"
                />
                <label htmlFor="catActive" className="text-xs text-gray-300 font-medium">
                  دسته‌بندی فعال باشد و در اپلیکیشن نمایش داده شود
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-700 text-gray-300 text-sm font-medium hover:bg-gray-600"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30"
                >
                  ذخیره دسته‌بندی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRACK MODAL */}
      {showTrackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-2xl space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-gray-700">
              <h3 className="font-bold text-white text-base">
                {editingTrack ? 'ویرایش اطلاعات موزیک' : 'بارگذاری موزیک جدید'}
              </h3>
              <button onClick={() => setShowTrackModal(false)} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTrack} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">عنوان آهنگ *</label>
                  <input
                    type="text"
                    required
                    value={trackForm.title}
                    onChange={(e) => setTrackForm({ ...trackForm, title: e.target.value })}
                    placeholder="مثال: سرود ای ایران"
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">نام خواننده یا آهنگساز *</label>
                  <input
                    type="text"
                    required
                    value={trackForm.artist}
                    onChange={(e) => setTrackForm({ ...trackForm, artist: e.target.value })}
                    placeholder="مثال: بنان / استاد شجریان"
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">دسته‌بندی مربوطه *</label>
                <select
                  required
                  value={trackForm.categoryId}
                  onChange={(e) => setTrackForm({ ...trackForm, categoryId: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="" disabled>
                    انتخاب دسته‌بندی...
                  </option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Upload Audio File */}
              <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-700/60 space-y-2">
                <label className="block text-xs font-bold text-gray-300">فایل صوتی (MP3/WAV/OGG) *</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="audio/*"
                    disabled={uploadingAudio}
                    onChange={handleAudioUpload}
                    className="block w-full text-xs text-gray-400 file:ml-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                  />
                </div>
                {trackForm.audioUrl ? (
                  <p className="text-xs text-emerald-400 truncate mt-1">✓ آدرس فایل: {trackForm.audioUrl}</p>
                ) : (
                  <p className="text-xs text-gray-500">یا آدرس مستقیم فایل را دستی وارد کنید:</p>
                )}
                <input
                  type="text"
                  value={trackForm.audioUrl}
                  onChange={(e) => setTrackForm({ ...trackForm, audioUrl: e.target.value })}
                  placeholder="https://... یا /uploads/music/audio/..."
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Upload Cover Art */}
              <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-700/60 space-y-2">
                <label className="block text-xs font-bold text-gray-300">تصویر کاور آرت (اختیاری)</label>
                <div className="flex items-center gap-4">
                  {trackForm.coverUrl && (
                    <img
                      src={
                        trackForm.coverUrl.startsWith('http')
                          ? trackForm.coverUrl
                          : `http://localhost:5001${trackForm.coverUrl}`
                      }
                      alt="Cover"
                      className="w-14 h-14 rounded-xl object-cover border border-gray-600 shrink-0"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingCover}
                    onChange={handleCoverUpload}
                    className="block w-full text-xs text-gray-400 file:ml-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-gray-700 file:text-white hover:file:bg-gray-600 cursor-pointer"
                  />
                </div>
                <input
                  type="text"
                  value={trackForm.coverUrl}
                  onChange={(e) => setTrackForm({ ...trackForm, coverUrl: e.target.value })}
                  placeholder="آدرس کاور به صورت URL مستقیم"
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Lyrics */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  متن ترانه / شعر (Lyrics)
                </label>
                <textarea
                  rows={4}
                  value={trackForm.lyrics}
                  onChange={(e) => setTrackForm({ ...trackForm, lyrics: e.target.value })}
                  placeholder="متن کامل ترانه یا شعر را اینجا وارد کنید..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="trackActive"
                  checked={trackForm.isActive}
                  onChange={(e) => setTrackForm({ ...trackForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-gray-900 border-gray-700"
                />
                <label htmlFor="trackActive" className="text-xs text-gray-300 font-medium">
                  آهنگ فعال و قابل پخش باشد
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowTrackModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-700 text-gray-300 text-sm font-medium hover:bg-gray-600"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={uploadingAudio || uploadingCover}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                >
                  ذخیره قطعه موسیقی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
