import React from 'react';
import {AlertTriangle, X} from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  titulo: string;
  mensaje: string;
}

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, titulo, mensaje }: DeleteConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xs rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500">
            <AlertTriangle size={32} />
          </div>
          
          <div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">{titulo}</h3>
            <p className="text-xs font-bold text-slate-400 mt-2 leading-relaxed">
              {mensaje}
            </p>
          </div>

          <div className="w-full space-y-2 pt-2">
            <button 
              onClick={onConfirm}
              className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-100 active:scale-95 transition-all"
            >
              Sí, eliminar ahora
            </button>
            <button 
              onClick={onClose}
              className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
            >
              No, cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;