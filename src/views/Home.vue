<template>
  <div class="home-page">
    <header class="home-header">
      <div class="header-left">
        <div class="logo-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32">
            <path d="M16 2l2.5 6 6.5-2-4 6 7 2-7 2 4 6-6.5-2-2.5 8-2.5-8-6.5 2 4-6-7-2 7-2-4-6 6.5 2L16 2Z" />
          </svg>
        </div>
        <div>
          <p class="header-kicker">Promotion Cart</p>
          <h1>雪花促销品</h1>
        </div>
      </div>
      <div class="header-right">
        <div class="user-chip">
          <span>{{ userName || '业务员' }}</span>
          <small>业务员</small>
        </div>
        <button class="logout-btn" type="button" @click="handleLogout">退出</button>
      </div>
    </header>

    <template v-if="currentTab === 'products'">
      <main class="ai-workspace" :class="{ 'intent-open': isIntentPanelOpen }">
        <button
          v-if="!isIntentPanelOpen"
          class="intent-toggle"
          type="button"
          title="展开所有用户意向单"
          @click="isIntentPanelOpen = true"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="4" y="5" width="7" height="14" rx="1.5" />
            <rect x="13" y="5" width="7" height="14" rx="1.5" />
          </svg>
          <span>所有用户意向单</span>
        </button>
        <section class="ai-panel">
          <div class="ai-panel-header">
            <div class="ai-title-group">
              <p class="hero-kicker">AI Demand Assistant</p>
              <div class="ai-title-line">
                <h2>告诉我你的活动需求，我来推荐促销品</h2>
                <button class="new-chat-action" type="button" @click="handleNewChat">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                  <span>New chat</span>
                </button>
                <button class="cart-action" type="button" @click="goToCart">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 6h15l-2 9H8L6 6Z" />
                    <path d="M6 6 5 2H2" />
                    <circle cx="9" cy="20" r="1.5" />
                    <circle cx="18" cy="20" r="1.5" />
                  </svg>
                  <span>需求单</span>
                  <strong v-if="cartCount > 0">{{ cartCount }}</strong>
                </button>
              </div>
            </div>
          </div>

          <div class="chat-thread">
            <div
              v-for="message in chatMessages"
              :key="message.id"
              class="chat-message"
              :class="message.role"
            >
              <div class="message-avatar">{{ message.role === 'assistant' ? 'AI' : '我' }}</div>
              <div class="message-bubble">{{ message.content }}</div>
            </div>

            <div v-if="recommendedProducts.length > 0" class="chat-recommendations">
              <div class="chat-recommendations-header">
                <div>
                  <p class="section-kicker">Top 5</p>
                  <h3 class="section-title">AI 推荐促销品</h3>
                </div>
                <span class="recommend-count">{{ recommendedProducts.length }} 个选择</span>
              </div>

              <div class="product-grid ai-card-grid">
                <article
                  v-for="product in recommendedProducts"
                  :key="product.id"
                  class="product-card ai-product-card"
                  @click="openDemandModal(product, $event)"
                >
                  <div class="product-top">
                    <div v-if="product.imageUrl" class="product-photo">
                      <img :src="product.imageUrl" :alt="product.name" />
                    </div>
                    <div v-else class="product-icon" aria-hidden="true">
                      <svg viewBox="0 0 48 48">
                        <rect x="9" y="13" width="30" height="27" rx="5" />
                        <path d="M17 9v4M31 9v4" />
                        <path d="M15 23h7M26 23h7M15 30h18" />
                      </svg>
                    </div>
                    <div class="product-main">
                      <div class="product-name">{{ product.name }}</div>
                      <div class="product-code">{{ product.code }}</div>
                    </div>
                    <div class="product-price">¥{{ product.price.toFixed(2) }}</div>
                  </div>

                  <div class="product-tags">
                    <span>{{ product.category }}</span>
                    <span>{{ product.deliveryDays }}</span>
                    <span>{{ product.unit }}</span>
                  </div>

                  <div class="progress-block">
                    <div class="progress-label">
                      <span>拼单进度</span>
                      <strong>{{ getRecommendedTotalQty(product) }}/{{ product.minOrderQty }}</strong>
                    </div>
                    <div class="progress-bar">
                      <div
                        class="progress-fill"
                        :class="isRecommendedReady(product) ? 'ready' : 'pending'"
                        :style="{ width: getRecommendedProgressWidth(product) + '%' }"
                      ></div>
                    </div>
                    <div class="progress-status" :class="isRecommendedReady(product) ? 'ready' : 'pending'">
                      {{ isRecommendedReady(product) ? '已达到生产量' : '继续拼单中' }}
                    </div>
                  </div>

                  <div v-if="getRecommendedWarehouses(product).length > 0" class="warehouse-progress">
                    <div class="warehouse-title">仓储进度</div>
                    <div v-for="wh in getRecommendedWarehouses(product)" :key="wh.warehouseId" class="wh-item">
                      <div class="wh-name-row">
                        <span class="wh-name">{{ wh.warehouseName }}</span>
                        <span class="wh-status" :class="wh.isReady ? 'ready' : 'pending'">
                          {{ wh.isReady ? '可发货' : '待发货' }}
                        </span>
                      </div>
                      <div class="wh-bar">
                        <div class="wh-fill" :class="wh.isReady ? 'ready' : 'pending'" :style="{ width: wh.progress + '%' }"></div>
                      </div>
                      <div class="wh-qty">{{ wh.currentQty }}/{{ product.minDeliveryQty }}</div>
                    </div>
                  </div>

                  <div class="product-footer">
                    <span>MOQ {{ product.minOrderQty }}</span>
                    <span>MSQ {{ product.minDeliveryQty }}</span>
                    <strong>选择</strong>
                  </div>
                </article>
              </div>
            </div>

            <div v-else-if="activeQuery" class="chat-empty-recommendation">
              暂无可推荐的促销品，请补充促销品编码、名称或类别。
            </div>
          </div>

          <form class="chat-composer" @submit.prevent="handleChatSubmit">
            <input
              v-model="chatInput"
              type="text"
              placeholder="例如：喜力F1活动能用哪些促销品？"
            />
            <button type="submit">生成推荐</button>
          </form>
          <p v-if="isAiLoading" class="ai-loading">正在调用模型生成推荐...</p>
        </section>

        <section v-if="isIntentPanelOpen" class="recommend-panel intent-panel">
          <div class="section-header">
            <div>
              <p class="section-kicker">{{ currentMonthLabel }}</p>
              <h3 class="section-title">所有用户意向单</h3>
            </div>
            <div class="intent-header-actions">
              <span class="recommend-count">{{ monthlyProgressProducts.length }} 个拼单</span>
              <button class="intent-collapse-btn" type="button" title="收起所有用户意向单" @click="isIntentPanelOpen = false">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="4" y="5" width="7" height="14" rx="1.5" />
                  <path d="M16 8l-3 4 3 4" />
                </svg>
              </button>
            </div>
          </div>

          <div v-if="monthlyProgressProducts.length > 0" class="product-grid ai-card-grid">
            <article
              v-for="progress in monthlyProgressProducts"
              :key="progress.product.id"
              class="product-card ai-product-card intent-card"
              role="button"
              tabindex="0"
              @click="openDemandModal(progress.product, $event)"
              @keydown.enter.prevent="openDemandModal(progress.product, $event)"
              @keydown.space.prevent="openDemandModal(progress.product, $event)"
            >
              <div class="product-top">
                <div v-if="progress.product.imageUrl" class="product-photo">
                  <img :src="progress.product.imageUrl" :alt="progress.product.name" />
                </div>
                <div v-else class="product-icon" aria-hidden="true">
                  <svg viewBox="0 0 48 48">
                    <rect x="9" y="13" width="30" height="27" rx="5" />
                    <path d="M17 9v4M31 9v4" />
                    <path d="M15 23h7M26 23h7M15 30h18" />
                  </svg>
                </div>
                <div class="product-main">
                  <div class="product-name">{{ progress.product.name }}</div>
                  <div class="product-code">{{ progress.product.code }}</div>
                </div>
                <div class="product-price">¥{{ progress.product.price.toFixed(2) }}</div>
              </div>

              <div class="product-tags">
                <span>{{ progress.product.category }}</span>
                <span>{{ progress.product.deliveryDays }}</span>
                <span>{{ progress.product.unit }}</span>
              </div>

              <div class="progress-block">
                <div class="progress-label">
                  <span>拼单进度</span>
                  <strong>{{ progress.totalQty }}/{{ progress.product.minOrderQty }}</strong>
                </div>
                <div class="progress-bar">
                  <div
                    class="progress-fill"
                    :class="isMonthlyReady(progress) ? 'ready' : 'pending'"
                    :style="{ width: getMonthlyProgressWidth(progress) + '%' }"
                  ></div>
                </div>
                <div class="progress-status" :class="isMonthlyReady(progress) ? 'ready' : 'pending'">
                  {{ isMonthlyReady(progress) ? '已达到生产量' : '继续拼单中' }}
                </div>
              </div>

              <div v-if="getMonthlyProductWarehouses(progress).length > 0" class="warehouse-progress">
                <div class="warehouse-title">仓储进度</div>
                <div v-for="wh in getMonthlyProductWarehouses(progress)" :key="wh.warehouseId" class="wh-item">
                  <div class="wh-name-row">
                    <span class="wh-name">{{ wh.warehouseName }}</span>
                    <span class="wh-status" :class="wh.isReady ? 'ready' : 'pending'">
                      {{ wh.isReady ? '可发货' : '待发货' }}
                    </span>
                  </div>
                  <div class="wh-bar">
                    <div class="wh-fill" :class="wh.isReady ? 'ready' : 'pending'" :style="{ width: wh.progress + '%' }"></div>
                  </div>
                  <div class="wh-qty">{{ wh.currentQty }}/{{ progress.product.minDeliveryQty }}</div>
                </div>
              </div>

              <div class="product-footer">
                <span>MOQ {{ progress.product.minOrderQty }}</span>
                <span>MSQ {{ progress.product.minDeliveryQty }}</span>
                <strong>选择</strong>
              </div>
            </article>
          </div>

          <div v-else class="empty-state">
            <svg viewBox="0 0 64 64" aria-hidden="true">
              <rect x="12" y="16" width="40" height="36" rx="5" />
              <path d="M24 12v4M40 12v4M22 30h20M22 38h12" />
            </svg>
            <p>本月暂无拼单进度</p>
          </div>
        </section>
      </main>
    </template>

    <template v-if="currentTab === 'me'">
      <main class="me-content">
        <section class="me-header">
          <div class="me-avatar" aria-hidden="true">{{ (userName || '业').slice(0, 1).toUpperCase() }}</div>
          <div class="me-info">
            <p>业务员中心</p>
            <h2>{{ userName || '业务员' }}</h2>
          </div>
        </section>

        <section class="me-orders">
          <div class="section-header">
            <div>
              <p class="section-kicker">Order Tracking</p>
              <h3 class="section-title">我的订单</h3>
            </div>
            <button class="refresh-btn" type="button" @click="orderStore.refreshFromStorage()">
              <svg viewBox="0 0 14 14" aria-hidden="true">
                <path d="M12 7a5 5 0 1 1-1.1-3.1" />
                <path d="M12 2v3H9" />
              </svg>
              刷新
            </button>
          </div>

          <div v-if="myOrders.length === 0" class="empty-orders">
            <svg class="empty-icon" viewBox="0 0 48 48" aria-hidden="true">
              <rect x="8" y="8" width="32" height="32" rx="5" />
              <path d="M16 20h16M16 28h9" />
            </svg>
            <p>暂无订单记录</p>
          </div>

          <article v-for="order in paginatedMyOrders" :key="order.id" class="my-order-card" @click="toggleOrderDetail(order.id)">
            <div class="order-header">
              <span class="order-no">{{ order.orderNo }}</span>
              <span class="order-status" :class="order.status">{{ getOrderStatusText(order.status) }}</span>
            </div>
            <div class="order-meta">
              <span>{{ order.createdAt }}</span>
              <span>{{ order.items.length }}种商品 · {{ order.totalQuantity }}件</span>
            </div>
            <div class="order-amount">¥{{ order.totalAmount.toFixed(2) }}</div>
            <div v-if="order.status === 'rejected' && order.rejectReason" class="reject-reason">
              <span class="reject-label">拒绝原因：</span>
              <span>{{ order.rejectReason }}</span>
            </div>
            <div v-if="expandedOrderId === order.id" class="order-detail">
              <div v-for="item in order.items" :key="item.productId + item.warehouseId" class="detail-item">
                <span class="detail-name">{{ item.productName }}</span>
                <span class="detail-warehouse">{{ item.warehouseName }}</span>
                <span class="detail-qty">×{{ item.quantity }}</span>
                <span class="detail-subtotal">¥{{ item.subtotal.toFixed(2) }}</span>
              </div>
              <div v-if="order.remark" class="detail-remark">备注：{{ order.remark }}</div>
            </div>
          </article>

          <div v-if="myOrders.length > 0" class="orders-pagination">
            <div class="pagination-summary">
              共 {{ myOrders.length }} 条，第 {{ myOrderPage }} / {{ myOrderTotalPages }} 页
            </div>
            <div class="pagination-controls">
              <select v-model.number="myOrderPageSize" class="page-size-select">
                <option :value="10">10 条/页</option>
                <option :value="20">20 条/页</option>
                <option :value="50">50 条/页</option>
                <option :value="100">100 条/页</option>
              </select>
              <button type="button" :disabled="myOrderPage <= 1" @click="myOrderPage--">上一页</button>
              <button type="button" :disabled="myOrderPage >= myOrderTotalPages" @click="myOrderPage++">下一页</button>
            </div>
          </div>
        </section>
      </main>
    </template>

    <nav class="home-tabbar">
      <button class="tab-item" type="button" :class="{ active: currentTab === 'products' }" @click="currentTab = 'products'">
        <svg class="tab-icon" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="3" width="8" height="8" rx="2" />
          <rect x="13" y="3" width="8" height="8" rx="2" />
          <rect x="3" y="13" width="8" height="8" rx="2" />
          <rect x="13" y="13" width="8" height="8" rx="2" />
        </svg>
        <span class="tab-label">AI选品</span>
      </button>
      <button class="tab-item" type="button" :class="{ active: currentTab === 'cart' }" @click="goToCart">
        <svg class="tab-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6h15l-2 9H8L6 6Z" />
          <path d="M6 6 5 2H2" />
          <circle cx="9" cy="20" r="1.5" />
          <circle cx="18" cy="20" r="1.5" />
        </svg>
        <span class="tab-label">购物车</span>
        <span v-if="cartCount > 0" class="tab-badge">{{ cartCount }}</span>
      </button>
      <button class="tab-item" type="button" :class="{ active: currentTab === 'me' }" @click="switchToMe">
        <svg class="tab-icon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
        </svg>
        <span class="tab-label">我的</span>
      </button>
    </nav>

    <div v-if="showDemandModal" class="modal-overlay" @click.self="closeDemandModal">
      <div class="demand-modal" :style="demandModalStyle">
        <div class="demand-modal-header">
          <div>
            <p class="section-kicker">Warehouse</p>
            <h2>选择仓储与下单量</h2>
          </div>
          <button class="modal-close-btn" type="button" @click="closeDemandModal">×</button>
        </div>

        <div v-if="selectedProduct" class="demand-modal-body">
          <div class="selected-product">
            <div v-if="selectedProduct.imageUrl" class="selected-product-image">
              <img :src="selectedProduct.imageUrl" :alt="selectedProduct.name" />
            </div>
            <div class="selected-product-info">
              <strong>{{ selectedProduct.name }}</strong>
              <span>{{ selectedProduct.code }} · {{ selectedProduct.category }}</span>
              <small>MOQ {{ selectedProduct.minOrderQty }} / MSQ {{ selectedProduct.minDeliveryQty }}</small>
            </div>
          </div>

          <div class="warehouse-options">
            <button
              type="button"
              class="warehouse-option"
              :class="{ active: warehouseChoice === 'default' }"
              @click="warehouseChoice = 'default'"
            >
              <span>默认仓储</span>
              <strong>{{ defaultWarehouse?.name || '未配置' }}</strong>
            </button>
            <button
              type="button"
              class="warehouse-option"
              :class="{ active: warehouseChoice === 'recommended' }"
              @click="warehouseChoice = 'recommended'"
            >
              <span>推荐仓储</span>
              <strong>{{ recommendedWarehouse?.name || '暂无推荐' }}</strong>
            </button>
            <button
              type="button"
              class="warehouse-option"
              :class="{ active: warehouseChoice === 'manual' }"
              @click="warehouseChoice = 'manual'"
            >
              <span>手动选择仓储</span>
              <strong>{{ manualWarehouseName || '从列表选择' }}</strong>
            </button>
          </div>

          <select v-if="warehouseChoice === 'manual'" v-model="manualWarehouseId" class="manual-warehouse-select">
            <option value="">请选择仓储</option>
            <option v-for="warehouse in warehouseStore.warehouses" :key="warehouse.id" :value="warehouse.id">
              {{ warehouse.name }} · {{ warehouse.region }}
            </option>
          </select>

          <label class="quantity-field">
            <span>下单量</span>
            <input v-model.number="demandQuantity" type="number" min="1" placeholder="请输入数量" />
          </label>
          <p v-if="demandError" class="demand-error">{{ demandError }}</p>
        </div>

        <div class="demand-modal-footer">
          <button type="button" class="secondary-btn" @click="closeDemandModal">取消</button>
          <button type="button" class="primary-btn" @click="handleAddDemand">加入需求单</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProductStore } from '@/stores/product'
import { useWarehouseStore } from '@/stores/warehouse'
import { useCartStore } from '@/stores/cart'
import { useGroupOrderStore } from '@/stores/groupOrder'
import { useOrderStore } from '@/stores/order'
import { useAiModelStore } from '@/stores/aiModel'
import type { Product } from '@/types'

interface ChatMessage {
  id: string
  role: 'assistant' | 'user'
  content: string
}

interface MonthlyProductProgress {
  product: Product
  totalQty: number
  warehouseQtyMap: Map<string, number>
}

interface DemandIntent {
  raw: string
  normalized: string
  significantText: string
  maxDeliveryDays?: number
  maxMinOrderQty?: number
  quantity?: number
  isQuantityCheck: boolean
  isExactLookup: boolean
  hasSupplierConstraint: boolean
}

const router = useRouter()
const authStore = useAuthStore()
const productStore = useProductStore()
const warehouseStore = useWarehouseStore()
const cartStore = useCartStore()
const groupOrderStore = useGroupOrderStore()
const orderStore = useOrderStore()
const aiModelStore = useAiModelStore()

const userName = computed(() => authStore.userName)
const currentTab = ref('products')
const isIntentPanelOpen = ref(false)
const chatInput = ref('')
const activeQuery = ref('')
const isAiLoading = ref(false)
const modelRecommendedIds = ref<string[]>([])
const demandContext = ref<string[]>([])
const createWelcomeMessage = (): ChatMessage => ({
  id: `welcome-${Date.now()}`,
  role: 'assistant',
  content: '你好，我是促销品需求助手。你可以告诉我商品编码、名称、类别或者其他信息，我会先给你 5 个推荐卡片。'
})
const chatMessages = ref<ChatMessage[]>([createWelcomeMessage()])

const cartCount = computed(() => cartStore.totalItems)

const normalizeDemandText = (text: string) => text
  .trim()
  .toLowerCase()
  .replace(/\s+/g, '')

const parseNumberBefore = (text: string, patterns: RegExp[]) => {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) return Number(match[1])
  }
  return undefined
}

const parseDeliveryDays = (value: string) => {
  const match = String(value || '').match(/\d+/)
  return match ? Number(match[0]) : Number.POSITIVE_INFINITY
}

const getDemandIntent = (text: string): DemandIntent => {
  const normalized = normalizeDemandText(text)
  const maxDeliveryDays = parseNumberBefore(normalized, [
    /(\d+)天.*?(?:到货|货期|能到)/,
    /(?:货期|到货).*?(\d+)天/
  ])
  const maxMinOrderQty = parseNumberBefore(normalized, [
    /最小起订量.*?(?:低于|小于等于|不超过|以下|<=|≤)(\d+)/,
    /(?:低于|小于等于|不超过|以下|<=|≤)(\d+).*?最小起订量/
  ])
  const quantity = parseNumberBefore(normalized, [
    /(?:订|要|采购|下单)(\d+)(?:件|个|把|台|套|箱)?/,
    /(\d+)(?:件|个|把|台|套|箱).*?(?:够起订量|起订量|够不够)/
  ])
  const hasSupplierConstraint = /供应商|供货商|厂家|厂商|生产商|指定供应|指定厂家|特定供应|特定厂家|供应商是|厂家是/.test(normalized)
  const significantText = normalized
    .replace(/\d+天.*?(?:到货|货期|能到)/g, '')
    .replace(/(?:订|要|采购|下单)\d+(?:件|个|把|台|套|箱)?/g, '')
    .replace(/最小起订量.*?(?:低于|小于等于|不超过|以下|<=|≤)\d+/g, '')
    .replace(/(?:喜力|雪花|黑狮|f1|396l)/g, match => ` ${match} `)
    .replace(/有哪些|哪些|有没有|有无|是否有|能用|可以用|促销品|活动|商品|物资|请问|帮我|推荐|我想|想|的|吗|？|\?/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return {
    raw: text,
    normalized,
    significantText,
    maxDeliveryDays,
    maxMinOrderQty,
    quantity,
    isQuantityCheck: /够起订量|起订量|够不够/.test(normalized) && Boolean(quantity),
    isExactLookup: /有没有|有无|是否有|找.*有没有/.test(normalized),
    hasSupplierConstraint
  }
}

const getDemandTokens = (intent: DemandIntent) => {
  const tokens = new Set<string>()
  const source = intent.significantText || intent.normalized

  source
    .split(/\s+|，|,|。|；|;|、/)
    .map(item => item.trim())
    .filter(Boolean)
    .forEach(item => tokens.add(item))

  const compact = source.replace(/\s+/g, '')
  for (let size = Math.min(6, compact.length); size >= 2; size--) {
    for (let i = 0; i <= compact.length - size; i++) {
      tokens.add(compact.slice(i, i + size))
    }
  }
  if (compact.length === 1) tokens.add(compact)

  return [...tokens].filter(token => token.length > 0)
}

const rankProductsForDemand = (text: string) => {
  const intent = getDemandIntent(text)
  const tokens = getDemandTokens(intent)

  return [...productStore.products]
    .filter(product => {
      if (intent.maxDeliveryDays !== undefined && parseDeliveryDays(product.deliveryDays) > intent.maxDeliveryDays) {
        return false
      }
      if (intent.maxMinOrderQty !== undefined && product.minOrderQty > intent.maxMinOrderQty) {
        return false
      }
      return true
    })
    .map(product => {
      const supplierText = intent.hasSupplierConstraint ? product.supplier : ''
      const haystack = [
        product.name,
        product.code,
        product.category,
        supplierText,
        product.deliveryDays,
        product.contractCode,
        product.priceValidFrom,
        product.priceValidTo,
        String(product.price),
        String(product.minOrderQty),
        String(product.minDeliveryQty)
      ].join(' ').toLowerCase().replace(/\s+/g, '')
      const identityText = [product.code, product.name, product.category].join(' ').toLowerCase()
      const assistText = [
        supplierText,
        product.deliveryDays,
        product.priceValidFrom,
        product.priceValidTo,
        String(product.price),
        String(product.minOrderQty),
        String(product.minDeliveryQty)
      ].join(' ').toLowerCase()
      const score = tokens.reduce((sum, token) => {
        const normalizedToken = token.replace(/\s+/g, '')
        if (!normalizedToken) return sum
        if (identityText.replace(/\s+/g, '').includes(normalizedToken)) return sum + Math.max(4, normalizedToken.length * 2)
        if (assistText.replace(/\s+/g, '').includes(normalizedToken)) return sum + Math.max(1.5, normalizedToken.length)
        return sum + (haystack.includes(normalizedToken) ? 1 : 0)
      }, 0)
      const fuzzySource = intent.significantText.replace(/\s+/g, '') || intent.normalized
      const fuzzyScore = [...fuzzySource].reduce((sum, char) => sum + (haystack.includes(char) ? 0.18 : 0), 0)
      const filterScore = (intent.maxDeliveryDays !== undefined || intent.maxMinOrderQty !== undefined) ? 1 : 0
      return { product, score: score + fuzzyScore + filterScore }
    })
    .filter(item => item.score > 0 || intent.maxDeliveryDays !== undefined || intent.maxMinOrderQty !== undefined)
    .sort((a, b) => b.score - a.score || a.product.price - b.product.price)
}

const localRecommendedProducts = computed(() => {
  const keyword = activeQuery.value.trim()

  if (!keyword) {
    return []
  }

  return rankProductsForDemand(keyword)
    .slice(0, 5)
    .map(item => item.product)
})

const recommendedProducts = computed(() => {
  if (modelRecommendedIds.value.length === 0) return localRecommendedProducts.value

  const matched = modelRecommendedIds.value
    .map(id => productStore.products.find(product => product.id === id || product.code === id))
    .filter((product): product is Product => Boolean(product))

  return matched.length > 0 ? matched.slice(0, 5) : localRecommendedProducts.value
})

const getProductsByRecommendationIds = (ids: string[]) => ids
  .map(id => productStore.products.find(product => product.id === id || product.code === id))
  .filter((product): product is Product => Boolean(product))
  .slice(0, 5)

const isProductValidInCurrentYear = (product: Product) => {
  const year = new Date().getFullYear()
  const fromYear = product.priceValidFrom ? new Date(product.priceValidFrom).getFullYear() : year
  const toYear = product.priceValidTo ? new Date(product.priceValidTo).getFullYear() : year
  return fromYear <= year && toYear >= year
}

const formatProductNames = (products: Product[]) => products
  .slice(0, 5)
  .map(product => product.name)
  .join('、')

const getExactLookupTarget = (text: string) => text
  .replace(/有没有|有无|是否有|请问|帮我|找一下|找|哪些|促销品|商品|物资|？|\?/g, '')
  .replace(/\s+/g, '')
  .trim()

const buildRecommendationMessage = (text: string, products: Product[], sourceLabel: string) => {
  const intent = getDemandIntent(text)
  const currentYear = new Date().getFullYear()
  const validProducts = products.filter(isProductValidInCurrentYear)
  const displayProducts = validProducts.length > 0 ? validProducts : products
  const count = displayProducts.length

  if (count === 0) {
    return '暂时没有找到完全匹配的促销品。你可以换一个品牌、品类、货期或起订量条件，我再帮你筛选。'
  }

  if (intent.isQuantityCheck && intent.quantity) {
    const product = displayProducts[0]
    const enough = intent.quantity >= product.minOrderQty
    return `找到「${product.name}」。它的最小起订量是 ${product.minOrderQty}${product.unit || '件'}，你想订 ${intent.quantity}${product.unit || '件'}，${enough ? '已达到起订量，可以继续选择仓储下单。' : `还差 ${product.minOrderQty - intent.quantity}${product.unit || '件'} 才够起订量。`}`
  }

  if (intent.isExactLookup) {
    const target = getExactLookupTarget(text) || displayProducts[0].name
    return `找到「${target}」。为你匹配相关「${displayProducts[0].name}」，我已把匹配的促销品卡片列出来，你可以选择卡片继续确认仓储和下单量。`
  }

  if (intent.maxMinOrderQty !== undefined) {
    return `为你找到**最小起订量小于等于${intent.maxMinOrderQty}**的促销品（${currentYear}有效）${count}个，包括${formatProductNames(displayProducts)}。请问你想选择什么品牌、品类或主题？`
  }

  if (intent.maxDeliveryDays !== undefined) {
    return `为你找到**${intent.maxDeliveryDays}天内能到货**的促销品${count}个，包括${formatProductNames(displayProducts)}。你可以继续指定品牌、品类或预算来缩小范围。`
  }

  return `${sourceLabel}为你找到 ${count} 个相关促销品，包括${formatProductNames(displayProducts)}。你可以选择卡片，我再帮你确认仓储和下单量。`
}

const parseModelRecommendation = (content: string) => {
  const productCodes = new Set(productStore.products.map(product => product.code))
  const productIds = new Set(productStore.products.map(product => product.id))

  try {
    const parsed = JSON.parse(content)
    const rawList = Array.isArray(parsed) ? parsed : parsed.recommendations || parsed.products || []
    if (Array.isArray(rawList)) {
      return rawList
        .map(item => typeof item === 'string' ? item : item.code || item.id || item.productCode)
        .filter((value: unknown): value is string => typeof value === 'string')
        .filter(value => productCodes.has(value) || productIds.has(value))
        .slice(0, 5)
    }
  } catch {
    // Some model providers return prose; fall through to code extraction.
  }

  return productStore.products
    .filter(product => content.includes(product.code) || content.includes(product.name))
    .map(product => product.code)
    .slice(0, 5)
}

const getChatCompletionsUrl = (url: string) => {
  const trimmed = url.trim().replace(/\/+$/, '')
  return trimmed.endsWith('/chat/completions') ? trimmed : `${trimmed}/chat/completions`
}

const requestModelRecommendations = async (text: string) => {
  const model = aiModelStore.getModelForUser(authStore.user?.id)
  if (!model) return null

  const intent = getDemandIntent(text)
  const productCatalog = productStore.products.map(product => ({
    id: product.id,
    code: product.code,
    name: product.name,
    category: product.category,
    price: product.price,
    supplier: intent.hasSupplierConstraint ? product.supplier : '',
    deliveryDays: product.deliveryDays,
    minOrderQty: product.minOrderQty,
    minDeliveryQty: product.minDeliveryQty,
    contractCode: product.contractCode,
    priceValidFrom: product.priceValidFrom,
    priceValidTo: product.priceValidTo
  }))

  const response = await fetch(getChatCompletionsUrl(model.url), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${model.key}`
    },
    body: JSON.stringify({
      model: model.name,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: '你是促销品选品助手。促销品默认全国可用，不要把供应商、适用事业部、区域说明当作默认筛选条件；只有用户明确提出指定供应商、厂家或供货商时，才考虑 supplier 字段。编码、名称、类别是主要匹配条件；单价、MOQ、MSQ、货期、价格有效期是辅助匹配条件。只能从给定商品目录中推荐，返回 JSON 数组，数组元素只包含商品 code，最多 5 个，不要输出解释。'
        },
        {
          role: 'user',
          content: JSON.stringify({
            demand: text,
            supplierRule: intent.hasSupplierConstraint
              ? '用户明确要求供应商，可以考虑 supplier 字段。'
              : '用户没有明确要求供应商，supplier/适用事业部/区域信息不要作为推荐条件，促销品默认全国可用。',
            products: productCatalog
          })
        }
      ]
    })
  })

  if (!response.ok) {
    throw new Error(`模型接口请求失败：${response.status}`)
  }

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content || data?.content || ''
  if (!content) return null

  const ids = parseModelRecommendation(content)
  return ids.length > 0 ? ids : null
}

const getDemandInfoStatus = (text: string) => {
  const normalized = text.trim().toLowerCase()
  if (normalized.length >= 2) {
    return {
      enough: true,
      missingTips: []
    }
  }

  const coreKeywords = normalized
    .replace(/我需要|我要|帮我|给我|推荐|找一下|查一下|需要|想要|采购|下单/g, ' ')
    .split(/\s+|，|,|。|；|;|、/)
    .map(item => item.trim())
    .filter(item => item.length >= 2)

  const hasProductIdentity = productStore.products.some(product =>
    [product.code, product.name, product.category].some(term =>
      term && [normalized, ...coreKeywords].some(keyword => {
        const target = String(term).toLowerCase()
        return keyword.includes(target) || target.includes(keyword)
      })
    )
  )

  return {
    enough: hasProductIdentity,
    missingTips: hasProductIdentity ? [] : ['编码、名称、类别中的任意一个']
  }
}

const buildClarifyingMessage = (tips: string[]) => {
  const fields = tips.length > 0 ? tips.join('、') : '商品编码、名称、类别或者其他信息'
  return `我需要先获取到${fields}，再给你推荐。你可以输入物资编码、促销品名称、类别，或者活动场景，比如：喜力F1活动能用哪些促销品？`
}

const handleChatSubmit = async () => {
  const text = chatInput.value.trim()
  if (!text) return

  chatMessages.value.push({
    id: `user-${Date.now()}`,
    role: 'user',
    content: text
  })
  demandContext.value.push(text)
  const fullDemand = demandContext.value.join('；')
  const demandStatus = getDemandInfoStatus(fullDemand)
  modelRecommendedIds.value = []
  chatInput.value = ''

  if (!demandStatus.enough) {
    activeQuery.value = ''
    chatMessages.value.push({
      id: `assistant-clarify-${Date.now()}`,
      role: 'assistant',
      content: buildClarifyingMessage(demandStatus.missingTips)
    })
    return
  }

  activeQuery.value = fullDemand

  const model = aiModelStore.getModelForUser(authStore.user?.id)
  if (!model) {
    chatMessages.value.push({
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: buildRecommendationMessage(fullDemand, localRecommendedProducts.value, '我先根据本地商品数据')
    })
    return
  }

  isAiLoading.value = true
  try {
    const ids = await requestModelRecommendations(fullDemand)
    if (ids) {
      modelRecommendedIds.value = ids
      const modelProducts = getProductsByRecommendationIds(ids)
      chatMessages.value.push({
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: buildRecommendationMessage(fullDemand, modelProducts.length > 0 ? modelProducts : localRecommendedProducts.value, `已通过模型“${model.name}”`)
      })
    } else {
      chatMessages.value.push({
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: buildRecommendationMessage(fullDemand, localRecommendedProducts.value, '模型没有返回可匹配的商品编码，我先用本地商品数据')
      })
    }
  } catch (error) {
    chatMessages.value.push({
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: `${error instanceof Error ? error.message : '模型接口调用失败'}，${buildRecommendationMessage(fullDemand, localRecommendedProducts.value, '已自动回退到本地推荐')}`
    })
  } finally {
    isAiLoading.value = false
  }
}

const handleNewChat = () => {
  chatInput.value = ''
  activeQuery.value = ''
  isAiLoading.value = false
  modelRecommendedIds.value = []
  demandContext.value = []
  chatMessages.value = [createWelcomeMessage()]
  selectedProduct.value = null
  showDemandModal.value = false
  demandError.value = ''
}

const selectedProduct = ref<Product | null>(null)
const showDemandModal = ref(false)
const warehouseChoice = ref<'default' | 'recommended' | 'manual'>('default')
const manualWarehouseId = ref('')
const demandQuantity = ref(1)
const demandError = ref('')
const demandModalStyle = ref<Record<string, string>>({})

const defaultWarehouse = computed(() => {
  const warehouseId = authStore.user?.warehouseId
  return warehouseStore.getWarehouseById(warehouseId || '') || warehouseStore.warehouses[0]
})

const recommendedWarehouse = computed(() => {
  if (!selectedProduct.value) return defaultWarehouse.value

  const groupOrders = groupOrderStore.getProductGroupOrders(selectedProduct.value.id)
  if (groupOrders.length === 0) return defaultWarehouse.value

  const sorted = [...groupOrders].sort((a, b) => b.currentQty - a.currentQty)
  return warehouseStore.getWarehouseById(sorted[0].warehouseId) || defaultWarehouse.value
})

const manualWarehouseName = computed(() =>
  warehouseStore.getWarehouseById(manualWarehouseId.value)?.name || ''
)

const selectedWarehouseId = computed(() => {
  if (warehouseChoice.value === 'manual') return manualWarehouseId.value
  if (warehouseChoice.value === 'recommended') return recommendedWarehouse.value?.id || ''
  return defaultWarehouse.value?.id || ''
})

const updateDemandModalPosition = (event?: MouseEvent | KeyboardEvent) => {
  const target = event?.currentTarget instanceof HTMLElement ? event.currentTarget : null
  if (!target) {
    demandModalStyle.value = {}
    return
  }

  const rect = target.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const margin = 18
  const modalWidth = Math.min(720, viewportWidth - margin * 2)
  const estimatedHeight = Math.min(560, viewportHeight - margin * 2)
  const left = Math.min(
    Math.max(rect.left + rect.width / 2 - modalWidth / 2, margin),
    viewportWidth - modalWidth - margin
  )
  const top = Math.min(
    Math.max(rect.top, margin),
    viewportHeight - estimatedHeight - margin
  )

  demandModalStyle.value = {
    width: `${modalWidth}px`,
    left: `${left}px`,
    top: `${top}px`
  }
}

const openDemandModal = (product: Product, event?: MouseEvent | KeyboardEvent) => {
  selectedProduct.value = product
  warehouseChoice.value = defaultWarehouse.value ? 'default' : 'manual'
  manualWarehouseId.value = ''
  demandQuantity.value = Math.max(product.minDeliveryQty || 1, 1)
  demandError.value = ''
  updateDemandModalPosition(event)
  showDemandModal.value = true
}

const closeDemandModal = () => {
  showDemandModal.value = false
  selectedProduct.value = null
  demandError.value = ''
  demandModalStyle.value = {}
}

const handleAddDemand = () => {
  if (!selectedProduct.value) return
  if (!selectedWarehouseId.value) {
    demandError.value = '请选择仓储'
    return
  }
  if (!demandQuantity.value || demandQuantity.value <= 0) {
    demandError.value = '请输入有效下单量'
    return
  }

  const existingGroup = groupOrderStore.getGroupOrder(selectedProduct.value.id, selectedWarehouseId.value)
  cartStore.addToCart({
    productId: selectedProduct.value.id,
    warehouseId: selectedWarehouseId.value,
    quantity: demandQuantity.value,
    isNewGroup: !existingGroup
  })

  chatMessages.value.push({
    id: `assistant-added-${Date.now()}`,
    role: 'assistant',
    content: `已把“${selectedProduct.value.name}”加入需求单，数量 ${demandQuantity.value}。你可以继续选择，也可以进入需求单提交。`
  })
  closeDemandModal()
}

const getProductTotalQty = (productId: string) => {
  const confirmedQty = groupOrderStore.getProductTotalQty(productId)
  const cartQty = cartStore.cartItems
    .filter(item => item.productId === productId)
    .reduce((sum, item) => sum + item.quantity, 0)
  return confirmedQty + cartQty
}

const getProgressWidth = (productId: string, minOrderQty: number) => {
  const total = getProductTotalQty(productId)
  return Math.min((total / minOrderQty) * 100, 100)
}

const isReady = (productId: string, minOrderQty: number) => {
  return getProductTotalQty(productId) >= minOrderQty
}

const getProductWarehouses = (productId: string) => {
  const product = productStore.getProductById(productId)
  if (!product) return []

  const confirmedOrders = groupOrderStore.getProductGroupOrders(productId)
  const cartQtyMap = new Map<string, number>()

  cartStore.cartItems
    .filter(item => item.productId === productId)
    .forEach(item => {
      const current = cartQtyMap.get(item.warehouseId) || 0
      cartQtyMap.set(item.warehouseId, current + item.quantity)
    })

  const result = confirmedOrders.map(go => {
    const warehouse = warehouseStore.getWarehouseById(go.warehouseId)
    const mergedQty = go.currentQty + (cartQtyMap.get(go.warehouseId) || 0)
    return {
      warehouseId: go.warehouseId,
      warehouseName: warehouse?.name || '未知仓储',
      currentQty: mergedQty,
      progress: Math.min((mergedQty / product.minDeliveryQty) * 100, 100),
      isReady: mergedQty >= product.minDeliveryQty
    }
  })

  cartQtyMap.forEach((qty, warehouseId) => {
    const exists = result.find(r => r.warehouseId === warehouseId)
    if (!exists) {
      const warehouse = warehouseStore.getWarehouseById(warehouseId)
      result.push({
        warehouseId,
        warehouseName: warehouse?.name || '未知仓储',
        currentQty: qty,
        progress: Math.min((qty / product.minDeliveryQty) * 100, 100),
        isReady: qty >= product.minDeliveryQty
      })
    }
  })

  return result
}

const goToCart = () => {
  router.push('/cart')
}

const handleLogout = () => {
  authStore.logout()
  router.push('/')
}

const expandedOrderId = ref<string | null>(null)

const parseOrderDate = (value: string) => {
  const normalized = value.replace(/\//g, '-')
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

const getMonthlyProgressRange = () => {
  const now = new Date()
  // 月度拼单统计口径埋点：当前为自然月，后续可改为上月25日至本月25日。
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  }
}

const currentMonthLabel = computed(() => {
  const { start, end } = getMonthlyProgressRange()
  return `${start.getMonth() + 1}月${start.getDate()}日-${end.getMonth() + 1}月${end.getDate()}日`
})

const currentMonthOrders = computed(() => {
  const { start, end } = getMonthlyProgressRange()

  return [...orderStore.allOrders]
    .filter(order => {
      const createdAt = parseOrderDate(order.createdAt)
      return createdAt !== null && createdAt >= start && createdAt <= end
    })
    .sort((a, b) => {
      const aTime = parseOrderDate(a.createdAt)?.getTime() || 0
      const bTime = parseOrderDate(b.createdAt)?.getTime() || 0
      return bTime - aTime
    })
})

const monthlyProgressProducts = computed<MonthlyProductProgress[]>(() => {
  const productMap = new Map<string, MonthlyProductProgress>()

  currentMonthOrders.value.forEach(order => {
    order.items.forEach(item => {
      const product = productStore.getProductById(item.productId)
      if (!product) return

      const existing = productMap.get(item.productId) || {
        product,
        totalQty: 0,
        warehouseQtyMap: new Map<string, number>()
      }
      existing.totalQty += item.quantity
      existing.warehouseQtyMap.set(
        item.warehouseId,
        (existing.warehouseQtyMap.get(item.warehouseId) || 0) + item.quantity
      )
      productMap.set(item.productId, existing)
    })
  })

  return [...productMap.values()]
    .filter(item => item.totalQty > 0)
    .sort((a, b) => b.totalQty - a.totalQty)
})

const monthlyProgressMap = computed(() => {
  const map = new Map<string, MonthlyProductProgress>()
  monthlyProgressProducts.value.forEach(item => {
    map.set(item.product.id, item)
  })
  return map
})

const getMonthlyProgressWidth = (item: MonthlyProductProgress) => {
  return Math.min((item.totalQty / item.product.minOrderQty) * 100, 100)
}

const isMonthlyReady = (item: MonthlyProductProgress) => {
  return item.totalQty >= item.product.minOrderQty
}

const getMonthlyProductWarehouses = (item: MonthlyProductProgress) => {
  return [...item.warehouseQtyMap.entries()]
    .map(([warehouseId, qty]) => {
      const warehouse = warehouseStore.getWarehouseById(warehouseId)
      return {
        warehouseId,
        warehouseName: warehouse?.name || '未知仓储',
        currentQty: qty,
        progress: Math.min((qty / item.product.minDeliveryQty) * 100, 100),
        isReady: qty >= item.product.minDeliveryQty
      }
    })
    .sort((a, b) => b.currentQty - a.currentQty)
}

const getRecommendedMonthlyProgress = (product: Product) => {
  return monthlyProgressMap.value.get(product.id)
}

const getRecommendedTotalQty = (product: Product) => {
  return getRecommendedMonthlyProgress(product)?.totalQty ?? getProductTotalQty(product.id)
}

const getRecommendedProgressWidth = (product: Product) => {
  const monthlyProgress = getRecommendedMonthlyProgress(product)
  return monthlyProgress
    ? getMonthlyProgressWidth(monthlyProgress)
    : getProgressWidth(product.id, product.minOrderQty)
}

const isRecommendedReady = (product: Product) => {
  const monthlyProgress = getRecommendedMonthlyProgress(product)
  return monthlyProgress
    ? isMonthlyReady(monthlyProgress)
    : isReady(product.id, product.minOrderQty)
}

const getRecommendedWarehouses = (product: Product) => {
  const monthlyProgress = getRecommendedMonthlyProgress(product)
  return monthlyProgress
    ? getMonthlyProductWarehouses(monthlyProgress)
    : getProductWarehouses(product.id)
}

const myOrderPage = ref(1)
const myOrderPageSize = ref(10)

const myOrders = computed(() => {
  const userId = authStore.user?.id
  if (!userId) return []
  return orderStore.getOrdersByUserId(userId).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
})

const myOrderTotalPages = computed(() =>
  Math.max(1, Math.ceil(myOrders.value.length / myOrderPageSize.value))
)

const paginatedMyOrders = computed(() => {
  if (myOrderPage.value > myOrderTotalPages.value) {
    myOrderPage.value = myOrderTotalPages.value
  }
  const start = (myOrderPage.value - 1) * myOrderPageSize.value
  return myOrders.value.slice(start, start + myOrderPageSize.value)
})

const getOrderStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待审批',
    confirmed: '已通过',
    rejected: '已拒绝',
    processing: '处理中',
    shipped: '已发货',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status
}

const toggleOrderDetail = (orderId: string) => {
  expandedOrderId.value = expandedOrderId.value === orderId ? null : orderId
}

const switchToMe = () => {
  currentTab.value = 'me'
  orderStore.refreshFromStorage()
}

const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible' && currentTab.value === 'me') {
    orderStore.refreshFromStorage()
  }
}

onMounted(() => {
  orderStore.refreshFromStorage()
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style scoped>
.home-page {
  --bg: #f5f7fb;
  --surface: #ffffff;
  --surface-soft: #f9fafc;
  --text: #171923;
  --muted: #737985;
  --line: #e6e9f0;
  --brand: #e31837;
  --brand-dark: #b8142c;
  --cyan: #0aa6c2;
  --ready: #16a34a;
  --pending: #d97706;
  --error: #dc2626;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(circle at 5% 0%, rgba(10, 166, 194, 0.13), transparent 32%),
    var(--bg);
  color: var(--text);
}

.home-header {
  min-height: 70px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  background: rgba(255, 255, 255, 0.88);
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(18px);
  flex-shrink: 0;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-mark {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--brand), var(--brand-dark));
  box-shadow: 0 12px 26px rgba(227, 24, 55, 0.22);
}

.logo-mark svg {
  width: 25px;
  height: 25px;
  fill: #ffffff;
}

.header-kicker,
.hero-kicker,
.section-kicker {
  margin: 0 0 3px;
  color: var(--brand);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h1,
h2,
h3,
p {
  margin: 0;
}

h1 {
  font-size: 18px;
}

.user-chip {
  padding: 7px 10px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  border-radius: 12px;
  background: var(--surface-soft);
  border: 1px solid var(--line);
}

.user-chip span {
  font-size: 13px;
  font-weight: 800;
}

.user-chip small {
  color: var(--muted);
  font-size: 11px;
}

.logout-btn {
  height: 38px;
  padding: 0 14px;
  border: 1px solid rgba(220, 38, 38, 0.18);
  border-radius: 10px;
  background: rgba(220, 38, 38, 0.06);
  color: var(--error);
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.workspace-hero {
  margin: 18px 20px 0;
  padding: 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgba(20, 24, 36, 0.88), rgba(31, 38, 56, 0.84)),
    linear-gradient(135deg, #ffffff, #f1f4f9);
  color: #ffffff;
  box-shadow: 0 18px 42px rgba(20, 24, 36, 0.18);
}

.workspace-hero h2 {
  max-width: 680px;
  font-size: 24px;
  line-height: 1.35;
}

.cart-action,
.new-chat-action {
  min-width: 128px;
  height: 46px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  border-radius: 12px;
  background: #ffffff;
  color: var(--brand);
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.2);
}

.new-chat-action {
  min-width: 118px;
  border: 1px solid rgba(23, 25, 35, 0.08);
  background: var(--surface-soft);
  color: var(--text);
  box-shadow: none;
}

.new-chat-action:hover {
  border-color: rgba(227, 24, 55, 0.28);
  color: var(--brand);
}

.cart-action svg,
.new-chat-action svg,
.tab-icon,
.search-icon,
.refresh-btn svg,
.empty-state svg,
.empty-icon {
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.cart-action svg,
.new-chat-action svg {
  width: 20px;
  height: 20px;
}

.cart-action strong {
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: var(--brand);
  color: #ffffff;
  font-size: 12px;
}

.filter-bar {
  margin: 14px 20px 0;
  padding: 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface);
  box-shadow: 0 12px 34px rgba(20, 24, 36, 0.06);
  flex-shrink: 0;
}

.search-wrapper {
  position: relative;
  flex: 1 1 220px;
}

.search-icon {
  position: absolute;
  left: 13px;
  top: 50%;
  width: 16px;
  height: 16px;
  color: #9aa1ad;
  transform: translateY(-50%);
  pointer-events: none;
}

.search-input,
.filter-select {
  height: 40px;
  border: 1px solid #dfe4ec;
  border-radius: 10px;
  background: var(--surface-soft);
  color: var(--text);
  font-size: 14px;
  outline: none;
}

.search-input {
  width: 100%;
  padding: 0 12px 0 38px;
}

.search-input::placeholder {
  color: #9aa1ad;
}

.filter-select {
  min-width: 108px;
  padding: 0 10px;
  cursor: pointer;
}

.search-input:focus,
.filter-select:focus {
  border-color: rgba(227, 24, 55, 0.58);
  box-shadow: 0 0 0 4px rgba(227, 24, 55, 0.08);
}

.home-content,
.me-content {
  flex: 1;
  overflow-y: auto;
  padding: 18px 20px 88px;
}

.ai-workspace {
  position: relative;
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 18px;
  padding: 18px 20px 88px;
  overflow-y: auto;
}

.ai-workspace.intent-open {
  grid-template-columns: minmax(360px, 0.9fr) minmax(0, 1.1fr);
}

.intent-toggle {
  position: absolute;
  top: 26px;
  right: 28px;
  z-index: 5;
  height: 42px;
  padding: 0 13px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(20, 24, 36, 0.12);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.92);
  color: #242834;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 12px 28px rgba(20, 24, 36, 0.12);
  backdrop-filter: blur(10px);
}

.intent-toggle:hover {
  border-color: rgba(227, 24, 55, 0.3);
  color: var(--brand);
  transform: translateY(-1px);
}

.intent-toggle svg,
.intent-collapse-btn svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.ai-panel,
.recommend-panel {
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--surface);
  box-shadow: 0 12px 34px rgba(20, 24, 36, 0.06);
}

.ai-panel {
  min-height: 560px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ai-panel-header {
  padding: 20px 220px 20px 20px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 14px;
  border-bottom: 1px solid var(--line);
}

.ai-title-group {
  min-width: 0;
}

.ai-title-line {
  margin-top: 3px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.ai-panel-header h2 {
  font-size: 22px;
  line-height: 1.35;
}

.chat-thread {
  flex: 1;
  min-height: 0;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
  background: linear-gradient(180deg, #ffffff, #fbfcfe);
}

.chat-message {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.chat-message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: #eef2f7;
  color: #596171;
  font-size: 12px;
  font-weight: 900;
  flex-shrink: 0;
}

.chat-message.assistant .message-avatar {
  background: rgba(227, 24, 55, 0.1);
  color: var(--brand);
}

.message-bubble {
  max-width: 78%;
  padding: 12px 14px;
  border-radius: 16px;
  background: #f3f6fa;
  color: #242834;
  font-size: 14px;
  line-height: 1.7;
}

.chat-message.user .message-bubble {
  background: #191f2d;
  color: #ffffff;
}

.chat-recommendations {
  margin: 4px 0 0 44px;
  padding: 16px;
  border: 1px solid #e6e9f0;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 12px 26px rgba(20, 24, 36, 0.06);
}

.chat-recommendations-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.chat-recommendations .ai-card-grid {
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.chat-empty-recommendation {
  align-self: flex-start;
  margin-left: 44px;
  padding: 12px 14px;
  border: 1px dashed #d8dee8;
  border-radius: 14px;
  background: #ffffff;
  color: var(--muted);
  font-size: 13px;
}

.chat-composer {
  margin: 0;
  padding: 14px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 104px;
  gap: 10px;
  border-top: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.94);
}

.chat-composer input {
  min-width: 0;
  height: 44px;
  padding: 0 14px;
  border: 1px solid #dfe4ec;
  border-radius: 12px;
  background: #f8fafc;
  color: var(--text);
  font-size: 14px;
  outline: none;
}

.chat-composer input:focus {
  border-color: rgba(227, 24, 55, 0.58);
  box-shadow: 0 0 0 4px rgba(227, 24, 55, 0.08);
}

.chat-composer button,
.primary-btn {
  border: 0;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--brand), var(--brand-dark));
  color: #ffffff;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
}

.ai-loading {
  padding: 0 18px 14px;
  color: var(--muted);
  font-size: 12px;
}

.recommend-panel {
  padding: 18px;
  min-height: 0;
  overflow-y: auto;
}

.intent-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.intent-collapse-btn {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #ffffff;
  color: #596171;
  cursor: pointer;
}

.intent-collapse-btn:hover {
  border-color: rgba(227, 24, 55, 0.24);
  color: var(--brand);
  background: rgba(227, 24, 55, 0.06);
}

.recommend-count {
  padding: 6px 9px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #596171;
  font-size: 12px;
  font-weight: 800;
}

.ai-card-grid {
  margin-top: 14px;
  grid-template-columns: 1fr;
}

.ai-product-card {
  border-radius: 12px;
}

.intent-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.intent-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.intent-card {
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: linear-gradient(180deg, #ffffff, #fbfcfe);
  box-shadow: 0 10px 24px rgba(20, 24, 36, 0.05);
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s, background 0.2s;
}

.intent-card:hover,
.intent-card:focus-visible {
  transform: translateY(-2px);
  border-color: rgba(227, 24, 55, 0.24);
  box-shadow: 0 16px 32px rgba(20, 24, 36, 0.09);
}

.intent-card.selected {
  border-color: rgba(227, 24, 55, 0.54);
  background: linear-gradient(180deg, #fff7f8, #ffffff);
  box-shadow: 0 18px 36px rgba(227, 24, 55, 0.14);
}

.intent-card.selected .product-footer strong {
  color: var(--brand);
}

.intent-icon {
  color: var(--brand);
  background: rgba(227, 24, 55, 0.08);
}

.intent-card-head,
.intent-summary,
.intent-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.intent-card-head strong {
  display: block;
  color: var(--text);
  font-size: 14px;
}

.intent-card-head span {
  display: block;
  margin-top: 4px;
  color: var(--muted);
  font-size: 12px;
}

.intent-card-head em {
  padding: 5px 8px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #596171;
  font-size: 12px;
  font-style: normal;
  font-weight: 800;
  white-space: nowrap;
}

.intent-head-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.intent-head-actions b {
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(227, 24, 55, 0.1);
  color: var(--brand);
  font-size: 12px;
  font-weight: 900;
  white-space: nowrap;
}

.intent-summary {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #f8fafc;
  color: #596171;
  font-size: 12px;
  font-weight: 800;
}

.intent-summary strong {
  color: var(--brand);
}

.intent-items {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.intent-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  padding-bottom: 8px;
  border-bottom: 1px dashed var(--line);
}

.intent-items .intent-item {
  display: block;
  grid-template-columns: none;
}

.intent-item:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.intent-item span {
  overflow: hidden;
  color: var(--text);
  font-size: 13px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.intent-item strong {
  color: var(--text);
  font-size: 13px;
}

.intent-item small {
  grid-column: 1 / -1;
  margin-top: 3px;
  color: var(--muted);
  font-size: 12px;
}

.intent-more {
  color: var(--muted);
  font-size: 12px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.product-card {
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface);
  cursor: pointer;
  box-shadow: 0 12px 34px rgba(20, 24, 36, 0.06);
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}

.product-card:hover {
  transform: translateY(-2px);
  border-color: rgba(227, 24, 55, 0.24);
  box-shadow: 0 18px 42px rgba(20, 24, 36, 0.1);
}

.product-top {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
}

.product-icon {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: #f1f5f9;
  color: var(--cyan);
}

.product-photo {
  width: 48px;
  height: 48px;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: #f1f5f9;
}

.product-photo img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.product-icon svg {
  width: 28px;
  height: 28px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.product-main {
  min-width: 0;
}

.product-name {
  overflow: hidden;
  color: var(--text);
  font-size: 15px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-code {
  margin-top: 4px;
  color: var(--muted);
  font-size: 12px;
}

.product-price {
  color: var(--brand);
  font-size: 18px;
  font-weight: 900;
  white-space: nowrap;
}

.product-tags {
  margin-top: 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.product-tags span {
  padding: 5px 8px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #596171;
  font-size: 12px;
  font-weight: 700;
}

.progress-block,
.warehouse-progress {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed var(--line);
}

.progress-label,
.wh-name-row,
.product-footer,
.order-header,
.order-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.progress-label {
  margin-bottom: 8px;
  color: #525a68;
  font-size: 13px;
}

.progress-label strong {
  color: var(--text);
}

.progress-bar,
.wh-bar {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #edf1f6;
}

.progress-fill,
.wh-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.25s;
}

.progress-fill.ready,
.wh-fill.ready {
  background: linear-gradient(90deg, #22c55e, #16a34a);
}

.progress-fill.pending,
.wh-fill.pending {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

.progress-status {
  margin-top: 8px;
  font-size: 12px;
  font-weight: 800;
}

.progress-status.ready,
.wh-status.ready,
.confirmed-color {
  color: var(--ready);
}

.progress-status.pending,
.wh-status.pending,
.pending-color {
  color: var(--pending);
}

.warehouse-title {
  margin-bottom: 10px;
  color: #525a68;
  font-size: 13px;
  font-weight: 800;
}

.wh-item {
  margin-bottom: 10px;
}

.wh-item:last-child {
  margin-bottom: 0;
}

.wh-name,
.wh-qty {
  color: var(--muted);
  font-size: 12px;
}

.wh-status {
  font-size: 12px;
  font-weight: 800;
}

.wh-bar {
  height: 6px;
  margin-top: 6px;
}

.wh-qty {
  margin-top: 4px;
  text-align: right;
}

.product-footer {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 12px;
}

.product-footer strong {
  color: var(--brand);
}

.empty-state,
.empty-orders {
  padding: 54px 20px;
  text-align: center;
  color: var(--muted);
}

.empty-state svg,
.empty-icon {
  width: 54px;
  height: 54px;
  margin-bottom: 12px;
}

.me-header {
  padding: 22px;
  display: flex;
  align-items: center;
  gap: 14px;
  border-radius: 18px;
  background: linear-gradient(135deg, #191f2d, #30394f);
  color: #ffffff;
  box-shadow: 0 18px 42px rgba(20, 24, 36, 0.18);
}

.me-avatar {
  width: 58px;
  height: 58px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.12);
  font-size: 22px;
  font-weight: 900;
}

.me-info p {
  color: rgba(255, 255, 255, 0.62);
  font-size: 13px;
}

.me-info h2 {
  margin-top: 4px;
  font-size: 24px;
}

.me-stats {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat-card {
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface);
  box-shadow: 0 12px 34px rgba(20, 24, 36, 0.06);
}

.stat-num {
  font-size: 28px;
  font-weight: 900;
}

.stat-label {
  margin-top: 4px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
}

.rejected-color {
  color: var(--error);
}

.me-orders {
  margin-top: 16px;
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface);
  box-shadow: 0 12px 34px rgba(20, 24, 36, 0.06);
}

.section-header {
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: 18px;
}

.refresh-btn {
  height: 36px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid rgba(10, 166, 194, 0.24);
  border-radius: 10px;
  background: rgba(10, 166, 194, 0.08);
  color: var(--cyan);
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.refresh-btn svg {
  width: 14px;
  height: 14px;
}

.my-order-card {
  padding: 15px;
  margin-bottom: 12px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface-soft);
  cursor: pointer;
}

.my-order-card:last-child {
  margin-bottom: 0;
}

.orders-pagination {
  margin-top: 14px;
  padding-top: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-top: 1px solid var(--line);
}

.pagination-summary {
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-size-select,
.pagination-controls button {
  height: 34px;
  padding: 0 10px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: #ffffff;
  color: var(--text);
  font-size: 13px;
  font-weight: 800;
}

.pagination-controls button {
  cursor: pointer;
}

.pagination-controls button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.order-no {
  font-size: 14px;
  font-weight: 900;
}

.order-status {
  padding: 5px 9px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 900;
}

.order-status.pending {
  background: rgba(217, 119, 6, 0.12);
  color: var(--pending);
}

.order-status.confirmed {
  background: rgba(22, 163, 74, 0.12);
  color: var(--ready);
}

.order-status.rejected {
  background: rgba(220, 38, 38, 0.1);
  color: var(--error);
}

.order-meta {
  margin-top: 8px;
  justify-content: flex-start;
  color: var(--muted);
  font-size: 12px;
}

.order-amount {
  margin-top: 10px;
  color: var(--brand);
  font-size: 20px;
  font-weight: 900;
}

.reject-reason,
.detail-remark {
  margin-top: 12px;
  padding: 10px;
  border-radius: 10px;
  background: rgba(220, 38, 38, 0.08);
  color: var(--error);
  font-size: 13px;
}

.reject-label {
  color: #8a3540;
}

.order-detail {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--line);
}

.detail-item {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1.4fr) 56px 78px;
  gap: 8px;
  padding: 8px 0;
  align-items: center;
  color: #444b59;
  font-size: 13px;
}

.detail-name,
.detail-warehouse {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-subtotal {
  color: var(--brand);
  font-weight: 900;
  text-align: right;
}

.detail-qty {
  text-align: center;
}

.detail-remark {
  background: #eef2f7;
  color: #596171;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(17, 21, 33, 0.34);
}

.demand-modal {
  position: fixed;
  width: min(720px, 100%);
  max-height: 86vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 24px 70px rgba(20, 24, 36, 0.26);
}

.demand-modal-header,
.demand-modal-footer {
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--line);
}

.demand-modal-header h2 {
  margin: 0;
  color: var(--text);
  font-size: 20px;
}

.modal-close-btn {
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 10px;
  background: #f1f5f9;
  color: var(--text);
  font-size: 22px;
  cursor: pointer;
}

.demand-modal-body {
  padding: 18px 20px;
  overflow-y: auto;
}

.selected-product {
  padding: 12px;
  display: flex;
  gap: 12px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: #f8fafc;
}

.selected-product-image {
  width: 76px;
  height: 76px;
  overflow: hidden;
  border-radius: 12px;
  background: #eef2f7;
  flex-shrink: 0;
}

.selected-product-image img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.selected-product-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
}

.selected-product-info strong {
  color: var(--text);
  font-size: 16px;
}

.selected-product-info span,
.selected-product-info small {
  color: var(--muted);
  font-size: 13px;
}

.warehouse-options {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.warehouse-option {
  min-height: 86px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 7px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #ffffff;
  color: var(--text);
  text-align: left;
  cursor: pointer;
}

.warehouse-option.active {
  border-color: rgba(227, 24, 55, 0.54);
  background: rgba(227, 24, 55, 0.06);
  box-shadow: 0 0 0 4px rgba(227, 24, 55, 0.08);
}

.warehouse-option span {
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
}

.warehouse-option strong {
  color: var(--text);
  font-size: 14px;
}

.manual-warehouse-select,
.quantity-field input {
  width: 100%;
  height: 42px;
  border: 1px solid #dfe4ec;
  border-radius: 10px;
  background: #ffffff;
  color: var(--text);
  font-size: 14px;
  outline: none;
}

.manual-warehouse-select {
  margin-top: 12px;
  padding: 0 10px;
}

.quantity-field {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 800;
}

.quantity-field input {
  padding: 0 12px;
}

.demand-error {
  margin: 10px 0 0;
  color: var(--error);
  font-size: 13px;
}

.demand-modal-footer {
  justify-content: flex-end;
  border-top: 1px solid var(--line);
  border-bottom: 0;
}

.secondary-btn,
.primary-btn {
  height: 42px;
  padding: 0 18px;
}

.secondary-btn {
  border: 1px solid #dfe4ec;
  border-radius: 12px;
  background: #ffffff;
  color: #596171;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
}

.home-tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: calc(68px + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  display: flex;
  border-top: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(18px);
  z-index: 20;
}

.tab-item {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: 0;
  background: transparent;
  color: #838a96;
  cursor: pointer;
}

.tab-item.active {
  color: var(--brand);
}

.tab-icon {
  width: 23px;
  height: 23px;
}

.tab-label {
  font-size: 12px;
  font-weight: 800;
}

.tab-badge {
  position: absolute;
  top: 8px;
  right: calc(50% - 28px);
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: var(--brand);
  color: #ffffff;
  font-size: 10px;
  font-weight: 900;
}

@media (max-width: 760px) {
  .home-page {
    min-width: 0;
    overflow-x: hidden;
  }

  .home-header {
    min-height: 62px;
    padding: 0 14px;
  }

  .logo-mark {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }

  .logo-mark svg {
    width: 22px;
    height: 22px;
  }

  .header-kicker {
    display: none;
  }

  .header-left h1 {
    font-size: 18px;
  }

  .user-chip {
    display: none;
  }

  .workspace-hero {
    margin: 12px 12px 0;
    padding: 18px;
    align-items: flex-start;
    flex-direction: column;
  }

  .workspace-hero h2 {
    font-size: 20px;
  }

  .cart-action,
  .new-chat-action {
    width: 100%;
  }

  .filter-bar {
    margin: 12px 12px 0;
  }

  .home-content,
  .me-content {
    padding: 14px 12px 86px;
  }

  .ai-workspace {
    grid-template-columns: 1fr;
    padding: 12px 12px 86px;
  }

  .ai-workspace.intent-open {
    grid-template-columns: 1fr;
  }

  .intent-toggle {
    top: 18px;
    right: 18px;
  }

  .ai-panel {
    min-height: 520px;
  }

  .ai-panel-header {
    flex-direction: column;
    padding-right: 20px;
  }

  .ai-panel-header .cart-action,
  .ai-panel-header .new-chat-action,
  .chat-composer {
    width: 100%;
  }

  .chat-composer {
    grid-template-columns: 1fr;
  }

  .chat-recommendations,
  .chat-empty-recommendation {
    margin-left: 0;
  }

  .chat-recommendations-header {
    flex-direction: column;
  }

  .product-grid {
    grid-template-columns: 1fr;
  }

  .warehouse-options {
    grid-template-columns: 1fr;
  }

  .demand-modal {
    left: 0 !important;
    right: 0;
    top: auto !important;
    bottom: 0;
    width: 100% !important;
    max-height: min(86vh, 680px);
    border-radius: 20px 20px 0 0;
  }

  .me-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .detail-item {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .orders-pagination {
    align-items: stretch;
    flex-direction: column;
  }

  .pagination-controls {
    flex-wrap: wrap;
  }

  .detail-subtotal,
  .detail-qty {
    text-align: left;
  }
}

@media (max-width: 480px) {
  .home-header {
    padding: 0 12px;
  }

  .ai-workspace,
  .home-content,
  .me-content {
    padding-left: 10px;
    padding-right: 10px;
  }

  .ai-panel {
    min-height: calc(100vh - 168px);
    border-radius: 16px;
  }

  .ai-panel-header h2,
  .section-header h2 {
    font-size: 18px;
  }

  .chat-messages {
    padding: 14px;
  }

  .message-bubble {
    max-width: 88%;
  }

  .chat-input {
    min-height: 44px;
  }

  .product-card,
  .order-card,
  .progress-card,
  .me-header {
    border-radius: 14px;
  }

  .product-main {
    grid-template-columns: 44px minmax(0, 1fr);
  }

  .product-thumb,
  .product-image-fallback {
    width: 44px;
    height: 44px;
  }

  .warehouse-summary-row,
  .detail-row {
    grid-template-columns: 1fr;
  }

  .me-stats {
    gap: 8px;
  }

  .stat-card {
    padding: 12px 8px;
  }

  .home-tabbar {
    height: calc(62px + env(safe-area-inset-bottom));
  }
}
</style>
