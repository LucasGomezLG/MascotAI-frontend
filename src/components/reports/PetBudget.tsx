import React, {useEffect, useState} from 'react';
import {Info, ShieldCheck, Stethoscope, TrendingUp, Utensils, Wallet, PieChart as PieIcon, ArrowRight, Sparkles} from 'lucide-react';
import {api} from '@/services/api.ts';
import {Doughnut} from 'react-chartjs-2';
import {ArcElement, Chart as ChartJS, Legend, Tooltip} from 'chart.js';
import toast from 'react-hot-toast';

ChartJS.register(ArcElement, Tooltip, Legend);

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

  const handleEnDesarrollo = () => {
    toast('Opción en desarrollo 🚀', {
      icon: '🛠️',
      style: {
        borderRadius: '1rem',
        background: '#333',
        color: '#fff',
        fontSize: '12px',
        fontWeight: 'bold',
        textTransform: 'uppercase'
      },
    });
  };

  const chartData = {
    labels: ['Comida', 'Vete', 'Salud'],
    datasets: [
      {
        data: [data.comida, data.vete, data.salud],
        backgroundColor: ['#f97316', '#ef4444', '#10b981'],
        borderWidth: 0,
        hoverOffset: 4
      },
    ],
  };

  const chartOptions = {
    plugins: {
      legend: { display: false },
    },
    cutout: '75%',
  };

  const costoDiario = (data.total / 30).toFixed(0);

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
          <div className="space-y-8">
            {/* Gráfico y Resumen Central */}
            <div className="flex items-center gap-8">
                <div className="w-32 h-32 relative">
                    <Doughnut data={chartData} options={chartOptions} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-[8px] font-black text-slate-400 uppercase">Diario</p>
                        <p className="text-lg font-black text-slate-800">${costoDiario}</p>
                    </div>
                </div>
                <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Comida: {((data.comida/data.total)*100 || 0).toFixed(0)}%</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Vete: {((data.vete/data.total)*100 || 0).toFixed(0)}%</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Salud: {((data.salud/data.total)*100 || 0).toFixed(0)}%</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                        <Utensils size={18} className="text-orange-500" />
                        <p className="text-xs font-black text-slate-700 uppercase">Alimentación</p>
                    </div>
                    <p className="font-black text-slate-800">${data.comida.toLocaleString()}</p>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                        <Stethoscope size={18} className="text-red-500" />
                        <p className="text-xs font-black text-slate-700 uppercase">Vete & Consultas</p>
                    </div>
                    <p className="font-black text-slate-800">${data.vete.toLocaleString()}</p>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                        <ShieldCheck size={18} className="text-emerald-500" />
                        <p className="text-xs font-black text-slate-700 uppercase">Salud & Prevención</p>
                    </div>
                    <p className="font-black text-slate-800">${data.salud.toLocaleString()}</p>
                </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-[2.5rem] text-white flex items-center justify-between shadow-xl shadow-slate-200 relative overflow-hidden">
              <TrendingUp size={100} className="absolute -right-4 -bottom-4 text-white/5 rotate-12" />
              <div className="relative z-10">
                <p className="text-[10px] font-black text-orange-400 uppercase mb-1 tracking-widest">Total Acumulado</p>
                <p className="text-4xl font-black">${data.total.toLocaleString()}</p>
              </div>
              <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
                <PieIcon size={24} className="text-white" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Card de Insight IA (Simulado por ahora, pero con UX real) */}
      <div className="bg-linear-to-br from-indigo-600 to-violet-700 p-6 rounded-[2.5rem] text-white shadow-lg relative overflow-hidden group">
        <Sparkles className="absolute -right-4 -top-4 text-white/10 rotate-12 group-hover:scale-110 transition-transform" size={120} />
        <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
                <div className="bg-white/20 p-2 rounded-xl"><TrendingUp size={18} /></div>
                <h4 className="font-black uppercase text-xs tracking-widest text-indigo-100">Análisis de Tendencia</h4>
            </div>
            <p className="text-sm font-bold leading-relaxed mb-4">
                Tu gasto diario promedio es de <span className="text-yellow-300">${costoDiario}</span>. 
                {data.comida > data.total * 0.6 ? " La alimentación representa la mayor parte de tu presupuesto. ¿Probaste comparar precios online?" : " Tu presupuesto está equilibrado entre salud y alimentación."}
            </p>
            <button 
                onClick={handleEnDesarrollo}
                className="flex items-center gap-2 text-[10px] font-black uppercase bg-white text-indigo-600 px-4 py-2 rounded-full active:scale-95 transition-all"
            >
                Optimizar Gastos <ArrowRight size={12} />
            </button>
        </div>
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
        </div>
      </div>
    </div>
  );
};

export default PetBudget;