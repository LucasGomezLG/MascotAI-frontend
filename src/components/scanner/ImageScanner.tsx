import React from 'react';
import {Camera as CameraIcon} from 'lucide-react';
import {Camera, CameraResultType, CameraSource} from '@capacitor/camera';
import {useCameraPermissions} from '@/hooks/useCameraPermissions.ts';

interface Props {
  onImageReady: (base64: string) => void;
  label: string;
  className?: string;
  disabled?: boolean;
}

const ImageScanner = ({ onImageReady, label, className, disabled }: Props) => {
  const { validarCamara, validarGaleria } = useCameraPermissions();

  const handleCapture = async () => {
    if (disabled) return;

    const camOk = await validarCamara();
    if (!camOk) return;

    const galOk = await validarGaleria();
    if (!galOk) return;

    try {
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
        onImageReady(`data:image/jpeg;base64,${image.base64String}`);
      }
    } catch {
      console.log("El usuario canceló la selección.");
    }
  };

  return (
    <button 
      type="button" 
      onClick={handleCapture}
      disabled={disabled}
      className={className || `bg-orange-600 text-white p-4 rounded-2xl flex items-center justify-center gap-2 font-black uppercase text-[10px] shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:bg-slate-300 disabled:scale-100`}
    >
      <CameraIcon size={16} /> 
      {disabled ? "Sin Energía" : label}
    </button>
  );
};

export default ImageScanner;