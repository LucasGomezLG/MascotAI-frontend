import React, { useState } from 'react';
import { Heart, ChevronLeft, ChevronRight, Trash2, MapPin, X, ZoomIn } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const customIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [20, 32],
  iconAnchor: [10, 32],
});

interface AdoptionCardProps {
  mascota: any;
  currentUser: any;
  onDelete: (id: string) => void;
}

const AdoptionCard = ({ mascota, currentUser, onDelete }: AdoptionCardProps) => {
  const [currentFoto, setCurrentFoto] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false); // ✅ Estado para el zoom
  const fotos = mascota.fotos || [];
  const tieneVariasFotos = fotos.length > 1;
  const esMia = mascota.userId === currentUser?.id;

  const prevFoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentFoto(curr => curr === 0 ? fotos.length - 1 : curr - 1);
  };

  const nextFoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentFoto(curr => curr === fotos.length - 1 ? 0 : curr + 1);
  };

  return (
    <>
      <div className="relative min-w-[260px] max-w-[260px] bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 flex flex-col group hover:shadow-md transition-all">
        
        {esMia && (
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(mascota.id); }}
            className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full shadow-lg z-20 active:scale-90 transition-transform hover:bg-red-600"
          >
            <Trash2 size={12} />
          </button>
        )}

        {/* CONTENEDOR DE IMAGEN CON CLICK PARA ZOOM */}
        <div 
          className="relative h-40 bg-slate-100 cursor-zoom-in group/img"
          onClick={() => setIsZoomed(true)} // ✅ Activa el zoom
        >
          <img src={fotos[currentFoto]} className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105" alt={mascota.nombre} />
          
          <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full shadow-sm z-10">
            <span className="text-[9px] font-black uppercase text-emerald-600">{mascota.edad}</span>
          </div>

          <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors flex items-center justify-center">
            <ZoomIn className="text-white opacity-0 group-hover/img:opacity-100 transition-opacity" size={24} />
          </div>

          {tieneVariasFotos && (
            <>
              <button onClick={prevFoto} className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/40 z-10">
                <ChevronLeft size={14} />
              </button>
              <button onClick={nextFoto} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/40 z-10">
                <ChevronRight size={14} />
              </button>
            </>
          )}
        </div>

        {/* MINI MAPA */}
        <div className="h-20 w-full relative border-y border-slate-50 grayscale-[0.3] contrast-[0.8]">
          {mascota.lat && mascota.lng ? (
            <MapContainer center={[mascota.lat, mascota.lng]} zoom={14} zoomControl={false} dragging={false} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[mascota.lat, mascota.lng]} icon={customIcon} />
            </MapContainer>
          ) : (
            <div className="w-full h-full bg-slate-50 flex items-center justify-center"><MapPin size={16} className="text-slate-200" /></div>
          )}
          <div className="absolute inset-0 z-10"></div>
        </div>

        {/* INFO */}
        <div className="p-4 space-y-3 text-left">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-black text-slate-800 text-base leading-none truncate">{mascota.nombre}</h4>
              <div className="flex items-center gap-1 mt-1 text-slate-400">
                <MapPin size={10} className="text-emerald-500" />
                <span className="text-[9px] font-bold uppercase tracking-tight truncate max-w-[120px]">
                  {mascota.direccion || "Cerca tuyo"}
                </span>
              </div>
            </div>
            <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black rounded-lg uppercase">
              {mascota.especie}
            </span>
          </div>

          <div className="flex flex-wrap gap-1 h-[22px] overflow-hidden">
            {mascota.etiquetas?.slice(0, 2).map((tag: string, i: number) => (
              <span key={i} className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[8px] font-bold rounded-md uppercase border border-slate-100">
                {tag}
              </span>
            ))}
          </div>

          <button className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-emerald-100">
            <Heart size={12} fill="white" /> Contactar
          </button>
        </div>
      </div>

      {/* ✅ MODAL DE ZOOM (A PANTALLA COMPLETA) */}
      {isZoomed && (
        <div 
          className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setIsZoomed(false)}
        >
          <button className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors">
            <X size={32} />
          </button>
          
          <img 
            src={fotos[currentFoto]} 
            className="max-w-full max-h-[85vh] rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300"
            alt="Zoom mascota"
          />

          <p className="absolute bottom-10 text-white/60 font-black uppercase text-[10px] tracking-widest">
            {mascota.nombre} • Toca en cualquier lado para cerrar
          </p>
        </div>
      )}
    </>
  );
};

export default AdoptionCard;