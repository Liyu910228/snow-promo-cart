import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Warehouse } from '@/types'

// 模拟仓储数据
const mockWarehouses: Warehouse[] = [
  {
    id: '1',
    name: '深圳仓',
    region: '华南地区',
    address: '深圳市南山区科技园',
    contact: '张经理',
    phone: '13800138001'
  },
  {
    id: '2',
    name: '广州仓',
    region: '华南地区',
    address: '广州市白云区物流园',
    contact: '李经理',
    phone: '13800138002'
  },
  {
    id: '3',
    name: '成都仓',
    region: '西南地区',
    address: '成都市高新区物流中心',
    contact: '王经理',
    phone: '13800138003'
  },
  {
    id: '4',
    name: '北京仓',
    region: '华北地区',
    address: '北京市大兴区物流园',
    contact: '赵经理',
    phone: '13800138004'
  },
  {
    id: '5',
    name: '上海仓',
    region: '华东地区',
    address: '上海市浦东新区仓储中心',
    contact: '刘经理',
    phone: '13800138005'
  }
]

export const useWarehouseStore = defineStore('warehouse', () => {
  // 状态 - 初始化为空数组，persist 插件会自动恢复
  const warehouses = ref<Warehouse[]>([])
  const searchKeyword = ref('')
  const selectedRegion = ref('')

  // 计算属性 - 区域列表
  const regions = computed(() => {
    const regionSet = new Set(warehouses.value.map(w => w.region))
    return [
      { label: '全部区域', value: '' },
      ...Array.from(regionSet).map(r => ({ label: r, value: r }))
    ]
  })

  // 计算属性 - 筛选后的仓储列表
  const filteredWarehouses = computed(() => {
    let result = [...warehouses.value]
    
    // 区域筛选
    if (selectedRegion.value) {
      result = result.filter(w => w.region === selectedRegion.value)
    }

    // 关键词搜索
    if (searchKeyword.value.trim()) {
      const keyword = searchKeyword.value.trim().toLowerCase()
      result = result.filter(w => 
        w.name.toLowerCase().includes(keyword) ||
        w.region.toLowerCase().includes(keyword)
      )
    }
    
    return result
  })

  // 方法 - 添加仓储
  const addWarehouse = (warehouse: Omit<Warehouse, 'id'>) => {
    const newWarehouse: Warehouse = {
      ...warehouse,
      id: Date.now().toString()
    }
    warehouses.value.push(newWarehouse)
    return newWarehouse
  }

  // 方法 - 更新仓储
  const updateWarehouse = (id: string, data: Partial<Warehouse>) => {
    const index = warehouses.value.findIndex(w => w.id === id)
    if (index > -1) {
      warehouses.value[index] = { ...warehouses.value[index], ...data }
      return true
    }
    return false
  }

  // 方法 - 删除仓储
  const deleteWarehouse = (id: string) => {
    const index = warehouses.value.findIndex(w => w.id === id)
    if (index > -1) {
      warehouses.value.splice(index, 1)
      return true
    }
    return false
  }

  // 方法 - 获取单个仓储
  const getWarehouseById = (id: string) => {
    return warehouses.value.find(w => w.id === id)
  }

  return {
    // 状态
    warehouses,
    searchKeyword,
    selectedRegion,
    // 计算属性
    regions,
    filteredWarehouses,
    // 方法
    addWarehouse,
    updateWarehouse,
    deleteWarehouse,
    getWarehouseById
  }
}, {
  persist: {
    key: 'snow-warehouse-store',
    storage: localStorage,
    paths: ['warehouses'],
    afterRestore: (ctx) => {
      if (!ctx.store.warehouses || ctx.store.warehouses.length === 0) {
        ctx.store.warehouses = [...mockWarehouses]
      }
    }
  }
})
