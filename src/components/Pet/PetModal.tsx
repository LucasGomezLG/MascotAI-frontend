import React, {useState} from 'react';
import {
    Calendar,
    Camera as CameraIcon,
    HeartPulse,
    Image as ImageIcon,
    Loader2,
    PawPrint,
    Weight,
    X
} from 'lucide-react';
import {api} from '@/services/api.ts';
import Swal from 'sweetalert2';
import {Camera, CameraResultType, CameraSource} from '@capacitor/camera';
import {useCameraPermissions} from '@/hooks/useCameraPermissions.ts';
import {isAxiosError} from 'axios';

interface PetModalProps { onClose: () => void; }

interface PetFormState {
  nombre: string;
  especie: string;
  fechaNacimiento: string;
  peso: string;
  condicion: string;
  foto: string;
}

const PetModal = ({ onClose }: PetModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [nuevaMascota, setNuevaMascota] = useState<PetFormState>({
    nombre: '', especie: 'Gato', fechaNacimiento: '', peso: '', condicion: '', foto: ''
  });

  const { validarCamara, validarGaleria } = useCameraPermissions();
  const hoy = new Date().toISOString().split("T")[0];

  const processNativeImage = async (source: CameraSource) => {
    const ok = source === CameraSource.Camera ? await validarCamara() : await validarGaleria();
    if (!ok) return;
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        resultType: CameraResultType.Uri,
        source,
        width: 1024,
        allowEditing: false
      });
      if (image.webPath) {
        setNuevaMascota(prev => ({ ...prev, foto: image.webPath! }));
        const response = await fetch(image.webPath);
        const file = new File([await response.blob()], `pet_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setSelectedFile(file);
      }
    } catch { /* Cancelado por usuario */ }
  };

  const guardar = async () => {
    const { nombre, fechaNacimiento, peso, condicion, especie } = nuevaMascota;
    const pesoNum = parseFloat(peso);

    if (!selectedFile) return alertValidacion('¡Falta la foto!', 'Es necesario identificar a tu mascota con una imagen.');
    if (!nombre.trim()) return alertValidacion('Nombre requerido', 'Tu mascota necesita un nombre para su perfil.');
    if (nombre.length > 20) return alertValidacion('Nombre muy largo', 'El nombre no puede superar los 20 caracteres.');
    if (!fechaNacimiento) return alertValidacion('Fecha requerida', 'Indica cuándo nació tu mascota.');
    if (fechaNacimiento > hoy) return alertValidacion('Fecha inválida', 'La fecha de nacimiento no puede ser una fecha futura.');
    if (!peso || isNaN(pesoNum)) return alertValidacion('Peso requerido', 'Ingresa el peso aproximado de tu mascota.');
    if (pesoNum < 0.1 || pesoNum > 100) return alertValidacion('Peso fuera de rango', 'El peso debe estar entre 0.1 y 100 kg.');

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('nombre', nombre.trim());
    formData.append('especie', especie);
    formData.append('fechaNacimiento', fechaNacimiento);
    formData.append('peso', String(pesoNum));
    formData.append('condicion', condicion.trim() || "Sano");

    setLoading(true);
    try {
      await api.registrarConFoto(formData);
      void Swal.fire({ title: '¡Registrada!', text: `${nombre} ya es parte de MascotAI`, icon: 'success', timer: 2000, showConfirmButton: false, customClass: { popup: 'rounded-[2rem]' } });
      onClose();
    } catch (e) {
      if (isAxiosError(e)) {
        console.error("Error al registrar mascota:", e.message);
      }
      void Swal.fire({ title: 'Error', text: 'No pudimos guardar los datos en el servidor.', icon: 'error', customClass: { popup: 'rounded-[2rem]' } });
    } finally {
      setLoading(false);
    }
  };

  const alertValidacion = (title: string, text: string) => {
    void Swal.fire({ title, text, icon: 'warning', confirmButtonColor: '#f97316', customClass: { popup: 'rounded-[2rem]' } });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.2)] relative animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">

        <button onClick={onClose} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-colors p-2 bg-slate-50 rounded-full">
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="bg-orange-100 p-2 rounded-xl text-orange-600"><PawPrint size={24} fill="currentColor" /></div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">Nueva Mascota</h3>
        </div>

        <div className="space-y-8">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="absolute -top-3 -right-3 flex flex-col gap-2 z-50">
                <button type="button" onClick={() => processNativeImage(CameraSource.Camera)} className="bg-orange-500 text-white p-3 rounded-2xl shadow-xl border-[4px] border-white active:scale-90 transition-all">
                  <CameraIcon size={20} strokeWidth={2.5} />
                </button>
                <button type="button" onClick={() => processNativeImage(CameraSource.Photos)} className="bg-slate-800 text-white p-3 rounded-2xl shadow-xl border-[4px] border-white active:scale-90 transition-all">
                  <ImageIcon size={20} strokeWidth={2.5} />
                </button>
              </div>

              <div className={`w-32 h-32 rounded-[2.5rem] border-[6px] shadow-inner overflow-hidden flex items-center justify-center transition-all duration-500 ${!selectedFile ? 'border-orange-50 bg-orange-50/50' : 'border-orange-100 bg-white'}`}>
                {nuevaMascota.foto ? (
                  <img src={nuevaMascota.foto} alt="Preview" className="w-full h-full object-cover animate-in fade-in" />
                ) : (
                  <div className="flex flex-col items-center gap-1 opacity-40">
                    <CameraIcon size={32} className="text-orange-300" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-orange-400">Requerida</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative group">
              <input
                placeholder="Nombre de tu mascota"
                maxLength={20}
                className="w-full p-5 pl-12 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-orange-500 outline-none transition-all"
                value={nuevaMascota.nombre}
                onChange={e => setNuevaMascota({ ...nuevaMascota, nombre: e.target.value })}
              />
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors" size={20} />
            </div>

            <div className="flex bg-slate-50 p-1 rounded-2xl border-2 border-transparent focus-within:border-orange-500 transition-all">
              <button
                type="button"
                onClick={() => setNuevaMascota({ ...nuevaMascota, especie: 'Gato' })}
                className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${nuevaMascota.especie === 'Gato' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'}`}
              >
                GATO 🐈
              </button>
              <button
                type="button"
                onClick={() => setNuevaMascota({ ...nuevaMascota, especie: 'Perro' })}
                className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${nuevaMascota.especie === 'Perro' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'}`}
              >
                PERRO 🐕
              </button>
            </div>

            <div className="flex gap-3">
              <div className="w-1/2 relative group">
                <input
                  type="date" max={hoy}
                  className="w-full p-4 pl-11 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-orange-500 outline-none text-xs transition-all"
                  onChange={e => setNuevaMascota({ ...nuevaMascota, fechaNacimiento: e.target.value })}
                />
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              </div>
              <div className="w-1/2 relative group">
                <input
                  type="number" step="0.1" placeholder="Peso"
                  className="w-full p-4 pl-11 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-orange-500 outline-none transition-all"
                  value={nuevaMascota.peso}
                  onChange={e => e.target.value.length <= 4 && setNuevaMascota({ ...nuevaMascota, peso: e.target.value })}
                />
                <Weight className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative group">
                <input
                  type="text"
                  maxLength={20}
                  placeholder="Estado de salud (Opcional)"
                  className="w-full p-5 pl-12 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-orange-500 focus:bg-white outline-none text-sm transition-all"
                  value={nuevaMascota.condicion}
                  onChange={e => setNuevaMascota({ ...nuevaMascota, condicion: e.target.value })}
                />
                <HeartPulse
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors"
                  size={20}
                />
              </div>

              <p className="text-[9px] font-bold text-slate-400 ml-2 leading-tight">
                * Ej: Alergias, Dieta, Medicación. Si queda vacío, se guardará como
                <span className="text-orange-500 ml-1 uppercase">"Sano"</span>.
              </p>
            </div>

            <button
              onClick={guardar}
              disabled={loading}
              className="w-full py-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-orange-200 active:scale-95 transition-all mt-6 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" /> : "REGISTRAR MASCOTA"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const UserIcon = ({ className, size }: { className?: string, size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

export default PetModal;