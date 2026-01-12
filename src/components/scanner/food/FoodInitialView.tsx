import React from 'react';
import { User, Camera as CameraIcon, ImageIcon, Loader2, Sparkles, X } from 'lucide-react';

interface Props {
  mascotas: any[];
  selectedPet: string;
  setSelectedPet: (id: string) => void;
  selectedImage: string | null;
  handleNativeCamera: () => void;
  handleNativeGallery: () => void;
  handleBorrarFoto: (e: React.MouseEvent) => void;
  handleScan: () => void;
  loading: boolean;
}

const FoodInitialView = ({
  mascotas,
  selectedPet,
  setSelectedPet,
  selectedImage,
  handleNativeCamera,
  handleNativeGallery,
  handleBorrarFoto,
  handleScan,
  loading
}: Props) => {
  return (
    <div className="space-y-6 text-left">
      <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-orange-100">
        <label className="text-[10px] font-black text-orange-900 uppercase tracking-widest flex items-center gap-2 mb-3">
          <User size={14} /> Mascota
        </label>
        <select
          value={selectedPet}
          onChange={(e) => setSelectedPet(e.target.value)}
          className="w-full p-4 rounded-2xl border-2 border-orange-50 bg-orange-50/50 font-bold outline-none text-slate-700 focus:border-orange-500 transition-all"
        >
          <option value="">Análisis Genérico</option>
          {mascotas.map((p: any) => (
            <option key={p.id} value={p.id}>{p.nombre} ({p.condicion})</option>
          ))}
        </select>
      </div>

      <div
        onClick={handleNativeCamera}
        className="bg-white h-64 border-4 border-dashed border-orange-100 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:border-orange-300 transition-all active:scale-95 group relative overflow-hidden shadow-inner"
      >
        {selectedImage ? (
          <>
            <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
            <button onClick={handleBorrarFoto} className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-lg text-orange-600 z-10"><X size={20} /></button>
          </>
        ) : (
          <>
            <CameraIcon size={60} className="text-orange-200 mb-4 group-hover:text-orange-400" />
            <p className="text-orange-900/40 font-black uppercase text-[10px] tracking-widest px-6 text-center leading-tight">Capturar Etiqueta (Cámara)</p>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={handleNativeGallery}
        className="w-full py-3 rounded-2xl font-black text-xs uppercase bg-slate-100 text-slate-500 border-2 border-slate-200 flex items-center justify-center gap-2 active:scale-95 transition-all"
      >
        <ImageIcon size={16} /> Cargar desde Galería
      </button>

      <div className="w-full">
        <button
          type="button"
          onClick={handleScan}
          disabled={loading || !selectedImage}
          className={`w-full flex items-center justify-center gap-3 py-6 rounded-2xl font-black text-xl shadow-xl transition-all active:scale-95 ${loading || !selectedImage
            ? 'bg-orange-200 text-orange-400 cursor-not-allowed shadow-none'
            : 'bg-orange-600 text-white hover:bg-orange-700 shadow-orange-200'
            }`}
        >
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              <Sparkles size={22} className={selectedImage ? "text-orange-200" : "text-orange-300"} />
              ESCANEAR AHORA
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default FoodInitialView;