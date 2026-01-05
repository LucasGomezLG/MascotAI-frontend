import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { api } from './services/api';
import { useAuth } from './context/AuthContext';
import LoginView from './components/login/LoginView';
import FoodScanner from './components/scanner/FoodScanner';
import VetScanner from './components/scanner/vet/VetScanner';
import SaludScanner from './components/scanner/SaludScanner';
import ReportsManager from './components/reports/ReportsManager';
import PetModal from './components/ui/PetModal';
import LogoutModal from './components/login/LogoutModal';
import PetProfiles from './components/PetProfiles';
import LostPetModal from './components/LostPet/LostPetModal';
import AdoptionModal from './components/AdoptionPet/AdoptionModal';
import DeleteConfirmModal from './components/ui/DeleteConfirmModal';
import Swal from 'sweetalert2';
import AppHeader from './components/layout/AppHeader';
import AppBottomNav from './components/layout/AppBottomNav';
import HomeContent from './components/home/HomeContent';

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
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null); // ✅ Nuevo estado para el zoom

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
    if (user?.esColaborador) return;

    Swal.fire({
      title: '¿Quieres colaborar?',
      text: "Ingresa el monto que desees donar para mantener MascotAI",
      input: 'number', // ✅ Agregamos un input numérico
      inputLabel: 'Monto en AR$',
      inputValue: 2000, // Monto sugerido
      showCancelButton: true,
      confirmButtonColor: '#f97316',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Donar',
      cancelButtonText: 'Ahora no',
      reverseButtons: true,
      inputValidator: (value) => {
        if (!value || parseInt(value) < 100) {
          return 'El monto mínimo es $100'
        }
      },
      customClass: {
        popup: 'rounded-[2rem]',
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        const montoElegido = result.value;
        setLoadingSuscripcion(true);
        try {
          // ✅ Enviamos el monto al backend en la query
          const response = await api.crearSuscripcion(montoElegido);
          window.location.href = response.data.url;
        } catch (error) {
          Swal.fire('Error', 'No se pudo generar el link.', 'error');
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
        // Si el GPS todavía no tiene coordenadas, ocultamos para mostrar "Obteniendo ubicación..."
        if (!userCoords) return false;

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
      <AppHeader
        user={user}
        setActiveTab={setActiveTab}
        handleSuscripcion={handleSuscripcion}
        loadingSuscripcion={loadingSuscripcion}
        alertas={alertas}
        showAlerts={showAlerts}
        setShowAlerts={setShowAlerts}
        onMarkRead={(id: string) => api.marcarAlertaLeida(id).then(refreshData)}
        setShowLogoutModal={setShowLogoutModal}
        activeTab={activeTab}
      />

      <main className="max-w-md mx-auto p-6">
        {activeTab === 'home' && (
          <HomeContent
            mascotas={mascotas}
            setActiveTab={setActiveTab}
            setZoomedPhoto={setZoomedPhoto}
            soloCercanas={soloCercanas}
            setSoloCercanas={setSoloCercanas}
            soloMisPublicaciones={soloMisPublicaciones}
            setSoloMisPublicaciones={setSoloMisPublicaciones}
            perdidosFiltrados={perdidosFiltrados}
            adopcionesFiltradas={adopcionesFiltradas}
            setShowLostPetModal={setShowLostPetModal}
            setShowAdoptionModal={setShowAdoptionModal}
            user={user}
            abrirConfirmacionBorrado={abrirConfirmacionBorrado}
            userCoords={userCoords}
          />
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
      {zoomedPhoto && (
        <div
          className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300 cursor-zoom-out"
          onClick={() => setZoomedPhoto(null)}
        >
          <button className="absolute top-6 right-6 text-white/70 hover:text-white p-2 bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>

          <img
            src={zoomedPhoto}
            className="max-w-full max-h-[85vh] rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-500 object-contain border-4 border-white/10"
            alt="Zoom Mascota"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
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
      <AppBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default App;