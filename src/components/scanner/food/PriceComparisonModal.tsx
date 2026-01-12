import React from 'react';
import { X, ShoppingBag } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  busquedaResult: any[];
}

const PriceComparisonModal = ({ isOpen, onClose, busquedaResult }: Props) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 relative animate-in zoom-in-95 text-left shadow-2xl">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400"><X size={24} /></button>
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-blue-100 p-3 rounded-2xl text-blue-600"><ShoppingBag size={24} /></div>
          <div><h3 className="text-xl font-black text-slate-800 leading-none">Ofertas Hoy</h3><p className="text-blue-500 font-bold text-[10px] uppercase mt-1 tracking-widest">Argentina</p></div>
        </div>
        <div className="space-y-3 mb-8 max-h-[350px] overflow-y-auto pr-2">
          {busquedaResult.map((o, i) => (
            <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-center mb-1"><span className="font-black text-slate-800 text-[11px] uppercase">{o.tienda}</span><span className="bg-blue-100 text-blue-700 text-[9px] font-black px-2 py-0.5 rounded-lg">{o.peso}</span></div>
              <div className="flex justify-between items-end"><span className="text-xl font-black text-orange-600">{o.precio}</span><span className="text-[10px] text-slate-400 font-bold italic">{o.nota}</span></div>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-lg">ENTENDIDO</button>
      </div>
    </div>
  );
};

export default PriceComparisonModal;
