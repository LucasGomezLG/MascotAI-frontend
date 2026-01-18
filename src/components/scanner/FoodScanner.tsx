import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {api} from '@/services/api';
import {useAuth} from '@/context/AuthContext';
import {Toast} from '@/utils/alerts';
import Swal from 'sweetalert2';
import type {AlimentoDTO, MascotaDTO, OfertaPrecioDTO} from '@/types/api.types';
import {Camera, CameraResultType, CameraSource} from '@capacitor/camera';
import {useCameraPermissions} from '@/hooks/useCameraPermissions';
import FoodInitialView from './food/FoodInitialView';
import FoodResultView from './food/FoodResultView';
import PriceComparisonModal from './food/PriceComparisonModal';
import SubscriptionCard from '@/services/SuscriptionCard';
import {isAxiosError} from 'axios';

interface FoodScannerProps {
  mascotas: MascotaDTO[];
  initialData?: AlimentoDTO;
  onReset: () => void;
  onScanComplete: () => void;
}

const FoodScanner = ({ mascotas, initialData, onReset, onScanComplete }: FoodScannerProps) => {
  const { user, refreshUser } = useAuth();
  
  const [selectedPet, setSelectedPet] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingBusqueda, setLoadingBusqueda] = useState(false);
  const [loadingResenas, setLoadingResenas] = useState(false);
  
  const [result, setResult] = useState<AlimentoDTO | null>(null);
  const [porcion, setPorcion] = useState<number | null>(null);
  const [precioInput, setPrecioInput] = useState("");
  const [pesoBolsaInput, setPesoBolsaInput] = useState("");
  const [resenasIA, setResenasIA] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [busquedaResult, setBusquedaResult] = useState<OfertaPrecioDTO[]>([]);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const { validarCamara, validarGaleria } = useCameraPermissions();

  const usadosEsteMes = user?.intentosIA || 0;
  const tieneEnergia = user?.esColaborador || (10 - usadosEsteMes) > 0;

  useEffect(() => {
    if (initialData) {
      setResult(initialData);
      setPorcion(initialData.porcionRecomendada || null);
      setPrecioInput(initialData.precioComprado?.toString() || "");
      setPesoBolsaInput(initialData.pesoBolsaKg?.toString() || "");
      if (initialData.mascotaId) setSelectedPet(initialData.mascotaId);
    }
  }, [initialData]);

  const petData = useMemo(() =>
    mascotas.find((p) => p.id === selectedPet),
    [mascotas, selectedPet]
  );

  const handleFullReset = useCallback(() => {
    setResult(null);
    setPrecioInput("");
    setPesoBolsaInput("");
    setResenasIA("");
    setPorcion(null);
    setSelectedImage(null);
    setBusquedaResult([]);
    if (onReset) onReset();
  }, [onReset]);

  const irASuscripcion = () => {
    setShowSubscriptionModal(true);
  };

  const handleScan = async () => {
    if (!tieneEnergia) {
      void Swal.fire({
        title: '¡Límite alcanzado!',
        text: 'Usaste tus 10 escaneos del mes. Colaborá para tener acceso ilimitado y ayudarnos con los servidores.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'SER COLABORADOR ⚡',
        cancelButtonText: 'Luego',
        confirmButtonColor: '#f97316',
      }).then((res) => {
        if (res.isConfirmed) irASuscripcion();
      });
      return;
    }

    if (!selectedImage) return;
    setLoading(true);

    try {
      const res = await api.analizarAlimento(selectedImage, selectedPet);
      await refreshUser();
      const dataIA = res.data.alimento || res.data;
      setResult(dataIA);
      setPorcion(dataIA.porcionRecomendada);
      if (onScanComplete) onScanComplete();
    } catch (e) { 
      if (isAxiosError(e)) {
        const serverMsg = (e.response?.data as { error: string })?.error || (e.response?.data as { message: string })?.message || "";
        if (serverMsg.includes("LIMITE") || e.response?.status === 500) {
          void Swal.fire({ title: 'Atención', text: 'Se agotaron tus créditos mensuales.', icon: 'info' });
        } else {
          void Toast.fire({ icon: 'error', title: 'Error de conexión con IA' });
        }
      }
    } finally { setLoading(false); }
  };

  const calcularCostoDiario = useCallback(() => {
    const p = parseFloat(precioInput);
    const w = parseFloat(pesoBolsaInput);
    const g = porcion || result?.porcionRecomendada;
    if (isNaN(p) || isNaN(w) || !g || w <= 0) return null;
    return ((p / (w * 1000)) * g).toFixed(2);
  }, [precioInput, pesoBolsaInput, porcion, result]);

  const prepararPayload = useCallback((): AlimentoDTO | null => {
    if (!result) return null;

    const petId = result.mascotaId || selectedPet;

    return {
      ...result,
      mascotaId: petId, 
      marca: result.marca || "Desconocido",
      calidad: result.calidad || "MEDIA",
      precioComprado: parseFloat(precioInput) || 0,
      pesoBolsaKg: parseFloat(pesoBolsaInput) || 0,
      costoDiario: parseFloat(calcularCostoDiario() || "0")
    };
  }, [result, selectedPet, precioInput, pesoBolsaInput, calcularCostoDiario]);

  const sincronizarFinanzas = async () => {
    const payload = prepararPayload();
    if (!payload?.id || !precioInput || !pesoBolsaInput) return;
    try { await api.guardarFinanzas(payload); } catch { /* No-op */ }
  };

  const handleActivarBolsa = async () => {
    const payload = prepararPayload();
    if (!payload?.id) return;

    const pesoValido = payload.pesoBolsaKg ?? 0;
    if (pesoValido <= 0) return Swal.fire('Error', 'Ingresá un peso válido.', 'warning');

    try {
      const finalPayload = { ...payload, stockActivo: true };
      await api.activarStock(payload.id, finalPayload);
      setResult(finalPayload);
      void Swal.fire({ title: '¡Seguimiento Activo!', icon: 'success', confirmButtonColor: '#10b981' });
    } catch { /* No-op */ }
  };

  const handleBuscarPrecios = async () => {
    const marca = result?.marca;
    if (!marca) return;
    setLoadingBusqueda(true);
    try {
      const res = await api.buscarPrecios(marca);
      setBusquedaResult(res.data || []);
      setShowPriceModal(true);
    } catch { void Toast.fire({ icon: 'error', title: 'Error de acceso (403)' }); }
    finally { setLoadingBusqueda(false); }
  };

  const handleFetchResenasIA = async () => {
    const marca = result?.marca;
    if (!marca) return;
    setLoadingResenas(true);
    try {
      const res = await api.buscarResenas(marca);
      setResenasIA(res.data.resenas);
    } catch { void Toast.fire({ icon: 'error', title: 'Error de acceso (403)' }); }
    finally { setLoadingResenas(false); }
  };

  const handleNativeCamera = async () => {
    const ok = await validarCamara();
    if (!ok) return;
    try {
      const image = await Camera.getPhoto({ resultType: CameraResultType.Base64, source: CameraSource.Camera });
      if (image.base64String) {
        setSelectedImage(`data:image/jpeg;base64,${image.base64String}`);
        setResult(null);
      }
    } catch { /* No-op */ }
  };

  const handleNativeGallery = async () => {
    const ok = await validarGaleria();
    if (!ok) return;
    try {
      const image = await Camera.getPhoto({ resultType: CameraResultType.Base64, source: CameraSource.Photos });
      if (image.base64String) {
        setSelectedImage(`data:image/jpeg;base64,${image.base64String}`);
        setResult(null);
      }
    } catch { /* No-op */ }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!result ? (
        <FoodInitialView
          mascotas={mascotas} selectedPet={selectedPet} setSelectedPet={setSelectedPet}
          selectedImage={selectedImage} handleNativeCamera={handleNativeCamera}
          handleNativeGallery={handleNativeGallery} handleBorrarFoto={() => setSelectedImage(null)}
          handleScan={handleScan} loading={loading}
        />
      ) : (
        <FoodResultView
          result={{ alimento: result }}
          setResult={(res) => setResult(res?.alimento || null)}
          petData={petData}
          porcion={porcion}
          precioInput={precioInput} setPrecioInput={setPrecioInput}
          pesoBolsaInput={pesoBolsaInput} setPesoBolsaInput={setPesoBolsaInput}
          calcularCostoDiario={calcularCostoDiario} sincronizarFinanzas={sincronizarFinanzas}
          handleActivarBolsa={handleActivarBolsa} handleBuscarPrecios={handleBuscarPrecios}
          handleFetchResenasIA={handleFetchResenasIA} loadingResenas={loadingResenas}
          resenasIA={resenasIA} loadingBusqueda={loadingBusqueda}
          onReset={handleFullReset} setSelectedImage={setSelectedImage}
        />
      )}

      <PriceComparisonModal isOpen={showPriceModal} onClose={() => setShowPriceModal(false)} busquedaResult={busquedaResult} />

      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-150 p-4">
          <div className="bg-white rounded-4xl p-6 max-w-sm w-full relative">
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
    </div>
  );
};

export default FoodScanner;