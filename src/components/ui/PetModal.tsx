import React, { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../../services/api';

const PetModal = ({ onClose }: { onClose: () => void }) => {
  // ✅ ACTUALIZADO: Cambiamos 'edad' por 'fechaNacimiento' para que coincida con Mascota.java
  const [nuevaMascota, setNuevaMascota] = useState({ 
    nombre: '', 
    especie: 'Gato', 
    fechaNacimiento: '', 
    peso: '', 
    condicion: 'Sano' 
  });

  const guardar = async () => {
    // Validación actualizada para incluir la fecha
    if (!nuevaMascota.nombre || !nuevaMascota.peso || !nuevaMascota.fechaNacimiento) {
      return alert("Completá todos los datos, incluyendo el nacimiento");
    }

    try {
      // Guardamos el perfil con la fecha real en la Base de Datos
      await api.guardarPerfil(nuevaMascota);
      onClose(); 
    } catch (e) { 
      alert("Error al guardar la mascota"); 
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 text-left">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900">
          <X size={24} />
        </button>
        
        <h3 className="text-2xl font-black text-slate-800 mb-6 tracking-tight">Nueva Mascota</h3>
        
        <div className="space-y-4">
          {/* Nombre */}
          <div className="space-y-1">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-2">Nombre</label>
             <input 
               placeholder="Ej: Helena" 
               className="w-full p-4 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-orange-500 outline-none transition-all" 
               onChange={e => setNuevaMascota({ ...nuevaMascota, nombre: e.target.value })} 
             />
          </div>

          {/* Especie */}
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

          {/* Fila: Nacimiento y Peso */}
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

          {/* Condición de Salud */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-2">Estado de Salud</label>
            <select 
              className="w-full p-4 bg-slate-50 rounded-xl font-bold outline-none border-2 border-transparent focus:border-orange-500" 
              onChange={e => setNuevaMascota({ ...nuevaMascota, condicion: e.target.value })}
            >
              <option value="Sano">Sano</option>
              <option value="Obesidad">Obesidad</option>
              <option value="Alergias">Alergias</option>
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
    </div>
  );
};

export default PetModal;