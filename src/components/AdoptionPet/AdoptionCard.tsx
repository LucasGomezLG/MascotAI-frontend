import React, { useState } from 'react';
import {
  Heart, ChevronLeft, ChevronRight, Trash2, MapPin,
  X, Maximize2, MessageCircle, Copy, Check, ShieldAlert, Eye, Info
} from 'lucide-react';
import { MapContainer, TileLayer, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Swal from 'sweetalert2';
import type { MascotaAdopcionDTO, UserDTO } from '../../types/api.types';

interface AdoptionCardProps {
  mascota: MascotaAdopcionDTO; // ✅ Cambiado a DTO específico
  currentUser: UserDTO | null;
  onDelete: (id: string) => void;
}

const AdoptionCard = ({ mascota, currentUser, onDelete }: AdoptionCardProps) => {
  const [imgZoom, setImgZoom] = useState<string | null>(null);
  const [showContact, setShowContact] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentFoto, setCurrentFoto] = useState(0);

  const fotos = mascota.fotos || [];
  const tieneMasFotos = fotos.length > 1;

  // ✅ Lógica de propiedad nivelada
  const esMia = String(mascota.userId) === String(currentUser?.id);

  const nextFoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentFoto((prev) => (prev + 1) % fotos.length);
  };

  const prevFoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentFoto((prev) => (prev === 0 ? fotos.length - 1 : prev - 1));
  };

  const handleCopy = () => {
    if (!mascota.contacto) return;
    navigator.clipboard.writeText(mascota.contacto);
    setCopied(true);
    Swal.mixin({
      toast: true,
      position: 'top',
      showConfirmButton: false,
      timer: 2000,
    }).fire({ icon: 'success', title: '¡Contacto copiado!' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="relative min-w-[280px] max-w-[280px] bg-white rounded-[2.5rem] p-5 shadow-sm border border-slate-100 flex flex-col gap-4 animate-in fade-in slide-in-from-right-4">

        {esMia && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              Swal.fire({
                title: '¿Eliminar publicación?',
                text: "La mascota ya no aparecerá en adopción.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#10b981',
                confirmButtonText: 'Sí, borrar',
                customClass: { popup: 'rounded-[2rem]' }
              }).then(res => {
                // ✅ Doble validación: Confirmación de usuario + Existencia de ID
                if (res.isConfirmed && mascota.id) {
                  onDelete(mascota.id);
                }
              });
            }}
            className="absolute top-4 right-4 p-2 bg-emerald-500 text-white rounded-full shadow-lg z-20 active:scale-90"
          >
            <Trash2 size={12} />
          </button>
        )}

        {/* CAROUSEL DE FOTO ÚNICA (Mejor impacto visual) */}
        <div
          className="relative h-40 bg-slate-100 rounded-2xl overflow-hidden group/img cursor-zoom-in"
          onClick={() => setImgZoom(fotos[currentFoto])}
        >
          <img src={fotos[currentFoto]} className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" alt={mascota.nombre} />

          <div className="absolute top-2 left-2 px-2 py-1 bg-emerald-600 text-white text-[8px] font-black rounded-lg uppercase shadow-lg">
            {mascota.especie}
          </div>

          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
            <Maximize2 size={20} className="text-white shadow-sm" />
          </div>

          {tieneMasFotos && (
            <>
              <button onClick={prevFoto} className="absolute left-2 top-1/2 -translate-y-1/2 p-1 bg-white/30 backdrop-blur-md text-white rounded-full hover:bg-white/50"><ChevronLeft size={14} /></button>
              <button onClick={nextFoto} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-white/30 backdrop-blur-md text-white rounded-full hover:bg-white/50"><ChevronRight size={14} /></button>
            </>
          )}
        </div>

        {/* INFORMACIÓN */}
        <div className="space-y-2 text-left">
          <div className="flex justify-between items-start pr-1">
            <h4 className="font-black text-slate-800 text-base leading-none truncate flex-1">{mascota.nombre}</h4>
            <span className="text-[8px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">En Adopción</span>
          </div>

          <div className="flex justify-between items-start gap-2">
            <p className="text-[11px] font-bold text-slate-500 leading-snug line-clamp-2 flex-1 min-h-[32px] break-words">
              {mascota.descripcion}
            </p>
            <button
              onClick={() => setShowFullDesc(true)}
              className="p-1.5 bg-slate-50 text-slate-400 rounded-lg hover:text-emerald-500 hover:bg-emerald-50 transition-colors shrink-0"
            >
              <Eye size={12} strokeWidth={3} />
            </button>
          </div>

          <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-lg w-fit">
            <MapPin size={10} className="text-emerald-500" />
            <span className="text-[9px] font-black uppercase text-emerald-600 tracking-tighter truncate max-w-[180px]">
              {mascota.direccion}
            </span>
          </div>
        </div>

        {/* MAPA */}
        <div className="h-24 rounded-2xl overflow-hidden border border-slate-100 relative grayscale-[0.4] contrast-[0.9]">
          <MapContainer center={[mascota.lat || 0, mascota.lng || 0]} zoom={15} scrollWheelZoom={false} zoomControl={false} dragging={false} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Circle
              center={[mascota.lat || 0, mascota.lng || 0]}
              radius={200}
              pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.3 }}
            />
          </MapContainer>
        </div>

        <button
          onClick={() => setShowContact(true)}
          className="w-full py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-emerald-100"
        >
          <Heart size={14} fill="white" /> Contactar Dueño
        </button>
      </div>

      {/* ✅ ZOOM MODAL (Nivelado) */}
      {imgZoom && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4" onClick={() => setImgZoom(null)}>
          <button className="absolute top-10 right-10 text-white/50 hover:text-white"><X size={40} /></button>
          <img src={imgZoom} className="max-w-full max-h-[85vh] rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300 object-contain" alt="Zoom" />
        </div>
      )}

      {/* ✅ MODAL DESCRIPCIÓN (Zona Segura + Break Words) */}
      {showFullDesc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[120] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-0 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-50 rounded-full blur-3xl opacity-60" />
            <button onClick={() => setShowFullDesc(false)} className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 hover:text-emerald-600 rounded-full transition-all z-10"><X size={20} /></button>
            <div className="px-8 pt-10 pb-8 flex flex-col items-center">
              <div className="bg-emerald-100 p-4 rounded-2xl text-emerald-600 mb-4 shadow-sm">
                <Info size={28} strokeWidth={2.5} />
              </div>
              <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.25em] mb-1">Detalles Adopción</p>
              <h3 className="font-black text-slate-800 text-xl tracking-tight text-center leading-tight mb-6 break-words w-full">Sobre {mascota.nombre}</h3>
              <div className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] overflow-hidden">
                <div className="p-6 max-h-[35vh] overflow-y-auto">
                  <p className="text-sm font-bold text-slate-600 leading-relaxed text-left whitespace-pre-wrap break-words">
                    {mascota.descripcion}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowFullDesc(false)} className="w-full mt-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-emerald-200 active:scale-95 transition-all">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ MODAL CONTACTO */}
      {showContact && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xs rounded-[2.5rem] p-8 shadow-2xl relative text-center">
            <button onClick={() => setShowContact(false)} className="absolute top-6 right-6 text-slate-400"><X size={20} /></button>
            <div className="bg-emerald-100 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 text-emerald-600"><MessageCircle size={32} /></div>
            <h3 className="font-black text-slate-800 text-xl mb-1 tracking-tight">Adoptar a {mascota.nombre}</h3>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-6 italic">MascotAI • Adopción Responsable</p>
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl mb-6 flex gap-3 items-start text-left">
              <ShieldAlert size={16} className="text-amber-600 shrink-0" />
              <p className="text-[10px] font-bold text-amber-800 leading-tight">Nunca envíes dinero por adelantado para traslados o vacunas.</p>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl border-2 border-dashed border-emerald-200 mb-6">
              <p className="text-[10px] font-black text-emerald-400 uppercase mb-2 tracking-widest text-center">Datos de contacto</p>
              <p className="text-sm font-black text-slate-700 break-all text-center">{mascota.contacto}</p>
            </div>
            <button onClick={handleCopy} className={`w-full py-4 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all shadow-lg ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'}`}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? '¡Copiado!' : 'Copiar Contacto'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AdoptionCard;