import React, { useState, useEffect } from 'react';
import { Activity, Receipt, AlertCircle } from 'lucide-react';
import SymptomScanner from './SymptomScanner';
import ConsultationScanner from './ConsultationScanner';

interface VetScannerProps {
  mascotas: any[];
  onScanComplete: () => void;
  initialData?: any;
  onReset: () => void;
}

const VetScanner = ({ mascotas, onScanComplete, initialData, onReset }: VetScannerProps) => {
  const [activeTab, setActiveTab] = useState<'triaje' | 'consultas'>('triaje');

  useEffect(() => {
    if (initialData && initialData.precio !== undefined) {
      setActiveTab('consultas');
    }
  }, [initialData]);

  return (
    <div className="space-y-6 pb-20 w-full animate-in fade-in duration-500">
      {/* 🛡️ Cartel de Advertencia Amigable */}
      <div className="bg-amber-50/80 border border-amber-200 p-5 rounded-[2rem] flex items-start gap-4 mb-6 shadow-sm">
        <div className="bg-amber-100 p-2.5 rounded-xl text-amber-600 shrink-0 shadow-sm"><AlertCircle size={20} /></div>
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase text-amber-900 tracking-widest leading-none">Recordatorio</p>
          <p className="text-[11px] font-bold text-amber-800/80 leading-tight">
            ¡Cuidemos la salud de nuestras mascotas! MascotAI es una guía orientativa. Ante síntomas persistentes,
            <span className="text-amber-900 font-black"> consultá siempre a tu veterinario </span> de confianza.
          </p>
        </div>
      </div>

      {/* Selector de Pestañas */}
      <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 w-full">
        <button
          onClick={() => setActiveTab('triaje')}
          className={`flex-1 py-3 px-4 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 transition-all ${activeTab === 'triaje' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          <Activity size={14} /> Triaje Rápido
        </button>
        <button
          onClick={() => setActiveTab('consultas')}
          className={`flex-1 py-3 px-4 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 transition-all ${activeTab === 'consultas' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          <Receipt size={14} /> Consultas/Recetas
        </button>
      </div>

      <div className="w-full">
        {activeTab === 'triaje' ? (
          <SymptomScanner mascotas={mascotas} onScanComplete={onScanComplete} initialData={initialData} onReset={onReset} />
        ) : (
          <ConsultationScanner mascotas={mascotas} onScanComplete={onScanComplete} />
        )}
      </div>
    </div>
  );
};

export default VetScanner;