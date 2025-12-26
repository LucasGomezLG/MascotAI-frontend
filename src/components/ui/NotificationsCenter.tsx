import React from 'react';
import { Bell, X, Package, ShieldPlus, Check } from 'lucide-react';

interface Alerta {
  id: string;
  mensaje: string;
  tipo: 'STOCK' | 'SALUD';
  fecha: string;
}

interface Props {
  alertas: Alerta[];
  onMarkRead: (id: string) => void;
  onClose: () => void;
}

const NotificationsCenter = ({ alertas, onMarkRead, onClose }: Props) => {
  return (
    <div className="absolute top-14 right-0 w-80 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 z-[100] animate-in slide-in-from-top-4 duration-300">
      <div className="p-6 border-b border-slate-50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-orange-600" />
          <h3 className="font-black text-slate-800 text-xs uppercase tracking-tighter">Centro de Alertas</h3>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors">
          <X size={18}/>
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {alertas.length === 0 ? (
          <div className="py-12 text-center">
            <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check size={20} className="text-slate-300" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">¡Todo al día, Lucas!</p>
          </div>
        ) : (
          alertas.map((a) => (
            <div 
              key={a.id} 
              className={`p-4 rounded-3xl relative group transition-all border ${
                a.tipo === 'STOCK' ? 'bg-orange-50/50 border-orange-100' : 'bg-emerald-50/50 border-emerald-100'
              }`}
            >
              <div className="flex gap-3">
                <div className={`shrink-0 p-2.5 rounded-2xl text-white shadow-sm ${
                  a.tipo === 'STOCK' ? 'bg-orange-500' : 'bg-emerald-500'
                }`}>
                  {a.tipo === 'STOCK' ? <Package size={16}/> : <ShieldPlus size={16}/>}
                </div>
                <div className="flex-1 pr-4">
                  <p className="text-[11px] font-black text-slate-800 leading-tight mb-1">
                    {a.mensaje}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">
                    {a.tipo === 'STOCK' ? 'Suministros' : 'Salud Preventiva'}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => onMarkRead(a.id)} 
                className="absolute top-3 right-3 p-1 text-slate-300 hover:text-slate-600 transition-colors"
                title="Marcar como leída"
              >
                <X size={14}/>
              </button>
            </div>
          ))
        )}
      </div>

      {alertas.length > 0 && (
        <div className="p-4 bg-slate-50 rounded-b-[2.5rem] text-center">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
            Chequeo automático de las 09:00 AM
          </p>
        </div>
      )}
    </div>
  );
};

export default NotificationsCenter;