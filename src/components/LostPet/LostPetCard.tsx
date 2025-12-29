import React, { useState } from 'react';
import { MapPin, Maximize2, X, Trash2 } from 'lucide-react'; // ✅ Añadido Trash2
import { MapContainer, TileLayer, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Definimos la interfaz de las propiedades para evitar errores de TS
interface LostPetCardProps {
  reporte: any;
  currentUser: any;
  onDelete: (id: string) => void;
}

const LostPetCard = ({ reporte, currentUser, onDelete }: LostPetCardProps) => {
  const [imgZoom, setImgZoom] = useState<string | null>(null);

  // ✅ Verificamos si la publicación pertenece al usuario logueado
  const esMia = reporte.userId === currentUser?.id;

  return (
    <>
      <div className="relative min-w-[280px] max-w-[280px] bg-white rounded-[2.5rem] p-5 shadow-sm border border-slate-100 flex flex-col gap-4 animate-in fade-in slide-in-from-right-4">

        {/* ✅ BOTÓN BORRAR (Solo si es mía) */}
        {esMia && (
          <button
            onClick={(e) => {
              e.stopPropagation(); // Evita el zoom de la foto
              onDelete(reporte.id); // ✅ Llamamos directamente a la función de App.tsx
            }}
            className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full shadow-lg z-20 active:scale-90 transition-transform hover:bg-red-600"
          >
            <Trash2 size={14} />
          </button>
        )}

        {/* 1. CONTENEDOR DE IMÁGENES "FORZADO" */}
        <div className="grid grid-cols-2 gap-2 h-32 w-full">
          {reporte.fotos?.map((url: string, i: number) => (
            <div
              key={i}
              className="relative group cursor-pointer overflow-hidden rounded-2xl border border-slate-50 bg-slate-100"
              onClick={() => setImgZoom(url)}
            >
              <img
                src={url}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                alt="Mascota"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Maximize2 size={16} className="text-white" />
              </div>
            </div>
          ))}
        </div>

        {/* 2. TEXTO Y UBICACIÓN */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-slate-700 leading-snug line-clamp-2 min-h-[32px]">
            {reporte.descripcion}
          </p>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 rounded-lg w-fit">
            <MapPin size={10} className="text-red-500" />
            <span className="text-[9px] font-black uppercase text-red-600 tracking-tighter">
              {reporte.direccion}
            </span>
          </div>
        </div>

        {/* 3. MAPA (Nivel 2) */}
        <div className="h-28 rounded-2xl overflow-hidden border border-slate-100 relative grayscale-[0.3]">
          <MapContainer
            center={[reporte.lat, reporte.lng]}
            zoom={15}
            scrollWheelZoom={false}
            zoomControl={false}
            dragging={false}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Circle
              center={[reporte.lat, reporte.lng]}
              radius={200}
              pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.3 }}
            />
          </MapContainer>
        </div>
      </div>

      {/* --- MODAL DE ZOOM (LIGHTBOX) --- */}
      {imgZoom && (
        <div
          className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4"
          onClick={() => setImgZoom(null)}
        >
          <button className="absolute top-10 right-10 text-white/50 hover:text-white transition-colors">
            <X size={40} />
          </button>
          <img
            src={imgZoom}
            className="max-w-full max-h-[80vh] rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-300"
            alt="Mascota Zoom"
          />
        </div>
      )}
    </>
  );
};

export default LostPetCard;