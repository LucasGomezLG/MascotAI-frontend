import React from 'react';
import { Dog, Loader2, Sparkles, Heart, Bell, User as UserIcon, PawPrint } from 'lucide-react';
import NotificationsCenter from '../ui/NotificationsCenter';

interface AppHeaderProps {
  user: any;
  setActiveTab: (tab: any) => void;
  handleSuscripcion: () => void;
  loadingSuscripcion: boolean;
  alertas: any[];
  showAlerts: boolean;
  setShowAlerts: (show: boolean) => void;
  onMarkRead: (id: string) => Promise<void>;
  setShowLogoutModal: (show: boolean) => void;
  activeTab: string;
}

export default function AppHeader({
  user, setActiveTab, handleSuscripcion, loadingSuscripcion,
  alertas, showAlerts, setShowAlerts, onMarkRead, setShowLogoutModal, activeTab
}: AppHeaderProps) {

  // ✅ Buscamos el nombre en todas las propiedades posibles que genera el Context
  const nombreRaw = user?.nombre || user?.name || user?.displayName || 'Usuario';
  const firstName = nombreRaw.split(' ')[0];

  // ✅ Buscamos la imagen evitando cualquier placeholder externo
  const profileImage = user?.picture || user?.foto || null;

  return (
    <header className="bg-white p-4 border-b sticky top-0 z-40 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('home')}>
        <div className="bg-orange-600 p-2 rounded-xl shadow-lg rotate-3">
          <Dog size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-orange-900 tracking-tighter uppercase leading-none">MascotAI</h1>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
            Hola, {firstName}!
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleSuscripcion}
          disabled={loadingSuscripcion}
          className={`p-2 rounded-xl transition-all shadow-sm active:scale-90 ${user?.esColaborador
            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
            : 'bg-gradient-to-tr from-orange-500 to-amber-400 text-white'
            }`}
        >
          {loadingSuscripcion ? (
            <Loader2 size={20} className="animate-spin" />
          ) : user?.esColaborador ? (
            <Sparkles size={20} />
          ) : (
            <Heart size={20} fill="currentColor" />
          )}
        </button>

        <div className="relative">
          <button 
            onClick={() => setShowAlerts(!showAlerts)} 
            className={`p-2 rounded-xl transition-all ${alertas.length > 0 ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-400'}`}
          >
            <Bell size={20} />
            {alertas.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full"></span>
            )}
          </button>
          {showAlerts && (
            <NotificationsCenter 
              alertas={alertas} 
              onMarkRead={onMarkRead} 
              onClose={() => setShowAlerts(false)} 
            />
          )}
        </div>

        <button 
          onClick={() => setActiveTab('pets')} 
          className={`p-2 rounded-xl transition-all ${activeTab === 'pets' ? 'bg-orange-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}
        >
          <PawPrint size={20} />
        </button>

        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-10 h-10 rounded-xl overflow-hidden border-2 border-orange-100 bg-slate-100 flex items-center justify-center shadow-sm active:scale-90 transition-transform"
        >
          {profileImage ? (
            <img 
              src={profileImage} 
              alt="profile" 
              className="w-full h-full object-cover"
              onError={(e) => {
                // Si la imagen de Google falla, la ocultamos y queda el icono gris de fondo
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <UserIcon size={20} className="text-slate-400" />
          )}
        </button>
      </div>
    </header>
  );
}