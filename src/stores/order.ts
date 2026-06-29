import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 订单项类型
export interface OrderItem {
  productId: string
  productName: string
  productCode: string
  warehouseId: string
  warehouseName: string
  price: number
  quantity: number
  subtotal: number
}

// 订单类型
export interface Order {
  id: string
  orderNo: string
  userId: string
  userName: string
  items: OrderItem[]
  totalQuantity: number
  totalAmount: number
  status: 'pending' | 'confirmed' | 'rejected' | 'processing' | 'shipped' | 'completed' | 'cancelled'
  createdAt: string
  confirmedAt?: string
  rejectedAt?: string
  rejectReason?: string
  remark?: string
}

// 模拟订单数据（仅用于首次初始化）
const mockOrders: Order[] = [
  {
    id: 'mock-1',
    orderNo: 'ORD20240424001',
    userId: '2',
    userName: 'root',
    items: [
      {
        productId: '1',
        productName: '雪花啤酒定制玻璃杯',
        productCode: 'XH-2024-001',
        warehouseId: '1',
        warehouseName: '成都仓储中心',
        price: 12.5,
        quantity: 50,
        subtotal: 625
      }
    ],
    totalQuantity: 50,
    totalAmount: 625,
    status: 'pending',
    createdAt: '2024-04-24 10:30:00'
  },
  {
    id: 'mock-2',
    orderNo: 'ORD20240424002',
    userId: '3',
    userName: 'sales01',
    items: [
      {
        productId: '2',
        productName: '雪花啤酒 promotional T恤',
        productCode: 'XH-2024-002',
        warehouseId: '2',
        warehouseName: '重庆仓储中心',
        price: 35,
        quantity: 30,
        subtotal: 1050
      }
    ],
    totalQuantity: 30,
    totalAmount: 1050,
    status: 'confirmed',
    createdAt: '2024-04-24 11:00:00',
    confirmedAt: '2024-04-24 14:00:00'
  }
]

// 从 localStorage 加载数据
const loadFromStorage = (): Order[] => {
  try {
    const stored = localStorage.getItem('snow-order-store')
    if (stored) {
      const data = JSON.parse(stored)
      if (data.orders && Array.isArray(data.orders)) {
        return data.orders
      }
    }
  } catch {
    return []
  }
  return []
}

// 保存到 localStorage
const saveToStorage = (orders: Order[]) => {
  try {
    const data = { orders }
    localStorage.setItem('snow-order-store', JSON.stringify(data))
  } catch {
    return
  }
}

// 初始化数据：先尝试从 localStorage 加载，如果没有则使用 mockOrders
const initialOrders = loadFromStorage()
const orders = ref<Order[]>(initialOrders.length > 0 ? initialOrders : [...mockOrders])

// 如果使用了 mockOrders，保存到 localStorage
if (initialOrders.length === 0) {
  saveToStorage(orders.value)
}

export const useOrderStore = defineStore('order', () => {
  // 监听跨标签页的 localStorage 变化
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'snow-order-store' && e.newValue) {
      try {
        const data = JSON.parse(e.newValue)
        if (data.orders && Array.isArray(data.orders)) {
          orders.value = data.orders
        }
      } catch {
        return
      }
    }
  }

  // 注册 storage 事件监听器
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageChange)
  }

  // 获取所有订单
  const allOrders = computed(() => orders.value)

  // 获取待处理订单
  const pendingOrders = computed(() => 
    orders.value.filter(o => o.status === 'pending')
  )

  // 获取已确认订单
  const confirmedOrders = computed(() => 
    orders.value.filter(o => o.status === 'confirmed')
  )

  // 手动刷新（从 localStorage 重新加载）
  const refreshFromStorage = () => {
    const loaded = loadFromStorage()
    if (loaded.length > 0) {
      orders.value = loaded
    }
  }

  // 添加订单
  const addOrder = (order: Omit<Order, 'id'>) => {
    const newOrder = {
      ...order,
      id: 'order-' + Date.now()
    }
    orders.value.unshift(newOrder)
    
    // 立即保存到 localStorage
    saveToStorage(orders.value)
  }

  // 更新订单状态
  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    const order = orders.value.find(o => o.id === orderId)
    if (order) {
      order.status = status
      if (status === 'confirmed') {
        order.confirmedAt = new Date().toLocaleString('zh-CN')
      }
      saveToStorage(orders.value)
    }
  }

  // 拒绝订单（带拒绝原因）
  const rejectOrder = (orderId: string, reason: string) => {
    const order = orders.value.find(o => o.id === orderId)
    if (order) {
      order.status = 'rejected'
      order.rejectedAt = new Date().toLocaleString('zh-CN')
      order.rejectReason = reason
      saveToStorage(orders.value)
    }
  }

  // 获取某用户的订单
  const getOrdersByUserId = (userId: string) => {
    return orders.value.filter(o => o.userId === userId)
  }

  // 删除订单
  const deleteOrder = (orderId: string) => {
    const index = orders.value.findIndex(o => o.id === orderId)
    if (index > -1) {
      orders.value.splice(index, 1)
      saveToStorage(orders.value)
    }
  }

  // 获取订单详情
  const getOrderById = (orderId: string) => {
    return orders.value.find(o => o.id === orderId)
  }

  return {
    orders,
    allOrders,
    pendingOrders,
    confirmedOrders,
    refreshFromStorage,
    addOrder,
    updateOrderStatus,
    rejectOrder,
    getOrdersByUserId,
    deleteOrder,
    getOrderById
  }
})
