import React from 'react';
import {
    Camera as CameraIcon,
    CheckCircle2,
    Loader2,
    MessageCircle,
    Package,
    Search,
    Sparkles,
    ThumbsDown,
    ThumbsUp,
    Utensils,
    Wallet
} from 'lucide-react';
import type {AlimentoDTO, MascotaDTO} from '@/types/api.types.ts';

const getGamaColor = (calidad: string = "") => {
  const c = calidad.toLowerCase();
  if (c.includes('super') || c.includes('ultra')) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (c.includes('premium')) return "border-blue-200 bg-blue-50 text-blue-700";
  if (c.includes('media')) return "border-orange-200 bg-orange-50 text-orange-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
};

interface FoodResultViewProps {
  result: { alimento: AlimentoDTO, error?: string } | null;
  setResult: (val: { alimento: AlimentoDTO } | null) => void;
  petData?: MascotaDTO;
  porcion: number | null;
  precioInput: string;
  setPrecioInput: (val: string) => void;
  pesoBolsaInput: string;
  setPesoBolsaInput: (val: string) => void;
  sincronizarFinanzas: () => void;
  calcularCostoDiario: () => string | null;
  handleActivarBolsa: () => void;
  handleBuscarPrecios: () => void;
  handleFetchResenasIA: () => void;
  loadingResenas: boolean;
  resenasIA: string;
  loadingBusqueda: boolean;
  onReset: () => void;
  setSelectedImage: (val: string | null) => void;
}

