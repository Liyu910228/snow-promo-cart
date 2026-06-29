import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { CartItem } from '@/types'
import { useAuthStore } from '@/stores/auth'

// 获取当前用户的购物车 localStorage key
const getCartKey = (userId: string) => `snow-cart-store-${userId}`

// 从 localStorage 加载购物车数据
const loadFromStorage = (userId: string): CartItem[] => {
  if (!userId) return []
  try {
    const key = getCartKey(userId)
    const stored = localStorage.getItem(key)
    if (stored) {
      const data = JSON.parse(stored)
      if (Array.isArray(data)) {
        return data
      }
    }
  } catch {
    return []
  }
  return []
}

// 保存购物车数据到 localStorage
const saveToStorage = (userId: string, items: CartItem[]) => {
  if (!userId) return
  try {
    const key = getCartKey(userId)
    localStorage.setItem(key, JSON.stringify(items))
  } catch {
    return
  }
}

export const useCartStore = defineStore('cart', () => {
  // 购物车项
  const cartItems = ref<CartItem[]>([])

  // 计算属性 - 购物车总数
  const totalItems = computed(() => cartItems.value.length)

  // 当前用户ID
  const currentUserId = computed(() => {
    const authStore = useAuthStore()
    return authStore.user?.id || ''
  })

  // 初始化购物车（登录后调用）
  const initCart = () => {
    if (currentUserId.value) {
      cartItems.value = loadFromStorage(currentUserId.value)
    }
  }

  // 清空购物车（登出时调用）
  const clearCartOnLogout = () => {
    cartItems.value = []
  }

  // 监听购物车变化，自动保存到用户私有的 localStorage
  watch(
    cartItems,
    (items) => {
      if (currentUserId.value) {
        saveToStorage(currentUserId.value, items)
      }
    },
    { deep: true }
  )

  // 加入购物车
  const addToCart = (item: Omit<CartItem, 'id'>) => {
    // 检查是否已有相同产品+仓储的购物车项
    const existing = cartItems.value.find(
      ci => ci.productId === item.productId && ci.warehouseId === item.warehouseId
    )
    
    if (existing) {
      // 已存在则累加数量
      existing.quantity += item.quantity
    } else {
      // 新增
      cartItems.value.push({
        ...item,
        id: Date.now().toString()
      })
    }
  }

  // 修改购物车项数量
  const updateQuantity = (id: string, quantity: number) => {
    const item = cartItems.value.find(ci => ci.id === id)
    if (item) {
      item.quantity = quantity
    }
  }

  // 删除购物车项
  const removeItem = (id: string) => {
    const index = cartItems.value.findIndex(ci => ci.id === id)
    if (index > -1) {
      cartItems.value.splice(index, 1)
    }
  }

  // 清空购物车
  const clearCart = () => {
    cartItems.value = []
  }

  return {
    cartItems,
    totalItems,
    initCart,
    clearCartOnLogout,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart
  }
})
