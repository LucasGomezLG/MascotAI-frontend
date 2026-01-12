import React, { useState, useEffect } from 'react';
import { Camera as CameraIcon, Loader2, User, RefreshCw, Sparkles, X, Image as ImageIcon, Activity } from 'lucide-react';
import { api } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext'; // 🛡️ Importamos el contexto
import { Toast } from '../../../utils/alerts';
import MedicalReport from './MedicalReport';
import Swal from 'sweetalert2';

// 🛡️ IMPORTACIONES NATIVAS
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { useCameraPermissions } from '../../../hooks/useCameraPermissions';

const SymptomScanner = ({ mascotas, initialData, onScanComplete, handleSuscripcion }: any) => {
  const { user, refreshUser } = useAuth(); // 🛡️ Obtenemos datos y función de refresco
  const [selectedPet, setSelectedPet] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSuscripcion, setLoadingSuscripcion] = useState(false);
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

  // 🛡️ MODAL DE DONACIÓN (Integrado)
  const ejecutarFlujoDonacion = () => {
    Swal.fire({
      title: '¿Quieres colaborar?',
      text: "Ingresa el monto que desees donar para mantener MascotAI",
      input: 'number',
      inputLabel: 'Monto en AR$',
      inputValue: 5000,
      inputAttributes: { min: '100', max: '500000', step: '1' },
      showCancelButton: true,
      confirmButtonColor: '#f97316',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Donar',
      cancelButtonText: 'Ahora no',
      reverseButtons: true,
      inputValidator: (value) => {
        if (!value) return 'Debes ingresar un monto';
        const amount = parseInt(value);
        if (amount < 100) return 'El monto mínimo es $100';
        if (amount > 500000) return 'El monto máximo permitido es $500.000';
      },
      customClass: { popup: 'rounded-[2rem]' }
    }).then(async (result) => {
      if (result.isConfirmed) {
        const montoElegido = result.value;
        setLoadingSuscripcion(true);
        try {
          const response = await api.crearSuscripcion(montoElegido);
          window.location.href = response.data.url;
        } catch (error) {
          Swal.fire('Error', 'No se pudo generar el link de pago.', 'error');
        } finally {
          setLoadingSuscripcion(false);
        }
      }
    });
  };

  // 🛡️ MODAL DE LÍMITE AGOTADO
  const mostrarModalLimite = () => {
    Swal.fire({
      title: '¡Energía de IA Agotada! ⚡',
      text: 'Has alcanzado el límite de 10 escaneos gratuitos este mes. Colaborá para tener análisis ilimitados y seguir cuidando a tu mascota.',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Ser Colaborador ❤️',
      cancelButtonText: 'Más tarde',
      confirmButtonColor: '#f97316',
      cancelButtonColor: '#94a3b8',
      reverseButtons: true,
      customClass: { popup: 'rounded-[2.5rem]' }
    }).then((res) => {
      if (res.isConfirmed) {
        ejecutarFlujoDonacion();
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
      const petId = selectedPet || "GENERIC";
      const res = await api.analizarTriaje(selectedImage, activeTab, petId);

      // ✅ ACTUALIZACIÓN DE CRÉDITOS EN EL HEADER
      await refreshUser();

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
    } catch (e: any) {
      if (e.response?.status === 403 || e.toString().includes("LIMITE_IA_ALCANZADO")) {
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
              <option value="">Análisis Genérico (No sé quién fue)</option>
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
    </div>
  );
};

export default SymptomScanner;