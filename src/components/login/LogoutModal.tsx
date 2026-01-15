import React, { useEffect, useState } from 'react';
import { LogOut, X, Zap, Heart, Loader2, User as UserIcon, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  handleSuscripcion: () => void;
}

const LogoutModal = ({ isOpen, onClose, onConfirm, handleSuscripcion }: Props) => {
  const { user, refreshUser } = useAuth(); // 🛡️ Importante: consumimos user del contexto
  const [isSyncing, setIsSyncing] = useState(false);

  // Cada vez que se abre el panel, pedimos la info real
  // Solo necesitamos este useEffect para asegurar que esté al día
  useEffect(() => {
    if (isOpen) {
      refreshUser();
    }
  }, [isOpen]);
  
  const handleSync = async () => {
    setIsSyncing(true);
    await refreshUser();
    setIsSyncing(false);
  };

  if (!isOpen) return null;

  // Calculamos sobre el user del contexto que acabamos de actualizar
  const restantes = Math.max(0, 10 - (user?.intentosIA || 0));

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">

        <div className="relative z-10">
          {/* Cabecera */}
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
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user?.email}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-900">
              <X size={20} />
            </button>
          </div>

          {/* Energía IA */}
          <div className="mb-8">
            {user?.esColaborador ? (
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-[2rem] text-white shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Heart className="fill-white" size={20} />
                  <span className="font-black text-xs uppercase tracking-widest">Colaborador Gold</span>
                </div>
                <p className="text-xs font-bold opacity-90 text-left">Acceso ilimitado activado.</p>
              </div>
            ) : (
              <div className="bg-slate-900 p-6 rounded-[2.5rem] text-white relative overflow-hidden">
                <Zap className="absolute -right-4 -bottom-4 text-white/10 rotate-12" size={100} />
                <div className="relative z-10 flex justify-between items-center">
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Energía MascotAI</p>
                      {isSyncing && <Loader2 size={10} className="animate-spin text-white" />}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black">{restantes}</span>
                      <span className="text-slate-400 font-bold">/ 10</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Disponibles</p>
                  </div>
                  <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10">
                    <Zap className="text-orange-400 fill-orange-400" size={24} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {!user?.esColaborador && (
            <button
              onClick={() => { 
                onClose();
                // Pequeño delay para asegurar que LogoutModal se cierre
                setTimeout(handleSuscripcion, 300);
              }}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg mb-6 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Heart size={14} fill="currentColor" /> Ser Colaborador ❤️
            </button>
          )}

          <button onClick={onConfirm} className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;