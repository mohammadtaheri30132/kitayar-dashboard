import axios from 'axios';

const api = axios.create({
  baseURL: '/api/extension/admin',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ExtensionShortcutItem {
  _id?: string;
  title: string;
  url: string;
  icon: string;
  description?: string;
  category?: string;
  isPinned: boolean;
  order: number;
  isActive?: boolean;
}

export interface ExtensionCalendarEventItem {
  _id?: string;
  jalaliDate: string;
  day: number;
  month: number;
  year?: number;
  title: string;
  description?: string;
  isExam: boolean;
  hasBlueDot: boolean;
  badgeText?: string;
  isActive?: boolean;
}

export interface ExtensionNotificationItem {
  _id?: string;
  title: string;
  message: string;
  tag?: string;
  linkUrl?: string;
  sentAt?: string;
}

export interface ExtensionNewsItem {
  _id?: string;
  title: string;
  summary?: string;
  content: string;
  category: string;
  imageUrl?: string;
  externalUrl?: string;
  isPublished: boolean;
  publishedAt?: string;
  order?: number;
  createdAt?: string;
}

export interface ExtensionSettingsItem {
  _id?: string;
  newsArchiveUrl: string;
  shortcutCategories: string[];
  subjects: {
    elementary: string[];
    highschool: string[];
  };
}

export interface ExtensionTeacherItem {
  _id: string;
  phone: string;
  fullName: string;
  workMode?: 'school' | 'office';
  schoolName?: string;
  districtName?: string;
  role?: string;
  fileUrl?: string;
  fileName?: string;
  city?: string;
  isVerified: boolean;
  lastActive: string;
  createdAt: string;
}

export const extensionAdminService = {
  async getOverview() {
    const res = await api.get('/overview');
    return res.data.data;
  },

  // تنظیمات عمومی، دسته‌ها و دروس
  async getSettings() {
    const res = await api.get('/settings');
    return res.data.settings as ExtensionSettingsItem;
  },
  async updateSettings(data: Partial<ExtensionSettingsItem>) {
    const res = await api.put('/settings', data);
    return res.data;
  },

  // وب‌سایت‌ها
  async getShortcuts() {
    const res = await api.get('/shortcuts');
    return res.data.shortcuts as ExtensionShortcutItem[];
  },
  async createShortcut(data: Partial<ExtensionShortcutItem>) {
    const res = await api.post('/shortcuts', data);
    return res.data;
  },
  async updateShortcut(id: string, data: Partial<ExtensionShortcutItem>) {
    const res = await api.put(`/shortcuts/${id}`, data);
    return res.data;
  },
  async deleteShortcut(id: string) {
    const res = await api.delete(`/shortcuts/${id}`);
    return res.data;
  },

  // اخبار آموزش و پرورش
  async getNews() {
    const res = await api.get('/news');
    return res.data.news as ExtensionNewsItem[];
  },
  async createNews(data: Partial<ExtensionNewsItem>) {
    const res = await api.post('/news', data);
    return res.data;
  },
  async updateNews(id: string, data: Partial<ExtensionNewsItem>) {
    const res = await api.put(`/news/${id}`, data);
    return res.data;
  },
  async deleteNews(id: string) {
    const res = await api.delete(`/news/${id}`);
    return res.data;
  },

  // تقویم و رویدادها
  async getCalendarEvents() {
    const res = await api.get('/calendar-events');
    return res.data.events as ExtensionCalendarEventItem[];
  },
  async createCalendarEvent(data: Partial<ExtensionCalendarEventItem>) {
    const res = await api.post('/calendar-events', data);
    return res.data;
  },
  async deleteCalendarEvent(id: string) {
    const res = await api.delete(`/calendar-events/${id}`);
    return res.data;
  },

  // اعلانات
  async getNotifications() {
    const res = await api.get('/notifications');
    return res.data.notifications as ExtensionNotificationItem[];
  },
  async broadcastNotification(data: { title: string; message: string; tag?: string; linkUrl?: string }) {
    const res = await api.post('/notifications/broadcast', data);
    return res.data;
  },
  async deleteNotification(id: string) {
    const res = await api.delete(`/notifications/${id}`);
    return res.data;
  },

  // معلمان و همکاران
  async getTeachers(search = '') {
    const res = await api.get('/teachers', { params: { search } });
    return res.data.teachers as ExtensionTeacherItem[];
  },
};
