import React, {useState} from 'react';
import {Edit2, PlusCircle, Save, Trash2, User, X} from 'lucide-react';
import {api} from '@/services/api.ts';
import type {MascotaDTO} from '@/types/api.types.ts';
import Swal from 'sweetalert2';
import {useUIStore} from '@/stores/uiStore';
import toast from 'react-hot-toast';

interface PetProfilesProps {
  mascotas: MascotaDTO[];
  onUpdate: () => void;
}

const PetProfiles = ({ mascotas, onUpdate }: PetProfilesProps) => {
  const { togglePetModal, setZoomedPhoto } = useUIStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<MascotaDTO>>({});

  const startEdit = (pet: MascotaDTO) => {
    setEditingId(pet.id || null);
    setFormData({ ...pet });
  };

  const handleSave = async () => {
    if (!formData.id) return;
    
    const pesoNum = Number(formData.peso);

    if (formData.peso && (pesoNum < 0.1 || pesoNum > 100 || String(formData.peso).length > 4)) {
      void Swal.fire({ title: 'Peso inválido', text: 'Rango: 0.1 - 100 kg.', icon: 'error', confirmButtonColor: '#f97316' });
      return;
    }

    if (!formData.nombre?.trim()) {
      void Swal.fire({ title: 'Falta el nombre', icon: 'warning', confirmButtonColor: '#f97316' });
      return;
    }

    try {
      const payload: MascotaDTO = {
        id: formData.id,
        nombre: formData.nombre || '',
        especie: formData.especie || 'Perro',
        fechaNacimiento: formData.fechaNacimiento || '',
        peso: pesoNum,
        condicion: formData.condicion?.trim() || "Sano",
        foto: formData.foto || '',
        edad: formData.edad || 0
      };

      await toast.promise(
        api.actualizarMascota(formData.id, payload),
        {
          loading: 'Guardando...',
          success: <b>¡Guardado!</b>,
          error: <b>No se pudo guardar.</b>,
        }
      );
      
      setEditingId(null);
      onUpdate();
    } catch (err) {
      // El interceptor de Axios en api.ts se encargará de mostrar el error
      console.error("Error en [PetProfiles]:", err);
    }
  };

  const handleBorrar = (id: string, nombre: string) => {
    void Swal.fire({
      title: `¿Borrar a ${nombre}?`,
      text: "Acción irreversible.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Sí, borrar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        void toast.promise(
          api.borrarMascota(id),
          {
            loading: 'Borrando...',
            success: <b>¡Borrado!</b>,
            error: <b>No se pudo borrar.</b>,
          }
        ).then(() => onUpdate());
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 text-left">
      <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Mis Mascotas</h2>

      <div className="grid gap-4">
        {mascotas.map((pet, index) => (
          <div key={pet.id || index} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 relative overflow-hidden">
            {editingId === pet.id ? (
              <div className="space-y-4">
                <input
                  maxLength={20}
                  className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-orange-100 outline-none focus:border-orange-500 transition-all"
                  value={formData.nombre || ''}
                  onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                />
                <div className="flex gap-2">
                  <input
                    type="number" step="0.1"
                    className="w-1/3 p-3 bg-slate-50 rounded-xl font-bold border-2 border-orange-100 outline-none focus:border-orange-500"
                    value={formData.peso || ''}
                    onChange={e => e.target.value.length <= 4 && setFormData({ ...formData, peso: Number(e.target.value) })}
                  />
                  <input
                    type="text" maxLength={20}
                    className="w-2/3 p-3 bg-slate-50 rounded-xl font-bold border-2 border-orange-100 outline-none focus:border-orange-500 text-sm"
                    value={formData.condicion || ''}
                    onChange={e => setFormData({ ...formData, condicion: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSave} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-black flex items-center justify-center gap-2 active:scale-95 transition-all"><Save size={18} /> GUARDAR</button>
                  <button onClick={() => setEditingId(null)} className="p-3 bg-slate-100 text-slate-400 rounded-xl active:scale-95"><X size={18} /></button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div onClick={() => pet.foto && setZoomedPhoto(pet.foto)} className="w-16 h-16 bg-orange-100 rounded-3xl border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-orange-600 cursor-zoom-in active:scale-95 relative">
                    <User size={32} className="absolute opacity-50" />
                    {pet.foto && <img src={pet.foto} className="w-full h-full object-cover z-10" alt={pet.nombre} />}
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-slate-800 leading-none">{pet.nombre}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{pet.especie} • {pet.edad || 0} años</p>
                    <div className="flex gap-2 mt-2">
                      <span className="px-3 py-1 bg-orange-50 text-orange-600 text-[8px] font-black rounded-lg border border-orange-100 uppercase">{pet.condicion || "Sano"}</span>
                      {pet.peso > 0 && <span className="px-3 py-1 bg-slate-50 text-slate-500 text-[8px] font-black rounded-lg border border-slate-100 uppercase">{pet.peso} kg</span>}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => startEdit(pet)} className="p-2 text-slate-300 hover:text-orange-500 transition-colors"><Edit2 size={18} /></button>
                  <button onClick={() => handleBorrar(pet.id!, pet.nombre)} className="p-2 text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={() => togglePetModal(true)}
        className="w-full py-5 border-4 border-dashed border-slate-200 rounded-[2.5rem] text-slate-300 font-black uppercase flex items-center justify-center gap-2 hover:border-orange-200 hover:text-orange-300 transition-all active:scale-[0.98]"
      >
        <PlusCircle size={24} /> Agregar Nueva Mascota
      </button>
    </div>
  );
};

export default PetProfiles;