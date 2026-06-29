<template>
  <div class="admin-models">
    <div class="page-header">
      <div>
        <p class="page-kicker">AI Provider</p>
        <h1>模型管理</h1>
      </div>
      <button class="add-btn" type="button" @click="handleAdd">新增模型</button>
    </div>

    <section class="tips">
      <strong>说明</strong>
      <span>模型接口按 OpenAI 兼容格式调用：POST 到你填写的 URL，并携带 Bearer Key。Key 会保存在浏览器本地，仅适合演示环境。</span>
    </section>

    <section class="model-table">
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>模型名字</th>
              <th>URL</th>
              <th>Key</th>
              <th>状态</th>
              <th>业务员账号</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="model in modelStore.models" :key="model.id">
              <td class="model-name">{{ model.name }}</td>
              <td class="url-cell">{{ model.url }}</td>
              <td>
                <div class="key-cell">
                  <span>{{ visibleKeyIds.has(model.id) ? model.key : maskKey(model.key) }}</span>
                  <button class="link-btn" type="button" @click="toggleKeyVisible(model.id)">
                    {{ visibleKeyIds.has(model.id) ? '密文' : '明文' }}
                  </button>
                </div>
              </td>
              <td>
                <span class="status-badge" :class="model.status">
                  {{ model.status === 'enabled' ? '启用' : '禁用' }}
                </span>
              </td>
              <td>{{ getScopeText(model) }}</td>
              <td>{{ model.createdAt }}</td>
              <td class="actions">
                <button class="test-btn" type="button" :disabled="testingId === model.id" @click="handleTestModel(model)">
                  {{ testingId === model.id ? '测试中' : '测试' }}
                </button>
                <button class="edit-btn" type="button" @click="handleEdit(model)">编辑</button>
                <button class="delete-btn" type="button" @click="handleDelete(model.id)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="modelStore.models.length === 0" class="empty-state">
        暂无模型配置，新增后业务员 AI 选品会优先调用真实模型。
      </div>
    </section>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ editingId ? '编辑模型' : '新增模型' }}</h2>
          <button class="close-btn" type="button" @click="closeModal">×</button>
        </div>

        <div class="modal-body">
          <label class="form-item">
            <span>模型名字</span>
            <input v-model="form.name" type="text" placeholder="例如：gpt-4o-mini" />
          </label>
          <label class="form-item">
            <span>模型 URL</span>
            <input v-model="form.url" type="text" placeholder="例如：https://api.openai.com/v1/chat/completions" />
          </label>
          <label class="form-item">
            <span>模型 Key</span>
            <div class="key-input">
              <input v-model="form.key" :type="showFormKey ? 'text' : 'password'" placeholder="请输入 API Key" />
              <button class="link-btn" type="button" @click="showFormKey = !showFormKey">
                {{ showFormKey ? '密文' : '明文' }}
              </button>
            </div>
          </label>

          <div class="form-row">
            <label class="form-item">
              <span>状态</span>
              <select v-model="form.status">
                <option value="enabled">启用</option>
                <option value="disabled">禁用</option>
              </select>
            </label>
            <label class="form-item">
              <span>业务员账号</span>
              <select v-model="form.scope">
                <option value="all">所有的业务员</option>
                <option value="specific">指定业务员</option>
              </select>
            </label>
          </div>

          <div v-if="form.scope === 'specific'" class="sales-list">
            <label v-for="user in salesUsers" :key="user.id" class="sales-item">
              <input v-model="form.userIds" type="checkbox" :value="user.id" />
              <span>{{ user.name }}（{{ user.username }}）</span>
            </label>
          </div>

          <div v-if="testResult" class="test-result" :class="testResult.success ? 'success' : 'error'">
            {{ testResult.message }}
          </div>
        </div>

        <div class="modal-footer">
          <button class="cancel-btn" type="button" @click="closeModal">取消</button>
          <button class="test-btn" type="button" :disabled="testingId === 'form'" @click="handleTestForm">
            {{ testingId === 'form' ? '测试中' : '测试连通性' }}
          </button>
          <button class="confirm-btn" type="button" @click="handleSubmit">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAiModelStore, type AiModelConfig } from '@/stores/aiModel'
import { useAccountStore } from '@/stores/account'

const modelStore = useAiModelStore()
const accountStore = useAccountStore()

const showModal = ref(false)
const editingId = ref('')
const testingId = ref('')
const testResult = ref<{ success: boolean; message: string } | null>(null)
const showFormKey = ref(false)
const visibleKeyIds = ref<Set<string>>(new Set())
const form = ref({
  name: '',
  url: '',
  key: '',
  status: 'enabled' as AiModelConfig['status'],
  scope: 'all' as AiModelConfig['scope'],
  userIds: [] as string[]
})

const salesUsers = computed(() => accountStore.sales)

const resetForm = () => {
  form.value = {
    name: '',
    url: '',
    key: '',
    status: 'enabled',
    scope: 'all',
    userIds: []
  }
}

const handleAdd = () => {
  editingId.value = ''
  resetForm()
  testResult.value = null
  showFormKey.value = false
  showModal.value = true
}

const handleEdit = (model: AiModelConfig) => {
  editingId.value = model.id
  form.value = {
    name: model.name,
    url: model.url,
    key: model.key,
    status: model.status,
    scope: model.scope,
    userIds: [...model.userIds]
  }
  testResult.value = null
  showFormKey.value = false
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingId.value = ''
  testResult.value = null
  showFormKey.value = false
  resetForm()
}

const toggleKeyVisible = (id: string) => {
  const next = new Set(visibleKeyIds.value)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  visibleKeyIds.value = next
}

const validateModelFields = (model: Pick<AiModelConfig, 'name' | 'url' | 'key'>) => {
  if (!model.name.trim()) return '请输入模型名字'
  if (!model.url.trim()) return '请输入模型 URL'
  if (!model.key.trim()) return '请输入模型 Key'
  return ''
}

const getChatCompletionsUrl = (url: string) => {
  const trimmed = url.trim().replace(/\/+$/, '')
  return trimmed.endsWith('/chat/completions') ? trimmed : `${trimmed}/chat/completions`
}

