import React, { useState, useEffect } from 'react';
import { 
  Camera, Dog, LayoutDashboard, Stethoscope, ShieldPlus, 
  Bell, User as UserIcon, Settings, PawPrint 
} from 'lucide-react'; // ✅ Quitamos 'Plus' de los imports si no se usa más aquí
import { api } from './services/api';
import { useAuth } from './context/AuthContext';
import LoginView from './components/login/LoginView';
import FoodScanner from './components/scanner/FoodScanner';
import VetScanner from './components/scanner/vet/VetScanner';
import SaludScanner from './components/scanner/SaludScanner';
import ReportsManager from './components/reports/ReportsManager';
import PetModal from './components/ui/PetModal';
import NotificationsCenter from './components/ui/NotificationsCenter';
import LogoutModal from './components/login/LogoutModal';
import PetProfiles from './components/PetProfiles'; 

type TabType = 'scanner' | 'stats' | 'vet' | 'health' | 'pets';

function App() {
  const { user, loading: authLoading, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('scanner');
  const [mascotas, setMascotas] = useState<any[]>([]);
  const [showPetModal, setShowPetModal] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [foodParaVer, setFoodParaVer] = useState<any>(null);
  const [vetParaVer, setVetParaVer] = useState<any>(null);
  const [healthParaVer, setHealthParaVer] = useState<any>(null);

  const refreshData = () => {
    if (!user) return;
    api.getPerfiles().then(res => setMascotas(res.data)).catch(() => {});
    api.getAlertasSistema().then(res => setAlertas(res.data)).catch(() => {});
  };

  useEffect(() => {
    if (user) refreshData();
  }, [user]);

  if (authLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-black text-orange-900 uppercase text-xs tracking-widest">Verificando sesión...</p>
      </div>
    );
  }

  if (!user) return <LoginView />;

  const verDetalle = (item: any, tipo: 'food' | 'vet' | 'health') => {
    if (tipo === 'food') { setFoodParaVer(item); setActiveTab('scanner'); }
    else if (tipo === 'vet') { setVetParaVer(item); setActiveTab('vet'); }
    else { setHealthParaVer(item); setActiveTab('health'); }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24 text-left">
      <header className="bg-white p-4 border-b sticky top-0 z-40 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('scanner')}>
          <div className="bg-orange-600 p-2 rounded-xl shadow-lg rotate-3"><Dog size={24} className="text-white" /></div>
          <div>
            <h1 className="text-xl font-black text-orange-900 tracking-tighter uppercase leading-none">MascotAI</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
              Hola, {user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuario'}!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Notificaciones */}
          <div className="relative">
            <button onClick={() => setShowAlerts(!showAlerts)} className={`p-2 rounded-xl transition-all ${alertas.length > 0 ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-400'}`}>
              <Bell size={20} />
              {alertas.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>}
            </button>
            {showAlerts && <NotificationsCenter alertas={alertas} onMarkRead={(id: string) => api.marcarAlertaLeida(id).then(refreshData)} onClose={() => setShowAlerts(false)} />}
          </div>

          {/* ÍCONO ANIMALITO -> Gestión de Mascotas */}
          <button 
            onClick={() => setActiveTab('pets')}
            className={`p-2 rounded-xl transition-all ${activeTab === 'pets' ? 'bg-orange-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}
          >
            <PawPrint size={20} />
          </button>

          {/* Foto de Perfil -> Logout */}
          <button 
            onClick={() => setShowLogoutModal(true)} 
            className="w-10 h-10 rounded-xl overflow-hidden border-2 border-orange-100 shadow-sm active:scale-90 transition-transform"
          >
            {user.picture ? (
              <img src={user.picture} alt="profile" className="w-full h-full object-cover" />
            ) : (
              <div className="bg-slate-100 w-full h-full flex items-center justify-center text-slate-400">
                <UserIcon size={20} />
              </div>
            )}
          </button>

          {/* ✅ BOTÓN "+" ELIMINADO DE AQUÍ PARA CENTRALIZAR EN PETPROFILES */}
        </div>
      </header>

      <main className="max-w-md mx-auto p-6">
        {activeTab === 'scanner' && <FoodScanner mascotas={mascotas} onScanComplete={refreshData} initialData={foodParaVer} onReset={() => setFoodParaVer(null)} />}
        {activeTab === 'vet' && <VetScanner mascotas={mascotas} onScanComplete={refreshData} initialData={vetParaVer} onReset={() => setVetParaVer(null)} />}
        {activeTab === 'health' && <SaludScanner mascotas={mascotas} onScanComplete={refreshData} initialData={healthParaVer} onReset={() => setHealthParaVer(null)} />}
        {activeTab === 'stats' && <ReportsManager onVerDetalle={verDetalle} />}
        
        {activeTab === 'pets' && (
          <div className="space-y-6">
            <PetProfiles 
              mascotas={mascotas} 
              onUpdate={refreshData} 
              onAddClick={() => setShowPetModal(true)} // ✅ El modal se sigue abriendo desde aquí
            />
          </div>
        )}
      </main>

      {showPetModal && <PetModal onClose={() => { setShowPetModal(false); refreshData(); }} />}
      <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} onConfirm={logout} />

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 pb-8 flex justify-around items-center z-50">
        <button onClick={() => setActiveTab('scanner')} className={`flex flex-col items-center gap-1 ${activeTab === 'scanner' ? 'text-orange-600 scale-110' : 'text-slate-400'}`}><Camera size={24} /><span className="text-[10px] font-black uppercase">Comida</span></button>
        <button onClick={() => setActiveTab('vet')} className={`flex flex-col items-center gap-1 ${activeTab === 'vet' ? 'text-red-600 scale-110' : 'text-slate-400'}`}><Stethoscope size={24} /><span className="text-[10px] font-black uppercase">Vete</span></button>
        <button onClick={() => setActiveTab('health')} className={`flex flex-col items-center gap-1 ${activeTab === 'health' ? 'text-emerald-600 scale-110' : 'text-slate-400'}`}><ShieldPlus size={24} /><span className="text-[10px] font-black uppercase">Salud</span></button>
        <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center gap-1 ${activeTab === 'stats' ? 'text-orange-600 scale-110' : 'text-slate-400'}`}><LayoutDashboard size={24} /><span className="text-[10px] font-black uppercase">Reportes</span></button>
      </nav>
    </div>
  );
}

export default App;