import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface TeacherItem {
  _id: string;
  fullName: string;
  phoneNumber: string;
  username?: string;
  avatar?: string;
  category?: string;
  position?: string;
  schools?: string[];
  classesCount: number;
  studentsCount: number;
  lastLogin?: string;
  createdAt: string;
  profile?: any;
}

interface TeacherDetailData {
  user: any;
  profile: any;
  classrooms: any[];
  students: any[];
  stats: {
    classesCount: number;
    totalStudents: number;
  };
}

export const KitayarTeachersPage: React.FC = () => {
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ totalTeachers: 0, activeThisMonth: 0 });

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [position, setPosition] = useState('all');
  const [school, setSchool] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Profile Modal State
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [teacherDetail, setTeacherDetail] = useState<TeacherDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailActiveTab, setDetailActiveTab] = useState<'info' | 'classes' | 'students'>('info');

  // Notify Modal State
  const [notifyTeacherTarget, setNotifyTeacherTarget] = useState<TeacherItem | null>(null);
  const [notifyForm, setNotifyForm] = useState({
    title: '',
    body: '',
    priority: 'normal',
    type: 'ADMIN_ANNOUNCEMENT',
  });
  const [sendingNotify, setSendingNotify] = useState(false);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 15 };
      if (search.trim()) params.search = search.trim();
      if (category !== 'all') params.category = category;
      if (position !== 'all') params.position = position;
      if (school.trim()) params.school = school.trim();

      const res = await api.get('/kitayar/teachers', { params });
      if (res.data?.success) {
        setTeachers(res.data.data || []);
        setTotalPages(res.data.pagination?.pages || 1);
        setTotalCount(res.data.pagination?.total || 0);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
      }
    } catch (err: any) {
      console.error('Error fetching teachers:', err);
      toast.error(err?.response?.data?.message || 'خطا در دریافت لیست معلمان');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [page, category, position]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTeachers();
  };

  const handleOpenProfile = async (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    setDetailLoading(true);
    setDetailActiveTab('info');
    try {
      const res = await api.get(`/kitayar/teachers/${teacherId}/profile`);
      if (res.data?.success) {
        setTeacherDetail(res.data.data);
      }
    } catch (err: any) {
      toast.error('خطا در دریافت اطلاعات پروفایل معلم');
      setSelectedTeacherId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenNotify = (teacher: TeacherItem) => {
    setNotifyTeacherTarget(teacher);
    setNotifyForm({
      title: '',
      body: '',
      priority: 'normal',
      type: 'ADMIN_ANNOUNCEMENT',
    });
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyTeacherTarget) return;
    if (!notifyForm.title.trim() || !notifyForm.body.trim()) {
      toast.error('لطفاً عنوان و متن پیام را وارد کنید');
      return;
    }

    try {
      setSendingNotify(true);
      const res = await api.post(`/kitayar/teachers/${notifyTeacherTarget._id}/notify`, notifyForm);
      if (res.data?.success) {
        toast.success(res.data.message || 'اعلان با موفقیت ارسال شد');
        setNotifyTeacherTarget(null);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'خطا در ارسال اعلان به معلم');
    } finally {
      setSendingNotify(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-6 space-y-6 text-gray-100 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-700/50 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">👨‍🏫</span>
            <h1 className="text-2xl font-black text-white">مدیریت معلمان کیتایار</h1>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            مشاهده پروفایل، اطلاعات مدارس، کلاس‌ها و دانش‌آموزان به همراه قابلیت ارسال پیام و نوتیفیکیشن اختصاصی
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchTeachers()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-xl transition text-sm shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            بروزرسانی لیست
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">کل معلمان ثبت‌شده</p>
              <h3 className="text-2xl font-black text-white mt-1">{(summary?.totalTeachers ?? 0).toLocaleString('fa-IR')}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center text-xl">
              🧑‍🏫
            </div>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">فعال در ماه اخیر</p>
              <h3 className="text-2xl font-black text-emerald-400 mt-1">{(summary?.activeThisMonth ?? 0).toLocaleString('fa-IR')}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-xl">
              ✨
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800/80 to-gray-800/40 border border-gray-700/60 rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">تعداد معلمان در صفحه</p>
              <h3 className="text-2xl font-bold text-indigo-400 mt-1">{teachers.length.toLocaleString('fa-IR')}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl">
              📋
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800/80 to-gray-800/40 border border-gray-700/60 rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">پوشش کلاس‌ها</p>
              <h3 className="text-2xl font-bold text-amber-400 mt-1">
                {teachers.reduce((acc, t) => acc + (t.classesCount || 0), 0).toLocaleString('fa-IR')} کلاس
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl">
              🏫
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-gray-800/70 border border-gray-700/60 rounded-2xl p-4 shadow-sm backdrop-blur-sm">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <input
              type="text"
              placeholder="جستجوی نام، تلفن یا نام کاربری معلم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-900/80 border border-gray-700 text-sm text-gray-200 rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:border-blue-500 transition"
            />
            <span className="absolute right-3.5 top-3 text-gray-400 text-sm">🔍</span>
          </div>

          <div>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full bg-gray-900/80 border border-gray-700 text-sm text-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 transition"
            >
              <option value="all">همه رسته‌ها</option>
              <option value="آموزگار">آموزگار (ابتدایی)</option>
              <option value="دبیر">دبیر (متوسطه)</option>
              <option value="هنرآموز">هنرآموز (فنی/هنرستان)</option>
            </select>
          </div>

          <div>
            <select
              value={position}
              onChange={(e) => {
                setPosition(e.target.value);
                setPage(1);
              }}
              className="w-full bg-gray-900/80 border border-gray-700 text-sm text-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 transition"
            >
              <option value="all">همه سمت‌ها</option>
              <option value="معلم">معلم</option>
              <option value="مدیر">مدیر</option>
              <option value="معاون">معاون</option>
              <option value="مشاور">مشاور</option>
            </select>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="نام مدرسه..."
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              className="w-full bg-gray-900/80 border border-gray-700 text-sm text-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 transition"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition shadow-md shrink-0"
            >
              اعمال
            </button>
          </div>
        </form>
      </div>

      {/* Teachers List Table */}
      <div className="bg-gray-800/80 border border-gray-700/60 rounded-2xl overflow-hidden shadow-lg backdrop-blur-sm">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 text-sm">در حال دریافت لیست معلمان...</p>
          </div>
        ) : teachers.length === 0 ? (
          <div className="p-16 text-center text-gray-400">
            <span className="text-5xl block mb-3">🔍</span>
            <p className="font-semibold text-lg text-gray-300">هیچ معلمی یافت نشد</p>
            <p className="text-sm mt-1">با تغییر فیلترها یا عبارت جستجو مجدداً امتحان کنید.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-900/60 text-xs font-semibold text-gray-400 border-b border-gray-700/60">
                <tr>
                  <th className="p-4">نام و مشخصات معلم</th>
                  <th className="p-4">شماره تماس</th>
                  <th className="p-4">رسته / سمت</th>
                  <th className="p-4">مدارس</th>
                  <th className="p-4 text-center">کلاس‌ها</th>
                  <th className="p-4 text-center">دانش‌آموزان</th>
                  <th className="p-4">عضویت</th>
                  <th className="p-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/40">
                {teachers.map((teacher) => (
                  <tr key={teacher._id} className="hover:bg-gray-700/30 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0">
                          {teacher.fullName?.charAt(0) || 'م'}
                        </div>
                        <div>
                          <div className="font-semibold text-white flex items-center gap-2">
                            {teacher.fullName}
                            {teacher.username && (
                              <span className="text-xs font-normal text-gray-400">(@{teacher.username})</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            کد شناسایی: <span className="font-mono text-gray-300">{teacher._id.slice(-6)}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 font-mono text-gray-300 direction-ltr text-right">
                      <div className="flex items-center gap-1.5 justify-start">
                        <span>{teacher.phoneNumber}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(teacher.phoneNumber);
                            toast.success('شماره تماس کپی شد');
                          }}
                          className="text-gray-500 hover:text-gray-300 transition text-xs p-1"
                          title="کپی شماره"
                        >
                          📋
                        </button>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 w-fit">
                          {teacher.category || 'آموزگار'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {teacher.position || 'معلم'}
                        </span>
                      </div>
                    </td>

                    <td className="p-4">
                      {teacher.schools && teacher.schools.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {teacher.schools.slice(0, 2).map((s, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-gray-700/60 rounded text-xs text-gray-300 truncate max-w-[140px]"
                              title={s}
                            >
                              🏫 {s}
                            </span>
                          ))}
                          {teacher.schools.length > 2 && (
                            <span className="px-1.5 py-0.5 bg-gray-700/40 rounded text-xs text-gray-400">
                              +{teacher.schools.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">ثبت نشده</span>
                      )}
                    </td>

                    <td className="p-4 text-center">
                      <span className="font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                        {teacher.classesCount}
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                        {teacher.studentsCount}
                      </span>
                    </td>

                    <td className="p-4 text-xs text-gray-400">
                      <div>{formatDate(teacher.createdAt)}</div>
                      {teacher.lastLogin && (
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          آخرین ورود: {formatDate(teacher.lastLogin)}
                        </div>
                      )}
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Open Profile Button */}
                        <button
                          onClick={() => handleOpenProfile(teacher._id)}
                          className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg border border-blue-500/30 text-xs font-medium transition flex items-center gap-1.5 shadow-sm"
                          title="مشاهده پروفایل و دانش‌آموزان"
                        >
                          <span>👁️</span>
                          <span>پروفایل و شاگردان</span>
                        </button>

                        {/* Send Notification Button */}
                        <button
                          onClick={() => handleOpenNotify(teacher)}
                          className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white rounded-lg border border-amber-500/30 text-xs font-medium transition flex items-center gap-1.5 shadow-sm"
                          title="ارسال پیام یا اعلان اختصاصی"
                        >
                          <span>🔔</span>
                          <span>ارسال اعلان</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-700/60 flex items-center justify-between bg-gray-900/40">
            <span className="text-xs text-gray-400">
              نمایش صفحه {page} از {totalPages} (مجموع {totalCount} معلم)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-xs rounded-lg text-gray-300 transition"
              >
                قبلی
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-xs rounded-lg text-gray-300 transition"
              >
                بعدی
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 1. TEACHER PROFILE & STUDENTS MODAL                       */}
      {/* ========================================================= */}
      {selectedTeacherId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-700 flex items-center justify-between bg-gray-900/60">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center text-2xl font-bold">
                  👨‍🏫
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {teacherDetail ? teacherDetail.user?.fullName : 'مشخصات معلم'}
                  </h3>
                  <p className="text-xs text-gray-400">
                    شماره تماس: <span className="font-mono text-gray-300">{teacherDetail?.user?.phoneNumber}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTeacherId(null)}
                className="w-8 h-8 rounded-lg bg-gray-700/60 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-gray-700/70 bg-gray-900/30 px-5 gap-2 pt-2">
              <button
                onClick={() => setDetailActiveTab('info')}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                  detailActiveTab === 'info'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                اطلاعات و مشخصات
              </button>
              <button
                onClick={() => setDetailActiveTab('classes')}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition flex items-center gap-1.5 ${
                  detailActiveTab === 'classes'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                کلاس‌ها ({teacherDetail?.classrooms?.length || 0})
              </button>
              <button
                onClick={() => setDetailActiveTab('students')}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition flex items-center gap-1.5 ${
                  detailActiveTab === 'students'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                دانش‌آموزان ثبت‌شده ({teacherDetail?.students?.length || 0})
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {detailLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-400 text-sm">در حال دریافت جزئیات...</p>
                </div>
              ) : !teacherDetail ? (
                <p className="text-gray-400 text-center py-10">اطلاعاتی یافت نشد</p>
              ) : (
                <>
                  {/* TAB 1: INFO */}
                  {detailActiveTab === 'info' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-700/60">
                          <span className="text-xs text-gray-400 block mb-1">نام و نام خانوادگی</span>
                          <span className="font-semibold text-white">{teacherDetail.user?.fullName}</span>
                        </div>
                        <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-700/60">
                          <span className="text-xs text-gray-400 block mb-1">نام کاربری</span>
                          <span className="font-mono text-gray-300">
                            {teacherDetail.user?.username ? `@${teacherDetail.user?.username}` : 'ندارد'}
                          </span>
                        </div>
                        <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-700/60">
                          <span className="text-xs text-gray-400 block mb-1">شماره تماس</span>
                          <span className="font-mono text-emerald-400">{teacherDetail.user?.phoneNumber}</span>
                        </div>
                        <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-700/60">
                          <span className="text-xs text-gray-400 block mb-1">رسته و سمت</span>
                          <span className="font-medium text-blue-300">
                            {teacherDetail.profile?.category || 'آموزگار'} / {teacherDetail.profile?.position || 'معلم'}
                          </span>
                        </div>
                        <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-700/60">
                          <span className="text-xs text-gray-400 block mb-1">تاریخ ثبت‌نام</span>
                          <span className="text-gray-300">{formatDate(teacherDetail.user?.createdAt)}</span>
                        </div>
                        <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-700/60">
                          <span className="text-xs text-gray-400 block mb-1">آخرین ورود</span>
                          <span className="text-gray-300">{formatDate(teacherDetail.user?.lastLogin)}</span>
                        </div>
                      </div>

                      {/* Schools */}
                      <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-700/60">
                        <span className="text-xs text-gray-400 block mb-2 font-semibold">مدارس محل تدریس:</span>
                        {teacherDetail.profile?.schools && teacherDetail.profile.schools.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {teacherDetail.profile.schools.map((s: string, idx: number) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-gray-800 text-gray-200 border border-gray-700 rounded-lg text-sm"
                              >
                                🏫 {s}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">مدرسه‌ای ثبت نشده است</span>
                        )}
                      </div>

                      {/* Bio */}
                      {teacherDetail.profile?.bio && (
                        <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-700/60">
                          <span className="text-xs text-gray-400 block mb-1 font-semibold">درباره معلم / بیوگرافی:</span>
                          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                            {teacherDetail.profile.bio}
                          </p>
                        </div>
                      )}

                      {/* Quick Notify Action within profile */}
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => {
                            const t = teachers.find((x) => x._id === teacherDetail.user?._id) || {
                              _id: teacherDetail.user?._id,
                              fullName: teacherDetail.user?.fullName,
                              phoneNumber: teacherDetail.user?.phoneNumber,
                              classesCount: teacherDetail.stats?.classesCount || 0,
                              studentsCount: teacherDetail.stats?.totalStudents || 0,
                              createdAt: teacherDetail.user?.createdAt,
                            };
                            handleOpenNotify(t as any);
                          }}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-semibold transition flex items-center gap-2 shadow-md"
                        >
                          <span>🔔</span>
                          <span>ارسال اعلان مستقیم به این معلم</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: CLASSES */}
                  {detailActiveTab === 'classes' && (
                    <div className="space-y-3">
                      {teacherDetail.classrooms.length === 0 ? (
                        <p className="text-gray-400 text-center py-10">این معلم هنوز کلاسی ایجاد نکرده است.</p>
                      ) : (
                        teacherDetail.classrooms.map((cls) => (
                          <div
                            key={cls._id}
                            className="bg-gray-900/60 border border-gray-700/60 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-gray-600 transition"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">🏫</span>
                              <div>
                                <h4 className="font-bold text-white text-base">{cls.name}</h4>
                                <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                  <span>کد کلاس: <strong className="font-mono text-blue-400">{cls.code}</strong></span>
                                  <span>•</span>
                                  <span>پایه: {cls.grade?.name || cls.gradeName || 'ثبت نشده'}</span>
                                  <span>•</span>
                                  <span>درس: {cls.course?.name || cls.subjectName || 'ثبت نشده'}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded-lg border border-gray-700">
                                📅 ایجاد: {formatDate(cls.createdAt)}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB 3: STUDENTS */}
                  {detailActiveTab === 'students' && (
                    <div className="space-y-3">
                      {teacherDetail.students.length === 0 ? (
                        <p className="text-gray-400 text-center py-10">
                          هیچ دانش‌آموزی در کلاس‌های این معلم ثبت نشده است.
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-right text-xs">
                            <thead className="bg-gray-900/80 text-gray-400">
                              <tr>
                                <th className="p-3">نام و نام خانوادگی</th>
                                <th className="p-3">نام پدر</th>
                                <th className="p-3">تلفن دانش‌آموز</th>
                                <th className="p-3">تلفن والدین</th>
                                <th className="p-3">کلاس</th>
                                <th className="p-3 text-center">وضعیت تایید</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/40">
                              {teacherDetail.students.map((st) => (
                                <tr key={st._id} className="hover:bg-gray-700/30">
                                  <td className="p-3 font-semibold text-white">
                                    {st.firstName} {st.lastName}
                                  </td>
                                  <td className="p-3 text-gray-300">{st.fatherName || '-'}</td>
                                  <td className="p-3 font-mono text-gray-300">{st.studentPhone}</td>
                                  <td className="p-3 font-mono text-gray-400">{st.parentPhone || '-'}</td>
                                  <td className="p-3 text-blue-400 font-medium">
                                    {st.classId?.name || 'کلاس'} ({st.classId?.code})
                                  </td>
                                  <td className="p-3 text-center">
                                    {st.isVerified ? (
                                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[11px]">
                                        ✓ تایید شده
                                      </span>
                                    ) : (
                                      <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full text-[11px]">
                                        در انتظار
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-700 bg-gray-900/60 flex justify-end">
              <button
                onClick={() => setSelectedTeacherId(null)}
                className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-sm transition"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. SEND DIRECT NOTIFICATION / MESSAGE MODAL               */}
      {/* ========================================================= */}
      {notifyTeacherTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-700 flex items-center justify-between bg-gray-900/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl">
                  🔔
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">ارسال پیام و اعلان به معلم</h3>
                  <p className="text-xs text-gray-400">
                    گیرنده: <strong className="text-gray-200">{notifyTeacherTarget.fullName}</strong> ({notifyTeacherTarget.phoneNumber})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNotifyTeacherTarget(null)}
                className="w-8 h-8 rounded-lg bg-gray-700/60 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendNotification} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">عنوان اعلان / پیام *</label>
                <input
                  type="text"
                  placeholder="مثال: یادآوری ثبت نمرات آزمون نوبت اول"
                  value={notifyForm.title}
                  onChange={(e) => setNotifyForm({ ...notifyForm, title: e.target.value })}
                  className="w-full bg-gray-900/80 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-amber-500 transition"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">نوع اعلان</label>
                  <select
                    value={notifyForm.type}
                    onChange={(e) => setNotifyForm({ ...notifyForm, type: e.target.value })}
                    className="w-full bg-gray-900/80 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-amber-500 transition"
                  >
                    <option value="ADMIN_ANNOUNCEMENT">اطلاعیه مدیریت</option>
                    <option value="SYSTEM">پیام سیستمی</option>
                    <option value="REMINDER">یادآوری</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">اولویت</label>
                  <select
                    value={notifyForm.priority}
                    onChange={(e) => setNotifyForm({ ...notifyForm, priority: e.target.value })}
                    className="w-full bg-gray-900/80 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-amber-500 transition"
                  >
                    <option value="normal">عادی</option>
                    <option value="high">بالا</option>
                    <option value="urgent">فوری / اضطراری</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">متن کامل پیام *</label>
                <textarea
                  rows={4}
                  placeholder="متن پیام خود را برای معلم بنویسید..."
                  value={notifyForm.body}
                  onChange={(e) => setNotifyForm({ ...notifyForm, body: e.target.value })}
                  className="w-full bg-gray-900/80 border border-gray-700 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-amber-500 transition resize-none"
                  required
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  * این اعلان به صورت نوتیفیکیشن گوشی (FCM) و همچنین در پنل اعلانات اپلیکیشن معلم ارسال خواهد شد.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-700/60">
                <button
                  type="button"
                  onClick={() => setNotifyTeacherTarget(null)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl text-sm transition"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={sendingNotify}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition flex items-center gap-2 shadow-md"
                >
                  {sendingNotify ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>در حال ارسال...</span>
                    </>
                  ) : (
                    <>
                      <span>ارسال اعلان</span>
                      <span>🚀</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default KitayarTeachersPage;
