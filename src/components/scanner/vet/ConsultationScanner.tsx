import React, { useState, useRef } from 'react';
import { User, Receipt, RefreshCw, Loader2, Sparkles, ClipboardPlus, Wallet } from 'lucide-react';
import { api } from '../../../services/api';
import { Toast } from '../../../utils/alerts';

const ConsultationScanner = ({ mascotas, onComplete }: any) => {
  const [selectedPet, setSelectedPet] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setSelectedImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleScanDoc = async () => {
    // 1. Validación elegante con Toast en lugar de alert
    if (!selectedPet) {
      Toast.fire({
        icon: 'warning',
        title: '¡Falta un paso!',
        text: 'Seleccioná qué mascota fue al veterinario.'
      });
      return;
    }
    if (!selectedImage) return;

    setLoading(true);
    try {
      const res = await api.analizarReceta(selectedImage, selectedPet);

      // 2. Limpieza robusta de la respuesta JSON (maneja strings o objetos directos)
      let parsedData = typeof res.data === 'string'
        ? JSON.parse(res.data.replace(/```json|```/g, '').trim())
        : res.data;

      // 3. ✅ ASIGNACIÓN CON BLINDAJE (Evita errores de null y campos vacíos)
      setEditData({
        // Si el nombre viene mal (ej: Ecoprotia) o vacío, sugerimos uno genérico
        nombre: parsedData.nombre || "Consulta Médica",

        // Aseguramos que el precio sea al menos 0 para el componente de Finanzas
        precio: parsedData.precio || 0,

        // Si no detectó notas, ponemos una instrucción para guiar al usuario
        notas: parsedData.notas || "Completá aquí los datos del veterinario, clínica o instrucciones del tratamiento.",

        mascotaId: selectedPet,
        tipo: 'Consulta'
      });

    } catch (e) {
      console.error("Error al procesar escaneo:", e);
      Toast.fire({
        icon: 'error',
        title: 'Error al leer el documento',
        text: 'La imagen es poco clara. Intentá sacarla de nuevo o cargá los datos manualmente.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGuardar = async () => {
    try {
      setLoading(true);
      await api.guardarReceta(editData);
      Toast.fire({ icon: 'success', title: '¡Guardado!', text: 'El costo se registró en Finanzas.' });
      setEditData(null);
      setSelectedImage(null);
      onComplete();
    } catch (e) {
      Toast.fire({ icon: 'error', title: 'Error al guardar la consulta' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 w-full">
      {!editData ? (
        // VISTA DEL ESCÁNER
        <div className="space-y-6 text-left w-full">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 w-full">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3"><User size={14} /> Paciente</label>
            <select value={selectedPet} onChange={(e) => setSelectedPet(e.target.value)} className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50/50 font-bold outline-none text-slate-700 focus:border-slate-300 transition-all">
              <option value="">¿Quién fue al vete?</option>
              {mascotas.map((p: any) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div onClick={() => fileInputRef.current?.click()} className="bg-white h-64 border-4 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:border-slate-200 transition-all active:scale-[0.98] group relative overflow-hidden shadow-inner w-full">
            {selectedImage ? (
              <><img src={selectedImage} alt="Documento" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-slate-900/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]"><RefreshCw className="text-white mb-2" /><span className="text-white font-black text-[10px] uppercase">Cambiar Foto</span></div></>
            ) : (
              <div className="text-center group-hover:scale-105 transition-transform"><div className="bg-slate-50 p-5 rounded-full mb-4 inline-block"><Receipt size={40} className="text-slate-200" /></div><p className="text-slate-400 font-black uppercase text-[10px] tracking-widest leading-none">Escaneá receta o factura</p></div>
            )}
          </div>
          <button onClick={handleScanDoc} disabled={loading || !selectedImage} className={`w-full flex items-center justify-center gap-3 py-6 rounded-[2rem] font-black text-xl shadow-xl transition-all active:scale-95 ${loading || !selectedImage ? 'bg-slate-100 text-slate-300' : 'bg-slate-900 text-white shadow-slate-200 hover:bg-black'}`}>
            {loading ? <Loader2 className="animate-spin" /> : <><Sparkles size={22} className="text-blue-400" /> ESCANEAR DOCUMENTO</>}
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFile} />
        </div>
      ) : (
        // VISTA DE CONFIRMACIÓN
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border-2 border-slate-50 text-left animate-in zoom-in-95 w-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-3 rounded-2xl text-blue-600 shrink-0"><ClipboardPlus size={24} /></div>
            <div><h3 className="text-xl font-black text-slate-800 tracking-tighter leading-none">Confirmar Consulta</h3><p className="text-blue-500 font-bold text-[10px] uppercase mt-1">Administración Médica</p></div>
          </div>
          <div className="space-y-4 mb-8 w-full">
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 w-full">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Motivo</p>
              <input type="text" className="w-full bg-transparent font-black text-lg text-slate-800 outline-none border-b-2 border-slate-100 focus:border-blue-500 pb-1" value={editData.nombre || ""} onChange={(e) => setEditData({ ...editData, nombre: e.target.value })} />
            </div>
            <div className="bg-blue-50/50 p-5 rounded-3xl border border-blue-100 w-full">
              <p className="text-[10px] font-black text-blue-500 uppercase mb-2 flex items-center gap-2"><Wallet size={12} /> Costo</p>
              <input type="number" className="w-full bg-transparent font-black text-lg text-slate-800 outline-none pb-1" value={editData.precio ?? ""} onChange={(e) => setEditData({ ...editData, precio: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 w-full">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Detalles</p>
              <textarea className="w-full bg-transparent text-xs font-bold text-slate-600 outline-none resize-none" rows={3} value={editData.notas || ""} onChange={(e) => setEditData({ ...editData, notas: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2 w-full">
            <button onClick={() => setEditData(null)} className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase text-[10px] transition-colors hover:bg-slate-200">Descartar</button>
            <button onClick={handleGuardar} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg uppercase text-[10px] transition-transform active:scale-95">Guardar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultationScanner;