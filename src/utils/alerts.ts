import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

// Configuramos el "Toast" (la alerta tipo burbuja) con tu identidad visual
export const Toast = MySwal.mixin({
  customClass: {
    popup: 'rounded-[2.5rem] p-8 border-2 border-orange-50 shadow-2xl',
    title: 'font-black text-slate-800 tracking-tight',
    htmlContainer: 'font-medium text-slate-600',
    confirmButton: 'bg-orange-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-lg hover:bg-orange-700 transition-all outline-none',
    cancelButton: 'bg-slate-200 text-slate-600 px-8 py-3 rounded-2xl font-black text-xs uppercase ml-2 outline-none'
  },
  buttonsStyling: false,
  // Esto hace que la alerta se vea más integrada y no como un pop-up invasivo
});

// Función rápida para alertas de éxito
export const alertSuccess = (title: string, text: string) => {
    Toast.fire({
        icon: 'success',
        title,
        text,
        iconColor: '#22c55e', // Verde de tu app
        confirmButtonText: 'ENTENDIDO'
    });
};

// Función rápida para alertas de error
export const alertError = (title: string, text: string) => {
    Toast.fire({
        icon: 'error',
        title,
        text,
        iconColor: '#ef4444', // Rojo para errores
        confirmButtonText: 'REINTENTAR'
    });
};