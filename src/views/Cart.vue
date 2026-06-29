<template>
  <div class="cart-page">
    <!-- 顶部导航 -->
    <header class="cart-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <h1 class="header-title">购物车</h1>
      <button v-if="cartItems.length > 0" class="clear-btn" @click="handleClear">清空</button>
      <div v-else class="header-right"></div>
    </header>

    <!-- 购物车列表 -->
    <main class="cart-content">
      <div v-if="cartItems.length === 0" class="empty-cart">
        <span class="empty-icon">🛒</span>
        <p>购物车是空的</p>
        <button class="shop-btn" @click="goHome">去选购</button>
      </div>

      <div v-else class="cart-list">
        <div v-for="item in cartItemsWithDetails" :key="item.id" class="cart-item">
          <!-- 产品图片 -->
          <div class="item-image">
            <span class="item-icon">📦</span>
          </div>
          
          <!-- 产品信息 -->
          <div class="item-info">
            <div class="item-name">{{ item.productName }}</div>
            <div class="item-code">{{ item.productCode }}</div>
            <div class="item-warehouse">仓储：{{ item.warehouseName }}</div>
            <div class="item-price">¥{{ item.price.toFixed(2) }}</div>
          </div>
          
          <!-- 数量控制 -->
          <div class="item-quantity">
            <button class="qty-btn" @click="decreaseQty(item.id, item.quantity)">−</button>
            <span class="qty-value">{{ item.quantity }}</span>
            <button class="qty-btn" @click="increaseQty(item.id)">+</button>
          </div>
          
          <!-- 小计 -->
          <div class="item-subtotal">
            <span class="subtotal-label">小计</span>
            <span class="subtotal-value">¥{{ (item.price * item.quantity).toFixed(2) }}</span>
          </div>
          
          <!-- 删除按钮 -->
          <button class="delete-btn" @click="handleDelete(item.id)">删除</button>
        </div>
      </div>
    </main>

    <!-- 底部汇总 -->
    <div v-if="cartItems.length > 0" class="cart-footer">
      <div class="remark-section">
        <label class="remark-label" for="order-remark">订单备注</label>
        <textarea
          id="order-remark"
          v-model="remark"
          class="remark-input"
          placeholder="可选，填写订单备注信息"
          rows="2"
        ></textarea>
      </div>
      <div class="summary">
        <div class="summary-row">
          <span>商品数量</span>
          <span>{{ totalQuantity }} 件</span>
        </div>
        <div class="summary-row total">
          <span>合计金额</span>
          <span>¥{{ totalAmount.toFixed(2) }}</span>
        </div>
      </div>
      <button class="submit-btn" @click="handleSubmit">提交订单</button>
    </div>

    <div v-if="showSuccessModal" class="modal-overlay" @click.self="closeSuccessModal">
      <div class="success-modal">
        <div class="success-icon">✓</div>
        <h2>订单提交成功</h2>
        <p class="order-no">订单号：{{ orderNo }}</p>
        <button class="success-btn" @click="closeSuccessModal">确定</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useProductStore } from '@/stores/product'
import { useWarehouseStore } from '@/stores/warehouse'
import { useAuthStore } from '@/stores/auth'
import { useOrderStore } from '@/stores/order'

const router = useRouter()
const cartStore = useCartStore()
const productStore = useProductStore()
const warehouseStore = useWarehouseStore()
const authStore = useAuthStore()
const orderStore = useOrderStore()
const remark = ref('')
const showSuccessModal = ref(false)
const orderNo = ref('')

// 购物车列表
const cartItems = computed(() => cartStore.cartItems)

// 购物车项详情（关联产品和仓储信息）
const cartItemsWithDetails = computed(() => {
  return cartItems.value.map(item => {
    const product = productStore.getProductById(item.productId)
    const warehouse = warehouseStore.getWarehouseById(item.warehouseId)
    return {
      ...item,
      productName: product?.name || '未知产品',
      productCode: product?.code || '',
      price: product?.price || 0,
      warehouseName: warehouse?.name || '未知仓储'
    }
  })
})

// 总数量
const totalQuantity = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.quantity, 0)
})

// 总金额
const totalAmount = computed(() => {
  return cartItemsWithDetails.value.reduce((sum, item) => {
    return sum + item.price * item.quantity
  }, 0)
})

// 减少数量
const decreaseQty = (id: string, currentQty: number) => {
  if (currentQty > 1) {
    cartStore.updateQuantity(id, currentQty - 1)
  } else {
    // 数量为0时删除
    handleDelete(id)
  }
}

// 增加数量
const increaseQty = (id: string) => {
  const item = cartItems.value.find(i => i.id === id)
  if (item) {
    cartStore.updateQuantity(id, item.quantity + 1)
  }
}

// 删除商品
const handleDelete = (id: string) => {
  if (confirm('确定要删除这个商品吗？')) {
    cartStore.removeItem(id)
  }
}

// 清空购物车
const handleClear = () => {
  if (confirm('确定要清空购物车吗？')) {
    cartStore.clearCart()
  }
}

// 提交订单
const handleSubmit = () => {
  if (cartItems.value.length === 0) {
    alert('购物车是空的')
    return
  }

  const now = new Date()
  const orderNoStr = `ORD${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`
  const orderItems = cartItemsWithDetails.value.map(item => ({
    productId: item.productId,
    productName: item.productName,
    productCode: item.productCode,
    warehouseId: item.warehouseId,
    warehouseName: item.warehouseName,
    price: item.price,
    quantity: item.quantity,
    subtotal: item.price * item.quantity
  }))

  orderStore.addOrder({
    orderNo: orderNoStr,
    userId: authStore.user?.id || '',
    userName: authStore.userName,
    items: orderItems,
    totalQuantity: totalQuantity.value,
    totalAmount: totalAmount.value,
    status: 'pending',
    createdAt: now.toLocaleString('zh-CN'),
    remark: remark.value.trim() || undefined
  })

  orderNo.value = orderNoStr
  cartStore.clearCart()
  remark.value = ''
  showSuccessModal.value = true
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 去选购
const goHome = () => {
  router.push('/home')
}

const closeSuccessModal = () => {
  showSuccessModal.value = false
  router.push('/home')
}
</script>

<style scoped>
.cart-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1C1C1E;
}

/* 顶部导航 */
.cart-header {
  height: 56px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #2C2C2E;
  border-bottom: 1px solid #3A3A3C;
  flex-shrink: 0;
}

.back-btn {
  padding: 8px 12px;
  background: transparent;
  border: none;
  color: #E31837;
  font-size: 14px;
  cursor: pointer;
}

.header-title {
  color: #FFFFFF;
  font-size: 17px;
  font-weight: 600;
  margin: 0;
}

.clear-btn {
  padding: 6px 12px;
  background: rgba(255, 59, 48, 0.15);
  border: 1px solid rgba(255, 59, 48, 0.3);
  border-radius: 6px;
  color: #FF3B30;
  font-size: 13px;
  cursor: pointer;
}

.header-right {
  width: 60px;
}

/* 内容区 */
.cart-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

/* 空购物车 */
.empty-cart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.empty-icon {
  font-size: 60px;
  margin-bottom: 16px;
}

.empty-cart p {
  color: #8E8E93;
  font-size: 16px;
  margin-bottom: 24px;
}

