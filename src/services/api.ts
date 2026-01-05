import axios from 'axios';

// --- CONFIGURACIÓN BASE ---
export const SERVER_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
export const API_BASE = `${SERVER_URL}/api/mascotas`;

axios.defaults.withCredentials = true;

const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true
});

export const api = {

  // ==========================================
  // 🐾 GESTIÓN DE PERFILES Y MASCOTAS
  // ==========================================
  getPerfiles: () => apiClient.get('/perfiles'),
  /** @deprecated Usar getPerfiles() - Mantenido por compatibilidad */
  getMascotas: () => apiClient.get('/perfiles'),

  // Guardado tradicional (JSON)
  guardarPerfil: (data: any) => apiClient.post('/guardar-perfil', data),

  // ✅ NUEVO: Guardado con Foto Real (Multipart FormData)
  guardarPerfilConFoto: (formData: FormData) => {
    return apiClient.post('/con-foto', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    // No forzar Content-Type manualmente; Axios lo detecta y añade el boundary correcto
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

  /** @deprecated Usar borrarConsultaVet() - Mantenido por compatibilidad */
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
  getUserProfile: async () => {
    try {
      // Retornamos la respuesta completa para el AuthContext
      return await apiClient.get('/user/me');
    } catch (error: any) {
      if (error.response?.status === 401) {
        return { data: null };
      }
      throw error;
    }
  },

  logout: () => apiClient.post('/logout'),

  // En api.ts
  // ✅ Cambiamos a GET y pasamos el monto como params
  crearSuscripcion: (monto: number) =>
    apiClient.get('/usuarios/suscribirme', {
      params: { monto }
    }),

  loginNativoGoogle: (token: string) => apiClient.post('/public/auth/google-native', { token }),

  // ==========================================
  // 📍 COMUNIDAD: MASCOTAS PERDIDAS
  // ==========================================

  // Envía el FormData con las 2 fotos y coordenadas
  reportarMascotaPerdida: (formData: FormData) => {
    return apiClient.post('/perdidas/reportar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return apiClient.post('/perdidas/reportar', formData);
  },

  // Trae la lista de reportes para el Inicio
  getMascotasPerdidas: () => apiClient.get('/perdidas/todas'),

  getMascotasAdopcion: () => apiClient.get('/adopciones/todas'),

  publicarMascotaAdopcion: (formData: FormData) => {
    return apiClient.post('/adopciones/publicar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return apiClient.post('/adopciones/publicar', formData);
  },

  eliminarMascotaPerdida: (id: string) => apiClient.delete(`/perdidas/${id}`),
  eliminarMascotaAdopcion: (id: string) => apiClient.delete(`/adopciones/${id}`),
};