import React, {useState} from 'react';
import {Camera as CameraIcon, Heart, Image as ImageIcon, Loader2, MapPin, Trash2, X} from 'lucide-react';
import {MapContainer, Marker, TileLayer, useMap} from 'react-leaflet';
import {api} from '@/services/api.ts';
import Swal from 'sweetalert2';
import 'leaflet/dist/leaflet.css';
import {Camera, CameraResultType, CameraSource} from '@capacitor/camera';
import {useCameraPermissions} from '@/hooks/useCameraPermissions.ts';
import {isAxiosError} from 'axios';

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center);
  return null;
}

const AdoptionModal = ({ onClose }: { onClose: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [ubicacionConfirmada, setUbicacionConfirmada] = useState(false);

  const [data, setData] = useState({
    nombre: '', especie: 'Gato', edad: '', descripcion: '', contacto: '', direccion: '',
    lat: -34.6037, lng: -58.3816
  });

  const [previews, setPreviews] = useState<string[]>([]);
  const [archivos, setArchivos] = useState<File[]>([]);
  const { validarCamara, validarGaleria } = useCameraPermissions();

  const handleBuscarDireccion = async () => {
    if (data.direccion.trim().length < 5) {
      void Swal.fire({ text: 'Ingresá un barrio o dirección específica.', icon: 'info', confirmButtonColor: '#10b981' });
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
        void Swal.fire({ title: 'Sin resultados', text: 'No pudimos localizar ese barrio.', icon: 'question', confirmButtonColor: '#10b981' });
      }
    } catch { console.error("Error Mapas:"); } finally { setBuscando(false); }
  };

  const handleImageCapture = async (source: CameraSource) => {
    if (archivos.length >= 4) return;
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
        const file = new File([await response.blob()], `adoption_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setArchivos(prev => [...prev, file]);
      }
    } catch { /* Cancelado */ }
  };

  const handlePublicar = async () => {
    const { nombre, especie, edad, descripcion, contacto, direccion } = data;

    if (archivos.length === 0) return alertErr('Falta foto', 'Subí al menos una foto.');
    if (!nombre.trim()) return alertErr('Nombre', 'El nombre es obligatorio.');
    if (!edad.trim()) return alertErr('Edad', 'La edad es obligatoria.');
    if (!direccion.trim() || !ubicacionConfirmada) return alertErr('Ubicación', 'Confirmá el barrio en el mapa.');
    if (descripcion.trim().length < 20) return alertErr('Descripción corta', 'Mínimo 20 caracteres.');
    if (!contacto.trim()) return alertErr('Contacto', 'El contacto es obligatorio.');

    setLoading(true);
    const formData = new FormData();

    const payload = {
      nombre: nombre.trim(),
      especie: especie,
      edad: edad.trim(),
      descripcion: descripcion.trim(),
      contacto: contacto.trim(),
      direccion: direccion.trim(),
      lat: data.lat,
      lng: data.lng,
      etiquetas: []
    };

    formData.append('datos', JSON.stringify(payload));
    archivos.forEach(file => formData.append('files', file));

    try {
      await api.publicarMascotaAdopcion(formData);
      await Swal.fire({
        title: '¡Publicado!',
        text: 'La mascota ya está en adopción.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      onClose();
    } catch (e) {
      if (isAxiosError(e)) {
        console.error("Error Adopción:", e.message);
      }
      void Swal.fire({ title: 'Error', text: 'No pudimos procesar la publicación.', icon: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const alertErr = (title: string, text: string) => {
    void Swal.fire({ title, text, icon: 'warning', confirmButtonColor: '#10b981', customClass: { popup: 'rounded-[2.5rem]' } });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl relative max-h-[95vh] overflow-y-auto animate-in zoom-in-95">
        <button onClick={onClose} className="absolute right-6 top-6 text-slate-300 hover:text-emerald-600 p-2 bg-slate-50 rounded-full transition-colors">
          <X size={20} />
        </button>

        <h3 className="text-2xl font-black text-slate-800 mb-6 tracking-tight flex items-center gap-2 italic">
          <Heart className="text-emerald-500" fill="currentColor" size={24} /> Dar en Adopción
        </h3>

        <div className="space-y-4 text-left">
          <div className="grid grid-cols-4 gap-2">
            {previews.map((p, i) => (
              <div key={i} className="relative h-20">
                <img src={p} className="w-full h-full object-cover rounded-xl border-2 border-emerald-50 shadow-sm" alt="Preview" />
                <button onClick={() => {
                  setArchivos(prev => prev.filter((_, idx) => idx !== i));
                  setPreviews(prev => prev.filter((_, idx) => idx !== i));
                }} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg"><Trash2 size={10} /></button>
              </div>
            ))}
            {previews.length < 4 && (
              <div className="flex gap-2 h-20 col-span-2">
                <button onClick={() => handleImageCapture(CameraSource.Camera)} className="flex-1 bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-xl flex flex-col items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-all">
                  <CameraIcon size={18} /><span className="text-[7px] font-black uppercase mt-0.5">Cámara</span>
                </button>
                <button onClick={() => handleImageCapture(CameraSource.Photos)} className="flex-1 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:bg-slate-100 transition-all">
                  <ImageIcon size={18} /><span className="text-[7px] font-black uppercase mt-0.5">Galería</span>
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="Nombre" maxLength={20}
              className="p-4 bg-slate-50 rounded-xl font-bold outline-none text-sm border-2 border-transparent focus:border-emerald-500 transition-all"
              value={data.nombre} onChange={e => setData({ ...data, nombre: e.target.value })}
            />
            <select
              className="p-4 bg-slate-50 rounded-xl font-bold outline-none text-sm border-2 border-transparent focus:border-emerald-500 appearance-none"
              value={data.especie} onChange={e => setData({ ...data, especie: e.target.value })}
            >
              <option value="Gato">Gato 🐈</option>
              <option value="Perro">Perro 🐕</option>
            </select>
          </div>

          <input
            placeholder="Edad aproximada (Obligatorio)" maxLength={15}
            className="w-full p-4 bg-slate-50 rounded-xl font-bold outline-none text-sm border-2 border-transparent focus:border-emerald-500 transition-all"
            value={data.edad} onChange={e => setData({ ...data, edad: e.target.value })}
          />

          <div className="space-y-2">
            <div className="relative">
              <MapPin size={18} className="absolute left-4 top-4 text-emerald-500" />
              <input
                placeholder="Barrio o dirección"
                className="w-full p-4 pl-12 pr-24 bg-slate-50 rounded-xl font-bold outline-none text-sm border-2 border-transparent focus:border-emerald-500"
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

            <div className={`h-36 rounded-2xl overflow-hidden border-2 relative transition-all ${ubicacionConfirmada ? 'border-emerald-400 ring-2 ring-emerald-50' : 'border-slate-100 opacity-60'}`}>
              <MapContainer center={[data.lat, data.lng]} zoom={15} zoomControl={false} style={{ height: '100%', width: '100%' }}>
                <ChangeView center={[data.lat, data.lng]} />
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[data.lat, data.lng]} />
              </MapContainer>
              {ubicacionConfirmada && (
                <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[8px] font-black px-2 py-1 rounded-full z-[400] animate-in fade-in zoom-in">
                  ✓ UBICACIÓN FIJADA
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <textarea
              placeholder="Descripción (mín. 20 caracteres)..."
              maxLength={200}
              className={`w-full p-4 bg-slate-50 rounded-xl font-bold min-h-[80px] outline-none text-sm border-2 transition-all resize-none ${data.descripcion.length > 0 && data.descripcion.length < 20 ? 'border-amber-200' : 'border-transparent focus:border-emerald-500'}`}
              value={data.descripcion} onChange={e => setData({ ...data, descripcion: e.target.value })}
            />
            <div className="flex justify-between items-center px-2">
              <p className={`text-[9px] font-black uppercase tracking-widest ${data.descripcion.length < 20 ? 'text-amber-500' : 'text-emerald-500'}`}>
                {data.descripcion.length < 20 ? `Faltan ${20 - data.descripcion.length} caracteres` : 'Descripción válida ✓'}
              </p>
              <p className="text-[9px] text-slate-400 font-bold">{data.descripcion.length}/200</p>
            </div>
          </div>

          <input
            placeholder="WhatsApp o Instagram de contacto" maxLength={50}
            className="w-full p-4 bg-emerald-50 border-2 border-emerald-100 rounded-xl font-black text-emerald-700 outline-none text-sm placeholder:text-emerald-300 focus:border-emerald-500 transition-all"
            value={data.contacto} onChange={e => setData({ ...data, contacto: e.target.value })}
          />

          <button
            onClick={handlePublicar}
            disabled={loading}
            className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : "PUBLICAR ADOPCIÓN"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdoptionModal;