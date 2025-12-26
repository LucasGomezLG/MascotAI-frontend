import React, { useState, useEffect } from 'react';
import {
  Camera, Loader2, Utensils, User, Wallet, Search,
  CheckCircle, MessageCircle, Sparkles, ThumbsUp, ThumbsDown,
  ShoppingBag, X, AlertTriangle, Package,
  AlertCircle // Nuevo icono para alertas urgentes
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
  const [busquedaResult, setBusquedaResult] = useState<string | null>(null);
  const [resenas, setResenas] = useState<string[]>([]);

  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showBrandWarning, setShowBrandWarning] = useState(false);

  // Agregalo debajo de los otros useState
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // NUEVO: Estado para alertas de salud próximas
  const [alertasSalud, setAlertasSalud] = useState<any[]>([]);

  useEffect(() => {
    // Cargamos alertas urgentes al montar el componente
    api.getAlertasSalud().then(res => setAlertasSalud(res.data || []));

    if (initialData) {
      setResult(initialData);
      setPorcion(initialData.porcionRecomendada);
      setPrecioInput(initialData.precioComprado?.toString() || "");
      setPesoBolsaInput(initialData.pesoBolsaKg?.toString() || "");
      setBusquedaResult(initialData.preciosOnlineIA || null);
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
        id: result.id, precio: precioInput, peso: pesoBolsaInput,
        costoDiario: calcularCostoDiario(), busquedaIA: busquedaResult
      });
      onScanComplete();
    } catch (e) { console.error(e); }
  };

  const handleActivarBolsa = async () => {
    if (!result?.id) return;
    try {
      await api.activarStock(result.id);
      setResult({ ...result, stockActivo: true });

      // ✅ REEMPLAZO DEL ALERT
      Swal.fire({
        title: '¡Bolsa activada!',
        text: 'MascotAI empezó a contar el stock desde hoy.',
        icon: 'success',
        confirmButtonText: 'Genial',
        confirmButtonColor: '#f27121', // El naranja de tu marca
        customClass: {
          popup: 'rounded-2xl', // Para que sea redondeado como tu diseño
        }
      });

      onScanComplete();
    } catch (e) {
      // ❌ MANEJO DE ERROR
      Swal.fire({
        title: 'Error',
        text: 'No se pudo activar el stock en este momento.',
        icon: 'error',
        confirmButtonColor: '#f27121'
      });
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      setLoading(true); setResenas([]); setPrecioInput(""); setPesoBolsaInput(""); setBusquedaResult(null);
      try {
        const res = await api.analizarAlimento(reader.result as string, selectedPet);
        if (res.data.alimento === "ERROR: NO_ES_ALIMENTO") {
          alert("La imagen no parece ser alimento de mascotas.");
        } else {
          setResult(res.data.alimento);
          setPorcion(res.data.porcionSugerida);
        }
        onScanComplete();
      } catch (e) { alert("Error"); } finally { setLoading(false); }
    };
    reader.readAsDataURL(file);
  };

  const handleBuscarPrecios = async () => {
    if (!result?.marca || result.marca.toLowerCase().includes("desconocida")) { setShowBrandWarning(true); return; }
    setLoadingBusqueda(true);
    try {
      const res = await api.buscarPrecios(result.marca);
      setBusquedaResult(res.data);
      setShowPriceModal(true);
    } catch (e) { alert("Error"); } finally { setLoadingBusqueda(false); }
  };

  const handleBuscarResenas = async () => {
    if (!result?.marca || result.marca.toLowerCase().includes("desconocida")) { setShowBrandWarning(true); return; }
    setLoadingResenas(true);
    try {
      const res = await api.buscarResenas(result.marca);
      const lineas = res.data.split('\n');
      const lineaConDatos = lineas.find((l: string) => l.includes('|')) || res.data;
      const lista = lineaConDatos.split('|')
        .map((s: string) => s.trim())
        .filter((s: string) => s.toUpperCase().includes("BUENO:") || s.toUpperCase().includes("MALO:"));
      setResenas(lista);
    } catch (e) { alert("Error"); } finally { setLoadingResenas(false); }
  };

  const cleanMarkdown = (text: any) => {
    if (!text || typeof text !== 'string') return "---";
    return text.replace(/\*\*/g, '');
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* 🛡️ BANNER DE ALERTAS DE SALUD URGENTES */}
      {alertasSalud.length > 0 && (
        <div className="mb-6 space-y-2">
          {alertasSalud.map((alerta, idx) => (
            <div key={idx} className="bg-red-600 text-white p-4 rounded-2xl shadow-lg flex items-center gap-3 border-2 border-red-400 animate-in slide-in-from-top-2">
              <div className="bg-white/20 p-2 rounded-lg">
                <AlertCircle size={20} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[10px] font-black uppercase opacity-80 leading-none mb-1 tracking-widest">Alerta de Salud</p>
                <p className="text-xs font-black">
                  {alerta.tipo}: {alerta.nombre} vence el {alerta.proximaFecha}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {!result ? (
        <div className="space-y-6">
          {/* Selector de Mascota */}
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

          {/* Área Visual de Captura */}
          <div className="bg-white p-12 border-4 border-dashed border-orange-100 rounded-[2.5rem] flex flex-col items-center">
            <Camera size={60} className="text-orange-200 mb-4" />
            <p className="text-orange-900/40 font-bold text-center leading-tight">Capturá la etiqueta</p>
          </div>

          {/* BOTÓN ACTUALIZADO CON DISPARADOR DE CÁMARA/GALERÍA */}
          <div className="w-full">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className={`w-full flex items-center justify-center gap-3 py-6 rounded-2xl font-black text-xl shadow-xl transition-all active:scale-95 ${loading ? 'bg-orange-200' : 'bg-orange-600 text-white shadow-orange-200'
                }`}
            >
              {loading ? <Loader2 className="animate-spin" /> : "ESCANEAR ALIMENTO"}
            </button>

            {/* Input oculto que detecta el dispositivo móvil */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/jpeg, image/png, image/jpg" // Forzamos formatos de imagen
              onChange={handleFile}
            />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border-2 border-orange-50 text-left animate-in zoom-in-95">
          <div className="mb-6">
            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block tracking-tighter">Marca Detectada</label>
            <input className="text-3xl font-black bg-transparent border-b-2 outline-none w-full border-slate-100 focus:border-orange-500" value={result.marca} onChange={(e) => setResult({ ...result, marca: e.target.value })} />
          </div>

          <div className="space-y-4 mb-8">
            <div className="bg-green-600 text-white p-6 rounded-3xl flex items-center justify-between shadow-lg">
              <div><p className="text-[10px] font-black uppercase opacity-80">Ración diaria</p><p className="text-3xl font-black">{porcion || "---"} g</p></div>
              <Utensils size={48} className="opacity-20" />
            </div>

            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 space-y-4">
              <div className="flex items-center gap-2 text-blue-900 font-black text-xs uppercase tracking-widest"><Wallet size={16} /> Pet Finance</div>
              <div className="flex gap-2">
                <input type="number" placeholder="Precio ($)" className="w-1/2 p-3 rounded-xl border border-blue-200 font-bold outline-none" value={precioInput} onChange={e => setPrecioInput(e.target.value)} onBlur={sincronizarFinanzas} />
                <input type="number" placeholder="Bolsa (kg)" className="w-1/2 p-3 rounded-xl border border-blue-200 font-bold outline-none" value={pesoBolsaInput} onChange={e => setPesoBolsaInput(e.target.value)} onBlur={sincronizarFinanzas} />
              </div>

              {calcularCostoDiario() && (
                <div className="bg-white p-3 rounded-xl border-2 border-blue-100 text-center">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-tighter leading-none mb-1">Costo Diario Estimado</p>
                  <p className="text-xl font-black text-blue-700">${calcularCostoDiario()}</p>
                </div>
              )}

              {!result.stockActivo && pesoBolsaInput && (
                <button
                  onClick={handleActivarBolsa}
                  className="w-full py-3 bg-orange-600 text-white rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 shadow-lg shadow-orange-100 animate-in fade-in"
                >
                  <Package size={14} /> ¡Empecé esta bolsa hoy!
                </button>
              )}

              {result.stockActivo && (
                <div className="bg-green-100 text-green-700 p-3 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase">
                  <CheckCircle size={14} /> Bolsa en seguimiento
                </div>
              )}

              <button onClick={handleBuscarPrecios} disabled={loadingBusqueda} className={`w-full py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-md ${loadingBusqueda ? 'bg-blue-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                {loadingBusqueda ? <Loader2 className="animate-spin" size={14} /> : <Search size={14} />} BUSCAR PRECIOS ONLINE
              </button>
            </div>
          </div>

          <div className={`inline-block px-5 py-2 rounded-xl text-xs font-black mb-4 uppercase shadow-sm border ${getGamaColor(result?.calidad)}`}>GAMA: {result?.calidad}</div>
          <p className="bg-orange-50 p-6 rounded-2xl mb-6 italic text-slate-800 text-center text-lg">"{result.veredicto}"</p>

          <div className="mb-8">
            <h3 className="font-black text-slate-800 flex items-center gap-2 mb-4 uppercase text-[10px] tracking-wider"><CheckCircle size={14} className="text-green-500" /> Ingredientes</h3>
            <div className="flex flex-wrap gap-2">{result?.ingredientes?.map((ing: string, i: number) => (<span key={i} className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-[11px] font-bold text-slate-600">{ing}</span>))}</div>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase text-[10px] tracking-wider"><MessageCircle size={14} className="text-blue-500" /> Opiniones</h3>
              <button onClick={handleBuscarResenas} disabled={loadingResenas} className="text-[9px] font-black text-blue-600 uppercase flex items-center gap-1">
                {loadingResenas ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />} {resenas.length > 0 ? "Actualizar" : "Ver reseñas"}
              </button>
            </div>
            {resenas.length > 0 && (
              <div className="grid gap-3">
                {resenas.map((r, i) => {
                  const isGood = r.toUpperCase().includes("BUENO:");
                  const textoLimpio = cleanMarkdown(r.split(':')[1]?.trim() || r);
                  return (
                    <div key={i} className={`p-4 rounded-2xl border-2 flex gap-3 items-start ${isGood ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'}`}>
                      <div className={`p-2 rounded-lg mt-1 ${isGood ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{isGood ? <ThumbsUp size={12} /> : <ThumbsDown size={12} />}</div>
                      <p className="text-xs font-bold text-slate-700 leading-relaxed">{textoLimpio}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button onClick={() => { setResult(null); onReset(); }} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black shadow-lg">FINALIZAR</button>
        </div>
      )}

      {/* MODALES DE PRECIOS Y MARCA (Sin cambios) */}
      {showPriceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative text-left animate-in zoom-in-95">
            <button onClick={() => setShowPriceModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900"><X size={24} /></button>
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-blue-100 p-3 rounded-2xl text-blue-600"><ShoppingBag size={24} /></div>
              <div><h3 className="text-xl font-black text-slate-800 tracking-tight leading-none">Ofertas Hoy</h3><p className="text-blue-500 font-bold text-[10px] uppercase mt-1">Precios en Argentina</p></div>
            </div>
            <div className="space-y-3 mb-8 max-h-[350px] overflow-y-auto pr-2">
              {busquedaResult?.split('\n')
                .filter(line => line.includes('|'))
                .map((line, index) => {
                  const fragmentos = line.split('|');
                  const partes = fragmentos.map(p => {
                    const valor = p.split(':')[1];
                    return valor ? valor.trim() : "---";
                  });
                  const tienda = cleanMarkdown(partes[0]);
                  const bolsa = cleanMarkdown(partes[1]);
                  const precio = cleanMarkdown(partes[2]);
                  const nota = cleanMarkdown(partes[3]);
                  return (
                    <div key={index} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm animate-in slide-in-from-bottom-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-black text-slate-800 text-[11px] uppercase tracking-tighter">{tienda}</span>
                        <span className="bg-blue-100 text-blue-700 text-[9px] font-black px-2 py-0.5 rounded-lg uppercase">{bolsa}</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-xl font-black text-blue-600 leading-none">{precio}</span>
                        <span className="text-[10px] text-slate-400 font-bold italic max-w-[50%] text-right">{nota}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
            <button onClick={() => setShowPriceModal(false)} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-lg">ENTENDIDO</button>
          </div>
        </div>
      )}

      {showBrandWarning && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl text-center">
            <div className="bg-amber-100 p-4 rounded-full text-amber-500 mx-auto mb-6 w-20 h-20 flex items-center justify-center shadow-sm"><AlertTriangle size={40} /></div>
            <h3 className="text-xl font-black text-slate-800 mb-3 tracking-tight">¡Falta la marca!</h3>
            <p className="text-slate-600 font-medium leading-relaxed mb-8">Escribí la marca manualmente para que la IA busque ofertas reales.</p>
            <button onClick={() => setShowBrandWarning(false)} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg">Entendido</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodScanner;