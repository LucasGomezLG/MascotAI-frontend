import React, { useState, useRef } from 'react';
import { X, Camera, Heart, Plus, Loader2, Trash2, Info, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { api } from '../../services/api';
import 'leaflet/dist/leaflet.css';

// Componente para capturar el click en el mapa
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
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const etiquetasArray = data.etiquetas.split(',').map(tag => tag.trim());
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && archivos.length < 4) {
      setArchivos(prev => [...prev, file]);
      const reader = new FileReader();
      reader.onloadend = () => setPreviews(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = "";
  };

  const removeFile = (index: number) => {
    setArchivos(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handlePublicar = async () => {
    if (archivos.length === 0 || !data.nombre || !data.contacto || !posicion) {
      return alert("Faltan datos clave, fotos o ubicación.");
    }
    setLoading(true);

    const formData = new FormData();

    // ✅ EN LUGAR DE 9 APPENDS, HACEMOS 1 SOLO
    const datosMascota = {
      ...data,
      etiquetas: etiquetasArray,
      lat: posicion.lat,
      lng: posicion.lng
    };

    formData.append('datos', JSON.stringify(datosMascota)); // Todo en una sola "parte"

    archivos.forEach(file => formData.append('files', file)); // Las fotos (4 partes)

    try {
      await api.publicarMascotaAdopcion(formData);
      onClose();
    } catch (e) {
      alert("Error al publicar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-left">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl relative max-h-[95vh] overflow-y-auto animate-in zoom-in-95">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors"><X size={24} /></button>

        <h3 className="text-2xl font-black text-slate-800 mb-6 tracking-tight flex items-center gap-2">
          <Heart className="text-emerald-500" fill="currentColor" size={24} /> Dar en Adopción
        </h3>

        <div className="space-y-4">
          {/* FOTOS */}
          <div className="grid grid-cols-4 gap-2">
            {previews.map((p, i: number) => (
              <div key={i} className="relative h-20 group">
                <img src={p} className="w-full h-full object-cover rounded-xl border-2 border-slate-100" />
                <button onClick={() => removeFile(i)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white p-1 rounded-full shadow-md active:scale-90 transition-transform">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            {previews.length < 4 && (
              <button onClick={() => galleryInputRef.current?.click()} className="h-20 bg-emerald-50 border-2 border-dashed border-emerald-100 rounded-xl flex items-center justify-center text-emerald-400 hover:bg-emerald-100 transition-colors">
                <Plus size={24} /><input type="file" ref={galleryInputRef} className="hidden" onChange={handleFile} accept="image/*" />
              </button>
            )}
          </div>

          {/* DATOS BÁSICOS */}
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Nombre" className="p-3 bg-slate-50 rounded-xl font-bold outline-none text-sm border-2 border-transparent focus:border-emerald-500" onChange={e => setData({ ...data, nombre: e.target.value })} />
            <select
              className="p-3 bg-slate-50 rounded-xl font-bold outline-none text-sm border-2 border-transparent focus:border-emerald-500"
              onChange={e => setData({ ...data, especie: e.target.value })}
            >
              <option value="Gato">Gato</option>
              <option value="Perro">Perro</option>
            </select>
          </div>

          <input placeholder="Edad (ej: 2 meses)" className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none text-sm border-2 border-transparent focus:border-emerald-500" onChange={e => setData({ ...data, edad: e.target.value })} />

          {/* UBICACIÓN */}
          <div className="space-y-2">
            <input
              placeholder="Dirección o Barrio (ej: Palermo)"
              className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none text-sm border-2 border-transparent focus:border-emerald-500"
              onChange={e => setData({ ...data, direccion: e.target.value })}
            />
            <div className="h-32 rounded-2xl overflow-hidden border-2 border-slate-100 relative grayscale-[0.2]">
              <MapContainer center={[-34.6037, -58.3816]} zoom={11} zoomControl={false} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationMarker position={posicion} setPosition={setPosicion} />
              </MapContainer>
              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm z-[400] pointer-events-none">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-tighter flex items-center gap-1">
                  <MapPin size={8} /> Toca tu ubicación
                </p>
              </div>
            </div>
          </div>

          <textarea placeholder="Descripción..." className="w-full p-3 bg-slate-50 rounded-xl font-bold min-h-[60px] outline-none text-sm border-2 border-transparent focus:border-emerald-500" onChange={e => setData({ ...data, descripcion: e.target.value })} />

          <input placeholder="Contacto (IG o WhatsApp)" className="w-full p-3 bg-emerald-50 border-2 border-emerald-100 rounded-xl font-black text-emerald-700 outline-none text-sm" onChange={e => setData({ ...data, contacto: e.target.value })} />

          {/* VIGENCIA */}
          <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <Info size={14} className="text-emerald-600" />
            <p className="text-[10px] font-bold text-emerald-700 leading-tight">
              Vigencia: Tu anuncio estará activo durante 30 días. Luego podrás volver a publicar si es necesario.
            </p>
          </div>

          <button onClick={handlePublicar} disabled={loading} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all shadow-emerald-100">
            {loading ? <Loader2 className="animate-spin" /> : "PUBLICAR ADOPCIÓN"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdoptionModal;