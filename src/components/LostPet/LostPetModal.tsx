import React, { useState, useRef } from 'react';
import { X, Camera, MapPin, Loader2, Search, Trash2, Clock } from 'lucide-react'; // ✅ Sumamos Trash2
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { api } from '../../services/api';

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
    lat: -34.6037,
    lng: -58.3816
  });

  const [previews, setPreviews] = useState<string[]>([]);
  const [archivos, setArchivos] = useState<File[]>([]);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && archivos.length < 2) {
      setArchivos(prev => [...prev, file]);
      const reader = new FileReader();
      reader.onloadend = () => setPreviews(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    }
    // Resetear el input para permitir subir el mismo archivo si se borró
    if (e.target) e.target.value = "";
  };

  // ✅ NUEVA FUNCIÓN: BORRAR FOTO ESPECÍFICA
  const removeFile = (index: number) => {
    setArchivos(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleBuscarDireccion = async () => {
    if (data.direccion.length < 4) return alert("Escribí una dirección más completa.");
    setBuscando(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(data.direccion + ", Buenos Aires")}`
      );
      const results = await response.json();
      if (results.length > 0) {
        const { lat, lon } = results[0];
        setData(prev => ({ ...prev, lat: parseFloat(lat), lng: parseFloat(lon) }));
      } else {
        alert("No encontramos esa dirección.");
      }
    } catch (e) {
      alert("Error al conectar con el servidor de mapas.");
    } finally {
      setBuscando(false);
    }
  };

  const handlePublicar = async () => {
    if (archivos.length === 0 || !data.descripcion || !data.direccion) {
      return alert("Faltan datos o fotos para publicar.");
    }
    setLoading(true);
    const formData = new FormData();
    archivos.forEach(file => formData.append('files', file));
    formData.append('descripcion', data.descripcion);
    formData.append('direccion', data.direccion);
    formData.append('lat', data.lat.toString());
    formData.append('lng', data.lng.toString());

    try {
      await api.reportarMascotaPerdida(formData);
      onClose();
    } catch (e) {
      alert("Error al publicar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-left">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl relative max-h-[95vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400"><X size={24} /></button>
        <h3 className="text-2xl font-black text-slate-800 mb-6 tracking-tight">Reportar Mascota</h3>

        <div className="space-y-5">
          {/* SECCIÓN DE FOTOS CON BOTÓN DE BORRAR */}
          <div className="grid grid-cols-2 gap-2">
            {previews.map((p, i) => (
              <div key={i} className="relative group h-24">
                <img src={p} className="w-full h-full object-cover rounded-2xl border-2 border-slate-100" />
                {/* Botón para eliminar la foto cargada */}
                <button
                  onClick={() => removeFile(i)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg active:scale-90 transition-transform"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {previews.length < 2 && (
              <button
                onClick={() => galleryInputRef.current?.click()}
                className="h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:text-orange-500 hover:border-orange-200 transition-all"
              >
                <Camera size={24} />
                <span className="text-[8px] font-black uppercase mt-1">Añadir foto</span>
                <input type="file" ref={galleryInputRef} className="hidden" onChange={handleFile} accept="image/*" />
              </button>
            )}
          </div>

          <textarea
            placeholder="Descripción (ej: Collar azul, asustadizo...)"
            className="w-full p-4 bg-slate-50 rounded-xl font-bold min-h-[80px] outline-none text-sm border-2 border-transparent focus:border-red-500"
            onChange={e => setData({ ...data, descripcion: e.target.value })}
          />

          <div className="space-y-2">
            <div className="relative">
              <MapPin size={18} className="absolute left-4 top-4 text-red-500" />
              <input
                placeholder="Dirección (Ej: Av. Sta Fe 2500)"
                className="w-full p-4 pl-12 pr-24 bg-slate-50 rounded-xl font-bold outline-none text-sm"
                value={data.direccion}
                onChange={e => setData({ ...data, direccion: e.target.value })}
              />
              <button
                onClick={handleBuscarDireccion}
                disabled={buscando}
                className="absolute right-2 top-2 bottom-2 px-3 bg-slate-800 text-white rounded-lg text-[9px] font-black uppercase flex items-center gap-1 active:scale-95 transition-all"
              >
                {buscando ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                Buscar
              </button>
            </div>

            <div className="h-32 rounded-2xl overflow-hidden border-2 border-slate-100 relative">
              <MapContainer center={[data.lat, data.lng]} zoom={15} zoomControl={false} style={{ height: '100%' }}>
                <ChangeView center={[data.lat, data.lng]} />
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[data.lat, data.lng]} />
              </MapContainer>
            </div>
          </div>
          {/* ✅ MINI CARTEL DE VIGENCIA */}
          <div className="flex items-center gap-2 px-4 py-3 bg-orange-50 rounded-xl border border-orange-100">
            <Clock size={14} className="text-orange-500" />
            <p className="text-[10px] font-bold text-orange-700 leading-tight">
              Aviso: Para mantener el mapa actualizado, este reporte se borrará automáticamente en 30 días. puedes volver a reportar si es necesario.
            </p>
          </div>
          <button
            onClick={handlePublicar}
            disabled={loading}
            className="w-full py-5 bg-red-600 text-white rounded-2xl font-black shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : "PUBLICAR REPORTE"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LostPetModal;