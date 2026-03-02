import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/sh-d-/',  // GitHub Pages 项目路径，必须用绝对路径
  plugins: [vue()],
})
