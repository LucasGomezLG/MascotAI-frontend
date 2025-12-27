import React, { useState, useEffect } from 'react';
import { Activity, Receipt, AlertCircle } from 'lucide-react';
// Importamos los componentes separados
import SymptomScanner from './SymptomScanner';
import ConsultationScanner from './ConsultationScanner';

// Definimos la interfaz de las props para mayor seguridad (opcional pero recomendado)
interface VetScannerProps {
  mascotas: any[];
  onScanComplete: () => void;
  initialData?: any; // Datos opcionales si venimos del historial
  onReset: () => void;
}

const VetScanner = ({ mascotas, onScanComplete, initialData, onReset }: VetScannerProps) => {
  const [activeTab, setActiveTab] = useState<'triaje' | 'consultas'>('triaje');

  // Efecto opcional: Si se reciben datos iniciales y parecen ser de una consulta/receta
  // (por ejemplo, tienen un campo 'precio'), cambiamos automáticamente a la pestaña de consultas.
  useEffect(() => {
    if (initialData && initialData.precio !== undefined) {
      setActiveTab('consultas');
    }
    // Si son datos de triaje (tienen 'nivel_urgencia'), se queda en 'triaje' por defecto.
  }, [initialData]);

  return (
    <div className="space-y-6 pb-20 w-full">
      {/* Selector de Pestañas */}

      {/* Cartel de Advertencia Amigable */}
      <div className="bg-amber-50/80 border border-amber-200 p-5 rounded-[2rem] flex items-start gap-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-700">
        <div className="bg-amber-100 p-2.5 rounded-xl text-amber-600 shrink-0 shadow-sm">
          <AlertCircle size={20} />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase text-amber-900 tracking-widest leading-none">Recordatorio</p>
          <p className="text-[11px] font-bold text-amber-800/80 leading-tight">
            ¡Cuidemos la salud de nuestras mascotas! MascotAI es una guía orientativa. Ante síntomas persistentes o urgencias,
            <span className="text-amber-900 font-black"> consultá siempre a tu veterinario </span> de confianza cuanto antes.
          </p>
        </div>
      </div>

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

      {/* Renderizado Condicional de los Sub-componentes */}
      <div className="w-full">
        {activeTab === 'triaje' ? (
          // ✅ ARREGLO CLAVE: Pasamos initialData al escáner de síntomas
          <SymptomScanner
            mascotas={mascotas}
            onScanComplete={onScanComplete}
            initialData={initialData}
            onReset={onReset}
          />
        ) : (
          <ConsultationScanner
            mascotas={mascotas}
            onComplete={onScanComplete}
          // No pasamos initialData aquí porque el flujo de consultas es distinto (se edita antes de guardar), 
          // pero podrías implementarlo si quisieras editar una consulta vieja.
          />
        )}
      </div>
    </div>
  );
};

export default VetScanner;