const testModelConfig = async (model: Pick<AiModelConfig, 'name' | 'url' | 'key'>) => {
  const validationMessage = validateModelFields(model)
  if (validationMessage) {
    return { success: false, message: validationMessage }
  }

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 15000)

  try {
    const response = await fetch(getChatCompletionsUrl(model.url), {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${model.key.trim()}`
      },
      body: JSON.stringify({
        model: model.name.trim(),
        temperature: 0,
        max_tokens: 8,
        messages: [
          { role: 'user', content: 'ping' }
        ]
      })
    })

    const text = await response.text()
    if (!response.ok) {
      return {
        success: false,
        message: `连通失败：HTTP ${response.status}${text ? `，${text.slice(0, 120)}` : ''}`
      }
    }

    return { success: true, message: '连通成功，模型接口可用' }
  } catch (error) {
    const message = error instanceof Error && error.name === 'AbortError'
      ? '连通失败：请求超时'
      : `连通失败：${error instanceof Error ? error.message : '未知错误'}`
    return { success: false, message }
  } finally {
    window.clearTimeout(timer)
  }
}

const handleTestModel = async (model: AiModelConfig) => {
  testingId.value = model.id
  const result = await testModelConfig(model)
  testingId.value = ''
  alert(result.message)
}

const handleTestForm = async () => {
  testingId.value = 'form'
  testResult.value = await testModelConfig(form.value)
  testingId.value = ''
}

const handleSubmit = () => {
  if (!form.value.name.trim()) {
    alert('请输入模型名字')
    return
  }
  if (!form.value.url.trim()) {
    alert('请输入模型 URL')
    return
  }
  if (!form.value.key.trim()) {
    alert('请输入模型 Key')
    return
  }
  if (form.value.scope === 'specific' && form.value.userIds.length === 0) {
    alert('请选择指定业务员')
    return
  }

  const payload = {
    ...form.value,
    name: form.value.name.trim(),
    url: form.value.url.trim(),
    key: form.value.key.trim(),
    userIds: form.value.scope === 'all' ? [] : form.value.userIds
  }

  if (editingId.value) {
    modelStore.updateModel(editingId.value, payload)
  } else {
    modelStore.addModel(payload)
  }
  closeModal()
}

const handleDelete = (id: string) => {
  if (confirm('确定删除这个模型配置吗？')) {
    modelStore.deleteModel(id)
  }
}

const maskKey = (key: string) => {
  if (key.length <= 8) return '********'
  return `${key.slice(0, 4)}****${key.slice(-4)}`
}

const getScopeText = (model: AiModelConfig) => {
  if (model.scope === 'all') return '所有的业务员'
  const names = model.userIds
    .map(id => salesUsers.value.find(user => user.id === id)?.username)
    .filter(Boolean)
  return names.length > 0 ? names.join('、') : '未指定'
}
</script>

<style scoped>
.admin-models {
  width: 100%;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
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
  color: #242834;
  font-size: 22px;
}

.add-btn,
.confirm-btn {
  height: 38px;
  padding: 0 16px;
  border: 0;
  border-radius: 9px;
  background: linear-gradient(135deg, #e31837, #ff4d5a);
  color: #ffffff;
  font-weight: 800;
  cursor: pointer;
}

.tips {
  margin-bottom: 16px;
  padding: 12px 14px;
  display: flex;
  gap: 10px;
  border: 1px solid rgba(10, 166, 194, 0.22);
  border-radius: 12px;
  background: rgba(10, 166, 194, 0.06);
  color: #4b5563;
  font-size: 13px;
}

.tips strong {
  color: #0a6f83;
}

.model-table {
  overflow: hidden;
  border: 1px solid #e6e9f0;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 12px 34px rgba(17, 21, 33, 0.06);
}

.table-scroll {
  overflow-x: auto;
}

table {
  width: 100%;
  min-width: 980px;
  border-collapse: collapse;
}

thead {
  background: #f8f9fb;
}

th,
td {
  padding: 14px 12px;
  border-bottom: 1px solid #eef1f5;
  text-align: left;
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

.model-name {
  color: #e31837;
  font-weight: 900;
}

.url-cell {
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.key-cell,
.key-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.key-cell span {
  max-width: 190px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.key-input input {
  flex: 1;
  min-width: 0;
}

.link-btn {
  height: 28px;
  padding: 0 9px;
  border: 1px solid #dfe4ec;
  border-radius: 7px;
  background: #ffffff;
  color: #0a6f83;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  flex-shrink: 0;
}

.status-badge {
  padding: 4px 9px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 900;
}

.status-badge.enabled {
  background: rgba(22, 163, 74, 0.12);
  color: #16a34a;
}

.status-badge.disabled {
  background: rgba(107, 114, 128, 0.12);
  color: #6b7280;
}

.actions {
  display: flex;
  gap: 8px;
}

.edit-btn,
.test-btn,
.delete-btn,
.cancel-btn {
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.test-btn {
  border: 1px solid rgba(10, 166, 194, 0.24);
  background: rgba(10, 166, 194, 0.08);
  color: #0a6f83;
}

.test-btn:disabled {
  opacity: 0.58;
  cursor: not-allowed;
}

.edit-btn {
  border: 1px solid rgba(10, 166, 194, 0.24);
  background: rgba(10, 166, 194, 0.08);
  color: #0a6f83;
}

.delete-btn {
  border: 1px solid rgba(220, 38, 38, 0.22);
  background: rgba(220, 38, 38, 0.08);
  color: #dc2626;
}

.empty-state {
  padding: 42px 20px;
  color: #667085;
  text-align: center;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(17, 21, 33, 0.36);
}

.modal-content {
  width: min(680px, 92vw);
  max-height: 84vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  background: #ffffff;
}

.modal-header,
.modal-footer {
  padding: 18px 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #eef1f5;
}

.modal-header h2 {
  margin: 0;
  color: #ffffff;
  font-size: 18px;
}

.modal-header {
  background: linear-gradient(135deg, #e31837, #8b0a1e);
}

.close-btn {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
  font-size: 20px;
  cursor: pointer;
}

.modal-body {
  padding: 22px;
  overflow-y: auto;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.form-item {
  margin-bottom: 14px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  color: #667085;
  font-size: 13px;
  font-weight: 800;
}

.form-item input,
.form-item select {
  height: 40px;
  padding: 0 11px;
  border: 1px solid #dfe4ec;
  border-radius: 9px;
  background: #f8fafc;
  color: #242834;
  font-size: 14px;
  outline: none;
}

.sales-list {
  padding: 10px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  border: 1px solid #e6e9f0;
  border-radius: 12px;
  background: #f8fafc;
}

.sales-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #242834;
  font-size: 13px;
}

.test-result {
  margin-top: 14px;
  padding: 11px 12px;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.5;
}

.test-result.success {
  border: 1px solid rgba(22, 163, 74, 0.24);
  background: rgba(22, 163, 74, 0.08);
  color: #15803d;
}

.test-result.error {
  border: 1px solid rgba(220, 38, 38, 0.24);
  background: rgba(220, 38, 38, 0.08);
  color: #b91c1c;
}

.modal-footer {
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid #eef1f5;
  border-bottom: 0;
}

.cancel-btn {
  border: 1px solid #dfe4ec;
  background: #ffffff;
  color: #667085;
}
</style>
