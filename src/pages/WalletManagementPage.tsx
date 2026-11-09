import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { adminWalletService, type WalletUserItem, type WalletTxItem } from '../services/adminWalletService'

export const WalletManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'transactions'>('users')

  // Users State
  const [users, setUsers] = useState<WalletUserItem[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'teacher' | 'student'>('all')

  // Transactions State
  const [transactions, setTransactions] = useState<WalletTxItem[]>([])
  const [loadingTx, setLoadingTx] = useState(false)
  const [txTypeFilter, setTxTypeFilter] = useState('all')
  const [selectedUserFilter, setSelectedUserFilter] = useState<string | null>(null)

  // Adjust Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [targetUser, setTargetUser] = useState<WalletUserItem | null>(null)
  const [adjustAction, setAdjustAction] = useState<'credit' | 'debit'>('credit')
  const [adjustAmount, setAdjustAmount] = useState<string>('')
  const [adjustReason, setAdjustReason] = useState('')
  const [adjustNotes, setAdjustNotes] = useState('')
  const [submittingAdjust, setSubmittingAdjust] = useState(false)

  // Summary Metrics
  const totalBalance = users.reduce((sum, u) => sum + (u.wallet?.balance || 0), 0)
  const frozenCount = users.filter((u) => u.wallet?.isFrozen).length

  // Fetch Users
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      const data = await adminWalletService.searchUsers(search, roleFilter)
      setUsers(data)
    } catch (err: any) {
      toast.error('خطا در بارگذاری اطلاعات کاربران')
    } finally {
      setLoadingUsers(false)
    }
  }

  // Fetch Transactions
  const fetchTransactions = async (userId?: string) => {
    try {
      setLoadingTx(true)
      const params: any = { limit: 100 }
      if (txTypeFilter !== 'all') params.type = txTypeFilter
      if (userId) params.userId = userId
      else if (selectedUserFilter) params.userId = selectedUserFilter

      const data = await adminWalletService.getTransactions(params)
      setTransactions(data)
    } catch (err: any) {
      toast.error('خطا در بارگذاری تاریخچه تراکنش‌ها')
    } finally {
      setLoadingTx(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'users') {
      const timer = setTimeout(() => {
        fetchUsers()
      }, 300)
      return () => clearTimeout(timer)
    } else {
      fetchTransactions()
    }
  }, [activeTab, search, roleFilter, txTypeFilter, selectedUserFilter])

  // Open Modal
  const handleOpenAdjust = (user: WalletUserItem, action: 'credit' | 'debit' = 'credit') => {
    setTargetUser(user)
    setAdjustAction(action)
    setAdjustAmount('')
    setAdjustReason('')
    setAdjustNotes('')
    setModalOpen(true)
  }

  // Submit Adjust
  const handlePerformAdjust = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetUser) return

    const amountNum = parseInt(adjustAmount.replace(/,/g, ''), 10)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('لطفاً مبلغ معتبری را وارد نمایید')
      return
    }

    if (!adjustReason.trim()) {
      toast.error('لطفاً علت یا بابت عملیات مالی را درج کنید')
      return
    }

    try {
      setSubmittingAdjust(true)
      const res = await adminWalletService.adjustWallet({
        userId: targetUser.id,
        amount: amountNum,
        action: adjustAction,
        reason: adjustReason.trim(),
        adminNotes: adjustNotes.trim() || undefined,
      })

      if (res.success) {
        toast.success(res.message || 'عملیات با موفقیت انجام شد')
        setModalOpen(false)
        fetchUsers()
      } else {
        toast.error(res.message || 'خطا در ثبت تراکنش')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'خطا در برقراری ارتباط با سرور')
    } finally {
      setSubmittingAdjust(false)
    }
  }

  // Toggle Freeze
  const handleToggleFreeze = async (user: WalletUserItem) => {
    const isCurrentlyFrozen = user.wallet?.isFrozen
    const confirmMsg = isCurrentlyFrozen
      ? `آیا از رفع مسدودی حساب ${user.fullName} اطمینان دارید؟`
      : `آیا از مسدودسازی کیف پول ${user.fullName} اطمینان دارید؟ (کاربر امکان خرید یا برداشت نخواهد داشت)`

    if (!window.confirm(confirmMsg)) return

    try {
      const res = await adminWalletService.toggleFreeze(user.id)
      if (res.success) {
        toast.success(res.message)
        fetchUsers()
      }
    } catch (err: any) {
      toast.error('خطا در تغییر وضعیت حساب')
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'admin_credit':
        return <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[11px] font-bold">شارژ مدیریت</span>
      case 'admin_debit':
        return <span className="bg-rose-500/15 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full text-[11px] font-bold">کسر مدیریت</span>
      case 'deposit':
        return <span className="bg-blue-500/15 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full text-[11px] font-bold">شارژ درگاه</span>
      case 'material_purchase':
        return <span className="bg-purple-500/15 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full text-[11px] font-bold">خرید فایل</span>
      case 'material_sale':
        return <span className="bg-teal-500/15 text-teal-400 border border-teal-500/30 px-2 py-0.5 rounded-full text-[11px] font-bold">فروش فایل</span>
      case 'question_fee':
        return <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full text-[11px] font-bold">پاسخ سوال</span>
      case 'online_class':
        return <span className="bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full text-[11px] font-bold">کلاس آنلاین</span>
      case 'withdrawal':
        return <span className="bg-orange-500/15 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full text-[11px] font-bold">تسویه حساب</span>
      default:
        return <span className="bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded-full text-[11px]">{type}</span>
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto text-slate-200">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 flex items-center justify-center text-xl shadow-lg shadow-emerald-500/20">
              💳
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                مدیریت کیف پول و امور مالی
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                نظارت بر تراز مالی، شارژ و کسر دستی اعتبار، مسدودسازی حساب و حسابرسی تراکنش‌ها
              </p>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              setActiveTab('users')
              setSelectedUserFilter(null)
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            👥 حساب‌های کاربران ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'transactions'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📜 دفتر کل تراکنش‌ها
          </button>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0B1122] border border-slate-800/80 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">مجموع مانده حساب‌ها</p>
            <p className="text-xl font-black text-emerald-400 mt-1 font-mono">
              {totalBalance.toLocaleString()} <span className="text-xs font-normal text-slate-400">تومان</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-lg">
            💰
          </div>
        </div>

        <div className="bg-[#0B1122] border border-slate-800/80 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">کل کاربران بازبینی شده</p>
            <p className="text-xl font-black text-white mt-1 font-mono">
              {users.length} <span className="text-xs font-normal text-slate-400">نفر</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-lg">
            👨‍🎓
          </div>
        </div>

        <div className="bg-[#0B1122] border border-slate-800/80 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">حساب‌های مسدود شده</p>
            <p className="text-xl font-black text-rose-400 mt-1 font-mono">
              {frozenCount} <span className="text-xs font-normal text-slate-400">مورد</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center text-lg">
            🔒
          </div>
        </div>

        <div className="bg-[#0B1122] border border-slate-800/80 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">وضعیت سامانه پولی</p>
            <p className="text-sm font-black text-teal-400 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              هوشمند و آنلاین
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center text-lg">
            🛡️
          </div>
        </div>
      </div>

      {/* TAB 1: USERS LIST & BALANCE */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-[#0B1122] border border-slate-800/80 p-3.5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="جستجو با نام، شماره تماس یا نام‌کاربری..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none pr-9"
              />
              <span className="absolute right-3 top-3 text-slate-500 text-sm">🔍</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">نقش:</span>
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setRoleFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    roleFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  همه
                </button>
                <button
                  onClick={() => setRoleFilter('teacher')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    roleFilter === 'teacher' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  معلمان
                </button>
                <button
                  onClick={() => setRoleFilter('student')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    roleFilter === 'student' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  دانش‌آموزان
                </button>
              </div>

              <button
                onClick={fetchUsers}
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
                title="تازوه‌سازی"
              >
                🔄
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-[#0B1122] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
            {loadingUsers ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs">در حال جستجو و دریافت مانده حساب‌ها...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <p className="text-3xl mb-2">🔍</p>
                <p className="text-sm font-bold text-slate-300">هیچ کاربری با این مشخصات یافت نشد</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-900/60 text-slate-400 font-bold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">کاربر</th>
                      <th className="py-3 px-4">نقش</th>
                      <th className="py-3 px-4">شماره تماس</th>
                      <th className="py-3 px-4">موجودی فعلی</th>
                      <th className="py-3 px-4">کل دریافتی / درآمد</th>
                      <th className="py-3 px-4">کل پرداختی / هزینه</th>
                      <th className="py-3 px-4">وضعیت حساب</th>
                      <th className="py-3 px-4 text-center">عملیات مدیریت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {users.map((u) => {
                      const balance = u.wallet?.balance || 0
                      const isFrozen = u.wallet?.isFrozen

                      return (
                        <tr key={u.id} className="hover:bg-slate-850/40 transition">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-slate-700 to-slate-800 flex items-center justify-center font-bold text-slate-200">
                                {u.fullName?.charAt(0) || 'ک'}
                              </div>
                              <div>
                                <p className="font-bold text-white text-xs">{u.fullName}</p>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{u.username || '-'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            {u.role === 'teacher' ? (
                              <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-md font-bold text-[10px]">
                                👨‍🏫 معلم
                              </span>
                            ) : u.role === 'student' ? (
                              <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md font-bold text-[10px]">
                                🧑‍🎓 دانش‌آموز
                              </span>
                            ) : (
                              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md font-bold text-[10px]">
                                🛡️ مدیر
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-300 dir-ltr text-right">
                            {u.phoneNumber || '-'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-sm text-emerald-400">
                              {balance.toLocaleString()}
                            </span>{' '}
                            <span className="text-[10px] text-slate-400">تومان</span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-300">
                            {(u.wallet?.totalEarned || 0).toLocaleString()} تومان
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-400">
                            {(u.wallet?.totalSpent || 0).toLocaleString()} تومان
                          </td>
                          <td className="py-3.5 px-4">
                            {isFrozen ? (
                              <span className="bg-rose-500/15 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-max">
                                <span>🔒</span> مسدود
                              </span>
                            ) : (
                              <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-max">
                                <span>✅</span> فعال
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Charge / Debit */}
                              <button
                                onClick={() => handleOpenAdjust(u, 'credit')}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold transition flex items-center gap-1"
                                title="شارژ یا کسر موجودی"
                              >
                                <span>⚡</span> عملیات مالی
                              </button>

                              {/* View Transactions */}
                              <button
                                onClick={() => {
                                  setSelectedUserFilter(u.id)
                                  setActiveTab('transactions')
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium transition"
                                title="مشاهده ریزتراکنش‌ها"
                              >
                                📜 تراکنش‌ها
                              </button>

                              {/* Freeze Toggle */}
                              <button
                                onClick={() => handleToggleFreeze(u)}
                                className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border transition ${
                                  isFrozen
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30'
                                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-rose-400'
                                }`}
                                title={isFrozen ? 'رفع مسدودی' : 'مسدود کردن'}
                              >
                                {isFrozen ? '🔓 بازگشایی' : '🔒 مسدود'}
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

      {/* TAB 2: TRANSACTIONS LEDGER */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          {/* Ledger Filters */}
          <div className="bg-[#0B1122] border border-slate-800/80 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">نوع تراکنش:</span>
              <select
                value={txTypeFilter}
                onChange={(e) => setTxTypeFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
              >
                <option value="all">همه انواع تراکنش‌ها</option>
                <option value="admin_credit">شارژ توسط مدیر (admin_credit)</option>
                <option value="admin_debit">کسر توسط مدیر (admin_debit)</option>
                <option value="material_purchase">خرید فایل آموزشی</option>
                <option value="material_sale">فروش فایل توسط معلم</option>
                <option value="question_fee">حق‌التدریس پاسخ به سوال</option>
                <option value="online_class">کلاس آنلاین</option>
                <option value="deposit">شارژ از درگاه بانکی</option>
                <option value="withdrawal">درخواست تسویه حساب</option>
              </select>

              {selectedUserFilter && (
                <div className="flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 px-3 py-1.5 rounded-xl text-xs text-blue-300">
                  <span>فیلتر روی کاربر انتخابی</span>
                  <button
                    onClick={() => setSelectedUserFilter(null)}
                    className="text-white hover:text-rose-400 font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => fetchTransactions()}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1.5 text-xs font-bold"
            >
              🔄 تازه‌سازی دفتر کل
            </button>
          </div>

          {/* Ledger Table */}
          <div className="bg-[#0B1122] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
            {loadingTx ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs">در حال فراخوانی تاریخچه تراکنش‌ها...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <p className="text-3xl mb-2">📜</p>
                <p className="text-sm font-bold text-slate-300">هیچ تراکنشی یافت نشد</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-900/60 text-slate-400 font-bold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">کد رهگیری</th>
                      <th className="py-3 px-4">کاربر</th>
                      <th className="py-3 px-4">نوع عملیات</th>
                      <th className="py-3 px-4">مبلغ</th>
                      <th className="py-3 px-4">مانده پس از تراکنش</th>
                      <th className="py-3 px-4">شرح / بابت</th>
                      <th className="py-3 px-4">یادداشت ادمین</th>
                      <th className="py-3 px-4">تاریخ و زمان</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {transactions.map((tx) => {
                      const isPositive = tx.amount > 0
                      const dateStr = new Date(tx.createdAt).toLocaleDateString('fa-IR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })

                      return (
                        <tr key={tx._id} className="hover:bg-slate-850/40 transition">
                          <td className="py-3.5 px-4 font-mono text-[11px] text-indigo-400">
                            {tx.trackingCode}
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-white text-xs">
                              {tx.userId?.fullName || 'کاربر نامشخص'}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {tx.userId?.phoneNumber || tx.userId?.role || '-'}
                            </p>
                          </td>
                          <td className="py-3.5 px-4">{getTypeBadge(tx.type)}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-sm">
                            <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                              {isPositive ? '+' : ''}
                              {tx.amount.toLocaleString()} تومان
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-300">
                            {(tx.balanceAfter || 0).toLocaleString()} تومان
                          </td>
                          <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate" title={tx.description}>
                            {tx.description}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate text-[11px]" title={tx.adminNotes}>
                            {tx.adminNotes || '-'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                            {dateStr}
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

      {/* ADJUSTMENT MODAL */}
      {modalOpen && targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0B1122] border border-slate-700/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">💳</span>
                <h3 className="text-sm font-bold text-white">
                  عملیات مالی دستی: {targetUser.fullName}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handlePerformAdjust} className="p-5 space-y-4">
              {/* Current Balance Banner */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-400">موجودی فعلی حساب:</p>
                  <p className="font-mono font-bold text-emerald-400 text-base mt-0.5">
                    {(targetUser.wallet?.balance || 0).toLocaleString()} تومان
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-[11px] text-slate-400">نقش کاربر:</p>
                  <span className="text-xs font-bold text-indigo-300">
                    {targetUser.role === 'teacher' ? '👨‍🏫 معلم' : '🧑‍🎓 دانش‌آموز'}
                  </span>
                </div>
              </div>

              {/* Action Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">نوع عملیات:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAdjustAction('credit')}
                    className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border ${
                      adjustAction === 'credit'
                        ? 'bg-emerald-600/25 text-emerald-300 border-emerald-500 shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850'
                    }`}
                  >
                    <span>➕</span> افزایش موجودی (شارژ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustAction('debit')}
                    className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border ${
                      adjustAction === 'debit'
                        ? 'bg-rose-600/25 text-rose-300 border-rose-500 shadow-lg shadow-rose-500/10'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850'
                    }`}
                  >
                    <span>➖</span> کسر موجودی
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  مبلغ (تومان):
                </label>
                <input
                  type="text"
                  placeholder="مثال: 100,000"
                  value={adjustAmount}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '')
                    setAdjustAmount(raw ? parseInt(raw, 10).toLocaleString() : '')
                  }}
                  required
                  className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-white font-mono outline-none"
                />

                {/* Quick amount chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[50000, 100000, 200000, 500000, 1000000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAdjustAmount(amt.toLocaleString())}
                      className="text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg transition"
                    >
                      {amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  علت / بابت (قابل مشاهده توسط کاربر):
                </label>
                <input
                  type="text"
                  placeholder="مثال: پاداش تولید محتوای برتر، استرداد وجه و..."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2 text-xs text-white outline-none"
                />
              </div>

              {/* Admin Internal Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  یادداشت محرمانه مدیریت (اختیاری):
                </label>
                <textarea
                  placeholder="توضیحات و رفرنس ارجاع داخلی..."
                  rows={2}
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2 text-xs text-white outline-none resize-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  disabled={submittingAdjust}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition flex items-center justify-center gap-2 ${
                    adjustAction === 'credit'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                      : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                  } disabled:opacity-50`}
                >
                  {submittingAdjust ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>تایید و ثبت در دفتر کل</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default WalletManagementPage
