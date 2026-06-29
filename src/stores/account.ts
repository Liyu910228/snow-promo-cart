import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'

// 模拟账号数据
const mockAccounts: User[] = [
  {
    id: '1',
    username: 'admin',
    password: 'admin',
    role: 'admin',
    name: '管理员',
    status: 'active',
    createdAt: '2024-01-01'
  },
  {
    id: '2',
    username: 'root',
    password: '12345',
    role: 'user',
    name: '业务员',
    warehouseId: '1',
    status: 'active',
    createdAt: '2024-01-01'
  },
  {
    id: '3',
    username: 'sales01',
    password: '12345',
    role: 'user',
    name: '张三',
    warehouseId: '2',
    status: 'active',
    createdAt: '2024-02-15'
  },
  {
    id: '4',
    username: 'sales02',
    password: '12345',
    role: 'user',
    name: '李四',
    warehouseId: '3',
    status: 'active',
    createdAt: '2024-03-01'
  }
]

export const useAccountStore = defineStore('account', () => {
  // 状态 - 初始化为空数组，persist 插件会自动恢复
  const accounts = ref<User[]>([])
  const searchKeyword = ref('')
  const selectedRole = ref('')
  const selectedStatus = ref('')

  // 计算属性 - 筛选后的账号列表
  const filteredAccounts = computed(() => {
    let result = [...accounts.value]
    
    // 角色筛选
    if (selectedRole.value) {
      result = result.filter(a => a.role === selectedRole.value)
    }

    // 状态筛选
    if (selectedStatus.value) {
      result = result.filter(a => a.status === selectedStatus.value)
    }

    // 关键词搜索
    if (searchKeyword.value.trim()) {
      const keyword = searchKeyword.value.trim().toLowerCase()
      result = result.filter(a => 
        a.username.toLowerCase().includes(keyword) ||
        a.name.toLowerCase().includes(keyword)
      )
    }
    
    return result
  })

  // 计算属性 - 管理员列表
  const admins = computed(() => {
    return accounts.value.filter(a => a.role === 'admin')
  })

  // 计算属性 - 业务员列表
  const sales = computed(() => {
    return accounts.value.filter(a => a.role === 'user')
  })

  // 方法 - 添加账号
  const addAccount = (account: Omit<User, 'id' | 'createdAt'>) => {
    // 检查用户名是否已存在
    if (accounts.value.some(a => a.username === account.username)) {
      return { success: false, message: '用户名已存在' }
    }
    
    const newAccount: User = {
      ...account,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0]
    }
    accounts.value.push(newAccount)
    return { success: true, account: newAccount }
  }

  // 方法 - 更新账号
  const updateAccount = (id: string, data: Partial<User>) => {
    const index = accounts.value.findIndex(a => a.id === id)
    if (index > -1) {
      // 检查用户名是否与其他账号重复
      if (data.username && data.username !== accounts.value[index].username) {
        if (accounts.value.some(a => a.id !== id && a.username === data.username)) {
          return { success: false, message: '用户名已存在' }
        }
      }
      accounts.value[index] = { ...accounts.value[index], ...data }
      return { success: true }
    }
    return { success: false, message: '账号不存在' }
  }

  // 方法 - 删除账号
  const deleteAccount = (id: string) => {
    // 禁止删除主管理员账号
    if (id === '1') {
      return { success: false, message: '禁止删除主管理员账号' }
    }
    
    const index = accounts.value.findIndex(a => a.id === id)
    if (index > -1) {
      accounts.value.splice(index, 1)
      return { success: true }
    }
    return { success: false, message: '账号不存在' }
  }

  // 方法 - 获取单个账号
  const getAccountById = (id: string) => {
    return accounts.value.find(a => a.id === id)
  }

  // 方法 - 重置密码
  const resetPassword = (id: string, newPassword: string) => {
    const index = accounts.value.findIndex(a => a.id === id)
    if (index > -1) {
      accounts.value[index].password = newPassword
      return { success: true }
    }
    return { success: false, message: '账号不存在' }
  }

  return {
    // 状态
    accounts,
    searchKeyword,
    selectedRole,
    selectedStatus,
    // 计算属性
    filteredAccounts,
    admins,
    sales,
    // 方法
    addAccount,
    updateAccount,
    deleteAccount,
    getAccountById,
    resetPassword
  }
}, {
  persist: {
    key: 'snow-account-store',
    storage: localStorage,
    paths: ['accounts'],
    afterRestore: (ctx) => {
      if (!ctx.store.accounts || ctx.store.accounts.length === 0) {
        ctx.store.accounts = [...mockAccounts]
      }
    }
  }
})
