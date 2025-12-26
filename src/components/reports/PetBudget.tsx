import React, { useEffect, useState } from 'react';
import { Wallet, TrendingUp, Stethoscope, ShieldPlus, Utensils } from 'lucide-react';
import { api } from '../../services/api';

const PetBudget = () => {
  const [data, setData] = useState({ comida: 0, vete: 0, salud: 0, total: 0 });

  useEffect(() => {
    api.getPresupuestoMensual().then(res => {
      if (res.data) setData(res.data);
    }).catch(err => console.error("Error al cargar presupuesto", err));
  }, []);

  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none">Presupuesto Mensual</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Simba & Adelina</p>
        </div>
        <div className="bg-blue-100 p-3 rounded-2xl text-blue-600">
          <Wallet size={24} />
        </div>
      </div>

      <div className="space-y-6">
        {/* 1. ALIMENTACIÓN */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-orange-500 rounded-full"></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase">Alimentación</p>
              <p className="font-black text-slate-700">${data.comida.toLocaleString()}</p>
            </div>
          </div>
          <Utensils size={14} className="text-slate-200" />
        </div>

        {/* 2. VETERINARIA */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-red-500 rounded-full"></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase">Vete & Consultas</p>
              <p className="font-black text-slate-700">${data.vete.toLocaleString()}</p>
            </div>
          </div>
          <Stethoscope size={14} className="text-slate-200" />
        </div>

        {/* 3. SALUD PREVENTIVA */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-emerald-500 rounded-full"></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase">Salud & Prevención</p>
              <p className="font-black text-slate-700">${data.salud.toLocaleString()}</p>
            </div>
          </div>
          <ShieldPlus size={14} className="text-slate-200" />
        </div>

        <hr className="border-slate-50" />

        <div className="bg-slate-900 p-6 rounded-[2rem] text-white flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Inversión Total</p>
            <p className="text-2xl font-black">${data.total.toLocaleString()}</p>
          </div>
          <div className="bg-white/10 p-3 rounded-2xl">
            <TrendingUp size={24} className="text-emerald-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetBudget;