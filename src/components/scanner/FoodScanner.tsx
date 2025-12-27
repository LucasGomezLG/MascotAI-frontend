import React, { useState, useEffect, useMemo } from 'react';
import {
  Camera, Loader2, Utensils, User, Wallet, Search,
  CheckCircle, MessageCircle, Sparkles, ThumbsUp, ThumbsDown,
  ShoppingBag, X, AlertTriangle, Package,
  AlertCircle, RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';
import Swal from 'sweetalert2';

const FoodScanner = ({ mascotas, onScanComplete, initialData, onReset }: any) => {
  const [selectedPet, setSelectedPet] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingBusqueda, setLoadingBusqueda] = useState(false);
  const [loadingResenas, setLoadingResenas] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [porcion, setPorcion] = useState<number | null>(null);

  const [precioInput, setPrecioInput] = useState("");
  const [pesoBolsaInput, setPesoBolsaInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [busquedaResult, setBusquedaResult] = useState<any[]>([]);
  const [resenas, setResenas] = useState<string[]>([]);

  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showBrandWarning, setShowBrandWarning] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [alertasSalud, setAlertasSalud] = useState<any[]>([]);

  // ✅ OPTIMIZACIÓN: Buscamos la mascota solo cuando cambia la selección
  const petData = useMemo(() =>
    mascotas.find((p: any) => p.id === selectedPet),
    [mascotas, selectedPet]
  );

  // ✅ OPTIMIZACIÓN: Lógica de edad basada en fecha de nacimiento real
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

  useEffect(() => {
    api.getAlertasSalud().then(res => setAlertasSalud(res.data || []));

    if (initialData) {
      setResult(initialData);
      // ✅ CORRECCIÓN: Leemos porcionRecomendada (Nombre exacto en DB)
      setPorcion(initialData.porcionRecomendada || null);
      setPrecioInput(initialData.precioComprado?.toString() || "");
      setPesoBolsaInput(initialData.pesoBolsaKg?.toString() || "");
      setBusquedaResult(Array.isArray(initialData.preciosOnlineIA) ? initialData.preciosOnlineIA : []);
      
      // ✅ CLAVE: Recuperamos el ID de la mascota del reporte guardado
      if (initialData.mascotaId) {
        setSelectedPet(initialData.mascotaId);
      }
    }
  }, [initialData]);

  const getGamaColor = (c: string = "") => {
    const q = c.toLowerCase();
    if (q.includes('ultra')) return 'bg-indigo-600 text-white border-indigo-200';
    if (q.includes('premium')) return 'bg-green-500 text-white border-green-200';
    return 'bg-orange-500 text-white border-orange-200';
  };

  const calcularCostoDiario = () => {
    const p = parseFloat(precioInput);
    const w = parseFloat(pesoBolsaInput);
    if (!p || !w || !porcion) return null;
    return ((p / (w * 1000)) * porcion).toFixed(2);
  };

  const sincronizarFinanzas = async () => {
    if (!result?.id) return;
    try {
      await api.guardarFinanzas({
        id: result.id,
        precio: precioInput,
        peso: pesoBolsaInput,
        costoDiario: calcularCostoDiario(),
        busquedaIA: busquedaResult,
        // ✅ CORRECCIÓN: Enviamos porcionRecomendada para persistir
        porcionRecomendada: porcion
      });
    } catch (e) { console.error(e); }
  };

  const handleActivarBolsa = async () => {
    if (!result?.id) return;
    try {
      await api.activarStock(result.id, {
        precio: precioInput,
        peso: pesoBolsaInput,
        costoDiario: calcularCostoDiario()
      });
      setResult({ ...result, stockActivo: true });
      Swal.fire({
        title: '¡Bolsa activada!',
        text: 'MascotAI empezó a contar el stock desde hoy.',
        icon: 'success',
        confirmButtonColor: '#f27121',
        customClass: { popup: 'rounded-2xl' }
      });
    } catch (e) { console.error(e); }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setSelectedImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!selectedImage) return;
    setLoading(true);
    try {
      const res = await api.analizarAlimento(selectedImage, selectedPet);
      if (res.data.alimento === "ERROR: NO_ES_ALIMENTO") {
        Swal.fire({ title: 'Error', text: 'La imagen no parece ser alimento.', icon: 'warning' });
        setSelectedImage(null);
      } else {
        setResult(res.data.alimento);
        // ✅ CORRECCIÓN: La IA ahora devuelve porcionRecomendada
        setPorcion(res.data.alimento.porcionRecomendada);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleBuscarPrecios = async () => {
    if (!result?.marca || result.marca.toLowerCase().includes("desconocida")) { setShowBrandWarning(true); return; }
    setLoadingBusqueda(true);
    try {
      const res = await api.buscarPrecios(result.marca);
      setBusquedaResult(res.data || []);
      setShowPriceModal(true);
    } catch (e) { console.error(e); } finally { setLoadingBusqueda(false); }
  };

  const handleBuscarResenas = async () => {
    if (!result?.marca || result.marca.toLowerCase().includes("desconocida")) { setShowBrandWarning(true); return; }
    setLoadingResenas(true);
    try {
      const res = await api.buscarResenas(result.marca);
      const lineas = res.data.split('\n');
      const lista = lineas.find((l: string) => l.includes('|'))?.split('|')
        .map((s: string) => s.trim())
        .filter((s: string) => s.toUpperCase().includes("BUENO:") || s.toUpperCase().includes("MALO:")) || [];
      setResenas(lista);
    } catch (e) { console.error(e); } finally { setLoadingResenas(false); }
  };

  const cleanMarkdown = (text: any) => (text && typeof text === 'string') ? text.replace(/\*\*/g, '') : "---";

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {alertasSalud.length > 0 && (
        <div className="mb-6 space-y-2">
          {alertasSalud.map((alerta, idx) => (
            <div key={idx} className="bg-red-600 text-white p-4 rounded-2xl shadow-lg flex items-center gap-3 border-2 border-red-400">
              <div className="bg-white/20 p-2 rounded-lg"><AlertCircle size={20} /></div>
              <div className="flex-1 text-left">
                <p className="text-[10px] font-black uppercase opacity-80 leading-none mb-1 tracking-widest">Alerta de Salud</p>
                <p className="text-xs font-black">{alerta.tipo}: {alerta.nombre} vence el {alerta.proximaFecha}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {!result ? (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-orange-100 text-left">
            <label className="text-[10px] font-black text-orange-900 uppercase tracking-widest flex items-center gap-2 mb-3">
              <User size={14} /> Mascota
            </label>
            <select
              value={selectedPet}
              onChange={(e) => setSelectedPet(e.target.value)}
              className="w-full p-4 rounded-2xl border-2 border-orange-50 bg-orange-50/50 font-bold outline-none text-slate-700"
            >
              <option value="">Análisis Genérico</option>
              {mascotas.map((p: any) => (
                <option key={p.id} value={p.id}>{p.nombre} ({p.condicion})</option>
              ))}
            </select>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="bg-white h-64 border-4 border-dashed border-orange-100 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:border-orange-300 transition-all active:scale-95 group relative overflow-hidden"
          >
            {selectedImage ? (
              <>
                <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <RefreshCw className="text-white mb-2" />
                  <span className="text-white font-black text-xs uppercase">Cambiar Foto</span>
                </div>
              </>
            ) : (
              <>
                <Camera size={60} className="text-orange-200 mb-4 group-hover:text-orange-400" />
                <p className="text-orange-900/40 font-bold text-center leading-tight group-hover:text-orange-900/60 px-6">Toca para capturar la etiqueta</p>
              </>
            )}
          </div>

          <div className="w-full">
            <button
              type="button"
              onClick={selectedImage ? handleScan : () => fileInputRef.current?.click()}
              disabled={loading}
              className={`w-full flex items-center justify-center gap-3 py-6 rounded-2xl font-black text-xl shadow-xl transition-all active:scale-95 ${loading ? 'bg-orange-200' : 'bg-orange-600 text-white shadow-orange-200'}`}
            >
              {loading ? <Loader2 className="animate-spin" /> : selectedImage ? <><Sparkles size={20} /> ESCANEAR AHORA</> : "SUBIR FOTO"}
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFile} />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border-2 border-orange-50 text-left animate-in zoom-in-95">
          <div className="mb-6">
            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block tracking-tighter">Marca Detectada</label>
            <input className="text-3xl font-black bg-transparent border-b-2 outline-none w-full border-slate-100 focus:border-orange-500" value={result.marca} onChange={(e) => setResult({ ...result, marca: e.target.value })} />
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
                      <div>
                        <p className="text-[8px] font-black uppercase opacity-60">Mascota</p>
                        <p className="text-sm font-bold">{petData.nombre}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black uppercase opacity-60">Edad</p>
                        <p className="text-sm font-bold">{calcularEdad(petData.fechaNacimiento)} años</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[8px] font-black uppercase opacity-60">Estado de salud</p>
                        <p className="text-sm font-bold">{petData.condicion}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-4">
                    <p className="text-[10px] font-black uppercase opacity-70 tracking-widest leading-none mb-1">Ración diaria</p>
                    <p className="text-lg font-black italic">No se seleccionó mascota</p>
                  </div>
                )}
              </div>
              <Utensils size={64} className="opacity-10 absolute -right-4 -bottom-4 rotate-12" />
            </div>

            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 space-y-4">
              <div className="flex items-center gap-2 text-blue-900 font-black text-xs uppercase tracking-widest"><Wallet size={16} /> Pet Finance</div>
              <div className="flex gap-2">
                <input type="number" placeholder="Precio ($)" className="w-1/2 p-3 rounded-xl border border-blue-200 font-bold" value={precioInput} onChange={e => setPrecioInput(e.target.value)} onBlur={sincronizarFinanzas} />
                <input type="number" placeholder="Bolsa (kg)" className="w-1/2 p-3 rounded-xl border border-blue-200 font-bold" value={pesoBolsaInput} onChange={e => setPesoBolsaInput(e.target.value)} onBlur={sincronizarFinanzas} />
              </div>

              {calcularCostoDiario() && (
                <div className="bg-white p-3 rounded-xl border-2 border-blue-100 text-center">
                  <p className="text-[10px] font-black text-blue-400 uppercase leading-none mb-1 tracking-tighter">Costo Diario Estimado</p>
                  <p className="text-xl font-black text-blue-700">${calcularCostoDiario()}</p>
                </div>
              )}

              {!result.stockActivo && pesoBolsaInput && (
                <button onClick={handleActivarBolsa} className="w-full py-3 bg-orange-600 text-white rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 shadow-lg shadow-orange-100"><Package size={14} /> ¡Empecé esta bolsa hoy!</button>
              )}

              {result.stockActivo && (
                <div className="bg-green-100 text-green-700 p-3 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase"><CheckCircle size={14} /> Bolsa en seguimiento</div>
              )}

              <button onClick={handleBuscarPrecios} disabled={loadingBusqueda} className={`w-full py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-md ${loadingBusqueda ? 'bg-blue-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                {loadingBusqueda ? <Loader2 className="animate-spin" size={14} /> : <Search size={14} />} BUSCAR PRECIOS ONLINE
              </button>
            </div>
          </div>

          <div className={`inline-block px-5 py-2 rounded-xl text-xs font-black mb-4 uppercase border ${getGamaColor(result?.calidad)}`}>GAMA: {result?.calidad}</div>
          <p className="bg-orange-50 p-6 rounded-2xl mb-6 italic text-slate-800 text-center text-lg">"{result.veredicto}"</p>

          <div className="mb-8">
            <h3 className="font-black text-slate-800 flex items-center gap-2 mb-4 uppercase text-[10px] tracking-wider"><CheckCircle size={14} className="text-green-500" /> Ingredientes</h3>
            <div className="flex flex-wrap gap-2">{result?.ingredientes?.map((ing: string, i: number) => (<span key={i} className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-[11px] font-bold text-slate-600">{ing}</span>))}</div>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase text-[10px] tracking-wider"><MessageCircle size={14} className="text-blue-500" /> Opiniones</h3>
              <button onClick={handleBuscarResenas} disabled={loadingResenas} className="text-[9px] font-black text-blue-600 uppercase flex items-center gap-1">{loadingResenas ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />} Ver reseñas</button>
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
          <button onClick={() => { setResult(null); setSelectedImage(null); onReset(); }} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black shadow-lg">FINALIZAR</button>
        </div>
      )}

      {showPriceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 relative animate-in zoom-in-95 text-left">
            <button onClick={() => setShowPriceModal(false)} className="absolute top-6 right-6 text-slate-400"><X size={24} /></button>
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-blue-100 p-3 rounded-2xl text-blue-600"><ShoppingBag size={24} /></div>
              <div><h3 className="text-xl font-black text-slate-800 leading-none">Ofertas Hoy</h3><p className="text-blue-500 font-bold text-[10px] uppercase mt-1">Precios en Argentina</p></div>
            </div>
            <div className="space-y-3 mb-8 max-h-[350px] overflow-y-auto pr-2">
              {busquedaResult.map((o, i) => (
                <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center mb-1"><span className="font-black text-slate-800 text-[11px] uppercase">{o.tienda}</span><span className="bg-blue-100 text-blue-700 text-[9px] font-black px-2 py-0.5 rounded-lg">{o.peso}</span></div>
                  <div className="flex justify-between items-end"><span className="text-xl font-black text-orange-600">{o.precio}</span><span className="text-[10px] text-slate-400 font-bold italic">{o.nota}</span></div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowPriceModal(false)} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black">ENTENDIDO</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodScanner;