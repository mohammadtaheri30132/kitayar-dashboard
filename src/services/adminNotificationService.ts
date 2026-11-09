import api from './api';

export interface TeacherFilterParams {
  category?: string;
  position?: string;
  school?: string;
}

export interface SendTeacherNotificationPayload {
  title: string;
  body: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  category?: string;
  position?: string;
  school?: string;
}

export interface FcmSettings {
  serverKey: string;
  enabled: boolean;
  activeTokensCount?: number;
}

export interface AdminNotificationItem {
  _id: string;
  title: string;
  body: string;
  priority: string;
  type: string;
  recipientType: string;
  recipientPhone?: string;
  filters?: {
    category?: string;
    position?: string;
    school?: string;
  };
  createdAt: string;
}

export const adminNotificationService = {
  // دریافت تعداد معلمان منطبق با فیلترها
  async getFilteredCount(filters: TeacherFilterParams): Promise<number> {
    const params = new URLSearchParams();
    if (filters.category && filters.category !== 'all') params.append('category', filters.category);
    if (filters.position && filters.position !== 'all') params.append('position', filters.position);
    if (filters.school && filters.school.trim()) params.append('school', filters.school.trim());

    const res = await api.get(`/notifications/teachers-count?${params.toString()}`);
    return res.data.count || 0;
  },

  // ارسال اعلان به معلمان
  async sendToTeachers(payload: SendTeacherNotificationPayload): Promise<{ success: boolean; message: string; sentCount: number }> {
    const res = await api.post('/notifications/send-teachers', payload);
    return res.data;
  },

  // تاریخچه اعلان‌ها
  async getHistory(page = 1, limit = 20): Promise<{ notifications: AdminNotificationItem[]; total: number; pages: number }> {
    const res = await api.get(`/notifications/history?page=${page}&limit=${limit}`);
    return res.data;
  },

  // دریافت تنظیمات FCM
  async getFcmSettings(): Promise<FcmSettings> {
    const res = await api.get('/notifications/fcm-settings');
    return res.data.data;
  },

  // ذخیره تنظیمات FCM
  async updateFcmSettings(settings: { serverKey: string; enabled: boolean }): Promise<{ success: boolean; message: string }> {
    const res = await api.post('/notifications/fcm-settings', settings);
    return res.data;
  },
};
