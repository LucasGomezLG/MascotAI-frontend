import React, { useState } from 'react';
import type { ProductoDTO, UserDTO } from '@/types/api.types';
import { Star, MessageCircle, Zap, ChevronLeft, ChevronRight, ShoppingBag, Calendar, X, ShieldAlert, Check, Copy, Maximize2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProductoCardProps {
  producto: ProductoDTO;
  currentUser: UserDTO;
}

export default function ProductoCard({ producto, currentUser }: ProductoCardProps) {
  const [currentFoto, setCurrentFoto] = useState(0);
  const [showContact, setShowContact] = useState(false);
  const [imgZoom, setImgZoom] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const isOwner = producto.userId === currentUser.id;

  const fotos = producto.fotos || [];
  const tieneMasFotos = fotos.length > 1;

  const handleDestacar = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast('Función en desarrollo 🛠️', {
      icon: '🚀',
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
    if (!producto.contacto) return;
    try {
      await navigator.clipboard.writeText(producto.contacto);
      setCopied(true);
      toast.success('¡Contacto copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const changeFoto = (e: React.MouseEvent, direction: 'next' | 'prev') => {
    e.stopPropagation();
    setCurrentFoto((prev) => {
      if (direction === 'next') return (prev + 1) % fotos.length;
      return prev === 0 ? fotos.length - 1 : prev - 1;
    });
  };

  const getDiasRestantes = (fechaFin?: string) => {
    if (!fechaFin) return null;
    const fin = new Date(fechaFin);
    const hoy = new Date();
    const diff = fin.getTime() - hoy.getTime();
    const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return dias > 0 ? dias : 0;
  };

  const diasRestantes = getDiasRestantes(producto.fechaFinDestaque);

  return (
    <>
      <div className={`w-full bg-white rounded-3xl p-3 shadow-sm border-2 transition-all flex flex-col hover:shadow-md ${producto.destacado ? 'border-orange-400 shadow-orange-50' : 'border-slate-100'}`}>
        <div 
          className="relative h-36 mb-3 rounded-2xl overflow-hidden bg-slate-100 group cursor-zoom-in"
          onClick={() => fotos.length > 0 && setImgZoom(fotos[currentFoto])}
        >
          {fotos.length > 0 ? (
            <>
              <img src={fotos[currentFoto]} alt={producto.nombre} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Maximize2 size={20} className="text-white shadow-sm" />
              </div>

              {tieneMasFotos && (
                <>
                  <button onClick={(e) => changeFoto(e, 'prev')} className="absolute left-2 top-1/2 -translate-y-1/2 p-1 bg-white/30 backdrop-blur-md text-white rounded-full hover:bg-white/50 transition-all"><ChevronLeft size={14} /></button>
                  <button onClick={(e) => changeFoto(e, 'next')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-white/30 backdrop-blur-md text-white rounded-full hover:bg-white/50 transition-all"><ChevronRight size={14} /></button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {fotos.map((_, i) => (
                      <div key={i} className={`w-1 h-1 rounded-full transition-all ${i === currentFoto ? 'bg-white w-2.5' : 'bg-white/50'}`} />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-1">
              <ShoppingBag size={24} strokeWidth={1} />
              <span className="text-[7px] font-black uppercase tracking-widest">Sin fotos</span>
            </div>
          )}
          {producto.destacado && (
            <div className="absolute top-2 left-2 bg-orange-500 text-white px-1.5 py-0.5 rounded-full text-[6px] font-black uppercase tracking-widest flex items-center gap-0.5 shadow-lg animate-pulse">
              <Star size={6} fill="white" /> VIP
            </div>
          )}
        </div>

        <div className="space-y-1 mb-3 flex-1">
          <div className="flex justify-between items-start gap-1">
            <h3 className="font-black text-slate-800 uppercase text-[10px] tracking-tight truncate flex-1 leading-tight">{producto.nombre}</h3>
            <span className="text-orange-600 font-black text-[11px] shrink-0">${producto.precio.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[6px] font-black uppercase tracking-widest">
              {producto.categoria}
            </span>
            {isOwner && producto.destacado && diasRestantes !== null && (
              <div className="flex items-center gap-0.5 text-orange-500 bg-orange-50 px-1 py-0.5 rounded border border-orange-100">
                <Calendar size={6} />
                <span className="text-[6px] font-black uppercase">{diasRestantes}d</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-1.5">
          <button
            onClick={() => setShowContact(true)}
            className="flex-1 bg-slate-900 text-white py-2 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-1 active:scale-95 transition-all shadow-sm"
          >
            <MessageCircle size={10} /> Contactar
          </button>
          
          {isOwner && !producto.destacado && (
            <button
              onClick={handleDestacar}
              className="px-2.5 bg-orange-500 text-white rounded-xl active:scale-95 transition-all flex items-center justify-center shadow-sm group/btn"
              title="Destacar"
            >
              <Zap size={12} fill="white" className="group-hover/btn:scale-110 transition-transform" />
            </button>
          )}
        </div>
      </div>

      {showContact && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-110 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xs rounded-[2.5rem] p-8 shadow-2xl relative text-center">
            <button onClick={() => setShowContact(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><X size={20} /></button>
            <div className="bg-orange-100 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 text-orange-600"><MessageCircle size={32} /></div>
            <h3 className="font-black text-slate-800 text-xl mb-1 tracking-tight">Contacto</h3>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-6 italic">MascotAI • Marketplace</p>
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl mb-6 flex gap-3 items-start text-left">
              <ShieldAlert size={16} className="text-amber-600 shrink-0" />
              <p className="text-[10px] font-bold text-amber-800 leading-tight">Verificá bien el producto antes de realizar un pago.</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 mb-6">
              <p className="text-xs font-black text-slate-700 break-all">{producto.contacto || "Sin contacto"}</p>
            </div>
            <button onClick={handleCopy} className={`w-full py-4 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-orange-600 text-white shadow-lg'}`}>
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
}