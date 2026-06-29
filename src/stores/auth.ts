import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAccountStore } from '@/stores/account'
import { useCartStore } from '@/stores/cart'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<any>(null)
  const token = ref<string>('')
  
  // 计算属性
  const isLoggedIn = computed(() => !!token.value)
  const userRole = computed(() => user.value?.role || '')
  const userName = computed(() => user.value?.name || '')
  
  // 登录方法 — 从 accountStore 查找账号
  const login = (username: string, password: string): { success: boolean; message: string } => {
    const accountStore = useAccountStore()
    const account = accountStore.accounts.find(
      a => a.username === username && a.password === password
    )
    
    if (!account) {
      return { success: false, message: '账号或密码错误' }
    }
    
    if (account.status === 'disabled') {
      return { success: false, message: '账号已被禁用，请联系管理员' }
    }
    
    user.value = {
      id: account.id,
      username: account.username,
      name: account.name,
      role: account.role,
      warehouseId: account.warehouseId
    }
    token.value = `${account.role}-token-${Date.now()}`

    // 登录成功后初始化该用户的购物车
    const cartStore = useCartStore()
    cartStore.initCart()

    return { success: true, message: '登录成功' }
  }
  
  // 登出方法
  const logout = () => {
    // 登出前清空购物车内存数据（不删除 localStorage 中的数据，下次登录可恢复）
    const cartStore = useCartStore()
    cartStore.clearCartOnLogout()

    user.value = null
    token.value = ''
  }
  
  return {
    user,
    token,
    isLoggedIn,
    userRole,
    userName,
    login,
    logout
  }
}, {
  persist: {
    key: 'snow-auth-store',
    storage: localStorage,
    paths: ['user', 'token']
  }
})
