import React from 'react';
import {Camera as CameraIcon, ImageIcon, Info, Loader2, Sparkles, User, X} from 'lucide-react';
import type {MascotaDTO} from '@/types/api.types.ts';

interface Props {
  mascotas: MascotaDTO[];
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
    <div className="space-y-6 text-left animate-in fade-in duration-500">
      {/* SELECTOR DE MASCOTA */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-orange-100 relative overflow-hidden">
        <div className="absolute -right-4 -top-4 w-20 h-20 bg-orange-50 rounded-full opacity-50" />
        <label className="text-[10px] font-black text-orange-900 uppercase tracking-widest flex items-center gap-2 mb-3 relative z-10">
          <User size={14} /> Perfil de Nutrición
        </label>
        <select
          value={selectedPet}
          onChange={(e) => setSelectedPet(e.target.value)}
          className="w-full p-4 rounded-2xl border-2 border-orange-50 bg-orange-50/50 font-bold outline-none text-slate-700 focus:border-orange-500 transition-all relative z-10 appearance-none"
        >
          <option value="">Análisis Genérico (Estándar)</option>
          {mascotas.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre} — {p.condicion}</option>
          ))}
        </select>
      </div>

      {/* ÁREA DE CAPTURA */}
      <div
        onClick={handleNativeCamera}
        className="bg-white h-64 border-4 border-dashed border-orange-100 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:border-orange-300 transition-all active:scale-95 group relative overflow-hidden shadow-inner"
      >
        {selectedImage ? (
          <>
            <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <CameraIcon className="text-white" size={40} />
            </div>
            <button 
                onClick={handleBorrarFoto} 
                className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-lg text-red-500 z-10 active:scale-90"
            >
                <X size={20} />
            </button>
          </>
        ) : (
          <>
            <div className="bg-orange-50 p-6 rounded-full mb-4 group-hover:bg-orange-100 transition-colors">
                <CameraIcon size={48} className="text-orange-400" />
            </div>
            <p className="text-orange-900 font-black uppercase text-[10px] tracking-widest px-6 text-center leading-tight">
                Capturar Tabla Nutricional
            </p>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={handleNativeGallery}
        className="w-full py-4 rounded-2xl font-black text-xs uppercase bg-white text-slate-500 border-2 border-slate-100 flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
      >
        <ImageIcon size={16} /> Abrir Galería
      </button>

      <div className="w-full pt-2">
        <button
          type="button"
          onClick={handleScan}
          disabled={loading || !selectedImage}
          className={`w-full flex items-center justify-center gap-3 py-6 rounded-[2rem] font-black text-xl shadow-xl transition-all active:scale-95 ${
            loading || !selectedImage
            ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
            : 'bg-orange-600 text-white shadow-orange-200'
          }`}
        >
          {loading ? <Loader2 className="animate-spin" /> : (
            <><Sparkles size={22} className="text-yellow-300" fill="currentColor" /> ANALIZAR CON IA</>
          )}
        </button>
      </div>

      {/* CARTEL INFORMATIVO AL FINAL */}
      <div className="mt-10 bg-amber-50/80 border border-amber-200 p-6 rounded-[2.5rem] shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-700">
        <div className="flex items-center gap-3 mb-3 text-left">
          <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
            <Info size={20} />
          </div>
          <h4 className="font-black text-amber-900 uppercase text-xs tracking-widest">
            ¿Cómo funciona esta sección?
          </h4>
        </div>

        <div className="space-y-3 text-left">
          <div className="flex gap-3">
            <div className="mt-1 bg-amber-200/50 h-1.5 w-1.5 rounded-full shrink-0" />
            <p className="text-[11px] font-bold text-amber-800/90 leading-relaxed">
              <span className="text-amber-900 font-black uppercase text-[9px]">Análisis Nutricional: </span>
              Escaneá la tabla de ingredientes para entender la calidad real del alimento y recibir un veredicto de nuestra IA.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="mt-1 bg-amber-200/50 h-1.5 w-1.5 rounded-full shrink-0" />
            <p className="text-[11px] font-bold text-amber-800/90 leading-relaxed">
              <span className="text-amber-900 font-black uppercase text-[9px]">Ración Personalizada: </span>
              Calculamos la cantidad exacta que tu mascota necesita según su peso, edad y condición de salud.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="mt-1 bg-amber-200/50 h-1.5 w-1.5 rounded-full shrink-0" />
            <p className="text-[11px] font-bold text-amber-800/90 leading-relaxed">
              <span className="text-amber-900 font-black uppercase text-[9px]">Control de Gastos y Stock: </span>
              Ingresá el precio y peso de la bolsa para activar el seguimiento automático y recibir alertas de reposición.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodInitialView;