import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const SERVER_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

  // ✅ Función Maestra de Formateo: Busca los datos en cualquier rincón del objeto
  const formatUserData = (data: any) => {
    if (!data) return null;
    
    // Si la data viene anidada (data.data o data.user), la extraemos
    const raw = data.data || data.user || data;
    
    // Detectamos la foto genérica /picture/0 que mencionaste
    const esFotoGenerica = raw.foto?.includes('picture/0') || raw.picture?.includes('picture/0');
    
    return {
      ...raw,
      // Aseguramos que siempre existan 'name' y 'picture' para el Header
      name: raw.nombre || raw.name || raw.displayName || 'Usuario',
      picture: esFotoGenerica ? null : (raw.foto || raw.picture || raw.imageUrl),
      // Mantenemos los nombres de tu MongoDB
      nombre: raw.nombre || raw.name,
      foto: raw.foto || raw.picture
    };
  };

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
      // ✅ Si res es la respuesta de Axios, res.data es el cuerpo
      if (res) {
        const formatted = formatUserData(res);
        console.log("👤 Usuario cargado:", formatted);
        setUser(formatted);
      }
    } catch (error) {
      console.error("❌ Error en initAuth:", error);
      localStorage.removeItem('mascotai_logged_in');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const googleUser = await GoogleAuth.signIn();
        const res = await api.loginNativoGoogle(googleUser.authentication.idToken);
        if (res) {
          setUser(formatUserData(res));
          localStorage.setItem('mascotai_logged_in', 'true');
        }
      } catch (error) {
        console.error("Error Login:", error);
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
      console.warn("Error logout");
    } finally {
      setUser(null);
      window.location.href = window.location.origin;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);