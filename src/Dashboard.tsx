import React from 'react';
import type {ChartOptions} from 'chart.js';
import {BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Title, Tooltip,} from 'chart.js';
import {Bar} from 'react-chartjs-2';
import {Award, PieChart} from 'lucide-react';
import type {AlimentoDTO} from './types/api.types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface DashboardProps {
  historial: AlimentoDTO[];
}

const Dashboard: React.FC<DashboardProps> = ({ historial }) => {
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { weight: 'bold', size: 10 }, color: '#475569' }
      },
      y: {
        grid: { color: '#f1f5f9' },
        ticks: { stepSize: 1, color: '#94a3b8' }
      }
    },
    elements: {
      bar: {
        borderRadius: 8,
      }
    }
  };

  const qualityMap = historial.reduce((acc: Record<string, number>, item: AlimentoDTO) => {
    const q = item?.calidad || "Desconocida";
    const label = q.charAt(0).toUpperCase() + q.slice(1).toLowerCase();
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  const labels = Object.keys(qualityMap);
  const totalEscaneos = historial.length;

  const getColor = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('ultra')) return { bg: 'rgba(79, 70, 229, 0.8)', border: 'rgb(79, 70, 229)' };
    if (l.includes('premium')) return { bg: 'rgba(34, 197, 94, 0.8)', border: 'rgb(34, 197, 94)' };
    if (l.includes('media')) return { bg: 'rgba(249, 115, 22, 0.8)', border: 'rgb(249, 115, 22)' };
    if (l.includes('baja') || l.includes('econ')) return { bg: 'rgba(239, 68, 68, 0.8)', border: 'rgb(239, 68, 68)' };
    if (l.includes('classic')) return { bg: 'rgba(148, 163, 184, 0.8)', border: 'rgb(148, 163, 184)' };
    return { bg: 'rgba(203, 213, 225, 0.8)', border: 'rgb(203, 213, 225)' };
  };

  const colors = labels.map(l => getColor(l));

  const data = {
    labels: labels,
    datasets: [
      {
        data: Object.values(qualityMap),
        backgroundColor: colors.map(c => c.bg),
        borderColor: colors.map(c => c.border),
        borderWidth: 2,
      },
    ],
  };

  const altaGamaCount = historial.filter(h => {
    const q = h?.calidad?.toLowerCase() || "";
    return q.includes('ultra') || q.includes('premium');
  }).length;
  const porcentajeAltaGama = totalEscaneos > 0 ? Math.round((altaGamaCount / totalEscaneos) * 100) : 0;

  if (totalEscaneos === 0) return null;

  return (
    <section className="bg-white p-6 rounded-[2.5rem] shadow-xl border-2 border-orange-50 animate-in zoom-in-95 duration-500 text-left">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="bg-orange-100 p-2 rounded-xl text-orange-600">
            <PieChart size={20} />
          </div>
          <h3 className="text-lg font-black text-slate-800 tracking-tight">Análisis de Dieta</h3>
        </div>
        <div className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
          <Award size={14} />
          <span className="text-[10px] font-black uppercase">{porcentajeAltaGama}% Alta Gama</span>
        </div>
      </div>

      <div className="h-44">
        <Bar options={options} data={data} />
      </div>

      <div className={`mt-6 grid gap-2 ${labels.length > 4 ? 'grid-cols-3' : 'grid-cols-4'}`}>
        {labels.map((label, index) => (
          <div key={index} className="text-center p-2 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-[8px] font-bold text-slate-400 uppercase truncate">{label}</p>
            <p className="text-sm font-black" style={{ color: getColor(label).border }}>
              {qualityMap[label]}
            </p>
          </div>
        ))}
      </div>

      <p className="text-center text-slate-400 text-[10px] mt-4 font-bold uppercase tracking-widest opacity-60">
        {totalEscaneos} alimentos registrados en Atlas
      </p>
    </section>
  );
}

export default Dashboard;