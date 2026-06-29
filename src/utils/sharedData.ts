import type { Product, User, Warehouse, GroupOrder } from '@/types'
import type { Order } from '@/stores/order'
import type { AiModelConfig } from '@/stores/aiModel'

export interface SharedState {
  products: Product[]
  warehouses: Warehouse[]
  accounts: User[]
  orders: Order[]
  groupOrders: GroupOrder[]
  aiModels: AiModelConfig[]
}

const defaultState: SharedState = {
  products: [],
  warehouses: [],
  accounts: [],
  orders: [],
  groupOrders: [],
  aiModels: []
}

const apiBase = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api`

export const fetchSharedState = async (): Promise<SharedState | null> => {
  try {
    const response = await fetch(`${apiBase}/state`, { cache: 'no-store' })
    if (!response.ok) return null
    const data = await response.json()
    return { ...defaultState, ...data }
  } catch {
    return null
  }
}

export const saveSharedState = async (state: SharedState) => {
  try {
    await fetch(`${apiBase}/state`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    })
  } catch {
    return
  }
}

export const uploadSharedImage = async (file: File, dataUrl: string): Promise<string | null> => {
  try {
    const response = await fetch(`${apiBase}/upload-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type,
        dataUrl
      })
    })
    if (!response.ok) return null
    const data = await response.json()
    return typeof data.url === 'string' ? data.url : null
  } catch {
    return null
  }
}

export const cacheSharedImageUrl = async (imageUrl: string): Promise<string | null> => {
  try {
    const response = await fetch(`${apiBase}/cache-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl })
    })
    if (!response.ok) return null
    const data = await response.json()
    return typeof data.url === 'string' ? data.url : null
  } catch {
    return null
  }
}
