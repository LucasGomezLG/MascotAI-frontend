import React, {useState} from 'react';
import {
    Camera as CameraIcon,
    ClipboardPlus,
    Image as ImageIcon,
    Info,
    Loader2,
    Sparkles,
    User,
    Wallet,
    X
} from 'lucide-react';
import {api} from '@/services/api';
import {useAuth} from '@/context/AuthContext';
import {Toast} from '@/utils/alerts';
import type {MascotaDTO, RecordatorioSaludDTO} from '@/types/api.types';
import Swal from 'sweetalert2';
import SubscriptionCard from '@/services/SuscriptionCard';
import {Camera, CameraResultType, CameraSource} from '@capacitor/camera';
import {useCameraPermissions} from '@/hooks/useCameraPermissions';
import {isAxiosError} from 'axios';

interface SaludScannerProps {
  mascotas: MascotaDTO[];
  onScanComplete: () => void;
}

// Define the response type from the API
type AnalizarSaludResponse = RecordatorioSaludDTO | { error: string };

// Type guard to check for the error response
function isAnalizarSaludError(data: AnalizarSaludResponse): data is { error: string } {
  return (data as { error: string }).error !== undefined;
}


const SaludScanner = ({ mascotas, onScanComplete }: SaludScannerProps) => {
  const { user, refreshUser } = useAuth();
  const [selectedPet, setSelectedPet] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [editData, setEditData] = useState<Partial<RecordatorioSaludDTO> | null>(null);

  const { validarCamara, validarGaleria } = useCameraPermissions();
  const hoy = new Date().toISOString().split("T")[0];

  const tieneEnergia = user?.esColaborador || (10 - (user?.intentosIA || 0)) > 0;

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
      if (res.isConfirmed) setShowSubscriptionModal(true);
    });
  };

  const handleNativeCamera = async () => {
    const ok = await validarCamara();
    if (!ok) return;
    try {
      const image = await Camera.getPhoto({ resultType: CameraResultType.Base64, source: CameraSource.Camera });
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
      const image = await Camera.getPhoto({ resultType: CameraResultType.Base64, source: CameraSource.Photos });
      if (image.base64String) {
        setSelectedImage(`data:image/jpeg;base64,${image.base64String}`);
        setEditData(null);
      }
    } catch { console.log("Galería cancelada"); }
  };

  const handleAnalizarSalud = async () => {
    if (!tieneEnergia) {
      mostrarModalLimite();
      return;
    }
    if (!selectedPet) {
      void Toast.fire({ icon: 'warning', title: '¡Identificá al Paciente!', text: 'Seleccioná una mascota antes de escanear.' });
      return;
    }
    if (!selectedImage) return;

    setLoading(true);
    try {
      const petIdSeguro: string = selectedPet ?? "";
      const res = await api.analizarSalud(selectedImage, petIdSeguro);
      await refreshUser();

      const responseData = res.data as AnalizarSaludResponse;

      if (isAnalizarSaludError(responseData)) {
        const config = responseData.error === "ESPECIE_INCORRECTA"
          ? { title: '⚠️ ADVERTENCIA', icon: 'warning' as const, color: '#ef4444' }
          : { title: 'No reconocido', icon: 'error' as const, color: '#10b981' };

        void Swal.fire({
          title: config.title,
          text: 'Producto no válido para esta mascota.',
          icon: config.icon,
          confirmButtonColor: config.color
        });
        return;
      }

      const cleanFecha = (f: string | undefined): string => {
        if (!f) return "";
        return f.includes('T') ? f.split('T')[0] : f;
      };

      setEditData({
        id: responseData.id || undefined,
        nombre: responseData.nombre || "Nuevo Registro",
        tipo: responseData.tipo || "MEDICAMENTO",
        fechaAplicacion: cleanFecha(responseData.fechaAplicacion) || hoy,
        proximaFecha: cleanFecha(responseData.proximaFecha) || "",
        precio: responseData.precio || 0,
        notas: responseData.notas || "",
        completado: true,
        mascotaId: petIdSeguro
      });

    } catch (e) {
      if (isAxiosError<{ error: string }>(e)) {
        const serverMsg = e.response?.data?.error || "";
        if (serverMsg.includes("LIMITE")) mostrarModalLimite();
        else void Swal.fire({ title: 'Error', text: 'No se pudo procesar la imagen.', icon: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuardar = async () => {
    if (!selectedPet) return Swal.fire({ text: 'Seleccioná una mascota primero.', icon: 'warning' });
    if (!editData?.nombre?.trim()) return Swal.fire({ text: 'El nombre es obligatorio.', icon: 'warning' });

    const nombreFinal = editData.nombre.trim().substring(0, 50);

    const regexFecha = /^\d{4}-\d{2}-\d{2}$/;
    if (!editData.fechaAplicacion || !regexFecha.test(editData.fechaAplicacion)) {
      return Swal.fire({ text: 'Fecha de aplicación inválida o incompleta.', icon: 'warning' });
    }

    const dApp = new Date(editData.fechaAplicacion);
    dApp.setHours(0, 0, 0, 0);
    const dHoy = new Date();
    dHoy.setHours(0, 0, 0, 0);

    if (dApp > new Date()) {
      return Swal.fire({ text: 'La fecha de aplicación no puede ser futura.', icon: 'warning' });
    }

    if (!editData.proximaFecha || editData.proximaFecha === "") {
      return Swal.fire({ text: 'Debes ingresar una fecha de próximo refuerzo.', icon: 'warning' });
    }

    if (!regexFecha.test(editData.proximaFecha)) {
      return Swal.fire({ text: 'Fecha de próximo refuerzo inválida o incompleta.', icon: 'warning' });
    }

    const dProx = new Date(editData.proximaFecha);
    dProx.setHours(0, 0, 0, 0);

    if (isNaN(dProx.getTime())) {
      return Swal.fire({ text: 'La fecha de refuerzo ingresada no es válida.', icon: 'warning' });
    }

    if (dProx <= dHoy) {
      return Swal.fire({
        text: 'La fecha de próximo refuerzo debe ser a partir de mañana.',
        icon: 'warning'
      });
    }

    if (dProx < dApp) {
      return Swal.fire({
        text: 'La fecha de refuerzo no puede ser anterior a la fecha de aplicación.',
        icon: 'warning'
      });
    }

    setLoading(true);
    try {
      const payload: RecordatorioSaludDTO = {
        id: editData.id || undefined,
        mascotaId: selectedPet,
        tipo: editData.tipo || "MEDICAMENTO",
        nombre: nombreFinal,
        precio: parseFloat(String(editData.precio)) || 0,
        fechaAplicacion: editData.fechaAplicacion,
        proximaFecha: editData.proximaFecha, 
        notas: (editData.notas || "Sin notas").substring(0, 200),
        completado: editData.completado ?? true
      };

      await api.guardarEventoSalud(payload);

      void Swal.fire({ title: '¡Guardado!', text: 'Cartilla actualizada.', icon: 'success', timer: 1500, showConfirmButton: false });

      setEditData(null);
      setSelectedImage(null);
      if (onScanComplete) onScanComplete();

    } catch (e) {
      if (isAxiosError<{ message: string }>(e)) {
        const errorMsg = e.response?.data?.message || "Error de validación en el servidor.";
        void Swal.fire({ title: 'Error al Guardar', text: `El servidor rechazó los datos: ${errorMsg}`, icon: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!editData ? (
        <div className="space-y-6 text-left">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-emerald-100">
            <label className="text-[10px] font-black text-emerald-900 uppercase tracking-widest flex items-center gap-2 mb-3 px-1">
              <User size={14} /> Paciente
            </label>
            <select
              value={selectedPet}
              onChange={(e) => setSelectedPet(e.target.value)}
              className="w-full p-4 rounded-2xl border-2 border-emerald-50 bg-emerald-50/50 font-bold outline-none text-slate-700 focus:border-emerald-500 transition-all appearance-none"
            >
              <option value="">¿Para quién es?</option>
              {mascotas.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>

          <div
            onClick={handleNativeCamera}
            className="bg-white h-72 border-4 border-dashed border-emerald-100 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:border-emerald-300 transition-all active:scale-[0.98] relative overflow-hidden shadow-inner"
          >
            {selectedImage ? (
              <>
                <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                <button onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }} className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-lg text-red-500 z-10">
                  <X size={20} />
                </button>
              </>
            ) : (
              <div className="text-center">
                <div className="bg-emerald-50 p-5 rounded-full mb-4 inline-block text-emerald-300">
                  <CameraIcon size={40} />
                </div>
                <p className="text-emerald-900/40 font-black uppercase text-[10px] tracking-widest">Escanear Receta o Producto</p>
              </div>
            )}
          </div>

          <button onClick={handleNativeGallery} className="w-full py-4 rounded-2xl font-black text-[10px] uppercase bg-slate-100 text-slate-500 border-2 border-slate-200 flex items-center justify-center gap-2 active:scale-95 transition-all">
            <ImageIcon size={16} /> Abrir Galería
          </button>

          <button
            onClick={handleAnalizarSalud}
            disabled={loading || !selectedImage}
            className={`w-full flex items-center justify-center gap-3 py-6 rounded-[2.2rem] font-black text-xl shadow-xl transition-all active:scale-95 ${loading || !selectedImage ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
          >
            {loading ? <Loader2 className="animate-spin" /> : <><Sparkles size={22} /> ANALIZAR CON IA</>}
          </button>

          <div className="mt-10 bg-amber-50/80 border border-amber-200 p-6 rounded-[2.5rem] shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-700">
            <div className="flex items-center gap-3 mb-3 text-left">
              <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
                <Info size={20} />
              </div>
              <h4 className="font-black text-amber-900 uppercase text-xs tracking-widest">
                ¿Cómo funciona esta sección?
              </h4>
            </div>

            <div className="space-y-3 text-left">
              <div className="flex gap-3">
                <div className="mt-1 bg-amber-200/50 h-1.5 w-1.5 rounded-full shrink-0" />
                <p className="text-[11px] font-bold text-amber-800/90 leading-relaxed">
                  <span className="text-amber-900 font-black uppercase text-[9px]">Digitalización de Salud: </span>
                  Escaneá vacunas, pipetas o medicamentos para extraer automáticamente fechas de aplicación y dosis.
                </p>
              </div>

              <div className="flex gap-3">
                <div className="mt-1 bg-amber-200/50 h-1.5 w-1.5 rounded-full shrink-0" />
                <p className="text-[11px] font-bold text-amber-800/90 leading-relaxed">
                  <span className="text-amber-900 font-black uppercase text-[9px]">Alertas de Refuerzo: </span>
                  Calculamos la fecha del próximo refuerzo y te avisamos automáticamente para que tu mascota esté siempre protegida.
                </p>
              </div>

              <div className="flex gap-3">
                <div className="mt-1 bg-amber-200/50 h-1.5 w-1.5 rounded-full shrink-0" />
                <p className="text-[11px] font-bold text-amber-800/90 leading-relaxed">
                  <span className="text-amber-900 font-black uppercase text-[9px]">Cartilla Sanitaria: </span>
                  Guardamos el historial completo de productos aplicados y sus costos, integrándolos a tu presupuesto mensual.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border border-emerald-100 text-left animate-in zoom-in-95">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-600 p-3 rounded-2xl text-white shadow-lg"><ClipboardPlus size={24} /></div>
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none">Veredicto IA</h3>
                <p className="text-emerald-500 font-bold text-[10px] uppercase mt-1 tracking-widest">Revisar y Guardar</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {editData.completado ? 'Aplicado' : 'Pendiente'}
              </span>
              <button
                onClick={() => setEditData({ ...editData, completado: !editData.completado })}
                className={`w-12 h-6 rounded-full transition-all relative ${editData.completado ? 'bg-emerald-500' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${editData.completado ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2 px-1">Nombre del Tratamiento</p>
              <input
                type="text"
                className="w-full bg-transparent font-black text-lg text-slate-800 border-b border-slate-200 focus:border-emerald-500 outline-none pb-1"
                value={editData.nombre || ""}
                onChange={(e) => setEditData({ ...editData, nombre: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50/50 p-4 rounded-3xl border border-emerald-100">
                <p className="text-[9px] font-black text-emerald-600 uppercase mb-2">Aplicación</p>
                <input type="date" className="w-full bg-transparent text-xs font-black text-slate-700 outline-none" value={editData.fechaAplicacion} onChange={(e) => setEditData({ ...editData, fechaAplicacion: e.target.value })} />
              </div>

              <div className="bg-orange-50/50 p-4 rounded-3xl border border-orange-100">
                <p className="text-[9px] font-black text-orange-600 uppercase mb-2">Próximo</p>
                <input type="date" className="w-full bg-transparent text-xs font-black text-slate-700 outline-none" value={editData.proximaFecha} onChange={(e) => setEditData({ ...editData, proximaFecha: e.target.value })} />
              </div>
            </div>

            <div className="bg-blue-50/50 p-5 rounded-3xl border border-blue-100">
              <p className="text-[10px] font-black text-blue-500 uppercase mb-2 flex items-center gap-2 px-1"><Wallet size={12} /> Costo ($)</p>
              <input type="number" className="w-full bg-transparent font-black text-lg text-slate-800 border-b border-slate-200 focus:border-blue-500 outline-none pb-1" value={editData.precio} onChange={(e) => setEditData({ ...editData, precio: Number(e.target.value) })} />
            </div>

            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2 px-1">Notas / Dosis</p>
              <textarea className="w-full bg-transparent text-xs font-bold text-slate-600 outline-none resize-none" rows={3} value={editData.notas} onChange={(e) => setEditData({ ...editData, notas: e.target.value })} />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setEditData(null)} className="flex-1 py-5 bg-slate-100 text-slate-400 rounded-[1.8rem] font-black uppercase text-xs active:scale-95 transition-all">Cancelar</button>
            <button onClick={handleGuardar} disabled={loading} className="flex-2 py-5 bg-emerald-600 text-white rounded-[1.8rem] font-black shadow-xl uppercase text-xs flex items-center justify-center gap-2 active:scale-95 transition-all disabled:bg-slate-300">
              {loading ? <Loader2 className="animate-spin" /> : "CONFIRMAR REGISTRO"}
            </button>
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

export default SaludScanner;