<template>
  <div class="admin-products">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1>促销品管理</h1>
      <div class="header-actions">
        <button v-if="selectedIds.size > 0" class="batch-delete-btn" @click="handleBatchDelete">
          🗑️ 删除选中 ({{ selectedIds.size }})
        </button>
        <button v-if="selectedIds.size > 0" class="export-btn" @click="handleExportSelected">
          📤 导出选中 ({{ selectedIds.size }})
        </button>
        <button class="export-btn" @click="showColumnSettings = true">⚙️ 字段设置</button>
        <button class="import-btn" @click="showImportModal = true">📥 导入</button>
        <button class="export-btn" @click="handleExport">📤 导出模板</button>
        <button class="add-btn" @click="handleAdd">+ 新增促销品</button>
      </div>
    </div>

    <!-- 搜索筛选 -->
    <div class="filter-bar">
      <input
        v-model="searchKeyword"
        type="text"
        class="search-input"
        placeholder="搜索名称/编码..."
      />
      <select v-model="selectedCategory" class="filter-select">
        <option v-for="cat in categories" :key="cat.value" :value="cat.value">
          {{ cat.label }}
        </option>
      </select>
      <select v-model="selectedPriceRange" class="filter-select">
        <option v-for="p in priceRangeOptions" :key="p.value" :value="p.value">
          {{ p.label }}
        </option>
      </select>
      <select v-model="selectedMOQRange" class="filter-select">
        <option v-for="m in moqRangeOptions" :key="m.value" :value="m.value">
          {{ m.label }}
        </option>
      </select>
      <select v-model="selectedMSQRange" class="filter-select">
        <option v-for="m in msqRangeOptions" :key="m.value" :value="m.value">
          {{ m.label }}
        </option>
      </select>
      <select v-model="selectedSupplier" class="filter-select">
        <option v-for="sup in suppliers" :key="sup.value" :value="sup.value">
          {{ sup.label }}
        </option>
      </select>
      <select v-model="selectedDeliveryDays" class="filter-select">
        <option v-for="d in deliveryDaysOptions" :key="d.value" :value="d.value">
          {{ d.label }}
        </option>
      </select>
      <select v-model="selectedPriceValid" class="filter-select">
        <option v-for="p in priceValidOptions" :key="p.value" :value="p.value">
          {{ p.label }}
        </option>
      </select>
    </div>

    <!-- 产品列表 -->
    <div class="product-table">
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th class="checkbox-col">
                <input
                  type="checkbox"
                  :checked="isAllSelected"
                  :indeterminate.prop="isPartialSelected"
                  @change="toggleSelectAll"
                  class="checkbox"
                />
              </th>
              <th v-if="isProductColumnVisible('index')">序号</th>
              <th v-if="isProductColumnVisible('image')">图片</th>
              <th v-if="isProductColumnVisible('category')">物资类别</th>
              <th v-if="isProductColumnVisible('code')">物资编码</th>
              <th v-if="isProductColumnVisible('name')">物资名称</th>
              <th v-if="isProductColumnVisible('unit')">单位</th>
              <th v-if="isProductColumnVisible('price')">中标价格（元/含税）</th>
              <th v-if="isProductColumnVisible('supplier')">供应商</th>
              <th v-if="isProductColumnVisible('contactInfo')">联系方式</th>
              <th v-if="isProductColumnVisible('minOrderQty')">最小起订量</th>
              <th v-if="isProductColumnVisible('minDeliveryQty')">最小起送量</th>
              <th v-if="isProductColumnVisible('contractCode')">合同编码</th>
              <th v-if="isProductColumnVisible('contractLink')">合同链接</th>
              <th v-if="isProductColumnVisible('priceValidFrom')">价格有效期-自</th>
              <th v-if="isProductColumnVisible('priceValidTo')">价格有效期-至</th>
              <th v-if="isProductColumnVisible('deliveryDays')">货期</th>
              <th class="actions-col">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(product, index) in filteredProducts" :key="product.id">
              <td class="checkbox-col">
                <input
                  type="checkbox"
                  :checked="selectedIds.has(product.id)"
                  @change="toggleSelect(product.id)"
                  class="checkbox"
                />
              </td>
              <td v-if="isProductColumnVisible('index')">{{ index + 1 }}</td>
              <td v-if="isProductColumnVisible('image')">
                <div class="product-thumb" :class="{ empty: !product.imageUrl }">
                  <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" />
                  <span v-else>无图</span>
                </div>
              </td>
              <td v-if="isProductColumnVisible('category')">{{ product.category }}</td>
              <td v-if="isProductColumnVisible('code')">{{ product.code }}</td>
              <td v-if="isProductColumnVisible('name')" class="name-cell">{{ product.name }}</td>
              <td v-if="isProductColumnVisible('unit')">{{ product.unit }}</td>
              <td v-if="isProductColumnVisible('price')" class="price-cell">¥{{ product.price.toFixed(2) }}</td>
              <td v-if="isProductColumnVisible('supplier')">{{ product.supplier }}</td>
              <td v-if="isProductColumnVisible('contactInfo')">{{ product.contactInfo || '-' }}</td>
              <td v-if="isProductColumnVisible('minOrderQty')">{{ product.minOrderQty }}</td>
              <td v-if="isProductColumnVisible('minDeliveryQty')">{{ product.minDeliveryQty }}</td>
              <td v-if="isProductColumnVisible('contractCode')">{{ product.contractCode }}</td>
              <td v-if="isProductColumnVisible('contractLink')" class="contract-link-cell">
                <a v-if="product.contractLink" :href="product.contractLink" target="_blank" rel="noopener noreferrer">查看合同</a>
                <span v-else>-</span>
              </td>
              <td v-if="isProductColumnVisible('priceValidFrom')" class="date-cell">{{ product.priceValidFrom || '-' }}</td>
              <td v-if="isProductColumnVisible('priceValidTo')" class="date-cell">{{ product.priceValidTo || '-' }}</td>
              <td v-if="isProductColumnVisible('deliveryDays')">{{ product.deliveryDays }}</td>
              <td class="actions actions-col">
                <button class="edit-btn" @click="handleEdit(product)">编辑</button>
                <button class="delete-btn" @click="handleDelete(product.id)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div v-if="filteredProducts.length === 0" class="empty-state">
        <p>暂无促销品数据</p>
      </div>
    </div>

    <div class="mobile-product-list" aria-label="移动端促销品列表">
      <article
        v-for="product in filteredProducts"
        :key="product.id"
        class="mobile-product-card"
      >
        <div class="mobile-card-head">
          <label class="mobile-select">
            <input
              type="checkbox"
              :checked="selectedIds.has(product.id)"
              @change="toggleSelect(product.id)"
              class="checkbox"
            />
            <span>选择</span>
          </label>
          <div class="mobile-product-thumb" :class="{ empty: !product.imageUrl }">
            <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" />
            <span v-else>无图</span>
          </div>
          <div class="mobile-product-main">
            <strong>{{ product.name }}</strong>
            <span>{{ product.code }}</span>
          </div>
          <div class="mobile-product-price">¥{{ product.price.toFixed(2) }}</div>
        </div>

        <div class="mobile-product-tags">
          <span>{{ product.category }}</span>
          <span>{{ product.unit }}</span>
          <span>{{ product.deliveryDays || '货期-' }}</span>
        </div>

        <dl class="mobile-product-meta">
          <div>
            <dt>MOQ</dt>
            <dd>{{ product.minOrderQty }}</dd>
          </div>
          <div>
            <dt>MSQ</dt>
            <dd>{{ product.minDeliveryQty }}</dd>
          </div>
          <div>
            <dt>供应商</dt>
            <dd>{{ product.supplier || '-' }}</dd>
          </div>
          <div>
            <dt>有效期</dt>
            <dd>{{ product.priceValidFrom || '-' }} 至 {{ product.priceValidTo || '-' }}</dd>
          </div>
        </dl>

        <div class="mobile-card-actions">
          <button class="edit-btn" @click="handleEdit(product)">编辑</button>
          <button class="delete-btn" @click="handleDelete(product.id)">删除</button>
        </div>
      </article>

      <div v-if="filteredProducts.length === 0" class="empty-state">
        <p>暂无促销品数据</p>
      </div>
    </div>

    <div v-if="showColumnSettings" class="modal-overlay" @click.self="showColumnSettings = false">
      <div class="modal-content column-settings-modal">
        <div class="modal-header">
          <h2>字段显示设置</h2>
          <button class="close-btn" @click="showColumnSettings = false">×</button>
        </div>
        <div class="modal-body">
          <div class="column-settings-grid">
            <label v-for="column in productColumns" :key="column.key" class="column-setting-item">
              <input
                type="checkbox"
                :checked="visibleProductColumns.includes(column.key)"
                @change="toggleProductColumn(column.key)"
              />
              <span>{{ column.label }}</span>
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="resetProductColumns">恢复默认</button>
          <button class="confirm-btn" @click="showColumnSettings = false">完成</button>
        </div>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ isEditing ? '编辑促销品' : '新增促销品' }}</h2>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        
        <div class="modal-body">
          <div class="form-row">
            <div class="form-item">
              <label>物资编码</label>
              <input v-model="formData.code" type="text" placeholder="如：XH-2024-001" />
            </div>
            <div class="form-item">
              <label>物资名称</label>
              <input v-model="formData.name" type="text" placeholder="如：雪花啤酒定制玻璃杯" />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-item">
              <label>物资类别</label>
              <input v-model="formData.category" type="text" placeholder="如：玻璃制品" />
            </div>
            <div class="form-item">
              <label>单位</label>
              <input v-model="formData.unit" type="text" placeholder="如：个" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-item full-width">
              <label>促销品图片</label>
              <div class="image-field">
                <div class="image-preview" :class="{ empty: !formData.imageUrl }">
                  <img v-if="formData.imageUrl" :src="formData.imageUrl" alt="促销品图片预览" />
                  <span v-else>图片预览</span>
                </div>
                <div class="image-inputs">
                  <input v-model="formData.imageUrl" type="text" placeholder="粘贴公有云图片链接，或上传本地图片" />
                  <div class="image-actions">
                    <button class="upload-image-btn" type="button" @click="triggerProductImageInput">上传图片</button>
                    <button v-if="formData.imageUrl" class="clear-image-btn" type="button" @click="clearProductImage">清除图片</button>
                  </div>
                  <input
                    ref="productImageInputRef"
                    type="file"
                    accept="image/*"
                    class="hidden-file-input"
                    @change="handleProductImageSelect"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-item">
              <label>中标价格</label>
              <input v-model.number="formData.price" type="number" placeholder="如：12.5" />
            </div>
            <div class="form-item">
              <label>供应商</label>
              <input v-model="formData.supplier" type="text" placeholder="如：深圳玻璃制品厂" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-item full-width">
              <label>联系方式</label>
              <input v-model="formData.contactInfo" type="text" placeholder="如：联系人/手机号/邮箱" />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-item">
              <label>最小起订量 (MOQ)</label>
              <input v-model.number="formData.minOrderQty" type="number" placeholder="如：100" />
            </div>
            <div class="form-item">
              <label>最小起送量 (MSQ)</label>
              <input v-model.number="formData.minDeliveryQty" type="number" placeholder="如：30" />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-item">
              <label>货期</label>
              <input v-model="formData.deliveryDays" type="text" placeholder="如：15天" />
            </div>
            <div class="form-item">
              <label>合同编码</label>
              <input v-model="formData.contractCode" type="text" placeholder="如：HT-2024-001" />
            </div>
          </div>          
          <div class="form-row">
            <div class="form-item full-width">
              <label>合同链接</label>
              <input v-model="formData.contractLink" type="text" placeholder="如：https://example.com/contract.pdf" />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-item">
              <label>价格有效期开始</label>
              <input v-model="formData.priceValidFrom" type="date" />
            </div>
            <div class="form-item">
              <label>价格有效期结束</label>
              <input v-model="formData.priceValidTo" type="date" />
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeModal">取消</button>
          <button class="confirm-btn" @click="handleSubmit">
            {{ isEditing ? '保存' : '新增' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 导入弹窗 -->
    <div v-if="showImportModal" class="modal-overlay" @click.self="showImportModal = false">
      <div class="modal-content import-modal">
        <div class="modal-header">
          <h2>📥 导入促销品数据</h2>
          <button class="close-btn" @click="showImportModal = false">×</button>
        </div>
        
        <div class="modal-body">
          <div class="import-tips">
            <p>📋 支持格式：<strong>.xlsx</strong>、<strong>.csv</strong></p>
            <p>📝 表头字段：序号、图片、物资类别、物资编码、物资名称、单位、中标价格（元/含税）、供应商、最小起订量、最小起送量、合同编码、合同链接、价格有效期-自、价格有效期-至、货期</p>
            <p>⚠️ 编码和名称为必填字段，重复编码将跳过</p>
          </div>
          
          <div 
            class="upload-area" 
            :class="{ 'drag-over': isDragOver }"
            @dragover.prevent="isDragOver = true"
            @dragleave="isDragOver = false"
            @drop.prevent="handleDrop"
            @click="triggerFileInput"
          >
            <input 
              ref="fileInputRef"
              type="file" 
              accept=".xlsx,.csv" 
              style="display: none" 
              @change="handleFileSelect"
            />
            <div class="upload-icon">📁</div>
            <div class="upload-text">点击或拖拽文件到此处</div>
            <div class="upload-hint">支持 .xlsx / .csv 文件</div>
          </div>
          
          <div v-if="importFile" class="file-info">
            <span class="file-name">📄 {{ importFile.name }}</span>
            <span class="file-size">{{ formatFileSize(importFile.size) }}</span>
            <button class="remove-file" @click="removeFile">✕</button>
          </div>
          
          <!-- 进度条 -->
          <div v-if="isImporting" class="progress-container">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: importProgress + '%' }"></div>
            </div>
            <div class="progress-text">
              <span>{{ importProgress }}%</span>
              <span>正在处理第 {{ importCurrent }}/{{ importTotal }} 条</span>
            </div>
          </div>
          
          <div v-if="importResult" class="import-result" :class="importResult.success ? 'success' : 'error'">
            <p>{{ importResult.message }}</p>
            <div v-if="importResult.details" class="import-details">
              <p v-for="(detail, i) in importResult.details" :key="i">{{ detail }}</p>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="cancel-btn" @click="showImportModal = false">关闭</button>
          <button 
            class="confirm-btn" 
            :disabled="!importFile || isImporting"
            @click="handleImport"
          >
            {{ isImporting ? '导入中...' : '开始导入' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProductStore } from '@/stores/product'
import type { Product } from '@/types'
import * as XLSX from 'xlsx'
import { cacheSharedImageUrl, uploadSharedImage } from '@/utils/sharedData'

const productStore = useProductStore()
const failedImageCacheUrls = new Set<string>()
const productColumnStorageKey = 'snow-admin-product-visible-columns'

const productColumns = [
  { key: 'index', label: '序号' },
  { key: 'image', label: '图片' },
  { key: 'category', label: '物资类别' },
  { key: 'code', label: '物资编码' },
  { key: 'name', label: '物资名称' },
  { key: 'unit', label: '单位' },
  { key: 'price', label: '中标价格（元/含税）' },
  { key: 'supplier', label: '供应商' },
  { key: 'contactInfo', label: '联系方式' },
  { key: 'minOrderQty', label: '最小起订量' },
  { key: 'minDeliveryQty', label: '最小起送量' },
  { key: 'contractCode', label: '合同编码' },
  { key: 'contractLink', label: '合同链接' },
  { key: 'priceValidFrom', label: '价格有效期-自' },
  { key: 'priceValidTo', label: '价格有效期-至' },
  { key: 'deliveryDays', label: '货期' }
] as const

type ProductColumnKey = typeof productColumns[number]['key']

const defaultProductColumns: ProductColumnKey[] = [
  'index',
  'image',
  'category',
  'code',
  'name',
  'unit',
  'price',
  'supplier',
  'contactInfo',
  'minOrderQty',
  'minDeliveryQty'
]

const loadVisibleProductColumns = (): ProductColumnKey[] => {
  try {
    const stored = localStorage.getItem(productColumnStorageKey)
    if (!stored) return [...defaultProductColumns]
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return [...defaultProductColumns]
    const allowed = new Set(productColumns.map(column => column.key))
    const filtered = parsed.filter((key): key is ProductColumnKey => allowed.has(key))
    if (filtered.length > 0 && !filtered.includes('contactInfo')) {
      const supplierIndex = filtered.indexOf('supplier')
      filtered.splice(supplierIndex >= 0 ? supplierIndex + 1 : filtered.length, 0, 'contactInfo')
    }
    return filtered.length > 0 ? filtered : [...defaultProductColumns]
  } catch {
    return [...defaultProductColumns]
  }
}

const showColumnSettings = ref(false)
const visibleProductColumns = ref<ProductColumnKey[]>(loadVisibleProductColumns())

const persistVisibleProductColumns = () => {
  localStorage.setItem(productColumnStorageKey, JSON.stringify(visibleProductColumns.value))
}

const isProductColumnVisible = (key: ProductColumnKey) => visibleProductColumns.value.includes(key)

const toggleProductColumn = (key: ProductColumnKey) => {
  if (visibleProductColumns.value.includes(key)) {
    if (visibleProductColumns.value.length === 1) return
    visibleProductColumns.value = visibleProductColumns.value.filter(item => item !== key)
  } else {
    visibleProductColumns.value = [...visibleProductColumns.value, key]
  }
  persistVisibleProductColumns()
}

const resetProductColumns = () => {
  visibleProductColumns.value = [...defaultProductColumns]
  persistVisibleProductColumns()
}

// 批量删除相关
const selectedIds = ref<Set<string>>(new Set())
const isAllSelected = computed(() => {
  return filteredProducts.value.length > 0 && selectedIds.value.size === filteredProducts.value.length
})
const isPartialSelected = computed(() => {
  return selectedIds.value.size > 0 && selectedIds.value.size < filteredProducts.value.length
})

// 切换全选
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedIds.value = new Set()
  } else {
    selectedIds.value = new Set(filteredProducts.value.map(p => p.id))
  }
}

// 切换单个选中
const toggleSelect = (id: string) => {
  const nextSelectedIds = new Set(selectedIds.value)
  if (selectedIds.value.has(id)) {
    nextSelectedIds.delete(id)
  } else {
    nextSelectedIds.add(id)
  }
  selectedIds.value = nextSelectedIds
}

// 批量删除
const handleBatchDelete = () => {
  if (selectedIds.value.size === 0) {
    alert('请先选择要删除的记录')
    return
  }
  if (confirm(`确定要删除选中的 ${selectedIds.value.size} 条记录吗？`)) {
    selectedIds.value.forEach(id => {
      productStore.deleteProduct(id)
    })
    selectedIds.value.clear()
  }
}

// 搜索筛选
const searchKeyword = computed({
  get: () => productStore.searchKeyword,
  set: (val) => productStore.searchKeyword = val
})
const selectedCategory = computed({
  get: () => productStore.selectedCategory,
  set: (val) => productStore.selectedCategory = val
})
const selectedSupplier = computed({
  get: () => productStore.selectedSupplier,
  set: (val) => productStore.selectedSupplier = val
})
const selectedDeliveryDays = computed({
  get: () => productStore.selectedDeliveryDays,
  set: (val) => productStore.selectedDeliveryDays = val
})
const selectedPriceRange = computed({
  get: () => productStore.selectedPriceRange,
  set: (val) => productStore.selectedPriceRange = val
})
const selectedMOQRange = computed({
  get: () => productStore.selectedMOQRange,
  set: (val) => productStore.selectedMOQRange = val
})
const selectedMSQRange = computed({
  get: () => productStore.selectedMSQRange,
  set: (val) => productStore.selectedMSQRange = val
})
const selectedPriceValid = computed({
  get: () => productStore.selectedPriceValid,
  set: (val) => productStore.selectedPriceValid = val
})
const categories = computed(() => productStore.categories)
const suppliers = computed(() => productStore.suppliers)
const deliveryDaysOptions = computed(() => productStore.deliveryDaysOptions)
const priceRangeOptions = computed(() => productStore.priceRangeOptions)
const moqRangeOptions = computed(() => productStore.moqRangeOptions)
const msqRangeOptions = computed(() => productStore.msqRangeOptions)
const priceValidOptions = computed(() => productStore.priceValidOptions)
const filteredProducts = computed(() => productStore.filteredProducts)
const selectedProducts = computed(() =>
  filteredProducts.value.filter(product => selectedIds.value.has(product.id))
)

const shouldCacheImageUrl = (imageUrl: string) =>
  /^https?:\/\//i.test(imageUrl.trim()) && !failedImageCacheUrls.has(imageUrl.trim())

const cacheProductImageUrl = async (imageUrl: string) => {
  const trimmed = imageUrl.trim()
  if (!shouldCacheImageUrl(trimmed)) return trimmed

  const cachedUrl = await cacheSharedImageUrl(trimmed)
  if (cachedUrl) return cachedUrl

  failedImageCacheUrls.add(trimmed)
  return trimmed
}

const autoCacheExistingProductImages = async () => {
  for (const product of productStore.products) {
    const imageUrl = product.imageUrl || ''
    if (!shouldCacheImageUrl(imageUrl)) continue

    const cachedUrl = await cacheProductImageUrl(imageUrl)
    if (cachedUrl !== imageUrl) {
      productStore.updateProduct(product.id, { imageUrl: cachedUrl })
    }
  }
}

onMounted(() => {
  autoCacheExistingProductImages()
})

// 弹窗状态
const showModal = ref(false)
const isEditing = ref(false)
const editingId = ref('')

// 表单数据
const formData = ref({
  code: '',
  name: '',
  imageUrl: '',
  category: '',
  unit: '',
  price: 0,
  supplier: '',
  contactInfo: '',
  minOrderQty: 0,
  minDeliveryQty: 0,
  deliveryDays: '',
  contractCode: '',
  contractLink: '',
  priceValidFrom: '',
  priceValidTo: ''
})

