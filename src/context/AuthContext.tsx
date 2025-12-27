import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Usamos el SERVER_URL (raíz) para el flujo de Google
  const SERVER_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const initAuth = async () => {
      // ✅ Solo intentamos el fetch si existe el rastro de un login previo
      const wasLoggedIn = localStorage.getItem('mascotai_logged_in') === 'true';

      if (!wasLoggedIn) {
        setLoading(false);
        return; // Ni siquiera llamamos a la API, evitamos el 401 en consola
      }

      try {
        const res = await api.getUserProfile();
        if (res && res.data && res.data.id) {
          setUser(res.data);
        }
      } catch (error) {
        // Si el servidor dice 401 aunque pensábamos que estábamos logueados (sesión expirada)
        localStorage.removeItem('mascotai_logged_in');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = () => {
    // ✅ Marcamos que el usuario intentó loguearse
    localStorage.setItem('mascotai_logged_in', 'true');
    window.location.href = `${SERVER_URL}/oauth2/authorization/google`;
  };

  const logout = async () => {
    try {
      localStorage.clear(); // Limpia el flag mascota_logged_in
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider en main.tsx");
  }
  return context;
};