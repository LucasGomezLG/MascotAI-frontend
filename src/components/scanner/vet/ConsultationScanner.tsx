import React, { useState, useRef } from 'react';
import {
  Camera, Loader2, User, RefreshCw, Sparkles, X,
  Image as ImageIcon, FileText, ClipboardList,
  Stethoscope, Calendar, Pill, MapPin, DollarSign, CheckCircle2
} from 'lucide-react';
import { api } from '../../../services/api';
import { Toast } from '../../../utils/alerts';
import Swal from 'sweetalert2';

const ConsultationScanner = ({ mascotas, onScanComplete }: any) => {
  const [selectedPet, setSelectedPet] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  
  // 🛡️ Obtener fecha de hoy para validaciones
  const hoy = new Date().toISOString().split("T")[0];

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 🛡️ BLINDAJE: Límite de 10MB para fotos de alta resolución
    if (file.size > 10 * 1024 * 1024) {
      Swal.fire({
        title: 'Documento muy pesado',
        text: 'El límite es 10MB para asegurar un procesamiento rápido.',
        icon: 'warning',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    setEditData(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
      e.target.value = "";
    };
    reader.readAsDataURL(file);
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
    // 🛡️ VALIDACIONES MANUALES ANTES DE GUARDAR
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
        veterinario: editData.doctor,
        clinica: editData.clinica,
        diagnostico: editData.diagnostico,
        nombre: editData.diagnostico,
        precio: editData.precio,
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

  return (
    <div className="animate-in fade-in duration-500 w-full">
      {!editData ? (
        <div className="space-y-6 text-left w-full">
          {/* Selector de Mascota */}
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

          {/* Recuadro de Captura */}
          <div
            onClick={() => cameraInputRef.current?.click()}
            className="bg-white h-64 border-4 border-dashed border-blue-100 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer relative overflow-hidden shadow-inner"
          >
            {selectedImage ? (
              <>
                <img src={selectedImage} alt="Doc Preview" className="w-full h-full object-cover" />
                <button onClick={(e) => { e.stopPropagation(); setSelectedImage(null) }} className="absolute top-4 right-4 bg-white/90 p-2 rounded-full text-blue-600 z-10 shadow-md"><X size={20} /></button>
              </>
            ) : (
              <div className="text-center px-6">
                <div className="bg-blue-50 p-5 rounded-full mb-4 inline-block text-blue-200">
                  <FileText size={40} />
                </div>
                <p className="text-blue-900/40 font-black uppercase text-[10px] tracking-widest leading-tight">Escaneá la receta</p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="w-full py-3 rounded-2xl font-black text-xs uppercase bg-slate-100 text-slate-500 border-2 border-slate-200 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <ImageIcon size={16} /> Cargar de galería
          </button>

          <button
            onClick={handleScanDoc}
            disabled={loading || !selectedImage}
            className={`w-full flex items-center justify-center gap-3 py-6 rounded-[2rem] font-black text-xl shadow-xl transition-all active:scale-95 ${loading || !selectedImage ? 'bg-blue-50 text-blue-200' : 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700'}`}
          >
            {loading ? <Loader2 className="animate-spin" /> : <><Sparkles size={22} className="text-blue-200" /> PROCESAR</>}
          </button>

          <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFile} />
          <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" onChange={handleFile} />
        </div>
      ) : (
        /* VISTA DE EDICIÓN CON BLINDAJES */
        <div className="space-y-6 w-full animate-in zoom-in-95 duration-500">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border-2 border-blue-50 text-left relative overflow-hidden">
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-blue-100 p-4 rounded-3xl text-blue-600"><ClipboardList size={28} /></div>
              <div>
                <h3 className="font-black text-slate-800 text-2xl tracking-tighter leading-none">Confirmar Datos</h3>
                <p className="text-blue-500 font-bold text-[10px] uppercase mt-1 tracking-widest italic">Verificá la información</p>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1"><Stethoscope size={10} /> Veterinario</p>
                  <input
                    type="text"
                    maxLength={50} // 🛡️ Blindaje estético
                    className="w-full bg-transparent text-xs font-black text-slate-700 outline-none focus:border-blue-300"
                    value={editData.doctor}
                    onChange={(e) => setEditData({ ...editData, doctor: e.target.value })}
                  />
                </div>
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1"><MapPin size={10} /> Clínica</p>
                  <input
                    type="text"
                    maxLength={50} // 🛡️ Blindaje estético
                    className="w-full bg-transparent text-xs font-black text-slate-700 outline-none focus:border-blue-300"
                    value={editData.clinica}
                    onChange={(e) => setEditData({ ...editData, clinica: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50/50 p-4 rounded-3xl border border-blue-100">
                  <p className="text-[9px] font-black text-blue-600 uppercase mb-1 flex items-center gap-1"><Calendar size={10} /> Fecha</p>
                  <input
                    type="date"
                    max={hoy} // 🛡️ No permitir fechas futuras
                    className="w-full bg-transparent text-xs font-black text-slate-700 outline-none"
                    value={editData.fecha}
                    onChange={(e) => setEditData({ ...editData, fecha: e.target.value })}
                  />
                </div>
                <div className="bg-emerald-50/50 p-4 rounded-3xl border border-emerald-100">
                  <p className="text-[9px] font-black text-emerald-600 uppercase mb-1 flex items-center gap-1"><DollarSign size={10} /> Costo ($)</p>
                  <input
                    type="number"
                    className="w-full bg-transparent text-xs font-black text-emerald-700 outline-none"
                    value={editData.precio}
                    onChange={(e) => {
                      if (e.target.value.length <= 6) setEditData({ ...editData, precio: parseFloat(e.target.value) || 0 });
                    }} // 🛡️ Máximo 6 cifras
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Diagnóstico / Motivo</p>
                <textarea
                  maxLength={500} // 🛡️ Evitar textos infinitos
                  className="w-full bg-transparent text-sm font-bold text-slate-600 italic outline-none focus:border-blue-200 resize-none"
                  rows={3}
                  value={editData.diagnostico}
                  onChange={(e) => setEditData({ ...editData, diagnostico: e.target.value })}
                />
                <p className="text-[8px] text-right text-slate-300 font-bold">{editData.diagnostico.length}/500</p>
              </div>
            </div>

            <div className="flex gap-2 mt-8">
              <button
                onClick={() => { setEditData(null); setSelectedImage(null); }}
                className="flex-1 py-5 bg-slate-100 text-slate-400 rounded-[2rem] font-black uppercase text-xs"
              >
                Descartar
              </button>
              <button
                onClick={handleGuardarConsulta}
                disabled={loading}
                className="flex-[2] py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95"
              >
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