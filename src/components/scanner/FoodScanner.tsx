import React, { useState, useEffect, useMemo } from 'react';
import { AlertCircle, Info } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Toast } from '../../utils/alerts';
import Swal from 'sweetalert2';

// 🛡️ IMPORTACIONES NATIVAS
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { useCameraPermissions } from '../../hooks/useCameraPermissions';

// ✅ NUEVOS COMPONENTES
import FoodInitialView from './food/FoodInitialView';
import FoodResultView from './food/FoodResultView';
import PriceComparisonModal from './food/PriceComparisonModal';

const FoodScanner = ({ mascotas, initialData, onReset, onScanComplete }: any) => {
  const { user, refreshUser } = useAuth();
  const [selectedPet, setSelectedPet] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingBusqueda, setLoadingBusqueda] = useState(false);
  const [loadingResenas, setLoadingResenas] = useState(false);
  const [loadingSuscripcion, setLoadingSuscripcion] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [porcion, setPorcion] = useState<number | null>(null);
  const [precioInput, setPrecioInput] = useState("");
  const [pesoBolsaInput, setPesoBolsaInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [busquedaResult, setBusquedaResult] = useState<any[]>([]);
  const [resenas, setResenas] = useState<string[]>([]);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showBrandWarning, setShowBrandWarning] = useState(false);
  const [alertasSalud, setAlertasSalud] = useState<any[]>([]);

  const { validarCamara, validarGaleria } = useCameraPermissions();

  const restantes = Math.max(0, 10 - (user?.intentosIA || 0));
  const tieneEnergia = user?.esColaborador || restantes > 0;

  // 🛡️ MODAL DE DONACIÓN
  const ejecutarFlujoDonacion = () => {
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
        if (amount > 500000) return 'El monto máximo permitido es $500.000';
      },
      customClass: { popup: 'rounded-[2rem]' }
    }).then(async (result) => {
      if (result.isConfirmed) {
        const montoElegido = result.value;
        setLoadingSuscripcion(true);
        try {
          const response = await api.crearSuscripcion(montoElegido);
          window.location.href = response.data.url;
        } catch (error) {
          Swal.fire('Error', 'No se pudo generar el link de pago.', 'error');
        } finally {
          setLoadingSuscripcion(false);
        }
      }
    });
  };

  // 🛡️ MODAL DE LÍMITE AGOTADO
  const mostrarModalLimite = () => {
    Swal.fire({
      title: '¡Energía de IA Agotada! ⚡',
      text: 'Has alcanzado el límite de 10 escaneos gratuitos este mes. Colaborá para tener análisis ilimitados.',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Ser Colaborador ❤️',
      cancelButtonText: 'Más tarde',
      confirmButtonColor: '#f97316',
      cancelButtonColor: '#94a3b8',
      reverseButtons: true,
      customClass: { popup: 'rounded-[2.5rem]' }
    }).then((res) => {
      if (res.isConfirmed) {
        ejecutarFlujoDonacion();
      }
    });
  };

  const petData = useMemo(() =>
    mascotas.find((p: any) => p.id === selectedPet),
    [mascotas, selectedPet]
  );

  useEffect(() => {
    api.getAlertasSalud().then(res => setAlertasSalud(res.data || []));

    if (initialData) {
      const normalized = initialData.alimento ? initialData : { alimento: initialData, ...initialData };
      setResult(normalized);
      setPorcion(normalized.alimento?.porcionRecomendada || null);
      setPrecioInput(normalized.alimento?.precioComprado?.toString() || "");
      setPesoBolsaInput(normalized.alimento?.pesoBolsaKg?.toString() || "");
      setBusquedaResult(Array.isArray(normalized.alimento?.preciosOnlineIA) ? normalized.alimento.preciosOnlineIA : []);

      if (normalized.alimento?.mascotaId) {
        setSelectedPet(normalized.alimento.mascotaId);
      }
    }
  }, [initialData]);

  const handleNativeCamera = async () => {
    const ok = await validarCamara();
    if (!ok) return;
    try {
      const image = await Camera.getPhoto({
        quality: 90, allowEditing: false, resultType: CameraResultType.Base64, source: CameraSource.Camera
      });
      if (image.base64String) {
        setSelectedImage(`data:image/jpeg;base64,${image.base64String}`);
        setResult(null);
        setPorcion(null);
        setResenas([]);
      }
    } catch (error) { console.log("Cámara cancelada"); }
  };

  const handleNativeGallery = async () => {
    const ok = await validarGaleria();
    if (!ok) return;
    try {
      const image = await Camera.getPhoto({
        quality: 90, allowEditing: false, resultType: CameraResultType.Base64, source: CameraSource.Photos
      });
      if (image.base64String) {
        setSelectedImage(`data:image/jpeg;base64,${image.base64String}`);
        setResult(null);
      }
    } catch (error) { console.log("Galería cancelada"); }
  };

  const handleBorrarFoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImage(null);
  };

  const handleScan = async () => {
    // 🛡️ VALIDACIÓN DE CRÉDITOS
    if (!tieneEnergia) {
      mostrarModalLimite();
      return;
    }

    if (!selectedImage) return;
    setLoading(true);
    try {
      const res = await api.analizarAlimento(selectedImage, selectedPet || "");
      
      // ✅ IMPORTANTE PARA MOBILE: Refrescar antes de cambiar el estado de la UI
      await refreshUser();
      
      setResult(res.data);
      if (res.data.error === "NO_ES_ALIMENTO") return;
      if (res.data.alimento) {
        setPorcion(res.data.porcionSugerida || res.data.alimento.porcionRecomendada);
        if (res.data.alimento.precioComprado) setPrecioInput(res.data.alimento.precioComprado.toString());
        if (onScanComplete) onScanComplete();
      }
    } catch (e: any) {
      if (e.response?.status === 403 || e.toString().includes("LIMITE_IA_ALCANZADO")) {
        await refreshUser(); // Sincronizar incluso en error 403
        mostrarModalLimite();
      } else {
        Toast.fire({ icon: 'error', title: 'Error de conexión' });
      }
    } finally { setLoading(false); }
  };

  const calcularCostoDiario = () => {
    const p = parseFloat(precioInput);
    const w = parseFloat(pesoBolsaInput);
    if (!p || !w || !porcion) return null;
    return ((p / (w * 1000)) * porcion).toFixed(2);
  };

  const sincronizarFinanzas = async () => {
    if (!result?.alimento?.id || !precioInput || !pesoBolsaInput) return;
    const p = parseFloat(precioInput);
    const w = parseFloat(pesoBolsaInput);
    if (p < w) {
      Swal.fire({
        title: '¿Valores invertidos?',
        text: `Ingresaste un precio ($) menor al peso (kg). ¿Estás seguro?`,
        icon: 'question',
        confirmButtonColor: '#f27121',
        showCancelButton: true,
        confirmButtonText: 'Sí',
        cancelButtonText: 'Corregir'
      }).then((res) => { if (res.isConfirmed) enviarFinanzas(p, w); });
      return;
    }
    enviarFinanzas(p, w);
  };

  const enviarFinanzas = async (p: number, w: number) => {
    try {
      await api.guardarFinanzas({
        id: result.alimento.id, precio: p.toString(), peso: w.toString(),
        costoDiario: calcularCostoDiario(), busquedaIA: busquedaResult, porcionRecomendada: porcion
      });
    } catch (e) { console.error(e); }
  };

  const handleActivarBolsa = async () => {
    if (!result?.alimento?.id) return;
    try {
      await api.activarStock(result.alimento.id, {
        precioComprado: precioInput, pesoBolsaKg: pesoBolsaInput, costoDiario: calcularCostoDiario()
      });
      setResult({ ...result, alimento: { ...result.alimento, stockActivo: true } });
      Swal.fire({ title: '¡Bolsa activada!', icon: 'success', confirmButtonColor: '#f27121' });
    } catch (e) { console.error(e); }
  };

  const handleBuscarPrecios = async () => {
    if (!tieneEnergia) { mostrarModalLimite(); return; }

    const marca = result?.alimento?.marca;
    if (!marca || marca.toLowerCase().includes("desconocida")) {
      setShowBrandWarning(true);
      return;
    }

    setLoadingBusqueda(true);
    try {
      const res = await api.buscarPrecios(marca);
      await refreshUser(); // ✅ Sincronizar créditos tras búsqueda
      setBusquedaResult(res.data || []);
      setShowPriceModal(true);
    } catch (e: any) {
      if (e.response?.status === 403) mostrarModalLimite();
      console.error("Error buscando precios:", e);
    } finally {
      setLoadingBusqueda(false);
    }
  };

  const handleBuscarResenas = async () => {
    if (!tieneEnergia) { mostrarModalLimite(); return; }

    const marca = result?.alimento?.marca;
    if (!marca || marca.toLowerCase().includes("desconocida")) {
      setShowBrandWarning(true);
      return;
    }

    setLoadingResenas(true);
    try {
      const res = await api.buscarResenas(marca);
      await refreshUser(); // ✅ Sincronizar créditos tras búsqueda

      const textoResenas = res.data.resenas || res.data;
      const lineas = typeof textoResenas === 'string' ? textoResenas.split('\n') : [];

      const lista = lineas.find((l: string) => l.includes('|'))?.split('|')
        .map((s: string) => s.trim())
        .filter((s: string) => s.toUpperCase().includes("BUENO:") || s.toUpperCase().includes("MALO:")) || [];

      setResenas(lista);
    } catch (e: any) {
      if (e.response?.status === 403) mostrarModalLimite();
      console.error("Error buscando reseñas:", e);
    } finally {
      setLoadingResenas(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {alertasSalud.length > 0 && (
        <div className="mb-6 space-y-2 text-left">
          {alertasSalud.map((alerta, idx) => (
            <div key={idx} className="bg-red-600 text-white p-4 rounded-2xl shadow-lg flex items-center gap-3 border-2 border-red-400">
              <div className="bg-white/20 p-2 rounded-lg"><AlertCircle size={20} /></div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase opacity-80 leading-none mb-1 tracking-widest">Alerta de Salud</p>
                <p className="text-xs font-black">{alerta.tipo}: {alerta.nombre} vence el {alerta.proximaFecha}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {!result ? (
        <FoodInitialView
          mascotas={mascotas}
          selectedPet={selectedPet}
          setSelectedPet={setSelectedPet}
          selectedImage={selectedImage}
          handleNativeCamera={handleNativeCamera}
          handleNativeGallery={handleNativeGallery}
          handleBorrarFoto={handleBorrarFoto}
          handleScan={handleScan}
          loading={loading}
        />
      ) : (
        <FoodResultView
          result={result}
          setResult={setResult}
          petData={petData}
          porcion={porcion}
          precioInput={precioInput}
          setPrecioInput={setPrecioInput}
          pesoBolsaInput={pesoBolsaInput}
          setPesoBolsaInput={setPesoBolsaInput}
          sincronizarFinanzas={sincronizarFinanzas}
          calcularCostoDiario={calcularCostoDiario}
          handleActivarBolsa={handleActivarBolsa}
          handleBuscarPrecios={handleBuscarPrecios}
          loadingBusqueda={loadingBusqueda}
          handleBuscarResenas={handleBuscarResenas}
          loadingResenas={loadingResenas}
          resenas={resenas}
          onReset={onReset}
          setSelectedImage={setSelectedImage}
        />
      )}

      <PriceComparisonModal
        isOpen={showPriceModal}
        onClose={() => setShowPriceModal(false)}
        busquedaResult={busquedaResult}
      />

      <div className="mt-10 bg-amber-50/80 border border-amber-200 p-6 rounded-[2.5rem] shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-700 text-left">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-amber-100 p-2 rounded-xl text-amber-600"><Info size={20} /></div>
          <h4 className="font-black text-amber-900 uppercase text-xs tracking-widest">¿Cómo funciona?</h4>
        </div>
        <div className="space-y-3">
          <p className="text-[11px] font-bold text-amber-800/90 leading-relaxed"><span className="text-amber-900 font-black uppercase text-[9px]">IA Nutricional:</span> Analiza la etiqueta para darte la gama y calidad.</p>
          <p className="text-[11px] font-bold text-amber-800/90 leading-relaxed"><span className="text-amber-900 font-black uppercase text-[9px]">Raciones:</span> Calcula gramos exactos según la salud de tu mascota.</p>
          <p className="text-[11px] font-bold text-amber-800/90 leading-relaxed"><span className="text-amber-900 font-black uppercase text-[9px]">Finanzas:</span> Seguimiento de costo diario y ofertas online.</p>
        </div>
      </div>
    </div>
  );
};

export default FoodScanner;