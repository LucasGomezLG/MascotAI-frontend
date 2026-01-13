import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { api } from './services/api';
import { useAuth } from './context/AuthContext';
import { Geolocation } from '@capacitor/geolocation';
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
import RefugioModal from './components/Refugio/RefugioModal';
import DeleteConfirmModal from './components/ui/DeleteConfirmModal';
import Swal from 'sweetalert2';
import AppHeader from './components/layout/AppHeader';
import AppBottomNav from './components/layout/AppBottomNav';
import HomeContent from './components/home/HomeContent';

type TabType = 'home' | 'scanner' | 'stats' | 'vet' | 'health' | 'pets';

function App() {
  const { user, loading: authLoading, logout, refreshUser } = useAuth();

  // --- ESTADOS ---
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [mascotas, setMascotas] = useState<any[]>([]);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [perdidos, setPerdidos] = useState<any[]>([]);
  const [adopciones, setAdopciones] = useState<any[]>([]);
  const [refugios, setRefugios] = useState<any[]>([]);
  const [loadingSuscripcion, setLoadingSuscripcion] = useState(false);
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);

  // Estados de Modales
  const [showPetModal, setShowPetModal] = useState(false);
  const [showLostPetModal, setShowLostPetModal] = useState(false);
  const [showAdoptionModal, setShowAdoptionModal] = useState(false);
  const [showRefugioModal, setShowRefugioModal] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [itemABorrar, setItemABorrar] = useState<{ id: string, tipo: 'perdido' | 'adopcion' | 'refugio' } | null>(null);

  // Estados de Selección (Historial)
  const [foodParaVer, setFoodParaVer] = useState<any>(null);
  const [vetParaVer, setVetParaVer] = useState<any>(null);
  const [healthParaVer, setHealthParaVer] = useState<any>(null);

  // ✅ FILTROS Y GPS
  const [soloMisPublicaciones, setSoloMisPublicaciones] = useState(false);
  const [soloCercanas, setSoloCercanas] = useState(true);
  const [userCoords, setUserCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);

  // --- 🛰️ LÓGICA DE GPS NATIVO ---
  const obtenerUbicacion = async () => {
    try {
      const permissions = await Geolocation.checkPermissions();
      let status = permissions.location;
      if (status !== 'granted') {
        const request = await Geolocation.requestPermissions();
        status = request.location;
      }
      if (status === 'granted') {
        const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 10000 });
        setUserCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationPermissionGranted(true);
      } else {
        setLocationPermissionGranted(false);
        setSoloCercanas(false);
      }
    } catch (error) {
      setLocationPermissionGranted(false);
      setSoloCercanas(false);
    }
  };

  useEffect(() => {
    obtenerUbicacion();
    
    // 🛡️ LÓGICA POST-DONACIÓN (Retorno de Mercado Pago)
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    if (status === 'approved' || status === 'pending' || params.get('payment_id')) {
      setActiveTab('home');
      setFoodParaVer(null);
      setVetParaVer(null);
      setHealthParaVer(null);
      if (status === 'approved') {
        Swal.fire({
          title: '¡Gracias por colaborar! ❤️',
          text: 'Tu aporte ayuda a que MascotAI siga creciendo.',
          icon: 'success',
          confirmButtonColor: '#f97316',
          customClass: { popup: 'rounded-[2rem]' }
        });
        refreshUser();
      }
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  // --- FUNCIONES DE CARGA ---
  const refreshData = () => {
    if (!user) return;
    api.getPerfiles().then(res => setMascotas(res.data)).catch(() => { });
    api.getAlertasSistema().then(res => setAlertas(res.data)).catch(() => { });
    api.getMascotasPerdidas().then(res => setPerdidos(res.data)).catch(() => { });
    api.getMascotasAdopcion().then(res => setAdopciones(res.data)).catch(() => { });
    api.getRefugios().then(res => setRefugios(res.data)).catch(() => { });
  };

  // --- 💰 GESTIÓN DE DONACIONES ---
  const handleSuscripcion = () => {
    if (user?.esColaborador) return;
    Swal.fire({
      title: '¿Quieres colaborar?',
      text: "Ingresa el monto que desees donar para mantener MascotAI",
      input: 'number',
      inputLabel: 'Monto en AR$',
      inputValue: 5000,
      inputAttributes: { min: '100', max: '500000', step: '1' },
      showCancelButton: true,
      confirmButtonColor: '#f97316',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Donar',
      cancelButtonText: 'Ahora no',
      reverseButtons: true,
      inputValidator: (value) => {
        if (!value) return 'Debes ingresar un monto';
        const amount = parseInt(value);
        if (amount < 100) return 'El monto mínimo es $100';
      },
      customClass: { popup: 'rounded-[2rem]' }
    }).then(async (result) => {
      if (result.isConfirmed) {
        setLoadingSuscripcion(true);
        try {
          const response = await api.crearSuscripcion(result.value);
          window.location.href = response.data.url;
        } catch (error) {
          Swal.fire('Error', 'No se pudo generar el link de pago.', 'error');
        } finally {
          setLoadingSuscripcion(false);
        }
      }
    });
  };

  // 🛡️ CIERRE DE SESIÓN COMPLETO
  const handleFullLogout = async () => {
    setShowLogoutModal(false);
    setActiveTab('home');
    setFoodParaVer(null);
    setVetParaVer(null);
    setHealthParaVer(null);
    await logout();
  };

  useEffect(() => {
    if (user) refreshData();
  }, [user]);

  // --- LÓGICA DE DISTANCIA (15KM) ---
  const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const filtrarItems = (lista: any[]) => {
    return (lista || []).filter(item => {
      if (soloMisPublicaciones && item.userId !== user?.id) return false;
      if (soloCercanas && locationPermissionGranted && userCoords) {
        const itemLat = Number(item.lat);
        const itemLng = Number(item.lng);
        if (!itemLat || !itemLng || isNaN(itemLat)) return true;
        const dist = calcularDistancia(userCoords.lat, userCoords.lng, itemLat, itemLng);
        return dist <= 15; // ✅ Mantenemos el radio de 15km
      }
      return true;
    });
  };

  const perdidosFiltrados = filtrarItems(perdidos);
  const adopcionesFiltradas = filtrarItems(adopciones);
  const refugiosFiltrados = filtrarItems(refugios);

  const abrirConfirmacionBorrado = (id: string, tipo: 'perdido' | 'adopcion' | 'refugio') => {
    setItemABorrar({ id, tipo });
  };

  const ejecutarBorrado = async () => {
    if (!itemABorrar) return;
    try {
      if (itemABorrar.tipo === 'perdido') await api.eliminarMascotaPerdida(itemABorrar.id);
      else if (itemABorrar.tipo === 'adopcion') await api.eliminarMascotaAdopcion(itemABorrar.id);
      else if (itemABorrar.tipo === 'refugio') await api.eliminarRefugio(itemABorrar.id);
      refreshData();
      setItemABorrar(null);
    } catch (e) {
      Swal.fire({ title: 'Error', text: 'No se pudo eliminar.', icon: 'error' });
    }
  };

  if (authLoading) return (
    <div 
      className="h-screen flex flex-col items-center justify-center bg-slate-50"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
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
    <div 
      className="min-h-screen bg-slate-50 font-sans text-slate-900 text-left" 
      style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
    >
      <AppHeader
        user={user}
        setActiveTab={setActiveTab}
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
            refugiosFiltrados={refugiosFiltrados}
            setShowLostPetModal={setShowLostPetModal}
            setShowAdoptionModal={setShowAdoptionModal}
            setShowRefugioModal={setShowRefugioModal}
            user={user}
            abrirConfirmacionBorrado={abrirConfirmacionBorrado}
            userCoords={userCoords}
            locationPermissionGranted={locationPermissionGranted}
            obtenerUbicacion={obtenerUbicacion}
          />
        )}

        {activeTab === 'scanner' && <FoodScanner mascotas={mascotas} onScanComplete={refreshData} initialData={foodParaVer} onReset={() => setFoodParaVer(null)} handleSuscripcion={handleSuscripcion} />}
        {activeTab === 'vet' && <VetScanner mascotas={mascotas} onScanComplete={refreshData} initialData={vetParaVer} onReset={() => setVetParaVer(null)} handleSuscripcion={handleSuscripcion} />}
        {activeTab === 'health' && <SaludScanner mascotas={mascotas} onScanComplete={refreshData} initialData={healthParaVer} onReset={() => setHealthParaVer(null)} handleSuscripcion={handleSuscripcion} />}
        {activeTab === 'stats' && <ReportsManager onVerDetalle={verDetalle} />}
        {activeTab === 'pets' && <PetProfiles mascotas={mascotas} onUpdate={refreshData} onAddClick={() => setShowPetModal(true)} />}
      </main>

      {showPetModal && <PetModal onClose={() => { setShowPetModal(false); refreshData(); }} />}
      {showLostPetModal && <LostPetModal onClose={() => { setShowLostPetModal(false); refreshData(); }} />}
      {showAdoptionModal && <AdoptionModal onClose={() => { setShowAdoptionModal(false); refreshData(); }} />}
      {showRefugioModal && <RefugioModal onClose={() => { setShowRefugioModal(false); refreshData(); }} />}

      {zoomedPhoto && (
        <div 
          className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300 cursor-zoom-out" 
          onClick={() => setZoomedPhoto(null)}
        >
          <button 
            className="absolute right-6 text-white/70 hover:text-white p-2 bg-white/10 rounded-full transition-colors shadow-lg"
            style={{ top: 'calc(1.5rem + env(safe-area-inset-top))' }}
          >
            <X size={24} />
          </button>
          <img 
            src={zoomedPhoto} 
            className="max-w-full max-h-[85vh] rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-500 object-contain border-4 border-white/10" 
            alt="Zoom" 
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleFullLogout}
        handleSuscripcion={handleSuscripcion}
      />
      
      <DeleteConfirmModal
        isOpen={!!itemABorrar}
        onClose={() => setItemABorrar(null)}
        onConfirm={ejecutarBorrado}
        titulo="¿Estás seguro?"
        mensaje={
          itemABorrar?.tipo === 'perdido' ? "El reporte se eliminará permanentemente." : 
          itemABorrar?.tipo === 'adopcion' ? "La publicación de adopción desaparecerá." : 
          "La información del refugio se eliminará del sistema."
        }
      />

      <AppBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default App;