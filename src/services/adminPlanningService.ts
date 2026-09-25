import api from './api';

export interface Announcement {
  _id?: string;
  title: string;
  shortMessage: string;
  description?: string;
  startDate: string;
  endDate: string;
  priority: 'low' | 'normal' | 'high';
  active: boolean;
}

export interface SystemEvent {
  _id?: string;
  title: string;
  type: 'holiday' | 'educational' | 'religious' | 'national' | 'school' | 'general';
  startDate: string;
  endDate: string;
  description?: string;
  color?: string;
  active: boolean;
}

export const adminPlanningService = {
  getAnnouncements: async () => {
    const res = await api.get('/announcements');
    return res.data;
  },
  createAnnouncement: async (data: Announcement) => {
    const res = await api.post('/announcements', data);
    return res.data;
  },
  deleteAnnouncement: async (id: string) => {
    const res = await api.delete(`/announcements/${id}`);
    return res.data;
  },
  getSystemEvents: async () => {
    const res = await api.get('/system-events');
    return res.data;
  },
  createSystemEvent: async (data: SystemEvent) => {
    const res = await api.post('/system-events', data);
    return res.data;
  },
  deleteSystemEvent: async (id: string) => {
    const res = await api.delete(`/system-events/${id}`);
    return res.data;
  }
};
