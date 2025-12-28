import axios from 'axios';

export const SERVER_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
export const API_BASE = `${SERVER_URL}/api/mascotas`;

axios.defaults.withCredentials = true;

const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true
});

export const api = {
  // --- USAMOS apiClient EN TODAS PARA QUE EL TOKEN VIAJE ---
  getPerfiles: () => apiClient.get('/perfiles'),
  getMascotas: () => apiClient.get('/perfiles'),
  guardarPerfil: (data: any) => apiClient.post('/guardar-perfil', data),
  borrarMascota: (id: string) => apiClient.delete(`/perfiles/${id}`),

  analizarAlimento: (image: string, mascotaId: string) => apiClient.post('/analizar-personalizado', { image, mascotaId }),
  analizarVet: (image: string, tipo: string, mascotaId: string) => apiClient.post('/analizar-veterinario', { image, tipo, mascotaId }),
  analizarTriaje: (image: string, tipo: string, mascotaId: string) => apiClient.post('/triaje/analizar', { image, tipo, mascotaId }),
  analizarSalud: (image: string, mascotaId: string) => apiClient.post('/analizar-salud', { image, mascotaId }),
  analizarReceta: (image: string, mascotaId: string) => apiClient.post('/analizar-receta', { image, mascotaId }),

  getHistorial: () => apiClient.get('/historial'),
  getHistorialVet: () => apiClient.get('/historial-vet'),
  getHistorialSalud: (mascotaId: string) => apiClient.get(`/historial-salud/${mascotaId}`),
  borrarConsultaVet: (id: string) => apiClient.delete(`/consulta-vet/${id}`),
  borrarAlimento: (id: string) => apiClient.delete(`/historial/${id}`),

  getStockStatus: (mascotaId: string) => apiClient.get(`/stock-status/${mascotaId}`),
  activarStock: (id: string, data: any) => apiClient.post(`/activar-stock/${id}`, data),
  buscarPrecios: (marca: string) => apiClient.get(`/buscar-precios/${marca}`),
  buscarResenas: (marca: string) => apiClient.get(`/buscar-resenas/${encodeURIComponent(marca)}`),

  getAlertasSalud: () => apiClient.get('/alertas-salud'),
  getAlertasSistema: () => apiClient.get('/alertas-sistema'),
  marcarAlertaLeida: (id: string) => apiClient.put(`/alertas-sistema/${id}/leer`),
  guardarEventoSalud: (data: any) => apiClient.post('/guardar-salud', data),
  borrarEventoSalud: (id: string) => apiClient.delete(`/salud/${id}`),
  actualizarEventoSalud: (id: string, data: any) => apiClient.put(`/salud/${id}`, data),

  getHistorialTriaje: () => apiClient.get('/historial-triaje'),
  borrarTriaje: (id: string) => apiClient.delete(`/triaje/${id}`),
  guardarFinanzas: (data: any) => apiClient.post('/guardar-finanzas', data),
  getPresupuestoMensual: () => apiClient.get('/presupuesto-mensual'),
  comparar: (ids: string[]) => apiClient.post('/comparar', { ids }),

  guardarConsultaVet: (data: any) =>
    apiClient.post('/guardar-consulta', data),
  guardarReceta: (data: any) => apiClient.post('/guardar-receta', data),

  getUserProfile: async () => {
    try {
      // ✅ IMPORTANTE: Retornamos la respuesta completa para tu AuthContext
      return await apiClient.get('/user/me');
    } catch (error: any) {
      if (error.response?.status === 401) {
        return { data: null };
      }
      throw error;
    }
  },


  logout: () => apiClient.post('/logout'),
};