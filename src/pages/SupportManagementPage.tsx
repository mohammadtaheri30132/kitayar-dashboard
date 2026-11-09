import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

interface Message {
  _id?: string;
  sender: 'teacher' | 'admin';
  senderName: string;
  text: string;
  createdAt: string;
}

interface Ticket {
  _id: string;
  teacherId: string;
  teacherName: string;
  teacherPhone: string;
  subject: string;
  status: 'open' | 'answered' | 'closed';
  messages: Message[];
  lastReplyAt: string;
  createdAt: string;
  updatedAt: string;
}

const API_BASE = '/support';

export const SupportManagementPage: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [sendingReply, setSendingReply] = useState<boolean>(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await api.get(`${API_BASE}/tickets`, {
        params: { status: statusFilter, search },
      });
      if (res.data?.success) {
        setTickets(res.data.data || []);
        if (selectedTicket) {
          const updated = res.data.data.find((t: Ticket) => t._id === selectedTicket._id);
          if (updated) setSelectedTicket(updated);
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error('خطا در دریافت تیکت‌های پشتیبانی');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTickets();
  };

  const handleSendReply = async () => {
    if (!selectedTicket) return;
    if (!replyText.trim()) {
      toast.error('لطفاً متن پاسخ را بنویسید');
      return;
    }

    setSendingReply(true);
    try {
      const res = await api.post(`${API_BASE}/tickets/${selectedTicket._id}/reply`, {
        message: replyText.trim(),
        status: 'answered',
      });
      if (res.data?.success) {
        toast.success('پاسخ ارسال شد و نوتیفیکیشن برای معلم ارسال گردید');
        setReplyText('');
        fetchTickets();
      }
    } catch (err: any) {
      console.error(err);
      toast.error('خطا در ارسال پاسخ');
    } finally {
      setSendingReply(false);
    }
  };

  const handleUpdateStatus = async (status: 'open' | 'answered' | 'closed') => {
    if (!selectedTicket) return;
    try {
      const res = await api.patch(`${API_BASE}/tickets/${selectedTicket._id}/status`, { status });
      if (res.data?.success) {
        toast.success(
          `وضعیت تیکت به ${status === 'closed' ? 'بسته شده' : status === 'answered' ? 'پاسخ داده شده' : 'باز'} تغییر کرد`
        );
        fetchTickets();
      }
    } catch (err) {
      toast.error('خطا در تغییر وضعیت تیکت');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] px-2.5 py-0.5 rounded-full font-bold">
            در انتظار پاسخ
          </span>
        );
      case 'answered':
        return (
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] px-2.5 py-0.5 rounded-full font-bold">
            پاسخ داده شده
          </span>
        );
      case 'closed':
        return (
          <span className="bg-slate-800 text-slate-400 border border-slate-700 text-[11px] px-2.5 py-0.5 rounded-full font-medium">
            بسته شده
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 text-slate-100 max-w-7xl mx-auto" dir="rtl">
      {/* Title & Filters Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/90 border border-slate-800/80 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl shadow-lg shadow-indigo-500/20">
            💬
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">مرکز تیکت‌های پشتیبانی معلمان</h2>
            <p className="text-xs text-slate-400 mt-1">
              مشاهده پیام‌های ارسالی معلمان از اپلیکیشن کیتایار و ارسال پاسخ مستقیم همراه با نوتیفیکیشن
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="جستجو در نام یا موضوع..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48 sm:w-60 bg-slate-950/80 border border-slate-800 text-xs text-slate-200 rounded-xl px-3.5 py-2.5 pr-8 focus:outline-none focus:border-indigo-500 transition placeholder:text-slate-500"
              />
              <span className="absolute right-2.5 top-3 text-slate-500 text-xs">🔍</span>
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700/60 transition shadow-sm"
            >
              جستجو
            </button>
          </form>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 transition"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="open">در انتظار پاسخ (باز)</option>
            <option value="answered">پاسخ داده شده</option>
            <option value="closed">بسته شده</option>
          </select>
        </div>
      </div>

      {/* Main 2-Column Chat Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Ticket List */}
        <div className="lg:col-span-1 bg-slate-900/70 rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden flex flex-col h-[680px] backdrop-blur-xl">
          <div className="p-4 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
            <span className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
              <span>📋</span>
              <span>لیست تیکت‌ها ({(tickets.length || 0).toLocaleString('fa-IR')})</span>
            </span>
            <button
              onClick={fetchTickets}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition"
            >
              بروزرسانی 🔄
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50 custom-scrollbar">
            {loading ? (
              <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400 text-xs">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <span>در حال بارگذاری تیکت‌ها...</span>
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-16 text-center text-slate-500 text-xs">
                <span className="text-4xl block mb-2 opacity-50">📭</span>
                <span>تیکتی در این بخش یافت نشد.</span>
              </div>
            ) : (
              tickets.map((t) => {
                const isSelected = selectedTicket?._id === t._id;
                const lastMsg = t.messages[t.messages.length - 1];
                return (
                  <div
                    key={t._id}
                    onClick={() => setSelectedTicket(t)}
                    className={`p-4 cursor-pointer transition-all text-right ${
                      isSelected
                        ? 'bg-indigo-600/15 border-r-4 border-indigo-500'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-white text-xs truncate max-w-[150px]">
                        {t.teacherName}
                      </span>
                      {getStatusBadge(t.status)}
                    </div>
                    <div className="text-xs font-semibold text-indigo-300 mb-1 truncate">{t.subject}</div>
                    <div className="text-[11px] text-slate-400 truncate mb-2">
                      {lastMsg?.text || 'بدون پیام'}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>{t.teacherPhone || 'بدون شماره'}</span>
                      <span>{new Date(t.updatedAt).toLocaleDateString('fa-IR')}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Conversation Thread & Reply */}
        <div className="lg:col-span-2 bg-slate-900/70 rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden flex flex-col h-[680px] backdrop-blur-xl">
          {selectedTicket ? (
            <>
              {/* Ticket Top Header */}
              <div className="p-4 border-b border-slate-800/80 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-sm">{selectedTicket.subject}</h3>
                    {getStatusBadge(selectedTicket.status)}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    ارسال کننده: <span className="font-semibold text-slate-200">{selectedTicket.teacherName}</span> (
                    <span className="font-mono text-emerald-400">{selectedTicket.teacherPhone}</span>) • تاریخ ایجاد: {new Date(selectedTicket.createdAt).toLocaleDateString('fa-IR')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleUpdateStatus(e.target.value as any)}
                    className="text-xs bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition"
                  >
                    <option value="open">تغییر به: باز</option>
                    <option value="answered">تغییر به: پاسخ‌داده</option>
                    <option value="closed">تغییر به: بسته</option>
                  </select>
                </div>
              </div>

              {/* Chat Thread Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-950/40 custom-scrollbar">
                {selectedTicket.messages.map((m, idx) => {
                  const isAdmin = m.sender === 'admin';
                  return (
                    <div
                      key={m._id || idx}
                      className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                    >
                      <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400">
                        <span className="font-bold text-slate-300">
                          {isAdmin ? '🛡️ پشتیبانی کیتایار (شما)' : `👨‍🏫 ${selectedTicket.teacherName}`}
                        </span>
                        <span>•</span>
                        <span className="font-mono">
                          {new Date(m.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap ${
                          isAdmin
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-600/20'
                            : 'bg-slate-800 text-slate-100 border border-slate-700/70 rounded-tl-none shadow-md'
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Box Composer */}
              <div className="p-4 border-t border-slate-800/80 bg-slate-950/70">
                <div className="flex gap-3">
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="پاسخ خود را بنویسید (با ارسال پاسخ، نوتیفیکیشن فوری برای معلم ارسال می‌شود)..."
                    className="flex-1 bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 transition resize-none placeholder:text-slate-500"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={sendingReply}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/20 transition active:scale-95"
                  >
                    {sendingReply ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      'ارسال پاسخ 🚀'
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <span className="text-5xl mb-3 opacity-60">💬</span>
              <p className="text-xs font-semibold text-slate-300">
                یک تیکت را از ستون کناری انتخاب کنید تا مکالمه را مشاهده و پاسخ دهید.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportManagementPage;
