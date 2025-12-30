import React, { useState, useRef } from 'react';
import { X, Camera, Image as ImageIcon } from 'lucide-react';
import { api } from '../../services/api';
import Swal from 'sweetalert2'; // ✅ Importamos SweetAlert

const PetModal = ({ onClose }: { onClose: () => void }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [nuevaMascota, setNuevaMascota] = useState({
    nombre: '',
    especie: 'Gato',
    fechaNacimiento: '',
    peso: '',
    condicion: '',
    foto: ''
  });

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const hoy = new Date().toISOString().split("T")[0];

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      // ✅ Alerta linda para el tamaño de foto
      Swal.fire({
        title: '¡Foto muy pesada!',
        text: 'El límite es de 10MB para cuidar el almacenamiento.',
        icon: 'warning',
        confirmButtonColor: '#ea580c', // Color orange-600 de tu tema
      });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setNuevaMascota({ ...nuevaMascota, foto: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const guardar = async () => {
    // 🛡️ Validaciones con SweetAlert
    if (!nuevaMascota.nombre.trim() || !nuevaMascota.fechaNacimiento) {
      Swal.fire({
        title: 'Faltan datos',
        text: 'El nombre y la fecha son obligatorios.',
        icon: 'info',
        confirmButtonColor: '#ea580c',
      });
      return;
    }

    if (nuevaMascota.fechaNacimiento > hoy) {
      Swal.fire({
        title: 'Fecha inválida',
        text: 'La fecha de nacimiento no puede ser futura.',
        icon: 'error',
        confirmButtonColor: '#ea580c',
      });
      return;
    }

    const pesoNum = parseFloat(nuevaMascota.peso);
    if (nuevaMascota.peso && (pesoNum < 0.1 || pesoNum > 100)) {
      Swal.fire({
        title: 'Peso fuera de rango',
        text: 'Por favor, ingresá un peso entre 0.1 y 100 kg.',
        icon: 'warning',
        confirmButtonColor: '#ea580c',
      });
      return;
    }

    const condicionFinal = nuevaMascota.condicion.trim() || "Sano";
    const formData = new FormData();
    if (selectedFile) formData.append('file', selectedFile);
    formData.append('nombre', nuevaMascota.nombre);
    formData.append('especie', nuevaMascota.especie);
    formData.append('fechaNacimiento', nuevaMascota.fechaNacimiento);
    formData.append('peso', nuevaMascota.peso);
    formData.append('condicion', condicionFinal);

    try {
      await api.guardarPerfilConFoto(formData);

      // ✅ Alerta de éxito total
      Swal.fire({
        title: '¡Mascota registrada!',
        text: `${nuevaMascota.nombre} ya es parte de MascotAI`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });

      onClose();
    } catch (e) {
      Swal.fire({
        title: 'Error de conexión',
        text: 'No pudimos guardar los datos. Intentá de nuevo más tarde.',
        icon: 'error',
        confirmButtonColor: '#ea580c',
      });
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
          {/* SECCIÓN FOTO */}
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
                <button type="button" onClick={() => cameraInputRef.current?.click()} className="bg-orange-600 text-white p-2 rounded-xl shadow-lg active:scale-90 transition-transform"><Camera size={16} /></button>
                <button type="button" onClick={() => galleryInputRef.current?.click()} className="bg-slate-800 text-white p-2 rounded-xl shadow-lg active:scale-90 transition-transform"><ImageIcon size={16} /></button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-2">Nombre</label>
              <input
                placeholder="Ej: Helena"
                maxLength={20}
                className="w-full p-4 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-orange-500 outline-none transition-all"
                value={nuevaMascota.nombre}
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
                  max={hoy}
                  className="w-full p-4 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-orange-500 outline-none text-xs"
                  onChange={e => setNuevaMascota({ ...nuevaMascota, fechaNacimiento: e.target.value })}
                />
              </div>
              <div className="w-1/2 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-2">Peso (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100"
                  placeholder="4.5"
                  className="w-full p-4 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-orange-500 outline-none"
                  value={nuevaMascota.peso}
                  onChange={e => setNuevaMascota({ ...nuevaMascota, peso: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-2">Estado de Salud</label>
              <input
                type="text"
                maxLength={20}
                placeholder="Ej: Sano, Alergias..."
                className="w-full p-4 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-orange-500 outline-none transition-all text-sm"
                value={nuevaMascota.condicion}
                onChange={e => setNuevaMascota({ ...nuevaMascota, condicion: e.target.value })}
              />
              <p className="text-[8px] text-slate-400 ml-2 italic">* Si queda vacío se guardará como "Sano"</p>
            </div>

            <button
              onClick={guardar}
              className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black shadow-lg shadow-orange-100 hover:bg-orange-700 active:scale-95 transition-all mt-4"
            >
              REGISTRAR
            </button>
          </div>
        </div>

        <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
        <input type="file" ref={galleryInputRef} accept="image/*" className="hidden" onChange={handleFile} />
      </div>
    </div>
  );
};

export default PetModal;