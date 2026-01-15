import React from 'react';
import { Dog, Plus, MapPin, User as UserIcon, Heart, Globe } from 'lucide-react';
import LostPetCard from '../LostPet/LostPetCard';
import AdoptionCard from '../AdoptionPet/AdoptionCard';
import RefugioCard from '../Refugio/RefugioCard';
// ✅ Importamos los DTOs para que el componente sepa que los datos están ahí
import type { 
  MascotaDTO, 
  ItemComunidad, 
  UserDTO, 
  MascotaPerdidaDTO, 
  MascotaAdopcionDTO, 
  RefugioDTO 
} from '../../types/api.types';

interface HomeContentProps {
  mascotas: MascotaDTO[];
  setActiveTab: (tab: any) => void;
  setZoomedPhoto: (photo: string) => void;
  soloCercanas: boolean;
  setSoloCercanas: (val: boolean) => void;
  soloMisPublicaciones: boolean;
  setSoloMisPublicaciones: (val: boolean) => void;
  // ✅ Usamos Intersección (&) para no perder los campos específicos (nombre, edad, etc)
  perdidosFiltrados: (ItemComunidad & MascotaPerdidaDTO)[];
  adopcionesFiltradas: (ItemComunidad & MascotaAdopcionDTO)[];
  refugiosFiltrados: (ItemComunidad & RefugioDTO)[];
  setShowLostPetModal: (val: boolean) => void;
  setShowAdoptionModal: (val: boolean) => void;
  setShowRefugioModal: (val: boolean) => void;
  user: UserDTO;
  abrirConfirmacionBorrado: (id: string, tipo: string) => void;
  userCoords: { lat: number, lng: number } | null;
  locationPermissionGranted: boolean;
  obtenerUbicacion: () => Promise<void>;
}

export default function HomeContent({
  mascotas = [], setActiveTab, setZoomedPhoto,
  soloCercanas, setSoloCercanas, soloMisPublicaciones, setSoloMisPublicaciones,
  perdidosFiltrados = [], adopcionesFiltradas = [], refugiosFiltrados = [],
  setShowLostPetModal, setShowAdoptionModal, setShowRefugioModal,
  user, abrirConfirmacionBorrado,
  locationPermissionGranted, obtenerUbicacion
}: HomeContentProps) {
  
  const totalResultados = perdidosFiltrados.length + adopcionesFiltradas.length + refugiosFiltrados.length;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* --- SECCIÓN: MIS MASCOTAS (Sin cambios) --- */}
      <section className="space-y-4">
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Mis Mascotas</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {mascotas.map(pet => (
            <div key={pet.id} className="flex flex-col items-center gap-2 min-w-[80px]">
              <div
                onClick={() => pet.foto && setZoomedPhoto(pet.foto)}
                className="w-20 h-20 rounded-[2rem] border-4 border-white shadow-md overflow-hidden bg-orange-100 flex items-center justify-center text-orange-600 cursor-zoom-in active:scale-95 transition-transform"
              >
                {pet.foto ? <img src={pet.foto} alt={pet.nombre} className="w-full h-full object-cover" /> : <Dog size={32} />}
              </div>
              <span className="text-[10px] font-black uppercase text-slate-600 tracking-tight truncate w-full text-center">{pet.nombre}</span>
            </div>
          ))}
          <div className="flex flex-col items-center gap-2 min-w-[80px]">
            <button
              onClick={() => setActiveTab('pets')}
              className="w-20 h-20 rounded-[2rem] border-4 border-dashed border-slate-200 bg-white flex items-center justify-center text-slate-300 hover:text-orange-500 hover:border-orange-200 transition-all active:scale-90"
            >
              <Plus size={32} strokeWidth={3} />
            </button>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-tight">Nuevo</span>
          </div>
        </div>
      </section>

      {/* --- BARRA DE FILTROS STICKY (Sin cambios) --- */}
      <div className="sticky top-[72px] z-30 -mx-6 px-6 py-4 bg-slate-50/80 backdrop-blur-md flex items-center justify-between border-b border-slate-200/50">
        <div className="flex gap-2">
          <button
            onClick={() => !locationPermissionGranted ? obtenerUbicacion() : setSoloCercanas(!soloCercanas)}
            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-1.5 
              ${!locationPermissionGranted ? 'bg-slate-200 text-slate-500' : soloCercanas ? 'bg-red-500 text-white shadow-md' : 'bg-slate-800 text-white shadow-md'}`}
          >
            <MapPin size={12} />
            {!locationPermissionGranted ? "GPS" : soloCercanas ? "Cercanas (15km)" : "Todo"}
          </button>
          <button
            onClick={() => setSoloMisPublicaciones(!soloMisPublicaciones)}
            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-1.5 ${soloMisPublicaciones ? 'bg-slate-800 text-white' : 'bg-slate-200/50 text-slate-500'}`}
          >
            <UserIcon size={12} /> Mis Publicaciones
          </button>
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase">{totalResultados} Resultados</p>
      </div>

      {/* --- SECCIÓN: PERDIDOS --- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-600">
            <MapPin size={20} />
            <h2 className="text-lg font-black uppercase tracking-tighter">Perdidos</h2>
          </div>
          <button onClick={() => setShowLostPetModal(true)} className="p-2 bg-red-50 text-red-600 rounded-xl active:scale-90"><Plus size={20} /></button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {perdidosFiltrados.length > 0 ? (
            // ✅ id! asegura que el string no sea undefined
            perdidosFiltrados.map(p => <LostPetCard key={p.id} reporte={p} currentUser={user} onDelete={() => abrirConfirmacionBorrado(p.id!, 'perdido')} />)
          ) : (
            <div className="w-full h-32 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex items-center justify-center font-black text-[10px] text-slate-400 uppercase tracking-widest">Sin reportes</div>
          )}
        </div>
      </section>

      {/* --- SECCIÓN: EN ADOPCIÓN --- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-600">
            <Heart size={20} />
            <h2 className="text-lg font-black uppercase tracking-tighter">En adopción</h2>
          </div>
          <button onClick={() => setShowAdoptionModal(true)} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl active:scale-90"><Plus size={20} /></button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {adopcionesFiltradas.length > 0 ? (
            // ✅ Ahora 'a' tiene nombre, especie, edad, etc. gracias a la intersección (&)
            adopcionesFiltradas.map(a => <AdoptionCard key={a.id} mascota={a} currentUser={user} onDelete={() => abrirConfirmacionBorrado(a.id!, 'adopcion')} />)
          ) : (
            <div className="w-full h-32 bg-emerald-50/30 rounded-[2.5rem] border-2 border-dashed border-emerald-100 flex items-center justify-center font-black text-[10px] text-emerald-400 uppercase tracking-widest">Sin publicaciones</div>
          )}
        </div>
      </section>

      {/* --- SECCIÓN: REFUGIOS --- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-violet-600">
            <Globe size={20} />
            <h2 className="text-lg font-black uppercase tracking-tighter">Refugios</h2>
          </div>
          <button onClick={() => setShowRefugioModal(true)} className="p-2 bg-violet-50 text-violet-600 rounded-xl active:scale-90"><Plus size={20} /></button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar">
          {refugiosFiltrados.length > 0 ? (
            refugiosFiltrados.map(r => <RefugioCard key={r.id} refugio={r} currentUser={user} onDelete={() => abrirConfirmacionBorrado(r.id!, 'refugio')} />)
          ) : (
            <div className="w-full h-32 bg-violet-50/30 rounded-[2.5rem] border-2 border-dashed border-violet-100 flex items-center justify-center font-black text-[10px] text-violet-400 uppercase tracking-widest">Sin refugios</div>
          )}
        </div>
      </section>
    </div>
  );
}