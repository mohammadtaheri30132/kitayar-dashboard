import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { QuestionDraft, QuestionType, Difficulty } from '../types/question'

const emptyDraft = (): QuestionDraft => ({
  question_id: uuidv4(),
  source_image: '',
  type: null,
  difficulty: 'ساده',
  question: '',
  options: [],
  matching_left: [],
  matching_right: [],
  lesson_id: '',
  page_number: '',
  answer: '',
})

interface QuestionStore {
  draft: QuestionDraft
  title: string
  hasBody: boolean
  body: string
  setTitle: (v: string) => void
  setHasBody: (v: boolean) => void
  setBody: (v: string) => void
  setType: (t: QuestionType) => void
  setField: <K extends keyof QuestionDraft>(key: K, value: QuestionDraft[K]) => void
  setOptions: (opts: string[]) => void
  setMatchingLeft: (arr: string[]) => void
  setMatchingRight: (arr: string[]) => void
  resetDraft: () => void
  setFullDraft: (draft: Partial<QuestionDraft>) => void
}

export const useQuestionStore = create<QuestionStore>((set) => ({
  draft: emptyDraft(),
  title: '',
  hasBody: false,
  body: '',
  setTitle: (v) => set({ title: v }),
  setHasBody: (v) => set({ hasBody: v }),
  setBody: (v) => set({ body: v }),
  setType: (t) => set({ draft: { ...emptyDraft(), type: t } }),
  setField: (key, value) => set((s) => ({ draft: { ...s.draft, [key]: value } })),
  setOptions: (opts) => set((s) => ({ draft: { ...s.draft, options: opts } })),
  setMatchingLeft: (arr) => set((s) => ({ draft: { ...s.draft, matching_left: arr } })),
  setMatchingRight: (arr) => set((s) => ({ draft: { ...s.draft, matching_right: arr } })),
  resetDraft: () => set({ draft: emptyDraft() }),
  setFullDraft: (partial) => set((s) => ({ draft: { ...s.draft, ...partial } })),
}))

export type { Difficulty }