.shop-btn {
  padding: 12px 32px;
  background: linear-gradient(135deg, #E31837 0%, #FF4D5A 100%);
  border: none;
  border-radius: 12px;
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

/* 购物车列表 */
.cart-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cart-item {
  background: #2C2C2E;
  border-radius: 12px;
  padding: 16px;
  display: grid;
  grid-template-columns: 60px 1fr auto;
  grid-template-rows: auto auto;
  gap: 12px;
}

.item-image {
  grid-row: span 2;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #3A3A3C 0%, #48484A 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-icon {
  font-size: 28px;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-name {
  color: #FFFFFF;
  font-size: 15px;
  font-weight: 600;
}

.item-code {
  color: #8E8E93;
  font-size: 12px;
}

.item-warehouse {
  color: #8E8E93;
  font-size: 12px;
}

.item-price {
  color: #E31837;
  font-size: 16px;
  font-weight: 700;
}

.item-quantity {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qty-btn {
  width: 32px;
  height: 32px;
  background: #3A3A3C;
  border: 1px solid #48484A;
  border-radius: 6px;
  color: #FFFFFF;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qty-btn:hover {
  background: #48484A;
}

.qty-value {
  min-width: 32px;
  text-align: center;
  color: #FFFFFF;
  font-size: 15px;
  font-weight: 600;
}

.item-subtotal {
  grid-column: 2;
  display: flex;
  align-items: center;
  gap: 8px;
}

.subtotal-label {
  color: #8E8E93;
  font-size: 13px;
}

.subtotal-value {
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 700;
}

.delete-btn {
  grid-column: 3;
  grid-row: span 2;
  align-self: center;
  padding: 8px 16px;
  background: rgba(255, 59, 48, 0.15);
  border: 1px solid rgba(255, 59, 48, 0.3);
  border-radius: 6px;
  color: #FF3B30;
  font-size: 13px;
  cursor: pointer;
}

.delete-btn:hover {
  background: rgba(255, 59, 48, 0.25);
}

/* 底部汇总 */
.cart-footer {
  padding: 16px;
  background: #2C2C2E;
  border-top: 1px solid #3A3A3C;
  flex-shrink: 0;
}

.summary {
  margin-bottom: 16px;
}

.remark-section {
  margin-bottom: 12px;
}

.remark-label {
  display: block;
  color: #8E8E93;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
}

.remark-input {
  width: 100%;
  padding: 10px 12px;
  background: #3A3A3C;
  border: 1px solid #48484A;
  border-radius: 10px;
  color: #FFFFFF;
  font-size: 14px;
  resize: none;
  outline: none;
  font-family: inherit;
}

.remark-input:focus {
  border-color: #E31837;
}

.remark-input::placeholder {
  color: #636366;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  color: #8E8E93;
  font-size: 14px;
}

.summary-row.total {
  color: #FFFFFF;
  font-size: 18px;
  font-weight: 700;
  border-top: 1px solid #3A3A3C;
  padding-top: 12px;
  margin-top: 8px;
}

.submit-btn {
  width: 100%;
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

.submit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(227, 24, 55, 0.3);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(17, 21, 33, 0.38);
  z-index: 1000;
}

.success-modal {
  width: min(90vw, 340px);
  padding: 30px;
  border-radius: 18px;
  background: #ffffff;
  text-align: center;
  box-shadow: 0 24px 80px rgba(20, 24, 36, 0.24);
}

.success-icon {
  width: 54px;
  height: 54px;
  margin: 0 auto 16px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: rgba(22, 163, 74, 0.12);
  color: #16a34a;
  font-size: 30px;
  font-weight: 900;
}

.success-modal h2 {
  margin: 0 0 10px;
  color: #171923;
  font-size: 20px;
}

.order-no {
  margin: 0 0 22px;
  color: #737985;
  font-size: 14px;
}

.success-btn {
  width: 100%;
  height: 44px;
  border: 0;
  border-radius: 12px;
  background: linear-gradient(135deg, #E31837 0%, #FF4D5A 100%);
  color: #ffffff;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
}

/* 业务员端统一浅色工作台风格 */
.cart-page {
  background:
    radial-gradient(circle at 8% 0%, rgba(10, 166, 194, 0.12), transparent 34%),
    #f5f7fb;
  color: #171923;
}

.cart-header {
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

.back-btn {
  height: 38px;
  padding: 0 14px;
  border: 1px solid #e6e9f0;
  border-radius: 10px;
  background: #ffffff;
  color: #e31837;
  font-weight: 800;
}

.clear-btn {
  height: 36px;
  border-radius: 10px;
  background: rgba(220, 38, 38, 0.08);
  color: #dc2626;
  font-weight: 800;
}

.cart-content {
  padding: 18px 20px 188px;
}

.empty-cart p {
  color: #737985;
}

.empty-icon {
  filter: grayscale(1);
  opacity: 0.72;
}

.cart-item,
.summary,
.empty-cart {
  border: 1px solid #e6e9f0;
  background: #ffffff;
  box-shadow: 0 12px 34px rgba(20, 24, 36, 0.06);
}

.empty-cart {
  min-height: 360px;
  border-radius: 18px;
}

.cart-item {
  border-radius: 16px;
}

.item-image {
  background: #f1f5f9;
}

.item-name,
.qty-value,
.subtotal-value,
.summary-row.total {
  color: #171923;
}

.item-code,
.item-warehouse,
.subtotal-label,
.summary-row {
  color: #737985;
}

.item-price,
.subtotal-value,
.summary-row.total span:last-child {
  color: #e31837;
}

.qty-btn {
  background: #f8fafc;
  border-color: #dfe4ec;
  color: #171923;
}

.delete-btn {
  border-radius: 10px;
  background: rgba(220, 38, 38, 0.08);
  color: #dc2626;
}

.cart-footer {
  background: rgba(255, 255, 255, 0.94);
  border-top: 1px solid #e6e9f0;
  box-shadow: 0 -12px 34px rgba(20, 24, 36, 0.08);
}

.remark-label {
  color: #737985;
}

.remark-input {
  background: #f8fafc;
  border-color: #dfe4ec;
  color: #171923;
}

.remark-input::placeholder {
  color: #98a2b3;
}

.summary {
  padding: 12px;
  border-radius: 14px;
  margin-bottom: 12px;
}

.summary-row.total {
  border-top-color: #e6e9f0;
}

@media (max-width: 640px) {
  .cart-page {
    min-width: 0;
    overflow-x: hidden;
  }

  .cart-header {
    min-height: 58px;
    padding: 0 12px;
  }

  .header-title {
    font-size: 18px;
  }

  .back-btn,
  .clear-btn {
    height: 34px;
    padding: 0 10px;
    font-size: 13px;
  }

  .cart-content {
    padding: 14px 12px calc(188px + env(safe-area-inset-bottom));
  }

  .cart-item {
    grid-template-columns: 54px minmax(0, 1fr);
    gap: 10px;
    padding: 12px;
  }

  .item-quantity,
  .delete-btn {
    grid-column: 2;
  }

  .item-subtotal {
    grid-column: 2;
  }

  .item-quantity {
    flex-wrap: wrap;
  }

  .cart-footer {
    padding: 12px 12px calc(12px + env(safe-area-inset-bottom));
  }

  .summary {
    padding: 10px 12px;
  }
}

@media (max-width: 420px) {
  .item-image {
    width: 52px;
    height: 52px;
  }

  .item-name {
    font-size: 15px;
  }

  .qty-btn {
    width: 30px;
    height: 30px;
  }

  .quantity {
    min-width: 28px;
  }

  .success-modal {
    width: calc(100vw - 28px);
    padding: 24px 18px;
  }
}
</style>
