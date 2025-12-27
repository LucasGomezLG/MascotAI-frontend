import React, { useState, useRef } from 'react';
import { 
  Camera, Loader2, User, RefreshCw, Sparkles, X, 
  Image as ImageIcon, FileText, ClipboardList 
} from 'lucide-react';
import { api } from '../../../services/api';
import { Toast } from '../../../utils/alerts';

const ConsultationScanner = ({ mascotas, onScanComplete }: any) => {
  const [selectedPet, setSelectedPet] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
      e.target.value = ""; 
    };
    reader.readAsDataURL(file);
  };

  const handleScanDoc = async () => {
    if (!selectedImage) return;
    setLoading(true);
    try {
      // Usamos el endpoint de análisis de recetas/consultas
      const res = await api.analizarVet(selectedImage, "CONSULTA", selectedPet || "");
      setResult(res.data);
      if (onScanComplete) onScanComplete();
    } catch (e) {
      Toast.fire({ icon: 'error', title: 'Error al leer el documento' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      {!result ? (
        <div className="space-y-6 text-left">
          {/* Selector de Mascota */}
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
              <User size={14} /> Paciente
            </label>
            <select 
              value={selectedPet} 
              onChange={(e) => setSelectedPet(e.target.value)}
              className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50/50 font-bold outline-none text-slate-700 focus:border-blue-500"
            >
              <option value="">Análisis Genérico</option>
              {mascotas.map((p: any) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>

          {/* Recuadro de Captura */}
          <div 
            onClick={() => cameraInputRef.current?.click()}
            className="bg-white h-64 border-4 border-dashed border-blue-100 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer relative overflow-hidden"
          >
            {selectedImage ? (
              <>
                <img src={selectedImage} alt="Doc Preview" className="w-full h-full object-cover" />
                <button onClick={(e) => {e.stopPropagation(); setSelectedImage(null)}} className="absolute top-4 right-4 bg-white/90 p-2 rounded-full text-blue-600 z-10"><X size={20} /></button>
              </>
            ) : (
              <div className="text-center">
                <div className="bg-blue-50 p-5 rounded-full mb-4 inline-block"><FileText size={40} className="text-blue-200" /></div>
                <p className="text-blue-900/40 font-black uppercase text-[10px] px-6">Escaneá la receta o factura médica</p>
              </div>
            )}
          </div>

          {/* Botón Galería */}
          <button 
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="w-full py-3 rounded-2xl font-black text-xs uppercase bg-slate-100 text-slate-500 border-2 border-slate-200 flex items-center justify-center gap-2"
          >
            <ImageIcon size={16} /> O cargar desde galería
          </button>

          {/* Botón de Acción */}
          <button 
            onClick={handleScanDoc}
            disabled={loading || !selectedImage} 
            className={`w-full flex items-center justify-center gap-3 py-6 rounded-[2rem] font-black text-xl shadow-xl transition-all active:scale-95 ${
              loading || !selectedImage ? 'bg-blue-50 text-blue-200' : 'bg-blue-600 text-white shadow-blue-200'
            }`}
          >
            {loading ? <Loader2 className="animate-spin" /> : <><Sparkles size={22} /> PROCESAR DOCUMENTO</>}
          </button>
          
          <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFile} />
          <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" onChange={handleFile} />
        </div>
      ) : (
        /* Vista de lo que detectó en la consulta */
        <div className="p-8 bg-white rounded-[2.5rem] shadow-xl text-left">
             <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-100 p-3 rounded-2xl text-blue-600"><ClipboardList size={24} /></div>
                <h3 className="font-black text-slate-800 text-xl tracking-tight">Datos Extraídos</h3>
             </div>
             <p className="text-slate-600 text-sm mb-6">{result.observaciones || "Documento procesado correctamente."}</p>
             <button onClick={() => setResult(null)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black">ESCANEAR OTRO</button>
        </div>
      )}
    </div>
  );
};

export default ConsultationScanner;