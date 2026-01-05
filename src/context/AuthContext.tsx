import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { Capacitor } from '@capacitor/core'; // 👈 Importante para detectar plataforma
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const SERVER_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

  useEffect(() => {
    // Inicializar el plugin nativo una sola vez
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
      if (res?.data?.email) {
        setUser(res.data);
      } else {
        localStorage.removeItem('mascotai_logged_in');
      }
    } catch (error) {
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
        const idToken = googleUser.authentication.idToken;

        // 1. Llamada al backend en Railway
        const res = await api.loginNativoGoogle(idToken);

        if (res.data) {
          // 2. Mapeo de datos: Si el backend devuelve el nombre como 'nombre',
          // nos aseguramos de que el estado lo tenga disponible.
          const userData = {
            ...res.data,
            // 🛡️ Si la foto es el placeholder 'picture/0', usamos la de googleUser que es real
            foto: res.data.foto?.includes('picture/0') ? googleUser.imageUrl : res.data.foto,
            // Forzamos el campo 'name' para que tu componente actual no rompa, 
            // aunque lo ideal es que uses 'nombre' en todo el proyecto.
            name: res.data.nombre
          };

          console.log("Usuario sincronizado con éxito:", userData);

          setUser(userData);
          localStorage.setItem('mascotai_logged_in', 'true');
        }
      } catch (error) {
        console.error("Error Login Nativo:", error);
      }
    } else {
      // Flujo Web para Vercel (se mantiene igual para no romper nada)
      localStorage.setItem('mascotai_logged_in', 'true');
      window.location.href = `${SERVER_URL}/oauth2/authorization/google`;
    }
  };

  const logout = async () => {
    try {
      localStorage.clear();
      await api.logout();
    } catch (error) {
      console.warn("Error al desloguear");
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