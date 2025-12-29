import React, { useState, useRef } from 'react';
import { X, Camera, Image as ImageIcon } from 'lucide-react';
import { api } from '../../services/api';

const PetModal = ({ onClose }: { onClose: () => void }) => {
  // ✅ Estado para el archivo real (Blob/File) que va al backend
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [nuevaMascota, setNuevaMascota] = useState({
    nombre: '',
    especie: 'Gato',
    fechaNacimiento: '',
    peso: '',
    condicion: 'Sano',
    foto: '' // Este se usa solo para la preview visual
  });

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ✅ Guardamos el archivo real para el FormData
    setSelectedFile(file);

    // Generamos la preview para la interfaz
    const reader = new FileReader();
    reader.onloadend = () => {
      setNuevaMascota({ ...nuevaMascota, foto: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const guardar = async () => {
    if (!nuevaMascota.nombre || !nuevaMascota.fechaNacimiento) {
      alert("Faltan datos obligatorios");
      return;
    }

    // ✅ Usamos FormData para enviar el archivo real, no el Base64
    const formData = new FormData();
    if (selectedFile) {
      formData.append('file', selectedFile);
    }

    formData.append('nombre', nuevaMascota.nombre);
    formData.append('especie', nuevaMascota.especie);
    formData.append('fechaNacimiento', nuevaMascota.fechaNacimiento);
    formData.append('peso', nuevaMascota.peso);
    formData.append('condicion', nuevaMascota.condicion);

    try {
      // ✅ Llamada al nuevo endpoint que creamos en el Service de Java
      await api.guardarPerfilConFoto(formData);
      onClose();
    } catch (e) {
      alert("Error al subir la imagen y registrar la mascota");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 text-left">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 z-10">
          <X size={24} />
        </button>

        <h3 className="text-2xl font-black text-slate-800 mb-6 tracking-tight">Nueva Mascota</h3>

        <div className="space-y-6">
          {/* SECCIÓN DE FOTO DE PERFIL CON PREVIEW */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-28 h-28">
              <div className="w-full h-full bg-slate-100 rounded-[2rem] border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
                {nuevaMascota.foto ? (
                  <img src={nuevaMascota.foto} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera size={32} className="text-slate-300" />
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 flex gap-1">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="bg-orange-600 text-white p-2 rounded-xl shadow-lg active:scale-90 transition-transform"
                >
                  <Camera size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="bg-slate-800 text-white p-2 rounded-xl shadow-lg active:scale-90 transition-transform"
                >
                  <ImageIcon size={16} />
                </button>
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Foto de perfil</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-2">Nombre</label>
              <input
                placeholder="Ej: Helena"
                className="w-full p-4 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-orange-500 outline-none transition-all"
                onChange={e => setNuevaMascota({ ...nuevaMascota, nombre: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-2">Especie</label>
              <select
                className="w-full p-4 bg-slate-50 rounded-xl font-bold outline-none border-2 border-transparent focus:border-orange-500"
                value={nuevaMascota.especie}
                onChange={e => setNuevaMascota({ ...nuevaMascota, especie: e.target.value })}
              >
                <option value="Gato">Gato 🐈</option>
                <option value="Perro">Perro 🐕</option>
              </select>
            </div>

            <div className="flex gap-2">
              <div className="w-1/2 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-2">Nacimiento</label>
                <input
                  type="date"
                  className="w-full p-4 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-orange-500 outline-none text-xs"
                  onChange={e => setNuevaMascota({ ...nuevaMascota, fechaNacimiento: e.target.value })}
                />
              </div>
              <div className="w-1/2 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-2">Peso (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="4.5"
                  className="w-full p-4 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-orange-500 outline-none"
                  onChange={e => setNuevaMascota({ ...nuevaMascota, peso: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-2">Estado de Salud</label>
              <select
                className="w-full p-4 bg-slate-50 rounded-xl font-bold outline-none border-2 border-transparent focus:border-orange-500"
                onChange={e => setNuevaMascota({ ...nuevaMascota, condicion: e.target.value })}
              >
                <option value="Sano">Sano</option>
                <option value="Obesidad">Obesidad (Adelina)</option>
                <option value="Alergias">Alergias (Helena)</option>
                <option value="Problemas renales">Problemas renales</option>
                <option value="Problemas urinarios">Problemas urinarios</option>
              </select>
            </div>

            <button
              onClick={guardar}
              className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black shadow-lg shadow-orange-100 hover:bg-orange-700 active:scale-95 transition-all mt-4"
            >
              REGISTRAR
            </button>
          </div>
        </div>

        {/* Inputs ocultos activados por los botones de arriba */}
        <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
        <input type="file" ref={galleryInputRef} accept="image/*" className="hidden" onChange={handleFile} />
      </div>
    </div>
  );
};

export default PetModal;