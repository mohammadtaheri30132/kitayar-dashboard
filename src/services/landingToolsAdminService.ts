import api from './api'

export interface LandingToolsConfigData {
  key: string
  sectionTitle: string
  sectionSubtitle: string
  featuredToolIds: string[]
  updatedAt?: string
}

export async function fetchLandingToolsConfig() {
  const res = await api.get('/landing-tools')
  return res.data as { success: boolean; data: LandingToolsConfigData }
}

export async function updateLandingToolsConfig(payload: {
  sectionTitle: string
  sectionSubtitle: string
  featuredToolIds: string[]
}) {
  const res = await api.put('/landing-tools', payload)
  return res.data as { success: boolean; message: string; data: LandingToolsConfigData }
}

