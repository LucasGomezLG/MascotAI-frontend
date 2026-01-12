import React from 'react';
import {
  Camera as CameraIcon, Loader2, Utensils, Wallet, Search,
  CheckCircle, MessageCircle, Sparkles, ThumbsUp, ThumbsDown,
  Package
} from 'lucide-react';

// Funciones auxiliares movidas aquí para limpiar el componente principal
const getGamaColor = (calidad: string) => {
    if (!calidad) return "border-slate-200 bg-slate-50 text-slate-400";
    const c = calidad.toLowerCase();
    if (c.includes('súper premium') || c.includes('super premium') || c.includes('ultra')) return "border-emerald-200 bg-emerald-50 text-emerald-700";
    if (c.includes('premium')) return "border-blue-200 bg-blue-50 text-blue-700";
    if (c.includes('media')) return "border-orange-200 bg-orange-50 text-orange-700";
    return "border-slate-200 bg-slate-50 text-slate-600";
};

const cleanMarkdown = (text: any) => (text && typeof text === 'string') ? text.replace(/\*\*/g, '') : "---";

const calcularEdad = (fecha: string) => {
    if (!fecha) return "---";
    const hoy = new Date();
    const cumple = new Date(fecha);
    let edad = hoy.getFullYear() - cumple.getFullYear();
    if (hoy.getMonth() < cumple.getMonth() || (hoy.getMonth() === cumple.getMonth() && hoy.getDate() < cumple.getDate())) {
      edad--;
    }
    return edad;
};

interface Props {
  result: any;
  setResult: (data: any) => void;
  petData: any;
  porcion: number | null;
  precioInput: string;
  setPrecioInput: (val: string) => void;
  pesoBolsaInput: string;
  setPesoBolsaInput: (val: string) => void;
  sincronizarFinanzas: () => void;
  calcularCostoDiario: () => string | null;
  handleActivarBolsa: () => void;
  handleBuscarPrecios: () => void;
  loadingBusqueda: boolean;
  handleBuscarResenas: () => void;
  loadingResenas: boolean;
  resenas: string[];
  onReset: () => void;
  setSelectedImage: (img: string | null) => void;
}

