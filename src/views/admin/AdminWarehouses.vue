<template>
  <div class="admin-warehouses">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1>仓储管理</h1>
      <button class="add-btn" @click="handleAdd">+ 新增仓储</button>
    </div>

    <!-- 搜索筛选 -->
    <div class="filter-bar">
      <input
        v-model="searchKeyword"
        type="text"
        class="search-input"
        placeholder="搜索仓储名称..."
      />
      <select v-model="selectedRegion" class="filter-select">
        <option v-for="r in regions" :key="r.value" :value="r.value">
          {{ r.label }}
        </option>
      </select>
    </div>

    <!-- 仓储列表 -->
    <div class="warehouse-table">
      <table>
        <thead>
          <tr>
            <th>仓储名称</th>
            <th>覆盖区域</th>
            <th>详细地址</th>
            <th>联系人</th>
            <th>联系电话</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="warehouse in filteredWarehouses" :key="warehouse.id">
            <td>{{ warehouse.name }}</td>
            <td>{{ warehouse.region }}</td>
            <td>{{ warehouse.address || '-' }}</td>
            <td>{{ warehouse.contact || '-' }}</td>
            <td>{{ warehouse.phone || '-' }}</td>
            <td class="actions">
              <button class="edit-btn" @click="handleEdit(warehouse)">编辑</button>
              <button class="delete-btn" @click="handleDelete(warehouse.id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="filteredWarehouses.length === 0" class="empty-state">
        <p>暂无仓储数据</p>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ isEditing ? '编辑仓储' : '新增仓储' }}</h2>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        
        <div class="modal-body">
          <div class="form-row">
            <div class="form-item">
              <label>仓储名称</label>
              <input v-model="formData.name" type="text" placeholder="如：深圳仓" />
            </div>
            <div class="form-item">
              <label>覆盖区域</label>
              <input v-model="formData.region" type="text" placeholder="如：华南地区" />
            </div>
          </div>
          
          <div class="form-item full-width">
            <label>详细地址</label>
            <input v-model="formData.address" type="text" placeholder="如：深圳市南山区科技园" />
          </div>
          
          <div class="form-row">
            <div class="form-item">
              <label>联系人</label>
              <input v-model="formData.contact" type="text" placeholder="如：张经理" />
            </div>
            <div class="form-item">
              <label>联系电话</label>
              <input v-model="formData.phone" type="text" placeholder="如：13800138000" />
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWarehouseStore } from '@/stores/warehouse'
import type { Warehouse } from '@/types'

const warehouseStore = useWarehouseStore()

// 搜索筛选
const searchKeyword = computed({
  get: () => warehouseStore.searchKeyword,
  set: (val) => warehouseStore.searchKeyword = val
})
const selectedRegion = computed({
  get: () => warehouseStore.selectedRegion,
  set: (val) => warehouseStore.selectedRegion = val
})
const regions = computed(() => warehouseStore.regions)
const filteredWarehouses = computed(() => warehouseStore.filteredWarehouses)

// 弹窗状态
const showModal = ref(false)
const isEditing = ref(false)
const editingId = ref('')

// 表单数据
const formData = ref({
  name: '',
  region: '',
  address: '',
  contact: '',
  phone: ''
})

// 重置表单
const resetForm = () => {
  formData.value = {
    name: '',
    region: '',
    address: '',
    contact: '',
    phone: ''
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
const handleEdit = (warehouse: Warehouse) => {
  isEditing.value = true
  editingId.value = warehouse.id
  formData.value = {
    name: warehouse.name,
    region: warehouse.region,
    address: warehouse.address || '',
    contact: warehouse.contact || '',
    phone: warehouse.phone || ''
  }
  showModal.value = true
}

// 删除
const handleDelete = (id: string) => {
  if (confirm('确定要删除这个仓储吗？')) {
    warehouseStore.deleteWarehouse(id)
  }
}

// 提交
const handleSubmit = () => {
  // 校验必填字段
  if (!formData.value.name.trim()) {
    alert('请输入仓储名称')
    return
  }
  if (!formData.value.region.trim()) {
    alert('请输入覆盖区域')
    return
  }
  
  if (isEditing.value) {
    warehouseStore.updateWarehouse(editingId.value, formData.value)
    alert('保存成功')
  } else {
    warehouseStore.addWarehouse(formData.value)
    alert('新增成功')
  }
  
  closeModal()
}

// 关闭弹窗
const closeModal = () => {
  showModal.value = false
  resetForm()
}
</script>

<style scoped>
.admin-warehouses {
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

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.search-input {
  width: 240px;
  height: 40px;
  padding: 0 12px;
  background: #3A3A3C;
  border: 1px solid #48484A;
  border-radius: 8px;
  color: #FFFFFF;
  font-size: 14px;
  outline: none;
}

.search-input::placeholder {
  color: #636366;
}

.search-input:focus {
  border-color: #E31837;
}

.filter-select {
  width: 140px;
  height: 40px;
  padding: 0 12px;
  background: #3A3A3C;
  border: 1px solid #48484A;
  border-radius: 8px;
  color: #FFFFFF;
  font-size: 14px;
  outline: none;
  cursor: pointer;
}

.warehouse-table {
  background: #2C2C2E;
  border-radius: 12px;
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #3A3A3C;
}

th {
  padding: 14px 12px;
  color: #8E8E93;
  font-size: 13px;
  font-weight: 600;
  text-align: left;
  border-bottom: 1px solid #48484A;
}

td {
  padding: 14px 12px;
  color: #FFFFFF;
  font-size: 14px;
  border-bottom: 1px solid #3A3A3C;
}

tbody tr:hover {
  background: rgba(255, 255, 255, 0.03);
}

.actions {
  display: flex;
  gap: 8px;
}

.edit-btn,
.delete-btn {
  padding: 6px 12px;
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
  max-width: 500px;
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
  width: 100%;
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
</style>