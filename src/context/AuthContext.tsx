import type {ReactNode} from 'react';
import React, {createContext, useCallback, useContext, useEffect, useState} from 'react';
import {api, apiClient} from '../services/api';
import {Capacitor} from '@capacitor/core';
import {GoogleAuth} from '@codetrix-studio/capacitor-google-auth';
import type {UserDTO} from '@/types/api.types';

type RawUserData = {
  id: string;
  nombre?: string;
  name?: string;
  displayName?: string;
  email: string;
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
      foto: esFotoGenerica ? null : (data.foto || data.picture || data.imageUrl),
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
      }
    } catch (error) {
      console.error("Fallo al inicializar autenticación:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

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