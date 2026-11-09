import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface StudentItem {
  _id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  fatherName: string;
  studentPhone: string;
  parentPhone?: string;
  className?: string;
  classCode?: string;
  classroom?: {
    _id: string;
    name: string;
    code: string;
    gradeName?: string;
    subjectName?: string;
  };
  teacher?: {
    fullName: string;
    phoneNumber: string;
  };
  subjectName?: string;
  gradeName?: string;
  teacherName?: string;
  teacherPhone?: string;
  isVerified: boolean;
  status: string;
  source: string;
  createdAt: string;
  joinedAt?: string;
  birthDate?: string;
}

export const KitayarStudentsPage: React.FC = () => {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalStudents: 0,
    verifiedStudents: 0,
    pendingVerification: 0,
  });

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [isVerified, setIsVerified] = useState('all');
  const [source, setSource] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Student Detail Modal
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 15 };
      if (search.trim()) params.search = search.trim();
      if (status !== 'all') params.status = status;
      if (isVerified !== 'all') params.isVerified = isVerified;
      if (source !== 'all') params.source = source;

      const res = await api.get('/kitayar/students', { params });
      if (res.data?.success) {
        setStudents(res.data.data || []);
        setTotalPages(res.data.pagination?.pages || 1);
        setTotalCount(res.data.pagination?.total || 0);

        if (res.data.summary) {
          setSummary({
            totalStudents: res.data.summary.totalStudents ?? 0,
            verifiedStudents: res.data.summary.verifiedStudents ?? 0,
            pendingVerification: res.data.summary.pendingStudents ?? res.data.summary.pendingVerification ?? 0,
          });
        }
      }
    } catch (err: any) {
      console.error('Error fetching students:', err);
      toast.error(err?.response?.data?.message || 'خطا در دریافت لیست دانش‌آموزان');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page, status, isVerified, source]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
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

  // Helper getters for student relationships
  const getClassName = (s: StudentItem) => s.className || s.classroom?.name || 'کلاس نامشخص';
  const getClassCode = (s: StudentItem) => s.classCode || s.classroom?.code || '-';
  const getTeacherName = (s: StudentItem) => s.teacherName || s.teacher?.fullName || 'نامشخص';
  const getTeacherPhone = (s: StudentItem) => s.teacherPhone || s.teacher?.phoneNumber || '-';

  // Export to CSV with UTF-8 BOM for Persian characters in Excel
  const handleExportCSV = () => {
    if (students.length === 0) {
      toast.error('داده‌ای برای خروجی اکسل وجود ندارد');
      return;
    }

    const headers = [
      'نام',
      'نام خانوادگی',
      'نام پدر',
      'شماره دانش‌آموز',
      'شماره اولیاء',
      'نام کلاس',
      'کد کلاس',
      'معلم',
      'شماره معلم',
      'وضعیت تایید',
      'نحوه ثبت‌نام',
      'تاریخ عضویت',
    ];

    const rows = students.map((s) => [
      `"${s.firstName || ''}"`,
      `"${s.lastName || ''}"`,
      `"${s.fatherName || ''}"`,
      `"${s.studentPhone || ''}"`,
      `"${s.parentPhone || ''}"`,
      `"${getClassName(s)}"`,
      `"${getClassCode(s)}"`,
      `"${getTeacherName(s)}"`,
      `"${getTeacherPhone(s)}"`,
      `"${s.isVerified ? 'تایید شده' : 'در انتظار'}"`,
      `"${s.source === 'EXAM_LINK' ? 'لینک آزمون' : 'ثبت توسط معلم'}"`,
      `"${formatDate(s.joinedAt || s.createdAt)}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `kitayar-students-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('فایل اکسل با موفقیت ایجاد و دانلود شد');
  };

  return (
    <div className="space-y-6 text-slate-100 max-w-7xl mx-auto">
      {/* Top Banner Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/90 border border-slate-800/80 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-2xl shadow-lg shadow-emerald-500/20">
            🧑‍🎓
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">بانک دانش‌آموزان ثبت‌شده کیتایار</h2>
            <p className="text-xs text-slate-400 mt-1">
              فهرست جامع دانش‌آموزان ثبت‌نام شده توسط معلمان به همراه اطلاعات اولیاء، کلاس‌ها و خروجی رسمی
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/20 active:scale-[0.98]"
          >
            <span>📥</span>
            <span>خروجی اکسل (CSV)</span>
          </button>
          <button
            onClick={() => fetchStudents()}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/60 rounded-xl text-xs font-semibold transition shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>بروزرسانی</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur-xl group hover:border-blue-500/40 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">کل دانش‌آموزان فعال</p>
              <h3 className="text-2xl font-black text-white mt-1">
                {(summary?.totalStudents ?? 0).toLocaleString('fa-IR')}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center text-xl group-hover:scale-110 transition">
              🧑‍🎓
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span>در تمام کلاس‌های مدارس</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur-xl group hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">تایید شده توسط معلم</p>
              <h3 className="text-2xl font-black text-emerald-400 mt-1">
                {(summary?.verifiedStudents ?? 0).toLocaleString('fa-IR')}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-xl group-hover:scale-110 transition">
              ✅
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-500/80">
            <span>دارای تاییدیه رسمی حضور</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur-xl group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">در انتظار تایید</p>
              <h3 className="text-2xl font-black text-amber-400 mt-1">
                {(summary?.pendingVerification ?? 0).toLocaleString('fa-IR')}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-xl group-hover:scale-110 transition">
              ⏳
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-amber-500/80">
            <span>نیازمند بررسی توسط معلم</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur-xl group hover:border-indigo-500/40 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">نمایش در این صفحه</p>
              <h3 className="text-2xl font-black text-indigo-400 mt-1">
                {(students?.length ?? 0).toLocaleString('fa-IR')}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center text-xl group-hover:scale-110 transition">
              📋
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span>از مجموع {(totalCount || 0).toLocaleString('fa-IR')} دانش‌آموز</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 shadow-md backdrop-blur-xl">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <input
              type="text"
              placeholder="جستجوی نام، تلفن دانش‌آموز، اولیاء، نام پدر..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 text-xs text-slate-200 rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition placeholder:text-slate-500"
            />
            <span className="absolute right-3.5 top-3 text-slate-500 text-xs">🔍</span>
          </div>

          <div>
            <select
              value={isVerified}
              onChange={(e) => {
                setIsVerified(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-950/80 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="all">همه وضعیت‌های تایید</option>
              <option value="true">تایید شده</option>
              <option value="false">در انتظار تایید</option>
            </select>
          </div>

          <div>
            <select
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-950/80 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="all">همه روش‌های ثبت‌نام</option>
              <option value="MANUAL">ثبت مستقیم معلم</option>
              <option value="EXAM_LINK">ثبت با لینک آزمون</option>
            </select>
          </div>

          <div>
            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/20 active:scale-[0.98]"
            >
              جستجو و اعمال فیلتر
            </button>
          </div>
        </form>
      </div>

      {/* Students Table */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl backdrop-blur-xl">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 text-xs font-medium">در حال دریافت لیست دانش‌آموزان...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="p-20 text-center text-slate-400">
            <span className="text-5xl block mb-3 opacity-60">🔍</span>
            <p className="font-bold text-base text-slate-200">دانش‌آموزی با این مشخصات یافت نشد</p>
            <p className="text-xs text-slate-500 mt-1">لطفاً عبارت جستجو یا فیلترها را تغییر دهید.</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950/70 text-slate-400 text-[11px] font-bold uppercase border-b border-slate-800/80">
                <tr>
                  <th className="p-4">مشخصات دانش‌آموز</th>
                  <th className="p-4">نام پدر</th>
                  <th className="p-4">شماره دانش‌آموز</th>
                  <th className="p-4">شماره اولیاء</th>
                  <th className="p-4">کلاس و کد</th>
                  <th className="p-4">معلم مربوطه</th>
                  <th className="p-4 text-center">وضعیت تایید</th>
                  <th className="p-4">تاریخ ثبت</th>
                  <th className="p-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {students.map((student) => (
                  <tr key={student._id} className="hover:bg-slate-800/30 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0">
                          {student.firstName?.charAt(0) || 'د'}
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs">{student.fullName}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {student.source === 'EXAM_LINK' ? (
                              <span className="text-indigo-400 font-medium">🌐 لینک آزمون</span>
                            ) : (
                              <span className="text-slate-400 font-medium">✍️ ثبت معلم</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-slate-300 font-medium">
                      {student.fatherName || '-'}
                    </td>

                    <td className="p-4 font-mono text-slate-300 direction-ltr text-right">
                      <div className="flex items-center gap-1.5 justify-start">
                        <span>{student.studentPhone}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(student.studentPhone);
                            toast.success('شماره دانش‌آموز کپی شد');
                          }}
                          className="text-slate-500 hover:text-slate-300 transition p-1"
                          title="کپی شماره"
                        >
                          📋
                        </button>
                      </div>
                    </td>

                    <td className="p-4 font-mono text-slate-300 direction-ltr text-right">
                      {student.parentPhone && student.parentPhone !== '-' ? (
                        <div className="flex items-center gap-1.5 justify-start">
                          <span>{student.parentPhone}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(student.parentPhone || '');
                              toast.success('شماره اولیاء کپی شد');
                            }}
                            className="text-slate-500 hover:text-slate-300 transition p-1"
                            title="کپی شماره اولیاء"
                          >
                            📋
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">ثبت نشده</span>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="font-semibold text-slate-200 text-xs">{getClassName(student)}</div>
                      <span className="inline-block font-mono text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded mt-0.5 font-bold">
                        {getClassCode(student)}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="font-medium text-slate-200 text-xs">{getTeacherName(student)}</div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">{getTeacherPhone(student)}</div>
                    </td>

                    <td className="p-4 text-center">
                      {student.isVerified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <span>✓</span>
                          <span>تایید شده</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          <span>⏳</span>
                          <span>در انتظار</span>
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-slate-400 text-[11px]">
                      {formatDate(student.joinedAt || student.createdAt)}
                    </td>

                    <td className="p-4 text-center">
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-xl border border-blue-500/30 text-xs font-semibold transition shadow-sm"
                        title="مشاهده جزئیات کامل"
                      >
                        جزئیات کامل
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
          <div className="p-4 border-t border-slate-800/80 flex items-center justify-between bg-slate-950/40">
            <span className="text-xs text-slate-400">
              نمایش صفحه {page} از {totalPages} (مجموع {totalCount} دانش‌آموز)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-medium rounded-xl text-slate-300 transition"
              >
                قبلی
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-medium rounded-xl text-slate-300 transition"
              >
                بعدی
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-xl font-bold">
                  🧑‍🎓
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedStudent.fullName}</h3>
                  <p className="text-xs text-slate-400">شناسه سیستم: {selectedStudent._id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[11px] text-slate-400 block mb-1">نام پدر:</span>
                  <span className="font-bold text-white">{selectedStudent.fatherName || '-'}</span>
                </div>

                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[11px] text-slate-400 block mb-1">وضعیت تایید:</span>
                  <span className={selectedStudent.isVerified ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {selectedStudent.isVerified ? '✓ تایید شده' : '⏳ در انتظار تایید'}
                  </span>
                </div>

                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[11px] text-slate-400 block mb-1">تلفن دانش‌آموز:</span>
                  <span className="font-mono text-emerald-400 font-bold">{selectedStudent.studentPhone}</span>
                </div>

                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[11px] text-slate-400 block mb-1">تلفن اولیاء:</span>
                  <span className="font-mono text-blue-400 font-bold">{selectedStudent.parentPhone || 'ثبت نشده'}</span>
                </div>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 space-y-2.5">
                <div className="text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">
                  اطلاعات کلاس، پایه و معلم
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">نام کلاس:</span>
                  <span className="font-bold text-white">{getClassName(selectedStudent)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">کد کلاس:</span>
                  <span className="font-mono text-blue-400 font-bold">{getClassCode(selectedStudent)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">معلم کلاس:</span>
                  <span className="font-semibold text-emerald-300">
                    {getTeacherName(selectedStudent)} ({getTeacherPhone(selectedStudent)})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">پایه و درس:</span>
                  <span className="text-slate-300">
                    {selectedStudent.classroom?.gradeName || selectedStudent.gradeName || '-'} / {selectedStudent.classroom?.subjectName || selectedStudent.subjectName || '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">نحوه عضویت:</span>
                  <span className="text-slate-300">
                    {selectedStudent.source === 'EXAM_LINK' ? 'شرکت در لینک آزمون' : 'ثبت مستقیم توسط معلم'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">تاریخ عضویت:</span>
                  <span className="text-slate-300">{formatDate(selectedStudent.joinedAt || selectedStudent.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KitayarStudentsPage;
