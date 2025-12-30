import React, { useState, useRef, useEffect } from 'react'; // ✅ Importamos useEffect
import { Camera, Loader2, User, RefreshCw, Sparkles, X, Image as ImageIcon, Activity } from 'lucide-react';
import { api } from '../../../services/api';
import { Toast } from '../../../utils/alerts';
import MedicalReport from './MedicalReport';
import Swal from 'sweetalert2';

// ✅ 1. Agregamos initialData a las props
const SymptomScanner = ({ mascotas, initialData, onScanComplete }: any) => {
  const [selectedPet, setSelectedPet] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("MATERIA FECAL");

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 🛡️ Solo cargamos el resultado si NO es un documento médico
    if (initialData && !initialData.esDocumentoMedico) {
      setResult(initialData);
      if (initialData.mascotaId) {
        setSelectedPet(initialData.mascotaId);
      }
    }
  }, [initialData]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
      e.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  const handleAnalizar = async () => {
    if (!selectedImage) return;
    setResult(null);
    setLoading(true);
    try {
      // 🛡️ Si no hay mascota elegida, mandamos "GENERIC" en lugar de un string vacío
      const petId = selectedPet || "GENERIC";

      const res = await api.analizarTriaje(selectedImage, activeTab, petId);

      if (res.data.error === "NO_DETECTADO") {
        Swal.fire({
          title: 'Imagen no reconocida',
          text: `MascotAI no detectó evidencia de "${activeTab}"...`,
          icon: 'warning',
          confirmButtonColor: '#ef4444',
          confirmButtonText: 'Reintentar'
        });
        return;
      }

      setResult(res.data);
      if (onScanComplete) onScanComplete();

    } catch (e) {
      console.error("Error en triaje:", e);
      Toast.fire({ icon: 'error', title: 'Error en el análisis' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 w-full">
      {!result ? (
        <div className="space-y-6 text-left w-full">
          {/* SECCIÓN DE ENTRADA (Mantenida igual) */}
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3"><User size={14} /> Paciente</label>
            <select value={selectedPet} onChange={(e) => setSelectedPet(e.target.value)} className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50/50 font-bold outline-none text-slate-700 focus:border-red-500">
              <option value="">Análisis Genérico (No sé quién fue)</option>
              {mascotas.map((p: any) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">¿Qué necesitas analizar?</p>
            <div className="grid grid-cols-2 gap-2">
              {["MATERIA FECAL", "HERIDAS", "VÓMITOS", "PIEL/OJOS"].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`py-4 rounded-2xl font-black text-[10px] transition-all ${activeTab === tab ? 'bg-red-600 text-white shadow-lg' : 'bg-red-50/50 text-red-800'}`}>{tab}</button>
              ))}
            </div>
          </div>

          <div onClick={() => cameraInputRef.current?.click()} className="bg-white h-64 border-4 border-dashed border-red-100 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer relative overflow-hidden shadow-inner">
            {selectedImage ? (
              <><img src={selectedImage} alt="Preview" className="w-full h-full object-cover" /><button onClick={(e) => { e.stopPropagation(); setSelectedImage(null) }} className="absolute top-4 right-4 bg-white/90 p-2 rounded-full text-red-600 z-10"><X size={20} /></button></>
            ) : (
              <div className="text-center"><div className="bg-red-50 p-5 rounded-full mb-4 inline-block"><Activity size={40} className="text-red-200" /></div><p className="text-red-900/40 font-black uppercase text-[10px] px-6">Capturá el signo de malestar</p></div>
            )}
          </div>

          <button type="button" onClick={() => galleryInputRef.current?.click()} className="w-full py-3 rounded-2xl font-black text-xs uppercase bg-slate-100 text-slate-500 border-2 border-slate-200 flex items-center justify-center gap-2 active:scale-95 transition-all"><ImageIcon size={16} /> O cargar desde galería</button>

          <button onClick={handleAnalizar} disabled={loading || !selectedImage} className={`w-full flex items-center justify-center gap-3 py-6 rounded-[2rem] font-black text-xl shadow-xl transition-all active:scale-95 ${loading || !selectedImage ? 'bg-red-50 text-red-200' : 'bg-red-600 text-white shadow-red-200'}`}>{loading ? <Loader2 className="animate-spin" /> : <><Sparkles size={22} /> ANALIZAR AHORA</>}</button>

          <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFile} />
          <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" onChange={handleFile} />
        </div>
      ) : (
        <div className="space-y-6 w-full">
          {/* ✅ VISTA DE RESULTADO: Se activa si 'result' tiene datos */}
          <MedicalReport data={result} />

          <button
            onClick={() => { setResult(null); setSelectedImage(null) }}
            className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95"
          >
            NUEVA CONSULTA
          </button>
        </div>
      )}
    </div>
  );
};

export default SymptomScanner;