import React, {useState} from 'react';
import {
    Check,
    ChevronLeft,
    ChevronRight,
    Copy,
    Eye,
    Info,
    MapPin,
    Maximize2,
    MessageCircle,
    ShieldAlert,
    Trash2,
    X,
    Share2
} from 'lucide-react';
import {Circle, MapContainer, TileLayer} from 'react-leaflet';
import type {ItemComunidad, MascotaPerdidaDTO, UserDTO} from '@/types/api.types';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';

interface LostPetCardProps {
  reporte: ItemComunidad & MascotaPerdidaDTO;
  currentUser: UserDTO | null;
  onDelete: (id: string) => void;
}

const LostPetCard = ({ reporte, currentUser, onDelete }: LostPetCardProps) => {
  const [imgZoom, setImgZoom] = useState<string | null>(null);
  const [showContact, setShowContact] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentFoto, setCurrentFoto] = useState(0);

  const esMia = String(reporte.userId) === String(currentUser?.id);
  const fotos = reporte.fotos || [];
  const tieneMasFotos = fotos.length > 1;

  const changeFoto = (e: React.MouseEvent, direction: 'next' | 'prev') => {
    e.stopPropagation();
    setCurrentFoto((prev) => {
      if (direction === 'next') return (prev + 1) % fotos.length;
      return prev === 0 ? fotos.length - 1 : prev - 1;
    });
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast('Opción en desarrollo 🚀', {
      icon: '🛠️',
      style: {
        borderRadius: '1rem',
        background: '#333',
        color: '#fff',
        fontSize: '12px',
        fontWeight: 'bold',
        textTransform: 'uppercase'
      },
    });
  };

  const handleCopy = async () => {
    if (!reporte.contacto) return;
    try {
      await navigator.clipboard.writeText(reporte.contacto);
      setCopied(true);
      toast.success('¡Contacto copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <>
      <div className="relative min-w-70 max-w-70 bg-white rounded-[2.5rem] p-5 shadow-sm border border-slate-100 flex flex-col gap-4 animate-in fade-in slide-in-from-right-4">
        <div className="absolute top-4 right-4 flex gap-2 z-20">
          <button 
            onClick={handleShare}
            className="p-2 bg-white/80 backdrop-blur-md text-slate-600 rounded-full shadow-lg active:scale-90 transition-transform hover:bg-white"
          >
            <Share2 size={14} />
          </button>
          {esMia && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(reporte.id); }} 
              className="p-2 bg-red-500 text-white rounded-full shadow-lg active:scale-90 transition-transform hover:bg-red-600"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        <div
          className="relative h-40 bg-slate-100 rounded-2xl overflow-hidden group/img cursor-zoom-in"
          onClick={() => setImgZoom(fotos[currentFoto])}
        >
          <img
            src={fotos[currentFoto]}
            className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110"
            alt="Mascota"
          />

          <div className="absolute top-2 left-2 px-2 py-1 bg-red-600 text-white text-[8px] font-black rounded-lg uppercase shadow-lg">
            Perdido
          </div>

          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
            <Maximize2 size={20} className="text-white shadow-sm" />
          </div>

          {tieneMasFotos && (
            <>
              <button onClick={(e) => changeFoto(e, 'prev')} className="absolute left-2 top-1/2 -translate-y-1/2 p-1 bg-white/30 backdrop-blur-md text-white rounded-full hover:bg-white/50"><ChevronLeft size={14} /></button>
              <button onClick={(e) => changeFoto(e, 'next')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-white/30 backdrop-blur-md text-white rounded-full hover:bg-white/50"><ChevronRight size={14} /></button>
            </>
          )}
        </div>

        <div className="space-y-2 relative">
          <div className="flex justify-between items-start gap-2">
            <p className="text-[11px] font-bold text-slate-700 leading-snug line-clamp-2 flex-1 min-h-8">
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
            <span className="text-[9px] font-black uppercase text-red-600 tracking-tighter truncate max-w-45">
              {reporte.direccion}
            </span>
          </div>
        </div>

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

      {showFullDesc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-120 flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white w-full max-w-xs rounded-[2.5rem] p-8 shadow-2xl relative">
            <button onClick={() => setShowFullDesc(false)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-900"><X size={20} /></button>
            <div className="bg-orange-100 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-orange-600"><Info size={24} /></div>
            <h3 className="font-black text-slate-800 text-lg mb-4 tracking-tight">Detalles del Reporte</h3>
            <div className="bg-slate-50 p-5 rounded-4xl border border-slate-100 max-h-[40vh] overflow-y-auto">
              <p className="text-xs font-bold text-slate-600 leading-relaxed italic">"{reporte.descripcion}"</p>
            </div>
            <button onClick={() => setShowFullDesc(false)} className="w-full mt-6 py-4 bg-orange-500 text-white rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95">Cerrar Detalle</button>
          </div>
        </div>
      )}

      {showContact && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-110 flex items-center justify-center p-6 animate-in fade-in duration-300">
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

      {imgZoom && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-200 flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setImgZoom(null)}>
          <button className="absolute top-10 right-10 text-white/50 hover:text-white"><X size={40} /></button>
          <img src={imgZoom} className="max-w-full max-h-[85vh] rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300 object-contain" alt="Zoom" />
        </div>
      )}
    </>
  );
};

export default LostPetCard;