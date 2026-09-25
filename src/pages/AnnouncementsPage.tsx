import React, { useState, useEffect } from 'react';
import { adminPlanningService } from '../services/adminPlanningService';
import type { Announcement } from '../services/adminPlanningService';
import JalaliDatePicker from '../components/JalaliDatePicker';
import toast from 'react-hot-toast';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [title, setTitle] = useState('');
  const [shortMessage, setShortMessage] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await adminPlanningService.getAnnouncements();
      if (res.success) setAnnouncements(res.data);
    } catch (err) {
      toast.error('خطا در دریافت اطلاعیه‌ها');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !shortMessage || !startDate || !endDate) {
      toast.error('لطفاً همه فیلدها را پر کنید');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await adminPlanningService.createAnnouncement({
        title,
        shortMessage,
        startDate,
        endDate,
        priority: 'normal',
        active: true
      });
      toast.success('اطلاعیه با موفقیت ثبت شد');
      // Reset form
      setTitle('');
      setShortMessage('');
      setStartDate('');
      setEndDate('');
      // Refresh list
      fetchData();
    } catch (e) {
      toast.error('خطا در ثبت اطلاعیه');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    try {
      await adminPlanningService.deleteAnnouncement(id);
      toast.success('حذف شد');
      fetchData();
    } catch (e) {
      toast.error('خطا در حذف');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-white">مدیریت اطلاعیه‌ها</h1>
      <p className="text-gray-400 mb-6">این اطلاعیه‌ها در داشبورد معلمان نمایش داده می‌شوند.</p>
      
      {/* Add Form */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 mb-8">
        <h2 className="text-lg font-bold text-white mb-4">افزودن اطلاعیه جدید</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">عنوان</label>
            <input 
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-gray-700 text-white rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="مثال: آزمون جامع"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">متن کوتاه</label>
            <input 
              type="text" 
              value={shortMessage}
              onChange={e => setShortMessage(e.target.value)}
              className="w-full bg-gray-700 text-white rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="مثال: فردا آزمون برگزار می‌شود"
            />
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
              {isSubmitting ? 'در حال ثبت...' : 'ثبت اطلاعیه'}
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <p className="text-white">در حال بارگذاری...</p>
      ) : (
        <div className="grid gap-4">
          {announcements.map(a => (
            <div key={a._id} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center border border-gray-700">
              <div>
                <h3 className="text-lg font-bold text-white">{a.title}</h3>
                <p className="text-sm text-gray-400">{a.shortMessage}</p>
                <p className="text-xs text-gray-500 mt-1">از {a.startDate} تا {a.endDate}</p>
              </div>
              <button 
                onClick={() => handleDelete(a._id)}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
              >
                حذف
              </button>
            </div>
          ))}
          {announcements.length === 0 && (
            <p className="text-gray-400 text-center py-8">هیچ اطلاعیه‌ای یافت نشد</p>
          )}
        </div>
      )}
    </div>
  );
}