// 重置表单
const resetForm = () => {
  formData.value = {
    code: '',
    name: '',
    imageUrl: '',
    category: '',
    unit: '',
    price: 0,
    supplier: '',
    contactInfo: '',
    minOrderQty: 0,
    minDeliveryQty: 0,
    deliveryDays: '',
    contractCode: '',
    contractLink: '',
    priceValidFrom: '',
    priceValidTo: ''
  }
}

// 新增
const handleAdd = () => {
  isEditing.value = false
  editingId.value = ''
  resetForm()
  showModal.value = true
}

// 编辑
const handleEdit = (product: Product) => {
  isEditing.value = true
  editingId.value = product.id
  formData.value = {
    code: product.code,
    name: product.name,
    imageUrl: product.imageUrl || '',
    category: product.category,
    unit: product.unit,
    price: product.price,
    supplier: product.supplier,
    contactInfo: product.contactInfo || '',
    minOrderQty: product.minOrderQty,
    minDeliveryQty: product.minDeliveryQty,
    deliveryDays: product.deliveryDays,
    contractCode: product.contractCode,
    contractLink: product.contractLink || '',
    priceValidFrom: product.priceValidFrom,
    priceValidTo: product.priceValidTo
  }
  showModal.value = true
}

const productImageInputRef = ref<HTMLInputElement | null>(null)

const triggerProductImageInput = () => {
  productImageInputRef.value?.click()
}

const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result || ''))
  reader.onerror = reject
  reader.readAsDataURL(file)
})

const handleProductImageSelect = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    alert('请选择图片文件')
    target.value = ''
    return
  }

  if (file.size > 2 * 1024 * 1024) {
    alert('图片建议不超过 2MB，演示系统会把图片上传到服务器，方便所有用户访问')
    target.value = ''
    return
  }

  try {
    const dataUrl = await readFileAsDataUrl(file)
    const uploadedUrl = await uploadSharedImage(file, dataUrl)
    formData.value.imageUrl = uploadedUrl || dataUrl
    if (!uploadedUrl) {
      alert('服务器图片上传失败，已临时使用本地预览。请检查服务器接口后重新上传。')
    }
  } finally {
    target.value = ''
  }
}

const clearProductImage = () => {
  formData.value.imageUrl = ''
  if (productImageInputRef.value) {
    productImageInputRef.value.value = ''
  }
}

// 删除
const handleDelete = (id: string) => {
  if (confirm('确定要删除这个促销品吗？')) {
    productStore.deleteProduct(id)
  }
}

// 提交
const handleSubmit = async () => {
  // 校验必填字段
  if (!formData.value.code.trim()) {
    alert('请输入物资编码')
    return
  }
  if (!formData.value.name.trim()) {
    alert('请输入物资名称')
    return
  }

  const imageUrl = formData.value.imageUrl.trim()
  if (/^https?:\/\//i.test(imageUrl)) {
    const cachedUrl = await cacheProductImageUrl(imageUrl)
    if (cachedUrl) {
      formData.value.imageUrl = cachedUrl
    }
    if (formData.value.imageUrl === imageUrl) {
      alert('图片链接无法被服务器缓存，可能是外部站点防盗链或链接不可访问。请换公有云直链，或使用“上传图片”。')
      return
    }
  }
  
  if (isEditing.value) {
    productStore.updateProduct(editingId.value, formData.value)
    alert('保存成功')
  } else {
    productStore.addProduct(formData.value)
    alert('新增成功')
  }
  
  closeModal()
}

// 关闭弹窗
const closeModal = () => {
  showModal.value = false
  resetForm()
}

// ========== 导入功能 ==========
const showImportModal = ref(false)
const importFile = ref<File | null>(null)
const isDragOver = ref(false)
const isImporting = ref(false)
const importResult = ref<{ success: boolean; message: string; details?: string[] } | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const importProgress = ref(0)
const importTotal = ref(0)
const importCurrent = ref(0)

// 触发文件选择
const triggerFileInput = () => {
  fileInputRef.value?.click()
}

// 文件选择
const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    importFile.value = target.files[0]
    importResult.value = null
  }
}

// 拖拽文件
const handleDrop = (e: DragEvent) => {
  isDragOver.value = false
  if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
    const file = e.dataTransfer.files[0]
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.csv')) {
      importFile.value = file
      importResult.value = null
    } else {
      importResult.value = { success: false, message: '不支持的文件格式，请上传 .xlsx 或 .csv 文件' }
    }
  }
}

// 移除文件
const removeFile = () => {
  importFile.value = null
  importResult.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// 字段映射：Excel 表头 → Product 字段
const fieldMap: Record<string, string> = {
  '图片': 'imageUrl',
  '物资类别': 'category',
  '物资编码': 'code',
  '物资名称': 'name',
  '单位': 'unit',
  '中标价格（元/含税）': 'price',
  '供应商': 'supplier',
  '联系方式': 'contactInfo',
  '联系电话': 'contactInfo',
  '联系人电话': 'contactInfo',
  '供应商联系方式': 'contactInfo',
  '最小起订量': 'minOrderQty',
  '最小起送量': 'minDeliveryQty',
  '合同编码': 'contractCode',
  '合同链接': 'contractLink',
  '价格有效期-自': 'priceValidFrom',
  '价格有效期-至': 'priceValidTo',
  '货期': 'deliveryDays',
  // 兼容旧模板字段
  '编码': 'code',
  '名称': 'name',
  '类别': 'category',
  '单价': 'price',
  'MOQ': 'minOrderQty',
  'MSQ': 'minDeliveryQty',
  '价格有效期开始': 'priceValidFrom',
  '价格有效期结束': 'priceValidTo'
}

const productTemplateHeaders = [
  '序号',
  '图片',
  '物资类别',
  '物资编码',
  '物资名称',
  '单位',
  '中标价格（元/含税）',
  '供应商',
  '联系方式',
  '最小起订量',
  '最小起送量',
  '合同编码',
  '合同链接',
  '价格有效期-自',
  '价格有效期-至',
  '货期'
]
const productToExportRow = (product: Product, index: number) => [
  index + 1,
  product.imageUrl || '',
  product.category,
  product.code,
  product.name,
  product.unit,
  product.price,
  product.supplier,
  product.contactInfo || '',
  product.minOrderQty,
  product.minDeliveryQty,
  product.contractCode,
  product.contractLink || '',
  product.priceValidFrom,
  product.priceValidTo,
  product.deliveryDays
]
// 解析 Excel/CSV 文件
const parseFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(firstSheet)
        resolve(jsonData)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsBinaryString(file)
  })
}

