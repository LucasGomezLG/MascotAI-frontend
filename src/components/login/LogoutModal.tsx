import React, { useEffect, useState } from 'react';
import { LogOut, X, Zap, Heart, Loader2, User as UserIcon, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  handleSuscripcion: () => void; // ✅ Definimos que recibimos la función
}

const LogoutModal = ({ isOpen, onClose, onConfirm, handleSuscripcion }: Props) => {
  const { user, refreshUser } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 🔄 Cada vez que se abre el modal, refrescamos los datos
  useEffect(() => {
    if (isOpen) syncCredits();
  }, [isOpen]);

  const syncCredits = async () => {
    setIsRefreshing(true);
    await refreshUser();
    setIsRefreshing(false);
  };

  if (!isOpen) return null;

  const restantes = Math.max(0, 10 - (user?.intentosIA || 0));

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-10 duration-500 overflow-hidden relative">
        
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 z-0" />

        <div className="relative z-10">
          {/* Cabecera: Foto y Nombre */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              <div className="relative">
                {user?.picture ? (
                  <img src={user.picture} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <UserIcon size={32} />
                  </div>
                )}
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 border-2 border-white rounded-full ${user?.esColaborador ? 'bg-orange-500' : 'bg-emerald-500'}`} />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-black text-slate-800 leading-none mb-1">{user?.name?.split(' ')[0]}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[150px]">{user?.email}</p>
              </div>
            </div>
            <button onClick={onClose} className="bg-slate-50 p-2 rounded-full text-slate-400 hover:text-slate-900 transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Sección de IA Credits / Suscripción */}
          <div className="space-y-3 mb-8">
            {user?.esColaborador ? (
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-[2rem] text-white shadow-lg shadow-orange-100 relative overflow-hidden">
                <Sparkles className="absolute -right-2 -top-2 opacity-20" size={60} />
                <div className="flex items-center gap-3 mb-2">
                  <Heart className="fill-white" size={20} />
                  <span className="font-black text-xs uppercase tracking-widest">Colaborador Gold</span>
                </div>
                <p className="text-xs font-bold opacity-90 text-left leading-relaxed italic">
                  "Gracias por tu apoyo. Tu ayuda mantiene vivos los servidores de MascotAI."
                </p>
              </div>
            ) : (
              <>
                <div className="bg-slate-900 p-6 rounded-[2.5rem] text-white relative overflow-hidden group">
                  <Zap className="absolute -right-4 -bottom-4 text-white/10 rotate-12" size={100} />
                  <div className="relative z-10 flex justify-between items-center">
                    <div className="text-left">
                      <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                        Energía MascotAI {isRefreshing && <Loader2 size={10} className="animate-spin" />}
                      </p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black">{restantes}</span>
                        <span className="text-slate-400 font-bold">/ 10</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Escaneos Disponibles</p>
                    </div>
                    <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner">
                      <Zap className="text-orange-400 fill-orange-400" size={24} />
                    </div>
                  </div>
                </div>

                {/* ✅ EL BOTÓN DE COLABORAR: Llama a handleSuscripcion de App.tsx */}
                <button 
                  onClick={() => { onClose(); handleSuscripcion(); }}
                  className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-100 flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <Heart size={14} fill="currentColor" /> Ser Colaborador ❤️
                </button>
              </>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <button 
              onClick={onConfirm}
              className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <LogOut size={16} /> Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;