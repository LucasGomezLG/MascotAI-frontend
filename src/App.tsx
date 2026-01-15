import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from './services/api';
// ✅ Importamos los DTOs específicos para el mapeo
import type {
  MascotaDTO,
  AlertaDTO,
  ItemComunidad,
  MascotaPerdidaDTO,
  MascotaAdopcionDTO,
  RefugioDTO
} from './types/api.types';
import { useAuth } from './context/AuthContext';
import { Geolocation } from '@capacitor/geolocation';
import Swal from 'sweetalert2';

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

type TabType = 'home' | 'scanner' | 'stats' | 'vet' | 'health' | 'pets';

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

  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [mascotas, setMascotas] = useState<MascotaDTO[]>([]);
  const [alertas, setAlertas] = useState<AlertaDTO[]>([]);

  // Estos estados esperan ItemComunidad[] (que requiere el campo 'tipo')
  const [perdidos, setPerdidos] = useState<(ItemComunidad & MascotaPerdidaDTO)[]>([]);
  const [adopciones, setAdopciones] = useState<(ItemComunidad & MascotaAdopcionDTO)[]>([]);
  const [refugios, setRefugios] = useState<(ItemComunidad & RefugioDTO)[]>([]);

  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);
  const [showPetModal, setShowPetModal] = useState(false);
  const [showLostPetModal, setShowLostPetModal] = useState(false);
  const [showAdoptionModal, setShowAdoptionModal] = useState(false);
  const [showRefugioModal, setShowRefugioModal] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [itemABorrar, setItemABorrar] = useState<{ id: string, tipo: 'perdido' | 'adopcion' | 'refugio' } | null>(null);

  const [foodParaVer, setFoodParaVer] = useState<any | null>(null);
  const [vetParaVer, setVetParaVer] = useState<any | null>(null);
  const [healthParaVer, setHealthParaVer] = useState<any | null>(null);

  const [soloMisPublicaciones, setSoloMisPublicaciones] = useState(false);
  const [soloCercanas, setSoloCercanas] = useState(true);
  const [userCoords, setUserCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);

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

  // ✅ CORRECCIÓN: Mapeo de DTOs de Backend a ItemComunidad de Frontend
  const refreshData = useCallback(() => {
    if (!user) return;

    api.getMascotas().then(res => setMascotas(res.data)).catch(e => console.error(e.message));

    // 1. Mapear Perdidos
    api.getMascotasPerdidas().then(res => {
      const mapped = res.data.map((p: MascotaPerdidaDTO) => ({
        ...p,
        id: p.id || '',           // 👈 Forzamos a string (si no hay id, enviamos vacío)
        tipo: 'perdido' as const,
        contacto: p.contacto || ''
      }));
      setPerdidos(mapped);
    }).catch(e => console.error(e.message));

    // 2. Mapear Adopciones
    api.getMascotasAdopcion().then(res => {
      const mapped = res.data.map((a: MascotaAdopcionDTO) => ({
        ...a,
        id: a.id || '',           // 👈 Forzamos a string
        tipo: 'adopcion' as const
      }));
      setAdopciones(mapped);
    }).catch(e => console.error(e.message));

    // 3. Mapear Refugios
    api.getRefugios().then(res => {
      const mapped = res.data.map((r: RefugioDTO) => ({
        ...r,
        id: r.id || '',           // 👈 Forzamos a string
        tipo: 'refugio' as const,
        // Usamos redSocial o alias como contacto para la interfaz genérica
        contacto: r.redSocial || r.aliasDonacion || ''
      }));
      setRefugios(mapped);
    }).catch(e => console.error(e.message));

    api.getAlertasSistema().then(res => setAlertas(res.data)).catch(() => { });
  }, [user]);

  const handleFullLogout = async () => {
    setShowLogoutModal(false);
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
    obtenerUbicacion();
    const params = new URLSearchParams(window.location.search);
    if (params.get('status') === 'approved') {
      refreshUser();
      Swal.fire({ title: '¡Gracias! ❤️', text: 'Aporte recibido.', icon: 'success' });
      window.history.replaceState({}, document.title, "/");
    }
  }, [obtenerUbicacion, refreshUser]);

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

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 text-left" style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}>
      <AppHeader
        user={user} setActiveTab={setActiveTab} alertas={alertas}
        showAlerts={showAlerts} setShowAlerts={setShowAlerts}
        onMarkRead={(id) => api.marcarAlertaLeida(id).then(refreshData)}
        setShowLogoutModal={setShowLogoutModal} activeTab={activeTab}
      />

      <main className="max-w-md mx-auto p-6">
        {activeTab === 'home' && (
          <HomeContent
            mascotas={mascotas} setActiveTab={setActiveTab} setZoomedPhoto={setZoomedPhoto}
            soloCercanas={soloCercanas} setSoloCercanas={setSoloCercanas}
            soloMisPublicaciones={soloMisPublicaciones} setSoloMisPublicaciones={setSoloMisPublicaciones}
            perdidosFiltrados={perdidosFiltrados} adopcionesFiltradas={adopcionesFiltradas} refugiosFiltrados={refugiosFiltrados}
            setShowLostPetModal={setShowLostPetModal} setShowAdoptionModal={setShowAdoptionModal} setShowRefugioModal={setShowRefugioModal}
            user={user} abrirConfirmacionBorrado={(id, tipo) => setItemABorrar({ id, tipo: tipo as any })}
            userCoords={userCoords} locationPermissionGranted={locationPermissionGranted} obtenerUbicacion={obtenerUbicacion}
          />
        )}

        {/* ... (Resto de los tabs igual) ... */}
        {activeTab === 'scanner' && <FoodScanner mascotas={mascotas} onScanComplete={refreshData} initialData={foodParaVer} onReset={() => setFoodParaVer(null)} />}
        {activeTab === 'vet' && <VetScanner mascotas={mascotas} onScanComplete={refreshData} initialData={vetParaVer} onReset={() => setVetParaVer(null)} handleSuscripcion={() => { }} />}
        {activeTab === 'health' && <SaludScanner mascotas={mascotas} onScanComplete={refreshData} initialData={healthParaVer} onReset={() => setHealthParaVer(null)} />}
        {activeTab === 'stats' && <ReportsManager onVerDetalle={(item, tipo) => {
          if (tipo === 'food') { setFoodParaVer(item); setActiveTab('scanner'); }
          else if (tipo === 'vet') { setVetParaVer(item); setActiveTab('vet'); }
          else { setHealthParaVer(item); setActiveTab('health'); }
        }} />}
        {activeTab === 'pets' && <PetProfiles mascotas={mascotas} onUpdate={refreshData} onAddClick={() => setShowPetModal(true)} />}
      </main>

      {/* ... (Modales igual) ... */}
      {showPetModal && <PetModal onClose={() => { setShowPetModal(false); refreshData(); }} />}
      {showLostPetModal && <LostPetModal onClose={() => { setShowLostPetModal(false); refreshData(); }} />}
      {showAdoptionModal && <AdoptionModal onClose={() => { setShowAdoptionModal(false); refreshData(); }} />}
      {showRefugioModal && <RefugioModal onClose={() => { setShowRefugioModal(false); refreshData(); }} />}

      {zoomedPhoto && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setZoomedPhoto(null)}>
          <img src={zoomedPhoto} className="max-w-full max-h-[85vh] rounded-[2.5rem] shadow-2xl border-4 border-white/10 object-contain" alt="Preview" />
        </div>
      )}

      <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} onConfirm={handleFullLogout} handleSuscripcion={() => setShowSubscriptionModal(true)} />

      {/* MODAL DE SUSCRIPCIÓN */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
          <div className="bg-white rounded-[2rem] p-6 max-w-sm w-full relative">
            <button
              onClick={() => setShowSubscriptionModal(false)}
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
        isOpen={!!itemABorrar} onClose={() => setItemABorrar(null)}
        onConfirm={() => {
          if (!itemABorrar) return;
          const action = itemABorrar.tipo === 'perdido' ? api.eliminarMascotaPerdida : itemABorrar.tipo === 'adopcion' ? api.eliminarMascotaAdopcion : api.eliminarRefugio;
          action(itemABorrar.id).then(() => { refreshData(); setItemABorrar(null); });
        }}
        titulo="¿Eliminar publicación?" mensaje="Esta acción no se puede deshacer."
      />

      <AppBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default App;