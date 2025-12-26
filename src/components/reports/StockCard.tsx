import React, { useState, useEffect } from 'react';
import { Package, Calendar, AlertCircle, ShoppingCart } from 'lucide-react';
import { api } from '../../services/api';

const StockCard = ({ mascotaId }: { mascotaId: string }) => {
  const [stock, setStock] = useState<any>(null);

  useEffect(() => {
    api.getStockStatus(mascotaId).then(res => setStock(res.data));
  }, [mascotaId]);

  if (!stock || stock.status === "NO_DATA") return null;

  const getColor = (p: number) => {
    if (p > 50) return 'bg-green-500';
    if (p > 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 mb-6 animate-in zoom-in-95 duration-500">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl text-white ${getColor(stock.porcentaje)} shadow-lg`}>
            <Package size={24} />
          </div>
          <div>
            <h3 className="font-black text-slate-800 text-lg leading-none">Stock Inteligente</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{stock.marca}</p>
          </div>
        </div>
        {stock.porcentaje < 20 && (
          <div className="bg-red-100 text-red-600 p-2 rounded-xl animate-bounce">
            <AlertCircle size={20} />
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <p className="text-3xl font-black text-slate-800">{stock.diasRestantes} <span className="text-sm text-slate-400">días</span></p>
          <p className="text-sm font-black text-slate-800">{stock.porcentaje}%</p>
        </div>

        <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
          <div 
            className={`h-full transition-all duration-1000 ${getColor(stock.porcentaje)}`} 
            style={{ width: `${stock.porcentaje}%` }}
          />
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500 font-bold text-xs">
            <Calendar size={14} /> Se agota el:
          </div>
          <p className="font-black text-slate-800 text-sm">
            {new Date(stock.fechaAgotamiento).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
          </p>
        </div>

        {stock.porcentaje < 25 && (
          <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
            <ShoppingCart size={16} /> BUSCAR OFERTAS AHORA
          </button>
        )}
      </div>
    </div>
  );
};

export default StockCard;