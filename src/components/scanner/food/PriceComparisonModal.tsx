import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, ExternalLink, ArrowDownNarrowWide } from 'lucide-react';

const PriceComparisonModal = ({ isOpen, onClose, busquedaResult }: any) => {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (busquedaResult) setItems(busquedaResult);
  }, [busquedaResult]);

  if (!isOpen) return null;

  const formatPrice = (price: any) => {
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice)) return price;
    return numericPrice.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  const handleSort = () => {
    const sorted = [...items].sort((a, b) => {
      const pA = parseFloat(a.precio);
      const pB = parseFloat(b.precio);
      if (isNaN(pA)) return 1; // Si no es número, va al final
      if (isNaN(pB)) return -1;
      return pA - pB;
    });
    setItems(sorted);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 relative animate-in zoom-in-95 text-left shadow-2xl">
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-300 hover:text-slate-600"><X size={24} /></button>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-lg shadow-blue-100"><ShoppingBag size={24} /></div>
          <div>
            <h3 className="text-xl font-black text-slate-800 leading-none">Mejores Precios</h3>
            <p className="text-blue-500 font-black text-[9px] uppercase mt-1 tracking-widest">Marketplace Argentina</p>
          </div>
        </div>

        <div className="flex justify-end mb-2">
          <button onClick={handleSort} className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-wide hover:bg-blue-50 hover:text-blue-600 transition-all active:scale-95">
            <ArrowDownNarrowWide size={14} /> Menor Precio
          </button>
        </div>

        <div className="space-y-3 mb-8 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
          {items.length > 0 ? items.map((o: any, i: number) => (
            <div key={i} className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100 flex flex-col gap-2 relative group overflow-hidden">
              <div className="flex justify-between items-center">
                <span className="font-black text-slate-900 text-[11px] uppercase tracking-wider">{o.tienda}</span>
                <span className="bg-blue-100 text-blue-700 text-[8px] font-black px-2 py-1 rounded-lg italic">{o.peso}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-2xl font-black text-orange-600">{formatPrice(o.precio)}</span>
                <p className="text-[9px] text-slate-400 font-bold italic max-w-[120px] text-right">{o.nota}</p>
              </div>
              <ExternalLink size={12} className="absolute top-2 right-2 text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )) : (
            <p className="text-center text-slate-400 font-bold py-10 italic">No se encontraron ofertas vigentes...</p>
          )}
        </div>

        <button onClick={onClose} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all">ENTENDIDO</button>
      </div>
    </div>
  );
};

export default PriceComparisonModal;