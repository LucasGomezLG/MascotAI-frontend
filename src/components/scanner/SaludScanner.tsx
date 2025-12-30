import React, { useState, useRef } from 'react';
import {
  Loader2, User, Syringe, ShieldPlus, ClipboardPlus,
  X, Wallet, RefreshCw, Sparkles, Image as ImageIcon
} from 'lucide-react';
import { api } from '../../services/api';
import { Toast } from '../../utils/alerts';
import Swal from 'sweetalert2';

const SaludScanner = ({ mascotas, onScanComplete }: any) => {
  const [selectedPet, setSelectedPet] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // 🛡️ Fecha de hoy para validaciones
  const hoy = new Date().toISOString().split("T")[0];

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 🛡️ BLINDAJE: Tamaño de foto
    if (file.size > 10 * 1024 * 1024) {
      Swal.fire({
        title: 'Imagen muy pesada',
        text: 'El límite es 10MB para procesar la etiqueta rápido.',
        icon: 'warning',
        confirmButtonColor: '#10b981'
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

  const handleBorrarFoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImage(null);
    setEditData(null);
  };

  const handleAnalizarSalud = async () => {
    if (!selectedPet) {
      Swal.fire({ text: 'Seleccioná una mascota primero para el análisis.', icon: 'info' });
      return;
    }
    if (!selectedImage) return;

    setLoading(true);
    try {
      const res = await api.analizarSalud(selectedImage, selectedPet);

      if (res.data.error === "PRODUCTO_NO_VALIDO") {
        Swal.fire({
          title: 'Imagen no válida',
          text: 'MascotAI no detectó un producto médico claro.',
          icon: 'error',
          confirmButtonColor: '#10b981'
        });
        return;
      }

      if (res.data.error === "ESPECIE_INCORRECTA") {
        Swal.fire({
          title: '⚠️ ¡ALERTA DE SEGURIDAD!',
          text: 'Este producto parece no ser para gatos. Verificá antes de aplicar.',
          icon: 'warning',
          confirmButtonColor: '#ef4444'
        });
        return;
      }

      setEditData({
        nombre: res.data.nombre || "",
        tipo: res.data.tipo || "MEDICAMENTO",
        fechaAplicacion: res.data.fechaAplicacion || hoy,
        proximaFecha: res.data.proximaFecha || "",
        precio: res.data.precio || 0,
        dosis: res.data.notas || "",
        completado: true,
        mascotaId: selectedPet
      });

    } catch (e) {
      Toast.fire({ icon: 'error', title: 'Error al procesar el producto' });
    } finally {
      setLoading(false);
    }
  };

  const handleGuardar = async () => {
    // 🛡️ VALIDACIONES MANUALES (Reforzadas)
    if (!editData.nombre.trim()) {
      Swal.fire({ text: 'El nombre del producto es obligatorio.', icon: 'warning' });
      return;
    }

    if (editData.fechaAplicacion > hoy) {
      Swal.fire({ text: 'La fecha de aplicación no puede ser futura.', icon: 'error' });
      return;
    }

    // 🛡️ NUEVO BLINDAJE: Fecha de refuerzo debe ser mayor a hoy
    if (editData.proximaFecha && editData.proximaFecha <= hoy) {
      Swal.fire({
        title: 'Fecha de refuerzo inválida',
        text: 'La fecha del próximo refuerzo debe ser posterior al día de hoy.',
        icon: 'warning',
        confirmButtonColor: '#f27121' // Naranja para advertencia
      });
      return;
    }

    if (editData.precio < 0 || editData.precio > 999999) {
      Swal.fire({ text: 'Ingresá un costo válido (máx 6 cifras).', icon: 'warning' });
      return;
    }

    try {
      setLoading(true);
      await api.guardarEventoSalud(editData);

      Swal.fire({
        title: '¡Salud Registrada!',
        text: `${editData.nombre} se agregó a la cartilla.`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });

      setEditData(null);
      setSelectedImage(null);
      if (onScanComplete) onScanComplete();
    } catch (e) {
      Swal.fire({ title: 'Error', text: 'No se pudo guardar el registro.', icon: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!editData ? (
        <div className="space-y-6 text-left">
          {/* Selector de Mascota */}
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-emerald-100">
            <label className="text-[10px] font-black text-emerald-900 uppercase tracking-widest flex items-center gap-2 mb-3">
              <User size={14} /> Mascota
            </label>
            <select
              value={selectedPet}
              onChange={(e) => setSelectedPet(e.target.value)}
              className="w-full p-4 rounded-2xl border-2 border-emerald-50 bg-emerald-50/50 font-bold outline-none text-slate-700 focus:border-emerald-500 transition-all"
            >
              <option value="">¿A quién le toca?</option>
              {mascotas.map((p: any) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>

          {/* Recuadro de Captura */}
          <div
            onClick={() => cameraInputRef.current?.click()}
            className="bg-white h-64 border-4 border-dashed border-emerald-100 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:border-emerald-300 transition-all active:scale-[0.98] group relative overflow-hidden shadow-inner"
          >
            {selectedImage ? (
              <>
                <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                <button onClick={handleBorrarFoto} className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-lg text-emerald-600 z-10"><X size={20} /></button>
              </>
            ) : (
              <div className="text-center px-6">
                <div className="bg-emerald-50 p-5 rounded-full mb-4 inline-block shadow-sm text-emerald-200">
                  <ShieldPlus size={40} />
                </div>
                <p className="text-emerald-900/40 font-black uppercase text-[10px] tracking-[0.2em] leading-tight text-center">
                  Escaneá la etiqueta médica
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="w-full py-3 rounded-2xl font-black text-xs uppercase bg-slate-100 text-slate-500 border-2 border-slate-200 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <ImageIcon size={16} /> Cargar imagen
          </button>

          <button
            onClick={handleAnalizarSalud}
            disabled={loading || !selectedImage}
            className={`w-full flex items-center justify-center gap-3 py-6 rounded-[2rem] font-black text-xl shadow-xl transition-all active:scale-95 ${loading || !selectedImage ? 'bg-emerald-50 text-emerald-200' : 'bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700'
              }`}
          >
            {loading ? <Loader2 className="animate-spin" /> : <><Sparkles size={22} /> ANALIZAR PRODUCTO</>}
          </button>

          <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFile} />
          <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" onChange={handleFile} />
        </div>
      ) : (
        /* VISTA DE CONFIRMACIÓN CON BLINDAJES */
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border-2 border-emerald-50 text-left animate-in zoom-in-95">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600 shrink-0"><ClipboardPlus size={24} /></div>
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none">Confirmar Datos</h3>
                <p className="text-emerald-500 font-bold text-[10px] uppercase mt-1 italic tracking-widest">Cartilla de Salud</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-1">
              {/* Switch / Toggle */}
              <button
                onClick={() => setEditData({ ...editData, completado: !editData.completado })}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 ${editData.completado ? 'bg-emerald-500 shadow-md shadow-emerald-100' : 'bg-slate-200'
                  }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${editData.completado ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>

              {/* ✅ TEXTO DINÁMICO: Cambia según la selección */}
              <span className={`text-[8px] font-black uppercase tracking-tighter transition-colors duration-300 ${editData.completado ? 'text-emerald-600' : 'text-slate-400'
                }`}>
                {editData.completado ? 'Activar' : 'Desactivar'}
              </span>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Producto / Vacuna</p>
              <input
                type="text"
                maxLength={50} // 🛡️ Blindaje estético
                className="w-full bg-transparent font-black text-lg text-slate-800 border-b-2 border-slate-100 focus:border-emerald-500 outline-none"
                value={editData.nombre || ""}
                onChange={(e) => setEditData({ ...editData, nombre: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-emerald-50/50 p-4 rounded-3xl border border-emerald-100">
                <p className="text-[9px] font-black text-emerald-600 uppercase mb-2">Fecha Aplicación</p>
                <input
                  type="date"
                  max={hoy} // 🛡️ Evitar fechas futuras
                  className="w-full bg-transparent text-xs font-black text-slate-700 outline-none"
                  value={editData.fechaAplicacion || ""}
                  onChange={(e) => setEditData({ ...editData, fechaAplicacion: e.target.value })}
                />
              </div>
              <div className="bg-orange-50/50 p-4 rounded-3xl border border-orange-100">
                <p className="text-[9px] font-black text-orange-600 uppercase mb-2">Próximo Refuerzo</p>
                <input
                  type="date"
                  min={hoy} // 🛡️ Bloquea visualmente días pasados y hoy
                  className="w-full bg-transparent text-xs font-black text-slate-700 outline-none"
                  value={editData.proximaFecha || ""}
                  onChange={(e) => setEditData({ ...editData, proximaFecha: e.target.value })}
                />
              </div>
            </div>

            <div className="bg-blue-50/50 p-5 rounded-3xl border border-blue-100">
              <p className="text-[10px] font-black text-blue-500 uppercase mb-2 flex items-center gap-2"><Wallet size={12} /> Inversión / Precio</p>
              <div className="relative flex items-center">
                <span className="font-black text-slate-400 mr-1">$</span>
                <input
                  type="number"
                  className="w-full bg-transparent font-black text-lg text-slate-800 border-b-2 border-slate-100 focus:border-blue-500 outline-none"
                  value={editData.precio ?? ""}
                  onChange={(e) => {
                    if (e.target.value.length <= 6) setEditData({ ...editData, precio: parseFloat(e.target.value) || 0 });
                  }} // 🛡️ Máximo 6 cifras
                />
              </div>
            </div>

            <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/50">
              <p className="text-[9px] font-black text-emerald-600 uppercase mb-2 flex items-center gap-1"><Syringe size={12} /> Dosis / Notas</p>
              <textarea
                maxLength={200} // 🛡️ Blindaje de texto
                className="w-full bg-transparent text-xs font-bold text-slate-700 outline-none resize-none"
                rows={2}
                value={editData.dosis || ""}
                onChange={(e) => setEditData({ ...editData, dosis: e.target.value })}
              />
              <p className="text-[8px] text-right text-slate-300 font-bold">{editData.dosis.length}/200</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => { setEditData(null); setSelectedImage(null); }} className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase text-[10px] active:scale-95 transition-all">Descartar</button>
            <button
              onClick={handleGuardar}
              disabled={loading}
              className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-lg uppercase text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-emerald-100 disabled:bg-slate-300"
            >
              {loading ? <Loader2 className="animate-spin" size={14} /> : "REGISTRAR SALUD"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaludScanner;