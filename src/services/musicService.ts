import api from './api';

export interface MusicCategory {
  _id: string;
  title: string;
  description?: string;
  icon?: string;
  coverUrl?: string;
  order: number;
  isActive: boolean;
  trackCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MusicTrack {
  _id: string;
  title: string;
  artist: string;
  audioUrl: string;
  coverUrl?: string;
  lyrics?: string;
  categoryId: { _id: string; title: string } | string;
  duration?: number;
  order: number;
  playsCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const musicAdminService = {
  // Categories
  async getCategories(): Promise<MusicCategory[]> {
    const res = await api.get('/music/categories');
    return res.data.data;
  },

  async createCategory(data: Partial<MusicCategory>): Promise<MusicCategory> {
    const res = await api.post('/music/categories', data);
    return res.data.data;
  },

  async updateCategory(id: string, data: Partial<MusicCategory>): Promise<MusicCategory> {
    const res = await api.put(`/music/categories/${id}`, data);
    return res.data.data;
  },

  async deleteCategory(id: string): Promise<void> {
    await api.delete(`/music/categories/${id}`);
  },

  // Tracks
  async getTracks(params?: { categoryId?: string; q?: string; page?: number; limit?: number }) {
    const res = await api.get('/music/tracks', { params });
    return res.data;
  },

  async createTrack(data: Partial<MusicTrack>): Promise<MusicTrack> {
    const res = await api.post('/music/tracks', data);
    return res.data.data;
  },

  async updateTrack(id: string, data: Partial<MusicTrack>): Promise<MusicTrack> {
    const res = await api.put(`/music/tracks/${id}`, data);
    return res.data.data;
  },

  async deleteTrack(id: string): Promise<void> {
    await api.delete(`/music/tracks/${id}`);
  },

  // Upload Audio
  async uploadAudio(file: File): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('audio', file);
    const res = await api.post('/music/upload-audio', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // Upload Cover
  async uploadCover(file: File): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('cover', file);
    const res = await api.post('/music/upload-cover', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};
