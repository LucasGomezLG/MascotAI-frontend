import axios from 'axios';

const API_BASE = "http://localhost:8080/api/mascotas";
//const API_BASE = "http://192.168.1.58:8080/api/mascotas";
//const API_BASE = "/api";
axios.defaults.withCredentials = true;

export const api = {
  
  getHistorial: () => axios.get(`${API_BASE}/historial`),
  getHistorialVet: () => axios.get(`${API_BASE}/historial-vet`),
  getPerfiles: () => axios.get(`${API_BASE}/perfiles`),
  guardarPerfil: (data: any) => axios.post(`${API_BASE}/guardar-perfil`, data),
  analizarAlimento: (image: string, mascotaId: string) => axios.post(`${API_BASE}/analizar-personalizado`, { image, mascotaId }),
  analizarVet: (image: string, tipo: string, mascotaId: string) => axios.post(`${API_BASE}/analizar-veterinario`, { image, tipo, mascotaId }),
  buscarPrecios: (marca: string) => axios.get(`${API_BASE}/buscar-precios/${marca}`),
  guardarFinanzas: (data: any) => axios.post(`${API_BASE}/guardar-finanzas`, data),
  comparar: (ids: string[]) => axios.post(`${API_BASE}/comparar`, { ids }),
  borrarAlimento: (id: string) => axios.delete(`${API_BASE}/historial/${id}`),
  borrarConsultaVet: (id: string) => axios.delete(`${API_BASE}/consulta-vet/${id}`),
  // NUEVO: Para obtener los perfiles de Simba y Adelina
  getMascotas: () => axios.get(`${API_BASE}/perfiles`),

  // NUEVO: Para borrar una mascota si fuera necesario
  borrarMascota: (id: string) => axios.delete(`${API_BASE}/perfiles/${id}`),

  // NUEVO: Para obtener el cálculo de stock inteligente
  getStockStatus: (mascotaId: string) => axios.get(`${API_BASE}/stock-status/${mascotaId}`),

  // api.ts corregido
  buscarResenas: (marca: string) => axios.get(`${API_BASE}/buscar-resenas/${encodeURIComponent(marca)}`),

  activarStock: (id: string) => axios.post(`${API_BASE}/activar-stock/${id}`),

  // NUEVO: Salud Preventiva
  analizarSalud: (image: string, mascotaId: string) => 
    axios.post(`${API_BASE}/analizar-salud`, { image, mascotaId }),
    
  getHistorialSalud: (mascotaId: string) => 
    axios.get(`${API_BASE}/historial-salud/${mascotaId}`),
  getAlertasSalud: () => axios.get(`${API_BASE}/alertas-salud`),
  guardarEventoSalud: (data: any) => axios.post(`${API_BASE}/guardar-salud`, data),
  borrarEventoSalud: (id: string) => axios.delete(`${API_BASE}/salud/${id}`),
  actualizarEventoSalud: (id: string, data: any) => axios.put(`${API_BASE}/salud/${id}`, data),
  getAlertasSistema: () => axios.get(`${API_BASE}/alertas-sistema`),
  marcarAlertaLeida: (id: string) => axios.put(`${API_BASE}/alertas-sistema/${id}/leer`),

  getPresupuestoMensual: () => axios.get(`${API_BASE}/presupuesto-mensual`),

  analizarReceta: (image: string, mascotaId: string) => 
    axios.post(`${API_BASE}/analizar-receta`, { image, mascotaId }),
  
  guardarConsultaVet: (data: any) => 
    axios.post(`${API_BASE}/analizar-veterinario`, data), // Reutilizamos el guardado existente

  guardarReceta: (data: any) => 
    axios.post(`${API_BASE}/guardar-receta`, data),

  getUserProfile: () => 
    axios.get(`${API_BASE}/user/me`),

  logout: () => 
    axios.post(`${API_BASE}/logout`),


};