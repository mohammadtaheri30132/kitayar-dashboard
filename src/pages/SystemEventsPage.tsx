import React, { useState, useEffect } from 'react';
import { adminPlanningService } from '../services/adminPlanningService';
import type { SystemEvent } from '../services/adminPlanningService';
import JalaliDatePicker from '../components/JalaliDatePicker';
import toast from 'react-hot-toast';

export default function SystemEventsPage() {
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'holiday' | 'educational' | 'religious' | 'national' | 'school' | 'general'>('holiday');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await adminPlanningService.getSystemEvents();
      if (res.success) setEvents(res.data);
    } catch (err) {
      toast.error('خطا در دریافت مناسبت‌ها');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !type || !startDate || !endDate) {
      toast.error('لطفاً همه فیلدها را پر کنید');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await adminPlanningService.createSystemEvent({
        title,
        type,
        startDate,
        endDate,
        active: true
      });
      toast.success('مناسبت با موفقیت ثبت شد');
      // Reset form
      setTitle('');
      setType('holiday');
      setStartDate('');
      setEndDate('');
      // Refresh list
      fetchData();
    } catch (err) {
      toast.error('خطا در ثبت مناسبت');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    try {
      await adminPlanningService.deleteSystemEvent(id);
      toast.success('حذف شد');
      fetchData();
    } catch (e) {
      toast.error('خطا در حذف');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-white">مدیریت مناسبت‌های تقویم</h1>
      <p className="text-gray-400 mb-6">مناسبت‌های سیستمی (تعطیلات، اعیاد، روزهای مهم) در تقویم همه معلمان نمایش داده می‌شود.</p>
      
      {/* Add Form */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 mb-8">
        <h2 className="text-lg font-bold text-white mb-4">افزودن مناسبت جدید</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">عنوان مناسبت</label>
            <input 
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-gray-700 text-white rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="مثال: عید نوروز"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">نوع مناسبت</label>
            <select 
              value={type}
              onChange={e => setType(e.target.value as any)}
              className="w-full bg-gray-700 text-white rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="holiday">تعطیلات رسمی</option>
              <option value="educational">آموزشی</option>
              <option value="religious">مذهبی</option>
              <option value="national">ملی</option>
              <option value="school">مدرسه</option>
              <option value="general">عمومی</option>
            </select>
          </div>
          <JalaliDatePicker 
            startDate={startDate} 
            endDate={endDate} 
            onStartDateChange={setStartDate} 
            onEndDateChange={setEndDate} 
          />
          <div className="md:col-span-2 mt-2">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-bold w-full md:w-auto transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'در حال ثبت...' : 'ثبت مناسبت'}
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <p className="text-white">در حال بارگذاری...</p>
      ) : (
        <div className="grid gap-4">
          {events.map(e => (
            <div key={e._id} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center border border-gray-700">
              <div>
                <h3 className="text-lg font-bold text-white">{e.title}</h3>
                <p className="text-sm text-gray-400">نوع: {e.type}</p>
                <p className="text-xs text-gray-500 mt-1">از {e.startDate} تا {e.endDate}</p>
              </div>
              <button 
                onClick={() => handleDelete(e._id)}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
              >
                حذف
              </button>
            </div>
          ))}
          {events.length === 0 && (
            <p className="text-gray-400 text-center py-8">هیچ مناسبتی یافت نشد</p>
          )}
        </div>
      )}
    </div>
  );
}
