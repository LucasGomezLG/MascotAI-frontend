import React, { useState, useEffect } from 'react';
import { Activity, Receipt, AlertCircle, AlertTriangle, Info } from 'lucide-react';
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
    if (initialData) {
      // 🛡️ Priorizamos la bandera que pusimos en ReportsManager
      if (initialData.esDocumentoMedico === true || initialData.diagnostico) {
        setActiveTab('consultas');
      } else {
        setActiveTab('triaje');
      }
    }
  }, [initialData]);
  return (
    <div className="space-y-6 pb-20 w-full animate-in fade-in duration-500">
      {/* 🛡️ Cartel de Advertencia Amigable */}
      <div className="bg-red-50/80 border border-red-200 p-5 rounded-[2rem] flex items-start gap-4 mb-6 shadow-sm">
        {/* Ícono de Advertencia (Triángulo) */}
        <div className="bg-red-100 p-2.5 rounded-xl text-red-600 shrink-0 shadow-sm">
          <AlertTriangle size={20} />
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase text-red-900 tracking-widest leading-none">
            Advertencia Importante
          </p>
          <p className="text-[11px] font-bold text-red-800/80 leading-tight">
            ¡Cuidemos la salud de nuestras mascotas! MascotAI es una guía orientativa.
            <span className="text-red-900 font-black"> consultá siempre a tu veterinario </span> de confianza.
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
          <SymptomScanner
            mascotas={mascotas}
            onScanComplete={onScanComplete}
            initialData={initialData}
            onReset={onReset}
          />
        ) : (
          <ConsultationScanner
            mascotas={mascotas}
            onScanComplete={onScanComplete}
            initialData={initialData} // ✅ AHORA SÍ: Le pasamos la receta para que la muestre
            onReset={onReset}
          />
        )}
      </div>
      {/* CARTEL INFORMATIVO AL FINAL DE VETE */}
      <div className="mt-10 bg-amber-50/80 border border-amber-200 p-6 rounded-[2.5rem] shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
            <Info size={20} />
          </div>
          <h4 className="font-black text-amber-900 uppercase text-xs tracking-widest">
            ¿Cómo funciona esta sección?
          </h4>
        </div>

        <div className="space-y-3 text-left">
          <div className="flex gap-3">
            <div className="mt-1 bg-amber-200/50 h-1.5 w-1.5 rounded-full shrink-0" />
            <p className="text-[11px] font-bold text-amber-800/90 leading-relaxed">
              <span className="text-amber-900 font-black uppercase text-[9px]">Triaje Rápido por IA:</span>
              Analizá fotos de materia fecal, heridas o vómitos para obtener una primera orientación sobre la urgencia del síntoma.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="mt-1 bg-amber-200/50 h-1.5 w-1.5 rounded-full shrink-0" />
            <p className="text-[11px] font-bold text-amber-800/90 leading-relaxed">
              <span className="text-amber-900 font-black uppercase text-[9px]">Consultas y Recetas:</span>
              Escaneá documentos físicos para digitalizar diagnósticos y medicaciones, integrándolos automáticamente a la cartilla de salud.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="mt-1 bg-amber-200/50 h-1.5 w-1.5 rounded-full shrink-0" />
            <p className="text-[11px] font-bold text-amber-800/90 leading-relaxed">
              <span className="text-amber-900 font-black uppercase text-[9px]">Seguimiento Histórico:</span>
              Guardamos el historial de visitas, profesionales y costos para que tengas un control total de la salud de tus mascotas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VetScanner;