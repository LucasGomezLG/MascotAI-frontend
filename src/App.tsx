import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {api} from './services/api';
import type {
    AlertaDTO,
    AlimentoDTO,
    ConsultaVetDTO,
    ItemComunidad,
    MascotaAdopcionDTO,
    MascotaDTO,
    MascotaPerdidaDTO,
    RecordatorioSaludDTO,
    RefugioDTO,
    TriajeIADTO
} from './types/api.types';
import {useAuth} from './context/AuthContext';
import {Geolocation} from '@capacitor/geolocation';
import Swal from 'sweetalert2';
import {useUIStore} from './stores/uiStore';
import {Toaster} from 'react-hot-toast';

// --- COMPONENTES ---
import LoginView from './components/login/LoginView';
import FoodScanner from './components/scanner/FoodScanner';
import VetScanner from './components/scanner/vet/VetScanner';
import SaludScanner from './components/scanner/SaludScanner';
import ReportsManager from './components/reports/ReportsManager';
import PetModal from './components/Pet/PetModal';
import LogoutModal from './components/login/LogoutModal';
import PetProfiles from './components/Pet/PetProfiles';
import LostPetModal from './components/LostPet/LostPetModal';
import AdoptionModal from './components/AdoptionPet/AdoptionModal';
import RefugioModal from './components/Refugio/RefugioModal';
import DeleteConfirmModal from './components/ui/DeleteConfirmModal';
import AppHeader from './components/layout/AppHeader';
import AppBottomNav from './components/layout/AppBottomNav';
import HomeContent from './components/home/HomeContent';
import SubscriptionCard from './services/SuscriptionCard';
import MarketplacePage from './pages/MarketplacePage';

type TabType = 'home' | 'scanner' | 'stats' | 'vet' | 'health' | 'pets' | 'marketplace';
type DetailItem = AlimentoDTO | ConsultaVetDTO | TriajeIADTO | RecordatorioSaludDTO;

const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

function App() {
  const { user, loading: authLoading, logout, refreshUser } = useAuth();
  const {
    isPetModalOpen, isLostPetModalOpen, isAdoptionModalOpen, isRefugioModalOpen,
    isLogoutModalOpen, isSubscriptionModalOpen, zoomedPhoto, itemToDelete,
    togglePetModal, toggleLostPetModal, toggleAdoptionModal, toggleRefugioModal,
    toggleLogoutModal, toggleSubscriptionModal, setZoomedPhoto, setItemToDelete
  } = useUIStore();

  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [mascotas, setMascotas] = useState<MascotaDTO[]>([]);
  const [alertas, setAlertas] = useState<AlertaDTO[]>([]);

  const [perdidos, setPerdidos] = useState<(ItemComunidad & MascotaPerdidaDTO)[]>([]);
  const [adopciones, setAdopciones] = useState<(ItemComunidad & MascotaAdopcionDTO)[]>([]);
  const [refugios, setRefugios] = useState<(ItemComunidad & RefugioDTO)[]>([]);

  const [foodParaVer, setFoodParaVer] = useState<AlimentoDTO | null>(null);
  const [vetParaVer, setVetParaVer] = useState<ConsultaVetDTO | TriajeIADTO | null>(null);
  const [, setHealthParaVer] = useState<RecordatorioSaludDTO | null>(null);

  const [soloMisPublicaciones, setSoloMisPublicaciones] = useState(false);
  const [soloCercanas, setSoloCercanas] = useState(true);
  const [userCoords, setUserCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);

  const obtenerUbicacion = useCallback(async () => {
    try {
      const permissions = await Geolocation.checkPermissions();
      let status = permissions.location;
      if (status !== 'granted') status = (await Geolocation.requestPermissions()).location;
      if (status === 'granted') {
        const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 10000 });
        setUserCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationPermissionGranted(true);
      }
    } catch (e) { console.error("Error GPS:", e); }
  }, []);

  const refreshData = useCallback(async () => {
    if (!user) return;
    setIsDataLoading(true);

    try {
      const [mascotasRes, perdidosRes, adopcionesRes, refugiosRes, alertasRes] = await Promise.all([
        api.getMascotas(),
        api.getMascotasPerdidas(),
        api.getMascotasAdopcion(),
        api.getRefugios(),
        api.getAlertasSistema()
      ]);

      setMascotas(mascotasRes.data);
      
      setPerdidos(perdidosRes.data.map((p: MascotaPerdidaDTO) => ({
        ...p,
        id: p.id || '',
        tipo: 'perdido' as const,
        contacto: p.contacto || ''
      })));

      setAdopciones(adopcionesRes.data.map((a: MascotaAdopcionDTO) => ({
        ...a,
        id: a.id || '',
        tipo: 'adopcion' as const
      })));

      setRefugios(refugiosRes.data.map((r: RefugioDTO) => ({
        ...r,
        id: r.id || '',
        tipo: 'refugio' as const,
        contacto: r.redSocial || r.aliasDonacion || ''
      })));

      setAlertas(alertasRes.data);
    } catch (e) {
      console.error("Error al refrescar datos:", e);
    } finally {
      setIsDataLoading(false);
    }
  }, [user]);

  const handleFullLogout = async () => {
    toggleLogoutModal(false);
    setActiveTab('home');
    setFoodParaVer(null);
    setVetParaVer(null);
    setHealthParaVer(null);
    await logout();
  };

  const filtrarLista = useCallback(<T extends ItemComunidad>(lista: T[]): T[] => {
    const currentUserId = user?.id;

    return lista.filter(item => {
      if (soloMisPublicaciones) {
        if (!item.userId || !currentUserId) return false;
        if (String(item.userId).trim() !== String(currentUserId).trim()) return false;
      }

      if (soloCercanas && locationPermissionGranted && userCoords) {
        const itemLat = Number(item.lat);
        const itemLng = Number(item.lng);
        if (isNaN(itemLat) || isNaN(itemLng)) return true;
        return calcularDistancia(userCoords.lat, userCoords.lng, itemLat, itemLng) <= 15;
      }

      return true;
    });
  }, [soloMisPublicaciones, soloCercanas, user, userCoords, locationPermissionGranted]);

  const perdidosFiltrados = useMemo(() => filtrarLista(perdidos), [perdidos, filtrarLista]);
  const adopcionesFiltradas = useMemo(() => filtrarLista(adopciones), [adopciones, filtrarLista]);
  const refugiosFiltrados = useMemo(() => filtrarLista(refugios), [refugios, filtrarLista]);

  useEffect(() => {
    const checkUrlParams = async () => {
      await obtenerUbicacion();
      const params = new URLSearchParams(window.location.search);
      if (params.get('status') === 'approved' || params.get('pago') === 'exitoso') {
        await refreshUser();
        await refreshData();
        void Swal.fire({ 
            title: '¡Pago Exitoso! ❤️', 
            text: 'Tu transacción se procesó correctamente. Los cambios se verán reflejados en breve.', 
            icon: 'success',
            confirmButtonColor: '#ea580c'
        });
        window.history.replaceState({}, document.title, "/");
      }
    };
    void checkUrlParams();
  }, [obtenerUbicacion, refreshUser, refreshData]);

  useEffect(() => {
    if (user) refreshData();
  }, [user, refreshData]);

  if (authLoading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="font-black text-orange-900 uppercase text-xs tracking-widest">Sincronizando...</p>
    </div>
  );

  if (!user) return <LoginView />;

  const isRecordatorioSalud = (item: DetailItem): item is RecordatorioSaludDTO => {
    return item && typeof item === 'object' && 'proximaFecha' in item;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 text-left pt-[env(safe-area-inset-top)]" style={{ paddingBottom: activeTab === 'marketplace' ? 0 : 'calc(6rem + env(safe-area-inset-bottom))' }}>
      <Toaster 
        position="top-center" 
        reverseOrder={false} 
        containerStyle={{
          top: 'calc(20px + env(safe-area-inset-top))',
          zIndex: 9999
        }}
      />

      {activeTab === 'marketplace' ? (
        <MarketplacePage user={user} onBack={() => setActiveTab('home')} />
      ) : (
        <>
          <AppHeader
            user={user} setActiveTab={setActiveTab} alertas={alertas}
            onMarkRead={async (id) => { await api.marcarAlertaLeida(id); refreshData(); }}
            activeTab={activeTab}
          />

          <main className="max-w-md mx-auto p-6">
            {activeTab === 'home' && (
              <HomeContent
                mascotas={mascotas} setActiveTab={setActiveTab}
                soloCercanas={soloCercanas} setSoloCercanas={setSoloCercanas}
                soloMisPublicaciones={soloMisPublicaciones} setSoloMisPublicaciones={setSoloMisPublicaciones}
                perdidosFiltrados={perdidosFiltrados} adopcionesFiltradas={adopcionesFiltradas} refugiosFiltrados={refugiosFiltrados}
                user={user}
                userCoords={userCoords} locationPermissionGranted={locationPermissionGranted} obtenerUbicacion={obtenerUbicacion}
                refreshData={refreshData}
                isLoading={isDataLoading}
              />
            )}

            {activeTab === 'scanner' && <FoodScanner mascotas={mascotas} onScanComplete={refreshData} initialData={foodParaVer || undefined} onReset={() => setFoodParaVer(null)} />}
            {activeTab === 'vet' && <VetScanner mascotas={mascotas} onScanComplete={refreshData} initialData={vetParaVer || undefined} />}
            {activeTab === 'health' && <SaludScanner mascotas={mascotas} onScanComplete={refreshData} />}
            {activeTab === 'stats' && <ReportsManager onVerDetalle={(item, tipo) => {
              if (tipo === 'food') { setFoodParaVer(item as AlimentoDTO); setActiveTab('scanner'); }
              else if (tipo === 'vet') { setVetParaVer(item as (ConsultaVetDTO | TriajeIADTO)); setActiveTab('vet'); }
              else if (isRecordatorioSalud(item)) { setHealthParaVer(item); setActiveTab('health'); }
            }} />}
            {activeTab === 'pets' && <PetProfiles mascotas={mascotas} onUpdate={refreshData} />}
          </main>
          <AppBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        </>
      )}

      {isPetModalOpen && <PetModal onClose={() => { togglePetModal(false); refreshData(); }} />}
      {isLostPetModalOpen && <LostPetModal onClose={() => { toggleLostPetModal(false); refreshData(); }} />}
      {isAdoptionModalOpen && <AdoptionModal onClose={() => { toggleAdoptionModal(false); refreshData(); }} />}
      {isRefugioModalOpen && <RefugioModal onClose={() => { toggleRefugioModal(false); refreshData(); }} />}

      {zoomedPhoto && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-100 flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setZoomedPhoto(null)}>
          <img src={zoomedPhoto} className="max-w-full max-h-[85vh] rounded-[2.5rem] shadow-2xl border-4 border-white/10 object-contain" alt="Preview" />
        </div>
      )}

      <LogoutModal isOpen={isLogoutModalOpen} onClose={() => toggleLogoutModal(false)} onConfirm={handleFullLogout} />

      {isSubscriptionModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-150 p-4">
          <div className="bg-white rounded-4xl p-6 max-w-sm w-full relative">
            <button
              onClick={() => toggleSubscriptionModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <SubscriptionCard user={user} />
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)}
        onConfirm={() => {
          if (!itemToDelete) return;
          const action = itemToDelete.tipo === 'perdido' ? api.eliminarMascotaPerdida : itemToDelete.tipo === 'adopcion' ? api.eliminarMascotaAdopcion : api.eliminarRefugio;
          void action(itemToDelete.id).then(() => { refreshData(); setItemToDelete(null); });
        }}
        titulo="¿Eliminar publicación?" mensaje="Esta acción no se puede deshacer."
      />
    </div>
  );
}

export default App;