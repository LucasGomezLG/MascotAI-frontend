import React, { useState, useEffect } from 'react';
import {
  Camera as CameraIcon, Loader2, User, RefreshCw, Sparkles, X,
  FileText, ClipboardList, Stethoscope, Calendar, DollarSign,
  Image as ImageIcon // ✅ Corregido el import de Lucide
} from 'lucide-react';
import { api } from '../../../services/api';
import { Toast } from '../../../utils/alerts';
import Swal from 'sweetalert2';

// 🛡️ IMPORTACIONES NATIVAS
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { useCameraPermissions } from '../../../hooks/useCameraPermissions';

const ConsultationScanner = ({ mascotas, onScanComplete, initialData }: any) => {
  const [selectedPet, setSelectedPet] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  // 🛡️ HOOK DE PERMISOS (Funciones separadas)
  const { validarCamara, validarGaleria } = useCameraPermissions();

  // 🛡️ Obtener fecha de hoy para validaciones
  const hoy = new Date().toISOString().split("T")[0];

  // 📸 FUNCIÓN NATIVA: CÁMARA (Solo permiso de cámara)
  const handleNativeCamera = async () => {
    const ok = await validarCamara();
    if (!ok) return;

    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera // Fuerza el uso de la lente física
      });

      if (image.base64String) {
        setSelectedImage(`data:image/jpeg;base64,${image.base64String}`);
        setEditData(null);
      }
    } catch (error) {
      console.log("Cámara cancelada");
    }
  };

  // 🖼️ FUNCIÓN NATIVA: GALERÍA (Solo permiso de fotos)
  const handleNativeGallery = async () => {
    const ok = await validarGaleria();
    if (!ok) return;

    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos // Abre el carrete de fotos
      });

      if (image.base64String) {
        setSelectedImage(`data:image/jpeg;base64,${image.base64String}`);
        setEditData(null);
      }
    } catch (error) {
      console.log("Galería cancelada");
    }
  };

  const handleScanDoc = async () => {
    if (!selectedPet) {
      Toast.fire({ icon: 'warning', title: '¡Identificá al Paciente!' });
      return;
    }
    if (!selectedImage) return;

    setLoading(true);
    try {
      const res = await api.analizarVet(selectedImage, "CONSULTA", selectedPet);

      if (res.data.error === "NO_ES_RECETA") {
        Swal.fire({
          title: 'Documento no reconocido',
          text: 'Intentá que se vea el sello o la firma del veterinario con más luz.',
          icon: 'error',
          confirmButtonColor: '#2563eb'
        });
        setSelectedImage(null);
        return;
      }

      const infoIA = res.data.datos || {};
      setEditData({
        doctor: infoIA.veterinario || "",
        clinica: infoIA.clinica || "",
        fecha: infoIA.fecha || hoy,
        diagnostico: infoIA.diagnostico || "",
        medicamentos: [],
        precio: 0,
        mascotaId: selectedPet,
        consultaId: res.data.consultaId
      });

    } catch (e) {
      Toast.fire({ icon: 'error', title: 'Error al leer el documento' });
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarConsulta = async () => {
    if (!editData.diagnostico.trim()) {
      Swal.fire({ text: 'El diagnóstico o motivo es obligatorio.', icon: 'warning' });
      return;
    }

    if (editData.fecha > hoy) {
      Swal.fire({ text: 'La fecha de consulta no puede ser futura.', icon: 'error' });
      return;
    }

    if (editData.precio < 0 || editData.precio > 999999) {
      Swal.fire({ text: 'Por favor, ingresá un costo válido (máx 6 cifras).', icon: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const dataParaEnviar = {
        id: editData.consultaId,
        mascotaId: editData.mascotaId,
        tipo: "CONSULTA",
        veterinario: editData.doctor,
        clinica: editData.clinica,
        diagnostico: editData.diagnostico,
        nombre: editData.diagnostico.length > 40
          ? editData.diagnostico.substring(0, 37) + "..."
          : editData.diagnostico,
        precio: editData.precio || 0,
        fecha: editData.fecha.includes('T') ? editData.fecha : `${editData.fecha}T00:00:00`
      };

      await api.guardarConsultaVet(dataParaEnviar);

      Swal.fire({
        title: '¡Consulta Guardada!',
        text: 'El historial de salud ha sido actualizado.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });

      setEditData(null);
      setSelectedImage(null);
      if (onScanComplete) onScanComplete();
    } catch (e) {
      Swal.fire({ title: 'Error', text: 'No pudimos registrar la consulta.', icon: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (initialData && (initialData.esDocumentoMedico || initialData.diagnostico)) {
      setEditData({
        doctor: initialData.veterinario || "",
        clinica: initialData.clinica || "",
        fecha: initialData.fecha ? initialData.fecha.split('T')[0] : hoy,
        diagnostico: initialData.diagnostico || "",
        precio: initialData.precio || 0,
        mascotaId: initialData.mascotaId || "",
        consultaId: initialData.id
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
              {mascotas.map((p: any) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>

          <div
            onClick={handleNativeCamera} // 📸 Abre la cámara directamente
            className="bg-white h-64 border-4 border-dashed border-blue-100 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer relative overflow-hidden shadow-inner group transition-all active:scale-[0.98]"
          >
            {selectedImage ? (
              <>
                <img src={selectedImage} alt="Doc Preview" className="w-full h-full object-cover" />
                <button onClick={(e) => { e.stopPropagation(); setSelectedImage(null) }} className="absolute top-4 right-4 bg-white/90 p-2 rounded-full text-blue-600 z-10 shadow-md">
                  <X size={20} />
                </button>
                <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <RefreshCw className="text-white mb-2" />
                   <span className="text-white font-black text-xs uppercase">Capturar de Nuevo</span>
                </div>
              </>
            ) : (
              <div className="text-center px-6">
                <div className="bg-blue-50 p-5 rounded-full mb-4 inline-block text-blue-200">
                  <FileText size={40} />
                </div>
                <p className="text-blue-900/40 font-black uppercase text-[10px] tracking-widest leading-tight">Capturar Receta (Cámara)</p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleNativeGallery} // 🖼️ Abre la galería directamente
            className="w-full py-3 rounded-2xl font-black text-xs uppercase bg-slate-100 text-slate-500 border-2 border-slate-200 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <ImageIcon size={16} /> Cargar desde Galería
          </button>

          <button
            onClick={handleScanDoc}
            disabled={loading || !selectedImage}
            className={`w-full flex items-center justify-center gap-3 py-6 rounded-[2rem] font-black text-xl shadow-xl transition-all active:scale-95 ${loading || !selectedImage ? 'bg-blue-50 text-blue-200' : 'bg-blue-600 text-white shadow-blue-200'}`}
          >
            {loading ? <Loader2 className="animate-spin" /> : <><Sparkles size={22} className="text-blue-200" /> PROCESAR</>}
          </button>
        </div>
      ) : (
        <div className="space-y-6 w-full animate-in zoom-in-95 duration-500">
          {/* ... Vista de edición (Mantenida idéntica a tu código) ... */}
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
                  <input
                    type="text"
                    className="w-full bg-transparent text-xs font-black text-slate-700 outline-none"
                    value={editData.doctor}
                    onChange={(e) => setEditData({ ...editData, doctor: e.target.value })}
                  />
                </div>
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Clínica</p>
                  <input
                    type="text"
                    className="w-full bg-transparent text-xs font-black text-slate-700 outline-none"
                    value={editData.clinica}
                    onChange={(e) => setEditData({ ...editData, clinica: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50/50 p-4 rounded-3xl border border-blue-100">
                  <p className="text-[9px] font-black text-blue-600 uppercase mb-1">Fecha</p>
                  <input
                    type="date"
                    max={hoy}
                    className="w-full bg-transparent text-xs font-black text-slate-700 outline-none"
                    value={editData.fecha}
                    onChange={(e) => setEditData({ ...editData, fecha: e.target.value })}
                  />
                </div>
                <div className="bg-emerald-50/50 p-4 rounded-3xl border border-emerald-100">
                  <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">Costo ($)</p>
                  <input
                    type="number"
                    className="w-full bg-transparent text-xs font-black text-emerald-700 outline-none"
                    value={editData.precio}
                    onChange={(e) => e.target.value.length <= 6 && setEditData({ ...editData, precio: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Diagnóstico</p>
                <textarea
                  className="w-full bg-transparent text-sm font-bold text-slate-600 italic outline-none resize-none"
                  rows={3}
                  value={editData.diagnostico}
                  onChange={(e) => setEditData({ ...editData, diagnostico: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-8">
              <button onClick={() => { setEditData(null); setSelectedImage(null); }} className="flex-1 py-5 bg-slate-100 text-slate-400 rounded-[2rem] font-black uppercase text-xs active:scale-95 transition-all">Descartar</button>
              <button onClick={handleGuardarConsulta} disabled={loading} className="flex-[2] py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all">
                {loading ? <Loader2 className="animate-spin" /> : "REGISTRAR"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultationScanner;