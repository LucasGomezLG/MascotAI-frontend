import axios from 'axios';

// 1. URL del servidor (la raíz para el login de Google)
export const SERVER_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// 2. Base de tus endpoints (con el prefijo de tu app)
export const API_BASE = `${SERVER_URL}/api/mascotas`;

// CONFIGURACIÓN GLOBAL DE AXIOS
// Esto permite que el JSESSIONID se guarde en el navegador aunque uses dominios distintos
axios.defaults.withCredentials = true;

export const api = {
  // --- PERFILES Y MASCOTAS ---
  getPerfiles: () => axios.get(`${API_BASE}/perfiles`),
  getMascotas: () => axios.get(`${API_BASE}/perfiles`),
  guardarPerfil: (data: any) => axios.post(`${API_BASE}/guardar-perfil`, data),
  borrarMascota: (id: string) => axios.delete(`${API_BASE}/perfiles/${id}`),

  // --- IA Y ANÁLISIS (GEMINI) ---
  analizarAlimento: (image: string, mascotaId: string) =>
    axios.post(`${API_BASE}/analizar-personalizado`, { image, mascotaId }),
  analizarVet: (image: string, tipo: string, mascotaId: string) =>
    axios.post(`${API_BASE}/analizar-veterinario`, { image, tipo, mascotaId }),
  analizarSalud: (image: string, mascotaId: string) =>
    axios.post(`${API_BASE}/analizar-salud`, { image, mascotaId }),
  analizarReceta: (image: string, mascotaId: string) =>
    axios.post(`${API_BASE}/analizar-receta`, { image, mascotaId }),

  // --- HISTORIALES ---
  getHistorial: () => axios.get(`${API_BASE}/historial`),
  getHistorialVet: () => axios.get(`${API_BASE}/historial-vet`),
  getHistorialSalud: (mascotaId: string) => axios.get(`${API_BASE}/historial-salud/${mascotaId}`),
  borrarConsultaVet: (id: string) => axios.delete(`${API_BASE}/consulta-vet/${id}`),

  // --- STOCK E INTELIGENCIA ---
  getStockStatus: (mascotaId: string) => axios.get(`${API_BASE}/stock-status/${mascotaId}`),
  activarStock: (id: string) => axios.post(`${API_BASE}/activar-stock/${id}`),
  buscarPrecios: (marca: string) => axios.get(`${API_BASE}/buscar-precios/${marca}`),
  buscarResenas: (marca: string) => axios.get(`${API_BASE}/buscar-resenas/${encodeURIComponent(marca)}`),

  // --- SALUD PREVENTIVA Y ALERTAS ---
  getAlertasSalud: () => axios.get(`${API_BASE}/alertas-salud`),
  getAlertasSistema: () => axios.get(`${API_BASE}/alertas-sistema`),
  marcarAlertaLeida: (id: string) => axios.put(`${API_BASE}/alertas-sistema/${id}/leer`),
  guardarEventoSalud: (data: any) => axios.post(`${API_BASE}/guardar-salud`, data),
  borrarEventoSalud: (id: string) => axios.delete(`${API_BASE}/salud/${id}`),
  actualizarEventoSalud: (id: string, data: any) => axios.put(`${API_BASE}/salud/${id}`, data),

  // --- FINANZAS ---
  guardarFinanzas: (data: any) => axios.post(`${API_BASE}/guardar-finanzas`, data),
  getPresupuestoMensual: () => axios.get(`${API_BASE}/presupuesto-mensual`),
  comparar: (ids: string[]) => axios.post(`${API_BASE}/comparar`, { ids }),

  // --- VETERINARIO Y RECETAS ---
  guardarConsultaVet: (data: any) => axios.post(`${API_BASE}/analizar-veterinario`, data),
  guardarReceta: (data: any) => axios.post(`${API_BASE}/guardar-receta`, data),

  // --- AUTENTICACIÓN Y PERFIL ---
  getUserProfile: () => axios.get(`${API_BASE}/user/me`),
  logout: () => axios.post(`${API_BASE}/logout`),
  // En api.ts
  borrarAlimento: (id: string) => axios.delete(`${API_BASE}/historial/${id}`),
};