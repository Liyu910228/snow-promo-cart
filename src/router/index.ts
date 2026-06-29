import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '促销品列表', requiresAuth: true, role: 'user' }
  },
  {
    path: '/product/:id',
    name: 'ProductDetail',
    component: () => import('@/views/ProductDetail.vue'),
    meta: { title: '产品详情', requiresAuth: true }
  },
  {
    path: '/cart',
    name: 'Cart',
    component: () => import('@/views/Cart.vue'),
    meta: { title: '购物车', requiresAuth: true }
  },
  {
    path: '/order/confirm',
    redirect: '/cart'
  },
  {
    path: '/admin',
    component: () => import('@/views/admin/AdminLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: '',
        redirect: '/admin/products'
      },
      {
        path: 'products',
        name: 'AdminProducts',
        component: () => import('@/views/admin/AdminProducts.vue'),
        meta: { title: '促销品管理' }
      },
      {
        path: 'warehouses',
        name: 'AdminWarehouses',
        component: () => import('@/views/admin/AdminWarehouses.vue'),
        meta: { title: '仓储管理' }
      },
      {
        path: 'accounts',
        name: 'AdminAccounts',
        component: () => import('@/views/admin/AdminAccounts.vue'),
        meta: { title: '账号管理' }
      },
      {
        path: 'orders',
        name: 'AdminOrders',
        component: () => import('@/views/admin/AdminOrders.vue'),
        meta: { title: '需求单管理' }
      },
      {
        path: 'models',
        name: 'AdminModels',
        component: () => import('@/views/admin/AdminModels.vue'),
        meta: { title: '模型管理' }
      },
      {
        path: 'skills',
        name: 'AdminSkills',
        component: () => import('@/views/admin/AdminSkills.vue'),
        meta: { title: 'Skill 管理' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 雪花促销品系统`
  }
  
  // 未登录跳转登录页
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return next('/')
  }
  
  // 角色权限校验（检查自身及父路由的 role）
  const requiredRole = to.meta.role || to.matched.find(r => r.meta.role)?.meta.role
  if (requiredRole && authStore.userRole !== requiredRole) {
    if (authStore.userRole === 'admin') {
      return next('/admin/products')
    }
    return next('/home')
  }
  
  next()
})

export default router
