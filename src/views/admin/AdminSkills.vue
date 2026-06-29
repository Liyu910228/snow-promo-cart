<template>
  <div class="admin-skills">
    <div class="page-header">
      <div>
        <h1>Skill 管理</h1>
        <p>维护项目内可见的 skills 目录，支持预览和编辑 SKILL.md、openai.yaml 与 references。</p>
      </div>
      <button class="add-btn" type="button" @click="loadTree">刷新文件</button>
    </div>

    <div class="skill-status">
      <div>
        <span class="status-kicker">当前目录</span>
        <strong>{{ treeRootPath || '/opt/snow-promo-cart/skills' }}</strong>
      </div>
      <div class="status-count">
        <strong>{{ fileCount }}</strong>
        <span>文件数</span>
      </div>
    </div>

    <div class="skill-workbench">
      <aside class="skill-tree-panel">
        <div class="panel-title">智能体文件</div>
        <div class="tree-root">skills</div>
        <div v-if="isLoadingTree" class="tree-empty">正在加载目录...</div>
        <div v-else-if="flatNodes.length === 0" class="tree-empty">暂无 skill 文件</div>
        <button
          v-for="node in flatNodes"
          :key="node.path"
          type="button"
          class="tree-node"
          :class="{ file: node.type === 'file', active: selectedPath === node.path }"
          :style="{ paddingLeft: `${16 + node.depth * 18}px` }"
          @click="handleNodeClick(node)"
        >
          <span class="node-icon">{{ node.type === 'directory' ? '▾' : '◇' }}</span>
          <span class="node-name">{{ node.name }}</span>
        </button>
      </aside>

      <section class="skill-editor-panel">
        <header class="editor-header">
          <div>
            <span class="status-kicker">文件</span>
            <h2>{{ selectedPath || '请选择一个 Skill 文件' }}</h2>
          </div>
          <button
            class="save-btn"
            type="button"
            :disabled="!selectedPath || isSaving"
            @click="saveFile"
          >
            {{ isSaving ? '保存中...' : '保存 Skill 文件' }}
          </button>
        </header>

        <textarea
          v-model="editorContent"
          class="skill-editor"
          spellcheck="false"
          :placeholder="selectedPath ? '文件内容加载中...' : '从左侧选择 SKILL.md 或 references 文件后在这里编辑。'"
        />

        <footer class="editor-footer">
          <span>{{ editorContent.length }} 字符</span>
          <span v-if="message">{{ message }}</span>
        </footer>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

interface SkillNode {
  name: string
  path: string
  type: 'directory' | 'file'
  children?: SkillNode[]
}

interface FlatSkillNode extends SkillNode {
  depth: number
}

