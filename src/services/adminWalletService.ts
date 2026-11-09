import { api } from './api'

export interface WalletUserItem {
  id: string
  fullName: string
  phoneNumber?: string
  username: string
  role: 'admin' | 'teacher' | 'student'
  wallet: {
    balance: number
    totalEarned: number
    totalSpent: number
    isFrozen: boolean
  }
}

export interface WalletTxItem {
  _id: string
  userId: {
    _id: string
    fullName: string
    phoneNumber?: string
    role: string
  }
  amount: number
  balanceAfter: number
  type: string
  status: string
  description: string
  adminNotes?: string
  trackingCode: string
  createdAt: string
}

export const adminWalletService = {
  searchUsers: async (search = '', role = 'all'): Promise<WalletUserItem[]> => {
    const res = await api.get('/wallets/users', {
      params: { search, role },
    })
    return res.data?.data || []
  },

  adjustWallet: async (data: {
    userId: string
    amount: number
    action: 'credit' | 'debit'
    reason: string
    adminNotes?: string
  }) => {
    const res = await api.post('/wallets/adjust', data)
    return res.data
  },

  getTransactions: async (params?: { userId?: string; type?: string; limit?: number }): Promise<WalletTxItem[]> => {
    const res = await api.get('/wallets/transactions', { params })
    return res.data?.data || []
  },

  toggleFreeze: async (userId: string) => {
    const res = await api.post(`/wallets/${userId}/toggle-freeze`)
    return res.data
  },
}
