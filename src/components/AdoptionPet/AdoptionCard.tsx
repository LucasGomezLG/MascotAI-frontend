import React, { useState } from 'react';
import { 
  Heart, ChevronLeft, ChevronRight, Trash2, MapPin, 
  X, ZoomIn, MessageCircle, Copy, Check, ShieldAlert 
} from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Swal from 'sweetalert2';

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
  const [isZoomed, setIsZoomed] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleCopy = () => {
    navigator.clipboard.writeText(mascota.contacto);
    setCopied(true);
    
    const Toast = Swal.mixin({
      toast: true,
      position: 'top',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });
    
    Toast.fire({
      icon: 'success',
      title: '¡Contacto copiado!'
    });

    setTimeout(() => setCopied(false), 2000);
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

        <div 
          className="relative h-40 bg-slate-100 cursor-zoom-in group/img"
          onClick={() => setIsZoomed(true)}
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

          <button 
            onClick={() => setShowContact(true)} 
            className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-emerald-100"
          >
            <Heart size={12} fill="white" /> Contactar
          </button>
        </div>
      </div>

      {/* ✅ MODAL DE CONTACTO CON ADVERTENCIA DE SEGURIDAD */}
      {showContact && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 duration-300 text-center">
            <button 
              onClick={() => setShowContact(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>

            <div className="bg-emerald-100 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 text-emerald-600">
              <MessageCircle size={32} />
            </div>

            <h3 className="font-black text-slate-800 text-xl mb-1 tracking-tight">Datos del Tutor</h3>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-6 italic">MascotAI • Adopción Responsable</p>

            {/* 🛡️ ADVERTENCIA DE SEGURIDAD */}
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl mb-6 flex gap-3 items-start text-left">
              <div className="bg-amber-100 p-1.5 rounded-lg text-amber-600 shrink-0">
                <ShieldAlert size={16} />
              </div>
              <div>
                <p className="text-[10px] font-black text-amber-900 uppercase leading-none mb-1">Seguridad primero</p>
                <p className="text-[10px] font-bold text-amber-800 leading-tight">
                  Verificá bien el perfil antes de reunirte.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 mb-6 relative group">
              <p className="text-xs font-black text-slate-700 break-all px-2">
                {mascota.contacto || "No se proporcionó contacto"}
              </p>
            </div>

            <button 
              onClick={handleCopy}
              className={`w-full py-4 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${copied ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-slate-900 text-white shadow-slate-200'}`}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? '¡Datos Copiados!' : 'Copiar para WhatsApp/IG'}
            </button>
            
            <p className="mt-6 text-[8px] font-bold text-slate-300 leading-relaxed uppercase tracking-widest">
              Al contactar aceptás los términos de adopción responsable. ❤️
            </p>
          </div>
        </div>
      )}

      {/* MODAL DE ZOOM */}
      {isZoomed && (
        <div 
          className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setIsZoomed(false)}
        >
          <button className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors" style={{ top: 'calc(1.5rem + env(safe-area-inset-top))' }}>
            <X size={32} />
          </button>
          
          <img 
            src={fotos[currentFoto]} 
            className="max-w-full max-h-[85vh] rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300"
            alt="Zoom mascota"
          />
        </div>
      )}
    </>
  );
};

export default AdoptionCard;