const apiBase = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api`

const tree = ref<SkillNode[]>([])
const treeRootPath = ref('')
const selectedPath = ref('')
const editorContent = ref('')
const isLoadingTree = ref(false)
const isSaving = ref(false)
const message = ref('')

const flattenTree = (nodes: SkillNode[], depth = 0): FlatSkillNode[] => {
  return nodes.flatMap(node => [
    { ...node, depth },
    ...(node.children ? flattenTree(node.children, depth + 1) : [])
  ])
}

const flatNodes = computed(() => flattenTree(tree.value))
const fileCount = computed(() => flatNodes.value.filter(node => node.type === 'file').length)

const loadTree = async () => {
  isLoadingTree.value = true
  message.value = ''
  try {
    const response = await fetch(`${apiBase}/skills/tree`, { cache: 'no-store' })
    if (!response.ok) throw new Error('目录加载失败')
    const data = await response.json()
    tree.value = data.tree || []
    treeRootPath.value = data.path || ''
  } catch (error) {
    message.value = error instanceof Error ? error.message : '目录加载失败'
  } finally {
    isLoadingTree.value = false
  }
}

const loadFile = async (path: string) => {
  message.value = ''
  selectedPath.value = path
  editorContent.value = ''
  try {
    const response = await fetch(`${apiBase}/skills/file?path=${encodeURIComponent(path)}`, {
      cache: 'no-store'
    })
    if (!response.ok) throw new Error('文件读取失败')
    const data = await response.json()
    editorContent.value = data.content || ''
  } catch (error) {
    message.value = error instanceof Error ? error.message : '文件读取失败'
  }
}

const handleNodeClick = (node: FlatSkillNode) => {
  if (node.type === 'file') {
    loadFile(node.path)
  }
}

const saveFile = async () => {
  if (!selectedPath.value) return
  isSaving.value = true
  message.value = ''
  try {
    const response = await fetch(`${apiBase}/skills/file`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: selectedPath.value,
        content: editorContent.value
      })
    })
    if (!response.ok) throw new Error('保存失败')
    message.value = '已保存'
    await loadTree()
  } catch (error) {
    message.value = error instanceof Error ? error.message : '保存失败'
  } finally {
    isSaving.value = false
  }
}

onMounted(loadTree)
</script>

<style scoped>
.admin-skills {
  width: 100%;
}

.page-header p {
  margin: 6px 0 0;
  color: #717785;
  font-size: 14px;
}

.skill-status {
  margin-bottom: 18px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #dfe4ed;
  border-radius: 14px;
  background: #f7fbf8;
}

.status-kicker {
  display: block;
  margin-bottom: 6px;
  color: #4f8b69;
  font-size: 12px;
  font-weight: 800;
}

.skill-status strong {
  color: #151923;
  font-size: 17px;
}

.status-count {
  min-width: 110px;
  padding: 14px;
  display: grid;
  gap: 3px;
  justify-items: center;
  border: 1px solid #e5e8ef;
  border-radius: 12px;
  background: #ffffff;
}

.status-count strong {
  font-size: 26px;
}

.status-count span {
  color: #717785;
  font-size: 13px;
}

.skill-workbench {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 18px;
  min-height: 590px;
}

.skill-tree-panel,
.skill-editor-panel {
  border: 1px solid #e5e8ef;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 12px 34px rgba(17, 21, 33, 0.06);
}

.skill-tree-panel {
  padding: 14px;
  overflow: auto;
}

.panel-title {
  margin-bottom: 4px;
  color: #151923;
  font-size: 15px;
  font-weight: 800;
}

.tree-root {
  margin-bottom: 10px;
  color: #8a93a3;
  font-size: 12px;
}

.tree-empty {
  padding: 18px 12px;
  color: #8a93a3;
  font-size: 14px;
}

.tree-node {
  width: 100%;
  height: 36px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #4b5565;
  cursor: default;
  text-align: left;
}

.tree-node.file {
  cursor: pointer;
}

.tree-node.file:hover,
.tree-node.active {
  background: #eaf5ff;
  color: #0f3b63;
}

.node-icon {
  width: 16px;
  color: #7c8798;
  font-size: 13px;
}

.node-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 700;
}

.skill-editor-panel {
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-header {
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #e5e8ef;
}

.editor-header h2 {
  margin: 0;
  color: #151923;
  font-size: 17px;
}

.save-btn {
  min-height: 38px;
  padding: 0 16px;
  border: 1px solid #d8dde7;
  border-radius: 9px;
  background: #ffffff;
  color: #151923;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.skill-editor {
  flex: 1;
  width: 100%;
  min-height: 470px;
  padding: 18px;
  border: 0;
  resize: vertical;
  outline: none;
  background: #0f1724;
  color: #e5edf7;
  font-family: Consolas, 'SFMono-Regular', Menlo, Monaco, monospace;
  font-size: 14px;
  line-height: 1.65;
}

.skill-editor::placeholder {
  color: #8a93a3;
}

.editor-footer {
  min-height: 48px;
  padding: 0 18px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-top: 1px solid #e5e8ef;
  color: #717785;
  font-size: 13px;
}

@media (max-width: 980px) {
  .skill-workbench {
    grid-template-columns: 1fr;
  }

  .skill-tree-panel {
    max-height: 320px;
  }
}
</style>
