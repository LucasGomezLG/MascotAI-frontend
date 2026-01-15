import React, { useState } from 'react';
import { X, Camera as CameraIcon, Image as ImageIcon, MapPin, Loader2, Trash2, Globe, Wallet, Info } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { api } from '../../services/api';
import Swal from 'sweetalert2';
import 'leaflet/dist/leaflet.css';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { useCameraPermissions } from '../../hooks/useCameraPermissions';

// Helper para mover el mapa a la ubicación encontrada
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center);
  return null;
}

const RefugioModal = ({ onClose }: { onClose: () => void }) => {
  // --- ESTADOS ---
  const [loading, setLoading] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [ubicacionConfirmada, setUbicacionConfirmada] = useState(false);

  const [data, setData] = useState({
    nombre: '',
    descripcion: '',
    redSocial: '',
    aliasDonacion: '',
    direccion: '',
    lat: -34.6037,
    lng: -58.3816
  });

  const [previews, setPreviews] = useState<string[]>([]);
  const [archivos, setArchivos] = useState<File[]>([]); // ✅ Estado recuperado para Cloudinary

  const { validarCamara, validarGaleria } = useCameraPermissions();

  // --- LÓGICA DE UBICACIÓN (NOMINATIM) ---
  const handleBuscarDireccion = async () => {
    if (data.direccion.trim().length < 5) {
      return alertVal('Dirección corta', 'Ingresá un barrio o dirección más específica.');
    }
    setBuscando(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(data.direccion + ", Buenos Aires")}`);
      const results = await res.json();
      if (results.length > 0) {
        setData(prev => ({ ...prev, lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) }));
        setUbicacionConfirmada(true);
      } else {
        setUbicacionConfirmada(false);
        Swal.fire({ title: 'No encontrado', text: 'No pudimos localizar esa dirección.', icon: 'question' });
      }
    } catch (e) { console.error(e); } finally { setBuscando(false); }
  };

  // --- CAPTURA DE MEDIOS NATIVOS ---
  const handleMedia = async (source: CameraSource) => {
    if (archivos.length >= 3) return;
    const ok = source === CameraSource.Camera ? await validarCamara() : await validarGaleria();
    if (!ok) return;

    try {
      const image = await Camera.getPhoto({ quality: 80, resultType: CameraResultType.Uri, source });
      if (image.webPath) {
        // 1. Guardar previsualización
        setPreviews(prev => [...prev, image.webPath!]);

        // 2. Convertir a File binario para el envío real
        const res = await fetch(image.webPath);
        const blob = await res.blob();
        const file = new File([blob], `refu_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setArchivos(prev => [...prev, file]);
      }
    } catch (e) { /* Cancelado */ }
  };

  const removePhoto = (index: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
    setArchivos(prev => prev.filter((_, i) => i !== index));
  };

  // --- ENVÍO AL BACKEND (MULTIPART/FORM-DATA) ---
  const handlePublicar = async () => {
    const { nombre, descripcion, redSocial, aliasDonacion, direccion } = data;

    // 🛡️ VALIDACIONES FRONTEND
    if (archivos.length === 0) return alertVal('Falta Identidad', 'Subí al menos una foto del refugio.');
    if (nombre.trim().length < 3) return alertVal('Nombre inválido', 'El nombre es demasiado corto.');
    if (descripcion.trim().length < 20) return alertVal('Descripción breve', 'Contanos más sobre el refugio (mín. 20 carac.).');
    if (!redSocial.trim()) return alertVal('Red Social', 'El link de Instagram o Web es obligatorio.');
    if (!aliasDonacion.trim()) return alertVal('Donaciones', 'El alias es vital para recibir ayuda.');
    if (!ubicacionConfirmada) return alertVal('Ubicación', 'Buscá y confirmá la ubicación en el mapa.');

    setLoading(true);

    const formData = new FormData();
    const payload = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      redSocial: redSocial.trim(),
      aliasDonacion: aliasDonacion.trim(),
      direccion: direccion.trim(),
      lat: Number(data.lat),
      lng: Number(data.lng),
      verificado: false,
      // 🚩 SOLUCIÓN AL 400: Enviamos un string temporal para pasar el @NotEmpty del Back.
      // El Service de Java luego reemplazará esto con las URLs reales de Cloudinary.
      fotos: ["pendiente_de_subida"]
    };

    formData.append('datos', JSON.stringify(payload));
    archivos.forEach(file => formData.append('files', file));

    try {
      await api.registrarRefugio(formData);
      Swal.fire({
        title: '¡Registrado!',
        text: 'El refugio y sus fotos se guardaron exitosamente.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      onClose();
    } catch (e: any) {
      // 🔍 Log detallado para depuración
      console.error("❌ Error registro detalle:", e.response?.data);
      const msg = e.response?.data?.error || "Verifica los datos ingresados.";
      Swal.fire({ title: 'Error', text: msg, icon: 'error' });
    } finally { setLoading(false); }
  };

  const alertVal = (title: string, text: string) => {
    Swal.fire({ title, text, icon: 'warning', confirmButtonColor: '#7c3aed', customClass: { popup: 'rounded-[2.5rem]' } });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl relative max-h-[95vh] overflow-y-auto animate-in zoom-in-95">

        {/* BOTÓN CERRAR */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-300 hover:text-violet-600 p-2 bg-slate-50 rounded-full transition-colors z-10"
        >
          <X size={20} />
        </button>

        <h3 className="text-2xl font-black text-slate-800 mb-6 tracking-tight flex items-center gap-2 italic">
          <div className="bg-violet-100 p-2 rounded-xl text-violet-600"><Globe size={20} /></div>
          Registrar Refugio
        </h3>

        <div className="space-y-4 text-left">
          {/* FOTOS */}
          <div className="grid grid-cols-3 gap-2">
            {previews.map((p, i) => (
              <div key={i} className="relative h-20">
                <img src={p} className="w-full h-full object-cover rounded-xl border-2 border-violet-50" alt="Refu" />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white p-1 rounded-full shadow-md active:scale-90"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            ))}
            {previews.length < 3 && (
              <div className="flex gap-2 h-20 col-span-2">
                <button onClick={() => handleMedia(CameraSource.Camera)} className="flex-1 bg-violet-50 border-2 border-dashed border-violet-200 rounded-xl flex flex-col items-center justify-center text-violet-600 hover:bg-violet-100 transition-all">
                  <CameraIcon size={18} /><span className="text-[7px] font-black uppercase mt-0.5">Cámara</span>
                </button>
                <button onClick={() => handleMedia(CameraSource.Photos)} className="flex-1 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:bg-slate-100 transition-all">
                  <ImageIcon size={18} /><span className="text-[7px] font-black uppercase mt-0.5">Galería</span>
                </button>
              </div>
            )}
          </div>

          <input
            placeholder="Nombre del Refugio" maxLength={50}
            className="w-full p-4 bg-slate-50 rounded-xl font-bold outline-none text-sm border-2 border-transparent focus:border-violet-500 transition-all"
            value={data.nombre} onChange={e => setData({ ...data, nombre: e.target.value })}
          />

          <div className="space-y-1">
            <textarea
              placeholder="Descripción (Misión y capacidad. Mín 20 carac.)"
              maxLength={200}
              className={`w-full p-4 bg-slate-50 rounded-xl font-bold outline-none text-sm border-2 transition-all min-h-[80px] resize-none ${data.descripcion.length > 0 && data.descripcion.length < 20 ? 'border-amber-200' : 'border-transparent focus:border-violet-500'}`}
              value={data.descripcion} onChange={e => setData({ ...data, descripcion: e.target.value })}
            />
            <div className="flex justify-between px-2">
              <p className={`text-[8px] font-black uppercase ${data.descripcion.length < 20 ? 'text-amber-500' : 'text-violet-500'}`}>
                {data.descripcion.length < 20 ? `Faltan ${20 - data.descripcion.length}` : 'Válido ✓'}
              </p>
              <p className="text-[9px] text-slate-400 font-bold">{data.descripcion.length}/200</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <Globe className="absolute left-3 top-4 text-slate-400" size={14} />
              <input
                placeholder="Instagram/Web" maxLength={50}
                className="w-full p-4 pl-9 bg-slate-50 rounded-xl font-bold text-[10px] outline-none border-2 border-transparent focus:border-violet-500"
                value={data.redSocial} onChange={e => setData({ ...data, redSocial: e.target.value })}
              />
            </div>
            <div className="relative">
              <Wallet className="absolute left-3 top-4 text-violet-500" size={14} />
              <input
                placeholder="Alias CVU/Donación" maxLength={50}
                className="w-full p-4 pl-9 bg-violet-50 rounded-xl font-black text-[10px] text-violet-700 outline-none border-2 border-violet-100 placeholder:text-violet-300"
                value={data.aliasDonacion} onChange={e => setData({ ...data, aliasDonacion: e.target.value })}
              />
            </div>
          </div>

          {/* UBICACIÓN CON BÚSQUEDA */}
          <div className="space-y-2">
            <div className="relative">
              <MapPin size={18} className="absolute left-4 top-4 text-violet-500" />
              <input
                placeholder="Dirección o Barrio"
                className="w-full p-4 pl-12 pr-24 bg-slate-50 rounded-xl font-bold outline-none text-sm border-2 border-transparent focus:border-violet-500"
                value={data.direccion}
                onChange={e => {
                  setData({ ...data, direccion: e.target.value });
                  setUbicacionConfirmada(false);
                }}
              />
              <button onClick={handleBuscarDireccion} className="absolute right-2 top-2 bottom-2 px-3 bg-slate-800 text-white rounded-lg text-[9px] font-black uppercase transition-all active:scale-95">
                {buscando ? <Loader2 className="animate-spin" size={12} /> : "Buscar"}
              </button>
            </div>

            <div className={`h-36 rounded-2xl overflow-hidden border-2 relative transition-all ${ubicacionConfirmada ? 'border-violet-400 ring-2 ring-violet-50' : 'border-slate-100 opacity-60'}`}>
              <MapContainer center={[data.lat, data.lng]} zoom={15} zoomControl={false} style={{ height: '100%', width: '100%' }}>
                <ChangeView center={[data.lat, data.lng]} />
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[data.lat, data.lng]} />
              </MapContainer>
              {ubicacionConfirmada && (
                <div className="absolute top-2 right-2 bg-violet-500 text-white text-[8px] font-black px-2 py-1 rounded-full z-[400] animate-bounce">
                  ✓ UBICACIÓN FIJADA
                </div>
              )}
            </div>
          </div>

          {/* INFO SEGURIDAD */}
          <div className="flex items-center gap-2 px-4 py-3 bg-violet-50 rounded-xl border border-violet-100">
            <Info size={14} className="text-violet-600" />
            <p className="text-[9px] font-bold text-violet-700 leading-tight">
              Los refugios son verificados para garantizar la transparencia en las donaciones de la comunidad.
            </p>
          </div>

          <button
            onClick={handlePublicar}
            disabled={loading}
            className="w-full py-5 bg-violet-600 text-white rounded-[2rem] font-black shadow-lg shadow-violet-100 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : "REGISTRAR REFUGIO"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RefugioModal;