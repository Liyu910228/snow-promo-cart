// 雪花促销品系统 - 类型定义

// ========== 用户账号 ==========
export interface User {
  id: string
  username: string
  password: string
  role: 'admin' | 'user'
  name: string
  warehouseId?: string
  status: 'active' | 'disabled'
  createdAt: string
}

// ========== 促销品 ==========
export interface Product {
  id: string
  code: string           // 物资编码
  name: string           // 物资名称
  imageUrl?: string      // 促销品图片地址，支持公有云链接或本地图片 data URL
  category: string       // 物资类别
  unit: string           // 单位
  price: number          // 中标价格
  supplier: string       // 供应商
  contactInfo?: string    // 联系方式
  minOrderQty: number    // 最小起订量（MOQ）
  minDeliveryQty: number  // 最小起送量（MSQ）
  deliveryDays: string   // 货期
  contractCode: string   // 合同编码
  contractLink?: string   // 合同链接
  priceValidFrom: string // 价格有效期开始时间
  priceValidTo: string   // 价格有效期结束时间
}

// ========== 仓储 ==========
export interface Warehouse {
  id: string
  name: string           // 仓储名称
  region: string        // 覆盖区域
  address?: string       // 详细地址
  contact?: string       // 联系人
  phone?: string         // 联系电话
}

// ========== 拼单 ==========
export interface GroupOrder {
  id: string
  productId: string
  warehouseId: string
  currentQty: number     // 已拼数量
  status: 'pending' | 'ready'  // 待成团 / 可生产
}

// ========== 购物车项 ==========
export interface CartItem {
  id: string
  productId: string
  warehouseId: string
  quantity: number
  isNewGroup: boolean    // 是否新建拼单
}

// ========== 分类选项 ==========
export interface CategoryOption {
  label: string
  value: string
}