const FoodResultView = ({
  result, setResult, petData, porcion, precioInput, setPrecioInput,
  pesoBolsaInput, setPesoBolsaInput, sincronizarFinanzas, calcularCostoDiario,
  handleActivarBolsa, handleBuscarPrecios, handleFetchResenasIA, 
  loadingResenas, resenasIA, loadingBusqueda, onReset
}: FoodResultViewProps) => {

  const alimento = result?.alimento;

  if (result?.error === "NO_ES_ALIMENTO" || !alimento) {
    return (
      <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border-2 border-red-50 text-center animate-in zoom-in-95">
        <div className="bg-red-50 p-8 rounded-3xl mb-6">
          <CameraIcon size={48} className="text-red-400 mx-auto mb-4" />
          <h3 className="text-red-900 font-black uppercase text-xs tracking-widest mb-2">Error de Identificación</h3>
          <p className="text-red-700 text-[11px] font-bold italic leading-relaxed">No detectamos una tabla nutricional válida. Intenta enfocar mejor la etiqueta.</p>
        </div>
        <button onClick={onReset} className="w-full py-5 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl active:scale-95 transition-all">REINTENTAR</button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border border-slate-100 text-left animate-in zoom-in-95">
      
      <div className="mb-6 relative px-1">
        <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block tracking-widest">Marca Identificada</label>
        <input 
          className="text-2xl font-black bg-transparent border-b-2 outline-none w-full border-slate-100 focus:border-orange-500 transition-all pb-2" 
          value={alimento?.marca || ""} 
          onChange={(e) => setResult({ 
            ...result, 
            alimento: { ...alimento, marca: e.target.value } 
          })} 
        />
      </div>

      <div className="space-y-4 mb-8">
        <div className="bg-emerald-600 text-white p-6 rounded-[2rem] flex items-center justify-between shadow-lg relative overflow-hidden">
          <div className="relative z-10 w-full">
            <p className="text-[10px] font-black uppercase opacity-80 tracking-widest mb-1">Ración Diaria Sugerida</p>
            <p className="text-5xl font-black mb-4">{porcion || alimento?.porcionRecomendada || "---"}<span className="text-xl opacity-60 ml-1">g</span></p>
            
            {petData && (
              <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/20">
                <div><p className="text-[8px] font-black uppercase opacity-60">Para</p><p className="text-xs font-black">{petData.nombre}</p></div>
                <div><p className="text-[8px] font-black uppercase opacity-60">Condición</p><p className="text-xs font-black truncate">{petData.condicion}</p></div>
              </div>
            )}
          </div>
          <Utensils size={80} className="opacity-10 absolute -right-4 -bottom-2 rotate-12" />
        </div>

        <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 space-y-4">
          <div className="flex items-center gap-2 text-blue-900 font-black text-[10px] uppercase tracking-widest px-1"><Wallet size={14} /> Seguimiento de Gasto</div>
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="text-[8px] font-black text-blue-400 uppercase ml-2 mb-1">Precio ($)</p>
              <input type="number" placeholder="0.00" className="w-full p-4 rounded-xl border border-blue-200 font-bold text-sm outline-none focus:bg-white transition-all" value={precioInput} onChange={e => setPrecioInput(e.target.value)} onBlur={sincronizarFinanzas} />
            </div>
            <div className="flex-1">
              <p className="text-[8px] font-black text-blue-400 uppercase ml-2 mb-1">Bolsa (kg)</p>
              <input type="number" placeholder="0.0" className="w-full p-4 rounded-xl border border-blue-200 font-bold text-sm outline-none focus:bg-white transition-all" value={pesoBolsaInput} onChange={e => setPesoBolsaInput(e.target.value)} onBlur={sincronizarFinanzas} />
            </div>
          </div>
          
          {calcularCostoDiario() && (
            <div className="bg-white p-4 rounded-2xl border-2 border-blue-100 flex items-center justify-between shadow-sm animate-in fade-in">
              <div className="text-left">
                <p className="text-[8px] font-black text-blue-400 uppercase">Gasto Diario</p>
                <p className="text-xl font-black text-blue-700">${calcularCostoDiario()}</p>
              </div>
              <button 
                onClick={handleActivarBolsa}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-black text-[9px] uppercase transition-all shadow-md ${alimento?.stockActivo ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white active:scale-95'}`}
              >
                {alimento?.stockActivo ? <CheckCircle2 size={14} /> : <Package size={14} />}
                {alimento?.stockActivo ? 'EN SEGUIMIENTO' : 'ACTIVAR STOCK'}
              </button>
            </div>
          )}

          <button onClick={handleBuscarPrecios} disabled={loadingBusqueda} className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-50 transition-all">
            {loadingBusqueda ? <Loader2 className="animate-spin" size={14} /> : <Search size={14} />} COMPARAR PRECIOS ONLINE
          </button>
        </div>
      </div>

      <div className={`inline-block px-4 py-2 rounded-xl text-[10px] font-black mb-4 uppercase border ${getGamaColor(alimento?.calidad || '')}`}>
        CALIDAD: {alimento?.calidad || "PENDIENTE"}
      </div>

      <p className="bg-orange-50/50 p-6 rounded-3xl mb-8 italic text-slate-800 text-center text-lg leading-relaxed border border-orange-100">
        "{alimento?.veredicto || "Generando análisis nutricional..."}"
      </p>

      <div className="mb-8 px-1">
        <h3 className="font-black text-slate-400 uppercase text-[9px] tracking-[0.2em] mb-4 flex items-center gap-2">
            <Sparkles size={14} className="text-yellow-300" fill="currentColor" /> Composición Destacada
        </h3>
        <div className="flex flex-wrap gap-2">
          {alimento?.ingredientes?.map((ing, i) => (
            <span key={i} className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-[10px] font-bold text-slate-500 lowercase first-letter:uppercase">{ing}</span>
          )) || <p className="text-[10px] text-slate-300 italic">No se detectaron ingredientes.</p>}
        </div>
      </div>

      <div className="space-y-4 mb-10 border-t border-slate-100 pt-8">
        {resenasIA && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-2 text-violet-600 font-black text-[10px] uppercase mb-1 px-2">
              <MessageCircle size={14} /> Opinión de la Comunidad (Análisis IA)
            </div>
            
            {resenasIA.split('|').map((item, index) => {
              const text = item.trim();
              if (!text) return null;

              const isBueno = text.toUpperCase().startsWith("BUENO");
              const cleanText = text.replace(/^(BUENO|MALO):\s*/i, "");

              return (
                <div 
                  key={index} 
                  className={`p-5 rounded-[1.8rem] border-2 flex gap-4 items-start transition-all hover:scale-[1.01] ${
                    isBueno 
                    ? 'bg-emerald-50/50 border-emerald-100 text-emerald-900' 
                    : 'bg-red-50/50 border-red-100 text-red-900'
                  }`}
                >
                  <div className={`p-2 rounded-full shrink-0 ${isBueno ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                    {isBueno ? <ThumbsUp size={12} /> : <ThumbsDown size={12} />}
                  </div>
                  
                  <div className="space-y-1 text-left">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${isBueno ? 'text-emerald-600' : 'text-red-600'}`}>
                      {isBueno ? "Punto Positivo" : "Punto Negativo"}
                    </span>
                    <p className="text-[11px] font-bold leading-relaxed italic">
                      "{cleanText}"
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button 
          onClick={handleFetchResenasIA}
          disabled={loadingResenas}
          className="w-full py-5 bg-white text-violet-600 border-2 border-violet-100 rounded-[2rem] font-black text-[10px] uppercase flex items-center justify-center gap-3 shadow-sm active:scale-95 transition-all disabled:opacity-50 mt-2"
        >
          {loadingResenas ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} className="text-yellow-300" fill="currentColor" />}
          {resenasIA ? "REGENERAR ANÁLISIS DE RESEÑAS" : "ANALIZAR RESEÑAS CON IA"}
        </button>
      </div>

      <button 
        onClick={onReset} 
        className="w-full py-6 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.3em] rounded-[2rem] active:scale-95 transition-all shadow-2xl shadow-slate-200"
      >
        FINALIZAR ANÁLISIS
      </button>
    </div>
  );
};

export default FoodResultView;