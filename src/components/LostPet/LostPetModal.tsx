import React, { useState, useRef } from 'react';
import { X, Camera, MapPin, Loader2, Search, Trash2, Clock } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { api } from '../../services/api';
import Swal from 'sweetalert2'; // ✅ Importado

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
    if (!file) return;

    // 🛡️ BLINDAJE: Tamaño de foto
    if (file.size > 10 * 1024 * 1024) {
      Swal.fire({
        title: 'Foto muy pesada',
        text: 'Para reportes rápidos, el límite es 10MB.',
        icon: 'warning',
        confirmButtonColor: '#dc2626', // Rojo para emergencia
      });
      return;
    }

    if (archivos.length < 2) {
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

  const handleBuscarDireccion = async () => {
    if (data.direccion.length < 4) {
      Swal.fire({
        text: 'Escribí una dirección más completa para ubicarla en el mapa.',
        icon: 'info',
        confirmButtonColor: '#1e293b',
      });
      return;
    }
    
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
        Swal.fire({
          title: 'No encontrada',
          text: 'No pudimos ubicar esa dirección. Intentá ser más específico.',
          icon: 'question',
          confirmButtonColor: '#1e293b',
        });
      }
    } catch (e) {
      Swal.fire({
        title: 'Error de Mapas',
        text: 'Hubo un problema al conectar con el servidor de mapas.',
        icon: 'error',
      });
    } finally {
      setBuscando(false);
    }
  };

  const handlePublicar = async () => {
    // 🛡️ VALIDACIONES DE PUBLICACIÓN
    if (archivos.length === 0) {
      Swal.fire({ text: 'Por favor, subí al menos una foto de la mascota.', icon: 'warning', confirmButtonColor: '#dc2626' });
      return;
    }
    if (data.descripcion.length < 10) {
      Swal.fire({ text: 'La descripción debe tener al menos 10 caracteres para ayudar en la búsqueda.', icon: 'warning', confirmButtonColor: '#dc2626' });
      return;
    }
    if (!data.direccion) {
      Swal.fire({ text: 'La dirección es obligatoria.', icon: 'warning', confirmButtonColor: '#dc2626' });
      return;
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
      
      await Swal.fire({
        title: '¡Reporte Publicado!',
        text: 'La comunidad de MascotAI ya puede verlo. ¡Ojalá aparezca pronto!',
        icon: 'success',
        timer: 3000,
        showConfirmButton: false
      });

      onClose();
    } catch (e) {
      Swal.fire({ title: 'Error', text: 'No pudimos publicar el reporte. Intentá de nuevo.', icon: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-left">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl relative max-h-[95vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-red-500"><X size={24} /></button>
        <h3 className="text-2xl font-black text-slate-800 mb-6 tracking-tight italic">Reportar Mascota</h3>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-2">
            {previews.map((p, i) => (
              <div key={i} className="relative group h-24">
                <img src={p} className="w-full h-full object-cover rounded-2xl border-2 border-slate-100 shadow-sm" alt="Preview" />
                <button
                  onClick={() => removeFile(i)}
                  className="absolute -top-2 -right-2 bg-red-600 text-white p-1.5 rounded-full shadow-lg active:scale-90 transition-transform"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            {previews.length < 2 && (
              <button
                onClick={() => galleryInputRef.current?.click()}
                className="h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition-all group"
              >
                <Camera size={24} className="group-hover:scale-110 transition-transform" />
                <span className="text-[8px] font-black uppercase mt-1">Añadir foto</span>
                <input type="file" ref={galleryInputRef} className="hidden" onChange={handleFile} accept="image/*" />
              </button>
            )}
          </div>

          <div className="space-y-1">
             <textarea
                placeholder="Descripción (ej: Collar azul, asustadizo...)"
                maxLength={200} // 🛡️ Límite físico
                className="w-full p-4 bg-slate-50 rounded-xl font-bold min-h-[80px] outline-none text-sm border-2 border-transparent focus:border-red-500 transition-all"
                value={data.descripcion}
                onChange={e => setData({ ...data, descripcion: e.target.value })}
              />
              <p className="text-[9px] text-right text-slate-400 font-bold px-2">{data.descripcion.length}/200</p>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <MapPin size={18} className="absolute left-4 top-4 text-red-500" />
              <input
                placeholder="Dirección aproximada"
                className="w-full p-4 pl-12 pr-24 bg-slate-50 rounded-xl font-bold outline-none text-sm border-2 border-transparent focus:border-red-500"
                value={data.direccion}
                onChange={e => setData({ ...data, direccion: e.target.value })}
              />
              <button
                onClick={handleBuscarDireccion}
                disabled={buscando}
                className="absolute right-2 top-2 bottom-2 px-3 bg-slate-800 text-white rounded-lg text-[9px] font-black uppercase flex items-center gap-1 active:scale-95 transition-all disabled:opacity-50"
              >
                {buscando ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                Buscar
              </button>
            </div>

            <div className="h-32 rounded-2xl overflow-hidden border-2 border-slate-100 relative shadow-inner">
              <MapContainer center={[data.lat, data.lng]} zoom={15} zoomControl={false} style={{ height: '100%' }}>
                <ChangeView center={[data.lat, data.lng]} />
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[data.lat, data.lng]} />
              </MapContainer>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-3 bg-orange-50 rounded-xl border border-orange-100">
            <Clock size={14} className="text-orange-500" />
            <p className="text-[10px] font-bold text-orange-700 leading-tight">
              Aviso: Este reporte caduca en 30 días para mantener el mapa actualizado.
            </p>
          </div>

          <button
            onClick={handlePublicar}
            disabled={loading}
            className="w-full py-5 bg-red-600 text-white rounded-2xl font-black shadow-lg shadow-red-100 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:bg-slate-300"
          >
            {loading ? <Loader2 className="animate-spin" /> : "PUBLICAR REPORTE"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LostPetModal;