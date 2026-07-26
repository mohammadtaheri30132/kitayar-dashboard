import { create } from 'zustand'

export type PageId = 'essay' | 'multiple-choice' | 'fill-blank' | 'matching'

interface AppState {
  activePage: PageId
  setActivePage: (p: PageId) => void
}

export const useAppStore = create<AppState>((set) => ({
  activePage: 'essay',
  setActivePage: (p) => set({ activePage: p }),
}))