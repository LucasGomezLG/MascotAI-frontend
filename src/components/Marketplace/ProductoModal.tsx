import React, { useState } from 'react';
import { X, Camera as CameraIcon, Image as ImageIcon, Loader2, ShoppingBag, Trash2 } from 'lucide-react';
import { api } from '@/services/api';
import type { ProductoDTO } from '@/types/api.types';
import toast from 'react-hot-toast';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { useCameraPermissions } from '@/hooks/useCameraPermissions.ts';

interface ProductoModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProductoModal({ onClose, onSuccess }: ProductoModalProps) {
  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [archivos, setArchivos] = useState<File[]>([]);
  const { validarCamara, validarGaleria } = useCameraPermissions();
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: 0,
    categoria: 'Accesorios',
    contacto: '',
    stock: 1
  });

  const handleImageCapture = async (source: CameraSource) => {
    if (archivos.length >= 2) {
      toast.error("Máximo 2 fotos permitidas");
      return;
    }
    const ok = source === CameraSource.Camera ? await validarCamara() : await validarGaleria();
    if (!ok) return;

    try {
      const image = await Camera.getPhoto({
        quality: 90,
        resultType: CameraResultType.Uri,
        source,
        width: 1024,
        allowEditing: false
      });
      
      if (image.webPath) {
        setPreviews(prev => [...prev, image.webPath!]);
        const response = await fetch(image.webPath);
        const blob = await response.blob();
        const file = new File([blob], `producto_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setArchivos(prev => [...prev, file]);
      }
    } catch (error) {
      console.error("Error capturando imagen:", error);
    }
  };

  const removeFoto = (index: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
    setArchivos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.precio || !formData.contacto) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }

    setLoading(true);
    try {
      let fotosUrls: string[] = [];
      
      if (archivos.length > 0) {
        const uploadData = new FormData();
        archivos.forEach(file => uploadData.append('files', file));
        const uploadRes = await api.uploadProductoFotos(uploadData);
        fotosUrls = uploadRes.data;
      }

      const payload: ProductoDTO = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        precio: formData.precio,
        categoria: formData.categoria,
        contacto: formData.contacto.trim(),
        stock: formData.stock,
        fotos: fotosUrls
      };

      await api.crearProducto(payload);

      toast.success("¡Producto publicado!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error al crear producto", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-150 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl relative animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-900 transition-colors">
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="bg-orange-100 p-2.5 rounded-2xl text-orange-600">
            <ShoppingBag size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Vender</h2>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Marketplace MascotAI</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {previews.map((foto, index) => (
              <div key={index} className="relative h-16">
                <img src={foto} className="w-full h-full object-cover rounded-xl border-2 border-orange-50 shadow-sm" alt="Preview" />
                <button type="button" onClick={() => removeFoto(index)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white p-1 rounded-full shadow-lg"><Trash2 size={8} /></button>
              </div>
            ))}
            {previews.length < 2 && (
              <div className="flex gap-2 h-16 col-span-2">
                <button type="button" onClick={() => handleImageCapture(CameraSource.Camera)} className="flex-1 bg-orange-50 border-2 border-dashed border-orange-200 rounded-xl flex flex-col items-center justify-center text-orange-600 hover:bg-orange-100 transition-all">
                  <CameraIcon size={14} /><span className="text-[6px] font-black uppercase mt-0.5">Cámara</span>
                </button>
                <button type="button" onClick={() => handleImageCapture(CameraSource.Photos)} className="flex-1 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:bg-slate-100 transition-all">
                  <ImageIcon size={14} /><span className="text-[6px] font-black uppercase mt-0.5">Galería</span>
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <input
              required
              type="text"
              value={formData.nombre}
              onChange={e => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-orange-500/20 focus:bg-white outline-none transition-all font-bold text-sm text-slate-700"
              placeholder="Nombre del producto..."
            />

            <div className="grid grid-cols-2 gap-2">
              <input
                required
                type="number"
                value={formData.precio || ''}
                onChange={e => setFormData({ ...formData, precio: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-orange-500/20 focus:bg-white outline-none transition-all font-bold text-sm text-slate-700"
                placeholder="Precio $"
              />
              <select
                value={formData.categoria}
                onChange={e => setFormData({ ...formData, categoria: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-orange-500/20 focus:bg-white outline-none transition-all font-bold text-sm text-slate-700 appearance-none"
              >
                <option value="Accesorios">Accesorios</option>
                <option value="Alimento">Alimento</option>
                <option value="Salud">Salud</option>
                <option value="Juguetes">Juguetes</option>
                <option value="Otros">Otros</option>
              </select>
            </div>

            <input
              required
              type="tel"
              value={formData.contacto}
              onChange={e => setFormData({ ...formData, contacto: e.target.value })}
              className="w-full px-4 py-3 bg-orange-50 border-2 border-orange-100 rounded-xl focus:border-orange-500 focus:bg-white outline-none transition-all font-black text-sm text-orange-700 placeholder:text-orange-300"
              placeholder="WhatsApp de contacto..."
            />

            <textarea
              rows={2}
              value={formData.descripcion}
              onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-orange-500/20 focus:bg-white outline-none transition-all font-bold text-sm text-slate-700 resize-none"
              placeholder="Descripción breve..."
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full py-4 bg-orange-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-100 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : "PUBLICAR PRODUCTO"}
          </button>
        </form>
      </div>
    </div>
  );
}