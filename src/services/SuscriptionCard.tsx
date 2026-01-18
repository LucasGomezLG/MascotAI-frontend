import React, {useEffect} from 'react';
import {CalendarDays, Heart, Sparkles} from 'lucide-react';
import type {UserDTO} from '@/types/api.types';
import toast from 'react-hot-toast';

interface MercadoPagoStatic {
  new(publicKey: string, options?: { locale: string }): void;
}
declare let MercadoPago: MercadoPagoStatic;

const SubscriptionCard = ({ user }: { user: UserDTO | null }) => {

  useEffect(() => {
    const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY;
    if (typeof MercadoPago !== 'undefined' && publicKey) {
      try {
        new MercadoPago(publicKey, { locale: 'es-AR' });
      } catch (err) {
        console.error("❌ Error al inicializar MP SDK:", err);
      }
    }
  }, []);

  if (user?.esColaborador) {
    const fechaFin = user.fechaFinColaborador ? new Date(user.fechaFinColaborador) : null;
    const fechaFormateada = fechaFin ? fechaFin.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }) : '';

    return (
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2.5rem] p-6 text-white shadow-lg animate-in fade-in zoom-in duration-500">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles size={24} className="text-yellow-300" />
          <h3 className="text-xl font-black uppercase tracking-tight">¡Sos Pro!</h3>
        </div>
        <p className="text-xs font-bold opacity-90">
          Gracias por apoyar MascotAI. {fechaFormateada && `Tu pase Pro vence el ${fechaFormateada}.`}
        </p>
      </div>
    );
  }

  const handleSuscripcion = () => {
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

  return (
    <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
      <Heart
        className="absolute -bottom-4 -right-4 text-white/10 rotate-12 group-hover:scale-110 transition-transform"
        size={120}
      />
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter leading-none mb-1">
              Pase Mensual <br /> MascotAI Pro
            </h3>
            <p className="text-[9px] font-bold opacity-80 uppercase tracking-widest">
              Acceso ilimitado a todas las funciones
            </p>
          </div>
          <CalendarDays size={32} className="text-white/20" />
        </div>
        
        <div className="mb-6">
          <div className="bg-white/10 p-4 rounded-2xl border-2 border-white/20 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-1">Suscripción Mensual</p>
            <p className="text-3xl font-black text-white">AR$ 8.000 <span className="text-xs font-bold opacity-60">/ mes</span></p>
          </div>
          <ul className="mt-4 space-y-2">
            <li className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tight">
                <Sparkles size={12} className="text-yellow-300" /> IA Ilimitada (999 intentos)
            </li>
            <li className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tight">
                <Sparkles size={12} className="text-yellow-300" /> Destacar productos en Marketplace
            </li>
            <li className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tight">
                <Sparkles size={12} className="text-yellow-300" /> Soporte prioritario
            </li>
          </ul>
        </div>
        <button
          onClick={handleSuscripcion}
          className="w-full py-4 bg-white text-orange-600 rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-orange-50"
        >
          Contratar Pro
        </button>
      </div>
    </div>
  );
};

export default SubscriptionCard;