import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: process.env.VITE_BASE_PATH || '/',
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  
  server: {
    port: 8080,
    host: '0.0.0.0',
    open: false,
    cors: true,
    strictPort: false, // 如果端口被占用，自动尝试下一个可用端口
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    },
    hmr: {
      clientPort: 8080
    }
  },
  
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/variables.scss" as *;`,
        api: 'modern-compiler' // 使用现代编译器 API，避免废弃警告
      }
    }
  }
})
