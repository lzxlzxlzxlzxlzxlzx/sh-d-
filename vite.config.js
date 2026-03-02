import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/sh-d-/',  // GitHub Pages 项目页面的 base 路径
  plugins: [vue()],
})
