<template>
  <div class="admin-page">
    <aside class="admin-sidebar">
      <div class="sidebar-header">
        <div class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32">
            <path d="M16 3l2.2 7.5 7.3-2.2-5.1 5.8 7.4 1.9-7.4 1.9 5.1 5.8-7.3-2.2L16 29l-2.2-7.5-7.3 2.2 5.1-5.8L4.2 16l7.4-1.9-5.1-5.8 7.3 2.2L16 3Z" />
          </svg>
        </div>
        <div>
          <p class="brand-kicker">Snow Promo</p>
          <h1>管理后台</h1>
        </div>
      </div>

      <nav class="sidebar-menu" aria-label="管理员导航">
        <button
          v-for="item in menuItems"
          :key="item.value"
          type="button"
          class="menu-item"
          :class="{ active: activeMenu === item.value }"
          @click="handleMenuChange(item.value)"
        >
          <span class="menu-icon" aria-hidden="true" v-html="item.icon"></span>
          <span class="menu-label">{{ item.label }}</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <div class="user-card">
          <div class="avatar" aria-hidden="true">{{ userInitial }}</div>
          <div>
            <div class="user-name">{{ userName || '管理员' }}</div>
            <div class="user-role">系统管理员</div>
          </div>
        </div>
        <button class="logout-btn" type="button" @click="handleLogout">退出登录</button>
      </div>
    </aside>

    <section class="admin-shell">
      <header class="admin-topbar">
        <div>
          <p class="topbar-kicker">Promotion Operations</p>
          <h2>{{ currentMenuTitle }}</h2>
        </div>
        <div class="topbar-meta">
          <span>促销品购物车系统</span>
          <strong>{{ userName || 'Admin' }}</strong>
        </div>
      </header>

      <main class="admin-content">
        <router-view />
      </main>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const userName = computed(() => authStore.userName)
const userInitial = computed(() => (userName.value || 'A').slice(0, 1).toUpperCase())

const icons = {
  products: '<svg viewBox="0 0 24 24"><path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"/><path d="m4.5 8 7.5 4.2L19.5 8"/><path d="M12 12.2V21"/></svg>',
  warehouses: '<svg viewBox="0 0 24 24"><path d="M3 21h18"/><path d="M5 21V8l7-5 7 5v13"/><path d="M9 21v-7h6v7"/><path d="M9 10h.01M15 10h.01"/></svg>',
  accounts: '<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  orders: '<svg viewBox="0 0 24 24"><path d="M8 2h8l2 4H6l2-4Z"/><path d="M6 6h12v16H6z"/><path d="M9 11h6M9 15h6"/></svg>',
  models: '<svg viewBox="0 0 24 24"><path d="M12 2a4 4 0 0 1 4 4v1h1a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4h-1v1a4 4 0 0 1-4 4 4 4 0 0 1-4-4v-1H7a4 4 0 0 1-4-4v-2a4 4 0 0 1 4-4h1V6a4 4 0 0 1 4-4Z"/><path d="M9 9h6v6H9z"/></svg>',
  skills: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M9 15h6"/><path d="M9 11h2"/></svg>'
}

const menuItems = [
  { value: 'products', label: '促销品管理', icon: icons.products },
  { value: 'warehouses', label: '仓储管理', icon: icons.warehouses },
  { value: 'accounts', label: '账号管理', icon: icons.accounts },
  { value: 'orders', label: '需求单管理', icon: icons.orders },
  { value: 'models', label: '模型管理', icon: icons.models },
  { value: 'skills', label: 'Skill 管理', icon: icons.skills }
]

const activeMenu = computed(() => {
  const path = route.path.split('/').pop()
  return path || 'products'
})

const currentMenuTitle = computed(() => {
  return menuItems.find(item => item.value === activeMenu.value)?.label || '管理后台'
})

const handleMenuChange = (value: string) => {
  router.push(`/admin/${value}`)
}

const handleLogout = () => {
  authStore.logout()
  router.push('/')
}
</script>

<style scoped>
.admin-page {
  --admin-bg: #f4f6fa;
  --sidebar-bg: #111521;
  --sidebar-panel: #191f2d;
  --text-main: #161923;
  --text-muted: #717785;
  --brand-red: #e31837;
  --brand-red-dark: #b8142c;
  --line: #e5e8ef;
  width: 100vw;
  height: 100vh;
  display: flex;
  background: var(--admin-bg);
  color: var(--text-main);
}

.admin-sidebar {
  width: 264px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background:
    linear-gradient(180deg, rgba(227, 24, 55, 0.16), transparent 32%),
    var(--sidebar-bg);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.sidebar-header {
  padding: 28px 22px 22px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand-mark {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--brand-red), var(--brand-red-dark));
  box-shadow: 0 14px 30px rgba(227, 24, 55, 0.28);
}

