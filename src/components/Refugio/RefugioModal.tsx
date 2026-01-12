import React, { useState } from 'react';
import { X, Camera as CameraIcon, Image as ImageIcon, MapPin, Loader2, Trash2, Info, Globe, Wallet } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { api } from '../../services/api';
import Swal from 'sweetalert2';

import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { useCameraPermissions } from '../../hooks/useCameraPermissions';

const LocationMarker = ({ position, setPosition }: any) => {
  useMapEvents({ click(e) { setPosition(e.latlng); } });
  return position ? <Marker position={position} /> : null;
};

const RefugioModal = ({ onClose }: { onClose: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ nombre: '', descripcion: '', redSocial: '', alias: '', direccion: '' });
  const [posicion, setPosicion] = useState<{ lat: number, lng: number } | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [archivos, setArchivos] = useState<File[]>([]);
  
  const { validarCamara, validarGaleria } = useCameraPermissions();

  const handleMedia = async (source: CameraSource) => {
    if (archivos.length >= 3) return;
    const ok = source === CameraSource.Camera ? await validarCamara() : await validarGaleria();
    if (!ok) return;

    try {
      const image = await Camera.getPhoto({ quality: 80, resultType: CameraResultType.Uri, source });
      if (image.webPath) {
        setPreviews(prev => [...prev, image.webPath!]);
        const res = await fetch(image.webPath);
        const blob = await res.blob();
        setArchivos(prev => [...prev, new File([blob], `refu_${Date.now()}.jpg`, { type: 'image/jpeg' })]);
      }
    } catch (e) { console.log("Cancelado"); }
  };

  const handlePublicar = async () => {
    if (archivos.length === 0 || !data.nombre || !data.alias || !posicion) {
      return Swal.fire({ text: 'Completá nombre, alias, ubicación y al menos una foto.', icon: 'warning' });
    }

    setLoading(true);
    const formData = new FormData();
    archivos.forEach(f => formData.append('files', f));
    formData.append('nombre', data.nombre);
    formData.append('descripcion', data.descripcion);
    formData.append('redSocial', data.redSocial);
    formData.append('alias', data.alias);
    formData.append('direccion', data.direccion);
    formData.append('lat', posicion.lat.toString());
    formData.append('lng', posicion.lng.toString());

    try {
      await api.registrarRefugio(formData); // Asumiendo que agregaste este método a api.ts
      await Swal.fire({ title: '¡Refugio Registrado!', icon: 'success', timer: 2000, showConfirmButton: false });
      onClose();
    } catch (e) {
      Swal.fire({ title: 'Error', text: 'No se pudo guardar el refugio.', icon: 'error' });
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl relative max-h-[95vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400"><X size={24} /></button>
        <h3 className="text-2xl font-black text-slate-800 mb-6 tracking-tight italic">Registrar Refugio</h3>

        <div className="space-y-4 text-left">
          {/* FOTOS */}
          <div className="grid grid-cols-3 gap-2">
            {previews.map((p, i) => (
              <div key={i} className="relative h-20">
                <img src={p} className="w-full h-full object-cover rounded-xl border-2 border-slate-100" />
                <button onClick={() => {
                  setPreviews(prev => prev.filter((_, idx) => idx !== i));
                  setArchivos(prev => prev.filter((_, idx) => idx !== i));
                }} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white p-1 rounded-full"><Trash2 size={10}/></button>
              </div>
            ))}
            {previews.length < 3 && (
              <div className="flex gap-1 h-20 col-span-1">
                <button onClick={() => handleMedia(CameraSource.Camera)} className="flex-1 bg-violet-50 border-2 border-dashed border-violet-200 rounded-xl flex items-center justify-center text-violet-600"><CameraIcon size={18}/></button>
                <button onClick={() => handleMedia(CameraSource.Photos)} className="flex-1 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-500"><ImageIcon size={18}/></button>
              </div>
            )}
          </div>

          <input placeholder="Nombre del Refugio" className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none border-2 border-transparent focus:border-violet-500" onChange={e => setData({...data, nombre: e.target.value})} />
          
          <textarea placeholder="¿A qué se dedican? (Rescate, tránsito, etc.)" className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none border-2 border-transparent focus:border-violet-500 min-h-[80px]" onChange={e => setData({...data, descripcion: e.target.value})} />

          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <Globe className="absolute left-3 top-3.5 text-slate-400" size={14}/>
              <input placeholder="Instagram/Web" className="w-full p-3 pl-8 bg-slate-50 rounded-xl font-bold text-xs outline-none border-2 border-transparent focus:border-violet-500" onChange={e => setData({...data, redSocial: e.target.value})} />
            </div>
            <div className="relative">
              <Wallet className="absolute left-3 top-3.5 text-violet-500" size={14}/>
              <input placeholder="Alias Donación" className="w-full p-3 pl-8 bg-violet-50 rounded-xl font-black text-xs text-violet-700 outline-none border-2 border-violet-100" onChange={e => setData({...data, alias: e.target.value})} />
            </div>
          </div>

          <div className="space-y-2">
            <input placeholder="Ubicación (Barrio/Ciudad)" className="w-full p-3 bg-slate-50 rounded-xl font-bold text-sm outline-none border-2 border-transparent focus:border-violet-500" onChange={e => setData({...data, direccion: e.target.value})} />
            <div className="h-32 rounded-2xl overflow-hidden border-2 border-slate-100 relative">
              <MapContainer center={[-34.6037, -58.3816]} zoom={11} zoomControl={false} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationMarker position={posicion} setPosition={setPosicion} />
              </MapContainer>
            </div>
          </div>

          <button onClick={handlePublicar} disabled={loading} className="w-full py-4 bg-violet-600 text-white rounded-2xl font-black shadow-lg shadow-violet-100 flex items-center justify-center gap-2 active:scale-95 transition-all">
            {loading ? <Loader2 className="animate-spin" /> : "REGISTRAR REFUGIO"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RefugioModal;