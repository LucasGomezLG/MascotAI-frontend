// --- DTOs Principales de la Aplicación ---
export interface UserDTO {
  id: string;
  nombre?: string;
  email?: string;
  foto?: string;
  intentosIA?: number;
  intentosRestantes?: number;
  esColaborador?: boolean;
  fechaFinColaborador?: string; // NUEVO: Formato ISO string
}

export interface MascotaDTO {
  id?: string;
  nombre: string;
  especie: string;
  raza?: string;
  fechaNacimiento: string; // Formato: "YYYY-MM-DD"
  peso?: number;
  condicion?: string;
  foto?: string; // ALINEADO: antes 'fotoUrl'
  edad?: number;
}

export interface AlertaDTO {
  id?: string;
  mensaje: string;
  leida?: boolean;
  fecha?: string; // Formato: "YYYY-MM-DD"
  tipo?: string;
  mascotaId?: string; // NUEVO
}


// --- DTOs del Módulo de Marketplace ---

export interface ProductoDTO {
  id?: string;
  userId?: string; // El ID del usuario vendedor (solo lectura)
  nombre: string;
  descripcion?: string;
  precio: number;
  categoria: string;
  contacto: string; // Info para que el comprador contacte al vendedor
  fotos?: string[];
  stock: number;
  destacado?: boolean; // NUEVO: Indica si el producto está pagado para resaltar
  fechaFinDestaque?: string; // NUEVO: Fecha en que termina el destaque (ISO string)
}


// --- DTOs del Módulo de Nutrición ---

export interface AlimentoDTO {
  id?: string;
  mascotaId?: string;
  marca: string;
  calidad?: string;
  veredicto?: string;
  ingredientes?: string[];
  kcalKg?: number;
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

export interface OfertaPrecioDTO {
  tienda: string;
  peso: string; // NUEVO
  precio: string;
  nota?: string; // NUEVO
}


// --- DTOs del Módulo de Salud ---

export interface RecordatorioSaludDTO {
  id?: string;
  mascotaId: string;
  tipo: string;
  nombre?: string; // ALINEADO: antes 'nombreProducto'
  precio?: number; // NUEVO
  fechaAplicacion: string; // Formato: "YYYY-MM-DD"
  proximaFecha?: string; // ALINEADO: antes 'fechaProxima'
  notas?: string;
  completado?: boolean;
}

export interface ConsultaVetDTO {
  id?: string;
  mascotaId: string;
  tipo: string;
  nombre?: string; // NUEVO
  diagnostico?: string;
  fecha: string; // Formato: "YYYY-MM-DD'T'HH:mm:ss"
  precio?: number; // NUEVO
  veterinario?: string; // NUEVO
  clinica?: string; // NUEVO
  imagenUrl?: string; // NUEVO
}

export interface TriajeIADTO {
  id?: string;
  mascotaId: string;
  categoria?: string; // NUEVO
  analisisDetalle?: string; // NUEVO
  nivelUrgencia?: string; // NUEVO
  urgenciaExplicacion?: string; // NUEVO
  pasosASeguir?: string[]; // NUEVO
  resumenFinal?: string; // NUEVO
  imagenUrl?: string;
  fecha: string; // Formato: "YYYY-MM-DD'T'HH:mm:ss"
}


// --- DTOs del Módulo de Comunidad ---

export interface ItemComunidad {
  id: string;
  tipo: 'perdido' | 'adopcion' | 'refugio';
  userId?: string;
  lat?: number;
  lng?: number;
}

export interface MascotaPerdidaDTO {
  id?: string;
  userId?: string;
  descripcion: string;
  direccion: string;
  contacto: string;
  lat: number;
  lng: number;
  fotos?: string[];
  fechaReporte?: string; // Formato: "YYYY-MM-DD'T'HH:mm:ss"
  encontrada?: boolean;
  mapsLink?: string;
}

export interface MascotaAdopcionDTO {
  id?: string;
  nombre: string;
  especie: string;
  edad: string; // ALINEADO: es string en el backend
  descripcion: string;
  contacto: string;
  direccion?: string; // NUEVO
  lat?: number; // NUEVO
  lng?: number; // NUEVO
  etiquetas?: string[]; // NUEVO
  fotos?: string[];
  fechaPublicacion?: string; // Formato: "YYYY-MM-DD'T'HH:mm:ss"
  userId?: string;
}

export interface RefugioDTO {
  id?: string;
  userId?: string;
  nombre: string;
  descripcion: string;
  fotos?: string[];
  redSocial?: string; // NUEVO
  aliasDonacion?: string; // NUEVO
  direccion: string;
  lat: number;
  lng: number;
  verificado?: boolean; // NUEVO
  fechaRegistro?: string; // NUEVO
  mapsLink?: string; // NUEVO
}