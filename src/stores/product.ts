import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Product, CategoryOption } from '@/types'

// 模拟促销品数据
const mockProducts: Product[] = [
  {
    id: '1',
    code: 'XH-2024-001',
    name: '雪花啤酒定制玻璃杯',
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80',
    category: '玻璃制品',
    unit: '个',
    price: 12.5,
    supplier: '深圳玻璃制品厂',
    contactInfo: '',
    minOrderQty: 100,
    minDeliveryQty: 30,
    deliveryDays: '15天',
    contractCode: 'HT-2024-001',
    contractLink: 'https://example.com/contracts/HT-2024-001',
    priceValidFrom: '2024-01-01',
    priceValidTo: '2024-12-31'
  },
  {
    id: '2',
    code: 'XH-2024-002',
    name: '雪花啤酒开瓶器钥匙扣',
    imageUrl: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=600&q=80',
    category: '金属制品',
    unit: '个',
    price: 8.0,
    supplier: '东莞五金制品厂',
    contactInfo: '',
    minOrderQty: 200,
    minDeliveryQty: 50,
    deliveryDays: '10天',
    contractCode: 'HT-2024-002',
    contractLink: 'https://example.com/contracts/HT-2024-002',
    priceValidFrom: '2024-01-01',
    priceValidTo: '2024-12-31'
  },
  {
    id: '3',
    code: 'XH-2024-003',
    name: '雪花啤酒品牌T恤',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80',
    category: '纺织品',
    unit: '件',
    price: 45.0,
    supplier: '广州服装厂',
    contactInfo: '',
    minOrderQty: 50,
    minDeliveryQty: 10,
    deliveryDays: '20天',
    contractCode: 'HT-2024-003',
    contractLink: 'https://example.com/contracts/HT-2024-003',
    priceValidFrom: '2024-02-01',
    priceValidTo: '2024-08-31'
  },
  {
    id: '4',
    code: 'XH-2024-004',
    name: '雪花啤酒折叠雨伞',
    imageUrl: 'https://images.unsplash.com/photo-1590649880765-91b1956b8276?auto=format&fit=crop&w=600&q=80',
    category: '日用品',
    unit: '把',
    price: 35.0,
    supplier: '佛山雨具厂',
    contactInfo: '',
    minOrderQty: 100,
    minDeliveryQty: 20,
    deliveryDays: '12天',
    contractCode: 'HT-2024-004',
    contractLink: 'https://example.com/contracts/HT-2024-004',
    priceValidFrom: '2024-03-01',
    priceValidTo: '2024-09-30'
  },
  {
    id: '5',
    code: 'XH-2024-005',
    name: '雪花啤酒保温杯',
    imageUrl: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=600&q=80',
    category: '金属制品',
    unit: '个',
    price: 68.0,
    supplier: '浙江保温杯厂',
    contactInfo: '',
    minOrderQty: 80,
    minDeliveryQty: 20,
    deliveryDays: '18天',
    contractCode: 'HT-2024-005',
    contractLink: 'https://example.com/contracts/HT-2024-005',
    priceValidFrom: '2024-01-01',
    priceValidTo: '2024-12-31'
  },
  {
    id: '6',
    code: 'XH-2024-006',
    name: '雪花啤酒帆布袋',
    imageUrl: 'https://images.unsplash.com/photo-1597484662317-9bd7bdda2907?auto=format&fit=crop&w=600&q=80',
    category: '纺织品',
    unit: '个',
    price: 15.0,
    supplier: '广州服装厂',
    contactInfo: '',
    minOrderQty: 200,
    minDeliveryQty: 50,
    deliveryDays: '10天',
    contractCode: 'HT-2024-006',
    contractLink: 'https://example.com/contracts/HT-2024-006',
    priceValidFrom: '2024-01-01',
    priceValidTo: '2024-12-31'
  }
]

const fallbackProductImages: Record<string, string> = Object.fromEntries(
  mockProducts.map(product => [product.code, product.imageUrl || ''])
)

