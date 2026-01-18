import React, {useEffect, useState} from 'react';
import {ClipboardList, FileText, Image as ImageIcon, Loader2, Sparkles, User, X} from 'lucide-react';
import {api} from '@/services/api';
import {useAuth} from '@/context/AuthContext';
import {Toast} from '@/utils/alerts';
import Swal from 'sweetalert2';
import SubscriptionCard from '@/services/SuscriptionCard';
import {Camera, CameraResultType, CameraSource} from '@capacitor/camera';
import {useCameraPermissions} from '@/hooks/useCameraPermissions';
import type {ConsultaVetDTO, MascotaDTO} from '@/types/api.types';
import {isAxiosError} from 'axios';

interface ConsultationScannerProps {
  mascotas: MascotaDTO[];
  onScanComplete: () => void;
  initialData?: ConsultaVetDTO;
}

const ConsultationScanner = ({ mascotas, onScanComplete, initialData }: ConsultationScannerProps) => {
  const { user, refreshUser } = useAuth();
  const [selectedPet, setSelectedPet] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [editData, setEditData] = useState<Partial<ConsultaVetDTO> | null>(null);

  const { validarCamara, validarGaleria } = useCameraPermissions();
  const hoy = new Date().toISOString().split("T")[0];

  const restantes = Math.max(0, 10 - (user?.intentosIA || 0));
  const tieneEnergia = user?.esColaborador || restantes > 0;

  const mostrarModalLimite = () => {
    void Swal.fire({
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
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });
      if (image.base64String) {
        setSelectedImage(`data:image/jpeg;base64,${image.base64String}`);
        setEditData(null);
      }
    } catch { console.log("Cámara cancelada"); }
  };

  const handleNativeGallery = async () => {
    const ok = await validarGaleria();
    if (!ok) return;
    try {
      const image = await Camera.getPhoto({
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos
      });
      if (image.base64String) {
        setSelectedImage(`data:image/jpeg;base64,${image.base64String}`);
        setEditData(null);
      }
    } catch { console.log("Galería cancelada"); }
  };

  const handleScanDoc = async () => {
    if (!tieneEnergia) {
      mostrarModalLimite();
      return;
    }

    if (!selectedPet) {
      void Toast.fire({ 
        icon: 'warning', 
        title: '¡Identificá al Paciente!', 
        text: 'Por favor, seleccioná una mascota antes de escanear el documento.' 
      });
      return;
    }

    if (!selectedImage) return;

    setLoading(true);
    try {
      const res = await api.analizarVet(selectedImage, selectedPet);
      await refreshUser();

      const infoIA: Partial<ConsultaVetDTO> = res.data || {};
      const rawFecha = infoIA.fecha || hoy;
      const cleanFecha = rawFecha.split('T')[0];

      setEditData({
        veterinario: infoIA.veterinario || "",
        clinica: infoIA.clinica || "",
        fecha: cleanFecha,
        diagnostico: infoIA.diagnostico || "",
        precio: 0, 
        mascotaId: selectedPet, 
        id: infoIA.id || ""
      });
    } catch (e) {
      if (isAxiosError(e)) {
        const errorMsg = (e.response?.data as { error: string })?.error || "";
        if (e.response?.status === 403 || errorMsg.includes("LIMITE")) {
          mostrarModalLimite();
        } else if (errorMsg === "NO_ES_RECETA") {
          void Swal.fire({
            title: 'Documento no reconocido',
            text: 'Intentá que se vea el sello o la firma del veterinario con más luz.',
            icon: 'error',
            confirmButtonColor: '#2563eb'
          });
          setSelectedImage(null);
        } else {
          void Toast.fire({ icon: 'error', title: 'Error al leer el documento' });
        }
      }
    } finally { setLoading(false); }
  };

  const handleGuardarConsulta = async () => {
    if (!editData?.veterinario?.trim()) {
      void Swal.fire({ title: 'Faltan datos', text: 'El nombre del profesional es obligatorio.', icon: 'warning' });
      return;
    }
    if (!editData.clinica?.trim()) {
      void Swal.fire({ title: 'Faltan datos', text: 'El nombre de la clínica es obligatorio.', icon: 'warning' });
      return;
    }
    if (!editData.fecha || editData.fecha === "") {
      void Swal.fire({ title: 'Faltan datos', text: 'La fecha de la consulta es obligatoria.', icon: 'warning' });
      return;
    }
    if (isNaN(new Date(editData.fecha).getTime())) {
      void Swal.fire({ title: 'Fecha inválida', text: 'Ingresá una fecha válida para la consulta.', icon: 'warning' });
      return;
    }
    if (!editData.diagnostico?.trim()) {
      void Swal.fire({ title: 'Faltan datos', text: 'El diagnóstico o motivo es obligatorio.', icon: 'warning' });
      return;
    }
    const precioNum = parseFloat(String(editData.precio));
    if (isNaN(precioNum) || precioNum < 0) {
      void Swal.fire({ title: 'Dato inválido', text: 'Ingresá un costo válido (puede ser 0).', icon: 'warning' });
      return;
    }
    setLoading(true);
    try {
      const dataParaEnviar: Partial<ConsultaVetDTO> = {
        id: editData.id, mascotaId: editData.mascotaId, tipo: "CONSULTA",
        veterinario: editData.veterinario, clinica: editData.clinica, diagnostico: editData.diagnostico,
        nombre: editData.diagnostico.length > 40 ? editData.diagnostico.substring(0, 37) + "..." : editData.diagnostico,
        precio: editData.precio || 0, fecha: editData.fecha.includes('T') ? editData.fecha : `${editData.fecha}T00:00:00`
      };
      await api.guardarConsultaVet(dataParaEnviar as ConsultaVetDTO);
      void Swal.fire({ title: '¡Consulta Guardada!', icon: 'success', timer: 2000, showConfirmButton: false });
      setEditData(null); setSelectedImage(null);
      if (onScanComplete) onScanComplete();
    } catch { void Swal.fire({ title: 'Error', text: 'No pudimos registrar la consulta.', icon: 'error' });
    } finally { setLoading(false); }
  };
  
  useEffect(() => {
    if (initialData && initialData.diagnostico) {
      setEditData({
        veterinario: initialData.veterinario || "", clinica: initialData.clinica || "",
        fecha: initialData.fecha ? initialData.fecha.split('T')[0] : hoy,
        diagnostico: initialData.diagnostico || "", precio: initialData.precio || 0,
        mascotaId: initialData.mascotaId || "", id: initialData.id
      });
      if (initialData.mascotaId) setSelectedPet(initialData.mascotaId);
    }
  }, [initialData, hoy]);
  
  return (
    <div className="animate-in fade-in duration-500 w-full text-left">
      {!editData ? (
        <div className="space-y-6 w-full">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
              <User size={14} /> Paciente
            </label>
            <select
              value={selectedPet}
              onChange={(e) => setSelectedPet(e.target.value)}
              className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50/50 font-bold outline-none text-slate-700 focus:border-blue-500 transition-all"
            >
              <option value="">¿De quién es el documento?</option>
              {mascotas.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>

          <div
            onClick={handleNativeCamera}
            className="bg-white h-64 border-4 border-dashed border-blue-100 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer relative overflow-hidden shadow-inner group transition-all active:scale-[0.98]"
          >
            {selectedImage ? (
              <>
                <img src={selectedImage} alt="Doc Preview" className="w-full h-full object-cover" />
                <button onClick={(e) => { e.stopPropagation(); setSelectedImage(null) }} className="absolute top-4 right-4 bg-white/90 p-2 rounded-full text-blue-600 z-10 shadow-md">
                  <X size={20} />
                </button>
              </>
            ) : (
              <div className="text-center px-6">
                <div className="bg-blue-50 p-5 rounded-full mb-4 inline-block text-blue-200"><FileText size={40} /></div>
                <p className="text-blue-900/40 font-black uppercase text-[10px] tracking-widest leading-tight">Capturar Receta (Cámara)</p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleNativeGallery}
            className="w-full py-3 rounded-2xl font-black text-xs uppercase bg-slate-100 text-slate-500 border-2 border-slate-200 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <ImageIcon size={16} /> Cargar desde Galería
          </button>

          <button
            onClick={handleScanDoc}
            disabled={loading || !selectedImage}
            className={`w-full flex items-center justify-center gap-3 py-6 rounded-4xl font-black text-xl shadow-xl transition-all active:scale-95 ${
              loading || !selectedImage 
                ? 'bg-blue-50 text-blue-200 cursor-not-allowed shadow-none' 
                : 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700'
            }`}
          >
            {loading ? <Loader2 className="animate-spin" /> : <><Sparkles size={22} className={selectedImage ? "text-blue-200" : "text-blue-300"} /> ESCANEAR AHORA</>}
          </button>
        </div>
      ) : (
        <div className="space-y-6 w-full animate-in zoom-in-95 duration-500">
           <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border-2 border-blue-50 text-left relative overflow-hidden">
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-blue-100 p-4 rounded-3xl text-blue-600"><ClipboardList size={28} /></div>
              <div>
                <h3 className="font-black text-slate-800 text-2xl tracking-tighter leading-none">Confirmar Datos</h3>
                <p className="text-blue-500 font-bold text-[10px] uppercase mt-1 tracking-widest italic">Análisis Veterinario</p>
              </div>
            </div>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Veterinario</p>
                  <input type="text" className="w-full bg-transparent text-xs font-black text-slate-700 outline-none" value={editData.veterinario} onChange={(e) => setEditData({ ...editData, veterinario: e.target.value })} />
                </div>
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Clínica</p>
                  <input type="text" className="w-full bg-transparent text-xs font-black text-slate-700 outline-none" value={editData.clinica} onChange={(e) => setEditData({ ...editData, clinica: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50/50 p-4 rounded-3xl border border-blue-100">
                  <p className="text-[9px] font-black text-blue-600 uppercase mb-1">Fecha</p>
                  <input type="date" max={hoy} className="w-full bg-transparent text-xs font-black text-slate-700 outline-none" value={editData.fecha} onChange={(e) => setEditData({ ...editData, fecha: e.target.value })} />
                </div>
                <div className="bg-emerald-50/50 p-4 rounded-3xl border border-emerald-100">
                  <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">Costo ($)</p>
                  <input type="number" className="w-full bg-transparent text-xs font-black text-emerald-700 outline-none" value={editData.precio || ''} onChange={(e) => e.target.value.length <= 6 && setEditData({ ...editData, precio: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="bg-slate-50 p-5 rounded-4xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Diagnóstico</p>
                <textarea className="w-full bg-transparent text-sm font-bold text-slate-600 italic outline-none resize-none" rows={3} value={editData.diagnostico} onChange={(e) => setEditData({ ...editData, diagnostico: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2 mt-8">
              <button onClick={() => { setEditData(null); setSelectedImage(null); }} className="flex-1 py-5 bg-slate-100 text-slate-400 rounded-4xl font-black uppercase text-xs active:scale-95 transition-all">Descartar</button>
              <button onClick={handleGuardarConsulta} disabled={loading} className="flex-2 py-5 bg-blue-600 text-white rounded-4xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all">
                {loading ? <Loader2 className="animate-spin" /> : "REGISTRAR"}
              </button>
            </div>
          </div>
        </div>
      )}

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

export default ConsultationScanner;