// 执行导入
const handleImport = async () => {
  if (!importFile.value) return
  
  isImporting.value = true
  importResult.value = null
  importProgress.value = 0
  importCurrent.value = 0
  
  try {
    const rows = await parseFile(importFile.value)
    
    if (rows.length === 0) {
      importResult.value = { success: false, message: '文件中没有数据' }
      isImporting.value = false
      return
    }
    
    importTotal.value = rows.length
    let successCount = 0
    let skipCount = 0
    let imageCachedCount = 0
    let imageCacheFailedCount = 0
    const details: string[] = []
    const existingCodes = new Set(productStore.products.map(p => p.code))
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      importCurrent.value = i + 1
      importProgress.value = Math.round(((i + 1) / rows.length) * 100)
      
      // 映射字段
      const mapped: Record<string, any> = {}
      for (const [header, field] of Object.entries(fieldMap)) {
        if (row[header] !== undefined) {
          mapped[field] = row[header]
        }
      }
      
      // 校验必填字段
      if (!mapped.code || !mapped.name) {
        skipCount++
        details.push(`跳过：缺少编码或名称（第${i + 2}行）`)
        continue
      }
      
      // 检查重复编码
      if (existingCodes.has(String(mapped.code))) {
        skipCount++
        details.push(`跳过：编码 "${mapped.code}" 已存在`)
        continue
      }
      
      const rawImageUrl = String(mapped.imageUrl || '').trim()
      const wasExternalImage = /^https?:\/\//i.test(rawImageUrl)
      const imageUrl = rawImageUrl ? await cacheProductImageUrl(rawImageUrl) : ''
      if (wasExternalImage && imageUrl !== rawImageUrl) {
        imageCachedCount++
      } else if (wasExternalImage) {
        imageCacheFailedCount++
      }

      // 类型转换
      const product = {
        code: String(mapped.code),
        name: String(mapped.name),
        imageUrl,
        category: String(mapped.category || ''),
        unit: String(mapped.unit || '个'),
        price: Number(mapped.price) || 0,
        minOrderQty: Number(mapped.minOrderQty) || 0,
        minDeliveryQty: Number(mapped.minDeliveryQty) || 0,
        supplier: String(mapped.supplier || ''),
        contactInfo: String(mapped.contactInfo || ''),
        deliveryDays: String(mapped.deliveryDays || ''),
        contractCode: String(mapped.contractCode || ''),
        contractLink: String(mapped.contractLink || ''),
        priceValidFrom: String(mapped.priceValidFrom || ''),
        priceValidTo: String(mapped.priceValidTo || '')
      }
      
      productStore.addProduct(product)
      existingCodes.add(product.code)
      successCount++
      
      // 小延迟让进度条可见
      if (rows.length < 100) {
        await new Promise(resolve => setTimeout(resolve, 20))
      }
    }
    
    const importDetails = [
      ...details,
      ...(imageCachedCount > 0 ? [`已自动缓存图片 ${imageCachedCount} 张`] : []),
      ...(imageCacheFailedCount > 0 ? [`有 ${imageCacheFailedCount} 张外部图片缓存失败，仍保留原链接`] : [])
    ]

    importResult.value = {
      success: true,
      message: `导入完成：成功 ${successCount} 条，跳过 ${skipCount} 条`,
      details: importDetails.length > 0 ? importDetails : undefined
    }
    
    // 清除文件
    removeFile()
  } catch (err) {
    importResult.value = {
      success: false,
      message: '文件解析失败，请检查文件格式是否正确'
    }
  }
  
  isImporting.value = false
}

// 导出模板（带示例数据）
const handleExport = () => {
  const headers = productTemplateHeaders
  const exampleData = [
    [1, 'https://example.com/product-1.jpg', '玻璃制品', 'XH-2024-001', '雪花啤酒定制玻璃杯', '个', 12.5, '深圳玻璃制品厂', '张三 13800000000', 100, 30, 'HT-2024-001', 'https://example.com/contracts/HT-2024-001.pdf', '2024-01-01', '2024-12-31', '15天'],
    [2, 'https://example.com/product-2.jpg', '服装', 'XH-2024-002', '雪花啤酒 promotional T恤', '件', 35, '广州服装厂', '李四 13900000000', 50, 10, 'HT-2024-002', 'https://example.com/contracts/HT-2024-002.pdf', '2024-03-01', '2024-09-30', '20天'],
    [3, 'https://example.com/product-3.jpg', '袋类', 'XH-2024-003', '雪花啤酒帆布袋', '个', 8, '杭州包装厂', '王五 13700000000', 200, 50, 'HT-2024-003', 'https://example.com/contracts/HT-2024-003.pdf', '2024-02-15', '2024-08-15', '10天']
  ]
  const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleData])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '促销品导入模板')
  XLSX.writeFile(wb, '促销品导入模板.xlsx')
}

const handleExportSelected = () => {
  if (selectedProducts.value.length === 0) {
    alert('请先选择要导出的数据')
    return
  }

  const rows = selectedProducts.value.map(productToExportRow)
  const ws = XLSX.utils.aoa_to_sheet([productTemplateHeaders, ...rows])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '选中促销品')
  XLSX.writeFile(wb, `选中促销品_${new Date().toISOString().slice(0, 10)}.xlsx`)
}
</script>

<style scoped>
.admin-products {
  width: 100%;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-header h1 {
  color: #FFFFFF;
  font-size: 24px;
  font-weight: 700;
  margin: 0;
}

.add-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #E31837 0%, #FF4D5A 100%);
  border: none;
  border-radius: 8px;
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.add-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(227, 24, 55, 0.3);
}

.batch-delete-btn {
  padding: 10px 20px;
  background: rgba(255, 59, 48, 0.15);
  border: 1px solid rgba(255, 59, 48, 0.3);
  border-radius: 8px;
  color: #FF3B30;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.batch-delete-btn:hover {
  background: rgba(255, 59, 48, 0.25);
  transform: translateY(-1px);
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
  align-items: center;
}

.search-input {
  width: 220px;
  height: 36px;
  padding: 0 12px;
  background: #3A3A3C;
  border: 1px solid #48484A;
  border-radius: 8px;
  color: #FFFFFF;
  font-size: 14px;
  outline: none;
  flex-shrink: 0;
}

.search-input::placeholder {
  color: #636366;
}

.search-input:focus {
  border-color: #E31837;
}

.filter-select {
  min-width: 100px;
  height: 36px;
  padding: 0 10px;
  background: #3A3A3C;
  border: 1px solid #48484A;
  border-radius: 8px;
  color: #FFFFFF;
  font-size: 14px;
  outline: none;
  cursor: pointer;
  flex-shrink: 0;
}

.filter-select option {
  background: #2C2C2E;
  color: #FFFFFF;
  padding: 8px;
  font-size: 14px;
}

.product-table {
  background: #2C2C2E;
  border-radius: 12px;
  overflow: hidden;
}

.mobile-product-list {
  display: none;
}

.table-scroll {
  overflow-x: auto;
  max-width: 100%;
}

table {
  width: 100%;
  min-width: 1180px;
  border-collapse: collapse;
  table-layout: fixed;
}

thead {
  background: #3A3A3C;
}

th {
  padding: 10px 8px;
  color: #8E8E93;
  font-size: 12px;
  font-weight: 600;
  text-align: left;
  border-bottom: 1px solid #48484A;
  white-space: nowrap;
}

td {
  padding: 10px 8px;
  color: #FFFFFF;
  font-size: 13px;
  border-bottom: 1px solid #3A3A3C;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

tbody tr:hover {
  background: rgba(255, 255, 255, 0.03);
}

.date-range {
  white-space: nowrap;
  font-size: 12px;
  color: #8E8E93;
}

.date-cell,
.price-cell {
  white-space: nowrap;
}

.name-cell {
  width: 210px;
}

.contract-link-cell {
  width: 92px;
}

th:nth-child(2),
td:nth-child(2) {
  width: 54px;
}

th:nth-child(3),
td:nth-child(3) {
  width: 70px;
}

th:nth-child(4),
td:nth-child(4) {
  width: 110px;
}

th:nth-child(5),
td:nth-child(5) {
  width: 130px;
}

th:nth-child(7),
td:nth-child(7) {
  width: 58px;
}

th:nth-child(8),
td:nth-child(8) {
  width: 120px;
}

th:nth-child(10),
td:nth-child(10),
th:nth-child(11),
td:nth-child(11) {
  width: 92px;
}

.contract-link-cell a {
  color: #4DA3FF;
  font-weight: 600;
  text-decoration: none;
}

.contract-link-cell a:hover {
  text-decoration: underline;
}

.product-thumb {
  width: 48px;
  height: 38px;
  overflow: hidden;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: #3A3A3C;
  border: 1px solid #48484A;
  color: #8E8E93;
  font-size: 12px;
}

.product-thumb img,
.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.product-thumb.empty,
.image-preview.empty {
  background: rgba(255, 255, 255, 0.04);
}

/* 勾选框 */
.checkbox-col {
  width: 34px;
  text-align: center;
}

.checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #E31837;
}

.actions {
  display: flex;
  gap: 6px;
}

.actions-col {
  position: sticky;
  right: 0;
  z-index: 2;
  width: 112px;
  background: inherit;
}

thead .actions-col {
  z-index: 3;
  background: #3A3A3C;
}

tbody tr:hover .actions-col {
  background: inherit;
}

.edit-btn,
.delete-btn {
  padding: 5px 9px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-btn {
  background: rgba(227, 24, 55, 0.15);
  border: 1px solid rgba(227, 24, 55, 0.3);
  color: #E31837;
}

.edit-btn:hover {
  background: rgba(227, 24, 55, 0.25);
}

.delete-btn {
  background: rgba(255, 59, 48, 0.15);
  border: 1px solid rgba(255, 59, 48, 0.3);
  color: #FF3B30;
}

.delete-btn:hover {
  background: rgba(255, 59, 48, 0.25);
}

.empty-state {
  padding: 40px;
  text-align: center;
  color: #636366;
  font-size: 14px;
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
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 90%;
  max-width: 600px;
  background: #2C2C2E;
  border-radius: 16px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: linear-gradient(135deg, #E31837 0%, #8B0A1E 100%);
}

.modal-header h2 {
  color: #FFFFFF;
  font-size: 18px;
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
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
}

.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.form-item {
  flex: 1;
}

.form-item.full-width {
  flex: 1 1 100%;
}

.form-item label {
  display: block;
  color: #8E8E93;
  font-size: 13px;
  margin-bottom: 6px;
}

.form-item input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  background: #3A3A3C;
  border: 1px solid #48484A;
  border-radius: 8px;
  color: #FFFFFF;
  font-size: 14px;
  outline: none;
}

.form-item input::placeholder {
  color: #636366;
}

.form-item input:focus {
  border-color: #E31837;
}

.image-field {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  gap: 14px;
  align-items: stretch;
}

.image-preview {
  width: 112px;
  height: 88px;
  overflow: hidden;
  display: grid;
  place-items: center;
  border: 1px solid #48484A;
  border-radius: 10px;
  background: #3A3A3C;
  color: #8E8E93;
  font-size: 13px;
}

.image-inputs {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.image-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.upload-image-btn,
.clear-image-btn {
  height: 34px;
  padding: 0 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.upload-image-btn {
  border: 1px solid rgba(227, 24, 55, 0.3);
  background: rgba(227, 24, 55, 0.15);
  color: #E31837;
}

.clear-image-btn {
  border: 1px solid #48484A;
  background: #3A3A3C;
  color: #8E8E93;
}

.hidden-file-input {
  display: none;
}

/* 日期选择器暗色模式 */
.form-item input[type="date"] {
  color-scheme: dark;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #3A3A3C;
}

.cancel-btn,
.confirm-btn {
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
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
  font-weight: 500;
}

.confirm-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(227, 24, 55, 0.3);
}

.confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 头部操作按钮组 */
.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.import-btn,
.export-btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.import-btn {
  background: rgba(227, 24, 55, 0.15);
  border: 1px solid rgba(227, 24, 55, 0.3);
  color: #E31837;
}

.import-btn:hover {
  background: rgba(227, 24, 55, 0.25);
  transform: translateY(-1px);
}

.export-btn {
  background: #3A3A3C;
  border: 1px solid #48484A;
  color: #8E8E93;
}

.export-btn:hover {
  background: #48484A;
  color: #FFFFFF;
  transform: translateY(-1px);
}

/* 导入弹窗 */
.import-modal {
  max-width: 560px;
}

.column-settings-modal {
  max-width: 620px;
}

.column-settings-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.column-setting-item {
  min-height: 42px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #48484A;
  border-radius: 10px;
  background: #2C2C2E;
  color: #F5F5F7;
  font-size: 13px;
  font-weight: 700;
}

.column-setting-item input {
  width: 16px;
  height: 16px;
  accent-color: #E31837;
}

.import-tips {
  background: #3A3A3C;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 20px;
}

.import-tips p {
  margin: 0 0 8px;
  color: #8E8E93;
  font-size: 13px;
  line-height: 1.6;
}

.import-tips p:last-child {
  margin-bottom: 0;
}

.import-tips strong {
  color: #FFFFFF;
}

/* 上传区域 */
.upload-area {
  border: 2px dashed #48484A;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: rgba(58, 58, 60, 0.3);
}

.upload-area:hover {
  border-color: #E31837;
  background: rgba(227, 24, 55, 0.05);
}

.upload-area.drag-over {
  border-color: #E31837;
  background: rgba(227, 24, 55, 0.1);
  transform: scale(1.02);
}

.upload-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.upload-text {
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
}

.upload-hint {
  color: #636366;
  font-size: 13px;
}

/* 文件信息 */
.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 12px 16px;
  background: #3A3A3C;
  border-radius: 10px;
}

.file-name {
  color: #FFFFFF;
  font-size: 14px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  color: #8E8E93;
  font-size: 12px;
  flex-shrink: 0;
}

.remove-file {
  width: 28px;
  height: 28px;
  background: rgba(255, 59, 48, 0.15);
  border: none;
  border-radius: 6px;
  color: #FF3B30;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}

.remove-file:hover {
  background: rgba(255, 59, 48, 0.3);
}

/* 导入结果 */
.import-result {
  margin-top: 16px;
  padding: 14px 16px;
  border-radius: 10px;
  font-size: 14px;
}

.import-result.success {
  background: rgba(52, 199, 89, 0.15);
  border: 1px solid rgba(52, 199, 89, 0.3);
  color: #34C759;
}

.import-result.error {
  background: rgba(255, 59, 48, 0.15);
  border: 1px solid rgba(255, 59, 48, 0.3);
  color: #FF3B30;
}

.import-result p {
  margin: 0;
  font-weight: 500;
}

.import-details {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.import-details p {
  font-size: 12px;
  font-weight: 400;
  margin-bottom: 4px;
  opacity: 0.8;
}

.import-details p:last-child {
  margin-bottom: 0;
}

/* 进度条 */
.progress-container {
  margin-top: 16px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #3A3A3C;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #E31837 0%, #FF4D5A 100%);
  border-radius: 4px;
  transition: width 0.15s ease;
}

.progress-text {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #8E8E93;
}

@media (max-width: 768px) {
  .admin-products {
    min-width: 0;
  }

  .page-header {
    gap: 12px;
    margin-bottom: 14px;
  }

  .header-actions {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .header-actions button,
  .import-btn,
  .export-btn,
  .batch-delete-btn,
  .add-btn {
    width: 100%;
    min-height: 44px;
    padding: 0 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1.2;
    white-space: nowrap;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .filter-bar {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .search-input {
    grid-column: 1 / -1;
    width: 100%;
  }

  .filter-select {
    width: 100%;
    min-width: 0;
  }

  .product-table {
    display: none;
  }

  .mobile-product-list {
    display: grid;
    gap: 12px;
  }

  .mobile-product-card {
    padding: 14px;
    border: 1px solid #E5E8EF;
    border-radius: 14px;
    background: #FFFFFF;
    box-shadow: 0 10px 28px rgba(17, 21, 33, 0.06);
  }

  .mobile-card-head {
    display: grid;
    grid-template-columns: auto 54px minmax(0, 1fr);
    gap: 10px;
    align-items: center;
  }

  .mobile-select {
    min-width: 44px;
    display: grid;
    place-items: center;
    gap: 3px;
    color: #667085;
    font-size: 11px;
    font-weight: 800;
  }

  .mobile-select .checkbox {
    width: 20px;
    height: 20px;
  }

  .mobile-product-thumb {
    width: 54px;
    height: 54px;
    overflow: hidden;
    display: grid;
    place-items: center;
    border: 1px solid #E5E8EF;
    border-radius: 12px;
    background: #F8FAFC;
    color: #98A2B3;
    font-size: 12px;
  }

  .mobile-product-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .mobile-product-main {
    min-width: 0;
  }

  .mobile-product-main strong,
  .mobile-product-main span {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mobile-product-main strong {
    color: #161923;
    font-size: 15px;
    font-weight: 900;
  }

  .mobile-product-main span {
    margin-top: 4px;
    color: #667085;
    font-size: 12px;
    font-weight: 700;
  }

  .mobile-product-price {
    grid-column: 3 / 4;
    color: #E31837;
    font-size: 18px;
    font-weight: 900;
  }

  .mobile-product-tags {
    margin-top: 12px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .mobile-product-tags span {
    min-height: 26px;
    padding: 0 9px;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    background: #F1F5F9;
    color: #596171;
    font-size: 12px;
    font-weight: 800;
  }

  .mobile-product-meta {
    margin: 12px 0 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .mobile-product-meta div {
    min-width: 0;
    padding: 10px;
    border-radius: 10px;
    background: #F8FAFC;
  }

  .mobile-product-meta dt {
    margin: 0 0 4px;
    color: #667085;
    font-size: 11px;
    font-weight: 800;
  }

  .mobile-product-meta dd {
    margin: 0;
    overflow: hidden;
    color: #242834;
    font-size: 13px;
    font-weight: 800;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mobile-card-actions {
    margin-top: 12px;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .mobile-card-actions .edit-btn,
  .mobile-card-actions .delete-btn {
    min-height: 40px;
    padding: 0 10px;
    justify-content: center;
    font-size: 13px;
    font-weight: 800;
  }

  .modal-overlay {
    align-items: flex-start;
    padding: 10px;
    overflow-y: auto;
  }

  .modal-content {
    width: 100%;
    max-width: none;
    max-height: calc(100dvh - 20px);
    display: flex;
    flex-direction: column;
    border-radius: 16px 16px 0 0;
  }

  .modal-header {
    padding: 16px;
    flex-shrink: 0;
  }

  .modal-body {
    flex: 1;
    max-height: none;
    padding: 14px;
    min-height: 0;
    overflow-y: auto;
  }

  .modal-footer {
    padding: 14px;
    flex-shrink: 0;
  }

  .form-row {
    flex-direction: column;
    gap: 12px;
    margin-bottom: 12px;
  }

  .image-field {
    grid-template-columns: 1fr;
  }

  .image-preview {
    width: 100%;
    height: 160px;
  }

  .image-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .upload-image-btn,
  .clear-image-btn {
    width: 100%;
  }

  .column-settings-grid {
    grid-template-columns: 1fr;
  }

  .import-tips p {
    word-break: break-word;
  }

  .upload-area {
    padding: 20px 12px;
  }

  .file-info {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }

  .file-name {
    width: 100%;
  }
}

@media (max-width: 420px) {
  .header-actions,
  .filter-bar,
  .image-actions {
    grid-template-columns: 1fr;
  }

  .mobile-card-head {
    grid-template-columns: auto 48px minmax(0, 1fr);
  }

  .mobile-product-thumb {
    width: 48px;
    height: 48px;
  }

  .mobile-product-meta {
    grid-template-columns: 1fr;
  }
}
</style>
