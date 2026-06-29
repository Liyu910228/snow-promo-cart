<template>
  <div class="admin-accounts">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1>账号管理</h1>
      <button class="add-btn" @click="handleAdd">+ 新增账号</button>
    </div>

    <!-- 搜索筛选 -->
    <div class="filter-bar">
      <input
        v-model="searchKeyword"
        type="text"
        class="search-input"
        placeholder="搜索用户名/姓名..."
      />
      <select v-model="selectedRole" class="filter-select">
        <option value="">全部角色</option>
        <option value="admin">管理员</option>
        <option value="user">业务员</option>
      </select>
      <select v-model="selectedStatus" class="filter-select">
        <option value="">全部状态</option>
        <option value="active">启用</option>
        <option value="disabled">禁用</option>
      </select>
    </div>

    <!-- 账号列表 -->
    <div class="account-table">
      <table>
        <thead>
          <tr>
            <th>用户名</th>
            <th>姓名</th>
            <th>角色</th>
            <th>所属仓储</th>
            <th>状态</th>
            <th>创建日期</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="account in filteredAccounts" :key="account.id">
            <td>{{ account.username }}</td>
            <td>{{ account.name }}</td>
            <td>
              <span class="role-tag" :class="account.role">
                {{ account.role === 'admin' ? '管理员' : '业务员' }}
              </span>
            </td>
            <td>{{ getWarehouseName(account.warehouseId) }}</td>
            <td>
              <span class="status-tag" :class="account.status">
                {{ account.status === 'active' ? '启用' : '禁用' }}
              </span>
            </td>
            <td>{{ account.createdAt }}</td>
            <td class="actions">
              <button class="edit-btn" @click="handleEdit(account)">编辑</button>
              <button class="reset-btn" @click="handleResetPassword(account.id)">重置密码</button>
              <button
                v-if="account.id !== '1'"
                class="delete-btn"
                @click="handleDelete(account.id)"
              >删除</button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="filteredAccounts.length === 0" class="empty-state">
        <p>暂无账号数据</p>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ isEditing ? '编辑账号' : '新增账号' }}</h2>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        
        <div class="modal-body">
          <div class="form-row">
            <div class="form-item">
              <label>用户名</label>
              <input
                v-model="formData.username"
                type="text"
                placeholder="如：sales01"
                :disabled="isEditing"
              />
            </div>
            <div class="form-item">
              <label>姓名</label>
              <input v-model="formData.name" type="text" placeholder="如：张三" />
            </div>
          </div>
          
          <div class="form-row" v-if="!isEditing">
            <div class="form-item">
              <label>密码</label>
              <input v-model="formData.password" type="text" placeholder="请输入密码" />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-item">
              <label>角色</label>
              <select v-model="formData.role" class="form-select">
                <option value="user">业务员</option>
                <option value="admin">管理员</option>
              </select>
            </div>
            <div class="form-item">
              <label>状态</label>
              <select v-model="formData.status" class="form-select">
                <option value="active">启用</option>
                <option value="disabled">禁用</option>
              </select>
            </div>
          </div>
          
          <div class="form-item" v-if="formData.role === 'user'">
            <label>所属仓储</label>
            <select v-model="formData.warehouseId" class="form-select">
              <option value="">请选择仓储</option>
              <option v-for="wh in warehouses" :key="wh.id" :value="wh.id">
                {{ wh.name }}
              </option>
            </select>
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
import { useAccountStore } from '@/stores/account'
import { useWarehouseStore } from '@/stores/warehouse'
import type { User } from '@/types'

const accountStore = useAccountStore()
const warehouseStore = useWarehouseStore()

// 搜索筛选
const searchKeyword = computed({
  get: () => accountStore.searchKeyword,
  set: (val) => accountStore.searchKeyword = val
})
const selectedRole = computed({
  get: () => accountStore.selectedRole,
  set: (val) => accountStore.selectedRole = val
})
const selectedStatus = computed({
  get: () => accountStore.selectedStatus,
  set: (val) => accountStore.selectedStatus = val
})
const filteredAccounts = computed(() => accountStore.filteredAccounts)
const warehouses = computed(() => warehouseStore.warehouses)

// 获取仓储名称
const getWarehouseName = (warehouseId?: string) => {
  if (!warehouseId) return '-'
  const wh = warehouseStore.getWarehouseById(warehouseId)
  return wh ? wh.name : '-'
}

// 弹窗状态
const showModal = ref(false)
const isEditing = ref(false)
const editingId = ref('')

// 表单数据
const formData = ref({
  username: '',
  password: '',
  name: '',
  role: 'user' as 'admin' | 'user',
  warehouseId: '',
  status: 'active' as 'active' | 'disabled'
})

// 重置表单
const resetForm = () => {
  formData.value = {
    username: '',
    password: '',
    name: '',
    role: 'user',
    warehouseId: '',
    status: 'active'
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
const handleEdit = (account: User) => {
  isEditing.value = true
  editingId.value = account.id
  formData.value = {
    username: account.username,
    password: '',
    name: account.name,
    role: account.role,
    warehouseId: account.warehouseId || '',
    status: account.status
  }
  showModal.value = true
}

// 删除
const handleDelete = (id: string) => {
  if (confirm('确定要删除这个账号吗？')) {
    const result = accountStore.deleteAccount(id)
    if (!result.success) {
      alert(result.message)
    }
  }
}

// 重置密码
const handleResetPassword = (id: string) => {
  if (confirm('确定要重置该账号的密码为 12345 吗？')) {
    accountStore.resetPassword(id, '12345')
    alert('密码已重置为 12345')
  }
}

// 提交
const handleSubmit = () => {
  // 校验必填字段
  if (!formData.value.username.trim()) {
    alert('请输入用户名')
    return
  }
  if (!formData.value.name.trim()) {
    alert('请输入姓名')
    return
  }
  if (!isEditing.value && !formData.value.password.trim()) {
    alert('请输入密码')
    return
  }
  
  if (isEditing.value) {
    const updateData: Partial<User> = {
      name: formData.value.name,
      role: formData.value.role,
      status: formData.value.status
    }
    if (formData.value.role === 'user') {
      updateData.warehouseId = formData.value.warehouseId || undefined
    } else {
      updateData.warehouseId = undefined
    }
    const result = accountStore.updateAccount(editingId.value, updateData)
    if (result.success) {
      alert('保存成功')
      closeModal()
    } else {
      alert(result.message)
    }
  } else {
    const result = accountStore.addAccount({
      username: formData.value.username,
      password: formData.value.password,
      name: formData.value.name,
      role: formData.value.role,
      warehouseId: formData.value.role === 'user' ? formData.value.warehouseId || undefined : undefined,
      status: formData.value.status
    })
    if (result.success) {
      alert('新增成功')
      closeModal()
    } else {
      alert(result.message)
    }
  }
}

// 关闭弹窗
const closeModal = () => {
  showModal.value = false
  resetForm()
}
</script>

<style scoped>
.admin-accounts {
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
  width: 120px;
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

.account-table {
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

.role-tag {
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.role-tag.admin {
  background: rgba(227, 24, 55, 0.15);
  color: #E31837;
}

.role-tag.user {
  background: rgba(52, 199, 89, 0.15);
  color: #34C759;
}

.status-tag {
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 12px;
}

.status-tag.active {
  background: rgba(52, 199, 89, 0.15);
  color: #34C759;
}

.status-tag.disabled {
  background: rgba(142, 142, 147, 0.15);
  color: #8E8E93;
}

.actions {
  display: flex;
  gap: 8px;
}

.edit-btn,
.delete-btn,
.reset-btn {
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

.reset-btn {
  background: rgba(255, 149, 0, 0.15);
  border: 1px solid rgba(255, 149, 0, 0.3);
  color: #FF9500;
}

.reset-btn:hover {
  background: rgba(255, 149, 0, 0.25);
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

.form-item label {
  display: block;
  color: #8E8E93;
  font-size: 13px;
  margin-bottom: 6px;
}

.form-item input,
.form-select {
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

.form-item input:focus,
.form-select:focus {
  border-color: #E31837;
}

.form-item input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-select {
  cursor: pointer;
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