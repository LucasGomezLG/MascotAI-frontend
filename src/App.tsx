import React, { useState, useEffect } from 'react';
import {
  Camera, Dog, LayoutDashboard, Stethoscope, ShieldPlus,
  Bell, User as UserIcon, Settings, PawPrint, Home, Heart, MapPin, PlusCircle, Plus, Users,
  Loader2,
  Sparkles
} from 'lucide-react';
import { api } from './services/api';
import { useAuth } from './context/AuthContext';
import LoginView from './components/login/LoginView';
import FoodScanner from './components/scanner/FoodScanner';
import VetScanner from './components/scanner/vet/VetScanner';
import SaludScanner from './components/scanner/SaludScanner';
import ReportsManager from './components/reports/ReportsManager';
import PetModal from './components/ui/PetModal';
import NotificationsCenter from './components/ui/NotificationsCenter';
import LogoutModal from './components/login/LogoutModal';
import PetProfiles from './components/PetProfiles';
import LostPetModal from './components/LostPet/LostPetModal';
import LostPetCard from './components/LostPet/LostPetCard';
import AdoptionCard from './components/AdoptionPet/AdoptionCard';
import AdoptionModal from './components/AdoptionPet/AdoptionModal';
import DeleteConfirmModal from './components/ui/DeleteConfirmModal';
import Swal from 'sweetalert2';

type TabType = 'home' | 'scanner' | 'stats' | 'vet' | 'health' | 'pets';

function App() {
  const { user, loading: authLoading, logout } = useAuth();

  // --- ESTADOS ---
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [mascotas, setMascotas] = useState<any[]>([]);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [perdidos, setPerdidos] = useState<any[]>([]);
  const [adopciones, setAdopciones] = useState<any[]>([]);
  const [loadingSuscripcion, setLoadingSuscripcion] = useState(false);

  // Estados de Modales
  const [showPetModal, setShowPetModal] = useState(false);
  const [showLostPetModal, setShowLostPetModal] = useState(false);
  const [showAdoptionModal, setShowAdoptionModal] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [itemABorrar, setItemABorrar] = useState<{ id: string, tipo: 'perdido' | 'adopcion' } | null>(null);

  // Estados de Selección
  const [foodParaVer, setFoodParaVer] = useState<any>(null);
  const [vetParaVer, setVetParaVer] = useState<any>(null);
  const [healthParaVer, setHealthParaVer] = useState<any>(null);

  // ✅ FILTROS
  const [soloMisPublicaciones, setSoloMisPublicaciones] = useState(false);
  const [soloCercanas, setSoloCercanas] = useState(true);
  const [userCoords, setUserCoords] = useState<{ lat: number, lng: number } | null>(null);

  // --- GEOLOCALIZACIÓN OPTIMIZADA ---
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("📍 GPS OK:", position.coords.latitude, position.coords.longitude);
          setUserCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn("⚠️ GPS falló, usando vista general:", error.message);
          setSoloCercanas(false); // Si falla el GPS, mostramos todo automáticamente
        },
        {
          enableHighAccuracy: false, // ❌ CAMBIO: false para que sea más rápido y no de Timeout
          timeout: 10000,
          maximumAge: 60000
        }
      );
    }
  }, []);

  // --- FUNCIONES DE CARGA ---
  const refreshData = () => {
    if (!user) return;
    api.getPerfiles().then(res => setMascotas(res.data)).catch(() => { });
    api.getAlertasSistema().then(res => setAlertas(res.data)).catch(() => { });
    api.getMascotasPerdidas().then(res => setPerdidos(res.data)).catch(() => { });
    api.getMascotasAdopcion().then(res => setAdopciones(res.data)).catch(() => { });
  };

  const handleSuscripcion = () => {
    // Si ya es colaborador, no mostramos el cartel
    if (user?.esColaborador) return;

    Swal.fire({
      title: '¿Quieres colaborar?',
      text: "Ayuda a mantener la aplicación funcionando",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#f97316', // Color naranja de MascotAI
      cancelButtonColor: '#94a3b8', // Color slate para el "No"
      confirmButtonText: 'Sí, donar',
      cancelButtonText: 'Ahora no',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-[2rem]', // Mantiene tu estilo redondeado
        confirmButton: 'rounded-xl font-black uppercase text-xs px-6 py-3',
        cancelButton: 'rounded-xl font-black uppercase text-xs px-6 py-3'
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        setLoadingSuscripcion(true);
        try {
          const response = await api.crearSuscripcion();
          // Redirigimos al checkout de Mercado Pago
          window.location.href = response.data.url;
        } catch (error) {
          Swal.fire({
            title: 'Error',
            text: 'No se pudo conectar con Mercado Pago. Intenta más tarde.',
            icon: 'error',
            confirmButtonColor: '#f97316'
          });
        } finally {
          setLoadingSuscripcion(false);
        }
      }
    });
  };
  useEffect(() => {
    if (user) refreshData();
  }, [user]);

  // --- LÓGICA DE DISTANCIA ---
  const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // --- LÓGICA DE FILTRADO (CON CORRECCIÓN DE TIPOS) ---
  const filtrarPublicaciones = (lista: any[]) => {
    return lista.filter(item => {
      // 1. Filtro de "Míos" (Prioridad 1)
      if (soloMisPublicaciones && item.userId !== user?.id) return false;

      // 2. Filtro de "Cercanas"
      if (soloCercanas) {
        // Si el GPS todavía no tiene coordenadas, no filtramos nada (mostramos todo)
        if (!userCoords) return true;

        const itemLat = Number(item.lat);
        const itemLng = Number(item.lng);

        // Si la mascota NO tiene coordenadas válidas, la mostramos igual 
        // para que no "desaparezca" de la lista por error de datos.
        if (!itemLat || !itemLng || isNaN(itemLat)) return true;

        const dist = calcularDistancia(userCoords.lat, userCoords.lng, itemLat, itemLng);

        // Solo ocultamos si estamos SEGUROS de que está a más de 10km
        return dist <= 10;
      }

      return true;
    });
  };

  const perdidosFiltrados = filtrarPublicaciones(perdidos);
  const adopcionesFiltradas = filtrarPublicaciones(adopciones);

  // --- ELIMINACIÓN ---
  const abrirConfirmacionBorrado = (id: string, tipo: 'perdido' | 'adopcion') => {
    setItemABorrar({ id, tipo });
  };

  const ejecutarBorrado = async () => {
    if (!itemABorrar) return;
    try {
      if (itemABorrar.tipo === 'perdido') {
        await api.eliminarMascotaPerdida(itemABorrar.id);
      } else {
        await api.eliminarMascotaAdopcion(itemABorrar.id);
      }
      refreshData();
      setItemABorrar(null);
    } catch (e) {
      alert("Hubo un error al eliminar la publicación.");
    }
  };

  if (authLoading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-black text-orange-900 uppercase text-xs tracking-widest">Verificando sesión...</p>
    </div>
  );

  if (!user) return <LoginView />;

  const verDetalle = (item: any, tipo: 'food' | 'vet' | 'health') => {
    if (tipo === 'food') { setFoodParaVer(item); setActiveTab('scanner'); }
    else if (tipo === 'vet') { setVetParaVer(item); setActiveTab('vet'); }
    else { setHealthParaVer(item); setActiveTab('health'); }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24 text-left">
      <header className="bg-white p-4 border-b sticky top-0 z-40 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="bg-orange-600 p-2 rounded-xl shadow-lg rotate-3"><Dog size={24} className="text-white" /></div>
          <div>
            <h1 className="text-xl font-black text-orange-900 tracking-tighter uppercase leading-none">MascotAI</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
              Hola, {user?.name?.split(' ')[0] || 'Usuario'}!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* ✅ BOTÓN DE COLABORACIÓN EN EL HEADER */}
          <button
            onClick={handleSuscripcion}
            disabled={loadingSuscripcion}
            className={`p-2 rounded-xl transition-all shadow-sm active:scale-90 ${user?.esColaborador
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                : 'bg-gradient-to-tr from-orange-500 to-amber-400 text-white'
              }`}
          >
            {loadingSuscripcion ? (
              <Loader2 size={20} className="animate-spin" />
            ) : user?.esColaborador ? (
              <Sparkles size={20} />
            ) : (
              <Heart size={20} fill={loadingSuscripcion ? "none" : "currentColor"} />
            )}
          </button>
          <div className="relative">
            <button onClick={() => setShowAlerts(!showAlerts)} className={`p-2 rounded-xl transition-all ${alertas.length > 0 ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-400'}`}>
              <Bell size={20} />
              {alertas.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>}
            </button>
            {showAlerts && <NotificationsCenter alertas={alertas} onMarkRead={(id: string) => api.marcarAlertaLeida(id).then(refreshData)} onClose={() => setShowAlerts(false)} />}
          </div>

          <button onClick={() => setActiveTab('pets')} className={`p-2 rounded-xl transition-all ${activeTab === 'pets' ? 'bg-orange-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>
            <PawPrint size={20} />
          </button>

          <button onClick={() => setShowLogoutModal(true)} className="w-10 h-10 rounded-xl overflow-hidden border-2 border-orange-100 shadow-sm active:scale-90 transition-transform">
            {user.picture ? <img src={user.picture} alt="profile" className="w-full h-full object-cover" /> : <div className="bg-slate-100 w-full h-full flex items-center justify-center text-slate-400"><UserIcon size={20} /></div>}
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-6">
        {activeTab === 'home' && (
          <div className="space-y-10 animate-in fade-in duration-500">

            {/* 1. MIS MASCOTAS */}
            <section className="space-y-4">
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Mis Mascotas</h2>
              {mascotas.length > 0 ? (
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                  {mascotas.map(pet => (
                    <div key={pet.id} className="flex flex-col items-center gap-2 min-w-[80px]">
                      <div className="w-20 h-20 rounded-[2rem] border-4 border-white shadow-md overflow-hidden bg-orange-100 flex items-center justify-center text-orange-600">
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

            {/* BARRA DE FILTROS ACTUALIZADA */}
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
                {perdidosFiltrados.length + adopcionesFiltradas.length} resultados
              </p>
            </div>

            {/* 2. MASCOTAS PERDIDAS */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-600">
                  <MapPin size={20} />
                  <h2 className="text-lg font-black uppercase tracking-tighter">Perdidos</h2>
                </div>
                <button
                  onClick={() => setShowLostPetModal(true)}
                  className="p-2 bg-red-50 text-red-600 rounded-xl active:scale-90 transition-all"
                >
                  <Plus size={20} />
                </button>
              </div>

              {perdidosFiltrados.length > 0 ? (
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                  {perdidosFiltrados.map(p => (
                    <LostPetCard
                      key={p.id}
                      reporte={p}
                      currentUser={user}
                      onDelete={() => abrirConfirmacionBorrado(p.id, 'perdido')}
                    />
                  ))}
                </div>
              ) : (
                <div className="h-32 bg-slate-50 rounded-[2.5rem] flex items-center justify-center border-2 border-dashed border-slate-200 text-center px-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest">
                    {soloCercanas && !userCoords ? "Obteniendo ubicación..." : "No hay reportes cercanos"}
                  </p>
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
                <button
                  onClick={() => setShowAdoptionModal(true)}
                  className="p-2 bg-emerald-50 text-emerald-600 rounded-xl active:scale-90 transition-all"
                >
                  <Plus size={20} />
                </button>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar">
                {adopcionesFiltradas.length > 0 ? (
                  adopcionesFiltradas.map(a => (
                    <AdoptionCard
                      key={a.id}
                      mascota={a}
                      currentUser={user}
                      onDelete={() => abrirConfirmacionBorrado(a.id, 'adopcion')}
                    />
                  ))
                ) : (
                  <div className="w-full h-32 bg-emerald-50/30 rounded-[2.5rem] flex items-center justify-center border-2 border-dashed border-emerald-100 text-center px-6">
                    <p className="text-[10px] font-black text-emerald-400 uppercase italic tracking-widest">
                      {soloCercanas && !userCoords ? "Obteniendo ubicación..." : "Sin publicaciones cercanas"}
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* RESTO DE PESTAÑAS */}
        {activeTab === 'scanner' && <FoodScanner mascotas={mascotas} onScanComplete={refreshData} initialData={foodParaVer} onReset={() => setFoodParaVer(null)} />}
        {activeTab === 'vet' && <VetScanner mascotas={mascotas} onScanComplete={refreshData} initialData={vetParaVer} onReset={() => setVetParaVer(null)} />}
        {activeTab === 'health' && <SaludScanner mascotas={mascotas} onScanComplete={refreshData} initialData={healthParaVer} onReset={() => setHealthParaVer(null)} />}
        {activeTab === 'stats' && <ReportsManager onVerDetalle={verDetalle} />}
        {activeTab === 'pets' && (
          <div className="space-y-6">
            <PetProfiles mascotas={mascotas} onUpdate={refreshData} onAddClick={() => setShowPetModal(true)} />
          </div>
        )}
      </main>

      {/* MODALES */}
      {showPetModal && <PetModal onClose={() => { setShowPetModal(false); refreshData(); }} />}
      {showLostPetModal && <LostPetModal onClose={() => { setShowLostPetModal(false); refreshData(); }} />}
      {showAdoptionModal && <AdoptionModal onClose={() => { setShowAdoptionModal(false); refreshData(); }} />}
      <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} onConfirm={logout} />

      <DeleteConfirmModal
        isOpen={!!itemABorrar}
        onClose={() => setItemABorrar(null)}
        onConfirm={ejecutarBorrado}
        titulo="¿Estás seguro?"
        mensaje={itemABorrar?.tipo === 'perdido'
          ? "El reporte de mascota perdida se eliminará permanentemente."
          : "La publicación de adopción desaparecerá de la comunidad."}
      />

      {/* NAV INFERIOR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 pb-8 flex justify-around items-center z-50 shadow-lg">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-orange-600 scale-110' : 'text-slate-400'}`}>
          <Home size={24} /><span className="text-[8px] font-black uppercase">Inicio</span>
        </button>
        <button onClick={() => setActiveTab('scanner')} className={`flex flex-col items-center gap-1 ${activeTab === 'scanner' ? 'text-orange-600' : 'text-slate-400'}`}>
          <Camera size={24} /><span className="text-[8px] font-black uppercase">Comida</span>
        </button>
        <button onClick={() => setActiveTab('vet')} className={`flex flex-col items-center gap-1 ${activeTab === 'vet' ? 'text-red-600' : 'text-slate-400'}`}>
          <Stethoscope size={24} /><span className="text-[8px] font-black uppercase">Vete</span>
        </button>
        <button onClick={() => setActiveTab('health')} className={`flex flex-col items-center gap-1 ${activeTab === 'health' ? 'text-emerald-600' : 'text-slate-400'}`}>
          <ShieldPlus size={24} /><span className="text-[8px] font-black uppercase">Salud</span>
        </button>
        <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center gap-1 ${activeTab === 'stats' ? 'text-orange-600' : 'text-slate-400'}`}>
          <LayoutDashboard size={24} /><span className="text-[8px] font-black uppercase">Reportes</span>
        </button>
      </nav>
    </div>
  );
}

export default App;