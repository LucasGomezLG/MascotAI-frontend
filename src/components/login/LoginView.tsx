import {useAuth} from '../../context/AuthContext';
import {PawPrint} from 'lucide-react';

const LoginView = () => {
  const { login } = useAuth();

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-orange-50 p-6">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl text-center border-4 border-orange-100">
        <PawPrint size={80} className="text-orange-500 mx-auto mb-6" />
        <h1 className="text-4xl font-black text-slate-800 mb-2 tracking-tighter">MascotAI</h1>
        <p className="text-slate-500 font-bold mb-8">Cuidá a tus mascotas como un experto</p>
        
        <button 
          onClick={login}
          className="w-full py-4 bg-white border-2 border-slate-200 rounded-2xl font-black flex items-center justify-center gap-3 shadow-sm active:scale-95 transition-all hover:bg-slate-50"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5" alt="google" />
          ENTRAR CON GOOGLE
        </button>
      </div>
    </div>
  );
};

// CORREGIDO: default en lugar de defalut
export default LoginView;