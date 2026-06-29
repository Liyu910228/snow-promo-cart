<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useProductStore } from '@/stores/product'
import { useWarehouseStore } from '@/stores/warehouse'
import { useAccountStore } from '@/stores/account'
import { useOrderStore } from '@/stores/order'
import { useGroupOrderStore } from '@/stores/groupOrder'
import { useAiModelStore } from '@/stores/aiModel'
import { fetchSharedState, saveSharedState, type SharedState } from '@/utils/sharedData'

const authStore = useAuthStore()
const cartStore = useCartStore()
const productStore = useProductStore()
const warehouseStore = useWarehouseStore()
const accountStore = useAccountStore()
const orderStore = useOrderStore()
const groupOrderStore = useGroupOrderStore()
const aiModelStore = useAiModelStore()

let isApplyingSharedState = false
let saveTimer: number | undefined
let refreshTimer: number | undefined
let lastSharedSnapshot = ''

const collectSharedState = (): SharedState => ({
  products: productStore.products,
  warehouses: warehouseStore.warehouses,
  accounts: accountStore.accounts,
  orders: orderStore.orders,
  groupOrders: groupOrderStore.groupOrders,
  aiModels: aiModelStore.models
})

const getStateSnapshot = (state: SharedState) => JSON.stringify(state)

const hasServerData = (state: SharedState) =>
  state.products.length > 0 ||
  state.warehouses.length > 0 ||
  state.accounts.length > 0 ||
  state.orders.length > 0 ||
  state.groupOrders.length > 0 ||
  state.aiModels.length > 0

const applySharedState = (state: SharedState) => {
  isApplyingSharedState = true
  productStore.products = state.products
  warehouseStore.warehouses = state.warehouses
  accountStore.accounts = state.accounts
  orderStore.orders = state.orders
  groupOrderStore.groupOrders = state.groupOrders
  aiModelStore.models = state.aiModels
  lastSharedSnapshot = getStateSnapshot(state)
  window.setTimeout(() => {
    isApplyingSharedState = false
  }, 0)
}

const pushSharedState = async () => {
  const state = collectSharedState()
  lastSharedSnapshot = getStateSnapshot(state)
  await saveSharedState(state)
}

const scheduleSharedSave = () => {
  if (isApplyingSharedState) return
  window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(pushSharedState, 600)
}

const pullSharedState = async () => {
  const state = await fetchSharedState()
  if (!state) return

  if (!hasServerData(state)) {
    await pushSharedState()
    return
  }

  const snapshot = getStateSnapshot(state)
  if (snapshot !== lastSharedSnapshot) {
    applySharedState(state)
  }
}

// 页面加载时，如果已登录则初始化购物车。购物车仍是用户本地私有数据。
onMounted(() => {
  if (authStore.isLoggedIn && authStore.user?.id) {
    cartStore.initCart()
  }

  pullSharedState()
  refreshTimer = window.setInterval(pullSharedState, 8000)
})

onUnmounted(() => {
  window.clearTimeout(saveTimer)
  window.clearInterval(refreshTimer)
})

watch(
  () => collectSharedState(),
  scheduleSharedSave,
  { deep: true }
)
</script>

<style>
#app {
  width: 100%;
  min-height: 100vh;
  background-color: #1C1C1E;
}
</style>
