import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Usamos el SERVER_URL (raíz) para el flujo de Google
  const SERVER_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    api.getUserProfile()
      .then(res => {
        if (res.data && res.data.id) {
          setUser(res.data);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = () => {
    // Redirigimos a la raíz del backend para iniciar OAuth2
    window.location.href = `${SERVER_URL}/oauth2/authorization/google`;
  };

  const logout = async () => {
    try {
      // 1. LIMPIEZA TOTAL DE MEMORIA LOCAL
      localStorage.clear();
      sessionStorage.clear();

      // 2. Notificamos al servidor en Railway para invalidar la sesión
      await api.logout();
    } catch (error) {
      console.error("Error al desloguear en el servidor, limpiando localmente...");
    } finally {
      // 3. Limpiamos el estado de React
      setUser(null);
      // 4. Redirigimos al origen (localhost o Vercel) y forzamos recarga
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