.brand-mark svg {
  width: 28px;
  height: 28px;
  fill: #ffffff;
}

.brand-kicker,
.topbar-kicker {
  margin: 0 0 5px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.brand-kicker {
  color: rgba(255, 255, 255, 0.52);
}

.sidebar-header h1,
.admin-topbar h2 {
  margin: 0;
}

.sidebar-header h1 {
  font-size: 19px;
  line-height: 1.2;
}

.sidebar-menu {
  flex: 1;
  padding: 10px 14px;
  overflow-y: auto;
}

.menu-item {
  width: 100%;
  height: 46px;
  margin-bottom: 6px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: rgba(255, 255, 255, 0.74);
  cursor: pointer;
  text-align: left;
  transition: background 0.2s, color 0.2s, transform 0.2s;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.07);
  color: #ffffff;
}

.menu-item.active {
  background: #ffffff;
  color: var(--brand-red);
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.2);
}

.menu-icon {
  width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.menu-icon :deep(svg) {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.menu-label {
  font-size: 14px;
  font-weight: 700;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.user-card {
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 12px;
  background: var(--sidebar-panel);
}

.avatar {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  font-weight: 800;
}

.user-name {
  color: #ffffff;
  font-size: 14px;
  font-weight: 800;
}

.user-role {
  margin-top: 2px;
  color: rgba(255, 255, 255, 0.48);
  font-size: 12px;
}

.logout-btn {
  width: 100%;
  height: 40px;
  margin-top: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.86);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

.logout-btn:hover {
  background: rgba(227, 24, 55, 0.18);
  border-color: rgba(227, 24, 55, 0.42);
}

.admin-shell {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.admin-topbar {
  min-height: 78px;
  padding: 0 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(18px);
}

.topbar-kicker {
  color: var(--brand-red);
}

.admin-topbar h2 {
  font-size: 24px;
  line-height: 1.2;
}

.topbar-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-muted);
  font-size: 13px;
}

.topbar-meta strong {
  padding: 7px 10px;
  border-radius: 999px;
  background: #ffffff;
  color: var(--text-main);
  box-shadow: 0 8px 22px rgba(17, 21, 33, 0.08);
}

.admin-content {
  flex: 1;
  min-width: 0;
  padding: 24px 30px 30px;
  overflow-y: auto;
}

.admin-content :deep(.page-header) {
  margin-bottom: 18px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 12px 34px rgba(17, 21, 33, 0.06);
}

.admin-content :deep(.page-header h1) {
  color: var(--text-main);
  font-size: 22px;
}

.admin-content :deep(.filter-bar) {
  margin-bottom: 18px;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: #ffffff;
}

.admin-content :deep(.search-input),
.admin-content :deep(.filter-select),
.admin-content :deep(.form-select),
.admin-content :deep(.form-item input) {
  height: 40px;
  padding: 0 12px;
  background: #f8f9fb;
  border: 1px solid #dde2eb;
  border-radius: 8px;
  color: var(--text-main);
  font-size: 14px;
  outline: none;
}

.admin-content :deep(.search-input) {
  width: min(260px, 100%);
}

.admin-content :deep(.filter-select) {
  width: 128px;
}

.admin-content :deep(.search-input:focus),
.admin-content :deep(.filter-select:focus),
.admin-content :deep(.form-select:focus),
.admin-content :deep(.form-item input:focus) {
  border-color: var(--brand-red);
  box-shadow: 0 0 0 3px rgba(227, 24, 55, 0.08);
}

.admin-content :deep(.search-input::placeholder),
.admin-content :deep(.form-item input::placeholder) {
  color: #9aa1ad;
}

.admin-content :deep(.product-table),
.admin-content :deep(.order-table),
.admin-content :deep(.warehouse-table),
.admin-content :deep(.account-table),
.admin-content :deep(.orders-list) {
  border: 1px solid var(--line);
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 12px 34px rgba(17, 21, 33, 0.06);
  overflow: hidden;
}

.admin-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
}

.admin-content :deep(thead) {
  background: #f8f9fb;
}

.admin-content :deep(th) {
  padding: 14px 12px;
  color: #667085;
  font-size: 13px;
  font-weight: 700;
  text-align: left;
  border-bottom-color: var(--line);
}

.admin-content :deep(td) {
  padding: 14px 12px;
  color: #242834;
  font-size: 14px;
  border-bottom-color: #eef1f5;
}

.admin-content :deep(tbody tr:hover) {
  background: #fbfcfe;
}

.admin-content :deep(.add-btn),
.admin-content :deep(.confirm-btn) {
  min-height: 36px;
  padding: 0 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--brand-red), #ff4d5a);
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 10px 22px rgba(227, 24, 55, 0.18);
}

