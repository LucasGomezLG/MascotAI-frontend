import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext' // Importamos el proveedor

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider> {/* Envolvemos la App para que useAuth() funcione */}
      <App />
    </AuthProvider>
  </StrictMode>,
)

// Mantenemos tu registro de PWA para que MascotAI funcione como app nativa en tu Xiaomi
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('MascotAI PWA Activa', reg))
      .catch(err => console.log('Error en PWA', err));
  });
}