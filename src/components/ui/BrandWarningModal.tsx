import React from 'react';
import {AlertTriangle} from 'lucide-react';

const BrandWarningModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-6 animate-in fade-in duration-300">
    <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl text-center animate-in zoom-in-95">
      <div className="bg-amber-100 p-4 rounded-full text-amber-500 mx-auto mb-6 w-20 h-20 flex items-center justify-center shadow-sm">
        <AlertTriangle size={40} strokeWidth={2.5} />
      </div>
      <h3 className="text-xl font-black text-slate-800 mb-3 tracking-tight text-center">¡Falta la marca!</h3>
      <p className="text-slate-600 font-medium leading-relaxed mb-8 text-center">
        Por favor, escribí el nombre de la <strong>marca</strong> para que la IA pueda buscar ofertas y opiniones reales.
      </p>
      <button onClick={onClose} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all uppercase tracking-wider text-sm">Entendido</button>
    </div>
  </div>
);
export default BrandWarningModal;