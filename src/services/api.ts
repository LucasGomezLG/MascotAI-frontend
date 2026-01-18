import axios, {AxiosError} from 'axios';
import toast from 'react-hot-toast';
import type {
    AlertaDTO,
    AlimentoDTO,
    ConsultaVetDTO,
    MascotaAdopcionDTO,
    MascotaDTO,
    MascotaPerdidaDTO,
    OfertaPrecioDTO,
    RecordatorioSaludDTO,
    RefugioDTO,
    TriajeIADTO,
    UserDTO,
    ProductoDTO
} from '../types/api.types';

export const SERVER_URL = import.meta.env.DEV
  ? 'http://localhost:8080'
  : (import.meta.env.VITE_API_BASE_URL || '');

export const API_BASE = `${SERVER_URL}/api`;

axios.defaults.withCredentials = true;

function getCookie(name: string): string | null {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

export const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true
});

apiClient.interceptors.request.use(config => {
  const methodsToProtect = ['post', 'put', 'delete', 'patch'];
  if (config.method && methodsToProtect.includes(config.method.toLowerCase())) {
    const xsrfToken = getCookie('XSRF-TOKEN');
    if (xsrfToken) {
      config.headers['X-XSRF-TOKEN'] = xsrfToken;
    }
  }
  return config;
}, error => {
  return Promise.reject(error);
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    let errorMessage = 'Ocurrió un error inesperado.';
    if (error.response) {
      const responseData = error.response.data as { message?: string; error?: string };
      errorMessage = responseData.message || responseData.error || `Error ${error.response.status}`;
    } else if (error.request) {
      errorMessage = 'No se pudo conectar con el servidor. Revisa tu conexión a internet.';
    }
    toast.error(errorMessage, {
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
      },
    });
    return Promise.reject(error);
  }
);

