import React, { useState, useEffect } from 'react';
import {
  Utensils, Stethoscope, Clock, Calendar, Trash2, Swords,
  CheckSquare, Square, X, Sparkles, Scale, Package, AlertCircle,
  ShieldPlus, Wallet, BarChart3, Activity, Receipt 
} from 'lucide-react';
import { api } from '../../services/api';
import Dashboard from '../../Dashboard';
import HealthHistory from './HealthHistory';
import PetBudget from './PetBudget';

const StockCard = ({ mascota }: { mascota: any }) => {
  const [stock, setStock] = useState<any>(null);
  useEffect(() => {
    api.getStockStatus(mascota.id).then(res => setStock(res.data));
  }, [mascota.id]);

  if (!stock || stock.status === "NO_DATA") return null;
  const percentage = stock.porcentaje;
  const getColor = (p: number) => {
    if (p > 50) return 'bg-green-500';
    if (p > 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 mb-4 animate-in zoom-in-95">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl text-white ${getColor(percentage)}`}>
            <Package size={20} />
          </div>
          <div>
            <h4 className="font-black text-slate-800 text-sm leading-none">Stock: {mascota.nombre}</h4>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{stock.marca}</p>
          </div>
        </div>
        {percentage < 20 && <AlertCircle size={18} className="text-red-500 animate-pulse" />}
      </div>
      <div className="flex justify-between items-end mb-2">
        <p className="text-2xl font-black text-slate-800">{stock.diasRestantes} <span className="text-[10px] text-slate-400 uppercase">días</span></p>
        <p className="text-[10px] font-black text-slate-600">{percentage}%</p>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full transition-all duration-1000 ${getColor(percentage)}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};

const ReportsManager = ({ onVerDetalle }: { onVerDetalle: (item: any, tipo: 'food' | 'vet' | 'health') => void }) => {
  const [subTab, setSubTab] = useState<'food' | 'vet' | 'health' | 'finance'>('food');
  const [vetSubTab, setVetSubTab] = useState<'triaje' | 'consultas'>('triaje');
  const [historial, setHistorial] = useState<any[]>([]);
  const [historialVet, setHistorialVet] = useState<any[]>([]);
  const [mascotas, setMascotas] = useState<any[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string>("");

  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dueloResult, setDueloResult] = useState<any>(null);

  const cargar = async () => {
    try {
      const [resF, resV, resP] = await Promise.all([
        api.getHistorial(),
        api.getHistorialVet(),
        api.getMascotas()
      ]);
      setHistorial(resF.data || []);
      setHistorialVet(resV.data || []);
      const pets = resP.data || [];
      setMascotas(pets);
      if (pets.length > 0 && !selectedPetId) setSelectedPetId(pets[0].id);
    } catch (e) {
      console.error("Error cargando datos", e);
    }
  };

  useEffect(() => { cargar(); }, []);

  const getGamaTextColor = (c: string | null = "") => {
    const q = (c || "").toLowerCase();
    if (q.includes('ultra')) return 'text-indigo-600';
    if (q.includes('premium')) return 'text-green-600';
    return 'text-orange-600';
  };

  const handleDuelo = async () => {
    try {
      const res = await api.comparar(selectedIds);
      const dataLine = res.data.split('\n').find((l: string) => l.includes('|')) || "";
      const parts = dataLine.split('|').map((s: string) => s.split(':')[1]?.trim() || "---");
      setDueloResult({
        foods: historial.filter(h => selectedIds.includes(h.id)),
        veredicto: { ganador: parts[0], diferencia: parts[1], conclusion: parts[2] }
      });
    } catch (e) { alert("Error en el duelo"); }
  };

  return (
    <div className="space-y-6 pb-20 text-left">
      <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto custom-scrollbar">
        <button onClick={() => setSubTab('food')} className={`flex-1 py-3 px-4 rounded-xl font-black text-[9px] uppercase flex items-center justify-center gap-2 transition-all whitespace-nowrap ${subTab === 'food' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400'}`}><Utensils size={14} /> Alimentos</button>
        <button onClick={() => setSubTab('vet')} className={`flex-1 py-3 px-4 rounded-xl font-black text-[9px] uppercase flex items-center justify-center gap-2 transition-all whitespace-nowrap ${subTab === 'vet' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400'}`}><Stethoscope size={14} /> Vete</button>
        <button onClick={() => setSubTab('health')} className={`flex-1 py-3 px-4 rounded-xl font-black text-[9px] uppercase flex items-center justify-center gap-2 transition-all whitespace-nowrap ${subTab === 'health' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400'}`}><ShieldPlus size={14} /> Salud</button>
        <button onClick={() => setSubTab('finance')} className={`flex-1 py-3 px-4 rounded-xl font-black text-[9px] uppercase flex items-center justify-center gap-2 transition-all whitespace-nowrap ${subTab === 'finance' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}><Wallet size={14} /> Finanzas</button>
      </div>

      {subTab === 'finance' && (
        <div className="animate-in fade-in slide-in-from-bottom-4">
          <PetBudget />
          <div className="mt-4 p-5 bg-blue-50 rounded-[2rem] border border-blue-100 flex items-center gap-4 text-blue-800">
            <BarChart3 size={20} className="text-blue-600" />
            <p className="text-xs font-bold">Tus ahorros del mes están bajo control.</p>
          </div>
        </div>
      )}

      {subTab === 'food' && (
        <>
          <div className="animate-in slide-in-from-top-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Sparkles size={12} className="text-orange-500" /> Proyecciones de Stock</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {mascotas.map(m => <StockCard key={m.id} mascota={m} />)}
            </div>
          </div>
          <Dashboard historial={historial} />
          <div className="flex items-center justify-between mt-8 mb-4">
            <h3 className="text-lg font-black text-orange-900 uppercase flex items-center gap-2"><Clock size={20} /> Historial</h3>
            <button onClick={() => { setComparisonMode(!comparisonMode); setSelectedIds([]); }} className={`text-[10px] font-black uppercase px-3 py-2 rounded-xl transition-all ${comparisonMode ? 'bg-orange-600 text-white shadow-lg' : 'bg-orange-50 text-orange-600'}`}>
              <Swords size={12} /> {comparisonMode ? 'Cancelar' : 'Modo Duelo'}
            </button>
          </div>
          <div className="grid gap-4">
            {historial.map(i => (
              <div key={i.id} 
                   className={`bg-white p-5 rounded-2xl border flex items-center justify-between transition-all active:scale-95 cursor-pointer shadow-sm ${selectedIds.includes(i.id) ? 'border-orange-500 bg-orange-50' : 'border-slate-100'}`}
                   onClick={() => {
                     if (comparisonMode) {
                       selectedIds.includes(i.id) ? setSelectedIds(selectedIds.filter(id => id !== i.id)) : selectedIds.length < 2 && setSelectedIds([...selectedIds, i.id]);
                     } else { onVerDetalle(i, 'food'); }
                   }}>
                <div className="flex items-center gap-3">
                  {comparisonMode && (selectedIds.includes(i.id) ? <CheckSquare size={18} className="text-orange-500" /> : <Square size={18} className="text-slate-300" />)}
                  <div>
                    <h4 className="font-black text-slate-800 text-sm">{i.marca}</h4>
                    <p className={`text-[9px] font-black uppercase ${getGamaTextColor(i.calidad)}`}>{i.calidad || "GAMA DESCONOCIDA"}</p>
                  </div>
                </div>
                {!comparisonMode && <button onClick={(e) => { e.stopPropagation(); api.borrarAlimento(i.id).then(cargar); }} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>}
              </div>
            ))}
          </div>
          {/* BOTÓN FLOTANTE DEL DUELO */}
          {comparisonMode && (
            <div className="fixed bottom-24 left-0 right-0 p-6 flex justify-center z-30 animate-in slide-in-from-bottom-4">
              <button onClick={handleDuelo} disabled={selectedIds.length !== 2} className={`px-8 py-4 rounded-2xl font-black uppercase shadow-xl transition-all ${selectedIds.length === 2 ? 'bg-orange-600 text-white scale-105' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}>
                INICIAR DUELO ({selectedIds.length}/2)
              </button>
            </div>
          )}
        </>
      )}

      {subTab === 'health' && (
        <div className="animate-in fade-in duration-500">
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
            {mascotas.map(m => <button key={m.id} onClick={() => setSelectedPetId(m.id)} className={`px-6 py-2 rounded-full font-black text-[10px] uppercase transition-all whitespace-nowrap ${selectedPetId === m.id ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}>{m.nombre}</button>)}
          </div>
          {selectedPetId && <HealthHistory mascotaId={selectedPetId} />}
        </div>
      )}

      {subTab === 'vet' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
            <button onClick={() => setVetSubTab('triaje')} className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase transition-all flex items-center justify-center gap-2 ${vetSubTab === 'triaje' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'}`}><Activity size={14} /> Historial Triaje</button>
            <button onClick={() => setVetSubTab('consultas')} className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase transition-all flex items-center justify-center gap-2 ${vetSubTab === 'consultas' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}><Receipt size={14} /> Recetas y Gastos</button>
          </div>
          <h3 className="text-lg font-black text-red-900 uppercase flex items-center gap-2 mb-2"><Calendar size={20} /> {vetSubTab === 'triaje' ? 'Análisis de Síntomas' : 'Documentos Médicos'}</h3>
          <div className="grid gap-4">
            {historialVet.filter(v => { const esAdmin = (v.tipo === 'Receta' || v.tipo === 'Consulta'); return vetSubTab === 'consultas' ? esAdmin : !esAdmin; })
              .map(v => (
                <div key={v.id} className={`bg-white p-6 rounded-3xl border-l-4 shadow-sm border border-slate-100 text-left cursor-pointer active:scale-95 transition-all ${v.tipo === 'Receta' || v.tipo === 'Consulta' ? 'border-l-slate-900' : 'border-l-red-500'}`}
                  onClick={() => { const itemNormalizado = { ...v, analisis: v.nombre ? `MOTIVO: ${v.nombre.toUpperCase()}\n\n${v.analisis || v.notas || "Sin detalles"}` : (v.analisis || v.notas) }; onVerDetalle(itemNormalizado, 'vet'); }}>
                  <div className="flex justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`${v.tipo === 'Receta' || v.tipo === 'Consulta' ? 'bg-slate-100 text-slate-700' : 'bg-red-100 text-red-700'} text-[9px] font-black px-2 py-1 rounded-lg uppercase`}>{v.tipo}</span>
                      {v.precio > 0 && <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-1 rounded-lg">${v.precio.toLocaleString()}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] text-slate-400 font-bold">{new Date(v.fecha).toLocaleDateString()}</span>
                      <button onClick={(e) => { e.stopPropagation(); api.borrarConsultaVet(v.id).then(cargar); }} className="text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  {v.nombre && <h4 className="font-black text-slate-800 text-sm mb-1 uppercase tracking-tight">{v.nombre}</h4>}
                  <p className="text-xs text-slate-700 leading-relaxed italic">"{(v.analisis || v.notas || "Ver detalles").substring(0, 100)}..."</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* MODAL DUELO FINAL */}
      {dueloResult && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative text-left overflow-y-auto max-h-[90vh]">
            <button onClick={() => setDueloResult(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900"><X size={24} /></button>
            <div className="flex items-center justify-center gap-3 mb-6 text-orange-600"><Swords size={32} /><h3 className="text-2xl font-black uppercase tracking-tighter">Duelo Final</h3></div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {dueloResult.foods.map((f: any, idx: number) => (
                <div key={f.id} className={`text-center p-4 rounded-2xl border-2 ${idx === 0 ? 'border-blue-100 bg-blue-50' : 'border-red-100 bg-red-50'}`}>
                  <h4 className="font-black text-sm mb-1 truncate">{f.marca}</h4>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-slate-900 text-white rounded-md">{f.calidad || "N/A"}</span>
                </div>
              ))}
            </div>
            <div className="bg-orange-600 p-5 rounded-3xl text-white shadow-lg mb-4 relative overflow-hidden">
              <p className="text-[10px] font-black uppercase opacity-70 mb-1">🏆 Ganador</p>
              <p className="text-xl font-black">{dueloResult.veredicto.ganador}</p>
              <Sparkles size={40} className="absolute right-[-5px] top-[-5px] opacity-20" />
            </div>
            <div className="bg-slate-100 p-5 rounded-3xl border border-slate-200 mb-4 text-sm font-bold text-slate-800"><Scale size={16} className="mb-2 text-slate-400" /> {dueloResult.veredicto.diferencia}</div>
            <div className="bg-slate-900 p-6 rounded-3xl text-white text-center italic text-sm">"{dueloResult.veredicto.conclusion}"</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsManager;