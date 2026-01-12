import React from 'react';
import { Dog, PlusCircle, MapPin, User as UserIcon, Plus, Heart, Globe } from 'lucide-react';
import LostPetCard from '../LostPet/LostPetCard';
import AdoptionCard from '../AdoptionPet/AdoptionCard';
import RefugioCard from '../Refugio/RefugioCard'; // ✅ Asegúrate de que la ruta sea correcta

interface HomeContentProps {
  mascotas: any[];
  setActiveTab: (tab: any) => void;
  setZoomedPhoto: (photo: string) => void;
  soloCercanas: boolean;
  setSoloCercanas: (val: boolean) => void;
  soloMisPublicaciones: boolean;
  setSoloMisPublicaciones: (val: boolean) => void;
  perdidosFiltrados: any[];
  adopcionesFiltradas: any[];
  refugiosFiltrados?: any[]; // ✅ Nueva prop
  setShowLostPetModal: (val: boolean) => void;
  setShowAdoptionModal: (val: boolean) => void;
  setShowRefugioModal: (val: boolean) => void; // ✅ Nueva prop
  user: any;
  abrirConfirmacionBorrado: (id: string, tipo: any) => void;
  userCoords: { lat: number, lng: number } | null;
}

export default function HomeContent({
  mascotas = [], setActiveTab, setZoomedPhoto,
  soloCercanas, setSoloCercanas, soloMisPublicaciones, setSoloMisPublicaciones,
  perdidosFiltrados = [], adopcionesFiltradas = [], refugiosFiltrados = [], // ✅ Valor por defecto []
  setShowLostPetModal, setShowAdoptionModal, setShowRefugioModal,
  user, abrirConfirmacionBorrado
}: HomeContentProps) {
  
  // ✅ Cálculo seguro del total de resultados
  const totalResultados = (perdidosFiltrados?.length || 0) + 
                         (adopcionesFiltradas?.length || 0) + 
                         (refugiosFiltrados?.length || 0);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* 1. MIS MASCOTAS */}
      <section className="space-y-4">
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Mis Mascotas</h2>
        {mascotas.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {mascotas.map(pet => (
              <div key={pet.id} className="flex flex-col items-center gap-2 min-w-[80px]">
                <div
                  onClick={() => pet.foto && setZoomedPhoto(pet.foto)}
                  className="w-20 h-20 rounded-[2rem] border-4 border-white shadow-md overflow-hidden bg-orange-100 flex items-center justify-center text-orange-600 cursor-zoom-in active:scale-95 transition-transform"
                >
                  {pet.foto ? (
                    <img src={pet.foto} alt={pet.nombre} className="w-full h-full object-cover" />
                  ) : (
                    <Dog size={32} />
                  )}
                </div>
                <span className="text-[10px] font-black uppercase text-slate-600 tracking-tight">{pet.nombre}</span>
              </div>
            ))}
          </div>
        ) : (
          <button
            onClick={() => setActiveTab('pets')}
            className="w-full py-8 border-4 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-orange-500 hover:border-orange-200 transition-all"
          >
            <PlusCircle size={32} />
            <span className="font-black text-xs uppercase tracking-widest">Registrar Mascota</span>
          </button>
        )}
      </section>

      {/* BARRA DE FILTROS */}
      <div className="sticky top-[72px] z-30 -mx-6 px-6 py-4 bg-slate-50/80 backdrop-blur-md flex items-center justify-between border-b border-slate-200/50">
        <div className="flex gap-2">
          <button
            onClick={() => setSoloCercanas(!soloCercanas)}
            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-1.5 ${soloCercanas ? 'bg-red-500 text-white shadow-md' : 'bg-slate-200/50 text-slate-500'}`}
          >
            <MapPin size={12} />
            {soloCercanas ? "Cercanas (10km)" : "Todo Bs.As."}
          </button>

          <button
            onClick={() => setSoloMisPublicaciones(!soloMisPublicaciones)}
            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-1.5 ${soloMisPublicaciones ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-200/50 text-slate-500'}`}
          >
            <UserIcon size={12} />
            Míos
          </button>
        </div>

        <p className="text-[10px] font-black text-slate-400 uppercase">
          {totalResultados} resultados
        </p>
      </div>

      {/* 2. MASCOTAS PERDIDAS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-600">
            <MapPin size={20} />
            <h2 className="text-lg font-black uppercase tracking-tighter">Perdidos</h2>
          </div>
          <button onClick={() => setShowLostPetModal(true)} className="p-2 bg-red-50 text-red-600 rounded-xl active:scale-90 transition-all">
            <Plus size={20} />
          </button>
        </div>
        {perdidosFiltrados.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {perdidosFiltrados.map(p => (
              <LostPetCard key={p.id} reporte={p} currentUser={user} onDelete={() => abrirConfirmacionBorrado(p.id, 'perdido')} />
            ))}
          </div>
        ) : (
          <div className="h-32 bg-slate-50 rounded-[2.5rem] flex items-center justify-center border-2 border-dashed border-slate-200 text-center px-6">
            <p className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest">No hay reportes cercanos</p>
          </div>
        )}
      </section>

      {/* 3. MASCOTAS EN ADOPCIÓN */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-600">
            <Heart size={20} />
            <h2 className="text-lg font-black uppercase tracking-tighter">En adopción</h2>
          </div>
          <button onClick={() => setShowAdoptionModal(true)} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl active:scale-90 transition-all">
            <Plus size={20} />
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar">
          {adopcionesFiltradas.length > 0 ? (
            adopcionesFiltradas.map(a => (
              <AdoptionCard key={a.id} mascota={a} currentUser={user} onDelete={() => abrirConfirmacionBorrado(a.id, 'adopcion')} />
            ))
          ) : (
            <div className="w-full h-32 bg-emerald-50/30 rounded-[2.5rem] flex items-center justify-center border-2 border-dashed border-emerald-100 text-center px-6">
              <p className="text-[10px] font-black text-emerald-400 uppercase italic tracking-widest">Sin publicaciones cercanas</p>
            </div>
          )}
        </div>
      </section>

      {/* 4. REFUGIOS (NUEVA SECCIÓN) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-violet-600">
            <Globe size={20} />
            <h2 className="text-lg font-black uppercase tracking-tighter">Refugios</h2>
          </div>
          <button onClick={() => setShowRefugioModal(true)} className="p-2 bg-violet-50 text-violet-600 rounded-xl active:scale-90 transition-all">
            <Plus size={20} />
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar">
          {refugiosFiltrados.length > 0 ? (
            refugiosFiltrados.map(r => (
              <RefugioCard key={r.id} refugio={r} currentUser={user} onDelete={() => abrirConfirmacionBorrado(r.id, 'refugio')} />
            ))
          ) : (
            <div className="w-full h-32 bg-violet-50/30 rounded-[2.5rem] flex items-center justify-center border-2 border-dashed border-violet-100 text-center px-6">
              <p className="text-[10px] font-black text-violet-400 uppercase italic tracking-widest">Sin refugios en esta zona</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}