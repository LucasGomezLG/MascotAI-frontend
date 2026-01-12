import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, apiClient } from '../services/api';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const SERVER_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

  // ✅ Función Maestra de Formateo: Mantenida exactamente igual
  const formatUserData = (data: any) => {
    if (!data) return null;
    const raw = data.data || data.user || data;
    const esFotoGenerica = raw.foto?.includes('picture/0') || raw.picture?.includes('picture/0');
    
    return {
      ...raw,
      name: raw.nombre || raw.name || raw.displayName || 'Usuario',
      picture: esFotoGenerica ? null : (raw.foto || raw.picture || raw.imageUrl),
      nombre: raw.nombre || raw.name,
      foto: raw.foto || raw.picture
    };
  };

  // 🛡️ INTERCEPTOR GLOBAL DE AUTENTICACIÓN (401)
  useEffect(() => {
    const interceptor = apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        // Si el servidor nos dice que no estamos autorizados (Token vencido o sesión cerrada)
        if (error.response && error.response.status === 401) {
          console.warn("⚠️ Sesión inválida detectada por el centinela. Limpiando estado...");
          localStorage.removeItem('mascotai_logged_in');
          setUser(null);
          // Opcional: window.location.href = window.location.origin; (Para limpiar la URL en web)
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

  const initAuth = async () => {
    const wasLoggedIn = localStorage.getItem('mascotai_logged_in') === 'true';
    if (!wasLoggedIn) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.getUserProfile();
      if (res && res.data) {
        const formatted = formatUserData(res.data);
        console.log("👤 Usuario cargado con éxito:", formatted);
        setUser(formatted);
      } else {
        // Si la respuesta llega vacía pero el interceptor no saltó
        setUser(null);
      }
    } catch (error) {
      console.error("❌ Error en carga inicial de usuario:", error);
      // El interceptor 401 ya se encarga de limpiar el estado si es error de auth
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const googleUser = await GoogleAuth.signIn();
        const res = await api.loginNativoGoogle(googleUser.authentication.idToken);
        if (res && res.data) {
          setUser(formatUserData(res.data));
          localStorage.setItem('mascotai_logged_in', 'true');
        }
      } catch (error) {
        console.error("Error Login Nativo:", error);
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
      console.warn("Error enviando petición de logout al servidor");
    } finally {
      setUser(null);
      // En Web volvemos al origen para limpiar estados de OAuth2
      if (!Capacitor.isNativePlatform()) {
        window.location.href = window.location.origin;
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);