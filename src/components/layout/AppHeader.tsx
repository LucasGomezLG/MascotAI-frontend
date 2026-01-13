import React from 'react';
import { Dog, Bell, User as UserIcon, PawPrint, Heart } from 'lucide-react';
import NotificationsCenter from '../ui/NotificationsCenter';
import { useAuth } from '../../context/AuthContext'; // 🛡️ Importante

interface AppHeaderProps {
  user: any;
  setActiveTab: (tab: any) => void;
  alertas: any[];
  showAlerts: boolean;
  setShowAlerts: (show: boolean) => void;
  onMarkRead: (id: string) => Promise<void>;
  setShowLogoutModal: (show: boolean) => void;
  activeTab: string;
}

export default function AppHeader({
  user, setActiveTab, alertas, showAlerts,
  setShowAlerts, onMarkRead, setShowLogoutModal, activeTab
}: AppHeaderProps) {

  const { refreshUser } = useAuth(); // 🔄 Consumimos refreshUser

  const nombreRaw = user?.nombre || user?.name || user?.displayName || 'Usuario';
  const firstName = nombreRaw.split(' ')[0];
  const profileImage = user?.picture || user?.foto || null;

  // 🚀 Función para actualizar y abrir el panel de perfil
  const handleAvatarClick = () => {
    refreshUser(); // Dispara el nuevo endpoint en segundo plano
    setShowLogoutModal(true); // Abre el modal
  };

  return (
    <header
      className="bg-white p-4 border-b sticky top-0 z-40 flex items-center justify-between shadow-sm"
      style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}
    >
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('home')}>
        <div className="bg-orange-600 p-2 rounded-xl shadow-lg rotate-3">
          <Dog size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-orange-900 tracking-tighter uppercase leading-none">MascotAI</h1>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Hola, {firstName}!</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className={`p-2.5 rounded-xl transition-all ${alertas.length > 0 ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-400'}`}
          >
            <Bell size={20} />
            {alertas.length > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
            )}
          </button>
          {showAlerts && (
            <NotificationsCenter alertas={alertas} onMarkRead={onMarkRead} onClose={() => setShowAlerts(false)} />
          )}
        </div>

        <button
          onClick={() => setActiveTab('pets')}
          className={`p-2.5 rounded-xl transition-all ${activeTab === 'pets' ? 'bg-orange-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}
        >
          <PawPrint size={20} />
        </button>

        {/* 📸 BOTÓN DE AVATAR ACTUALIZADO */}
        <button
          onClick={handleAvatarClick}
          className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-orange-100 bg-slate-100 flex items-center justify-center shadow-sm active:scale-90 transition-transform ml-1"
        >
          {profileImage ? (
            <img src={profileImage} alt="profile" className="w-full h-full object-cover" />
          ) : (
            <UserIcon size={20} className="text-slate-400" />
          )}

          {user?.esColaborador && (
            <div className="absolute -top-1 -right-1 bg-orange-500 rounded-full border-2 border-white p-0.5">
              <Heart size={8} className="text-white fill-white" />
            </div>
          )}
        </button>
      </div>
    </header>
  );
}