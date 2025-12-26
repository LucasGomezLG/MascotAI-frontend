import React, { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../../services/api';

const PetModal = ({ onClose }: { onClose: () => void }) => {
  const [nuevaMascota, setNuevaMascota] = useState({ 
    nombre: '', especie: 'Gato', edad: '', peso: '', condicion: 'Sano' 
  });

  const guardar = async () => {
    if (!nuevaMascota.nombre || !nuevaMascota.peso) return alert("Completá los datos");
    try {
      await api.guardarPerfil(nuevaMascota);
      onClose(); // Cierra y refresca la lista global
    } catch (e) { alert("Error al guardar"); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 text-left">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900"><X size={24} /></button>
        <h3 className="text-2xl font-black text-slate-800 mb-6 tracking-tight">Nueva Mascota</h3>
        <div className="space-y-4">
          <input placeholder="Nombre" className="w-full p-4 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-orange-500 outline-none" 
                 onChange={e => setNuevaMascota({ ...nuevaMascota, nombre: e.target.value })} />
          <select className="w-full p-4 bg-slate-50 rounded-xl font-bold outline-none" 
                  value={nuevaMascota.especie} onChange={e => setNuevaMascota({ ...nuevaMascota, especie: e.target.value })}>
            <option value="Gato">Gato 🐈</option>
            <option value="Perro">Perro 🐕</option>
          </select>
          <div className="flex gap-2">
            <input type="number" placeholder="Edad" className="w-1/2 p-4 bg-slate-50 rounded-xl font-bold border-2 focus:border-orange-500 outline-none" 
                   onChange={e => setNuevaMascota({ ...nuevaMascota, edad: e.target.value })} />
            <input type="number" step="0.1" placeholder="Peso (kg)" className="w-1/2 p-4 bg-slate-50 rounded-xl font-bold border-2 focus:border-orange-500 outline-none" 
                   onChange={e => setNuevaMascota({ ...nuevaMascota, peso: e.target.value })} />
          </div>
          <select className="w-full p-4 bg-slate-50 rounded-xl font-bold outline-none" 
                  onChange={e => setNuevaMascota({ ...nuevaMascota, condicion: e.target.value })}>
            <option value="Sano">Sano</option>
            <option value="Obesidad">Obesidad</option>
            <option value="Problemas renales">Problemas renales</option>
            <option value="Alergias">Alergias</option>
            <option value="Problemas urinarios">Problemas urinarios</option>
            <option value="Sin problemas">Sin problemas</option>
          </select>
          <button onClick={guardar} className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black shadow-lg shadow-orange-100 hover:bg-orange-700 active:scale-95 transition-all">REGISTRAR</button>
        </div>
      </div>
    </div>
  );
};
export default PetModal;