import React, { useState } from 'react';
import { 
  MapPin, Trash2, Globe, Wallet, Copy, Check, 
  ChevronLeft, ChevronRight, ShieldAlert, ExternalLink 
} from 'lucide-react';
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
  
  const esMio = refugio.userId === currentUser?.id;

  const nextFoto = () => setCurrentFoto(prev => (prev + 1) % refugio.fotos.length);
  const prevFoto = () => setCurrentFoto(prev => (prev === 0 ? refugio.fotos.length - 1 : prev - 1));

  // 📋 Feedback rápido de copiado
  const showToast = (text: string) => {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });
    Toast.fire({ icon: 'success', title: text });
  };

  // 🛡️ COPIADO CON ADVERTENCIA DE SEGURIDAD
  const handleCopyAlias = () => {
    Swal.fire({
      title: '¡Aviso de Seguridad!',
      html: `
        <div class="text-left space-y-3">
          <p class="text-sm text-slate-600">MascotAI es una plataforma para conectar personas, pero no gestionamos las donaciones directamente.</p>
          <p class="text-sm font-bold text-orange-600">⚠️ Por favor, verificá que el refugio sea real revisando sus redes sociales antes de transferir dinero.</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Entiendo, copiar Alias',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#7c3aed', // Color violeta del refugio
      cancelButtonColor: '#94a3b8',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-[2rem]',
        confirmButton: 'rounded-xl font-black uppercase text-xs px-6 py-3',
        cancelButton: 'rounded-xl font-black uppercase text-xs px-6 py-3'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        // Ejecutamos el copiado solo si el usuario acepta
        navigator.clipboard.writeText(refugio.aliasDonacion);
        setCopiedAlias(true);
        showToast('Alias copiado con éxito');
        setTimeout(() => setCopiedAlias(false), 2000);
      }
    });
  };

  const handleCopySocial = () => {
    navigator.clipboard.writeText(refugio.redSocial);
    setCopiedSocial(true);
    showToast('Contacto copiado');
    setTimeout(() => setCopiedSocial(false), 2000);
  };

  return (
    <div className="relative min-w-[280px] max-w-[280px] bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 flex flex-col group animate-in fade-in">
      
      {esMio && (
        <button 
          onClick={() => onDelete(refugio.id)}
          className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full shadow-lg z-20 active:scale-90 transition-all"
        >
          <Trash2 size={12} />
        </button>
      )}

      {/* CAROUSEL DE FOTOS */}
      <div className="relative h-44 bg-slate-100 group/img">
        <img src={refugio.fotos[currentFoto]} className="w-full h-full object-cover" alt={refugio.nombre} />
        
        {refugio.fotos.length > 1 && (
          <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex justify-between opacity-0 group-hover/img:opacity-100 transition-opacity">
            <button onClick={prevFoto} className="p-1.5 bg-white/20 backdrop-blur-md text-white rounded-full"><ChevronLeft size={16}/></button>
            <button onClick={nextFoto} className="p-1.5 bg-white/20 backdrop-blur-md text-white rounded-full"><ChevronRight size={16}/></button>
          </div>
        )}

        <div className="absolute bottom-3 left-3 px-3 py-1 bg-violet-600 text-white rounded-full shadow-lg z-10">
          <span className="text-[8px] font-black uppercase tracking-widest italic">Refugio Solidario</span>
        </div>
      </div>

      <div className="p-5 space-y-4 text-left">
        <div>
          <h4 className="font-black text-slate-800 text-lg leading-tight truncate">{refugio.nombre}</h4>
          <div className="flex items-center gap-1 mt-1 text-slate-400">
            <MapPin size={10} className="text-violet-500" />
            <span className="text-[9px] font-bold uppercase truncate">{refugio.direccion}</span>
          </div>
        </div>

        <p className="text-[11px] font-bold text-slate-500 line-clamp-2 leading-relaxed">
          {refugio.descripcion}
        </p>

        <div className="space-y-2">
          {/* BOTÓN ALIAS (AHORA CON SEGURIDAD) */}
          <button 
            onClick={handleCopyAlias}
            className={`w-full py-3 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 transition-all active:scale-95 border-2 ${copiedAlias ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-violet-50 border-violet-100 text-violet-600'}`}
          >
            {copiedAlias ? <Check size={14} /> : <Wallet size={14} />}
            <span className="truncate max-w-[180px]">
                {copiedAlias ? '¡Alias Copiado!' : `Alias: ${refugio.aliasDonacion}`}
            </span>
          </button>

          {/* BOTÓN RED SOCIAL */}
          <button 
            onClick={handleCopySocial}
            className={`w-full py-3 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 transition-all active:scale-95 border-2 ${copiedSocial ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-100'}`}
          >
            {copiedSocial ? <Check size={14} /> : <Globe size={14} />}
            <span className="truncate max-w-[180px]">
                {copiedSocial ? '¡Copiado!' : refugio.redSocial}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RefugioCard;