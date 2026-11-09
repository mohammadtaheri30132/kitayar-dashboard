import api from './api'

export interface QuizDashboardData {
  totalMatches: number
  completedMatches: number
  botMatches: number
  humanMatches: number
  botMatchPercentage: number
  totalPlayers: number
  coinTransactionsSummary: Array<{ _id: string; totalAmount: number; count: number }>
  recentMatches: Array<{
    _id: string
    matchId: string
    mode: string
    player1: { username: string; score: number }
    player2: { username: string; score: number; isBot: boolean }
    status: string
    winner?: string
    createdAt: string
  }>
}

export interface QuizConfigData {
  roundsPerMatch: number
  questionsPerRound: number
  questionTimerSeconds: number
  maxHearts: number
  heartRegenMinutes: number
  winCoinReward: number
  drawCoinReward: number
  lossCoinReward: number
  winXpReward: number
  matchmakingTimeoutSeconds: number
  botDistribution: {
    easy: number
    medium: number
    hard: number
  }
  botAccuracy: {
    easy: { easy: number; medium: number; hard: number }
    medium: { easy: number; medium: number; hard: number }
    hard: { easy: number; medium: number; hard: number }
  }
  hintPrices: {
    removeTwo: number
    extraTime: number
    audiencePoll: number
    learningHint: number
  }
}

export const adminQuizService = {
  getDashboard: async () => {
    const res = await api.get('/quiz/dashboard')
    return res.data
  },

  getConfig: async () => {
    const res = await api.get('/quiz/config')
    return res.data
  },

  updateConfig: async (config: Partial<QuizConfigData>) => {
    const res = await api.put('/quiz/config', config)
    return res.data
  },

  getBots: async () => {
    const res = await api.get('/quiz/bots')
    return res.data
  },

  getPlayers: async (page = 1, search = '') => {
    const res = await api.get(`/quiz/players?page=${page}&search=${encodeURIComponent(search)}`)
    return res.data
  },

  adjustCoins: async (userId: string, amount: number, reason: string) => {
    const res = await api.post(`/quiz/players/${userId}/adjust-coins`, { amount, reason })
    return res.data
  },

  createQuizQuestion: async (payload: {
    question: string
    options: string[]
    answer: string
    difficulty: string
    category: string
    explanation?: string
  }) => {
    const res = await api.post('/quiz/questions', payload)
    return res.data
  },
}
