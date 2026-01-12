import React, { useState } from 'react';
import { MapPin, Maximize2, X, Trash2, MessageCircle, Copy, Check, ShieldAlert } from 'lucide-react';
import { MapContainer, TileLayer, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Swal from 'sweetalert2';

interface LostPetCardProps {
  reporte: any;
  currentUser: any;
  onDelete: (id: string) => void;
}

const LostPetCard = ({ reporte, currentUser, onDelete }: LostPetCardProps) => {
  const [imgZoom, setImgZoom] = useState<string | null>(null);
  const [showContact, setShowContact] = useState(false); // ✅ Modal de contacto
  const [copied, setCopied] = useState(false);

  const esMia = reporte.userId === currentUser?.id;

  const handleCopy = () => {
    navigator.clipboard.writeText(reporte.contacto);
    setCopied(true);
    
    const Toast = Swal.mixin({
      toast: true,
      position: 'top',
      showConfirmButton: false,
      timer: 2000,
    });
    
    Toast.fire({ icon: 'success', title: '¡Contacto copiado!' });
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

        <div className="grid grid-cols-2 gap-2 h-32 w-full">
          {reporte.fotos?.map((url: string, i: number) => (
            <div key={i} className="relative group cursor-pointer overflow-hidden rounded-2xl border border-slate-50 bg-slate-100" onClick={() => setImgZoom(url)}>
              <img src={url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Mascota" />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Maximize2 size={16} className="text-white" />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-bold text-slate-700 leading-snug line-clamp-2 min-h-[32px]">{reporte.descripcion}</p>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 rounded-lg w-fit">
            <MapPin size={10} className="text-red-500" /><span className="text-[9px] font-black uppercase text-red-600 tracking-tighter">{reporte.direccion}</span>
          </div>
        </div>

        <div className="h-28 rounded-2xl overflow-hidden border border-slate-100 relative grayscale-[0.3]">
          <MapContainer center={[reporte.lat, reporte.lng]} zoom={15} scrollWheelZoom={false} zoomControl={false} dragging={false} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Circle center={[reporte.lat, reporte.lng]} radius={200} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.3 }} />
          </MapContainer>
        </div>

        {/* ✅ BOTÓN CONTACTAR */}
        <button 
          onClick={() => setShowContact(true)}
          className="w-full py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-slate-100"
        >
          <MessageCircle size={14} /> Contactar
        </button>
      </div>

      {/* ✅ MODAL DE CONTACTO CON ADVERTENCIA */}
      {showContact && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white w-full max-w-xs rounded-[2.5rem] p-8 shadow-2xl relative text-center">
            <button onClick={() => setShowContact(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><X size={20} /></button>
            <div className="bg-red-100 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 text-red-600"><MessageCircle size={32} /></div>
            <h3 className="font-black text-slate-800 text-xl mb-1 tracking-tight">Datos del Reporte</h3>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-6 italic">MascotAI • Comunidad</p>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl mb-6 flex gap-3 items-start text-left">
              <ShieldAlert size={16} className="text-amber-600 shrink-0" />
              <p className="text-[10px] font-bold text-amber-800 leading-tight">
                Verificá bien la información antes de reunirte.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 mb-6">
              <p className="text-xs font-black text-slate-700 break-all">{reporte.contacto || "Sin contacto"}</p>
            </div>

            <button onClick={handleCopy} className={`w-full py-4 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-red-600 text-white shadow-lg shadow-red-100'}`}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? '¡Copiado!' : 'Copiar Contacto'}
            </button>
          </div>
        </div>
      )}

      {/* LIGHTBOX DE IMAGEN */}
      {imgZoom && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={() => setImgZoom(null)}>
          <button className="absolute top-10 right-10 text-white/50 hover:text-white"><X size={40} /></button>
          <img src={imgZoom} className="max-w-full max-h-[80vh] rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-300" alt="Zoom" />
        </div>
      )}
    </>
  );
};

export default LostPetCard;