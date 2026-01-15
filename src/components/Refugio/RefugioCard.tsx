import React, { useState } from 'react';
import {
  MapPin, Trash2, Globe, Wallet, Copy, Check,
  ChevronLeft, ChevronRight, ShieldAlert, ShieldCheck, Eye, Info, X, Maximize2
} from 'lucide-react';
import { MapContainer, TileLayer, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Swal from 'sweetalert2';

interface RefugioCardProps {
  refugio: any;
  currentUser: any;
  onDelete: (id: string) => void;
}

const RefugioCard = ({ refugio, currentUser, onDelete }: RefugioCardProps) => {

  const [currentFoto, setCurrentFoto] = useState(0);
  const [copiedAlias, setCopiedAlias] = useState(false);
  const [copiedSocial, setCopiedSocial] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [imgZoom, setImgZoom] = useState<string | null>(null);

  // ✅ LÓGICA DE PROPIEDAD: Identifica al dueño sin logs
  const esMio = currentUser && refugio.userId && 
                String(refugio.userId).trim() === String(currentUser.id).trim();

  const fotos = refugio.fotos || [];

  const nextFoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentFoto(prev => (prev + 1) % fotos.length);
  };

  const prevFoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentFoto(prev => (prev === 0 ? fotos.length - 1 : prev - 1));
  };

  const showToast = (text: string) => {
    Swal.mixin({
      toast: true,
      position: 'top',
      showConfirmButton: false,
      timer: 2000,
    }).fire({ icon: 'success', title: text });
  };

  const handleCopyAlias = () => {
    Swal.fire({
      title: '¡Aviso de Seguridad!',
      html: `
        <div class="text-left space-y-3">
          <p class="text-xs text-slate-600 font-bold">MascotAI es un nexo, no gestionamos donaciones.</p>
          <p class="text-[11px] font-bold text-violet-600 bg-violet-50 p-3 rounded-xl border border-violet-100">
            ⚠️ Por favor, verificá que el refugio sea real revisando sus fotos y redes antes de transferir dinero.
          </p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Entiendo, copiar Alias',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#7c3aed',
      cancelButtonColor: '#94a3b8',
      reverseButtons: true,
      customClass: { popup: 'rounded-[2.5rem]' }
    }).then((result) => {
      if (result.isConfirmed) {
        navigator.clipboard.writeText(refugio.aliasDonacion);
        setCopiedAlias(true);
        showToast('Alias copiado');
        setTimeout(() => setCopiedAlias(false), 2000);
      }
    });
  };

  return (
    <>
      <div className="relative min-w-[280px] max-w-[280px] bg-white rounded-[2.5rem] p-5 shadow-sm border border-slate-100 flex flex-col gap-4 animate-in fade-in slide-in-from-right-4">

        {/* BOTÓN ELIMINAR: Solo para el dueño */}
        {esMio && (
          <button
            onClick={() => {
              Swal.fire({
                title: '¿Eliminar refugio?',
                text: "Esta publicación desaparecerá de la comunidad.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar',
                customClass: { popup: 'rounded-[2rem]' }
              }).then((result) => {
                if (result.isConfirmed) onDelete(refugio.id);
              });
            }}
            className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full shadow-lg z-20 active:scale-90 transition-all hover:bg-red-600"
          >
            <Trash2 size={14} />
          </button>
        )}

        {/* CAROUSEL DE FOTOS CON ZOOM */}
        <div
          className="relative h-36 bg-slate-100 rounded-2xl overflow-hidden group/img cursor-zoom-in"
          onClick={() => setImgZoom(fotos[currentFoto])}
        >
          <img src={fotos[currentFoto]} className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" alt={refugio.nombre} />

          <div className={`absolute top-2 left-2 px-2.5 py-1 rounded-lg shadow-lg flex items-center gap-1.5 backdrop-blur-md transition-all ${refugio.verificado ? 'bg-violet-600 text-white' : 'bg-white/90 text-slate-400 border border-slate-100'}`}>
            {refugio.verificado ? <ShieldCheck size={10} fill="white" /> : <ShieldAlert size={10} />}
            <span className="text-[8px] font-black uppercase tracking-tighter">
              {refugio.verificado ? 'Verificado' : 'Sin Verificar'}
            </span>
          </div>

          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
            <Maximize2 size={20} className="text-white shadow-sm" />
          </div>

          {fotos.length > 1 && (
            <>
              <button onClick={prevFoto} className="absolute left-2 top-1/2 -translate-y-1/2 p-1 bg-white/30 backdrop-blur-md text-white rounded-full hover:bg-white/50"><ChevronLeft size={14} /></button>
              <button onClick={nextFoto} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-white/30 backdrop-blur-md text-white rounded-full hover:bg-white/50"><ChevronRight size={14} /></button>
            </>
          )}
        </div>

        {/* INFO PRINCIPAL */}
        <div className="space-y-2 text-left">
          <div className="flex justify-between items-start">
            <h4 className="font-black text-slate-800 text-base leading-none truncate flex-1">{refugio.nombre}</h4>
            <span className="text-[8px] font-black uppercase text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md shrink-0 ml-2">Refugio</span>
          </div>

          <div className="flex justify-between items-start gap-2">
            <p className="text-[11px] font-bold text-slate-500 leading-snug line-clamp-2 flex-1 min-h-[32px] break-words">
              {refugio.descripcion}
            </p>
            <button
              onClick={() => setShowFullDesc(true)}
              className="p-1.5 bg-slate-50 text-slate-400 rounded-lg hover:text-violet-500 hover:bg-violet-50 transition-colors shrink-0"
            >
              <Eye size={12} strokeWidth={3} />
            </button>
          </div>

          <div className="flex items-center gap-1 px-2 py-1 bg-violet-50 rounded-lg w-fit">
            <MapPin size={10} className="text-violet-500" />
            <span className="text-[9px] font-black uppercase text-violet-600 tracking-tighter truncate max-w-[180px]">
              {refugio.direccion}
            </span>
          </div>
        </div>

        {/* MAPA DE REFERENCIA */}
        <div className="h-28 rounded-2xl overflow-hidden border border-slate-100 relative grayscale-[0.4] contrast-[0.9]">
          <MapContainer center={[refugio.lat || 0, refugio.lng || 0]} zoom={15} scrollWheelZoom={false} zoomControl={false} dragging={false} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Circle
              center={[refugio.lat || 0, refugio.lng || 0]}
              radius={200}
              pathOptions={{ color: '#7c3aed', fillColor: '#7c3aed', fillOpacity: 0.3 }}
            />
          </MapContainer>
        </div>

        {/* ACCIONES */}
        <div className="space-y-2">
          <button
            onClick={handleCopyAlias}
            className={`w-full py-3 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 transition-all active:scale-95 border-2 ${copiedAlias ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-violet-50 border-violet-100 text-violet-600'}`}
          >
            {copiedAlias ? <Check size={14} /> : <Wallet size={14} />}
            <span className="truncate">{copiedAlias ? '¡Copiado!' : `Donar: ${refugio.aliasDonacion}`}</span>
          </button>

          <button
            onClick={() => {
              navigator.clipboard.writeText(refugio.redSocial);
              showToast('Link copiado');
            }}
            className="w-full py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-slate-100"
          >
            <Globe size={14} /> Red Social / Web
          </button>
        </div>
      </div>

      {/* ZOOM MODAL */}
      {imgZoom && (
        <div
          className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setImgZoom(null)}
        >
          <button className="absolute top-10 right-10 text-white/50 hover:text-white transition-colors">
            <X size={40} />
          </button>
          <img
            src={imgZoom}
            className="max-w-full max-h-[85vh] rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300 object-contain"
            alt="Zoom Refugio"
          />
        </div>
      )}

      {/* MODAL DE DESCRIPCIÓN */}
      {showFullDesc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[120] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-0 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-50 rounded-full blur-3xl opacity-60" />
            <button onClick={() => setShowFullDesc(false)} className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 hover:text-violet-600 rounded-full transition-all z-10"><X size={20} /></button>

            <div className="px-8 pt-10 pb-8 flex flex-col items-center">
              <div className="bg-violet-100 p-4 rounded-2xl text-violet-600 mb-4 shadow-sm">
                <Info size={28} strokeWidth={2.5} />
              </div>
              <p className="text-[9px] font-black text-violet-400 uppercase tracking-[0.25em] mb-1">Refugio Solidario</p>
              <h3 className="font-black text-slate-800 text-xl tracking-tight text-center leading-tight mb-6 break-words w-full">
                Sobre {refugio.nombre}
              </h3>
              <div className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] overflow-hidden relative">
                <div className="p-6 max-h-[35vh] overflow-y-auto custom-scrollbar">
                  <p className="text-sm font-bold text-slate-600 leading-relaxed text-left whitespace-pre-wrap break-words">
                    {refugio.descripcion}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowFullDesc(false)} className="w-full mt-8 py-4 bg-violet-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-violet-200 active:scale-95 transition-all">Cerrar Detalle</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RefugioCard;