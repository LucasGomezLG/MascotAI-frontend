import React from 'react';
import { Zap, Sparkles } from 'lucide-react';

interface Props {
  user: any;
}

const AICreditBadge = ({ user }: Props) => {
  // Caso: Usuario Colaborador (Ilimitado)
  if (user?.esColaborador) {
    return (
      <div className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 px-3 py-1.5 rounded-2xl shadow-sm border border-emerald-400/20 animate-in fade-in zoom-in">
        <Sparkles size={12} className="text-yellow-300" fill="currentColor" />
        <span className="text-[10px] font-black text-white uppercase tracking-tight">
          IA <span className="opacity-80">Credits:</span> Ilimitado
        </span>
      </div>
    );
  }

  // Caso: Usuario Gratuito (10 intentos)
  const restantes = Math.max(0, 10 - (user?.intentosIA || 0));
  const esBajo = restantes <= 2;

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border transition-all duration-300 ${
      esBajo 
        ? 'bg-red-50 border-red-100 text-red-600' 
        : 'bg-slate-50 border-slate-100 text-slate-500'
    }`}>
      <Zap 
        size={12} 
        fill={restantes > 0 ? "currentColor" : "none"} 
        className={restantes > 0 ? "animate-pulse" : "opacity-30"}
      />
      <span className="text-[10px] font-black uppercase tracking-tight">
        IA <span className="opacity-60">Credits:</span> {restantes}/10
      </span>
    </div>
  );
};

export default AICreditBadge;