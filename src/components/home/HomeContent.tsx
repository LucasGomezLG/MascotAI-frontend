import React, { useState } from 'react';
import {Dog, Globe, Heart, MapPin, Plus, User as UserIcon} from 'lucide-react';
import LostPetCard from '../LostPet/LostPetCard';
import AdoptionCard from '../AdoptionPet/AdoptionCard';
import RefugioCard from '../Refugio/RefugioCard';
import type {
    ItemComunidad,
    MascotaAdopcionDTO,
    MascotaDTO,
    MascotaPerdidaDTO,
    RefugioDTO,
    UserDTO
} from '@/types/api.types.ts';
import {useUIStore} from '@/stores/uiStore';

type TabType = 'home' | 'scanner' | 'stats' | 'vet' | 'health' | 'pets';
type SectionType = 'perdidos' | 'adopcion' | 'refugios' | null;

interface HomeContentProps {
  mascotas: MascotaDTO[];
  setActiveTab: (tab: TabType) => void;
  soloCercanas: boolean;
  setSoloCercanas: (val: boolean) => void;
  soloMisPublicaciones: boolean;
  setSoloMisPublicaciones: (val: boolean) => void;
  perdidosFiltrados: (ItemComunidad & MascotaPerdidaDTO)[];
  adopcionesFiltradas: (ItemComunidad & MascotaAdopcionDTO)[];
  refugiosFiltrados: (ItemComunidad & RefugioDTO)[];
  user: UserDTO;
  userCoords: { lat: number, lng: number } | null;
  locationPermissionGranted: boolean;
  obtenerUbicacion: () => Promise<void>;
}

export default function HomeContent({
  mascotas = [], setActiveTab,
  soloCercanas, setSoloCercanas, soloMisPublicaciones, setSoloMisPublicaciones,
  perdidosFiltrados = [], adopcionesFiltradas = [], refugiosFiltrados = [],
  user,
  locationPermissionGranted, obtenerUbicacion
}: HomeContentProps) {
  
  const { setZoomedPhoto, toggleLostPetModal, toggleAdoptionModal, toggleRefugioModal, setItemToDelete } = useUIStore();
  const [activeSection, setActiveSection] = useState<SectionType>(null);

  const totalResultados = 
    activeSection === null ? (perdidosFiltrados.length + adopcionesFiltradas.length + refugiosFiltrados.length) :
    activeSection === 'perdidos' ? perdidosFiltrados.length :
    activeSection === 'adopcion' ? adopcionesFiltradas.length :
    refugiosFiltrados.length;

  const handleSectionClick = (section: SectionType) => {
    setActiveSection(prev => prev === section ? null : section);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <section className="space-y-3">
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Mis Mascotas</h2>
        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
          {mascotas.map(pet => (
            <div key={pet.id} className="flex flex-col items-center gap-2 min-w-20">
              <div
                onClick={() => pet.foto && setZoomedPhoto(pet.foto)}
                className="w-20 h-20 rounded-4xl border-4 border-white shadow-md overflow-hidden bg-orange-100 flex items-center justify-center text-orange-600 cursor-zoom-in active:scale-95 transition-transform"
              >
                {pet.foto ? <img src={pet.foto} alt={pet.nombre} className="w-full h-full object-cover" /> : <Dog size={32} />}
              </div>
              <span className="text-[10px] font-black uppercase text-slate-600 tracking-tight truncate w-full text-center">{pet.nombre}</span>
            </div>
          ))}
          <div className="flex flex-col items-center gap-2 min-w-20">
            <button
              onClick={() => setActiveTab('pets')}
              className="w-20 h-20 rounded-4xl border-4 border-dashed border-slate-200 bg-white flex items-center justify-center text-slate-300 hover:text-orange-500 hover:border-orange-200 transition-all active:scale-90"
            >
              <Plus size={32} strokeWidth={3} />
            </button>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-tight">Nuevo</span>
          </div>
        </div>
      </section>

      <div className="sticky top-18 z-30 -mx-6 px-6 py-3 bg-slate-50/80 backdrop-blur-md flex flex-col gap-3 border-b border-slate-200/50">
        {/* Selector de Secciones con Iconos */}
        <div className="flex bg-slate-200/50 p-1 rounded-2xl gap-1">
          <button
            onClick={() => handleSectionClick('perdidos')}
            className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1.5 ${activeSection === 'perdidos' ? 'bg-red-500 text-white shadow-md' : 'text-slate-500 hover:bg-red-50'}`}
          >
            <MapPin size={12} strokeWidth={3} />
            Perdidos
          </button>
          <button
            onClick={() => handleSectionClick('adopcion')}
            className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1.5 ${activeSection === 'adopcion' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:bg-emerald-50'}`}
          >
            <Heart size={12} strokeWidth={3} />
            Adopción
          </button>
          <button
            onClick={() => handleSectionClick('refugios')}
            className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1.5 ${activeSection === 'refugios' ? 'bg-violet-500 text-white shadow-md' : 'text-slate-500 hover:bg-violet-50'}`}
          >
            <Globe size={12} strokeWidth={3} />
            Refugios
          </button>
        </div>

        <div className="flex items-center justify-between">
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
              <UserIcon size={12} /> Mis Public.
            </button>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase">{totalResultados} Resultados</p>
        </div>
      </div>

      <div className="space-y-10">
        {(activeSection === null || activeSection === 'perdidos') && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-600">
                <MapPin size={20} />
                <h2 className="text-lg font-black uppercase tracking-tighter">Perdidos</h2>
              </div>
              <button onClick={() => toggleLostPetModal(true)} className="p-2 bg-red-50 text-red-600 rounded-xl active:scale-90"><Plus size={20} /></button>
            </div>
            <div className={`flex ${activeSection ? 'flex-col items-center' : 'overflow-x-auto no-scrollbar'} gap-6 pb-4`}>
              {perdidosFiltrados.length > 0 ? (
                perdidosFiltrados.map(p => <LostPetCard key={p.id} reporte={p} currentUser={user} onDelete={() => setItemToDelete({ id: p.id!, tipo: 'perdido' })} />)
              ) : (
                <div className="w-full h-32 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex items-center justify-center font-black text-[10px] text-slate-400 uppercase tracking-widest">Sin reportes</div>
              )}
            </div>
          </section>
        )}

        {(activeSection === null || activeSection === 'adopcion') && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-600">
                <Heart size={20} />
                <h2 className="text-lg font-black uppercase tracking-tighter">En adopción</h2>
              </div>
              <button onClick={() => toggleAdoptionModal(true)} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl active:scale-90"><Plus size={20} /></button>
            </div>
            <div className={`flex ${activeSection ? 'flex-col items-center' : 'overflow-x-auto no-scrollbar'} gap-6 pb-4`}>
              {adopcionesFiltradas.length > 0 ? (
                adopcionesFiltradas.map(a => <AdoptionCard key={a.id} mascota={a} currentUser={user} onDelete={() => setItemToDelete({ id: a.id!, tipo: 'adopcion' })} />)
              ) : (
                <div className="w-full h-32 bg-emerald-50/30 rounded-[2.5rem] border-2 border-dashed border-emerald-100 flex items-center justify-center font-black text-[10px] text-emerald-400 uppercase tracking-widest">Sin publicaciones</div>
              )}
            </div>
          </section>
        )}

        {(activeSection === null || activeSection === 'refugios') && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-violet-600">
                <Globe size={20} />
                <h2 className="text-lg font-black uppercase tracking-tighter">Refugios</h2>
              </div>
              <button onClick={() => toggleRefugioModal(true)} className="p-2 bg-violet-50 text-violet-600 rounded-xl active:scale-90"><Plus size={20} /></button>
            </div>
            <div className={`flex ${activeSection ? 'flex-col items-center' : 'overflow-x-auto no-scrollbar'} gap-6 pb-10`}>
              {refugiosFiltrados.length > 0 ? (
                refugiosFiltrados.map(r => <RefugioCard key={r.id} refugio={r} currentUser={user} onDelete={() => setItemToDelete({ id: r.id!, tipo: 'refugio' })} />)
              ) : (
                <div className="w-full h-32 bg-violet-50/30 rounded-[2.5rem] border-2 border-dashed border-violet-100 flex items-center justify-center font-black text-[10px] text-violet-400 uppercase tracking-widest">Sin refugios</div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
