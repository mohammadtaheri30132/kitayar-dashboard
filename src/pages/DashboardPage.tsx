import { useEffect, useState } from 'react'
import { dashboardService } from '../services/dashboardService'
import type { DashboardStats } from '../services/dashboardService'
import toast from 'react-hot-toast'

const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await dashboardService.getStats()
      if (response.success) {
        setStats(response.data)
      }
    } catch (error: any) {
      toast.error('❌ خطا در دریافت آمار')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <svg className="animate-spin h-10 w-10 text-primary-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto" dir="rtl">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">داشبورد</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-2xl">👩‍🏫</div>
            <div>
              <div className="text-3xl font-bold text-gray-800">{stats?.teachers || 0}</div>
              <div className="text-sm text-gray-500">معلم</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center text-2xl">📝</div>
            <div>
              <div className="text-3xl font-bold text-gray-800">{stats?.questions?.total || 0}</div>
              <div className="text-sm text-gray-500">کل سوالات</div>
            </div>
          </div>
        </div>
      </div>

      {stats?.questions?.byType && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-bold text-gray-700 mb-4">سوالات به تفکیک نوع</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(stats.questions.byType).map(([type, count]) => (
              <div key={type} className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-lg font-bold text-gray-800">{count}</div>
                <div className="text-xs text-gray-500">{type}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardPage
