import React, { useState } from 'react';
import { Heart, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../services/api';

const SubscriptionCard = ({ user }: { user: any }) => {
  const [loading, setLoading] = useState(false);

  // Si el usuario ya es colaborador, le mostramos un mensaje de agradecimiento
  if (user?.esColaborador) {
    return (
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2.5rem] p-6 text-white shadow-lg animate-in fade-in zoom-in duration-500">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles size={24} className="text-yellow-300" />
          <h3 className="text-xl font-black uppercase tracking-tight">¡Sos Colaborador!</h3>
        </div>
        <p className="text-xs font-bold opacity-90">
          Gracias por ayudar a que MascotAI siga creciendo para todos los vecinos.
        </p>
      </div>
    );
  }

  const handleSuscripcion = async () => {
    setLoading(true);
    try {
      const response = await api.crearSuscripcion();
      // ✅ Redirigimos a la URL que nos dio el Backend (init_point de Mercado Pago)
      window.location.href = response.data.url; 
    } catch (error) {
      alert("No se pudo generar el link de pago. Reintentá en unos minutos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
      {/* Decoración de fondo */}
      <Heart className="absolute -bottom-4 -right-4 text-white/10 rotate-12 group-hover:scale-110 transition-transform" size={120} />
      
      <div className="relative z-10">
        <h3 className="text-2xl font-black uppercase tracking-tighter leading-none mb-2">
          Colaborá con <br/> MascotAI
        </h3>
        <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mb-6">
          Ayudanos con los costos del servidor y mapas
        </p>
        
        <button 
          onClick={handleSuscripcion}
          disabled={loading}
          className="w-full py-4 bg-white text-orange-600 rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <>Suscripción Mensual (AR$ 2000)</>
          )}
        </button>
        
        <p className="text-[8px] text-center mt-4 opacity-60 font-bold uppercase italic">
          Podes cancelar cuando quieras desde Mercado Pago
        </p>
      </div>
    </div>
  );
};

export default SubscriptionCard;