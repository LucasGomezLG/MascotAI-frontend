import React, { useState, useRef } from 'react';
import {
  Camera, Loader2, User, RefreshCw, Sparkles, X,
  Image as ImageIcon, FileText, ClipboardList,
  Stethoscope, Calendar, Pill, MapPin, DollarSign, CheckCircle2
} from 'lucide-react';
import { api } from '../../../services/api';
import { Toast } from '../../../utils/alerts';

const ConsultationScanner = ({ mascotas, onScanComplete }: any) => {
  const [selectedPet, setSelectedPet] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // ✅ Nuevo estado para manejar la edición de los datos detectados
  const [editData, setEditData] = useState<any>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
      Toast.fire({
        icon: 'warning',
        title: '¡Identificá al Paciente!',
        text: 'La receta debe estar vinculada a una mascota para guardarla.'
      });
      return;
    }

    if (!selectedImage) return;

    setLoading(true);
    try {
      const res = await api.analizarVet(selectedImage, "CONSULTA", selectedPet);

      // ✅ Inicializamos el estado de edición con lo que encontró la IA
      setEditData({
        doctor: res.data.doctor || "",
        clinica: res.data.clinica || "",
        // Formateamos fecha para input type="date" (YYYY-MM-DD)
        fecha: res.data.fecha ? new Date(res.data.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        diagnostico: res.data.diagnostico || res.data.observaciones || "",
        medicamentos: Array.isArray(res.data.medicamentos) ? res.data.medicamentos : [],
        precio: res.data.precio || 0,
        mascotaId: selectedPet
      });

    } catch (e) {
      Toast.fire({ icon: 'error', title: 'Error al leer el documento' });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Nueva función para persistir los cambios en la base de datos
  const handleGuardarConsulta = async () => {
    setLoading(true);
    try {
      await api.guardarConsultaVet(editData);
      Toast.fire({ 
        icon: 'success', 
        title: '¡Consulta Guardada!', 
        text: 'Los datos se sincronizaron con el historial.' 
      });
      setEditData(null);
      setSelectedImage(null);
      if (onScanComplete) onScanComplete();
    } catch (e) {
      Toast.fire({ icon: 'error', title: 'No se pudo guardar la consulta' });
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
                <div className="absolute inset-0 bg-blue-900/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                  <RefreshCw className="text-white" />
                </div>
              </>
            ) : (
              <div className="text-center group-hover:scale-105 transition-transform px-6">
                <div className="bg-blue-50 p-5 rounded-full mb-4 inline-block text-blue-200">
                  <FileText size={40} />
                </div>
                <p className="text-blue-900/40 font-black uppercase text-[10px] tracking-widest leading-tight">Escaneá la receta o <br />factura médica</p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="w-full py-3 rounded-2xl font-black text-xs uppercase bg-slate-100 text-slate-500 border-2 border-slate-200 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <ImageIcon size={16} /> O cargar desde galería
          </button>

          <button
            onClick={handleScanDoc}
            disabled={loading || !selectedImage}
            className={`w-full flex items-center justify-center gap-3 py-6 rounded-[2rem] font-black text-xl shadow-xl transition-all active:scale-95 ${loading || !selectedImage ? 'bg-blue-50 text-blue-200' : 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700'}`}
          >
            {loading ? <Loader2 className="animate-spin" /> : <><Sparkles size={22} className="text-blue-200" /> PROCESAR DOCUMENTO</>}
          </button>

          <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFile} />
          <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" onChange={handleFile} />
        </div>
      ) : (
        /* ✅ VISTA DE EDICIÓN (CORREGIDA PARA COMPLETAR A MANO) */
        <div className="space-y-6 w-full animate-in zoom-in-95 duration-500">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border-2 border-blue-50 text-left relative overflow-hidden">
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-blue-100 p-4 rounded-3xl text-blue-600"><ClipboardList size={28} /></div>
              <div>
                <h3 className="font-black text-slate-800 text-2xl tracking-tighter leading-none">Confirmar Datos</h3>
                <p className="text-blue-500 font-bold text-[10px] uppercase mt-1 tracking-widest italic">Completá lo que falte</p>
              </div>
            </div>

            <div className="grid gap-4">
              {/* Profesional y Clínica */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1"><Stethoscope size={10} /> Veterinario</p>
                  <input 
                    type="text" 
                    className="w-full bg-transparent text-xs font-black text-slate-700 outline-none border-b border-transparent focus:border-blue-300" 
                    value={editData.doctor} 
                    onChange={(e) => setEditData({...editData, doctor: e.target.value})}
                    placeholder="Nombre del médico"
                  />
                </div>
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1"><MapPin size={10} /> Clínica</p>
                  <input 
                    type="text" 
                    className="w-full bg-transparent text-xs font-black text-slate-700 outline-none border-b border-transparent focus:border-blue-300" 
                    value={editData.clinica} 
                    onChange={(e) => setEditData({...editData, clinica: e.target.value})}
                    placeholder="Lugar"
                  />
                </div>
              </div>

              {/* Fecha e Inversión */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50/50 p-4 rounded-3xl border border-blue-100">
                  <p className="text-[9px] font-black text-blue-600 uppercase mb-1 flex items-center gap-1"><Calendar size={10} /> Fecha</p>
                  <input 
                    type="date" 
                    className="w-full bg-transparent text-xs font-black text-slate-700 outline-none" 
                    value={editData.fecha} 
                    onChange={(e) => setEditData({...editData, fecha: e.target.value})}
                  />
                </div>
                <div className="bg-emerald-50/50 p-4 rounded-3xl border border-emerald-100">
                  <p className="text-[9px] font-black text-emerald-600 uppercase mb-1 flex items-center gap-1"><DollarSign size={10} /> Costo ($)</p>
                  <input 
                    type="number" 
                    className="w-full bg-transparent text-xs font-black text-emerald-700 outline-none" 
                    value={editData.precio} 
                    onChange={(e) => setEditData({...editData, precio: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>

              {/* Diagnóstico */}
              <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Diagnóstico / Motivo</p>
                <textarea 
                    className="w-full bg-transparent text-sm font-bold text-slate-600 italic leading-relaxed outline-none border-b border-transparent focus:border-blue-200 resize-none" 
                    rows={3}
                    value={editData.diagnostico} 
                    onChange={(e) => setEditData({...editData, diagnostico: e.target.value})}
                    placeholder="Escribí aquí el detalle de la consulta..."
                />
              </div>

              {/* Medicamentos (Visualización simple) */}
              {editData.medicamentos.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Medicación Detectada:</p>
                  {editData.medicamentos.map((med: string, i: number) => (
                    <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-3 shadow-sm">
                      <div className="bg-blue-50 text-blue-500 p-2 rounded-xl"><Pill size={14} /></div>
                      <p className="text-xs font-black text-slate-700">{med}</p>
                    </div>
                  ))}
                </div>
              )}
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
                className="flex-[2] py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                {loading ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={18} /> Registrar Consulta</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultationScanner;