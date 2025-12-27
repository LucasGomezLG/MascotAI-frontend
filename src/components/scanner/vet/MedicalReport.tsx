import React from 'react';
import { ClipboardList, Siren, CheckCircle2, Sparkles } from 'lucide-react';

const MedicalReport = ({ data }: { data: any }) => {
  if (!data || Object.keys(data).length === 0) return null;

  const nivelUrgencia = data.nivel_urgencia?.toUpperCase() || 'BAJA';
  const urgenciaColor = {
    'ALTA': 'bg-red-600 text-white shadow-red-200',
    'MEDIA': 'bg-orange-500 text-white shadow-orange-200',
    'BAJA': 'bg-emerald-500 text-white shadow-emerald-200'
  }[nivelUrgencia as string] || 'bg-slate-600 text-white';

  return (
    <div className="space-y-6 text-left animate-in fade-in zoom-in-95 duration-700 w-full">
      {/* 1. Hallazgos Técnicos */}
      <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex gap-4">
        <div className="p-3 bg-white rounded-2xl shadow-sm self-start text-slate-400 shrink-0">
          <ClipboardList size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest leading-none">Hallazgos Técnicos</p>
          <p className="text-sm text-slate-700 font-medium leading-relaxed break-words">
            {data.analisis_detalle || "No se encontraron detalles específicos."}
          </p>
        </div>
      </div>

      {/* 2. Tarjeta de Urgencia */}
      <div className={`p-6 rounded-[2rem] shadow-xl ${urgenciaColor} relative overflow-hidden`}>
        <Siren size={80} className="absolute -right-4 -top-4 opacity-10 rotate-12" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 text-white">Nivel de Urgencia</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-[9px] font-black">{nivelUrgencia}</span>
          </div>
          <p className="text-lg font-black leading-tight break-words">{data.urgencia_explicacion || "Urgencia no especificada."}</p>
        </div>
      </div>

      {/* 3. Pasos a seguir */}
      <div className="space-y-3 w-full">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Plan de Acción:</p>
        {data.pasos_a_seguir?.map((paso: string, i: number) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-3 shadow-sm animate-in slide-in-from-right-3" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="bg-blue-50 text-blue-500 p-1.5 rounded-lg shrink-0"><CheckCircle2 size={14} /></div>
            <p className="text-xs font-bold text-slate-600 break-words flex-1">{paso}</p>
          </div>
        ))}
      </div>

      {/* 4. Conclusión Final */}
      <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group w-full">
        <Sparkles className="absolute -right-2 -top-2 text-white/10" size={80} />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1 w-8 bg-red-500 rounded-full" />
            <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">Resumen</span>
          </div>
          <p className="text-white text-lg font-bold leading-tight italic break-words">
            "{data.resumen_final || "Análisis completado."}"
          </p>
        </div>
      </div>
    </div>
  );
};

export default MedicalReport;