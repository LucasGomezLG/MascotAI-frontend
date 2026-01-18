import React from 'react';
import { Scale, Sparkles, Swords, Trophy, X, Package } from 'lucide-react';
import type { AlimentoDTO } from '@/types/api.types.ts';

interface DueloModalProps {
  dueloResult: { foods: AlimentoDTO[], veredicto: { ganador: string, diferencia: string, conclusion: string } } | null;
  onClose: () => void;
}

const DueloModal: React.FC<DueloModalProps> = ({ dueloResult, onClose }) => {
  if (!dueloResult) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-110 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-[3rem] p-8 shadow-2xl relative text-left overflow-y-auto max-h-[90vh] animate-in zoom-in-95 no-scrollbar">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-300 hover:text-slate-900 transition-colors">
          <X size={24} />
        </button>
        
        <div className="flex items-center justify-center gap-3 mb-8 text-orange-600">
          <Swords size={32} />
          <h3 className="text-2xl font-black uppercase tracking-tighter">Duelo Final</h3>
        </div>

        {/* Comparativa Visual Rápida */}
        <div className="grid grid-cols-2 gap-4 mb-8">
            {dueloResult.foods.map((food, idx) => (
                <div key={food.id} className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex flex-col items-center text-center relative">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-3 overflow-hidden border-2 border-orange-100">
                        <Package size={32} className="text-orange-200" />
                    </div>
                    <h4 className="font-black text-slate-800 text-[10px] uppercase leading-tight mb-2 line-clamp-1">{food.marca}</h4>
                    <div className="space-y-1 w-full">
                        <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase">
                            <span>Kcal/Kg</span>
                            <span className="text-slate-700">{food.kcalKg || '---'}</span>
                        </div>
                        <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase">
                            <span>Precio</span>
                            <span className="text-emerald-600">${food.precioComprado?.toLocaleString() || '---'}</span>
                        </div>
                    </div>
                    {idx === 0 && <div className="absolute -right-4 top-1/2 -translate-y-1/2 bg-orange-600 text-white p-1.5 rounded-full z-10 shadow-lg font-black text-[8px]">VS</div>}
                </div>
            ))}
        </div>

        <div className="bg-linear-to-br from-orange-500 to-orange-600 p-6 rounded-[2.5rem] text-white shadow-xl mb-6 relative overflow-hidden">
          <Trophy className="absolute -right-4 -bottom-4 text-white/10 rotate-12" size={120} />
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase opacity-70 mb-1 tracking-widest">🏆 Ganador del Análisis</p>
            <p className="text-2xl font-black leading-tight">{dueloResult.veredicto.ganador}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 relative">
            <div className="absolute -top-3 left-6 bg-white px-3 py-1 rounded-full border border-slate-100 flex items-center gap-2">
                <Scale size={12} className="text-orange-500" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Diferencias Clave</span>
            </div>
            <p className="text-sm font-bold text-slate-700 leading-relaxed whitespace-pre-wrap pt-2">
                {dueloResult.veredicto.diferencia}
            </p>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden">
            <Sparkles className="absolute -right-4 -top-4 text-yellow-300/10 rotate-12" size={100} fill="currentColor" />
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                    <div className="h-1 w-8 bg-orange-500 rounded-full" />
                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Conclusión IA</span>
                </div>
                <p className="text-sm font-bold leading-relaxed italic opacity-90 whitespace-pre-wrap">
                    "{dueloResult.veredicto.conclusion}"
                </p>
            </div>
          </div>
        </div>

        <button 
            onClick={onClose} 
            className="w-full py-5 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-4xl font-black mt-8 transition-colors uppercase text-xs tracking-widest"
        >
            Cerrar Análisis
        </button>
      </div>
    </div>
  );
};

export default DueloModal;