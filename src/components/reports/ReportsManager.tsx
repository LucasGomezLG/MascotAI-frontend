import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
    Activity,
    Clock,
    Receipt,
    ShieldPlus,
    Sparkles,
    Stethoscope,
    Swords,
    Trash2,
    User,
    Utensils,
    Wallet,
    CheckSquare,
    Square,
    Loader2,
    ArrowRight,
    TrendingUp
} from 'lucide-react';
import {api} from '@/services/api.ts';
import Dashboard from '../../Dashboard';
import HealthHistory from './HealthHistory';
import PetBudget from './PetBudget';
import StockCard from './StockCard';
import DueloModal from './DueloModal';
import type {AlimentoDTO, ConsultaVetDTO, MascotaDTO, TriajeIADTO} from '@/types/api.types.ts';
import toast from 'react-hot-toast';
import {useAuth} from '@/context/AuthContext';
import Swal from 'sweetalert2';
import SubscriptionCard from '@/services/SuscriptionCard';

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
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

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
    if (selectedIds.length < 2) {
        toast.error("Selecciona al menos 2 alimentos");
        return;
    }

    if (!user?.esColaborador) {
        const restantes = Math.max(0, 20 - (user?.intentosIA || 0));
        if (restantes <= 0) {
            void Swal.fire({
                title: '¡Límite alcanzado!',
                text: 'Usaste tus 20 escaneos del mes. Colaborá para tener acceso ilimitado y ayudarnos con los servidores.',
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: 'SER COLABORADOR ⚡',
                cancelButtonText: 'Luego',
                confirmButtonColor: '#f97316',
            }).then((res) => {
                if (res.isConfirmed) setShowSubscriptionModal(true);
            });
            return;
        }
    }

    setLoadingDuelo(true);
    try {
      const res = await api.compararAlimentos(selectedIds);
      await refreshUser();
      
      const rawText = res.data.resultado || "";

      const getPart = (label: string) => {
        const regex = new RegExp(`${label}:?\\s*([^|]+)`, 'i');
        const match = rawText.match(regex);
        return match ? match[1].trim() : "";
      };

      const ganador = getPart('GANADOR');
      const diferencia = getPart('DIFERENCIA');
      const conclusion = getPart('CONCLUSIÓN') || getPart('CONCLUSION');

      setDueloResult({
        foods: historial.filter(h => h.id && selectedIds.includes(h.id)),
        veredicto: {
          ganador: ganador || "Análisis Comparativo",
          diferencia: diferencia || rawText,
          conclusion: conclusion || "Basado en los ingredientes y calidad nutricional detectada."
        }
      });
    } catch (e) {
      toast.error("Error al realizar el análisis");
      console.error("Error en el duelo:", e);
    } finally {
      setLoadingDuelo(false);
    }
  };

  const foodInsight = useMemo(() => {
    if (historial.length === 0) return {
        title: "Sin Historial",
        text: "Aún no has escaneado alimentos. Empezá ahora para conocer la calidad de su dieta.",
        color: "from-slate-600 to-slate-700",
        icon: <Utensils size={18} />
    };

    const bajas = historial.filter(h => (h.calidad || "").toLowerCase().includes('baja')).length;
    if (bajas > 0) return {
        title: "Calidad a Revisar",
        text: `Detectamos ${bajas} alimento(s) de gama baja en tu historial. Considerá opciones más nutritivas.`,
        color: "from-orange-500 to-orange-600",
        icon: <TrendingUp size={18} />
    };

    return {
        title: "Dieta Saludable",
        text: "La mayoría de los alimentos escaneados son de buena calidad. ¡Seguí así!",
        color: "from-indigo-500 to-indigo-600",
        icon: <Sparkles size={18} />
    };
  }, [historial]);

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
          {/* Card de Insight IA de Alimentos */}
          <div className={`bg-linear-to-br ${foodInsight.color} p-6 rounded-[2.5rem] text-white shadow-lg relative overflow-hidden group animate-in slide-in-from-top-4`}>
            <Sparkles className="absolute -right-4 -top-4 text-white/10 rotate-12 group-hover:scale-110 transition-transform" size={120} />
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                    <div className="bg-white/20 p-2 rounded-xl">{foodInsight.icon}</div>
                    <h4 className="font-black uppercase text-xs tracking-widest text-white/90">{foodInsight.title}</h4>
                </div>
                <p className="text-sm font-bold leading-relaxed mb-4">
                    {foodInsight.text}
                </p>
                <button 
                    onClick={handleEnDesarrollo}
                    className="flex items-center gap-2 text-[10px] font-black uppercase bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full transition-all"
                >
                    Comparar Calidades <ArrowRight size={12} />
                </button>
            </div>
          </div>

          <div className="mt-8">
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
                    } else {
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
                disabled={selectedIds.length < 2 || loadingDuelo} 
                className={`px-8 py-4 rounded-2xl font-black uppercase shadow-2xl transition-all flex items-center gap-2 ${selectedIds.length >= 2 && !loadingDuelo ? 'bg-orange-600 text-white scale-105 hover:bg-orange-700' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}
              >
                {loadingDuelo ? (
                  <><Loader2 className="animate-spin" size={20} /> ANALIZANDO...</>
                ) : (
                  <><Sparkles size={20} className="text-yellow-300" fill="currentColor" /> INICIAR DUELO ({selectedIds.length})</>
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

      <DueloModal dueloResult={dueloResult} onClose={() => setDueloResult(null)} />

      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-150 p-4">
          <div className="bg-white rounded-4xl p-6 max-w-sm w-full relative">
            <button
              onClick={() => setShowSubscriptionModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <SubscriptionCard user={user} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsManager;