import React, { useState } from 'react';
import { User, Edit2, Save, X, PlusCircle, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import Swal from 'sweetalert2';

const PetProfiles = ({ mascotas, onUpdate, onAddClick }: any) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null); // ✅ Nuevo estado

  const startEdit = (pet: any) => {
    setEditingId(pet.id);
    setFormData({ ...pet });
  };

  const handleSave = async () => {
    const pesoNum = parseFloat(formData.peso);

    // 🛡️ VALIDACIÓN DE RANGO Y LONGITUD (Ahora con 4 caracteres)
    if (formData.peso && (pesoNum < 0.1 || pesoNum > 100 || formData.peso.toString().length > 4)) {
      Swal.fire({
        title: 'Peso inválido',
        text: 'El peso debe estar entre 0.1 y 100 kg (ej: 12.5 o 9.75).',
        icon: 'error',
        confirmButtonColor: '#f97316'
      });
      return;
    }

    // 🛡️ 2. Validación de nombre obligatorio
    if (!formData.nombre.trim()) {
      Swal.fire({
        title: 'Falta el nombre',
        text: '¡No podés dejar a tu mascota sin nombre!',
        icon: 'warning',
        confirmButtonColor: '#f97316'
      });
      return;
    }

    try {
      // ✅ Lógica de Fallback para condición
      const dataAEnviar = {
        ...formData,
        condicion: formData.condicion?.trim() || "Sano"
      };

      await api.guardarPerfil(dataAEnviar);

      Swal.fire({
        title: '¡Cambios guardados!',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });

      setEditingId(null);
      onUpdate();
    } catch (e) {
      console.error("Error al guardar", e);
      Swal.fire('Error', 'No pudimos actualizar el perfil.', 'error');
    }
  };

  const handleBorrar = (id: string, nombre: string) => {
    Swal.fire({
      title: `¿Borrar a ${nombre}?`,
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#cbd5e1',
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        api.borrarMascota(id).then(() => onUpdate());
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Mis Mascotas</h2>

      <div className="grid gap-4">
        {mascotas.map((pet: any) => (
          <div key={pet.id} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 relative overflow-hidden">
            {editingId === pet.id ? (
              /* --- MODO EDICIÓN (Con Blindajes) --- */
              <div className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-tighter">Nombre</label>
                  <input
                    maxLength={20} // 🛡️ Blindaje estético
                    className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-orange-100 outline-none focus:border-orange-500 transition-all"
                    value={formData.nombre}
                    onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </div>

                <div className="flex gap-2">
                  <div className="w-1/3 space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-tighter">Peso (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="12.5"
                      // 🛡️ BLINDAJE ACTUALIZADO: Subimos a 4 caracteres para permitir decimales
                      className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-orange-100 outline-none focus:border-orange-500"
                      value={formData.peso}
                      onChange={e => {
                        if (e.target.value.length <= 4) {
                          setFormData({ ...formData, peso: e.target.value });
                        }
                      }}
                    />
                  </div>

                  <div className="w-2/3 space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-tighter">Estado de Salud</label>
                    <input
                      type="text"
                      maxLength={20} // 🛡️ Blindaje para etiquetas prolijas
                      placeholder="Sano (o ej: Alergias, Dieta...)"
                      className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-orange-100 outline-none focus:border-orange-500 text-sm"
                      value={formData.condicion}
                      onChange={e => setFormData({ ...formData, condicion: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button onClick={handleSave} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-black flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-green-100 transition-all">
                    <Save size={18} /> GUARDAR
                  </button>
                  <button onClick={() => setEditingId(null)} className="p-3 bg-slate-100 text-slate-400 rounded-xl active:scale-95 hover:bg-slate-200 transition-all">
                    <X size={18} />
                  </button>
                </div>
              </div>
            ) : (
              /* --- MODO VISTA (Con Zoom) --- */
              <div className="flex justify-between items-center text-left">
                <div className="flex items-center gap-4">
                  {/* Contenedor de foto con Zoom */}
                  <div
                    onClick={() => pet.foto && setZoomedPhoto(pet.foto)}
                    className="w-16 h-16 bg-orange-100 rounded-3xl border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-orange-600 relative cursor-zoom-in active:scale-95 transition-all group"
                  >
                    <User size={32} className="absolute opacity-50" />
                    {pet.foto && (
                      <img
                        src={pet.foto}
                        alt={pet.nombre}
                        className="w-full h-full object-cover z-10 relative group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                  </div>

                  <div>
                    <h3 className="font-black text-lg text-slate-800 leading-none">{pet.nombre}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                      {pet.especie} • {pet.edad || 0} años
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span className="px-3 py-1 bg-orange-50 text-orange-600 text-[8px] font-black rounded-lg uppercase border border-orange-100">
                        {pet.condicion || "Sano"}
                      </span>
                      {pet.peso > 0 && (
                        <span className="px-3 py-1 bg-slate-50 text-slate-500 text-[8px] font-black rounded-lg uppercase border border-slate-100">
                          {pet.peso} kg
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button onClick={() => startEdit(pet)} className="p-2 text-slate-300 hover:text-orange-500 transition-colors">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleBorrar(pet.id, pet.nombre)} className="p-2 text-slate-200 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ✅ MODAL DE ZOOM (Sincronizado con el diseño de App.tsx) */}
      {zoomedPhoto && (
        <div
          className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300 cursor-zoom-out"
          onClick={() => setZoomedPhoto(null)}
        >
          <img
            src={zoomedPhoto}
            className="max-w-full max-h-[85vh] rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-500 object-contain border-4 border-white/10"
            alt="Zoom Mascota"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <button
        onClick={onAddClick}
        className="w-full py-5 border-4 border-dashed border-slate-200 rounded-[2.5rem] text-slate-300 font-black uppercase flex items-center justify-center gap-2 hover:border-orange-200 hover:text-orange-300 transition-all active:scale-[0.98]"
      >
        <PlusCircle size={24} /> Agregar Nueva Mascota
      </button>
    </div>
  );
};

export default PetProfiles;