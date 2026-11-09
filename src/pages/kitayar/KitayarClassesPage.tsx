import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface ClassroomItem {
  _id: string;
  name: string;
  code: string;
  subjectName?: string;
  gradeName?: string;
  academicYear?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  teacherName: string;
  teacherPhone: string;
  teacherUsername: string;
  studentsCount: number;
  homeworksCount: number;
  examsCount: number;
  sessionsCount: number;
  totalActivities: number;
  grade?: { name: string };
  course?: { name: string };
}

interface ClassDetailData {
  classroom: ClassroomItem;
  students: any[];
  homeworks: any[];
  exams: any[];
  sessions: any[];
  stats: {
    studentsCount: number;
    verifiedStudentsCount: number;
    homeworksCount: number;
    examsCount: number;
    sessionsCount: number;
  };
}

export const KitayarClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<ClassroomItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [summary, setSummary] = useState({
    totalClasses: 0,
    activeClasses: 0,
    totalStudents: 0,
    totalActivities: 0,
  });

  // Modal details
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [classDetail, setClassDetail] = useState<ClassDetailData | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'students' | 'activities'>('info');

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/kitayar/classes', {
        params: { page, search, status: statusFilter },
      });
      if (res.data?.success) {
        setClasses(res.data.data || []);
        setTotalPages(res.data.pagination?.pages || 1);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('خطا در دریافت لیست کلاس‌ها');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchClasses();
  };

  const handleViewDetail = async (id: string) => {
    setSelectedClassId(id);
    setActiveTab('info');
    setDetailLoading(true);
    try {
      const res = await api.get(`/kitayar/classes/${id}`);
      if (res.data?.success) {
        setClassDetail(res.data.data);
      }
    } catch (err) {
      toast.error('خطا در دریافت جزئیات کلاس');
      setSelectedClassId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const formatPersianDate = (dateStr?: string) => {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-800/40 p-5 rounded-2xl border border-gray-700/40">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🏫</span>
            <span>لیست کلاس‌های کیتایار</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            مشاهده تمام کلاس‌های تشکیل شده توسط معلمان، تعداد دانش‌آموزان و فعالیت‌های ثبت‌شده
          </p>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 flex items-center gap-3.5 shadow-lg backdrop-blur-xl">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center text-2xl font-bold">
            🏫
          </div>
          <div>
            <div className="text-2xl font-black text-white">{(summary?.totalClasses ?? 0).toLocaleString('fa-IR')}</div>
            <div className="text-xs text-slate-400 font-medium">کل کلاس‌ها</div>
          </div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 flex items-center gap-3.5 shadow-lg backdrop-blur-xl">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-2xl font-bold">
            ✅
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-400">{(summary?.activeClasses ?? 0).toLocaleString('fa-IR')}</div>
            <div className="text-xs text-slate-400 font-medium">کلاس‌های فعال</div>
          </div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 flex items-center gap-3.5 shadow-lg backdrop-blur-xl">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center text-2xl font-bold">
            👥
          </div>
          <div>
            <div className="text-2xl font-black text-purple-300">{(summary?.totalStudents ?? 0).toLocaleString('fa-IR')}</div>
            <div className="text-xs text-slate-400 font-medium">دانش‌آموزان ثبت‌نامی</div>
          </div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 flex items-center gap-3.5 shadow-lg backdrop-blur-xl">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-2xl font-bold">
            📝
          </div>
          <div>
            <div className="text-2xl font-black text-amber-400">{(summary?.totalActivities ?? 0).toLocaleString('fa-IR')}</div>
            <div className="text-xs text-slate-400 font-medium">فعالیت‌ها (تکلیف و آزمون)</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-800/50 p-3 rounded-xl border border-gray-700/40">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full sm:w-auto flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="جستجو بر اساس نام کلاس، کد یا درس..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pr-9 pl-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500"
            />
            <span className="absolute right-3 top-2.5 text-gray-500 text-sm">🔍</span>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            جستجو
          </button>
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-gray-900 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500 w-full sm:w-auto"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="active">فقط کلاس‌های فعال</option>
            <option value="inactive">کلاس‌های آرشیو شده</option>
          </select>
        </div>
      </div>

      {/* Classes Table */}
      <div className="bg-gray-800/50 rounded-2xl border border-gray-700/40 overflow-hidden shadow-lg">
        {loading ? (
          <div className="py-20 text-center text-gray-400 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <span>در حال بارگذاری لیست کلاس‌ها...</span>
          </div>
        ) : classes.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <span className="text-4xl block mb-2">📭</span>
            هیچ کلاسی یافت نشد.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-900/60 text-gray-400 font-semibold border-b border-gray-700/40">
                <tr>
                  <th className="py-3.5 px-4">نام کلاس و کد</th>
                  <th className="py-3.5 px-4">معلم مربوطه</th>
                  <th className="py-3.5 px-4">پایه / درس</th>
                  <th className="py-3.5 px-4 text-center">دانش‌آموزان</th>
                  <th className="py-3.5 px-4 text-center">فعالیت‌ها</th>
                  <th className="py-3.5 px-4 text-center">تاریخ ایجاد</th>
                  <th className="py-3.5 px-4 text-center">وضعیت</th>
                  <th className="py-3.5 px-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/30 text-gray-200">
                {classes.map((cls) => (
                  <tr key={cls._id} className="hover:bg-gray-700/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{cls.name}</span>
                        {cls.code && (
                          <span className="bg-primary-500/10 text-primary-300 text-xs px-2 py-0.5 rounded font-mono border border-primary-500/20">
                            کد: {cls.code}
                          </span>
                        )}
                      </div>
                      {cls.academicYear && (
                        <div className="text-xs text-gray-400 mt-0.5">سال تحصیلی: {cls.academicYear}</div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-200">{cls.teacherName}</div>
                      <div className="text-xs text-gray-400 font-mono">{cls.teacherPhone}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div>{cls.gradeName || cls.grade?.name || 'پایه ثبت نشده'}</div>
                      <div className="text-xs text-gray-400">{cls.subjectName || cls.course?.name || '-'}</div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 bg-purple-500/10 text-purple-300 px-2.5 py-1 rounded-full text-xs font-bold border border-purple-500/20">
                        <span>👥</span>
                        <span>{cls.studentsCount} نفر</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-2 text-xs">
                        <span className="bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/20" title="تکالیف">
                          {cls.homeworksCount} تکلیف
                        </span>
                        <span className="bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded border border-blue-500/20" title="آزمون‌ها">
                          {cls.examsCount} آزمون
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center text-xs text-gray-400">
                      {formatPersianDate(cls.createdAt)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {cls.isActive ? (
                        <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-medium border border-emerald-500/20">
                          فعال
                        </span>
                      ) : (
                        <span className="bg-gray-500/10 text-gray-400 text-xs px-2.5 py-1 rounded-full font-medium border border-gray-500/20">
                          بایگانی
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleViewDetail(cls._id)}
                        className="px-3 py-1.5 bg-gray-700/60 hover:bg-primary-600 text-gray-200 hover:text-white text-xs rounded-lg transition-colors font-medium border border-gray-600/40"
                      >
                        جزئیات و فعالیت‌ها ⬅
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-700/40 flex items-center justify-between text-sm text-gray-400">
            <div>صفحه {page} از {totalPages}</div>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-600 text-white"
              >
                قبلی
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-600 text-white"
              >
                بعدی
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Class Details Modal */}
      {selectedClassId && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 bg-gray-900/60 border-b border-gray-700/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏫</span>
                <div>
                  <h3 className="font-bold text-white text-base">
                    {classDetail?.classroom.name || 'در حال دریافت اطلاعات...'}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    کد کلاس: {classDetail?.classroom.code} • معلم: {classDetail?.classroom.teacherName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedClassId(null)}
                className="w-8 h-8 rounded-lg bg-gray-700/60 hover:bg-gray-700 text-gray-300 flex items-center justify-center text-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal Nav Tabs */}
            <div className="flex border-b border-gray-700/50 bg-gray-900/30 px-4">
              <button
                onClick={() => setActiveTab('info')}
                className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'info'
                    ? 'border-primary-500 text-primary-400'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                ℹ️ مشخصات و آمار
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'students'
                    ? 'border-primary-500 text-primary-400'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                👥 لیست دانش‌آموزان ({classDetail?.students.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('activities')}
                className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'activities'
                    ? 'border-primary-500 text-primary-400'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                📝 تکالیف و آزمون‌ها ({classDetail?.homeworks.length || 0} تکلیف / {classDetail?.exams.length || 0} آزمون)
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1">
              {detailLoading ? (
                <div className="py-20 text-center text-gray-400 flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  <span>در حال دریافت مشخصات کلاس...</span>
                </div>
              ) : classDetail ? (
                <>
                  {/* TAB 1: INFO */}
                  {activeTab === 'info' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-gray-900/50 p-3.5 rounded-xl border border-gray-700/30">
                          <span className="text-xs text-gray-400 block mb-1">تعداد دانش‌آموزان</span>
                          <span className="text-xl font-bold text-white">{classDetail.stats.studentsCount} نفر</span>
                        </div>
                        <div className="bg-gray-900/50 p-3.5 rounded-xl border border-gray-700/30">
                          <span className="text-xs text-gray-400 block mb-1">دارای تیک آبی تایید</span>
                          <span className="text-xl font-bold text-emerald-400">{classDetail.stats.verifiedStudentsCount} نفر</span>
                        </div>
                        <div className="bg-gray-900/50 p-3.5 rounded-xl border border-gray-700/30">
                          <span className="text-xs text-gray-400 block mb-1">تکالیف تعریف شده</span>
                          <span className="text-xl font-bold text-amber-400">{classDetail.stats.homeworksCount} عدد</span>
                        </div>
                        <div className="bg-gray-900/50 p-3.5 rounded-xl border border-gray-700/30">
                          <span className="text-xs text-gray-400 block mb-1">آزمون‌های برگزار شده</span>
                          <span className="text-xl font-bold text-blue-400">{classDetail.stats.examsCount} آزمون</span>
                        </div>
                      </div>

                      <div className="bg-gray-900/40 p-4 rounded-xl border border-gray-700/40 space-y-3">
                        <h4 className="font-bold text-white text-sm mb-2">اطلاعات تکمیلی کلاس</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">نام معلم: </span>
                            <span className="text-white font-medium">{classDetail.classroom.teacherName}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">شماره موبایل معلم: </span>
                            <span className="text-white font-mono">{classDetail.classroom.teacherPhone}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">پایه تحصیلی: </span>
                            <span className="text-white">{classDetail.classroom.gradeName || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">درس: </span>
                            <span className="text-white">{classDetail.classroom.subjectName || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">تاریخ ایجاد: </span>
                            <span className="text-white">{formatPersianDate(classDetail.classroom.createdAt)}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">توضیحات: </span>
                            <span className="text-white">{classDetail.classroom.description || 'ندارد'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: STUDENTS */}
                  {activeTab === 'students' && (
                    <div className="space-y-3">
                      {classDetail.students.length === 0 ? (
                        <div className="py-12 text-center text-gray-400">
                          هنوز دانش‌آموزی در این کلاس ثبت نشده است.
                        </div>
                      ) : (
                        <div className="overflow-x-auto border border-gray-700/40 rounded-xl">
                          <table className="w-full text-right text-xs">
                            <thead className="bg-gray-900/80 text-gray-400">
                              <tr>
                                <th className="py-2.5 px-3">نام و نام خانوادگی</th>
                                <th className="py-2.5 px-3">نام پدر</th>
                                <th className="py-2.5 px-3">شماره دانش‌آموز</th>
                                <th className="py-2.5 px-3">شماره ولی</th>
                                <th className="py-2.5 px-3 text-center">وضعیت تایید</th>
                                <th className="py-2.5 px-3 text-center">تاریخ پیوستن</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/30 text-gray-300">
                              {classDetail.students.map((st: any) => (
                                <tr key={st._id} className="hover:bg-gray-700/20">
                                  <td className="py-2.5 px-3 font-medium text-white flex items-center gap-1.5">
                                    <span>{st.firstName} {st.lastName}</span>
                                    {st.isVerified && (
                                      <span className="text-blue-400 text-xs" title="تایید شده توسط معلم">✓</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3">{st.fatherName || '-'}</td>
                                  <td className="py-2.5 px-3 font-mono">{st.studentPhone}</td>
                                  <td className="py-2.5 px-3 font-mono">{st.parentPhone || '-'}</td>
                                  <td className="py-2.5 px-3 text-center">
                                    {st.isVerified ? (
                                      <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[11px]">تایید شده</span>
                                    ) : (
                                      <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded text-[11px]">عادی</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-center text-gray-400">
                                    {formatPersianDate(st.joinedAt || st.createdAt)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: ACTIVITIES */}
                  {activeTab === 'activities' && (
                    <div className="space-y-5">
                      {/* Homeworks */}
                      <div>
                        <h4 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
                          <span>📋</span>
                          <span>تکالیف ثبت شده ({classDetail.homeworks.length})</span>
                        </h4>
                        {classDetail.homeworks.length === 0 ? (
                          <p className="text-xs text-gray-500">تکلیفی برای این کلاس ثبت نشده است.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {classDetail.homeworks.map((hw: any) => (
                              <div key={hw._id} className="bg-gray-900/40 p-3 rounded-xl border border-gray-700/30 text-xs space-y-1">
                                <div className="font-bold text-white text-sm">{hw.title}</div>
                                <div className="text-gray-400">درس: {hw.subject || '-'}</div>
                                <div className="text-amber-400">موعد تحویل: {hw.dueDateJalali || '-'}</div>
                                <div className="text-gray-500 text-[11px] mt-1">
                                  ارسال پاسخ‌ها: {hw.studentSubmissions?.length || 0} دانش‌آموز
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Exams */}
                      <div>
                        <h4 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
                          <span>📝</span>
                          <span>آزمون‌های کلاس ({classDetail.exams.length})</span>
                        </h4>
                        {classDetail.exams.length === 0 ? (
                          <p className="text-xs text-gray-500">آزمونی برای این کلاس ثبت نشده است.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {classDetail.exams.map((ex: any) => (
                              <div key={ex._id} className="bg-gray-900/40 p-3 rounded-xl border border-gray-700/30 text-xs space-y-1">
                                <div className="font-bold text-white text-sm">{ex.title}</div>
                                <div className="text-gray-400">درس: {ex.subject || '-'}</div>
                                <div className="text-blue-400">تعداد سوالات: {ex.totalQuestions || 0} سوال</div>
                                <div className="text-gray-500 text-[11px]">
                                  تاریخ ایجاد: {formatPersianDate(ex.createdAt)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KitayarClassesPage;
