import React, { useState } from 'react';
import { MapPin, Maximize2, X, Trash2, MessageCircle, Copy, Check, ShieldAlert, Eye, Info } from 'lucide-react';
import { MapContainer, TileLayer, Circle } from 'react-leaflet';
import type { ItemComunidad, UserDTO } from '../../types/api.types';
import 'leaflet/dist/leaflet.css';
import Swal from 'sweetalert2';

interface LostPetCardProps {
  reporte: ItemComunidad;
  currentUser: UserDTO | null;
  onDelete: (id: string) => void;
}

const LostPetCard = ({ reporte, currentUser, onDelete }: LostPetCardProps) => {
  const [imgZoom, setImgZoom] = useState<string | null>(null);
  const [showContact, setShowContact] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [copied, setCopied] = useState(false);

  const esMia = String(reporte.userId) === String(currentUser?.id);

  // Gestiona el copiado de contacto con feedback visual tipo Toast.
  const handleCopy = () => {
    if (!reporte.contacto) return;
    navigator.clipboard.writeText(reporte.contacto);
    setCopied(true);
    
    Swal.mixin({
      toast: true,
      position: 'top',
      showConfirmButton: false,
      timer: 2000,
    }).fire({ icon: 'success', title: '¡Copiado!' });

    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="relative min-w-[280px] max-w-[280px] bg-white rounded-[2.5rem] p-5 shadow-sm border border-slate-100 flex flex-col gap-4 animate-in fade-in slide-in-from-right-4">
        {esMia && (
          <button onClick={(e) => { e.stopPropagation(); onDelete(reporte.id); }} className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full shadow-lg z-20 active:scale-90 transition-transform hover:bg-red-600">
            <Trash2 size={14} />
          </button>
        )}

        {/* Galería de Fotos */}
        <div className="grid grid-cols-2 gap-2 h-32 w-full">
          {reporte.fotos?.map((url, i) => (
            <div key={i} className="relative group cursor-pointer overflow-hidden rounded-2xl border border-slate-50 bg-slate-100" onClick={() => setImgZoom(url)}>
              <img src={url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Mascota" />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Maximize2 size={16} className="text-white" />
              </div>
            </div>
          ))}
        </div>

        {/* Descripción y Ubicación Texto */}
        <div className="space-y-2 relative">
          <div className="flex justify-between items-start gap-2">
            <p className="text-[11px] font-bold text-slate-700 leading-snug line-clamp-2 flex-1 min-h-[32px]">
              {reporte.descripcion}
            </p>
            <button 
              onClick={() => setShowFullDesc(true)}
              className="p-1.5 bg-slate-50 text-slate-400 rounded-lg hover:text-orange-500 hover:bg-orange-50 transition-colors shrink-0"
            >
              <Eye size={12} strokeWidth={3} />
            </button>
          </div>
          
          <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 rounded-lg w-fit">
            <MapPin size={10} className="text-red-500" />
            <span className="text-[9px] font-black uppercase text-red-600 tracking-tighter truncate max-w-[180px]">
              {reporte.direccion}
            </span>
          </div>
        </div>

        {/* Mapa de Referencia */}
        <div className="h-28 rounded-2xl overflow-hidden border border-slate-100 relative grayscale-[0.3]">
          <MapContainer center={[reporte.lat ?? 0, reporte.lng ?? 0]} zoom={15} scrollWheelZoom={false} zoomControl={false} dragging={false} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Circle center={[reporte.lat ?? 0, reporte.lng ?? 0]} radius={200} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.3 }} />
          </MapContainer>
        </div>

        <button 
          onClick={() => setShowContact(true)}
          className="w-full py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
        >
          <MessageCircle size={14} /> Contactar
        </button>
      </div>

      {/* MODAL: Descripción Extendida */}
      {showFullDesc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[120] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white w-full max-w-xs rounded-[2.5rem] p-8 shadow-2xl relative">
            <button onClick={() => setShowFullDesc(false)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-900"><X size={20} /></button>
            <div className="bg-orange-100 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-orange-600"><Info size={24} /></div>
            <h3 className="font-black text-slate-800 text-lg mb-4 tracking-tight">Detalles del Reporte</h3>
            <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 max-h-[40vh] overflow-y-auto">
              <p className="text-xs font-bold text-slate-600 leading-relaxed italic">"{reporte.descripcion}"</p>
            </div>
            <button onClick={() => setShowFullDesc(false)} className="w-full mt-6 py-4 bg-orange-500 text-white rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95">Cerrar Detalle</button>
          </div>
        </div>
      )}

      {/* MODAL: Datos de Contacto */}
      {showContact && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xs rounded-[2.5rem] p-8 shadow-2xl relative text-center">
            <button onClick={() => setShowContact(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><X size={20} /></button>
            <div className="bg-red-100 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 text-red-600"><MessageCircle size={32} /></div>
            <h3 className="font-black text-slate-800 text-xl mb-1 tracking-tight">Contacto</h3>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-6 italic">MascotAI • Comunidad</p>
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl mb-6 flex gap-3 items-start text-left">
              <ShieldAlert size={16} className="text-amber-600 shrink-0" />
              <p className="text-[10px] font-bold text-amber-800 leading-tight">Verificá bien la información antes de reunirte.</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 mb-6">
              <p className="text-xs font-black text-slate-700 break-all">{reporte.contacto || "Sin contacto"}</p>
            </div>
            <button onClick={handleCopy} className={`w-full py-4 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-red-600 text-white shadow-lg'}`}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? '¡Copiado!' : 'Copiar Contacto'}
            </button>
          </div>
        </div>
      )}

      {/* ZOOM: Galería */}
      {imgZoom && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[130] flex items-center justify-center p-4" onClick={() => setImgZoom(null)}>
          <button className="absolute top-10 right-10 text-white/50 hover:text-white"><X size={40} /></button>
          <img src={imgZoom} className="max-w-full max-h-[80vh] rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-300 object-contain" alt="Zoom" />
        </div>
      )}
    </>
  );
};

export default LostPetCard;