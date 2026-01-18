import React, { useState, useEffect } from 'react';
import { Package, AlertCircle } from 'lucide-react';
import { api } from '@/services/api.ts';
import type { MascotaDTO } from '@/types/api.types.ts';

interface StockStatus {
  status: string;
  porcentaje: number;
  marca: string;
  diasRestantes: number;
}

interface StockCardProps {
  mascota: MascotaDTO;
  refreshKey: number;
}

const StockCard: React.FC<StockCardProps> = ({ mascota, refreshKey }) => {
  const [stock, setStock] = useState<StockStatus | null>(null);

  useEffect(() => {
    if (mascota.id) {
      api.getStockStatus(mascota.id).then(res => setStock(res.data));
    }
  }, [mascota.id, refreshKey]);

  if (!stock || stock.status === "NO_DATA") return null;

  const percentage = stock.porcentaje;
  const getColor = (p: number) => {
    if (p > 50) return 'bg-green-500';
    if (p > 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white p-5 rounded-4xl shadow-sm border border-slate-100 mb-4 animate-in zoom-in-95">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl text-white ${getColor(percentage)} shadow-lg shadow-current/20`}>
            <Package size={20} />
          </div>
          <div>
            <h4 className="font-black text-slate-800 text-sm leading-none">{mascota.nombre}</h4>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{stock.marca}</p>
          </div>
        </div>
        {percentage < 20 && <AlertCircle size={18} className="text-red-500 animate-pulse" />}
      </div>
      <div className="flex justify-between items-end mb-2">
        <p className="text-2xl font-black text-slate-800 tracking-tighter">
          {stock.diasRestantes} <span className="text-[10px] text-slate-400 uppercase">días</span>
        </p>
        <p className="text-[10px] font-black text-slate-600">{percentage}%</p>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full transition-all duration-1000 ${getColor(percentage)}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};

export default StockCard;