.admin-content :deep(.actions) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.admin-content :deep(.edit-btn),
.admin-content :deep(.delete-btn),
.admin-content :deep(.reset-btn),
.admin-content :deep(.cancel-btn) {
  min-height: 30px;
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.admin-content :deep(.edit-btn) {
  border: 1px solid rgba(227, 24, 55, 0.26);
  background: rgba(227, 24, 55, 0.08);
  color: var(--brand-red);
}

.admin-content :deep(.reset-btn) {
  border: 1px solid rgba(217, 119, 6, 0.26);
  background: rgba(245, 158, 11, 0.1);
  color: #b45309;
}

.admin-content :deep(.delete-btn) {
  border: 1px solid rgba(220, 38, 38, 0.24);
  background: rgba(220, 38, 38, 0.08);
  color: #dc2626;
}

.admin-content :deep(.cancel-btn) {
  border: 1px solid #d8dde7;
  background: #ffffff;
  color: #596273;
}

.admin-content :deep(.role-tag),
.admin-content :deep(.status-tag) {
  min-height: 24px;
  padding: 0 9px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.admin-content :deep(.role-tag.admin) {
  background: rgba(227, 24, 55, 0.1);
  color: var(--brand-red);
}

.admin-content :deep(.role-tag.user),
.admin-content :deep(.status-tag.active) {
  background: rgba(22, 163, 74, 0.1);
  color: #15803d;
}

.admin-content :deep(.status-tag.disabled) {
  background: rgba(100, 116, 139, 0.12);
  color: #64748b;
}

.admin-content :deep(.modal-content) {
  background: #ffffff;
  color: var(--text-main);
  box-shadow: 0 24px 80px rgba(17, 21, 33, 0.22);
}

.admin-content :deep(.modal-header) {
  background: linear-gradient(135deg, var(--brand-red), var(--brand-red-dark));
}

.admin-content :deep(.modal-footer) {
  border-top-color: var(--line);
}

@media (max-width: 900px) {
  .admin-page {
    flex-direction: column;
    min-width: 0;
    height: 100dvh;
    overflow: hidden;
  }

  .admin-sidebar {
    width: 100%;
    height: auto;
    flex-shrink: 0;
  }

  .sidebar-header,
  .sidebar-footer {
    display: none;
  }

  .sidebar-menu {
    display: flex;
    gap: 8px;
    padding: 10px;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .sidebar-menu::-webkit-scrollbar {
    display: none;
  }

  .menu-item {
    width: auto;
    min-width: 116px;
    margin-bottom: 0;
    justify-content: center;
  }

  .admin-topbar {
    min-height: 68px;
    padding: 0 18px;
  }

  .topbar-meta {
    display: none;
  }

  .admin-content {
    padding: 16px;
    overflow-x: hidden;
  }

  .admin-content :deep(.page-header) {
    align-items: stretch;
    flex-direction: column;
  }

  .admin-content :deep(.filter-bar) {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .admin-content :deep(.search-input),
  .admin-content :deep(.filter-select) {
    width: 100%;
  }

  .admin-content :deep(.product-table),
  .admin-content :deep(.order-table),
  .admin-content :deep(.warehouse-table),
  .admin-content :deep(.account-table) {
    overflow-x: auto;
  }

  .admin-content :deep(table) {
    min-width: 720px;
  }
}

@media (max-width: 520px) {
  .admin-shell {
    min-height: 0;
  }

  .admin-topbar {
    min-height: 58px;
    padding: 0 12px;
  }

  .admin-topbar h2 {
    font-size: 20px;
  }

  .topbar-kicker {
    display: none;
  }

  .sidebar-menu {
    padding: 8px 10px;
  }

  .menu-item {
    min-width: 96px;
    height: 42px;
    padding: 0 10px;
  }

  .menu-label {
    font-size: 13px;
  }

  .admin-content {
    padding: 12px;
  }

  .admin-content :deep(.page-header) {
    padding: 14px;
    border-radius: 12px;
  }

  .admin-content :deep(.page-header h1) {
    font-size: 20px;
  }

  .admin-content :deep(.actions) {
    min-width: 220px;
  }

  .admin-content :deep(.modal-content) {
    width: calc(100vw - 20px);
    max-height: 88dvh;
    border-radius: 14px;
  }

  .admin-content :deep(.modal-body) {
    max-height: calc(88dvh - 130px);
  }
}
</style>
