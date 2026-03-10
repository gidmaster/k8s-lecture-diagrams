import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Замени 'k8s-lecture-diagrams' на имя твоего GitHub репозитория
export default defineConfig({
  plugins: [react()],
  base: '/k8s-lecture-diagrams/',
})
