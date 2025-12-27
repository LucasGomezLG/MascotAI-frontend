import React, { useState, useRef, useEffect } from 'react';
import { User, Stethoscope, RefreshCw, Loader2, Activity, AlertCircle, X } from 'lucide-react';
import { api } from '../../../services/api';
import { Toast } from '../../../utils/alerts';
import MedicalReport from './MedicalReport';

const SymptomScanner = ({ mascotas, onScanComplete, onReset, initialData }: any) => {
  const [selectedPet, setSelectedPet] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tipo, setTipo] = useState("Materia Fecal");
  // Estado local que decide si mostramos el formulario o el reporte
  const [vetResult, setVetResult] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ RESTAURADO: Si el componente padre le pasa datos iniciales, los carga.
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      console.log("SymptomScanner cargando initialData:", initialData);
      setVetResult(initialData);
      if (initialData.mascotaId) setSelectedPet(initialData.mascotaId);
    }
  }, [initialData]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setSelectedImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!selectedImage) return;
    setLoading(true);
    try {
      // Usamos "generic" si no se seleccionó mascota, para que el backend no falle.
      const mascotaEnvio = selectedPet || "generic";
      const res = await api.analizarTriaje(selectedImage, tipo, mascotaEnvio);
      // Al guardar el resultado en el estado local, la vista cambia automáticamente al reporte.
      setVetResult(res.data);
      onScanComplete();
    } catch (e) { 
      Toast.fire({ icon: 'error', title: 'Error en el análisis', text: 'Por favor, intentá con otra imagen.' }); 
    } finally { 
      setLoading(false); 
    }
  };

  // Función para limpiar el estado y volver al formulario de escaneo
  const handleResetInternal = () => {
    setVetResult(null);
    setSelectedImage(null);
    setSelectedPet("");
    if (onReset) onReset();
  };

  // ----- RENDERIZADO CONDICIONAL -----

  // SI HAY RESULTADO: Muestra el contenedor del reporte médico
  if (vetResult) {
    const nombreMascota = selectedPet ? mascotas.find((m:any) => m.id === selectedPet)?.nombre : "Análisis Genérico";
    const tipoAnalisis = vetResult.tipo || tipo || "Triaje";

    return (
      <div className="bg-white rounded-[3rem] shadow-2xl p-8 border-2 border-slate-50 text-left animate-in zoom-in-95 w-full">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-red-600 p-3 rounded-2xl text-white shadow-lg shadow-red-100 shrink-0"><AlertCircle size={28} /></div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tighter leading-none">Triaje Médico</h3>
              <p className="text-slate-400 font-bold text-[10px] uppercase mt-1 truncate">
                 {nombreMascota} • {tipoAnalisis}
              </p>
            </div>
          </div>
          <button onClick={handleResetInternal} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:text-slate-900 transition-colors shrink-0"><X size={20} /></button>
        </div>
        
        {/* Renderizamos el subcomponente del reporte */}
        <MedicalReport data={vetResult} />
        
        <button onClick={handleResetInternal} className="w-full mt-8 py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
          FINALIZAR ANÁLISIS
        </button>
      </div>
    );
  }

  // SI NO HAY RESULTADO: Muestra el formulario de escaneo
  return (
    <div className="space-y-6 text-left animate-in fade-in duration-500 w-full">
      <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-red-50 w-full">
        <label className="text-[10px] font-black text-red-900 uppercase tracking-widest flex items-center gap-2 mb-3"><User size={14} /> Paciente</label>
        <select value={selectedPet} onChange={(e) => setSelectedPet(e.target.value)} className="w-full p-4 rounded-2xl border-2 border-red-50 bg-red-50/30 font-bold outline-none text-slate-700 focus:border-red-500 transition-all">
          <option value="">Análisis Genérico (No sé quién fue)</option>
          {mascotas.map((p: any) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-red-100 w-full">
        <label className="text-[10px] font-black text-red-900 uppercase tracking-widest mb-3 block">¿Qué necesitas analizar?</label>
        <div className="grid grid-cols-2 gap-2">
          {['Materia Fecal', 'Heridas', 'Vómitos', 'Piel/Ojos'].map(t => (
            <button key={t} onClick={() => setTipo(t)} className={`py-3 rounded-xl font-black text-[10px] uppercase transition-all border-2 ${tipo === t ? 'bg-red-600 border-red-600 text-white shadow-md' : 'bg-red-50 border-transparent text-red-600'}`}>{t}</button>
          ))}
        </div>
      </div>

      <div onClick={() => fileInputRef.current?.click()} className="bg-white h-64 border-4 border-dashed border-red-100 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:border-red-300 transition-all active:scale-[0.98] group relative overflow-hidden w-full">
        {selectedImage ? (
          <><img src={selectedImage} alt="Preview" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-red-900/20 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]"><RefreshCw className="text-white mb-2" /><span className="text-white font-black text-[10px] uppercase">Cambiar Foto</span></div></>
        ) : (
          <div className="text-center"><div className="bg-red-50 p-5 rounded-full mb-4 inline-block group-hover:scale-110 transition-transform"><Stethoscope size={40} className="text-red-200" /></div><p className="text-red-900/40 font-black leading-tight uppercase text-xs tracking-widest px-6">Capturá el signo de malestar</p></div>
        )}
      </div>

      <button onClick={handleScan} disabled={loading || !selectedImage} className={`w-full flex items-center justify-center gap-3 py-6 rounded-[2rem] font-black text-xl shadow-xl transition-all active:scale-95 ${loading || !selectedImage ? 'bg-red-100 text-red-300' : 'bg-red-600 text-white shadow-red-200 hover:bg-red-700'}`}>
        {loading ? <Loader2 className="animate-spin" /> : <><Activity size={20} /> ANALIZAR AHORA</>}
      </button>
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFile} />
    </div>
  );
};

export default SymptomScanner;