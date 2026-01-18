import React, {useState} from 'react';
import {Camera as CameraIcon, Clock, Image as ImageIcon, Loader2, MapPin, Trash2, X} from 'lucide-react';
import {MapContainer, Marker, TileLayer, useMap} from 'react-leaflet';
import {api} from '@/services/api.ts';
import Swal from 'sweetalert2';
import {Camera, CameraResultType, CameraSource} from '@capacitor/camera';
import {useCameraPermissions} from '@/hooks/useCameraPermissions.ts';
import {isAxiosError} from 'axios';

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center);
  return null;
}

const LostPetModal = ({ onClose }: { onClose: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [ubicacionConfirmada, setUbicacionConfirmada] = useState(false);
  
  const [data, setData] = useState({
    descripcion: '',
    direccion: '',
    contacto: '',
    lat: -34.6037,
    lng: -58.3816
  });

  const [previews, setPreviews] = useState<string[]>([]);
  const [archivos, setArchivos] = useState<File[]>([]);
  const { validarCamara, validarGaleria } = useCameraPermissions();

  const handleImageCapture = async (source: CameraSource) => {
    if (archivos.length >= 2) return;
    const ok = source === CameraSource.Camera ? await validarCamara() : await validarGaleria();
    if (!ok) return;
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        resultType: CameraResultType.Uri,
        source,
        width: 1024,
        allowEditing: false
      });
      if (image.webPath) {
        setPreviews(prev => [...prev, image.webPath!]);
        const response = await fetch(image.webPath);
        const file = new File([await response.blob()], `lost_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setArchivos(prev => [...prev, file]);
      }
    } catch { /* Error capturado silenciosamente */ }
  };

  const handleBuscarDireccion = async () => {
    if (data.direccion.trim().length < 5) {
      void Swal.fire({ text: 'Escribí una dirección más clara (Calle y altura).', icon: 'info' });
      return;
    }
    setBuscando(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(data.direccion + ", Buenos Aires")}`);
      const results = await response.json();
      if (results.length > 0) {
        setData(prev => ({ ...prev, lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) }));
        setUbicacionConfirmada(true);
      } else {
        setUbicacionConfirmada(false);
        void Swal.fire({ title: 'No encontrada', text: 'Intentá con una calle principal o intersección.', icon: 'question' });
      }
    } catch (err) {
      console.error("Error en búsqueda de mapas:", err);
    } finally { setBuscando(false); }
  };

  const handlePublicar = async () => {
    if (archivos.length === 0) return alertValidacion('Falta foto', 'Subí al menos una foto de la mascota.');
    if (data.descripcion.trim().length < 10) return alertValidacion('Descripción breve', 'Danos más detalles (color, collar, nombre).');
    if (!ubicacionConfirmada) return alertValidacion('Ubicación requerida', 'Debes buscar y confirmar la dirección en el mapa.');
    if (!data.contacto.trim()) return alertValidacion('Contacto necesario', 'Ingresá un medio para que puedan avisarte.');

    setLoading(true);
    const formData = new FormData();
    archivos.forEach(file => formData.append('files', file));

    const datosJSON = {
      descripcion: data.descripcion.trim(),
      direccion: data.direccion.trim(),
      contacto: data.contacto.trim(),
      lat: data.lat,
      lng: data.lng
    };

    formData.append('datos', new Blob([JSON.stringify(datosJSON)], { type: 'application/json' }));

    try {
      await api.reportarMascotaPerdida(formData);
      void Swal.fire({ title: '¡Publicado!', text: 'La comunidad ya puede verlo.', icon: 'success', timer: 2000, showConfirmButton: false });
      onClose();
    } catch (err) {
      if (isAxiosError(err)) {
        console.error("Error al publicar mascota perdida:", err.message);
      }
      void Swal.fire({ title: 'Error', text: 'No pudimos conectar con el servidor.', icon: 'error' });
    } finally { setLoading(false); }
  };

  const alertValidacion = (title: string, text: string) => {
    void Swal.fire({ title, text, icon: 'warning', confirmButtonColor: '#ef4444', customClass: { popup: 'rounded-[2.5rem]' } });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl relative max-h-[95vh] overflow-y-auto animate-in zoom-in-95">
        <button onClick={onClose} className="absolute right-6 top-6 text-slate-400 hover:text-red-500"><X size={24} /></button>
        <h3 className="text-2xl font-black text-slate-800 mb-6 italic tracking-tight">Reportar Mascota</h3>

        <div className="space-y-5 text-left">
          <div className="grid grid-cols-2 gap-2">
            {previews.map((p, i) => (
              <div key={i} className="relative h-24">
                <img src={p} className="w-full h-full object-cover rounded-2xl border-2 border-slate-100" alt="Preview" />
                <button onClick={() => {
                  setArchivos(prev => prev.filter((_, idx) => idx !== i));
                  setPreviews(prev => prev.filter((_, idx) => idx !== i));
                }} className="absolute -top-2 -right-2 bg-red-600 text-white p-1.5 rounded-full shadow-lg"><Trash2 size={12} /></button>
              </div>
            ))}
            {previews.length < 2 && (
              <div className="flex gap-2 h-24">
                <button onClick={() => handleImageCapture(CameraSource.Camera)} className="flex-1 bg-red-50 border-2 border-dashed border-red-100 rounded-2xl flex flex-col items-center justify-center text-red-400">
                  <CameraIcon size={20} /><span className="text-[7px] font-black uppercase mt-1">Cámara</span>
                </button>
                <button onClick={() => handleImageCapture(CameraSource.Photos)} className="flex-1 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400">
                  <ImageIcon size={20} /><span className="text-[7px] font-black uppercase mt-1">Galería</span>
                </button>
              </div>
            )}
          </div>

          <textarea
            placeholder="Descripción de la mascota..."
            maxLength={200}
            className="w-full p-4 bg-slate-50 rounded-xl font-bold min-h-[80px] outline-none text-sm border-2 border-transparent focus:border-red-500 resize-none transition-all"
            value={data.descripcion}
            onChange={e => setData({ ...data, descripcion: e.target.value })}
          />

          <div className="space-y-2">
            <div className="relative">
              <MapPin size={18} className="absolute left-4 top-4 text-red-500" />
              <input
                placeholder="Última ubicación"
                maxLength={100}
                className="w-full p-4 pl-12 pr-20 bg-slate-50 rounded-xl font-bold outline-none text-sm border-2 border-transparent focus:border-red-500"
                value={data.direccion}
                onChange={e => {
                  setData({ ...data, direccion: e.target.value });
                  setUbicacionConfirmada(false);
                }}
              />
              <button onClick={handleBuscarDireccion} className="absolute right-2 top-2 bottom-2 px-3 bg-slate-800 text-white rounded-lg text-[9px] font-black uppercase">
                {buscando ? <Loader2 className="animate-spin" size={12} /> : "Buscar"}
              </button>
            </div>
            
            <div className={`h-32 rounded-2xl overflow-hidden border-2 relative z-0 transition-colors ${ubicacionConfirmada ? 'border-green-400 ring-2 ring-green-100' : 'border-slate-100'}`}>
              <MapContainer center={[data.lat, data.lng]} zoom={15} zoomControl={false} style={{ height: '100%', width: '100%' }}>
                <ChangeView center={[data.lat, data.lng]} /><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><Marker position={[data.lat, data.lng]} />
              </MapContainer>
              {ubicacionConfirmada && <div className="absolute top-2 right-2 bg-green-500 text-white text-[8px] font-black px-2 py-1 rounded-full z-10 animate-bounce">✓ UBICACIÓN FIJADA</div>}
            </div>
          </div>

          <input
            placeholder="WhatsApp o Instagram"
            maxLength={50}
            className="w-full p-4 bg-red-50 border-2 border-red-100 rounded-xl font-black text-red-700 outline-none text-sm placeholder:text-red-300 focus:border-red-500"
            value={data.contacto}
            onChange={e => setData({ ...data, contacto: e.target.value })}
          />

          <div className="flex items-center gap-2 px-4 py-3 bg-orange-50 rounded-xl border border-orange-100">
            <Clock size={14} className="text-orange-500" /><p className="text-[10px] font-bold text-orange-700 leading-tight">Aviso: El reporte caduca en 30 días.</p>
          </div>

          <button onClick={handlePublicar} disabled={loading} className="w-full py-5 bg-red-600 text-white rounded-2xl font-black shadow-lg shadow-red-100 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition-all">
            {loading ? <Loader2 className="animate-spin" /> : "PUBLICAR REPORTE"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LostPetModal;