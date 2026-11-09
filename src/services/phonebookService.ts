import api from './api';

export interface PhonebookCategoryItem {
  _id: string;
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  parentId?: string | null;
  order: number;
  isEmergency: boolean;
  isActive: boolean;
  subcategoriesCount?: number;
  contactsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PhonebookContactItem {
  _id: string;
  title: string;
  phoneNumber: string;
  phoneSecondary?: string;
  internalNumber?: string;
  categoryId: any; // ID or populated object
  department?: string;
  responsiblePerson?: string;
  city?: string;
  address?: string;
  description?: string;
  order: number;
  isEmergency: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const phonebookService = {
  // Categories
  async getCategories(parentId?: string) {
    const params = parentId ? { parentId } : {};
    const res = await api.get('/phonebook/categories', { params });
    return res.data;
  },

  async createCategory(data: Partial<PhonebookCategoryItem>) {
    const res = await api.post('/phonebook/categories', data);
    return res.data;
  },

  async updateCategory(id: string, data: Partial<PhonebookCategoryItem>) {
    const res = await api.put(`/phonebook/categories/${id}`, data);
    return res.data;
  },

  async deleteCategory(id: string) {
    const res = await api.delete(`/phonebook/categories/${id}`);
    return res.data;
  },

  // Contacts
  async getContacts(params?: { categoryId?: string; search?: string; isEmergency?: boolean; page?: number; limit?: number }) {
    const res = await api.get('/phonebook/contacts', { params });
    return res.data;
  },

  async createContact(data: Partial<PhonebookContactItem>) {
    const res = await api.post('/phonebook/contacts', data);
    return res.data;
  },

  async updateContact(id: string, data: Partial<PhonebookContactItem>) {
    const res = await api.put(`/phonebook/contacts/${id}`, data);
    return res.data;
  },

  async deleteContact(id: string) {
    const res = await api.delete(`/phonebook/contacts/${id}`);
    return res.data;
  },

  // Excel Import
  async importExcel(items: any[], targetCategoryId?: string) {
    const res = await api.post('/phonebook/import-excel', { items, targetCategoryId });
    return res.data;
  },

  // JSON Import (accepts array of contacts, object with categories/contacts, or raw JSON text)
  async importJson(data: any, targetCategoryId?: string) {
    const payload = Array.isArray(data)
      ? { items: data, targetCategoryId }
      : typeof data === 'string'
      ? { jsonText: data, targetCategoryId }
      : { ...data, targetCategoryId };
    const res = await api.post('/phonebook/import-json', payload);
    return res.data;
  },

  // Seed default data
  async seedDefaults() {
    const res = await api.post('/phonebook/seed-defaults');
    return res.data;
  },
};
