// --- MÓDULO: USUARIO ---
export interface UserDTO {
  id: string;
  nombre: string;
  email: string;
  foto?: string | null;
  intentosIA: number;
  intentosRestantes: number;
  esColaborador: boolean;
}

// --- MÓDULO: BÚSQUEDA Y COMPARACIÓN ---
export interface OfertaPrecioDTO {
  tienda: string;
  peso: string;
  precio: string;
  nota?: string;
}

// --- MÓDULO: MASCOTAS PROPIAS ---
export interface MascotaDTO {
  id?: string;
  nombre: string;
  especie: 'Gato' | 'Perro';
  fechaNacimiento: string;
  peso: number;
  condicion: string;
  foto?: string;
  edad?: number;
}

// --- MÓDULO: NUTRICIÓN Y ALIMENTOS ---
export interface AlimentoDTO {
  id?: string;
  mascotaId: string;
  marca: string;
  calidad: string;
  veredicto: string;
  ingredientes: string[];
  kcalKg: number;
  porcionRecomendada?: number;
  porcionSugerida?: number;
  precioComprado?: number;
  pesoBolsaKg?: number;
  costoDiario?: number;
  stockActivo?: boolean;
  fechaApertura?: string;
  preciosOnlineIA?: string;
  fechaEscaneo?: string;
}

// --- MÓDULO: SALUD PREVENTIVA ---
export interface RecordatorioSaludDTO {
  id?: string;
  mascotaId: string;
  tipo: string;
  nombre: string;
  precio: number;
  fechaAplicacion: string;
  proximaFecha?: string;
  notas?: string;
  completado?: boolean;
  dosis?: string;
  error?: string;
}

// --- MÓDULO: CLÍNICA VETERINARIA ---
export interface ConsultaVetDTO {
  id?: string;
  mascotaId: string;
  tipo: string;
  nombre: string;
  diagnostico?: string;
  observaciones?: string;
  fecha: string;
  precio?: number;
  veterinario?: string;
  clinica?: string;
  imagenUrl?: string;
  error?: string;
}

// --- MÓDULO: COMUNIDAD (GENERAL) ---
export interface ItemComunidad {
  id: string;
  userId: string;
  descripcion: string;
  direccion: string;
  contacto: string;
  fotos: string[];
  lat: number;
  lng: number;
  tipo: 'perdido' | 'adopcion' | 'refugio';
  mascota?: MascotaPerdidaDTO;
}

// --- MÓDULO: COMUNIDAD (REFUGIOS) ---
export interface RefugioDTO {
  id?: string;
  userId: string;
  nombre: string;
  descripcion: string;
  fotos: string[];
  redSocial: string;
  aliasDonacion: string;
  direccion: string;
  lat: number;
  lng: number;
  verificado: boolean;
  fechaRegistro?: string;
  mapsLink?: string;
}

// --- MÓDULO: COMUNIDAD (ADOPCIONES) ---
export interface MascotaAdopcionDTO {
  id?: string;
  nombre: string;
  especie: 'Gato' | 'Perro' | string;
  edad: string;
  descripcion: string;
  contacto: string;
  direccion: string;
  lat: number;
  lng: number;
  etiquetas?: string[];
  fotos: string[];
  fechaPublicacion: string;
  userId: string;
}

// --- MÓDULO: COMUNIDAD (MASCOTAS PERDIDAS) ---
export interface MascotaPerdidaDTO {
  id?: string;
  userId: string;
  descripcion: string;
  direccion: string;
  contacto: string;
  lat: number;
  lng: number;
  fotos: string[];
  fechaReporte: string;
  encontrada: boolean;
  mapsLink?: string;
  especie?: string;
}

// --- MÓDULO: SISTEMA Y ALERTAS ---
export interface AlertaDTO {
  id: string;
  mensaje: string;
  tipo: 'STOCK' | 'SALUD' | 'SISTEMA' | string;
  fecha: string;
  leida: boolean;
  mascotaId?: string;
}

// --- MÓDULO: TRIAJE E IA VETERINARIA ---
export interface TriajeIADTO {
  id?: string;
  mascotaId: string;
  categoria: string;
  analisisDetalle: string;
  nivelUrgencia: string;
  urgenciaExplicacion: string;
  pasosASeguir: string[];
  resumenFinal: string;
  imagenUrl?: string;
  fecha: string;
  error?: string;
}