const FoodResultView = ({
  result,
  setResult,
  petData,
  porcion,
  precioInput,
  setPrecioInput,
  pesoBolsaInput,
  setPesoBolsaInput,
  sincronizarFinanzas,
  calcularCostoDiario,
  handleActivarBolsa,
  handleBuscarPrecios,
  loadingBusqueda,
  handleBuscarResenas,
  loadingResenas,
  resenas,
  onReset,
  setSelectedImage
}: Props) => {
  if (result.error === "NO_ES_ALIMENTO") {
    return (
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border-2 border-orange-50 text-left animate-in zoom-in-95">
            <div className="bg-red-50 border-2 border-red-100 p-8 rounded-3xl text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600"><CameraIcon size={32} /></div>
              <h3 className="text-red-900 font-black uppercase text-xs tracking-widest mb-2">No detectado</h3>
              <p className="text-red-700 text-[11px] font-bold italic leading-relaxed">No se detectó un alimento. Enfocá mejor la tabla nutricional.</p>
            </div>
            <button onClick={() => { setResult(null); setSelectedImage(null); onReset(); }} className="w-full py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl mt-6 active:scale-95 transition-all">INTENTAR DE NUEVO</button>
        </div>
    );
  }

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border-2 border-orange-50 text-left animate-in zoom-in-95">
      <div className="mb-6">
        <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block tracking-tighter">Marca Detectada</label>
        <input className="text-3xl font-black bg-transparent border-b-2 outline-none w-full border-slate-100 focus:border-orange-500" value={result.alimento?.marca || ""} onChange={(e) => setResult({ ...result, alimento: { ...result.alimento, marca: e.target.value } })} />
      </div>

      <div className="space-y-4 mb-8">
        <div className="bg-green-600 text-white p-6 rounded-3xl flex items-center justify-between shadow-lg relative overflow-hidden">
          <div className="relative z-10 w-full">
            {petData ? (
              <>
                <div className="flex flex-col mb-3">
                  <p className="text-[10px] font-black uppercase opacity-70 tracking-widest">Ración diaria</p>
                  <p className="text-4xl font-black">{porcion || "---"}g</p>
                </div>
                <div className="grid grid-cols-2 gap-y-3 pt-3 border-t border-white/20">
                  <div><p className="text-[8px] font-black uppercase opacity-60">Mascota</p><p className="text-sm font-bold">{petData.nombre}</p></div>
                  <div><p className="text-[8px] font-black uppercase opacity-60">Edad</p><p className="text-sm font-bold">{calcularEdad(petData.fechaNacimiento)} años</p></div>
                  <div className="col-span-2"><p className="text-[8px] font-black uppercase opacity-60">Salud</p><p className="text-sm font-bold">{petData.condicion}</p></div>
                </div>
              </>
            ) : (
              <div className="py-4">
                <p className="text-[10px] font-black uppercase opacity-70 tracking-widest leading-none mb-1">Ración diaria</p>
                <p className="text-lg font-black italic opacity-80">Análisis Genérico</p>
              </div>
            )}
          </div>
          <Utensils size={64} className="opacity-10 absolute -right-4 -bottom-4 rotate-12" />
        </div>

        <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 space-y-4">
          <div className="flex items-center gap-2 text-blue-900 font-black text-xs uppercase tracking-widest"><Wallet size={16} /> Pet Finance</div>
          <div className="flex gap-2">
            <input type="number" placeholder="Precio ($)" className="w-1/2 p-3 rounded-xl border border-blue-200 font-bold" value={precioInput} onChange={e => e.target.value.length <= 6 && setPrecioInput(e.target.value)} onBlur={sincronizarFinanzas} />
            <input type="number" placeholder="Bolsa (kg)" className="w-1/2 p-3 rounded-xl border border-blue-200 font-bold" value={pesoBolsaInput} onChange={e => e.target.value.length <= 6 && setPesoBolsaInput(e.target.value)} onBlur={sincronizarFinanzas} />
          </div>
          {calcularCostoDiario() && (
            <div className="bg-white p-3 rounded-xl border-2 border-blue-100 text-center">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-tighter mb-1">Costo Diario Estimado</p>
              <p className="text-xl font-black text-blue-700">${calcularCostoDiario()}</p>
            </div>
          )}
          {!result.alimento?.stockActivo && pesoBolsaInput && (
            <button onClick={handleActivarBolsa} className="w-full py-3 bg-orange-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-orange-100 active:scale-95 transition-all flex items-center justify-center gap-2"><Package size={14} /> ¡Empecé esta bolsa hoy!</button>
          )}
          {result.alimento?.stockActivo && (
            <div className="bg-green-100 text-green-700 p-3 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase"><CheckCircle size={14} /> Bolsa en seguimiento</div>
          )}
          <button onClick={handleBuscarPrecios} disabled={loadingBusqueda} className={`w-full py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-md ${loadingBusqueda ? 'bg-blue-200' : 'bg-blue-600 text-white'}`}>
            {loadingBusqueda ? <Loader2 className="animate-spin" size={14} /> : <Search size={14} />} BUSCAR PRECIOS ONLINE
          </button>
        </div>
      </div>

      <div className={`inline-block px-5 py-2 rounded-xl text-xs font-black mb-4 uppercase border ${getGamaColor(result.alimento?.calidad || result.alimento?.gama)}`}>
        GAMA: {result.alimento?.calidad || result.alimento?.gama || "---"}
      </div>
      <p className="bg-orange-50 p-6 rounded-2xl mb-6 italic text-slate-800 text-center text-lg">
        "{result.alimento?.veredicto || result.alimento?.analisis || "Veredicto no disponible"}"
      </p>

      <div className="mb-8">
        <h3 className="font-black text-slate-800 flex items-center gap-2 mb-4 uppercase text-[10px] tracking-wider"><CheckCircle size={14} className="text-green-500" /> Ingredientes</h3>
        <div className="flex flex-wrap gap-2">
          {(Array.isArray(result.alimento?.ingredientes) ? result.alimento.ingredientes : result.alimento?.ingredientes?.split(',') || []).map((ing: string, i: number) => (
            <span key={i} className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-[11px] font-bold text-slate-600">{ing.trim()}</span>
          ))}
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase text-[10px] tracking-wider"><MessageCircle size={14} className="text-blue-500" /> Opiniones</h3>
          <button onClick={handleBuscarResenas} disabled={loadingResenas} className="text-[9px] font-black text-blue-600 uppercase flex items-center gap-1">
            {loadingResenas ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />} Ver reseñas
          </button>
        </div>
        {resenas.length > 0 && (
          <div className="grid gap-3">
            {resenas.map((r, i) => {
              const isGood = r.toUpperCase().includes("BUENO:");
              return (
                <div key={i} className={`p-4 rounded-2xl border-2 flex gap-3 items-start ${isGood ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'}`}>
                  <div className={`p-2 rounded-lg mt-1 ${isGood ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{isGood ? <ThumbsUp size={12} /> : <ThumbsDown size={12} />}</div>
                  <p className="text-xs font-bold text-slate-700 leading-relaxed">{cleanMarkdown(r.split(':')[1]?.trim() || r)}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <button onClick={() => { setResult(null); setSelectedImage(null); onReset(); }} className="w-full py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl mt-6 active:scale-95 transition-all">FINALIZAR</button>
    </div>
  );
};

export default FoodResultView;
