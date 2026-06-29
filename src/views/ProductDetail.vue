<template>
  <div class="product-detail">
    <!-- 顶部导航 -->
    <header class="detail-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <h1 class="header-title">产品详情</h1>
      <div class="header-right">
        <button class="home-btn" @click="goHome">🏠 首页</button>
      </div>
    </header>

    <!-- 产品信息 -->
    <main class="detail-content">
      <!-- 产品图片 -->
      <div class="product-image">
        <img v-if="product?.imageUrl" :src="product.imageUrl" :alt="product.name" />
        <span v-else class="product-icon">📦</span>
      </div>

      <!-- 基本信息 -->
      <div class="product-info">
        <div class="product-name">{{ product?.name }}</div>
        <div class="product-code">{{ product?.code }}</div>
        <div class="product-price">¥{{ product?.price?.toFixed(2) }}/{{ product?.unit }}</div>
      </div>

      <!-- 详细参数 -->
      <div class="detail-card">
        <div class="detail-row">
          <span class="label">物资类别</span>
          <span class="value">{{ product?.category }}</span>
        </div>
        <div class="detail-row">
          <span class="label">供应商</span>
          <span class="value">{{ product?.supplier }}</span>
        </div>
        <div class="detail-row">
          <span class="label">最小起订量</span>
          <span class="value">{{ product?.minOrderQty }} {{ product?.unit }}</span>
        </div>
        <div class="detail-row">
          <span class="label">最小起送量</span>
          <span class="value">{{ product?.minDeliveryQty }} {{ product?.unit }}</span>
        </div>
        <div class="detail-row">
          <span class="label">货期</span>
          <span class="value">{{ product?.deliveryDays }}</span>
        </div>
        <div class="detail-row">
          <span class="label">合同编码</span>
          <span class="value">{{ product?.contractCode }}</span>
        </div>
        <div class="detail-row">
          <span class="label">价格有效期</span>
          <span class="value">{{ product?.priceValidFrom }} ~ {{ product?.priceValidTo }}</span>
        </div>
      </div>

      <!-- 全局拼单进度 -->
      <div class="progress-card">
        <div class="progress-header">
          <span class="progress-title">拼单进度</span>
          <span class="progress-status" :class="isReady ? 'ready' : 'pending'">
            {{ isReady ? '🟢 可生产' : '🟡 待成团' }}
          </span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressWidth + '%' }"></div>
        </div>
        <div class="progress-info">
          <span>已拼 {{ totalQty }}/{{ product?.minOrderQty }}</span>
          <span v-if="!isReady">还差 {{ remainingOrderQty }} {{ product?.unit }}</span>
        </div>
      </div>

      <!-- 仓储进度 -->
      <div class="progress-card warehouse-progress-card">
        <div class="progress-header">
          <span class="progress-title">仓储进度</span>
          <span class="progress-status" :class="isWarehouseReadyOverall ? 'ready' : 'pending'">
            {{ isWarehouseReadyOverall ? '🟢 可发货' : '🟡 待发货' }}
          </span>
        </div>
        <div class="warehouse-progress-list">
          <div v-for="go in productGroupOrders" :key="go.id" class="warehouse-progress-item">
            <div class="wh-progress-header">
              <span class="wh-name">{{ getWarehouseName(go.warehouseId) }}</span>
              <span class="wh-status" :class="go.currentQty >= (product?.minDeliveryQty || 0) ? 'ready' : 'pending'">
                {{ go.currentQty >= (product?.minDeliveryQty || 0) ? '🟢 可发货' : '🟡 待发货' }}
              </span>
            </div>
            <div class="wh-progress-bar">
              <div class="wh-progress-fill" :style="{ width: getWarehouseProgressWidth(go.warehouseId) + '%' }"></div>
            </div>
            <div class="wh-progress-info">
              <span>{{ go.currentQty }}/{{ product?.minDeliveryQty }}</span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 底部按钮 -->
    <div class="detail-footer">
      <button class="add-more-btn" @click="openWarehouseModal">继续添加</button>
      <button class="cart-btn" @click="goToCart">确定订单</button>
    </div>

    <!-- 仓储选择弹窗 -->
    <div v-if="showWarehouseModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>选择目标仓储</h2>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        
        <div class="modal-body">
          <!-- 仓储列表 -->
          <div class="warehouse-list">
            <!-- 推荐仓储 -->
            <div
              v-if="recommendedWarehouse"
              class="warehouse-item recommended"
              :class="{ selected: selectedWarehouseId === recommendedWarehouse.id }"
              @click="selectWarehouse(recommendedWarehouse.id)"
            >
              <div class="warehouse-header">
                <span class="warehouse-icon">⭐</span>
                <span class="warehouse-name">{{ recommendedWarehouse.name }}</span>
                <span class="recommend-tag">推荐</span>
              </div>
              <div class="warehouse-progress">
                <div class="progress-bar-sm">
                  <div class="progress-fill-sm" :style="{ width: getWarehouseProgress(recommendedWarehouse.id) + '%' }"></div>
                </div>
                <span class="progress-text">
                  {{ getWarehouseQty(recommendedWarehouse.id) }}/{{ product?.minDeliveryQty }}
                </span>
              </div>
              <div class="warehouse-status" :class="isWarehouseReady(recommendedWarehouse.id) ? 'ready' : 'pending'">
                {{ isWarehouseReady(recommendedWarehouse.id) ? '可发货' : `还差 ${getWarehouseRemainingQty(recommendedWarehouse.id)} ${product?.unit}` }}
              </div>
            </div>

            <!-- 其他仓储 -->
            <div
              v-for="wh in otherWarehouses"
              :key="wh.id"
              class="warehouse-item"
              :class="{ selected: selectedWarehouseId === wh.id }"
              @click="selectWarehouse(wh.id)"
            >
              <div class="warehouse-header">
                <span class="warehouse-icon">○</span>
                <span class="warehouse-name">{{ wh.name }}</span>
              </div>
              <div class="warehouse-progress">
                <div class="progress-bar-sm">
                  <div class="progress-fill-sm" :style="{ width: getWarehouseProgress(wh.id) + '%' }"></div>
                </div>
                <span class="progress-text">
                  {{ getWarehouseQty(wh.id) }}/{{ product?.minDeliveryQty }}
                </span>
              </div>
              <div class="warehouse-status" :class="isWarehouseReady(wh.id) ? 'ready' : 'pending'">
                {{ isWarehouseReady(wh.id) ? '可发货' : `还差 ${getWarehouseRemainingQty(wh.id)} ${product?.unit}` }}
              </div>
            </div>

            <!-- 新建拼单 -->
            <div
              class="warehouse-item new-group"
              :class="{ selected: isNewGroup }"
              @click="selectNewGroup"
            >
              <div class="warehouse-header">
                <span class="warehouse-icon">🔄</span>
                <span class="warehouse-name">新建仓储拼单</span>
              </div>
              <div class="warehouse-desc">从配置表选择仓储，发起新拼单</div>
              
              <!-- 新建拼单仓储选择 -->
              <div v-if="isNewGroup" class="new-warehouse-select">
                <select v-model="newWarehouseId" class="form-select">
                  <option value="">请选择仓储</option>
                  <option
                    v-for="wh in availableWarehouses"
                    :key="wh.id"
                    :value="wh.id"
                  >
                    {{ wh.name }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- 数量输入 -->
          <div class="quantity-input">
            <label>下单数量</label>
            <div class="quantity-control">
              <button class="qty-btn" @click="decreaseQty">−</button>
              <input
                v-model.number="quantity"
                type="number"
                min="0"
                class="qty-input"
                placeholder="请输入下单数量"
              />
              <button class="qty-btn" @click="increaseQty">+</button>
            </div>
            <p v-if="quantityError" class="error-text">{{ quantityError }}</p>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="cancel-btn" @click="handleCancel">取消订单</button>
          <button class="confirm-btn" @click="handleAddToCart">加入购物车</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductStore } from '@/stores/product'
import { useWarehouseStore } from '@/stores/warehouse'
import { useCartStore } from '@/stores/cart'
import { useGroupOrderStore } from '@/stores/groupOrder'

const route = useRoute()
const router = useRouter()
const productStore = useProductStore()
const warehouseStore = useWarehouseStore()
const cartStore = useCartStore()
const groupOrderStore = useGroupOrderStore()

// 产品信息
const productId = computed(() => route.params.id as string)
const product = computed(() => productStore.getProductById(productId.value))

// 弹窗状态
const showWarehouseModal = ref(false)
const selectedWarehouseId = ref('')
const isNewGroup = ref(false)
const newWarehouseId = ref('')
const quantity = ref(0)
const quantityError = ref('')

// 仓储列表
const warehouses = computed(() => warehouseStore.warehouses)

// 推荐仓储（已拼量最多的）
const recommendedWarehouse = computed(() => {
  const productWarehouses = groupOrderStore.getProductGroupOrders(productId.value)
  if (productWarehouses.length === 0) return null
  
  // 找到已拼量最多的仓储
  const sorted = [...productWarehouses].sort((a, b) => b.currentQty - a.currentQty)
  const topWarehouseId = sorted[0]?.warehouseId
  return warehouses.value.find(w => w.id === topWarehouseId)
})

// 其他仓储（排除推荐仓储）
const otherWarehouses = computed(() => {
  if (!recommendedWarehouse.value) return warehouses.value
  return warehouses.value.filter(w => w.id !== recommendedWarehouse.value?.id)
})

// 可用仓储（排除已有拼单的）
const availableWarehouses = computed(() => {
  const existingWarehouseIds = groupOrderStore
    .getProductGroupOrders(productId.value)
    .map(go => go.warehouseId)
  return warehouses.value.filter(w => !existingWarehouseIds.includes(w.id))
})

// 全局拼单进度（合并已确认数据 + 我购物车中的数据）
// 已确认数据：所有用户可见（管理员审批通过后的拼单量）
// 购物车数据：仅当前用户可见（未提交/未审批的量，不写入共享store，保证数据隔离）
const cartQtyMap = computed(() => {
  const map = new Map<string, number>()
  cartStore.cartItems
    .filter(item => item.productId === productId.value)
    .forEach(item => {
      const current = map.get(item.warehouseId) || 0
      map.set(item.warehouseId, current + item.quantity)
    })
  return map
})

// 合并后的仓储拼单数据（已确认 + 我购物车中的）
const productGroupOrders = computed(() => {
  const confirmedOrders = groupOrderStore.getProductGroupOrders(productId.value)
  const result = confirmedOrders.map(go => ({
    ...go,
    currentQty: go.currentQty + (cartQtyMap.value.get(go.warehouseId) || 0)
  }))
  // 添加购物车中有但已确认数据中没有的仓储
  cartQtyMap.value.forEach((qty, warehouseId) => {
    const exists = result.find(go => go.warehouseId === warehouseId)
    if (!exists) {
      result.push({
        id: 'cart-' + warehouseId,
        productId: productId.value,
        warehouseId,
        currentQty: qty,
        status: 'pending' as const
      })
    }
  })
  return result
})

const totalQty = computed(() =>
  productGroupOrders.value.reduce((sum, go) => sum + go.currentQty, 0)
)
const progressWidth = computed(() => {
  if (!product.value) return 0
  return Math.min((totalQty.value / product.value.minOrderQty) * 100, 100)
})
const isReady = computed(() => {
  if (!product.value) return false
  return totalQty.value >= product.value.minOrderQty
})

const remainingOrderQty = computed(() => {
  if (!product.value) return 0
  return Math.max(product.value.minOrderQty - totalQty.value, 0)
})

const isWarehouseReadyOverall = computed(() => {
  if (!product.value) return false
  return productGroupOrders.value.some(go => go.currentQty >= product.value!.minDeliveryQty)
})

const getWarehouseName = (warehouseId: string) => {
  const warehouse = warehouseStore.getWarehouseById(warehouseId)
  return warehouse?.name || '未知仓储'
}

const getWarehouseProgressWidth = (warehouseId: string) => {
  if (!product.value) return 0
  const qty = getWarehouseQty(warehouseId)
  return Math.min((qty / product.value.minDeliveryQty) * 100, 100)
}

// 仓储进度（合并已确认 + 购物车）
const getWarehouseQty = (warehouseId: string) => {
  const go = productGroupOrders.value.find(g => g.warehouseId === warehouseId)
  return go?.currentQty || 0
}

const getWarehouseProgress = (warehouseId: string) => {
  if (!product.value) return 0
  const qty = getWarehouseQty(warehouseId)
  return Math.min((qty / product.value.minDeliveryQty) * 100, 100)
}

const isWarehouseReady = (warehouseId: string) => {
  if (!product.value) return false
  return getWarehouseQty(warehouseId) >= product.value.minDeliveryQty
}

const getWarehouseRemainingQty = (warehouseId: string) => {
  if (!product.value) return 0
  return Math.max(product.value.minDeliveryQty - getWarehouseQty(warehouseId), 0)
}

// 选择仓储
const selectWarehouse = (warehouseId: string) => {
  selectedWarehouseId.value = warehouseId
  isNewGroup.value = false
  newWarehouseId.value = ''
}

// 选择新建拼单
const selectNewGroup = () => {
  isNewGroup.value = true
  selectedWarehouseId.value = ''
  newWarehouseId.value = ''
}

// 数量控制
const increaseQty = () => {
  quantity.value++
}

const decreaseQty = () => {
  if (quantity.value > 0) {
    quantity.value--
  }
}

// 取消订单
const handleCancel = () => {
  selectedWarehouseId.value = ''
  isNewGroup.value = false
  newWarehouseId.value = ''
  quantity.value = 0
  quantityError.value = ''
  closeModal()
}

// 加入购物车
const handleAddToCart = () => {
  // 校验
  if (!isNewGroup.value && !selectedWarehouseId.value) {
    alert('请选择仓储')
    return
  }
  
  if (isNewGroup.value && !newWarehouseId.value) {
    alert('请选择要新建拼单的仓储')
    return
  }
  
  if (quantity.value <= 0) {
    quantityError.value = '请输入下单数量'
    return
  }
  
  quantityError.value = ''
  
  const warehouseId = isNewGroup.value ? newWarehouseId.value : selectedWarehouseId.value
  
  // 添加到购物车
  cartStore.addToCart({
    productId: productId.value,
    warehouseId,
    quantity: quantity.value,
    isNewGroup: isNewGroup.value
  })

  // 注意：拼单进度仅在管理员确认订单后更新，其他业务员才能看到

  alert('已加入购物车')
  
  // 重置并关闭
  handleCancel()
}

// 关闭弹窗
const closeModal = () => {
  showWarehouseModal.value = false
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 返回首页
const goHome = () => {
  router.push('/home')
}

// 跳转购物车
const goToCart = () => {
  router.push('/cart')
}

// 打开仓储选择弹窗（每次打开重置选择状态）
const openWarehouseModal = () => {
  selectedWarehouseId.value = ''
  isNewGroup.value = false
  newWarehouseId.value = ''
  quantity.value = 0
  quantityError.value = ''
  showWarehouseModal.value = true
}

// 进入页面自动弹出仓储选择
onMounted(() => {
  showWarehouseModal.value = true
})
</script>

<style scoped>
.product-detail {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #2C2C2E;
}

/* 顶部导航 */
.detail-header {
  height: 56px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #007AFF 0%, #0051D5 100%);
  border-bottom: none;
  flex-shrink: 0;
}

.back-btn {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.header-title {
  color: #FFFFFF;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
}

.home-btn {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.home-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 内容区 */
.detail-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.product-image {
  height: 160px;
  overflow: hidden;
  background: linear-gradient(135deg, #3A3A3C 0%, #48484A 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.product-image img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.product-icon {
  font-size: 60px;
}

.product-info {
  background: #3A3A3C;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}

.product-name {
  color: #FFFFFF;
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
}

.product-code {
  color: #8E8E93;
  font-size: 16px;
  margin-bottom: 10px;
}

.product-price {
  color: #E31837;
  font-size: 28px;
  font-weight: 700;
}

.detail-card {
  background: #3A3A3C;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #48484A;
}

.detail-row:last-child {
  border-bottom: none;
}

.label {
  color: #8E8E93;
  font-size: 16px;
}

.value {
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 500;
}

/* 拼单进度 */
.progress-card {
  background: #3A3A3C;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 80px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 14px;
}

.progress-title {
  color: #FFFFFF;
  font-size: 18px;
  font-weight: 600;
}

.progress-status {
  font-size: 15px;
  font-weight: 500;
}

.progress-status.ready {
  color: #34C759;
}

.progress-status.pending {
  color: #FF9500;
}

.progress-bar {
  height: 8px;
  background: #3A3A3C;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #E31837 0%, #FF4D5A 100%);
  border-radius: 4px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  color: #8E8E93;
  font-size: 15px;
}

/* 仓储进度卡片 */
.warehouse-progress-card {
  margin-bottom: 80px;
}

.warehouse-progress-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.warehouse-progress-item {
  background: #2C2C2E;
  border-radius: 8px;
  padding: 12px;
}

.wh-progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.wh-name {
  color: #FFFFFF;
  font-size: 15px;
  font-weight: 600;
}

.wh-status {
  font-size: 13px;
  font-weight: 500;
}

.wh-status.ready {
  color: #34C759;
}

.wh-status.pending {
  color: #FF9500;
}

.wh-progress-bar {
  height: 6px;
  background: #3A3A3C;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 6px;
}

.wh-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #34C759 0%, #30D158 100%);
  border-radius: 3px;
}

.wh-progress-info {
  color: #8E8E93;
  font-size: 13px;
}

/* 底部按钮 */
.detail-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: #2C2C2E;
  border-top: 1px solid #3A3A3C;
  display: flex;
  gap: 12px;
}

.cart-btn {
  flex: 1;
  height: 48px;
  background: linear-gradient(135deg, #E31837 0%, #FF4D5A 100%);
  border: none;
  border-radius: 12px;
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cart-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(227, 24, 55, 0.3);
}

.add-more-btn {
  flex: 1;
  height: 48px;
  background: #3A3A3C;
  border: 1px solid #48484A;
  border-radius: 12px;
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.add-more-btn:hover {
  background: #48484A;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 100%;
  max-height: 80vh;
  background: #2C2C2E;
  border-radius: 20px 20px 0 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: linear-gradient(135deg, #E31837 0%, #8B0A1E 100%);
  flex-shrink: 0;
}

.modal-header h2 {
  color: #FFFFFF;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 8px;
  color: #FFFFFF;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

/* 仓储列表 */
.warehouse-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.warehouse-item {
  background: #3A3A3C;
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.warehouse-item:hover {
  background: #48484A;
}

.warehouse-item.selected {
  border-color: #E31837;
  background: rgba(227, 24, 55, 0.1);
}

/* 推荐仓储样式与其他仓储保持一致，仅通过推荐标签区分 */

.warehouse-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.warehouse-icon {
  font-size: 16px;
}

.warehouse-name {
  color: #FFFFFF;
  font-size: 17px;
  font-weight: 600;
  flex: 1;
}

.recommend-tag {
  padding: 2px 8px;
  background: #FF9500;
  border-radius: 4px;
  color: #FFFFFF;
  font-size: 11px;
  font-weight: 600;
}

.warehouse-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.progress-bar-sm {
  flex: 1;
  height: 4px;
  background: #2C2C2E;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill-sm {
  height: 100%;
  background: linear-gradient(90deg, #E31837 0%, #FF4D5A 100%);
  border-radius: 2px;
}

.progress-text {
  color: #8E8E93;
  font-size: 12px;
  min-width: 60px;
  text-align: right;
}

.warehouse-status {
  font-size: 12px;
}

.warehouse-status.ready {
  color: #34C759;
}

.warehouse-status.pending {
  color: #8E8E93;
}

.warehouse-desc {
  color: #8E8E93;
  font-size: 12px;
}

.new-warehouse-select {
  margin-top: 10px;
}

.form-select {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  background: #2C2C2E;
  border: 1px solid #48484A;
  border-radius: 8px;
  color: #FFFFFF;
  font-size: 14px;
  outline: none;
}

/* 数量输入 */
.quantity-input {
  margin-bottom: 20px;
}

.quantity-input label {
  display: block;
  color: #8E8E93;
  font-size: 16px;
  margin-bottom: 10px;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.qty-btn {
  width: 44px;
  height: 44px;
  background: #3A3A3C;
  border: 1px solid #48484A;
  border-radius: 8px;
  color: #FFFFFF;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qty-btn:hover {
  background: #48484A;
}

.qty-input {
  width: 80px;
  height: 44px;
  padding: 0 12px;
  background: #2C2C2E;
  border: 1px solid #48484A;
  border-radius: 8px;
  color: #FFFFFF;
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  outline: none;
}

.qty-input:focus {
  border-color: #E31837;
}

.error-text {
  color: #FF3B30;
  font-size: 12px;
  margin-top: 6px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid #3A3A3C;
  flex-shrink: 0;
}

.cancel-btn,
.confirm-btn {
  flex: 1;
  height: 48px;
  border-radius: 12px;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #3A3A3C;
  border: 1px solid #48484A;
  color: #8E8E93;
}

.cancel-btn:hover {
  background: #48484A;
}

.confirm-btn {
  background: linear-gradient(135deg, #E31837 0%, #FF4D5A 100%);
  border: none;
  color: #FFFFFF;
  font-weight: 600;
}

.confirm-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(227, 24, 55, 0.3);
}

/* 业务员端统一浅色工作台风格 */
.product-detail {
  background:
    radial-gradient(circle at 8% 0%, rgba(10, 166, 194, 0.12), transparent 34%),
    #f5f7fb;
  color: #171923;
}

.detail-header {
  min-height: 70px;
  padding: 0 22px;
  background: rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid #e6e9f0;
  backdrop-filter: blur(18px);
}

.header-title {
  color: #171923;
  font-size: 20px;
  font-weight: 900;
}

.back-btn,
.home-btn {
  height: 38px;
  padding: 0 14px;
  border: 1px solid #e6e9f0;
  border-radius: 10px;
  background: #ffffff;
  color: #e31837;
  font-size: 14px;
  font-weight: 800;
}

.detail-content {
  padding: 18px 20px 100px;
}

.product-image,
.product-info,
.detail-card,
.progress-card {
  border: 1px solid #e6e9f0;
  background: #ffffff;
  box-shadow: 0 12px 34px rgba(20, 24, 36, 0.06);
}

.product-image {
  height: 132px;
  background: linear-gradient(135deg, #f8fafc, #eef3f8);
}

.product-icon {
  filter: grayscale(1);
  opacity: 0.72;
}

.product-name,
.value,
.progress-title,
.wh-name,
.warehouse-name,
.quantity-input label,
.modal-header h2 {
  color: #171923;
}

.product-code,
.label,
.progress-info,
.wh-progress-info,
.warehouse-desc,
.progress-text,
.quantity-input label,
.warehouse-status.pending {
  color: #737985;
}

.product-price {
  color: #e31837;
}

.detail-row {
  border-bottom-color: #edf0f5;
}

.progress-bar,
.wh-progress-bar,
.progress-bar-sm {
  background: #edf1f6;
}

.progress-fill,
.progress-fill-sm {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

.wh-progress-fill {
  background: linear-gradient(90deg, #22c55e, #16a34a);
}

.warehouse-progress-item,
.warehouse-item {
  background: #f8fafc;
  border: 1px solid #e6e9f0;
}

.warehouse-item:hover {
  background: #f3f6fa;
}

.warehouse-item.selected {
  background: rgba(227, 24, 55, 0.06);
  border-color: rgba(227, 24, 55, 0.42);
}

.recommend-tag {
  background: rgba(227, 24, 55, 0.1);
  color: #e31837;
}

.form-select,
.qty-input {
  background: #ffffff;
  border-color: #dfe4ec;
  color: #171923;
}

.qty-btn,
.cancel-btn,
.add-more-btn {
  background: #f8fafc;
  border-color: #dfe4ec;
  color: #171923;
}

.detail-footer,
.modal-footer {
  background: rgba(255, 255, 255, 0.94);
  border-top-color: #e6e9f0;
  box-shadow: 0 -12px 34px rgba(20, 24, 36, 0.08);
}

.modal-overlay {
  background: rgba(17, 21, 33, 0.34);
}

.modal-content {
  background: #ffffff;
  box-shadow: 0 -20px 60px rgba(20, 24, 36, 0.2);
}

.modal-header {
  background: #ffffff;
  border-bottom: 1px solid #e6e9f0;
}

.close-btn {
  background: #f1f5f9;
  color: #171923;
}

@media (max-width: 640px) {
  .product-detail {
    min-width: 0;
    overflow-x: hidden;
  }

  .detail-header {
    min-height: 58px;
    padding: 0 12px;
  }

  .header-title {
    font-size: 18px;
  }

  .back-btn,
  .home-btn {
    height: 34px;
    padding: 0 10px;
    font-size: 13px;
  }

  .detail-content {
    padding: 12px 12px calc(108px + env(safe-area-inset-bottom));
  }

  .product-image {
    height: 110px;
    border-radius: 16px;
  }

  .product-info,
  .detail-card,
  .progress-card {
    padding: 16px;
    border-radius: 16px;
  }

  .product-name {
    font-size: 20px;
  }

  .detail-row,
  .progress-header,
  .wh-progress-header,
  .warehouse-header {
    gap: 8px;
    align-items: flex-start;
    flex-direction: column;
  }

  .detail-footer {
    padding: 12px 12px calc(12px + env(safe-area-inset-bottom));
    gap: 10px;
  }

  .modal-content {
    max-height: 88vh;
    border-radius: 20px 20px 0 0;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding-left: 14px;
    padding-right: 14px;
  }

  .modal-footer {
    padding-bottom: calc(14px + env(safe-area-inset-bottom));
  }

  .quantity-controls {
    width: 100%;
  }

  .qty-input {
    flex: 1;
    width: auto;
  }
}

@media (max-width: 420px) {
  .home-btn {
    display: none;
  }

  .detail-footer {
    flex-direction: column;
  }

  .add-more-btn,
  .cart-btn,
  .cancel-btn,
  .confirm-btn {
    width: 100%;
  }
}
</style>