export const api = {
  // --- 👤 MÓDULO: USUARIO Y PERFIL ---
  getUserProfile: () => apiClient.get<UserDTO>('/user/me'),
  refreshProfileData: () => apiClient.get<UserDTO>('/user/me'),
  logout: () => apiClient.post('/logout'),
  // NUEVO ENDPOINT PARA NOTIFICACIONES
  registerDeviceToken: (token: string) => apiClient.post('/user/register-device', { token }),

  // --- 🔑 MÓDULO: PÚBLICO Y AUTH NATIVA ---
  checkHealth: () => apiClient.get<string>('/mascotas/public/health'),
  loginGoogleNative: (token: string) => apiClient.post<UserDTO>('/mascotas/public/auth/google-native', { token }),

  // --- 💳 MÓDULO: PAGOS Y SUSCRIPCIONES ---
  crearSuscripcion: (email: string) => apiClient.post<{ init_point: string }>('/mascotas/usuarios/suscribirme', { email }),
  getHistorialPagos: () => apiClient.get<string>('/pagos/mis-pagos'),
  webhookSuscripciones: (payload: unknown) => apiClient.post('/mascotas/public/webhook-mp', payload),

  // --- 🛒 MÓDULO: MARKETPLACE ---
  getProductos: (search?: string) => apiClient.get<ProductoDTO[]>('/marketplace/productos', { params: { search } }),
  getMisProductos: () => apiClient.get<ProductoDTO[]>('/marketplace/mis-productos'),
  uploadProductoFotos: (formData: FormData) => apiClient.post<string[]>('/marketplace/productos/upload', formData),
  crearProducto: (data: ProductoDTO) => apiClient.post<ProductoDTO>('/marketplace/productos', data),
  destacarProducto: (id: string) => apiClient.post<{ init_point: string }>(`/marketplace/productos/${id}/destacar`),

  // --- 🐾 MÓDULO: MASCOTAS PROPIAS ---
  getMascotas: () => apiClient.get<MascotaDTO[]>('/mascotas'),
  agregarMascota: (data: MascotaDTO) => apiClient.post<MascotaDTO>('/mascotas', data),
  actualizarMascota: (id: string, data: MascotaDTO) => apiClient.put<MascotaDTO>(`/mascotas/${id}`, data),
  borrarMascota: (id: string) => apiClient.delete(`/mascotas/${id}`),
  registrarConFoto: (formData: FormData) => apiClient.post<MascotaDTO>('/mascotas/con-foto', formData),

  // --- 🥗 MÓDULO: IA, NUTRICIÓN Y HISTORIAL ---
  analizarAlimento: (image: string, mascotaId: string | null) =>
    apiClient.post('/mascotas/analizar-personalizado', { image, mascotaId: mascotaId || "" }),
  getHistorialAlimentos: () => apiClient.get<AlimentoDTO[]>('/mascotas/historial'),
  borrarAlimentoHistorial: (id: string) => apiClient.delete(`/mascotas/historial/${id}`),
  activarStock: (id: string, data: AlimentoDTO) => apiClient.post(`/mascotas/activar-stock/${id}`, data),
  guardarFinanzas: (data: AlimentoDTO) => apiClient.post('/mascotas/guardar-finanzas', data),
  getStockStatus: (mascotaId: string) => apiClient.get(`/mascotas/stock-status/${mascotaId}`),
  compararAlimentos: (ids: string[]) => apiClient.post('/mascotas/comparar', { ids }),

  // --- 🩺 MÓDULO: SALUD PREVENTIVA (Vacunas/Pipetas) ---
  analizarSalud: (image: string, mascotaId: string) =>
    apiClient.post<RecordatorioSaludDTO>('/salud/analizar', { image, mascotaId }),
  getAlertasSaludPreventiva: () => apiClient.get<RecordatorioSaludDTO[]>('/salud/alertas'),
  getHistorialPreventivoMascota: (mascotaId: string) => apiClient.get<RecordatorioSaludDTO[]>(`/salud/mascota/${mascotaId}`),
  guardarEventoSalud: (data: RecordatorioSaludDTO) => apiClient.post<RecordatorioSaludDTO>('/salud', data),
  actualizarEventoSalud: (id: string, data: RecordatorioSaludDTO) => apiClient.put<RecordatorioSaludDTO>(`/salud/${id}`, data),
  eliminarRegistroPreventivo: (id: string) => apiClient.delete(`/salud/${id}`),

  // --- 🩺 MÓDULO: SALUD (Vomitos/Piel/Etc) ---
  analizarTriaje: (image: string, tipo: string, mascotaId: string) =>
    apiClient.post<TriajeIADTO>('/salud/analizar-triaje', { image, tipo, mascotaId }),
  obtenerTriajes: () =>
    apiClient.get<TriajeIADTO[]>('/salud/triaje'),
  borrarTriaje: (id: string) =>
    apiClient.delete(`/veterinaria/triaje/${id}`),

  // --- 🩺 ✅ MÓDULO: IA VETERINARIA Y CLÍNICA (Sincronizado con VeterinariaController.java) ---
  analizarVet: (image: string, mascotaId: string) =>
    apiClient.post<ConsultaVetDTO>('/veterinaria/analizar', { image, mascotaId }),
  guardarConsultaVet: (data: ConsultaVetDTO) =>
    apiClient.post<ConsultaVetDTO>('/veterinaria', data),
  getHistorialClinico: () =>
    apiClient.get<ConsultaVetDTO[]>('/veterinaria/historial'),
  eliminarConsultaVet: (id: string) =>
    apiClient.delete(`/veterinaria/${id}`),

  // --- 🔍 MÓDULO: BÚSQUEDA E IA DE PRECIOS ---
  buscarPrecios: (marca: string) => apiClient.get<OfertaPrecioDTO[]>('/busqueda/precios', { params: { marca } }),
  buscarResenas: (marca: string) => apiClient.get<{ resenas: string }>('/busqueda/resenas', { params: { marca } }),
  getPresupuestoMensual: () => apiClient.get('/busqueda/presupuesto-mensual'),

  // --- 🤝 MÓDULO: COMUNIDAD (PERDIDOS Y ADOPCIONES) ---
  getMascotasPerdidas: () => apiClient.get<MascotaPerdidaDTO[]>('/mascotas/perdidas/todas'),
  reportarMascotaPerdida: (formData: FormData) => apiClient.post<MascotaPerdidaDTO>('/mascotas/perdidas/reportar', formData),
  eliminarMascotaPerdida: (id: string) => apiClient.delete(`/mascotas/perdidas/${id}`),
  marcarMascotaEncontrada: (id: string) => apiClient.patch(`/mascotas/perdidas/${id}/encontrada`),
  getMascotasAdopcion: () => apiClient.get<MascotaAdopcionDTO[]>('/mascotas/adopciones/todas'),
  publicarMascotaAdopcion: (formData: FormData) => apiClient.post<MascotaAdopcionDTO>('/mascotas/adopciones/publicar', formData),
  eliminarMascotaAdopcion: (id: string) => apiClient.delete(`/mascotas/adopciones/${id}`),

  // --- 🏠 MÓDULO: REFUGIOS ---
  getRefugios: () => apiClient.get<RefugioDTO[]>('/refugios'),
  getMisRefugios: () => apiClient.get<RefugioDTO[]>('/refugios/mis-refugios'),
  registrarRefugio: (formData: FormData) => apiClient.post<RefugioDTO>('/refugios', formData),
  eliminarRefugio: (id: string) => apiClient.delete(`/refugios/${id}`),

  // --- 🔔 MÓDULO: ALERTAS ---
  getAlertasSistema: () => apiClient.get<AlertaDTO[]>('/mascotas/alertas-sistema'),
  crearAlertaPersonalizada: (alerta: Partial<AlertaDTO>) => apiClient.post('/mascotas/alertas', alerta),
  getMisAlertas: () => apiClient.get<AlertaDTO[]>('/alertas'),
  marcarAlertaLeida: (id: string) => apiClient.patch(`/alertas/${id}/leida`),
};