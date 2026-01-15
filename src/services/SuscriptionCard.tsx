import React, { useState, useEffect } from 'react';
import { Heart, Sparkles, Loader2, CalendarDays } from 'lucide-react';
import { api } from '../services/api';
import Swal from 'sweetalert2';

// 🛡️ Declaramos MercadoPago para que TypeScript reconozca el script del index.html
declare var MercadoPago: any;

const SubscriptionCard = ({ user }: { user: any }) => {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'donar' | 'suscribir'>('donar');
  const [monto, setMonto] = useState<number>(1000);
  const [error, setError] = useState<string>("");

  // ✅ Inicialización del SDK de Mercado Pago para seguridad y métricas
  useEffect(() => {
    const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY;

    if (typeof MercadoPago !== 'undefined' && publicKey) {
      try {
        // Esto inicializa el "Device Fingerprinting" de MP, mejorando la aprobación de pagos
        new MercadoPago(publicKey, {
          locale: 'es-AR'
        });
      } catch (error) {
        console.error("❌ Error al inicializar MP SDK:", error);
      }
    }
  }, []);

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
    Swal.fire({
      title: 'Función en desarrollo',
      text: 'Estamos trabajando para habilitar las colaboraciones muy pronto. ¡Gracias por tu paciencia!',
      icon: 'info',
      confirmButtonColor: '#f97316',
      customClass: { popup: 'rounded-[2rem]' }
    });
    return;

    setError("");

    const montoFinal = mode === 'suscribir' ? 8000 : monto;

    // Validaciones para modo Donar
    if (mode === 'donar') {
      if (isNaN(montoFinal) || montoFinal < 500) {
        setError("El monto mínimo para colaborar es de AR$ 500");
        return;
      }
      if (montoFinal > 1000000) {
        setError("El monto máximo permitido es de AR$ 1.000.000");
        return;
      }
    }

    setLoading(true);
    try {
      // Usamos el mismo endpoint, el backend recibirá el monto
      // Si es 8000 y modo suscribir, podrías luego adaptar el backend para recurrencia
      const response = await api.crearSuscripcion(montoFinal);
      console.log("📥 [DONACIÓN] Respuesta del servidor:", response.data);

      if (response.data && response.data.url) {
        const urlPago = response.data.url;
        console.log("🔗 [DONACIÓN] Redirigiendo a Mercado Pago:", urlPago);

        // LOG DE SEGURIDAD: Verificar si la URL contiene "sandbox"
        if (urlPago.includes("sandbox")) {
          console.warn("⚠️ [MODO TEST] Estás usando un link de SANDBOX. Recordá usar ventana de Incógnito.");
        }

        window.location.href = urlPago;
      } else {
        console.error("❌ [DONACIÓN] El servidor no devolvió una URL válida.");
        setError("No se pudo generar el link de pago. Intenta de nuevo.");
      }
    } catch (error: any) {
      console.error("❌ [DONACIÓN] Error en la petición:", error.response?.data || error.message);
      setError("Error al generar el link. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
      {/* Decoración de fondo */}
      <Heart
        className="absolute -bottom-4 -right-4 text-white/10 rotate-12 group-hover:scale-110 transition-transform"
        size={120}
      />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter leading-none mb-1">
              {mode === 'donar' ? 'Colaborá con' : 'Suscribite a'} <br /> MascotAI
            </h3>
            <p className="text-[9px] font-bold opacity-80 uppercase tracking-widest">
              {mode === 'donar' ? 'Ayuda por única vez' : 'Apoyo mensual continuo'}
            </p>
          </div>
          {mode === 'suscribir' && <CalendarDays size={32} className="text-white/20" />}
        </div>

        {/* Switch de Modo */}
        <div className="flex bg-orange-900/20 p-1 rounded-2xl mb-6 border border-white/10">
          <button
            onClick={() => { setMode('donar'); setError(""); }}
            className={`flex-1 py-2 rounded-xl font-black text-[10px] uppercase transition-all ${mode === 'donar' ? 'bg-white text-orange-600 shadow-md' : 'text-white/60 hover:text-white'}`}
          >
            Donar
          </button>
          <button
            onClick={() => { setMode('suscribir'); setError(""); }}
            className={`flex-1 py-2 rounded-xl font-black text-[10px] uppercase transition-all ${mode === 'suscribir' ? 'bg-white text-orange-600 shadow-md' : 'text-white/60 hover:text-white'}`}
          >
            Suscribir
          </button>
        </div>

        {/* Input de Monto */}
        <div className="mb-6">
          {mode === 'donar' ? (
            <>
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/80 block mb-2">
                ¿Cuánto querés donar? (AR$)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white font-bold">$</span>
                <input
                  type="number"
                  value={monto}
                  onChange={(e) => {
                    setMonto(parseInt(e.target.value) || 0);
                    setError("");
                  }}
                  className="w-full pl-8 pr-4 py-3 bg-orange-600/40 text-white font-bold rounded-xl border-2 border-orange-300/40 focus:border-orange-200/60 outline-none transition-all placeholder-white/50 text-lg"
                  placeholder="1000"
                />
              </div>
              <p className="text-[8px] text-white/60 mt-2">Mínimo: AR$ 500</p>
            </>
          ) : (
            <div className="bg-white/10 p-4 rounded-2xl border-2 border-white/20 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-1">Monto Fijo Mensual</p>
              <p className="text-3xl font-black text-white">AR$ 8.000 <span className="text-xs font-bold opacity-60">/ mes</span></p>
            </div>
          )}
          {error && <p className="text-[10px] font-bold text-red-200 mt-2 bg-red-900/30 p-2 rounded-lg">{error}</p>}
        </div>

        <button
          onClick={handleSuscripcion}
          disabled={loading}
          className="w-full py-4 bg-orange-600/40 text-white rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-orange-600/60 border-2 border-orange-300/40"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <>{mode === 'donar' ? 'Colaborar ahora' : 'Activar Suscripción'} AR$ {(mode === 'suscribir' ? 8000 : monto).toLocaleString('es-AR')}</>
          )}
        </button>
      </div>
    </div>
  );
};

export default SubscriptionCard;