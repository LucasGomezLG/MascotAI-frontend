import React, { useState, useEffect } from 'react';
import { X, Camera as CameraIcon, MapPin, Loader2, Search, Trash2, Clock, Image as ImageIcon } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { api } from '../../services/api';
import Swal from 'sweetalert2';

import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { useCameraPermissions } from '../../hooks/useCameraPermissions';

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center);
  return null;
}

const LostPetModal = ({ onClose }: { onClose: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [data, setData] = useState({
    descripcion: '',
    direccion: '',
    contacto: '', // ✅ Agregado contacto
    lat: -34.6037,
    lng: -58.3816
  });

  const [previews, setPreviews] = useState<string[]>([]);
  const [archivos, setArchivos] = useState<File[]>([]);
  
  const { validarCamara, validarGaleria } = useCameraPermissions();

  const handleCamera = async () => {
    if (archivos.length >= 2) return;
    if (!(await validarCamara())) return;
    try {
      const image = await Camera.getPhoto({ quality: 80, allowEditing: false, resultType: CameraResultType.Uri, source: CameraSource.Camera });
      await procesarImagen(image);
    } catch (e) { console.log("Cámara cancelada"); }
  };

  const handleGallery = async () => {
    if (archivos.length >= 2) return;
    if (!(await validarGaleria())) return;
    try {
      const image = await Camera.getPhoto({ quality: 80, allowEditing: false, resultType: CameraResultType.Uri, source: CameraSource.Photos });
      await procesarImagen(image);
    } catch (e) { console.log("Galería cancelada"); }
  };

  const procesarImagen = async (image: any) => {
    if (image.webPath) {
      setPreviews(prev => [...prev, image.webPath!]);
      const response = await fetch(image.webPath);
      const blob = await response.blob();
      const file = new File([blob], `lost_${Date.now()}.jpg`, { type: 'image/jpeg' });
      setArchivos(prev => [...prev, file]);
    }
  };

  const removeFile = (index: number) => {
    setArchivos(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleBuscarDireccion = async () => {
    if (data.direccion.length < 4) {
      Swal.fire({ text: 'Escribí una dirección más completa.', icon: 'info' });
      return;
    }
    setBuscando(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(data.direccion + ", Buenos Aires")}`);
      const results = await response.json();
      if (results.length > 0) {
        setData(prev => ({ ...prev, lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) }));
      } else {
        Swal.fire({ title: 'No encontrada', text: 'Intentá ser más específico.', icon: 'question' });
      }
    } catch (e) {
      Swal.fire({ title: 'Error', text: 'Problema con el servidor de mapas.', icon: 'error' });
    } finally { setBuscando(false); }
  };

  const handlePublicar = async () => {
    if (archivos.length === 0) {
      Swal.fire({ text: 'Subí al menos una foto.', icon: 'warning' });
      return;
    }
    if (!data.contacto.trim()) { // ✅ Validación de contacto
      Swal.fire({ text: 'Por favor, ingresá un contacto (WhatsApp, IG o Tel).', icon: 'warning' });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    archivos.forEach(file => formData.append('files', file));
    formData.append('descripcion', data.descripcion);
    formData.append('direccion', data.direccion);
    formData.append('contacto', data.contacto); // ✅ Enviado al backend
    formData.append('lat', data.lat.toString());
    formData.append('lng', data.lng.toString());

    try {
      await api.reportarMascotaPerdida(formData);
      await Swal.fire({ title: '¡Reporte Publicado!', text: 'La comunidad ya puede verlo.', icon: 'success', timer: 2500, showConfirmButton: false });
      onClose();
    } catch (e) {
      Swal.fire({ title: 'Error', text: 'No pudimos publicar el reporte.', icon: 'error' });
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-left">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl relative max-h-[95vh] overflow-y-auto">
        <button onClick={onClose} className="absolute right-6 text-slate-400 hover:text-red-500 z-10" style={{ top: 'calc(1.5rem + env(safe-area-inset-top))' }}><X size={24} /></button>
        <h3 className="text-2xl font-black text-slate-800 mb-6 tracking-tight italic">Reportar Mascota</h3>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-2">
            {previews.map((p, i) => (
              <div key={i} className="relative h-24">
                <img src={p} className="w-full h-full object-cover rounded-2xl border-2 border-slate-100" alt="Preview" />
                <button onClick={() => removeFile(i)} className="absolute -top-2 -right-2 bg-red-600 text-white p-1.5 rounded-full shadow-lg"><Trash2 size={12} /></button>
              </div>
            ))}
            {previews.length < 2 && (
              <div className="flex gap-2 h-24 col-span-1">
                <button onClick={handleCamera} className="flex-1 bg-red-50 border-2 border-dashed border-red-100 rounded-2xl flex flex-col items-center justify-center text-red-400 hover:bg-red-100 transition-all">
                  <CameraIcon size={20} /><span className="text-[7px] font-black uppercase mt-1">Cámara</span>
                </button>
                <button onClick={handleGallery} className="flex-1 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
                  <ImageIcon size={20} /><span className="text-[7px] font-black uppercase mt-1">Galería</span>
                </button>
              </div>
            )}
          </div>

          <textarea
            placeholder="Descripción (ej: Collar azul, asustadizo...)"
            maxLength={200}
            className="w-full p-4 bg-slate-50 rounded-xl font-bold min-h-[80px] outline-none text-sm border-2 border-transparent focus:border-red-500 transition-all resize-none"
            value={data.descripcion}
            onChange={e => setData({ ...data, descripcion: e.target.value })}
          />

          <div className="space-y-2">
            <div className="relative">
              <MapPin size={18} className="absolute left-4 top-4 text-red-500" />
              <input
                placeholder="Dirección aproximada"
                className="w-full p-4 pl-12 pr-24 bg-slate-50 rounded-xl font-bold outline-none text-sm border-2 border-transparent focus:border-red-500"
                value={data.direccion}
                onChange={e => setData({ ...data, direccion: e.target.value })}
              />
              <button onClick={handleBuscarDireccion} className="absolute right-2 top-2 bottom-2 px-3 bg-slate-800 text-white rounded-lg text-[9px] font-black uppercase">{buscando ? <Loader2 className="animate-spin" size={12} /> : "Buscar"}</button>
            </div>
            <div className="h-32 rounded-2xl overflow-hidden border-2 border-slate-100 relative z-0 shadow-inner">
              <MapContainer center={[data.lat, data.lng]} zoom={15} zoomControl={false} style={{ height: '100%', width: '100%' }}>
                <ChangeView center={[data.lat, data.lng]} /><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><Marker position={[data.lat, data.lng]} />
              </MapContainer>
            </div>
          </div>

          {/* ✅ NUEVO CAMPO DE CONTACTO */}
          <div className="space-y-1">
             <input 
              placeholder="Tu contacto (WhatsApp / IG)"
              className="w-full p-4 bg-red-50 border-2 border-red-100 rounded-xl font-black text-red-700 outline-none text-sm placeholder:text-red-300"
              value={data.contacto}
              onChange={e => setData({ ...data, contacto: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2 px-4 py-3 bg-orange-50 rounded-xl border border-orange-100">
            <Clock size={14} className="text-orange-500" /><p className="text-[10px] font-bold text-orange-700 leading-tight">Aviso: El reporte caduca en 30 días.</p>
          </div>

          <button onClick={handlePublicar} disabled={loading} className="w-full py-5 bg-red-600 text-white rounded-2xl font-black shadow-lg shadow-red-100 flex items-center justify-center gap-2 active:scale-95 transition-all">
            {loading ? <Loader2 className="animate-spin" /> : "PUBLICAR REPORTE"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LostPetModal;