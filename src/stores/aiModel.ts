import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export interface AiModelConfig {
  id: string
  name: string
  url: string
  key: string
  status: 'enabled' | 'disabled'
  scope: 'all' | 'specific'
  userIds: string[]
  createdAt: string
}

export const useAiModelStore = defineStore('ai-model', () => {
  const models = ref<AiModelConfig[]>([])

  const enabledModels = computed(() =>
    models.value.filter(model => model.status === 'enabled')
  )

  const addModel = (data: Omit<AiModelConfig, 'id' | 'createdAt'>) => {
    const model: AiModelConfig = {
      ...data,
      id: `model-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10)
    }
    models.value.unshift(model)
    return model
  }

  const updateModel = (id: string, data: Partial<AiModelConfig>) => {
    const index = models.value.findIndex(model => model.id === id)
    if (index === -1) return false
    models.value[index] = { ...models.value[index], ...data }
    return true
  }

  const deleteModel = (id: string) => {
    const index = models.value.findIndex(model => model.id === id)
    if (index === -1) return false
    models.value.splice(index, 1)
    return true
  }

  const getModelForUser = (userId?: string) => {
    if (!userId) {
      return enabledModels.value.find(model => model.scope === 'all') || null
    }

    return (
      enabledModels.value.find(model =>
        model.scope === 'specific' && model.userIds.includes(userId)
      ) ||
      enabledModels.value.find(model => model.scope === 'all') ||
      null
    )
  }

  return {
    models,
    enabledModels,
    addModel,
    updateModel,
    deleteModel,
    getModelForUser
  }
}, {
  persist: {
    key: 'snow-ai-model-store',
    storage: localStorage,
    paths: ['models']
  }
})
