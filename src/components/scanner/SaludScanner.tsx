import React, { useState, useEffect } from 'react';
import {
  Loader2, User, Syringe, ShieldPlus, ClipboardPlus,
  X, Wallet, RefreshCw, Sparkles, Image as ImageIcon,
  Info, Camera as CameraIcon
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext'; // 🛡️ Importamos el contexto
import Swal from 'sweetalert2';

// 🛡️ IMPORTACIONES NATIVAS
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { useCameraPermissions } from '../../hooks/useCameraPermissions';

const SaludScanner = ({ mascotas, onScanComplete }: any) => {
  const { user, refreshUser } = useAuth(); // 🛡️ Obtenemos datos y función de refresco
  const [selectedPet, setSelectedPet] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSuscripcion, setLoadingSuscripcion] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  const { validarCamara, validarGaleria } = useCameraPermissions();
  const hoy = new Date().toISOString().split("T")[0];

  // 🛡️ Cálculo de energía
  const restantes = Math.max(0, 10 - (user?.intentosIA || 0));
  const tieneEnergia = user?.esColaborador || restantes > 0;

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
    // 📸 Ahora abrimos la cámara sin validar créditos primero
    const ok = await validarCamara();
    if (!ok) return;

    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });

      if (image.base64String) {
        setSelectedImage(`data:image/jpeg;base64,${image.base64String}`);
        setEditData(null);
      }
    } catch (error) {
      console.log("Cámara cancelada");
    }
  };

  const handleNativeGallery = async () => {
    // 🖼️ Ahora abrimos la galería sin validar créditos primero
    const ok = await validarGaleria();
    if (!ok) return;

    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos
      });

      if (image.base64String) {
        setSelectedImage(`data:image/jpeg;base64,${image.base64String}`);
        setEditData(null);
      }
    } catch (error) {
      console.log("Galería cancelada");
    }
  };

  const handleBorrarFoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImage(null);
    setEditData(null);
  };

  const handleAnalizarSalud = async () => {
    // 🛡️ ÚNICO PUNTO DE VALIDACIÓN DE CRÉDITOS: Al presionar "ESCANEAR AHORA"
    if (!tieneEnergia) {
      mostrarModalLimite();
      return;
    }

    if (!selectedPet) {
      Swal.fire({ text: 'Seleccioná a qué mascota le pertenece este producto.', icon: 'info', confirmButtonColor: '#10b981' });
      return;
    }

    if (!selectedImage) return;

    setLoading(true);
    setEditData(null);

    try {
      const res = await api.analizarSalud(selectedImage, selectedPet);

      // ✅ ACTUALIZACIÓN DE CRÉDITOS EN EL HEADER
      await refreshUser(); 

      if (res.data.error === "PRODUCTO_NO_VALIDO") {
        Swal.fire({ title: 'Imagen no reconocida', text: 'MascotAI no detectó un producto médico.', icon: 'error', confirmButtonColor: '#10b981' });
        return;
      }

      if (res.data.error === "ESPECIE_INCORRECTA") {
        Swal.fire({ title: '⚠️ ¡ALERTA DE SEGURIDAD!', text: 'Este producto no parece ser apto para tu mascota.', icon: 'warning', confirmButtonColor: '#ef4444' });
        return;
      }

      setEditData({
        nombre: res.data.nombre || "Producto desconocido",
        tipo: res.data.tipo || "MEDICAMENTO",
        fechaAplicacion: hoy,
        proximaFecha: (res.data.proximaFecha && res.data.proximaFecha > hoy) ? res.data.proximaFecha : "",
        precio: res.data.precio || 0,
        dosis: res.data.notas || res.data.dosis || "Dosis no detectada",
        completado: true,
        mascotaId: selectedPet
      });

    } catch (e: any) {
      console.error("Error en análisis de salud:", e);
      if (e.response?.status === 403 || e.toString().includes("LIMITE_IA_ALCANZADO")) {
        mostrarModalLimite();
      } else {
        Swal.fire({ title: 'Error de Análisis', text: 'Revisá la conexión con el servidor.', icon: 'error', confirmButtonColor: '#10b981' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuardar = async () => {
    if (!editData.nombre.trim()) {
      Swal.fire({ text: 'El nombre del producto es obligatorio.', icon: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const dataParaEnviar = {
        ...editData,
        mascotaId: selectedPet,
        tipo: editData.tipo || "MEDICAMENTO",
        precio: editData.precio || 0,
        completado: editData.completado,
        notas: editData.dosis || "Sin notas",
        fechaAplicacion: editData.fechaAplicacion.split('T')[0],
        proximaFecha: editData.proximaFecha ? editData.proximaFecha.split('T')[0] : null
      };

      await api.guardarEventoSalud(dataParaEnviar);
      Swal.fire({ title: '¡Salud Registrada!', text: `${editData.nombre} se agregó a la cartilla.`, icon: 'success', timer: 2000, showConfirmButton: false });
      setEditData(null);
      setSelectedImage(null);
      if (onScanComplete) onScanComplete();
    } catch (e) {
      Swal.fire({ title: 'Error', text: 'No se pudo guardar.', icon: 'error' });
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
            onClick={handleNativeCamera}
            className="bg-white h-64 border-4 border-dashed border-emerald-100 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:border-emerald-300 transition-all active:scale-[0.98] group relative overflow-hidden shadow-inner"
          >
            {selectedImage ? (
              <>
                <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                <button onClick={handleBorrarFoto} className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-lg text-emerald-600 z-10">
                    <X size={20} />
                </button>
              </>
            ) : (
              <div className="text-center px-6">
                <div className="bg-emerald-50 p-5 rounded-full mb-4 inline-block shadow-sm text-emerald-200">
                  <ShieldPlus size={40} />
                </div>
                <p className="text-emerald-900/40 font-black uppercase text-[10px] tracking-widest leading-tight text-center">
                  Capturar Etiqueta (Cámara)
                </p>
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
            onClick={handleAnalizarSalud}
            disabled={loading || !selectedImage}
            className={`w-full flex items-center justify-center gap-3 py-6 rounded-[2rem] font-black text-xl shadow-xl transition-all active:scale-95 ${
              loading || !selectedImage 
                ? 'bg-emerald-50 text-emerald-200 cursor-not-allowed shadow-none' 
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'
            }`}
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <Sparkles size={22} className={selectedImage ? "text-emerald-200" : "text-emerald-300"} />
                ESCANEAR AHORA
              </>
            )}
          </button>
        </div>
      ) : (
        /* VISTA DE CONFIRMACIÓN - Sin cambios */
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
              <button
                onClick={() => setEditData({ ...editData, completado: !editData.completado })}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 ${editData.completado ? 'bg-emerald-500 shadow-md shadow-emerald-100' : 'bg-slate-200'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${editData.completado ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className={`text-[8px] font-black uppercase tracking-tighter ${editData.completado ? 'text-emerald-600' : 'text-slate-400'}`}>
                {editData.completado ? 'Aplicado' : 'Pendiente'}
              </span>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Producto / Vacuna</p>
              <input
                type="text"
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
                  max={hoy}
                  className="w-full bg-transparent text-xs font-black text-slate-700 outline-none"
                  value={editData.fechaAplicacion || ""}
                  onChange={(e) => setEditData({ ...editData, fechaAplicacion: e.target.value })}
                />
              </div>

              <div className="bg-orange-50/50 p-4 rounded-3xl border border-orange-100">
                <p className="text-[9px] font-black text-orange-600 uppercase mb-2">Próximo Refuerzo</p>
                <input
                  type="date"
                  min={hoy}
                  className="w-full bg-transparent text-xs font-black text-slate-700 outline-none"
                  value={editData.proximaFecha || ""}
                  onChange={(e) => setEditData({ ...editData, proximaFecha: e.target.value })}
                />
              </div>
            </div>

            <div className="bg-blue-50/50 p-5 rounded-3xl border border-blue-100">
              <p className="text-[10px] font-black text-blue-500 uppercase mb-2 flex items-center gap-2"><Wallet size={12} /> Precio ($)</p>
              <input
                type="number"
                className="w-full bg-transparent font-black text-lg text-slate-800 border-b-2 border-slate-100 focus:border-blue-500 outline-none"
                value={editData.precio ?? ""}
                onChange={(e) => setEditData({ ...editData, precio: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/50">
              <p className="text-[9px] font-black text-emerald-600 uppercase mb-2 flex items-center gap-1"><Syringe size={12} /> Dosis / Notas</p>
              <textarea
                className="w-full bg-transparent text-xs font-bold text-slate-700 outline-none resize-none"
                rows={2}
                value={editData.dosis || ""}
                onChange={(e) => setEditData({ ...editData, dosis: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => { setEditData(null); setSelectedImage(null); }} className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase text-[10px]">Descartar</button>
            <button onClick={handleGuardar} disabled={loading} className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-lg uppercase text-[10px] flex items-center justify-center gap-2 disabled:bg-slate-300">
              {loading ? <Loader2 className="animate-spin" size={14} /> : "REGISTRAR SALUD"}
            </button>
          </div>
        </div>
      )}

      {/* Info Footer */}
      <div className="mt-10 bg-amber-50/80 border border-amber-200 p-6 rounded-[2.5rem] shadow-sm text-left">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-amber-100 p-2 rounded-xl text-amber-600"><Info size={20} /></div>
          <h4 className="font-black text-amber-900 uppercase text-xs tracking-widest">¿Cómo funciona?</h4>
        </div>
        <div className="space-y-3">
          <p className="text-[11px] font-bold text-amber-800/90 leading-relaxed"><span className="text-amber-900 font-black uppercase text-[9px]">Escaneado:</span> Capturá medicamentos o vacunas para registrarlos automáticamente.</p>
          <p className="text-[11px] font-bold text-amber-800/90 leading-relaxed"><span className="text-amber-900 font-black uppercase text-[9px]">Seguridad:</span> La IA verifica si el producto es apto para la especie de tu mascota.</p>
          <p className="text-[11px] font-bold text-amber-800/90 leading-relaxed"><span className="text-amber-900 font-black uppercase text-[9px]">Refuerzos:</span> Calculamos el próximo vencimiento para enviarte recordatorios.</p>
        </div>
      </div>
    </div>
  );
};

export default SaludScanner;