import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Utensils, Stethoscope, Clock, Calendar, Trash2, Swords,
  CheckSquare, Square, X, Sparkles, Scale, Package, AlertCircle,
  ShieldPlus, Wallet, BarChart3, Activity, Receipt, User, ChevronRight
} from 'lucide-react';
import { api } from '../../services/api';
import Dashboard from '../../Dashboard';
import HealthHistory from './HealthHistory';
import PetBudget from './PetBudget';

// --- SUB-COMPONENTE DE STOCK OPTIMIZADO ---
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
          <div className={`p-2.5 rounded-xl text-white ${getColor(percentage)} shadow-lg shadow-current/20`}>
            <Package size={20} />
          </div>
          <div>
            <h4 className="font-black text-slate-800 text-sm leading-none">{mascota.nombre}</h4>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{stock.marca}</p>
          </div>
        </div>
        {percentage < 20 && <AlertCircle size={18} className="text-red-500 animate-pulse" />}
      </div>
      <div className="flex justify-between items-end mb-2">
        <p className="text-2xl font-black text-slate-800 tracking-tighter">
          {stock.diasRestantes} <span className="text-[10px] text-slate-400 uppercase">días</span>
        </p>
        <p className="text-[10px] font-black text-slate-600">{percentage}%</p>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full transition-all duration-1000 ${getColor(percentage)}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
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

  // ✅ Lógica de edad reutilizable basada en fechaNacimiento
  const calcularEdad = useCallback((fecha: string) => {
    if (!fecha) return "---";
    const hoy = new Date();
    const cumple = new Date(fecha);
    let edad = hoy.getFullYear() - cumple.getFullYear();
    if (hoy.getMonth() < cumple.getMonth() || (hoy.getMonth() === cumple.getMonth() && hoy.getDate() < cumple.getDate())) {
      edad--;
    }
    return edad;
  }, []);

  // ✅ OPTIMIZACIÓN: Pre-procesamos el historial para vincular la mascota UNA SOLA VEZ
  const historialConMascotas = useMemo(() => {
    return historial.map(item => ({
      ...item,
      pet: mascotas.find(m => m.id === item.mascotaId)
    }));
  }, [historial, mascotas]);

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
      {/* Selector de Tabs Principal */}
      <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto custom-scrollbar">
        {[
          { id: 'food', label: 'Alimentos', icon: Utensils, color: 'bg-orange-600' },
          { id: 'vet', label: 'Vete', icon: Stethoscope, color: 'bg-red-600' },
          { id: 'health', label: 'Salud', icon: ShieldPlus, color: 'bg-emerald-600' },
          { id: 'finance', label: 'Finanzas', icon: Wallet, color: 'bg-blue-600' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id as any)}
            className={`flex-1 py-3 px-4 rounded-xl font-black text-[9px] uppercase flex items-center justify-center gap-2 transition-all whitespace-nowrap ${subTab === tab.id ? `${tab.color} text-white shadow-md` : 'text-slate-400'}`}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* TABS DE FINANZAS */}
      {subTab === 'finance' && (
        <div className="animate-in fade-in slide-in-from-bottom-4">
          <PetBudget />
          <div className="mt-4 p-5 bg-blue-50 rounded-[2rem] border border-blue-100 flex items-center gap-4 text-blue-800">
            <BarChart3 size={20} className="text-blue-600" />
            <p className="text-xs font-bold">Tus ahorros del mes están bajo control, Lucas.</p>
          </div>
        </div>
      )}

      {/* TABS DE ALIMENTOS (Historial con Pet Info) */}
      {subTab === 'food' && (
        <>
          <div className="animate-in slide-in-from-top-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Sparkles size={12} className="text-orange-500" /> Proyecciones de Stock
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {mascotas.map(m => <StockCard key={m.id} mascota={m} />)}
            </div>
          </div>

          <Dashboard historial={historial} />

          <div className="flex items-center justify-between mt-8 mb-4">
            <h3 className="text-lg font-black text-orange-900 uppercase flex items-center gap-2"><Clock size={20} /> Historial</h3>
            <button onClick={() => { setComparisonMode(!comparisonMode); setSelectedIds([]); }} className={`text-[10px] font-black uppercase px-3 py-2 rounded-xl transition-all flex items-center gap-2 ${comparisonMode ? 'bg-orange-600 text-white shadow-lg' : 'bg-orange-50 text-orange-600'}`}>
              <Swords size={12} /> {comparisonMode ? 'Cancelar' : 'Modo Duelo'}
            </button>
          </div>

          <div className="grid gap-4">
            {historialConMascotas.map(i => (
              <div key={i.id}
                className={`bg-white p-5 rounded-[2.5rem] border flex flex-col transition-all active:scale-[0.98] cursor-pointer shadow-sm relative overflow-hidden ${selectedIds.includes(i.id) ? 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/30' : 'border-slate-100'}`}
                onClick={() => {
                  if (comparisonMode) {
                    selectedIds.includes(i.id) ? setSelectedIds(selectedIds.filter(id => id !== i.id)) : selectedIds.length < 2 && setSelectedIds([...selectedIds, i.id]);
                  } else { onVerDetalle(i, 'food'); }
                }}>

                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {comparisonMode && (selectedIds.includes(i.id) ? <CheckSquare size={18} className="text-orange-500" /> : <Square size={18} className="text-slate-300" />)}
                    <div>
                      <h4 className="font-black text-slate-800 text-base">{i.marca}</h4>
                      <p className={`text-[10px] font-black uppercase tracking-tighter ${getGamaTextColor(i.calidad)}`}>{i.calidad || "GAMA DESCONOCIDA"}</p>
                    </div>
                  </div>
                  {!comparisonMode && <button onClick={(e) => { e.stopPropagation(); api.borrarAlimento(i.id).then(cargar); }} className="p-2 text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>}
                </div>

                {/* ✅ FICHA DE MASCOTA DENTRO DEL REPORTE - CORREGIDA */}
                <div className={`p-4 rounded-3xl flex flex-col gap-2 ${i.pet ? 'bg-orange-50/50 border border-orange-100' : 'bg-slate-50 border border-slate-100 italic text-slate-400'}`}>
                  {i.pet ? (
                    <div className="grid grid-cols-2 gap-y-2">
                      <div className="flex items-center gap-2">
                        <User size={12} className="text-orange-400" />
                        <span className="text-[10px] font-bold text-slate-700">{i.pet.nombre}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">EDAD: {calcularEdad(i.pet.fechaNacimiento)}</span>
                      </div>
                      <div className="col-span-2 flex items-center justify-between border-t border-orange-100/50 pt-2 mt-1">
                        <div className="flex items-center gap-2">
                          <Utensils size={12} className="text-orange-400" />
                          {/* ✅ CORRECCIÓN: Usamos porcionRecomendada (exacto como en DB) */}
                          <span className="text-[10px] font-medium text-slate-600">Ración: {i.porcionRecomendada || "---"}g</span>
                        </div>
                        <span className="text-[8px] font-black px-2 py-0.5 bg-white text-slate-400 rounded-md border border-slate-100 uppercase">{i.pet.condicion}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2 text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Análisis Genérico</p>
                      <p className="text-[8px] font-bold text-slate-300 uppercase mt-1">No se seleccionó mascota</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* BOTÓN FLOTANTE DEL DUELO */}
          {comparisonMode && (
            <div className="fixed bottom-24 left-0 right-0 p-6 flex justify-center z-30 animate-in slide-in-from-bottom-4">
              <button onClick={handleDuelo} disabled={selectedIds.length !== 2} className={`px-8 py-4 rounded-2xl font-black uppercase shadow-2xl transition-all ${selectedIds.length === 2 ? 'bg-orange-600 text-white scale-105 hover:bg-orange-700' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}>
                INICIAR DUELO ({selectedIds.length}/2)
              </button>
            </div>
          )}
        </>
      )}

      {/* TABS DE SALUD */}
      {subTab === 'health' && (
        <div className="animate-in fade-in duration-500">
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
            {mascotas.map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedPetId(m.id)}
                className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase transition-all whitespace-nowrap border-2 ${selectedPetId === m.id ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-white text-slate-400 border-slate-100'}`}
              >
                {m.nombre}
              </button>
            ))}
          </div>
          {selectedPetId && <HealthHistory mascotaId={selectedPetId} />}
        </div>
      )}

      {/* TABS DE VETE */}
      {subTab === 'vet' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
            <button onClick={() => setVetSubTab('triaje')} className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase transition-all flex items-center justify-center gap-2 ${vetSubTab === 'triaje' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'}`}><Activity size={14} /> Historial Triaje</button>
            <button onClick={() => setVetSubTab('consultas')} className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase transition-all flex items-center justify-center gap-2 ${vetSubTab === 'consultas' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}><Receipt size={14} /> Recetas y Gastos</button>
          </div>

          <h3 className="text-lg font-black text-red-900 uppercase flex items-center gap-2 mb-2">
            <Calendar size={20} /> {vetSubTab === 'triaje' ? 'Análisis de Síntomas' : 'Documentos Médicos'}
          </h3>

          <div className="grid gap-4">
            {historialVet
              .filter(v => (vetSubTab === 'consultas' ? (v.tipo === 'Receta' || v.tipo === 'Consulta') : (v.tipo !== 'Receta' && v.tipo !== 'Consulta')))
              .map(v => (
                <div key={v.id}
                  className={`bg-white p-6 rounded-[2.5rem] border-l-8 shadow-sm border border-slate-100 text-left transition-all active:scale-[0.98] ${v.tipo === 'Receta' || v.tipo === 'Consulta' ? 'border-l-slate-900' : 'border-l-red-500'}`}
                  onClick={() => onVerDetalle({ ...v, analisis: v.nombre ? `MOTIVO: ${v.nombre.toUpperCase()}\n\n${v.analisis || v.notas || "Sin detalles"}` : (v.analisis || v.notas) }, 'vet')}>

                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`${v.tipo === 'Receta' || v.tipo === 'Consulta' ? 'bg-slate-900 text-white' : 'bg-red-500 text-white'} text-[8px] font-black px-2 py-1 rounded-md uppercase`}>{v.tipo}</span>
                      {v.precio > 0 && <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-1 rounded-md tracking-tighter">${v.precio.toLocaleString()}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] text-slate-400 font-bold uppercase">{new Date(v.fecha).toLocaleDateString()}</span>
                      <button onClick={(e) => { e.stopPropagation(); api.borrarConsultaVet(v.id).then(cargar); }} className="text-slate-200 hover:text-red-500"><Trash2 size={16} /></button>
                    </div>
                  </div>

                  {v.nombre && <h4 className="font-black text-slate-800 text-sm mb-1 uppercase tracking-tight">{v.nombre}</h4>}
                  <p className="text-xs text-slate-500 leading-relaxed italic line-clamp-2">"{(v.analisis || v.notas || "Ver detalles")}"</p>

                  <div className="mt-4 flex justify-end">
                    <span className="text-[9px] font-black text-slate-300 flex items-center gap-1 uppercase">Ver más <ChevronRight size={10} /></span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* MODAL DUELO FINAL */}
      {dueloResult && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-8 shadow-2xl relative text-left overflow-y-auto max-h-[90vh] animate-in zoom-in-95">
            <button onClick={() => setDueloResult(null)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-900 transition-colors"><X size={24} /></button>
            <div className="flex items-center justify-center gap-3 mb-8 text-orange-600">
              <Swords size={32} />
              <h3 className="text-2xl font-black uppercase tracking-tighter">Duelo Final</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {dueloResult.foods.map((f: any, idx: number) => (
                <div key={f.id} className={`p-5 rounded-3xl border-2 flex flex-col items-center gap-2 ${idx === 0 ? 'border-blue-100 bg-blue-50/50' : 'border-red-100 bg-red-50/50'}`}>
                  <h4 className="font-black text-xs text-center truncate w-full">{f.marca}</h4>
                  <span className="text-[8px] font-black uppercase px-3 py-1 bg-slate-900 text-white rounded-lg shadow-sm">{f.calidad || "N/A"}</span>
                </div>
              ))}
            </div>

            <div className="bg-orange-600 p-6 rounded-[2.5rem] text-white shadow-xl shadow-orange-200/50 mb-4 relative overflow-hidden">
              <p className="text-[10px] font-black uppercase opacity-70 mb-1 tracking-widest">🏆 Ganador del Análisis</p>
              <p className="text-2xl font-black">{dueloResult.veredicto.ganador}</p>
              <Sparkles size={60} className="absolute right-[-10px] top-[-10px] opacity-20" />
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 text-sm font-bold text-slate-700 flex gap-3">
                <Scale size={24} className="text-orange-500 shrink-0" />
                <p className="leading-snug">{dueloResult.veredicto.diferencia}</p>
              </div>
              <div className="bg-slate-900 p-6 rounded-[2rem] text-white text-center italic text-sm leading-relaxed border-b-4 border-orange-500">
                "{dueloResult.veredicto.conclusion}"
              </div>
            </div>
            <button onClick={() => setDueloResult(null)} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black mt-6">CERRAR ANÁLISIS</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsManager;