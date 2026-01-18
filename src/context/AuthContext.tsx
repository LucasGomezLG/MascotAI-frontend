import type {ReactNode} from 'react';
import React, {createContext, useCallback, useContext, useEffect, useState} from 'react';
import {api, apiClient} from '../services/api';
import {Capacitor} from '@capacitor/core';
import {GoogleAuth} from '@codetrix-studio/capacitor-google-auth';
import type {UserDTO} from '@/types/api.types';
import type {Messaging} from "firebase/messaging";
import {getMessaging, getToken, onMessage} from "firebase/messaging";
import {initializeApp} from "firebase/app";
import toast from 'react-hot-toast';

// Configuración de Firebase usando variables de entorno
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Inicializar Firebase
let messaging: Messaging | null = null;
try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    const app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
  } else {
    console.warn("Firebase config is missing apiKey or projectId. Push notifications will not work.");
  }
} catch (e) {
  console.error("Error initializing Firebase:", e);
}

type RawUserData = {
  id: string;
  nombre?: string;
  name?: string;
  displayName?: string;
  email?: string;
  foto?: string | null;
  picture?: string;
  imageUrl?: string;
  intentosIA?: number;
  intentosRestantes?: number;
  esColaborador?: boolean;
};

interface AuthContextType {
  user: UserDTO | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<UserDTO | null>>;
  refreshUser: () => Promise<UserDTO | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const SERVER_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

  const formatUserData = (data: RawUserData): UserDTO => {
    const esFotoGenerica = data.foto?.includes('picture/0') || data.picture?.includes('picture/0');

    return {
      ...data,
      id: data.id,
      nombre: data.nombre || data.name || data.displayName || 'Usuario',
      email: data.email,
      foto: esFotoGenerica ? undefined : (data.foto || data.picture || data.imageUrl) || undefined,
      intentosIA: data.intentosIA || 0,
      intentosRestantes: data.intentosRestantes || 0,
      esColaborador: data.esColaborador || false,
    };
  };

  useEffect(() => {
    const interceptor = apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('mascotai_logged_in');
          setUser(null);
        }
        return Promise.reject(error);
      }
    );
    return () => apiClient.interceptors.response.eject(interceptor);
  }, []);

  // Manejo de notificaciones en primer plano
  useEffect(() => {
    if (!messaging) return;
    
    const unsubscribe = onMessage(messaging, (payload) => {
      // console.log('Notificación en primer plano:', payload);
      if (payload.notification) {
        toast(
          (t) => (
            <div onClick={() => toast.dismiss(t.id)}>
              <p className="font-bold">{payload.notification?.title}</p>
              <p className="text-sm">{payload.notification?.body}</p>
            </div>
          ),
          {
            icon: '🔔',
            style: {
              borderRadius: '12px',
              background: '#fff',
              color: '#333',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              border: '1px solid #f0f0f0',
            },
            duration: 5000,
          }
        );
      }
    });
    return () => unsubscribe();
  }, []);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.log('Este navegador no soporta notificaciones de escritorio');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  };

  const registerFCMToken = useCallback(async () => {
    if (!messaging) {
      return;
    }

    try {
      // Solicitar permiso explícitamente antes de intentar obtener el token
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        console.log('Permiso de notificaciones denegado o no concedido.');
        return;
      }

      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY?.trim();
      
      if (!vapidKey || vapidKey === 'TU_VAPID_KEY_AQUI') {
        console.warn('VITE_FIREBASE_VAPID_KEY no está configurada correctamente en .env');
        return;
      }

      const currentToken = await getToken(messaging, { vapidKey });
      if (currentToken) {
        // console.log('Token FCM obtenido:', currentToken);
        await api.registerDeviceToken(currentToken);
        // console.log('Token FCM registrado en el backend con éxito.');
      } else {
        console.log('No se pudo obtener el token. El usuario necesita dar permisos.');
      }
    } catch (error: unknown) {
      console.error('Error al registrar el token FCM:', error);
      // Verificamos si el error es un objeto y tiene la propiedad 'code'
      if (typeof error === 'object' && error !== null && 'code' in error) {
        const firebaseError = error as { code: string };
        if (firebaseError.code === 'messaging/permission-blocked') {
          toast.error('Las notificaciones están bloqueadas. Por favor, habilítalas en la configuración de tu navegador para recibir alertas.', {
              duration: 6000,
              style: {
                  borderRadius: '10px',
                  background: '#333',
                  color: '#fff',
              },
          });
        }
      }
    }
  }, []);

  const initAuth = useCallback(async () => {
    const wasLoggedIn = localStorage.getItem('mascotai_logged_in') === 'true';
    if (!wasLoggedIn) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.getUserProfile();
      if (res && res.data) {
        setUser(formatUserData(res.data));
        // Registrar token FCM al inicializar auth si el usuario está logueado
        registerFCMToken();
      }
    } catch (error) {
      console.error("Fallo al inicializar autenticación:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [registerFCMToken]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      GoogleAuth.initialize();
    }
    void initAuth();
  }, [initAuth]);

  const refreshUser = async (): Promise<UserDTO | null> => {
    try {
      const res = await api.refreshProfileData();
      if (res && res.data) {
        const formatted = formatUserData(res.data);
        setUser(formatted);
        return formatted;
      }
    } catch (error) {
      console.error("Fallo al refrescar usuario:", error);
    }
    return null;
  };

  const login = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const googleUser = await GoogleAuth.signIn();
        const res = await api.loginGoogleNative(googleUser.authentication.idToken);
        if (res && res.data) {
          setUser(formatUserData(res.data));
          localStorage.setItem('mascotai_logged_in', 'true');
          // Registrar token FCM tras login nativo exitoso
          registerFCMToken();
        }
      } catch (error) {
        console.error("Error en Login nativo:", error);
      }
    } else {
      localStorage.setItem('mascotai_logged_in', 'true');
      window.location.href = `${SERVER_URL}/oauth2/authorization/google`;
    }
  };

  const logout = async () => {
    try {
      localStorage.clear();
      await api.logout();
    } catch (error) {
      console.error("Error durante el logout:", error);
    } finally {
      setUser(null);
      if (!Capacitor.isNativePlatform()) window.location.href = window.location.origin;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};