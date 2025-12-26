import React, { useState } from 'react';
import { 
  Camera, Loader2, User, Calendar, Syringe, 
  ShieldPlus, ClipboardPlus, CheckCircle2, AlertCircle, Trash2,
  Wallet // Nuevo icono importado
} from 'lucide-react';
import { api } from '../../services/api';
import { Toast } from '../../utils/alerts';

const SaludScanner = ({ mascotas, onScanComplete }: any) => {
  const [selectedPet, setSelectedPet] = useState("");
  const [loading, setLoading] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPet) {
      if (!selectedPet) Toast.fire({ icon: 'warning', title: 'Seleccioná una mascota' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      setLoading(true);
      try {
        const res = await api.analizarSalud(reader.result as string, selectedPet);
        setEditData({
          ...res.data,
          mascotaId: selectedPet,
          completado: true,
          precio: 0 // Inicializamos el precio en 0
        });
      } catch (e) {
        Toast.fire({ icon: 'error', title: 'Error al procesar la imagen' });
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGuardar = async () => {
    try {
      await api.guardarEventoSalud(editData);
      Toast.fire({
        icon: 'success',
        title: '¡Guardado!',
        text: `${editData.nombre} se agregó a la cartilla.`
      });
      setEditData(null);
      onScanComplete();
    } catch (e) {
      Toast.fire({ icon: 'error', title: 'No se pudo guardar el registro' });
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!editData ? (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-emerald-100 text-left">
            <label className="text-[10px] font-black text-emerald-900 uppercase tracking-widest flex items-center gap-2 mb-3">
              <User size={14} /> Mascota
            </label>
            <select 
              value={selectedPet} 
              onChange={(e) => setSelectedPet(e.target.value)} 
              className="w-full p-4 rounded-2xl border-2 border-emerald-50 bg-emerald-50/50 font-bold outline-none text-slate-700"
            >
              <option value="">¿A quién le toca?</option>
              {mascotas.map((p: any) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          <div className="bg-white p-12 border-4 border-dashed border-emerald-100 rounded-[2.5rem] flex flex-col items-center">
            <ShieldPlus size={60} className="text-emerald-200 mb-4" />
            <p className="text-emerald-900/40 font-bold text-center leading-tight">
              Escaneá la libreta o <br/> caja del medicamento
            </p>
          </div>

          <label className={`w-full flex items-center justify-center gap-3 py-6 rounded-2xl font-black text-xl shadow-xl cursor-pointer ${loading ? 'bg-emerald-200' : 'bg-emerald-600 text-white shadow-emerald-200'}`}>
            {loading ? <Loader2 className="animate-spin" /> : "REGISTRAR SALUD"}
            <input type="file" className="hidden" accept="image/*" onChange={handleFile} disabled={loading || !selectedPet} />
          </label>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border-2 border-emerald-50 text-left animate-in zoom-in-95">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600">
                <ClipboardPlus size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none">Confirmar Registro</h3>
                <p className="text-emerald-500 font-bold text-[10px] uppercase mt-1">Salud Preventiva</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-1">
              <button 
                onClick={() => setEditData({...editData, completado: !editData.completado})}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${editData.completado ? 'bg-emerald-500' : 'bg-slate-200'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${editData.completado ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className="text-[8px] font-black uppercase text-slate-400">{editData.completado ? 'Aplicada' : 'Pendiente'}</span>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Producto / Vacuna</p>
              <input 
                type="text"
                className="w-full bg-transparent font-black text-lg text-slate-800 border-b-2 border-slate-100 focus:border-emerald-500 outline-none transition-all pb-1"
                value={editData.nombre}
                onChange={(e) => setEditData({...editData, nombre: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50/50 p-4 rounded-3xl border border-emerald-100">
                <p className="text-[9px] font-black text-emerald-600 uppercase mb-2">Fecha Aplicación</p>
                <input 
                  type="date"
                  className="w-full bg-transparent text-xs font-black text-slate-700 outline-none"
                  value={editData.fechaAplicacion}
                  onChange={(e) => setEditData({...editData, fechaAplicacion: e.target.value})}
                />
              </div>
              <div className="bg-orange-50/50 p-4 rounded-3xl border border-orange-100">
                <p className="text-[9px] font-black text-orange-600 uppercase mb-2">Próximo Refuerzo</p>
                <input 
                  type="date"
                  className="w-full bg-transparent text-xs font-black text-slate-700 outline-none"
                  value={editData.proximaFecha}
                  onChange={(e) => setEditData({...editData, proximaFecha: e.target.value})}
                />
              </div>
            </div>

            {/* --- NUEVO CAMPO: PRECIO / INVERSIÓN SALUD --- */}
            <div className="bg-blue-50/50 p-5 rounded-3xl border border-blue-100">
              <p className="text-[10px] font-black text-blue-500 uppercase mb-2 flex items-center gap-2">
                <Wallet size={12} /> Inversión / Precio
              </p>
              <div className="relative">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 font-black text-slate-400">$</span>
                <input 
                  type="number"
                  className="w-full bg-transparent pl-4 font-black text-lg text-slate-800 border-b-2 border-slate-100 focus:border-blue-500 outline-none transition-all pb-1"
                  placeholder="0.00"
                  value={editData.precio || ''}
                  onChange={(e) => setEditData({...editData, precio: parseFloat(e.target.value)})}
                />
              </div>
            </div>

            {/* Reemplazá el bloque de Notas Médicas por este diseño más detallado */}
<div className="space-y-3">
  {/* Campo: Dosis e Instrucciones */}
  <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/50">
    <p className="text-[9px] font-black text-emerald-600 uppercase mb-2 flex items-center gap-1">
      <Syringe size={12} /> Dosis e Instrucciones
    </p>
    <input 
      type="text"
      className="w-full bg-transparent text-xs font-bold text-slate-700 outline-none border-b border-dashed border-emerald-200 pb-1"
      placeholder="Ej: 1 pipeta de 0.5ml"
      value={editData.dosis || ''}
      onChange={(e) => setEditData({...editData, dosis: e.target.value})}
    />
  </div>

  {/* Campo: Notas Médicas Extendido */}
  <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100">
    <p className="text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1">
      <AlertCircle size={12} /> Observaciones del Profesional
    </p>
    <textarea 
      className="w-full bg-transparent text-xs font-medium text-slate-600 italic leading-relaxed outline-none resize-none"
      rows={3}
      placeholder="Escribí aquí cualquier síntoma o recomendación extra del veterinario..."
      value={editData.notas}
      onChange={(e) => setEditData({...editData, notas: e.target.value})}
    />
    <div className="mt-2 flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Información vital para el historial</p>
    </div>
  </div>
</div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setEditData(null)} 
              className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest"
            >
              Descartar
            </button>
            <button 
              onClick={handleGuardar} 
              className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-lg uppercase text-[10px] tracking-widest"
            >
              Guardar en Cartilla
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaludScanner;