import React, { useState, useEffect, useCallback } from 'react';
import {Dog, Globe, Heart, MapPin, Plus, User as UserIcon, RefreshCw} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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
  refreshData: () => void | Promise<void>;
  isLoading?: boolean;
}

const SkeletonCard = () => (
  <div className="min-w-70 w-full h-95 bg-slate-200 animate-pulse rounded-4xl" />
);

const EmptyState = ({ 
  title, 
  description, 
  icon: Icon, 
  actionLabel, 
  onAction,
  colorClass
}: { 
  title: string; 
  description: string; 
  icon: LucideIcon; 
  actionLabel: string; 
  onAction: () => void;
  colorClass: string;
}) => (
  <div className="w-full py-12 px-6 bg-white rounded-4xl border-2 border-dashed border-slate-200 flex flex-col items-center text-center gap-4">
    <div className={`p-4 rounded-3xl ${colorClass} bg-opacity-10`}>
      <Icon size={32} className={colorClass.replace('bg-', 'text-')} />
    </div>
    <div className="space-y-1">
      <h3 className="font-black uppercase text-slate-800 text-sm tracking-tight">{title}</h3>
      <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-50">{description}</p>
    </div>
    <button 
      onClick={onAction}
      className={`mt-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all active:scale-95 shadow-sm ${colorClass} text-white`}
    >
      {actionLabel}
    </button>
  </div>
);

export default function HomeContent({
  mascotas = [], setActiveTab,
  soloCercanas, setSoloCercanas, soloMisPublicaciones, setSoloMisPublicaciones,
  perdidosFiltrados = [], adopcionesFiltradas = [], refugiosFiltrados = [],
  user,
  locationPermissionGranted, obtenerUbicacion,
  refreshData,
  isLoading = false
}: HomeContentProps) {
  
  const { setZoomedPhoto, toggleLostPetModal, toggleAdoptionModal, toggleRefugioModal, setItemToDelete } = useUIStore();
  const [activeSection, setActiveSection] = useState<SectionType>(null);
  const [showSecondaryFilters, setShowSecondaryFilters] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 150) {
        setShowSecondaryFilters(false);
      } else if (currentScrollY < lastScrollY) {
        setShowSecondaryFilters(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshData();
    setTimeout(() => setIsRefreshing(false), 1000);
  }, [refreshData]);

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
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Mis Mascotas</h2>
          <button 
            onClick={handleRefresh}
            className={`p-2 text-slate-400 hover:text-orange-500 transition-all ${isRefreshing ? 'animate-spin text-orange-500' : ''}`}
          >
            <RefreshCw size={18} />
          </button>
        </div>
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

      <div className="sticky top-18 z-30 -mx-6 px-6 py-3 bg-slate-50/90 backdrop-blur-md flex flex-col gap-3 border-b border-slate-200/50 transition-all duration-300">
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

        <div className={`flex items-center justify-between overflow-hidden transition-all duration-300 ease-in-out ${showSecondaryFilters ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
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
              {isLoading ? (
                [1, 2, 3].map(i => <SkeletonCard key={i} />)
              ) : perdidosFiltrados.length > 0 ? (
                perdidosFiltrados.map(p => <LostPetCard key={p.id} reporte={p} currentUser={user} onDelete={() => setItemToDelete({ id: p.id!, tipo: 'perdido' })} />)
              ) : (
                <EmptyState 
                  title="Sin reportes"
                  description="No hay mascotas perdidas cerca. ¡Qué buena noticia! O publica una si sabes de alguna."
                  icon={MapPin}
                  actionLabel="Reportar Perdido"
                  onAction={() => toggleLostPetModal(true)}
                  colorClass="bg-red-500"
                />
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
              {isLoading ? (
                [1, 2, 3].map(i => <SkeletonCard key={i} />)
              ) : adopcionesFiltradas.length > 0 ? (
                adopcionesFiltradas.map(a => <AdoptionCard key={a.id} mascota={a} currentUser={user} onDelete={() => setItemToDelete({ id: a.id!, tipo: 'adopcion' })} />)
              ) : (
                <EmptyState 
                  title="Sin adopciones"
                  description="No hay mascotas buscando hogar en este momento. Vuelve pronto."
                  icon={Heart}
                  actionLabel="Dar en Adopción"
                  onAction={() => toggleAdoptionModal(true)}
                  colorClass="bg-emerald-500"
                />
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
              {isLoading ? (
                [1, 2, 3].map(i => <SkeletonCard key={i} />)
              ) : refugiosFiltrados.length > 0 ? (
                refugiosFiltrados.map(r => <RefugioCard key={r.id} refugio={r} currentUser={user} onDelete={() => setItemToDelete({ id: r.id!, tipo: 'refugio' })} />)
              ) : (
                <EmptyState 
                  title="Sin refugios"
                  description="No encontramos refugios registrados en esta zona todavía."
                  icon={Globe}
                  actionLabel="Registrar Refugio"
                  onAction={() => toggleRefugioModal(true)}
                  colorClass="bg-violet-500"
                />
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
