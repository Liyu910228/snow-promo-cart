import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import TDesign from 'tdesign-vue-next'
import 'tdesign-vue-next/es/style/index.css'
import App from './App.vue'
import router from './router'
import './styles/index.scss'

const app = createApp(App)

// Pinia 状态管理
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)

// TDesign 组件库
app.use(TDesign)

// 路由
app.use(router)

app.mount('#app')
