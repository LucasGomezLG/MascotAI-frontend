import React, {useEffect, useState} from 'react';
import {Info, ShieldCheck, Stethoscope, TrendingUp, Utensils, Wallet} from 'lucide-react';
import {api} from '@/services/api.ts';

const PetBudget = () => {
  const [data, setData] = useState({ comida: 0, vete: 0, salud: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  const nombreMes = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.getPresupuestoMensual();
        if (res.data) setData(res.data);
      } catch (err) {
        console.error("Error al cargar presupuesto", err);
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none capitalize">
              Inversión de {nombreMes}
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Control de Gastos</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-2xl text-blue-600">
            <Wallet size={24} />
          </div>
        </div>

        {loading ? (
          <div className="py-10 flex justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-orange-500 rounded-full shadow-sm shadow-orange-100"></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Alimentación</p>
                  <p className="font-black text-slate-700 text-lg">${data.comida.toLocaleString()}</p>
                </div>
              </div>
              <Utensils size={16} className="text-slate-200" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-red-500 rounded-full shadow-sm shadow-red-100"></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Vete & Consultas</p>
                  <p className="font-black text-slate-700 text-lg">${data.vete.toLocaleString()}</p>
                </div>
              </div>
              <Stethoscope size={16} className="text-slate-200" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-emerald-500 rounded-full shadow-sm shadow-emerald-100"></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Salud & Prevención</p>
                  <p className="font-black text-slate-700 text-lg">${data.salud.toLocaleString()}</p>
                </div>
              </div>
              <ShieldCheck size={16} className="text-slate-200" />
            </div>

            <hr className="border-slate-50" />

            <div className="bg-slate-900 p-6 rounded-[2rem] text-white flex items-center justify-between shadow-xl shadow-slate-200 border-t-4 border-emerald-500/20">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Total Acumulado</p>
                <p className="text-3xl font-black">${data.total.toLocaleString()}</p>
              </div>
              <div className="bg-white/10 p-3 rounded-2xl">
                <TrendingUp size={24} className="text-emerald-400" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-amber-50/80 border border-amber-200 p-6 rounded-[2.5rem] shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-amber-100 p-2 rounded-xl text-amber-600"><Info size={20} /></div>
          <h4 className="font-black text-amber-900 uppercase text-xs tracking-widest">¿Cómo se calcula este presupuesto?</h4>
        </div>
        <div className="space-y-3 text-left">
          <p className="text-[11px] font-bold text-amber-800/90 leading-relaxed">
            <span className="text-amber-900 font-black uppercase text-[9px]">Sincronización:</span> Este panel suma automáticamente todos los gastos registrados durante el mes calendario actual.
          </p>
          <p className="text-[11px] font-bold text-amber-800/90 leading-relaxed">
            <span className="text-amber-900 font-black uppercase text-[9px]">Fuentes:</span> Incluye el costo de las bolsas de alimento activadas, las consultas veterinarias guardadas y los productos de salud aplicados.
          </p>
          <p className="text-[11px] font-bold text-amber-800/90 leading-relaxed">
            <span className="text-amber-900 font-black uppercase text-[9px]">Ahorro Familiar:</span> Utilizá este dato para ajustar tu plan de ahorro mensual y prever los gastos fijos de tus mascotas.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PetBudget;