import { Camera } from '@capacitor/camera';
import Swal from 'sweetalert2';

export const useCameraPermissions = () => {
  
  const pedirPermiso = async (tipo: 'camera' | 'photos', mensaje: string): Promise<boolean> => {
  try {
    const status = await Camera.checkPermissions();
    
    // Si ya está concedido, entramos directo
    if (status[tipo] === 'granted') return true;

    // Si está denegado o nunca se pidió, lo solicitamos explícitamente
    const request = await Camera.requestPermissions({ 
      permissions: [tipo === 'camera' ? 'camera' : 'photos'] 
    });

    if (request[tipo] === 'granted') return true;

    // Si llegamos acá, es que el usuario puso "No"
    Swal.fire({
      title: 'Acceso necesario',
      text: mensaje,
      icon: 'info',
      confirmButtonColor: '#f97316',
    });
    
    return false;
  } catch (error) {
    console.error("Error pidiendo permiso:", error);
    return false;
  }
};

  // ✅ Para el botón que abre la CÁMARA física
  const validarCamara = () => 
    pedirPermiso('camera', 'MascotAI necesita la cámara para capturar la información de tu mascota.');

  // ✅ Para el botón que abre la GALERÍA de fotos
  const validarGaleria = () => 
    pedirPermiso('photos', 'MascotAI necesita acceso a tu galería para elegir fotos guardadas.');

  return { validarCamara, validarGaleria };
};