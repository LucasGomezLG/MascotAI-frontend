
import React from 'react';
import { Home, Camera, Stethoscope, ShieldPlus, LayoutDashboard } from 'lucide-react';

interface AppBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

export default function AppBottomNav({ activeTab, setActiveTab }: AppBottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 pb-8 flex justify-around items-center z-50 shadow-lg">
      <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-orange-600 scale-110' : 'text-slate-400'}`}>
        <Home size={24} /><span className="text-[8px] font-black uppercase">Inicio</span>
      </button>
      <button onClick={() => setActiveTab('scanner')} className={`flex flex-col items-center gap-1 ${activeTab === 'scanner' ? 'text-orange-600' : 'text-slate-400'}`}>
        <Camera size={24} /><span className="text-[8px] font-black uppercase">Comida</span>
      </button>
      <button onClick={() => setActiveTab('vet')} className={`flex flex-col items-center gap-1 ${activeTab === 'vet' ? 'text-red-600' : 'text-slate-400'}`}>
        <Stethoscope size={24} /><span className="text-[8px] font-black uppercase">Vete</span>
      </button>
      <button onClick={() => setActiveTab('health')} className={`flex flex-col items-center gap-1 ${activeTab === 'health' ? 'text-emerald-600' : 'text-slate-400'}`}>
        <ShieldPlus size={24} /><span className="text-[8px] font-black uppercase">Salud</span>
      </button>
      <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center gap-1 ${activeTab === 'stats' ? 'text-orange-600' : 'text-slate-400'}`}>
        <LayoutDashboard size={24} /><span className="text-[8px] font-black uppercase">Reportes</span>
      </button>
    </nav>
  );
}
