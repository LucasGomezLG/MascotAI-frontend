import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext<any>(null);

// ... resto del código igual

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Obtenemos la URL base de tu .env (Railway en este caso)
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

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
    // CAMBIO CLAVE: Usamos la URL de Railway dinámicamente
    window.location.href = `${API_BASE}/oauth2/authorization/google`;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.log("Error al desloguear, limpiando localmente...");
    } finally {
      setUser(null);
      // CAMBIO CLAVE: Redirigimos al origen actual (localhost o Vercel)
      window.location.href = window.location.origin;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};


// Hook mejorado con validación de seguridad
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider en main.tsx");
  }
  return context;
};