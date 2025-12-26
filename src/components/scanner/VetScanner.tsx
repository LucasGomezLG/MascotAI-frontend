import React, { useState, useEffect } from 'react';
import {
  Stethoscope, Loader2, AlertCircle, AlertTriangle,
  ClipboardList, Siren, Receipt, Activity, Wallet,
  User, ClipboardPlus
} from 'lucide-react';
import { api } from '../../services/api';
import { Toast } from '../../utils/alerts';

// --- SUB-COMPONENTE 1: ESCÁNER DE SÍNTOMAS (Tu código original) ---
const SymptomScanner = ({ onScanComplete, initialData, onReset }: any) => {
  const [loading, setLoading] = useState(false);
  const [tipo, setTipo] = useState("Materia Fecal");
  const [vetResult, setVetResult] = useState<any>(initialData || null);

  useEffect(() => {
    if (initialData) setVetResult(initialData);
  }, [initialData]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      setLoading(true);
      try {
        const res = await api.analizarVet(reader.result as string, tipo, "generic");
        setVetResult(res.data);
        onScanComplete();
      } catch (e) { Toast.fire({ icon: 'error', title: 'Error en el análisis médico' }); }
      finally { setLoading(false); }
    };
    reader.readAsDataURL(file);
  };

  const formatAnalisis = (text: string) => {
    if (!text) return null;
    const cleanedText = text.replace(/¡Entendido! Aquí está el análisis:|Claro, aquí tienes el análisis:/gi, '').trim();
    const lines = cleanedText.split('\n').filter(line => line.trim().length > 2);

    return (
      <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
        {lines.map((line, index) => {
          const parts = line.split('**');
          const isUrgency = line.toLowerCase().includes("urgencia");
          let Icon = isUrgency ? Siren : (line.toLowerCase().includes("riesgo") ? AlertTriangle : ClipboardList);

          return (
            <div key={index} className={`p-4 rounded-2xl border flex gap-3 items-start animate-in fade-in slide-in-from-right-2 duration-300 ${isUrgency ? 'bg-red-50 border-red-100 text-red-900' : 'bg-slate-50 border-slate-100'}`}>
              <div className={`p-2 rounded-lg mt-0.5 ${isUrgency ? 'bg-red-100 text-red-600' : 'bg-white text-slate-400 shadow-sm'}`}>
                <Icon size={16} />
              </div>
              <div>
                {parts.length > 1 ? (
                  <p>
                    <strong className={`font-black uppercase tracking-tight ${isUrgency ? 'text-red-700' : 'text-slate-900'}`}>{parts[1]}</strong>
                    <span>{parts[2]}</span>
                  </p>
                ) : <p>{line.replace(/^\d+\.\s*/, '')}</p>}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="animate-in fade-in duration-500">
      {!vetResult ? (
        <div className="space-y-6 text-left">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-red-100">
            <label className="text-[10px] font-black text-red-900 uppercase tracking-widest mb-3 block">¿Qué necesitas analizar?</label>
            <div className="grid grid-cols-2 gap-2">
              {['Materia Fecal', 'Heridas', 'Vómitos', 'Piel/Ojos'].map(t => (
                <button key={t} onClick={() => setTipo(t)} className={`py-3 rounded-xl font-bold text-[10px] uppercase transition-all ${tipo === t ? 'bg-red-600 text-white shadow-md' : 'bg-red-50 text-red-600'}`}>{t}</button>
              ))}
            </div>
          </div>
          <div className="bg-white p-12 border-4 border-dashed border-red-100 rounded-[2.5rem] flex flex-col items-center">
            <Stethoscope size={60} className="text-red-200 mb-4" />
            <p className="text-red-900/40 font-bold text-center leading-tight">Capturá el signo <br /> de malestar</p>
          </div>
          <label className={`w-full flex items-center justify-center gap-3 py-6 rounded-2xl font-black text-xl shadow-xl cursor-pointer ${loading ? 'bg-red-200 text-red-400' : 'bg-red-600 text-white shadow-red-200'}`}>
            {loading ? <><Loader2 className="animate-spin" /> ANALIZANDO...</> : "ANALIZAR AHORA"}
            <input type="file" className="hidden" accept="image/*" onChange={handleFile} disabled={loading} />
          </label>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border-2 border-red-50 text-left">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-red-100 p-3 rounded-2xl text-red-600"><AlertCircle size={24} /></div>
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Resultado de Triaje</h3>
              <p className="text-red-500 font-bold text-[10px] uppercase">{vetResult.tipo}</p>
            </div>
          </div>
          <div className="mb-6">{formatAnalisis(vetResult.analisis)}</div>
          <button onClick={() => { setVetResult(null); onReset(); }} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase">FINALIZAR</button>
        </div>
      )}
    </div>
  );
};

// --- SUB-COMPONENTE 2: ESCÁNER DE CONSULTAS (Nuevo) ---
const ConsultationScanner = ({ mascotas, onComplete }: any) => {
  const [selectedPet, setSelectedPet] = useState("");
  const [loading, setLoading] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  const handleRecipeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPet) {
      if (!selectedPet) Toast.fire({ icon: 'warning', title: 'Seleccioná a Simba o Adelina' });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      setLoading(true);
      try {
        // 1. Llamada al nuevo endpoint especializado
        const res = await api.analizarReceta(reader.result as string, selectedPet);

        // 2. Lógica de limpieza: Gemini a veces devuelve el JSON envuelto en ```json ... ```
        let parsedData;
        if (typeof res.data === 'string') {
          const cleanJson = res.data.replace(/```json|```/g, '').trim();
          parsedData = JSON.parse(cleanJson);
        } else {
          parsedData = res.data;
        }

        // 3. Mapeo de datos para el modal de Confirmar Consulta
        setEditData({
          ...parsedData,
          mascotaId: selectedPet,
          tipo: 'Consulta',
          // Aseguramos que el precio sea numérico para el reporte de finanzas
          precio: parsedData.precio || 0
        });

      } catch (e) {
        console.error("[ERROR] Error al procesar receta:", e);
        Toast.fire({ icon: 'error', title: 'No se pudo leer la letra del médico' });
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  /* Buscá la función handleGuardar y reemplazala por esta */
  const handleGuardar = async () => {
    try {
      setLoading(true);
      // Usamos el nuevo "camino diferente"
      await api.guardarReceta(editData);

      Toast.fire({
        icon: 'success',
        title: '¡Receta Guardada!',
        text: 'El costo médico se registró en tu presupuesto de Finanzas.'
      });

      setEditData(null);
      onComplete(); // Recarga la lista de reportes
    } catch (e) {
      console.error("[ERROR] Fallo al guardar receta:", e);
      Toast.fire({ icon: 'error', title: 'No se pudo guardar la receta' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      {!editData ? (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 text-left">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
              <User size={14} /> Mascota
            </label>

            <select
              value={selectedPet}
              onChange={(e) => setSelectedPet(e.target.value)}
              className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50/50 font-bold text-slate-700 outline-none"
            >
              <option value="">¿Quién fue al vete?</option>
              {/* Blindaje contra el error de undefined .map() */}
              {(mascotas || []).map((p: any) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          <div className="bg-white p-12 border-4 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center">
            <Receipt size={60} className="text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold text-center leading-tight">
              Escaneá la receta <br /> o factura médica
            </p>
          </div>

          <label className={`w-full flex items-center justify-center gap-3 py-6 rounded-2xl font-black text-xl shadow-xl cursor-pointer transition-all active:scale-95 ${loading ? 'bg-slate-200' : 'bg-slate-900 text-white shadow-slate-200'}`}>
            {loading ? <><Loader2 className="animate-spin" /> PROCESANDO...</> : "ESCANEAR DOCUMENTO"}
            <input type="file" className="hidden" accept="image/*" onChange={handleRecipeFile} disabled={loading || !selectedPet} />
          </label>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border-2 border-slate-50 text-left animate-in zoom-in-95">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-3 rounded-2xl text-blue-600">
              <ClipboardPlus size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none">Confirmar Consulta</h3>
              <p className="text-blue-500 font-bold text-[10px] uppercase mt-1">Administración Médica</p>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            {/* Título o Medicamento Principal */}
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Motivo / Diagnóstico</p>
              <input
                type="text"
                className="w-full bg-transparent font-black text-lg text-slate-800 border-b-2 border-slate-100 focus:border-blue-500 outline-none transition-all pb-1"
                value={editData.nombre}
                onChange={(e) => setEditData({ ...editData, nombre: e.target.value })}
              />
            </div>

            {/* COSTO: Vital para el reporte de Finanzas */}
            <div className="bg-blue-50/50 p-5 rounded-3xl border border-blue-100">
              <p className="text-[10px] font-black text-blue-500 uppercase mb-2 flex items-center gap-2">
                <Wallet size={12} /> Costo de Consulta / Factura
              </p>
              <div className="relative">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 font-black text-slate-400">$</span>
                <input
                  type="number"
                  className="w-full bg-transparent pl-4 font-black text-lg text-slate-800 border-b-2 border-slate-100 focus:border-blue-500 outline-none pb-1"
                  placeholder="0.00"
                  value={editData.precio || ''}
                  onChange={(e) => setEditData({ ...editData, precio: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            {/* NOTAS DETALLADAS: Aquí la IA pone la receta y observaciones */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Detalles Médicos y Receta</p>
              <textarea
                className="w-full bg-transparent text-xs font-bold text-slate-600 italic leading-relaxed outline-none resize-none"
                rows={3}
                value={editData.notas}
                onChange={(e) => setEditData({ ...editData, notas: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setEditData(null)}
              className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest"
            >
              Descartar
            </button>
            <button
              onClick={handleGuardar}
              className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg uppercase text-[10px] tracking-widest"
            >
              Guardar Consulta
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE PRINCIPAL UNIFICADO ---
const VetScanner = ({ mascotas, onScanComplete, onReset }: any) => {
  const [activeTab, setActiveTab] = useState<'triaje' | 'consultas'>('triaje');

  return (
    <div className="space-y-6 pb-20">
      <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
        <button onClick={() => setActiveTab('triaje')} className={`flex-1 py-3 px-4 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 transition-all ${activeTab === 'triaje' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400'}`}>
          <Activity size={14} /> Triaje Rápido
        </button>
        <button onClick={() => setActiveTab('consultas')} className={`flex-1 py-3 px-4 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 transition-all ${activeTab === 'consultas' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'}`}>
          <Receipt size={14} /> Consultas/Recetas
        </button>
      </div>

      {activeTab === 'triaje' ? (
        <SymptomScanner onScanComplete={onScanComplete} onReset={onReset} />
      ) : (
        <ConsultationScanner mascotas={mascotas} onComplete={onScanComplete} />
      )}
    </div>
  );
};

export default VetScanner;