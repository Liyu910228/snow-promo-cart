<template>
  <div class="admin-orders">
    <div class="page-header">
      <div>
        <p class="page-kicker">Demand Collection</p>
        <h1>需求单管理</h1>
      </div>
      <div class="header-actions">
        <div class="header-stats">
          <span>意向单 {{ totalOrderCount }}</span>
          <span>明细 {{ demandRows.length }}</span>
          <span>数量 {{ totalQuantity }}</span>
        </div>
        <button class="refresh-btn" type="button" @click="handleRefresh">刷新</button>
        <button class="export-btn" type="button" :disabled="filteredRows.length === 0" @click="handleExport">
          导出表格
        </button>
      </div>
    </div>

    <section class="filter-bar">
      <div class="search-wrapper">
        <span class="search-icon">⌕</span>
        <input
          v-model="searchKeyword"
          type="text"
          class="search-input"
          placeholder="搜索需求单号、用户、促销品、仓储"
        />
      </div>
      <label class="date-filter">
        <span>开始日期</span>
        <input v-model="startDate" type="date" />
      </label>
      <label class="date-filter">
        <span>结束日期</span>
        <input v-model="endDate" type="date" />
      </label>
      <button class="clear-btn" type="button" @click="clearFilters">清空筛选</button>
    </section>

    <section class="order-table">
      <div class="table-toolbar">
        <div>
          <p>筛选结果</p>
          <strong>{{ filteredRows.length }} 条需求明细</strong>
        </div>
        <span>导出会按照当前筛选结果生成 Excel</span>
      </div>

      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>需求单号</th>
              <th>用户</th>
              <th>促销品</th>
              <th>下单量</th>
              <th>仓储</th>
              <th>创建时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filteredRows" :key="row.id">
              <td class="order-no">{{ row.orderNo }}</td>
              <td>{{ row.userName }}</td>
              <td>
                <div class="product-cell">
                  <strong>{{ row.productName }}</strong>
                  <span>{{ row.productCode }}</span>
                </div>
              </td>
              <td class="qty">{{ row.quantity }}</td>
              <td>{{ row.warehouseName }}</td>
              <td class="date">{{ row.createdAt }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="filteredRows.length === 0" class="empty-state">
        <p>暂无符合条件的意向单数据</p>
        <button class="retry-btn" type="button" @click="clearFilters">查看全部</button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useOrderStore } from '@/stores/order'
import * as XLSX from 'xlsx'

interface DemandRow {
  id: string
  orderNo: string
  userName: string
  productName: string
  productCode: string
  quantity: number
  warehouseName: string
  createdAt: string
}

const orderStore = useOrderStore()

const searchKeyword = ref('')
const startDate = ref('')
const endDate = ref('')

const demandRows = computed<DemandRow[]>(() =>
  orderStore.allOrders.flatMap(order =>
    order.items.map((item, index) => ({
      id: `${order.id}-${item.productId}-${item.warehouseId}-${index}`,
      orderNo: order.orderNo,
      userName: order.userName,
      productName: item.productName,
      productCode: item.productCode,
      quantity: item.quantity,
      warehouseName: item.warehouseName,
      createdAt: order.createdAt
    }))
  )
)

const totalOrderCount = computed(() => orderStore.allOrders.length)
const totalQuantity = computed(() =>
  filteredRows.value.reduce((sum, row) => sum + row.quantity, 0)
)

const parseDate = (value: string) => {
  const normalized = value.replace(/\//g, '-')
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

const isInDateRange = (createdAt: string) => {
  const createdDate = parseDate(createdAt)
  if (!createdDate) return true

  if (startDate.value) {
    const start = new Date(`${startDate.value}T00:00:00`)
    if (createdDate < start) return false
  }

  if (endDate.value) {
    const end = new Date(`${endDate.value}T23:59:59`)
    if (createdDate > end) return false
  }

  return true
}

const filteredRows = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()

  return demandRows.value.filter(row => {
    const matchesKeyword = !keyword ||
      row.orderNo.toLowerCase().includes(keyword) ||
      row.userName.toLowerCase().includes(keyword) ||
      row.productName.toLowerCase().includes(keyword) ||
      row.productCode.toLowerCase().includes(keyword) ||
      row.warehouseName.toLowerCase().includes(keyword)

    return matchesKeyword && isInDateRange(row.createdAt)
  })
})

const handleRefresh = () => {
  orderStore.refreshFromStorage()
}

const clearFilters = () => {
  searchKeyword.value = ''
  startDate.value = ''
  endDate.value = ''
}

const handleExport = () => {
  const rows = filteredRows.value.map(row => ({
    需求单号: row.orderNo,
    用户: row.userName,
    促销品: row.productName,
    下单量: row.quantity,
    仓储: row.warehouseName,
    创建时间: row.createdAt
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '意向单明细')
  XLSX.writeFile(workbook, `意向单明细_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

onMounted(() => {
  orderStore.refreshFromStorage()
})
</script>

<style scoped>
.admin-orders {
  width: 100%;
}

.page-header {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.page-kicker {
  margin: 0 0 4px;
  color: #e31837;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.page-header h1 {
  margin: 0;
  color: #ffffff;
  font-size: 24px;
  font-weight: 800;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.header-stats {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.header-stats span {
  padding: 7px 10px;
  border: 1px solid #e6e9f0;
  border-radius: 999px;
  background: #ffffff;
  color: #4b5563;
  font-size: 12px;
  font-weight: 800;
}

.refresh-btn,
.export-btn,
.clear-btn,
.retry-btn {
  height: 36px;
  padding: 0 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
}

.refresh-btn {
  border: 1px solid rgba(10, 166, 194, 0.26);
  background: rgba(10, 166, 194, 0.08);
  color: #0a6f83;
}

.export-btn {
  border: 0;
  background: linear-gradient(135deg, #e31837, #ff4d5a);
  color: #ffffff;
}

.export-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.clear-btn,
.retry-btn {
  border: 1px solid #dfe4ec;
  background: #ffffff;
  color: #596171;
}

.refresh-btn:hover,
.export-btn:not(:disabled):hover,
.clear-btn:hover,
.retry-btn:hover {
  transform: translateY(-1px);
}

.filter-bar {
  margin-bottom: 18px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  border: 1px solid #e6e9f0;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 12px 34px rgba(20, 24, 36, 0.06);
}

.search-wrapper {
  position: relative;
  flex: 1 1 260px;
}

.search-icon {
  position: absolute;
  left: 13px;
  top: 50%;
  color: #98a2b3;
  transform: translateY(-50%);
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 40px;
  padding: 0 12px 0 36px;
  border: 1px solid #dfe4ec;
  border-radius: 10px;
  background: #f8fafc;
  color: #242834;
  font-size: 14px;
  outline: none;
}

.date-filter {
  height: 40px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  border: 1px solid #dfe4ec;
  border-radius: 10px;
  background: #f8fafc;
  color: #667085;
  font-size: 13px;
  font-weight: 700;
}

.date-filter input {
  border: 0;
  background: transparent;
  color: #242834;
  outline: none;
  font: inherit;
}

.search-input:focus,
.date-filter:focus-within {
  border-color: rgba(227, 24, 55, 0.56);
  box-shadow: 0 0 0 4px rgba(227, 24, 55, 0.08);
}

.order-table {
  overflow: hidden;
  border: 1px solid #e6e9f0;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 12px 34px rgba(20, 24, 36, 0.06);
}

.table-toolbar {
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid #eef1f5;
}

.table-toolbar p,
.table-toolbar strong {
  margin: 0;
}

.table-toolbar p {
  color: #98a2b3;
  font-size: 12px;
  font-weight: 800;
}

.table-toolbar strong {
  display: block;
  margin-top: 2px;
  color: #242834;
  font-size: 16px;
}

.table-toolbar span {
  color: #667085;
  font-size: 12px;
}

.table-scroll {
  overflow-x: auto;
}

table {
  width: 100%;
  min-width: 860px;
  border-collapse: collapse;
}

thead {
  background: #f8fafc;
}

th,
td {
  padding: 14px 12px;
  text-align: left;
  border-bottom: 1px solid #eef1f5;
  white-space: nowrap;
}

th {
  color: #667085;
  font-size: 13px;
  font-weight: 800;
}

td {
  color: #242834;
  font-size: 14px;
}

tbody tr:hover {
  background: #fbfcfe;
}

.order-no {
  color: #e31837;
  font-weight: 800;
}

.product-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.product-cell strong {
  color: #242834;
  font-size: 14px;
}

.product-cell span,
.date {
  color: #667085;
  font-size: 12px;
}

.qty {
  color: #0a6f83;
  font-weight: 900;
}

.empty-state {
  padding: 48px 20px;
  text-align: center;
  color: #667085;
}

.empty-state p {
  margin: 0 0 12px;
}

@media (max-width: 760px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .header-actions,
  .header-stats {
    width: 100%;
  }

  .refresh-btn,
  .export-btn,
  .clear-btn {
    flex: 1;
  }
}
</style>
