import api from './api';

export interface NokitaSiteSettingsData {
  homeHero: {
    badgeText: string;
    title: string;
    subtitle: string;
    ctaPrimaryText: string;
    ctaPrimaryLink: string;
    ctaSecondaryText: string;
    ctaSecondaryLink: string;
  };
  appDownload: {
    title: string;
    description: string;
    version: string;
    directApkUrl: string;
    bazaarUrl: string;
    myketUrl: string;
    iosPwaUrl: string;
  };
  features: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    tag?: string;
  }>;
  faqList: Array<{
    id: string;
    question: string;
    answer: string;
    category?: string;
    order: number;
    isPublished: boolean;
  }>;
  pages: {
    about: {
      title: string;
      content: string;
    };
    contact: {
      title: string;
      phone: string;
      email: string;
      supportHours: string;
      address: string;
      telegram: string;
      instagram: string;
    };
    terms: {
      title: string;
      content: string;
    };
    privacy: {
      title: string;
      content: string;
    };
  };
  seo: {
    siteTitle: string;
    titleTemplate: string;
    metaDescription: string;
    keywords: string[];
    ogImage: string;
    robotsIndex: boolean;
  };
}

export async function fetchNokitaSettings() {
  const res = await api.get('/admin/nokita/settings');
  return res.data as { success: boolean; data: NokitaSiteSettingsData };
}

export async function saveNokitaSettings(payload: Partial<NokitaSiteSettingsData>) {
  const res = await api.put('/admin/nokita/settings', payload);
  return res.data as { success: boolean; message: string; data: NokitaSiteSettingsData };
}

