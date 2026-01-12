import React, { useState } from 'react';
import { X, Camera as CameraIcon, Image as ImageIcon, Heart, Loader2, Trash2, Info, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { api } from '../../services/api';
import Swal from 'sweetalert2';
import 'leaflet/dist/leaflet.css';

// 🛡️ IMPORTACIONES NATIVAS
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { useCameraPermissions } from '../../hooks/useCameraPermissions';

const LocationMarker = ({ position, setPosition }: any) => {
  useMapEvents({
    click(e) { setPosition(e.latlng); },
  });
  return position ? <Marker position={position} /> : null;
};

const AdoptionModal = ({ onClose }: { onClose: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    nombre: '', especie: 'Gato', edad: '', descripcion: '', etiquetas: '', contacto: '', direccion: ''
  });
  const [posicion, setPosicion] = useState<{ lat: number, lng: number } | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [archivos, setArchivos] = useState<File[]>([]);

  // 🛡️ HOOK DE PERMISOS
  const { validarCamara, validarGaleria } = useCameraPermissions();

  // 📸 FUNCIÓN NATIVA: TOMAR FOTO
  const handleNativeCamera = async () => {
    if (archivos.length >= 4) return;
    const ok = await validarCamara();
    if (!ok) return;

    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      });

      if (image.webPath) {
        setPreviews(prev => [...prev, image.webPath!]);
        const response = await fetch(image.webPath);
        const blob = await response.blob();
        const file = new File([blob], `adoption_cam_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setArchivos(prev => [...prev, file]);
      }
    } catch (e) { console.log("Cámara cancelada"); }
  };

  // 🖼️ FUNCIÓN NATIVA: GALERÍA
  const handleNativeGallery = async () => {
    if (archivos.length >= 4) return;
    const ok = await validarGaleria();
    if (!ok) return;

    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos
      });

      if (image.webPath) {
        setPreviews(prev => [...prev, image.webPath!]);
        const response = await fetch(image.webPath);
        const blob = await response.blob();
        const file = new File([blob], `adoption_gal_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setArchivos(prev => [...prev, file]);
      }
    } catch (e) { console.log("Galería cancelada"); }
  };

  const removeFile = (index: number) => {
    setArchivos(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handlePublicar = async () => {
    if (archivos.length === 0) {
      Swal.fire({ text: 'Subí al menos una foto para que vean a la mascota.', icon: 'info', confirmButtonColor: '#059669' });
      return;
    }
    if (!data.nombre.trim() || !data.contacto.trim()) {
      Swal.fire({ text: 'El nombre y el contacto son obligatorios.', icon: 'warning', confirmButtonColor: '#059669' });
      return;
    }
    if (!posicion) {
      Swal.fire({ text: 'Por favor, tocá el mapa para marcar tu ubicación.', icon: 'info', confirmButtonColor: '#059669' });
      return;
    }

    setLoading(true);
    const etiquetasArray = data.etiquetas.split(',').map(tag => tag.trim()).filter(tag => tag !== "");
    const formData = new FormData();
    const datosMascota = { ...data, etiquetas: etiquetasArray, lat: posicion.lat, lng: posicion.lng };

    formData.append('datos', JSON.stringify(datosMascota));
    archivos.forEach(file => formData.append('files', file));

    try {
      await api.publicarMascotaAdopcion(formData);
      await Swal.fire({
        title: '¡Publicado!',
        text: 'Gracias por ayudar a buscarle un hogar.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      onClose();
    } catch (e) {
      Swal.fire({ title: 'Error', text: 'No pudimos publicar la adopción.', icon: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-left">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl relative max-h-[95vh] overflow-y-auto animate-in zoom-in-95">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors z-10"><X size={24} /></button>

        <h3 className="text-2xl font-black text-slate-800 mb-6 tracking-tight flex items-center gap-2">
          <Heart className="text-emerald-500" fill="currentColor" size={24} /> Dar en Adopción
        </h3>

        <div className="space-y-4">
          {/* SECCIÓN DE FOTOS NATIVAS */}
          <div className="grid grid-cols-4 gap-2">
            {previews.map((p, i: number) => (
              <div key={i} className="relative h-20 group">
                <img src={p} className="w-full h-full object-cover rounded-xl border-2 border-slate-100 shadow-sm" alt="Preview" />
                <button onClick={() => removeFile(i)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white p-1 rounded-full shadow-md active:scale-90 transition-transform">
                  <Trash2 size={10} />
                </button>
              </div>
            ))}
            {previews.length < 4 && (
              <div className="col-span-1 flex flex-col gap-1">
                <button 
                  onClick={handleNativeCamera} 
                  className="flex-1 bg-emerald-50 border-2 border-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 hover:bg-emerald-100 active:scale-95 transition-all"
                >
                  <CameraIcon size={20} />
                </button>
                <button 
                  onClick={handleNativeGallery} 
                  className="flex-1 bg-slate-50 border-2 border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 active:scale-95 transition-all"
                >
                  <ImageIcon size={20} />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input 
              placeholder="Nombre" 
              maxLength={20}
              className="p-3 bg-slate-50 rounded-xl font-bold outline-none text-sm border-2 border-transparent focus:border-emerald-500" 
              onChange={e => setData({ ...data, nombre: e.target.value })} 
            />
            <select
              className="p-3 bg-slate-50 rounded-xl font-bold outline-none text-sm border-2 border-transparent focus:border-emerald-500"
              onChange={e => setData({ ...data, especie: e.target.value })}
            >
              <option value="Gato">Gato 🐈</option>
              <option value="Perro">Perro 🐕</option>
            </select>
          </div>

          <input 
            placeholder="Edad (ej: 2 meses)" 
            maxLength={15}
            className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none text-sm border-2 border-transparent focus:border-emerald-500" 
            onChange={e => setData({ ...data, edad: e.target.value })} 
          />

          <div className="space-y-2">
            <input
              placeholder="Barrio (ej: Palermo, CABA)"
              maxLength={40}
              className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none text-sm border-2 border-transparent focus:border-emerald-500"
              onChange={e => setData({ ...data, direccion: e.target.value })}
            />
            <div className="h-32 rounded-2xl overflow-hidden border-2 border-slate-100 relative grayscale-[0.2] shadow-inner z-0">
              <MapContainer center={[-34.6037, -58.3816]} zoom={11} zoomControl={false} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationMarker position={posicion} setPosition={setPosicion} />
              </MapContainer>
              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm z-[400] pointer-events-none">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-tighter flex items-center gap-1">
                  <MapPin size={8} className="text-emerald-500" /> Toca tu ubicación
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <textarea 
              placeholder="Descripción..." 
              maxLength={200}
              className="w-full p-3 bg-slate-50 rounded-xl font-bold min-h-[60px] outline-none text-sm border-2 border-transparent focus:border-emerald-500 transition-all resize-none" 
              onChange={e => setData({ ...data, descripcion: e.target.value })} 
            />
            <p className="text-[9px] text-right text-slate-400 font-bold px-2">{data.descripcion.length}/200</p>
          </div>

          <input 
            placeholder="Contacto (IG o WhatsApp)" 
            maxLength={50}
            className="w-full p-3 bg-emerald-50 border-2 border-emerald-100 rounded-xl font-black text-emerald-700 outline-none text-sm placeholder:text-emerald-300" 
            onChange={e => setData({ ...data, contacto: e.target.value })} 
          />

          <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <Info size={14} className="text-emerald-600" />
            <p className="text-[10px] font-bold text-emerald-700 leading-tight">
              Aviso: Tu anuncio estará activo 30 días para mantener el feed actualizado.
            </p>
          </div>

          <button onClick={handlePublicar} disabled={loading} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all shadow-emerald-100 disabled:bg-slate-300">
            {loading ? <Loader2 className="animate-spin" /> : "PUBLICAR ADOPCIÓN"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdoptionModal;