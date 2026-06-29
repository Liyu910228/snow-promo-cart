import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { GroupOrder } from '@/types'

// 从 localStorage 加载数据
const loadFromStorage = (): GroupOrder[] => {
  try {
    const stored = localStorage.getItem('snow-grouporder-store')
    if (stored) {
      const data = JSON.parse(stored)
      if (data.groupOrders && Array.isArray(data.groupOrders)) {
        return data.groupOrders
      }
    }
  } catch {
    return []
  }
  return []
}

// 保存到 localStorage
const saveToStorage = (groupOrders: GroupOrder[]) => {
  try {
    localStorage.setItem('snow-grouporder-store', JSON.stringify({ groupOrders }))
  } catch {
    return
  }
}

// 初始化：从 localStorage 加载已有数据
const initialGroupOrders = loadFromStorage()
const groupOrders = ref<GroupOrder[]>(initialGroupOrders)

// 重要：拼单数据仅来源于管理员确认的订单
// 业务员提交订单时不会更新拼单进度，只有管理员确认后才更新
// 这样确保未审批的订单数量对其他业务员不可见

export const useGroupOrderStore = defineStore('groupOrder', () => {
  // 监听跨标签页的 localStorage 变化
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'snow-grouporder-store' && e.newValue) {
      try {
        const data = JSON.parse(e.newValue)
        if (data.groupOrders && Array.isArray(data.groupOrders)) {
          groupOrders.value = data.groupOrders
        }
      } catch {
        return
      }
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageChange)
  }

  // 获取所有拼单
  const allGroupOrders = computed(() => groupOrders.value)

  // 获取某产品在某仓储的拼单
  const getGroupOrder = (productId: string, warehouseId: string) => {
    return groupOrders.value.find(
      go => go.productId === productId && go.warehouseId === warehouseId
    )
  }

  // 获取某产品的所有拼单
  const getProductGroupOrders = (productId: string) => {
    return groupOrders.value.filter(go => go.productId === productId)
  }

  // 获取某产品的全局拼单进度（所有仓储已拼量之和）
  const getProductTotalQty = (productId: string) => {
    return groupOrders.value
      .filter(go => go.productId === productId)
      .reduce((sum, go) => sum + go.currentQty, 0)
  }

  // 增加拼单数量（业务员加入购物车时调用）
  const addToGroupOrder = (productId: string, warehouseId: string, quantity: number) => {
    let go = groupOrders.value.find(
      g => g.productId === productId && g.warehouseId === warehouseId
    )
    
    if (go) {
      go.currentQty += quantity
    } else {
      // 新建拼单
      go = {
        id: Date.now().toString(),
        productId,
        warehouseId,
        currentQty: quantity,
        status: 'pending'
      }
      groupOrders.value.push(go)
    }
    
    saveToStorage(groupOrders.value)
  }

  // 减少拼单数量（取消订单时调用）
  const subtractFromGroupOrder = (productId: string, warehouseId: string, quantity: number) => {
    const go = groupOrders.value.find(
      g => g.productId === productId && g.warehouseId === warehouseId
    )
    
    if (go) {
      go.currentQty = Math.max(0, go.currentQty - quantity)
      saveToStorage(groupOrders.value)
    }
  }

  // 确认拼单（管理员确认订单时调用，检查是否达到起订量）
  const confirmGroupOrder = (productId: string, warehouseId: string, minOrderQty: number) => {
    const go = groupOrders.value.find(
      g => g.productId === productId && g.warehouseId === warehouseId
    )
    
    if (go && go.currentQty >= minOrderQty) {
      go.status = 'ready'
      saveToStorage(groupOrders.value)
    }
  }

  // 手动刷新
  const refreshFromStorage = () => {
    const loaded = loadFromStorage()
    if (loaded.length > 0) {
      groupOrders.value = loaded
    }
  }

  return {
    groupOrders,
    allGroupOrders,
    getGroupOrder,
    getProductGroupOrders,
    getProductTotalQty,
    addToGroupOrder,
    subtractFromGroupOrder,
    confirmGroupOrder,
    refreshFromStorage
  }
})