const createProductId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `product-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

const normalizeProductIds = (list: Product[]) => {
  const seen = new Set<string>()
  return list.map(product => {
    if (!product.id || seen.has(product.id)) {
      const nextProduct = { ...product, id: createProductId() }
      seen.add(nextProduct.id)
      return nextProduct
    }
    seen.add(product.id)
    return product
  })
}

export const useProductStore = defineStore('product', () => {
  // 状态 - 初始化为空数组，persist 插件会自动恢复
  const products = ref<Product[]>([])
  const searchKeyword = ref('')
  const selectedCategory = ref('')
  const selectedSupplier = ref('')
  const selectedDeliveryDays = ref('')
  const selectedPriceRange = ref('')
  const selectedMOQRange = ref('')
  const selectedMSQRange = ref('')
  const selectedPriceValid = ref('')

  // 计算属性 - 分类列表
  const categories = computed<CategoryOption[]>(() => {
    const cats = new Set(products.value.map(p => p.category))
    return [
      { label: '类别', value: '' },
      ...Array.from(cats).map(cat => ({ label: cat, value: cat }))
    ]
  })

  // 计算属性 - 供应商列表
  const suppliers = computed<CategoryOption[]>(() => {
    const sups = new Set(products.value.map(p => p.supplier))
    return [
      { label: '供应商', value: '' },
      ...Array.from(sups).map(sup => ({ label: sup, value: sup }))
    ]
  })

  // 计算属性 - 货期列表
  const deliveryDaysOptions = computed<CategoryOption[]>(() => {
    const days = new Set(products.value.map(p => p.deliveryDays))
    return [
      { label: '货期', value: '' },
      ...Array.from(days).map(d => ({ label: d, value: d }))
    ]
  })

  // 计算属性 - 价格区间列表（按价格分组）
  const priceRangeOptions = computed<CategoryOption[]>(() => {
    return [
      { label: '单价', value: '' },
      { label: '0-20元', value: '0-20' },
      { label: '20-50元', value: '20-50' },
      { label: '50-100元', value: '50-100' },
      { label: '100元以上', value: '100+' }
    ]
  })

  // 计算属性 - MOQ区间列表
  const moqRangeOptions = computed<CategoryOption[]>(() => {
    return [
      { label: 'MOQ', value: '' },
      { label: '50以下', value: '0-50' },
      { label: '50-100', value: '50-100' },
      { label: '100-200', value: '100-200' },
      { label: '200以上', value: '200+' }
    ]
  })

  // 计算属性 - MSQ区间列表
  const msqRangeOptions = computed<CategoryOption[]>(() => {
    return [
      { label: 'MSQ', value: '' },
      { label: '10以下', value: '0-10' },
      { label: '10-30', value: '10-30' },
      { label: '30-50', value: '30-50' },
      { label: '50以上', value: '50+' }
    ]
  })

  // 计算属性 - 价格有效期列表
  const priceValidOptions = computed<CategoryOption[]>(() => {
    const now = new Date()
    const year = now.getFullYear()
    return [
      { label: '有效期', value: '' },
      { label: '已过期', value: 'expired' },
      { label: '有效', value: 'valid' },
      { label: `${year}年内`, value: `year-${year}` }
    ]
  })

  // 辅助函数 - 检查价格区间
  const checkPriceRange = (price: number, range: string) => {
    switch (range) {
      case '0-20': return price >= 0 && price < 20
      case '20-50': return price >= 20 && price < 50
      case '50-100': return price >= 50 && price < 100
      case '100+': return price >= 100
      default: return true
    }
  }

  // 辅助函数 - 检查MOQ区间
  const checkMOQRange = (moq: number, range: string) => {
    switch (range) {
      case '0-50': return moq < 50
      case '50-100': return moq >= 50 && moq < 100
      case '100-200': return moq >= 100 && moq < 200
      case '200+': return moq >= 200
      default: return true
    }
  }

  // 辅助函数 - 检查MSQ区间
  const checkMSQRange = (msq: number, range: string) => {
    switch (range) {
      case '0-10': return msq < 10
      case '10-30': return msq >= 10 && msq < 30
      case '30-50': return msq >= 30 && msq < 50
      case '50+': return msq >= 50
      default: return true
    }
  }

  // 辅助函数 - 检查价格有效期
  const checkPriceValid = (from: string, to: string, status: string) => {
    const now = new Date()
    const fromDate = new Date(from)
    const toDate = new Date(to)
    
    switch (status) {
      case 'expired': return now > toDate
      case 'valid': return now >= fromDate && now <= toDate
      case `year-${now.getFullYear()}`: 
        return fromDate.getFullYear() === now.getFullYear() || toDate.getFullYear() === now.getFullYear()
      default: return true
    }
  }

  // 计算属性 - 筛选后的产品列表
  const filteredProducts = computed(() => {
    let result = [...products.value]
    
    // 分类筛选
    if (selectedCategory.value) {
      result = result.filter(p => p.category === selectedCategory.value)
    }
    
    // 供应商筛选
    if (selectedSupplier.value) {
      result = result.filter(p => p.supplier === selectedSupplier.value)
    }

    // 货期筛选
    if (selectedDeliveryDays.value) {
      result = result.filter(p => p.deliveryDays === selectedDeliveryDays.value)
    }

    // 价格区间筛选
    if (selectedPriceRange.value) {
      result = result.filter(p => checkPriceRange(p.price, selectedPriceRange.value))
    }

    // MOQ区间筛选
    if (selectedMOQRange.value) {
      result = result.filter(p => checkMOQRange(p.minOrderQty, selectedMOQRange.value))
    }

    // MSQ区间筛选
    if (selectedMSQRange.value) {
      result = result.filter(p => checkMSQRange(p.minDeliveryQty, selectedMSQRange.value))
    }

    // 价格有效期筛选
    if (selectedPriceValid.value) {
      result = result.filter(p => checkPriceValid(p.priceValidFrom, p.priceValidTo, selectedPriceValid.value))
    }
    
    // 关键词搜索（名称/编码）
    if (searchKeyword.value.trim()) {
      const keyword = searchKeyword.value.trim().toLowerCase()
      result = result.filter(p => 
        p.name.toLowerCase().includes(keyword) ||
        p.code.toLowerCase().includes(keyword)
      )
    }
    
    return result
  })

  // 方法 - 添加产品
  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...product,
      id: createProductId()
    }
    products.value.push(newProduct)
    return newProduct
  }

  // 方法 - 更新产品
  const updateProduct = (id: string, data: Partial<Product>) => {
    const index = products.value.findIndex(p => p.id === id)
    if (index > -1) {
      products.value[index] = { ...products.value[index], ...data }
      return true
    }
    return false
  }

  // 方法 - 删除产品
  const deleteProduct = (id: string) => {
    const originalLength = products.value.length
    products.value = products.value.filter(p => p.id !== id)
    if (products.value.length !== originalLength) {
      return true
    }
    return false
  }

  // 方法 - 获取单个产品
  const getProductById = (id: string) => {
    return products.value.find(p => p.id === id)
  }

  return {
    // 状态
    products,
    searchKeyword,
    selectedCategory,
    selectedSupplier,
    selectedDeliveryDays,
    selectedPriceRange,
    selectedMOQRange,
    selectedMSQRange,
    selectedPriceValid,
    // 计算属性
    categories,
    suppliers,
    deliveryDaysOptions,
    priceRangeOptions,
    moqRangeOptions,
    msqRangeOptions,
    priceValidOptions,
    filteredProducts,
    // 方法
    addProduct,
    updateProduct,
    deleteProduct,
    getProductById
  }
}, {
  persist: {
    key: 'snow-product-store',
    storage: localStorage,
    paths: ['products'],
    afterRestore: (ctx) => {
      // 如果恢复后没有数据，则使用模拟数据
      if (!ctx.store.products || ctx.store.products.length === 0) {
        ctx.store.products = [...mockProducts]
      } else {
        ctx.store.products = normalizeProductIds(ctx.store.products.map((product: Product) => ({
          ...product,
          imageUrl: product.imageUrl || fallbackProductImages[product.code] || '',
          contactInfo: product.contactInfo || '',
          contractLink: product.contractLink || ''
        })))
      }
    }
  }
})
