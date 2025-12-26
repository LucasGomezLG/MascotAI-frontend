import { LogOut, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const LogoutModal = ({ isOpen, onClose, onConfirm }: Props) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
        
        {/* Icono y Cerrar */}
        <div className="flex justify-between items-start mb-6">
          <div className="bg-red-50 p-4 rounded-2xl text-red-600">
            <LogOut size={32} />
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900">
            <X size={24} />
          </button>
        </div>

        {/* Texto */}
        <div className="text-left mb-8">
          <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-2">
            ¿Ya te vas?
          </h3>
          <p className="text-slate-500 font-medium">
            Si cerrás sesión, tendrás que volver a loguearte para ver los reportes de salud.
          </p>
        </div>

        {/* Botones */}
        <div className="flex flex-col gap-3">
          <button 
            onClick={onConfirm}
            className="w-full py-4 bg-red-600 text-white rounded-2xl font-black shadow-lg shadow-red-100 active:scale-95 transition-all"
          >
            CERRAR SESIÓN
          </button>
          <button 
            onClick={onClose}
            className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black active:scale-95 transition-all"
          >
            ME QUEDO UN RATO MÁS
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;