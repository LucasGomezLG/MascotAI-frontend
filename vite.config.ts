import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // ✅ Permite el acceso desde otros dispositivos en la red local
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // ✅ Redirige las peticiones al backend Java
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    // ✅ Eleva el límite de advertencia a 1000kB para silenciar el aviso de Vite
    chunkSizeWarningLimit: 1000,
    
    // ✅ Divide las librerías grandes (como Recharts o Lucide) en archivos separados.
    // Esto mejora la carga y evita el aviso de "Large Chunks" en Vercel.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
})