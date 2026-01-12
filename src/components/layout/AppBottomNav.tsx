import React from 'react';
import { Home, Camera, Stethoscope, ShieldPlus, LayoutDashboard } from 'lucide-react';

interface AppBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

export default function AppBottomNav({ activeTab, setActiveTab }: AppBottomNavProps) {
  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 p-4 flex justify-around items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
      style={{ 
        // 🛡️ Ajuste fundamental para dispositivos con gestos (iPhone/Android moderno)
        paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' 
      }}
    >
      {/* INICIO */}
      <button 
        onClick={() => setActiveTab('home')} 
        className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${activeTab === 'home' ? 'text-orange-600 scale-105' : 'text-slate-400'}`}
      >
        <Home size={24} className={activeTab === 'home' ? 'fill-orange-50' : ''} />
        <span className="text-[8px] font-black uppercase tracking-tighter">Inicio</span>
      </button>

      {/* ESCÁNER DE COMIDA */}
      <button 
        onClick={() => setActiveTab('scanner')} 
        className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${activeTab === 'scanner' ? 'text-orange-600 scale-105' : 'text-slate-400'}`}
      >
        <Camera size={24} className={activeTab === 'scanner' ? 'fill-orange-50' : ''} />
        <span className="text-[8px] font-black uppercase tracking-tighter">Comida</span>
      </button>

      {/* VETERINARIO */}
      <button 
        onClick={() => setActiveTab('vet')} 
        className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${activeTab === 'vet' ? 'text-red-600 scale-105' : 'text-slate-400'}`}
      >
        <Stethoscope size={24} className={activeTab === 'vet' ? 'fill-red-50' : ''} />
        <span className="text-[8px] font-black uppercase tracking-tighter">Vete</span>
      </button>

      {/* SALUD / CARTILLA */}
      <button 
        onClick={() => setActiveTab('health')} 
        className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${activeTab === 'health' ? 'text-emerald-600 scale-105' : 'text-slate-400'}`}
      >
        <ShieldPlus size={24} className={activeTab === 'health' ? 'fill-emerald-50' : ''} />
        <span className="text-[8px] font-black uppercase tracking-tighter">Salud</span>
      </button>

      {/* REPORTES / DASHBOARD */}
      <button 
        onClick={() => setActiveTab('stats')} 
        className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${activeTab === 'stats' ? 'text-orange-600 scale-105' : 'text-slate-400'}`}
      >
        <LayoutDashboard size={24} className={activeTab === 'stats' ? 'fill-orange-50' : ''} />
        <span className="text-[8px] font-black uppercase tracking-tighter">Reportes</span>
      </button>
    </nav>
  );
}