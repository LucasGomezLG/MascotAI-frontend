import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, apiClient } from '../services/api';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const SERVER_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

  const formatUserData = (data: any) => {
    if (!data) return null;
    const raw = data.data || data.user || data;
    const esFotoGenerica = raw.foto?.includes('picture/0') || raw.picture?.includes('picture/0');

    return {
      ...raw,
      name: raw.nombre || raw.name || raw.displayName || 'Usuario',
      picture: esFotoGenerica ? null : (raw.foto || raw.picture || raw.imageUrl),
      nombre: raw.nombre || raw.name,
      foto: raw.foto || raw.picture,
      intentosIA: raw.intentosIA || 0,
      esColaborador: raw.esColaborador || false
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

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      GoogleAuth.initialize();
    }
    initAuth();
  }, []);

  /**
   * 🔄 refreshUser: Versión final para Mobile
   */
  // context/AuthContext.tsx

  const refreshUser = async () => {
    try {
      // 1. Usamos el nuevo endpoint de refresco
      const res = await api.refreshProfileData();

      if (res && res.data) {
        const formatted = formatUserData(res.data);

        // 2. Actualizamos el estado con un objeto nuevo
        // Esto dispara el re-render en todos los componentes
        setUser({ ...formatted });

        formatted.intentosIA;
        return formatted;
      }
    } catch (error) {
      console.error("❌ Error en el refresco forzado:", error);
    }
    return null;
  };

  const initAuth = async () => {
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
      setUser(null);
    } finally {
      setLoading(false);
    }
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
      } catch (error) { console.error("Error Login:", error); }
    } else {
      localStorage.setItem('mascotai_logged_in', 'true');
      window.location.href = `${SERVER_URL}/oauth2/authorization/google`;
    }
  };

  const logout = async () => {
    try {
      localStorage.clear();
      await api.logout();
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

export const useAuth = () => useContext(AuthContext);