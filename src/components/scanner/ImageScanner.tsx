import React from 'react';
import { Camera as CameraIcon } from 'lucide-react';
// 🛡️ IMPORTACIONES NATIVAS
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { useCameraPermissions } from '../../hooks/useCameraPermissions';

interface Props {
  onImageReady: (base64: string) => void;
  label: string;
  className?: string;
}

const ImageScanner = ({ onImageReady, label, className }: Props) => {
  // 🛡️ HOOK DE PERMISOS (Usando las nuevas funciones separadas)
  const { validarCamara, validarGaleria } = useCameraPermissions();

  const handleCapture = async () => {
    // 1. Para usar el 'Prompt' (menú de selección), validamos ambos permisos
    // Esto asegura que el usuario no tenga problemas elija la opción que elija.
    const camOk = await validarCamara();
    if (!camOk) return;

    const galOk = await validarGaleria();
    if (!galOk) return;

    try {
      // 2. Abrir la interfaz nativa con el menú de selección
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt, 
        promptLabelHeader: '¿De dónde sacamos la imagen?',
        promptLabelPhoto: 'Galería de fotos',
        promptLabelPicture: 'Tomar una foto'
      });

      if (image.base64String) {
        // Devolvemos el string base64 con el prefijo correcto
        onImageReady(`data:image/jpeg;base64,${image.base64String}`);
      }
    } catch (error) {
      console.log("El usuario canceló la selección.");
    }
  };

  return (
    <button 
      type="button" 
      onClick={handleCapture}
      className={className || "bg-orange-600 text-white p-4 rounded-xl flex items-center justify-center gap-2 font-black uppercase text-[10px] shadow-lg active:scale-95 transition-all"}
    >
      <CameraIcon size={16} /> {label}
    </button>
  );
};

export default ImageScanner;