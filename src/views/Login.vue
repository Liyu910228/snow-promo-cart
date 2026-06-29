<template>
  <main class="login-page">
    <section class="brand-panel" aria-label="系统介绍">
      <div class="brand-header">
        <div class="brand-mark">
          <svg viewBox="0 0 40 40" aria-hidden="true">
            <path
              d="M20 4l2.6 9.1 8.9-2.7-6.3 7.1 9 2.5-9 2.5 6.3 7.1-8.9-2.7L20 36l-2.6-9.1-8.9 2.7 6.3-7.1-9-2.5 9-2.5-6.3-7.1 8.9 2.7L20 4Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div>
          <p class="brand-kicker">Snow Beer</p>
          <h1>雪花促销品系统</h1>
        </div>
      </div>

      <div class="brand-copy">
        <p>统一管理促销品选品、库存、拼单与审批，让业务团队更快完成物料申领。</p>
      </div>

      <div class="feature-grid">
        <div class="feature-item">
          <span class="feature-value">SKU</span>
          <span class="feature-label">促销品目录</span>
        </div>
        <div class="feature-item">
          <span class="feature-value">MOQ</span>
          <span class="feature-label">拼单进度</span>
        </div>
        <div class="feature-item">
          <span class="feature-value">MSQ</span>
          <span class="feature-label">仓储发货</span>
        </div>
      </div>
    </section>

    <section class="form-panel" aria-label="登录表单">
      <div class="login-card">
        <div class="card-heading">
          <p class="eyebrow">Account Login</p>
          <h2>欢迎回来</h2>
          <p>登录后继续管理促销品申领与订单审批。</p>
        </div>

        <form class="login-form" @submit.prevent="handleLogin">
          <label class="field">
            <span>账号</span>
            <input
              v-model="username"
              type="text"
              placeholder="请输入账号"
              autocomplete="username"
            />
          </label>

          <label class="field">
            <span>密码</span>
            <div class="password-field">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请输入密码"
                autocomplete="current-password"
              />
              <button
                type="button"
                class="toggle-password"
                :aria-label="showPassword ? '隐藏密码' : '显示密码'"
                @click="showPassword = !showPassword"
              >
                <svg v-if="showPassword" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 3l18 18" />
                  <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                  <path d="M9.5 5.4A8.8 8.8 0 0 1 12 5c5 0 8.5 4.2 9.7 6a10.9 10.9 0 0 1-2.1 2.6" />
                  <path d="M6.3 6.7A11.8 11.8 0 0 0 2.3 12C3.5 13.8 7 18 12 18a8.9 8.9 0 0 0 4.1-1" />
                </svg>
                <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M2.3 12S5.8 5 12 5s9.7 7 9.7 7-3.5 7-9.7 7-9.7-7-9.7-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
          </label>

          <button type="submit" class="login-btn" :disabled="loading">
            <span>{{ loading ? '登录中...' : '登录系统' }}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h14" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          </button>
        </form>

        <div class="demo-accounts" aria-label="演示账号">
          <div class="demo-row">
            <span class="demo-role">管理员</span>
            <code>admin / admin</code>
          </div>
          <div class="demo-row">
            <span class="demo-role">业务员</span>
            <code>root / 12345</code>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAccountStore } from '@/stores/account'
import { fetchSharedState } from '@/utils/sharedData'

const router = useRouter()
const authStore = useAuthStore()
const accountStore = useAccountStore()

const username = ref('')
const password = ref('')
const loading = ref(false)
const showPassword = ref(false)

const refreshAccountsBeforeLogin = async () => {
  const sharedState = await fetchSharedState()
  if (sharedState?.accounts?.length) {
    accountStore.accounts = sharedState.accounts
  }
}

const handleLogin = async () => {
  if (!username.value.trim()) {
    alert('请输入账号')
    return
  }
  if (!password.value.trim()) {
    alert('请输入密码')
    return
  }

  loading.value = true

  try {
    await refreshAccountsBeforeLogin()
    const result = authStore.login(username.value, password.value)

    if (result.success) {
      if (authStore.userRole === 'admin') {
        router.push('/admin/products')
      } else {
        router.push('/home')
      }
    } else {
      alert(result.message)
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  --brand-red: #e31837;
  --brand-red-dark: #b8142c;
  --ice-blue: #00d9ff;
  --ink: #15161c;
  --muted: #737684;
  --line: #e8e9ee;
  width: 100vw;
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(360px, 1fr) minmax(420px, 560px);
  background:
    radial-gradient(circle at 12% 16%, rgba(0, 217, 255, 0.18), transparent 30%),
    linear-gradient(135deg, #f7f8fb 0%, #eef1f6 50%, #fdfdfd 100%);
  color: var(--ink);
  overflow: hidden;
}

.brand-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 56px;
  color: #ffffff;
  background:
    linear-gradient(135deg, rgba(15, 18, 28, 0.84), rgba(19, 25, 40, 0.72)),
    url('https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=1600&q=80');
  background-size: cover;
  background-position: center;
}

.brand-panel::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(227, 24, 55, 0.16), transparent 42%),
    linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.24) 100%);
  pointer-events: none;
}

.brand-header,
.brand-copy,
.feature-grid {
  position: relative;
  z-index: 1;
}

.brand-header {
  display: flex;
  align-items: center;
  gap: 18px;
}

.brand-mark {
  width: 64px;
  height: 64px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.12);
  color: var(--ice-blue);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.24);
}

.brand-mark svg {
  width: 38px;
  height: 38px;
  filter: drop-shadow(0 0 14px rgba(0, 217, 255, 0.55));
}

.brand-kicker {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.68);
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  font-size: 32px;
  font-weight: 800;
}

.brand-copy {
  max-width: 560px;
  margin-top: auto;
  padding: 80px 0;
}

.brand-copy p {
  font-size: 34px;
  line-height: 1.35;
  font-weight: 700;
  text-wrap: balance;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.feature-item {
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
}

.feature-value,
.feature-label {
  display: block;
}

.feature-value {
  margin-bottom: 8px;
  font-size: 20px;
  font-weight: 800;
  color: var(--ice-blue);
}

.feature-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.76);
}

.form-panel {
  display: grid;
  place-items: center;
  padding: 48px;
}

.login-card {
  width: min(100%, 420px);
  padding: 38px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 28px 80px rgba(28, 32, 44, 0.14);
  backdrop-filter: blur(20px);
}

.card-heading {
  margin-bottom: 30px;
}

.eyebrow {
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--brand-red);
}

h2 {
  margin-bottom: 10px;
  font-size: 30px;
  line-height: 1.2;
}

.card-heading p:last-child {
  color: var(--muted);
  font-size: 14px;
  line-height: 1.7;
}

.login-form {
  display: grid;
  gap: 18px;
}

.field {
  display: grid;
  gap: 8px;
  color: #363946;
  font-size: 14px;
  font-weight: 700;
}

input {
  width: 100%;
  height: 48px;
  padding: 0 15px;
  border: 1px solid var(--line);
  border-radius: 12px;
  outline: none;
  background: #ffffff;
  color: var(--ink);
  font-size: 15px;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}

input::placeholder {
  color: #a5a8b3;
}

input:focus {
  border-color: rgba(227, 24, 55, 0.72);
  box-shadow: 0 0 0 4px rgba(227, 24, 55, 0.1);
}

.password-field {
  position: relative;
}

.password-field input {
  padding-right: 50px;
}

.toggle-password {
  position: absolute;
  right: 8px;
  top: 50%;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #797d8a;
  cursor: pointer;
  transform: translateY(-50%);
  transition: background 0.2s, color 0.2s;
}

.toggle-password:hover {
  background: #f1f2f5;
  color: var(--brand-red);
}

.toggle-password svg,
.login-btn svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.login-btn {
  width: 100%;
  height: 50px;
  margin-top: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 0;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--brand-red), var(--brand-red-dark));
  color: #ffffff;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 14px 28px rgba(227, 24, 55, 0.24);
  transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 18px 34px rgba(227, 24, 55, 0.3);
}

.login-btn:disabled {
  cursor: not-allowed;
  opacity: 0.64;
  transform: none;
}

.demo-accounts {
  margin-top: 26px;
  padding: 16px;
  display: grid;
  gap: 10px;
  border: 1px solid #eceef3;
  border-radius: 14px;
  background: #fafbfc;
}

.demo-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--muted);
  font-size: 13px;
}

.demo-role {
  padding: 4px 9px;
  border-radius: 999px;
  background: #ffffff;
  color: #4e5260;
  font-weight: 700;
}

code {
  color: #30333d;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
}

@media (max-width: 900px) {
  .login-page {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }

  .brand-panel {
    min-height: 340px;
    padding: 34px 24px;
  }

  .brand-copy {
    padding: 46px 0 34px;
  }

  .brand-copy p {
    font-size: 26px;
  }

  .form-panel {
    padding: 24px;
  }

  .login-card {
    padding: 28px 22px;
    border-radius: 20px;
  }
}

@media (max-width: 520px) {
  .brand-header {
    align-items: flex-start;
  }

  .brand-mark {
    width: 54px;
    height: 54px;
    border-radius: 16px;
  }

  h1 {
    font-size: 24px;
  }

  h2 {
    font-size: 26px;
  }

  .feature-grid {
    grid-template-columns: 1fr;
  }

  .feature-item {
    padding: 14px;
  }
}
</style>
