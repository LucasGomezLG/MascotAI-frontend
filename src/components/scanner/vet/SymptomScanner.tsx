import React, { useState, useEffect } from 'react';
import { Camera as CameraIcon, Loader2, User, RefreshCw, Sparkles, X, Image as ImageIcon, Activity } from 'lucide-react';
import { api } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext'; // 🛡️ Importamos el contexto
import { Toast } from '../../../utils/alerts';
import MedicalReport from './MedicalReport';
import Swal from 'sweetalert2';
import SubscriptionCard from '../../../services/SuscriptionCard';

// 🛡️ IMPORTACIONES NATIVAS
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { useCameraPermissions } from '../../../hooks/useCameraPermissions';

const SymptomScanner = ({ mascotas, initialData, onScanComplete }: any) => {
  const { user, refreshUser } = useAuth(); // 🛡️ Obtenemos datos y función de refresco
  const [selectedPet, setSelectedPet] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("MATERIA FECAL");

  const { validarCamara, validarGaleria } = useCameraPermissions();
  
  // 🛡️ Cálculo de energía
  const restantes = Math.max(0, 10 - (user?.intentosIA || 0));
  const tieneEnergia = user?.esColaborador || restantes > 0;

  useEffect(() => {
    if (initialData && !initialData.esDocumentoMedico) {
      setResult(initialData);
      if (initialData.mascotaId) {
        setSelectedPet(initialData.mascotaId);
      }
    }
  }, [initialData]);

  // 🛡️ MODAL DE LÍMITE AGOTADO
  const mostrarModalLimite = () => {
    Swal.fire({
      title: '¡Límite alcanzado!',
      text: 'Usaste tus 10 escaneos del mes. Colaborá para tener acceso ilimitado y ayudarnos con los servidores.',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'SER COLABORADOR ⚡',
      cancelButtonText: 'Luego',
      confirmButtonColor: '#f97316',
    }).then((res) => {
      if (res.isConfirmed) {
        setShowSubscriptionModal(true);
      }
    });
  };

  const handleNativeCamera = async () => {
    const ok = await validarCamara();
    if (!ok) return;
    try {
      const image = await Camera.getPhoto({
        quality: 90, allowEditing: false, resultType: CameraResultType.Base64, source: CameraSource.Camera
      });
      if (image.base64String) {
        setSelectedImage(`data:image/jpeg;base64,${image.base64String}`);
        setResult(null);
      }
    } catch (error) { console.log("Captura cancelada"); }
  };

  const handleNativeGallery = async () => {
    const ok = await validarGaleria();
    if (!ok) return;
    try {
      const image = await Camera.getPhoto({
        quality: 90, allowEditing: false, resultType: CameraResultType.Base64, source: CameraSource.Photos
      });
      if (image.base64String) {
        setSelectedImage(`data:image/jpeg;base64,${image.base64String}`);
        setResult(null);
      }
    } catch (error) { console.log("Selección cancelada"); }
  };

  const handleAnalizar = async () => {
    // 🛡️ VALIDACIÓN DE CRÉDITOS AL TOCAR EL BOTÓN
    if (!tieneEnergia) {
      mostrarModalLimite();
      return;
    }

    if (!selectedImage) return;
    setResult(null);
    setLoading(true);
    try {
      const res = await api.analizarTriaje(selectedImage, activeTab, selectedPet || "GENERIC");

      // ✅ ACTUALIZACIÓN DE CRÉDITOS EN EL HEADER
      await refreshUser();

      const dataIA: any = res.data;
      if (dataIA?.error === "NO_DETECTADO") {
        Swal.fire({
          title: 'Imagen no reconocida',
          text: `MascotAI no detectó evidencia de "${activeTab}"...`,
          icon: 'warning',
          confirmButtonColor: '#ef4444',
          confirmButtonText: 'Reintentar'
        });
        return;
      }
      setResult(dataIA);
      if (onScanComplete) onScanComplete();
    } catch (e: any) {
      const errorMsg = e.response?.data?.error || "";
      if (e.response?.status === 403 || errorMsg.includes("LIMITE")) {
        mostrarModalLimite();
      } else {
        Toast.fire({ icon: 'error', title: 'Error en el análisis' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 w-full">
      {!result ? (
        <div className="space-y-6 text-left w-full">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
              <User size={14} /> Paciente
            </label>
            <select 
              value={selectedPet} 
              onChange={(e) => setSelectedPet(e.target.value)} 
              className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50/50 font-bold outline-none text-slate-700 focus:border-red-500 transition-all"
            >
              <option value="">No sé quién fue (Análisis Genérico)</option>
              {mascotas.map((p: any) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">¿Qué necesitas analizar?</p>
            <div className="grid grid-cols-2 gap-2">
              {["MATERIA FECAL", "HERIDAS", "VÓMITOS", "PIEL/OJOS"].map((tab) => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)} 
                  className={`py-4 rounded-2xl font-black text-[10px] transition-all active:scale-95 ${activeTab === tab ? 'bg-red-600 text-white shadow-lg' : 'bg-red-50/50 text-red-800'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div 
            onClick={handleNativeCamera} 
            className="bg-white h-64 border-4 border-dashed border-red-100 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer relative overflow-hidden shadow-inner group transition-all active:scale-[0.98]"
          >
            {selectedImage ? (
              <>
                <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                <button onClick={(e) => { e.stopPropagation(); setSelectedImage(null) }} className="absolute top-4 right-4 bg-white/90 p-2 rounded-full text-red-600 shadow-md z-10">
                  <X size={20} />
                </button>
              </>
            ) : (
              <div className="text-center">
                <div className="bg-red-50 p-5 rounded-full mb-4 inline-block shadow-sm text-red-200">
                  <Activity size={40} />
                </div>
                <p className="text-red-900/40 font-black uppercase text-[10px] px-6 tracking-widest leading-tight">Capturar Signo (Cámara)</p>
              </div>
            )}
          </div>

          <button 
            type="button" 
            onClick={handleNativeGallery} 
            className="w-full py-3 rounded-2xl font-black text-xs uppercase bg-slate-100 text-slate-500 border-2 border-slate-200 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <ImageIcon size={16} /> O cargar desde galería
          </button>

          <button 
            onClick={handleAnalizar} 
            disabled={loading || !selectedImage} 
            className={`w-full flex items-center justify-center gap-3 py-6 rounded-[2rem] font-black text-xl shadow-xl transition-all active:scale-95 ${
              loading || !selectedImage 
                ? 'bg-red-100 text-red-300 cursor-not-allowed shadow-none' 
                : 'bg-red-600 text-white shadow-red-200 hover:bg-red-700'
            }`}
          >
            {loading ? <Loader2 className="animate-spin" /> : <><Sparkles size={22} className={selectedImage ? "text-red-200" : "text-red-300"} /> ESCANEAR AHORA</>}
          </button>
        </div>
      ) : (
        <div className="space-y-6 w-full">
          <MedicalReport data={result} />
          <button
            onClick={() => { setResult(null); setSelectedImage(null) }}
            className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95"
          >
            NUEVA CONSULTA
          </button>
        </div>
      )}

      {/* MODAL DE SUSCRIPCIÓN */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
          <div className="bg-white rounded-[2rem] p-6 max-w-sm w-full relative">
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

export default SymptomScanner;