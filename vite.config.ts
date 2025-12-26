import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Para que el celu lo vea
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // Vite le pasa el pedido a Java internamente
        changeOrigin: true,
        secure: false,
      }
    }
  }
})