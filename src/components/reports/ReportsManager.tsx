import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
    Activity,
    AlertCircle,
    CheckSquare,
    Clock,
    Package,
    Receipt,
    Scale,
    ShieldPlus,
    Sparkles,
    Square,
    Stethoscope,
    Swords,
    Trash2,
    User,
    Utensils,
    Wallet,
    X,
    Loader2
} from 'lucide-react';
import {api} from '@/services/api.ts';
import Dashboard from '../../Dashboard';
import HealthHistory from './HealthHistory';
import PetBudget from './PetBudget';
import type {AlimentoDTO, ConsultaVetDTO, MascotaDTO, TriajeIADTO} from '@/types/api.types.ts';
import toast from 'react-hot-toast';
import {useAuth} from '@/context/AuthContext';
import Swal from 'sweetalert2';

interface StockStatus {
  status: string;
  porcentaje: number;
  marca: string;
  diasRestantes: number;
}

const StockCard = ({ mascota, refreshKey }: { mascota: MascotaDTO, refreshKey: number }) => {
  const [stock, setStock] = useState<StockStatus | null>(null);

  useEffect(() => {
    if (mascota.id) {
      api.getStockStatus(mascota.id).then(res => setStock(res.data));
    }
  }, [mascota.id, refreshKey]);

  if (!stock || stock.status === "NO_DATA") return null;

  const percentage = stock.porcentaje;
  const getColor = (p: number) => {
    if (p > 50) return 'bg-green-500';
    if (p > 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white p-5 rounded-4xl shadow-sm border border-slate-100 mb-4 animate-in zoom-in-95">
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

type SubTabType = 'food' | 'vet' | 'health' | 'finance';

const ReportsManager = ({ onVerDetalle }: { onVerDetalle: (item: AlimentoDTO | ConsultaVetDTO | TriajeIADTO, tipo: 'food' | 'vet' | 'health') => void }) => {
  const { user, refreshUser } = useAuth();
  const [subTab, setSubTab] = useState<SubTabType>('food');
  const [vetSubTab, setVetSubTab] = useState<'triaje' | 'consultas'>('triaje');
  const [historial, setHistorial] = useState<AlimentoDTO[]>([]);
  const [historialVet, setHistorialVet] = useState<ConsultaVetDTO[]>([]);
  const [mascotas, setMascotas] = useState<MascotaDTO[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string>("");

  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dueloResult, setDueloResult] = useState<{ foods: AlimentoDTO[], veredicto: { ganador: string, diferencia: string, conclusion: string } } | null>(null);
  const [historialTriaje, setHistorialTriaje] = useState<TriajeIADTO[]>([]);
  const [loadingDuelo, setLoadingDuelo] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

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

  const historialConMascotas = useMemo(() => {
    return historial.map(item => ({
      ...item,
      pet: mascotas.find(m => m.id === item.mascotaId)
    }));
  }, [historial, mascotas]);

  const cargar = useCallback(async () => {
    try {
      const [resF, resV, resP, resT] = await Promise.all([
        api.getHistorialAlimentos(),
        api.getHistorialClinico(),
        api.getMascotas(),
        api.obtenerTriajes()
      ]);

      setHistorial(resF.data || []);
      setHistorialVet(resV.data || []);
      
      const pets = resP.data || [];
      setMascotas(pets);
      if (pets.length > 0 && !selectedPetId) {
        setSelectedPetId(pets[0].id!);
      }
      setHistorialTriaje(resT.data || []);

      setRefreshKey(prev => prev + 1);
    } catch (e) { console.error("Error cargando", e); }
  }, [selectedPetId]);

  useEffect(() => { void cargar(); }, [cargar]);

  const getGamaTextColor = (c: string | null = "") => {
    const q = (c || "").toLowerCase();
    if (q.includes('ultra')) return 'text-indigo-600';
    if (q.includes('premium')) return 'text-green-600';
    return 'text-orange-600';
  };

  const handleDuelo = async () => {
    if (selectedIds.length !== 2) return;

    // Verificar créditos si no es Pro
    if (!user?.esColaborador) {
        const restantes = Math.max(0, 20 - (user?.intentosIA || 0));
        if (restantes <= 0) {
            void Swal.fire({
                title: '¡Sin créditos!',
                text: 'No te quedan créditos de IA para este mes. Suscribite al Pase Mensual para acceso ilimitado.',
                icon: 'info',
                confirmButtonText: 'VER PLANES',
                confirmButtonColor: '#f97316'
            });
            return;
        }
    }

    setLoadingDuelo(true);
    try {
      const res = await api.compararAlimentos(selectedIds);
      await refreshUser(); // Actualizar créditos tras el consumo
      
      const rawText = res.data.resultado || "";

      if (!rawText.includes('|')) {
        // Si no viene con el formato de pipes, mostrar el texto plano de forma elegante
        setDueloResult({
            foods: historial.filter(h => h.id && selectedIds.includes(h.id)),
            veredicto: {
              ganador: "Análisis Comparativo",
              diferencia: rawText,
              conclusion: "Basado en los ingredientes y calidad nutricional detectada."
            }
          });
        return;
      }

      const parts = rawText.split('|').map((s: string) => {
        const splitPart = s.split(':');
        return splitPart.length > 1 ? splitPart[1].trim() : s.trim();
      });

      setDueloResult({
        foods: historial.filter(h => h.id && selectedIds.includes(h.id)),
        veredicto: {
          ganador: parts[0] || "No determinado",
          diferencia: parts[1] || "Diferencia no especificada",
          conclusion: parts[2] || "Sin conclusión adicional"
        }
      });
    } catch (e) {
      toast.error("Error al realizar el análisis");
      console.error("Error en el duelo:", e);
    } finally {
      setLoadingDuelo(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 text-left">
      <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto no-scrollbar">
        {[
          { id: 'food', label: 'Alimentos', icon: Utensils, color: 'bg-orange-600' },
          { id: 'vet', label: 'Vete', icon: Stethoscope, color: 'bg-red-600' },
          { id: 'health', label: 'Salud', icon: ShieldPlus, color: 'bg-emerald-600' },
          { id: 'finance', label: 'Finanzas', icon: Wallet, color: 'bg-blue-600' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id as SubTabType)}
            className={`flex-1 py-3 px-4 rounded-xl font-black text-[9px] uppercase flex items-center justify-center gap-2 transition-all whitespace-nowrap ${subTab === tab.id ? `${tab.color} text-white shadow-md` : 'text-slate-400'}`}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {subTab === 'finance' && (
        <div className="animate-in fade-in slide-in-from-bottom-4">
          <PetBudget />
        </div>
      )}

      {subTab === 'food' && (
        <>
          <div className="animate-in slide-in-from-top-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Sparkles size={12} className="text-orange-500" /> Proyecciones de Stock
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {mascotas.map(m => <StockCard key={m.id} mascota={m} refreshKey={refreshKey} />)}
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
                className={`bg-white p-5 rounded-[2.5rem] border flex flex-col transition-all active:scale-[0.98] cursor-pointer shadow-sm relative overflow-hidden ${selectedIds.includes(i.id!) ? 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/30' : 'border-slate-100'}`}
                onClick={() => {
                  if (comparisonMode && i.id) {
                    if (selectedIds.includes(i.id)) {
                      setSelectedIds(selectedIds.filter(id => id !== i.id));
                    } else if (selectedIds.length < 2) {
                      setSelectedIds([...selectedIds, i.id]);
                    }
                  } else {
                    onVerDetalle(i, 'food');
                  }
                }}>

                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {comparisonMode && (selectedIds.includes(i.id!) ? <CheckSquare size={18} className="text-orange-500" /> : <Square size={18} className="text-slate-300" />)}
                    <div>
                      <h4 className="font-black text-slate-800 text-base">{i.marca}</h4>
                      <p className={`text-[10px] font-black uppercase tracking-tighter ${getGamaTextColor(i.calidad)}`}>{i.calidad || "GAMA DESCONOCIDA"}</p>
                    </div>
                  </div>
                  {!comparisonMode && <button onClick={(e) => { e.stopPropagation(); if (i.id) void api.borrarAlimentoHistorial(i.id).then(() => void cargar()); }} className="p-2 text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>}
                </div>

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
                          <span className="text-[10px] font-medium text-slate-600">Ración: {i.porcionRecomendada || "---"}g</span>
                        </div>
                        <span className="text-[8px] font-black px-2 py-0.5 bg-white text-slate-400 rounded-md border border-slate-100 uppercase">{i.pet.condicion}</span>
                      </div>
                    </div>
                  ) : <div className="py-2 text-center text-[10px] font-black text-slate-400 uppercase">Análisis Genérico</div>}
                </div>
              </div>
            ))}
          </div>

          {comparisonMode && (
            <div className="fixed bottom-24 left-0 right-0 p-6 flex justify-center z-30 animate-in slide-in-from-bottom-4">
              <button 
                onClick={handleDuelo} 
                disabled={selectedIds.length !== 2 || loadingDuelo} 
                className={`px-8 py-4 rounded-2xl font-black uppercase shadow-2xl transition-all flex items-center gap-2 ${selectedIds.length === 2 && !loadingDuelo ? 'bg-orange-600 text-white scale-105 hover:bg-orange-700' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}
              >
                {loadingDuelo ? (
                  <><Loader2 className="animate-spin" size={20} /> ANALIZANDO...</>
                ) : (
                  <>INICIAR DUELO ({selectedIds.length}/2)</>
                )}
              </button>
            </div>
          )}
        </>
      )}

      {subTab === 'health' && (
        <div className="animate-in fade-in duration-500">
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
            {mascotas.map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedPetId(m.id!)}
                className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase transition-all whitespace-nowrap border-2 ${selectedPetId === m.id ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-white text-slate-400 border-slate-100'}`}
              >
                {m.nombre}
              </button>
            ))}
          </div>
          {selectedPetId && <HealthHistory mascotaId={selectedPetId} />}
        </div>
      )}

      {subTab === 'vet' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
            <button onClick={() => setVetSubTab('triaje')} className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase transition-all flex items-center justify-center gap-2 ${vetSubTab === 'triaje' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'}`}>
              <Activity size={14} /> Historial Triaje
            </button>
            <button onClick={() => setVetSubTab('consultas')} className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase transition-all flex items-center justify-center gap-2 ${vetSubTab === 'consultas' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>
              <Receipt size={14} /> Recetas y Gastos
            </button>
          </div>

          <div className="grid gap-4">
            {vetSubTab === 'triaje' ? (
              historialTriaje.map(t => (
                <div key={t.id} className="bg-white p-6 rounded-[2.5rem] border-l-8 border-l-red-500 shadow-sm border border-slate-100 text-left transition-all active:scale-[0.98] cursor-pointer"
                  onClick={() => onVerDetalle(t, 'vet')}>
                  <div className="flex justify-between items-start mb-3">
                    <span className="bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded-md uppercase">{t.categoria}</span>
                    <button onClick={(e) => { e.stopPropagation(); if (t.id) void api.borrarTriaje(t.id).then(() => void cargar()); }} className="text-slate-200 hover:text-red-500"><Trash2 size={16} /></button>
                  </div>
                  <h4 className="font-black text-slate-800 text-sm mb-1 uppercase tracking-tight">{t.categoria}</h4>
                  <p className="text-xs text-slate-500 italic line-clamp-2">"{t.analisisDetalle}"</p>
                </div>
              ))
            ) : (
              historialVet.map(v => (
                <div key={v.id} className="bg-white p-6 rounded-[2.5rem] border-l-8 border-l-slate-900 shadow-sm border border-slate-100 text-left transition-all active:scale-[0.98] cursor-pointer"
                  onClick={() => onVerDetalle(v, 'vet')}>
                  <div className="flex justify-between items-start mb-3">
                    <span className="bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded-md uppercase">{v.tipo}</span>
                    <button onClick={(e) => { e.stopPropagation(); if (v.id) void api.eliminarConsultaVet(v.id).then(() => void cargar()); }} className="text-slate-200 hover:text-red-500"><Trash2 size={16} /></button>
                  </div>
                  <h4 className="font-black text-slate-800 text-sm mb-1 uppercase tracking-tight">{v.nombre}</h4>
                  {v.precio && v.precio > 0 && <span className="text-emerald-600 font-black text-xs block mb-1">${v.precio.toLocaleString()}</span>}
                  <p className="text-xs text-slate-500 italic line-clamp-2">"{(v.diagnostico || "Ver detalles")}"</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {dueloResult && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-110 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-8 shadow-2xl relative text-left overflow-y-auto max-h-[90vh] animate-in zoom-in-95">
            <button onClick={() => setDueloResult(null)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-900 transition-colors"><X size={24} /></button>
            <div className="flex items-center justify-center gap-3 mb-8 text-orange-600">
              <Swords size={32} />
              <h3 className="text-2xl font-black uppercase tracking-tighter">Duelo Final</h3>
            </div>
            <div className="bg-orange-600 p-6 rounded-[2.5rem] text-white shadow-xl mb-4 relative overflow-hidden">
              <p className="text-[10px] font-black uppercase opacity-70 mb-1">🏆 Ganador del Análisis</p>
              <p className="text-2xl font-black">{dueloResult.veredicto.ganador}</p>
            </div>
            <div className="space-y-4">
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 text-sm font-bold text-slate-700 flex gap-3">
                <Scale size={24} className="text-orange-500 shrink-0" />
                <p>{dueloResult.veredicto.diferencia}</p>
              </div>
              <div className="bg-slate-900 p-6 rounded-4xl text-white text-center italic text-sm border-b-4 border-orange-500">
                "{dueloResult.veredicto.conclusion}"
              </div>
            </div>
            <button onClick={() => setDueloResult(null)} className="w-full py-5 bg-slate-900 text-white rounded-4xl font-black mt-6">CERRAR ANÁLISIS</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsManager;