import axios from 'axios';

// --- CONFIGURACIÓN BASE ---
// En producción, asegúrate de tener VITE_API_BASE_URL en tu .env
export const SERVER_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
export const API_BASE = `${SERVER_URL}/api/mascotas`;

// Configuración global de axios para manejo de cookies/sesión
axios.defaults.withCredentials = true;

// Creamos la instancia que usaremos en toda la app
export const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true
});

export const api = {
  // ==========================================
  // 🐾 GESTIÓN DE PERFILES Y MASCOTAS
  // ==========================================
  getPerfiles: () => apiClient.get('/perfiles'),
  getMascotas: () => apiClient.get('/perfiles'),

  guardarPerfil: (data: any) => apiClient.post('/guardar-perfil', data),

  guardarPerfilConFoto: (formData: FormData) => {
    // Dejamos que Axios maneje el boundary del multipart/form-data automáticamente
    return apiClient.post('/con-foto', formData);
  },

  borrarMascota: (id: string) => apiClient.delete(`/perfiles/${id}`),

  // ==========================================
  // 🤖 MÓDULOS DE ANÁLISIS E IA
  // ==========================================
  analizarAlimento: (image: string, mascotaId: string) =>
    apiClient.post('/analizar-personalizado', { image, mascotaId }),

  analizarVet: (image: string, tipo: string, mascotaId: string) =>
    apiClient.post('/analizar-veterinario', { image, tipo, mascotaId }),

  analizarTriaje: (imagen: string, tipo: string, mascotaId: string) =>
    apiClient.post('/triaje/analizar', { imagen, tipo, mascotaId }),

  analizarSalud: (image: string, mascotaId: string) =>
    apiClient.post('/analizar-salud', { image, mascotaId }),

  analizarReceta: (image: string, mascotaId: string) =>
    apiClient.post('/analizar-receta', { image, mascotaId }),

  // ==========================================
  // 📊 HISTORIALES Y REPORTE DE ACTIVIDAD
  // ==========================================
  getHistorial: () => apiClient.get('/historial'),
  getHistorialVet: () => apiClient.get('/historial-vet'),
  getHistorialSalud: (mascotaId: string) => apiClient.get(`/historial-salud/${mascotaId}`),
  getHistorialTriaje: () => apiClient.get('/historial-triaje'),

  borrarConsultaVet: (id: string) => apiClient.delete(`/consulta-vet/${id}`),
  borrarAlimento: (id: string) => apiClient.delete(`/historial/${id}`),
  borrarTriaje: (id: string) => apiClient.delete(`/triaje/${id}`),
  eliminarConsultaVet: (id: string) => apiClient.delete(`/consulta-vet/${id}`),

  // ==========================================
  // 🍱 ALIMENTACIÓN, STOCK Y MERCADO
  // ==========================================
  getStockStatus: (mascotaId: string) => apiClient.get(`/stock-status/${mascotaId}`),
  activarStock: (id: string, data: any) => apiClient.post(`/activar-stock/${id}`, data),
  buscarPrecios: (marca: string) => apiClient.get(`/buscar-precios/${marca}`),
  buscarResenas: (marca: string) => apiClient.get(`/buscar-resenas/${encodeURIComponent(marca)}`),

  // ==========================================
  // ⚠️ SISTEMA DE ALERTAS Y EVENTOS DE SALUD
  // ==========================================
  getAlertasSalud: () => apiClient.get('/alertas-salud'),
  getAlertasSistema: () => apiClient.get('/alertas-sistema'),
  marcarAlertaLeida: (id: string) => apiClient.put(`/alertas-sistema/${id}/leer`),

  guardarEventoSalud: (data: any) => apiClient.post('/guardar-salud', data),
  borrarEventoSalud: (id: string) => apiClient.delete(`/salud/${id}`),
  actualizarEventoSalud: (id: string, data: any) => apiClient.put(`/salud/${id}`, data),

  // ==========================================
  // 💰 FINANZAS Y HERRAMIENTAS
  // ==========================================
  guardarFinanzas: (data: any) => apiClient.post('/guardar-finanzas', data),
  getPresupuestoMensual: () => apiClient.get('/presupuesto-mensual'),
  comparar: (ids: string[]) => apiClient.post('/comparar', { ids }),

  // ==========================================
  // 📑 DOCUMENTACIÓN MÉDICA
  // ==========================================
  guardarConsultaVet: (data: any) => apiClient.post('/guardar-consulta', data),
  guardarReceta: (data: any) => apiClient.post('/guardar-receta', data),

  // ==========================================
  // 🔐 AUTENTICACIÓN Y SESIÓN
  // ==========================================
  getUserProfile: () => apiClient.get('/user/me'),

  logout: () => apiClient.post('/logout'),

  crearSuscripcion: (monto: number) =>
    apiClient.get('/usuarios/suscribirme', {
      params: { monto }
    }),

  loginNativoGoogle: (token: string) => apiClient.post('/public/auth/google-native', { token }),

  // ==========================================
  // 📍 COMUNIDAD: MASCOTAS PERDIDAS Y ADOPCIÓN
  // ==========================================
  reportarMascotaPerdida: (formData: FormData) => {
    return apiClient.post('/perdidas/reportar', formData);
  },

  getMascotasPerdidas: () => apiClient.get('/perdidas/todas'),
  getMascotasAdopcion: () => apiClient.get('/adopciones/todas'),

  publicarMascotaAdopcion: (formData: FormData) => {
    return apiClient.post('/adopciones/publicar', formData);
  },

  eliminarMascotaPerdida: (id: string) => apiClient.delete(`/perdidas/${id}`),
  eliminarMascotaAdopcion: (id: string) => apiClient.delete(`/adopciones/${id}`),

  // ==========================================
  // 🏛️ COMUNIDAD: REFUGIOS (NUEVO)
  // ==========================================
  /** Trae la lista de todos los refugios registrados */
  getRefugios: () => apiClient.get('/refugios/todos'),

  /** Registra un nuevo refugio con hasta 3 fotos (Multipart FormData) */
  registrarRefugio: (formData: FormData) => apiClient.post('/refugios/registrar', formData),

  /** Elimina un refugio (solo si el usuario es el creador) */
  eliminarRefugio: (id: string) => apiClient.delete(`/refugios/${id}`),
};