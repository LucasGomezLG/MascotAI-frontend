import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // En src/context/AuthContext.tsx

  useEffect(() => {
    api.getUserProfile()
      .then(res => {
        // Si la respuesta tiene datos, cargamos al usuario
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
    // Redirigimos al flujo OAuth2 de Google usando tu IP local
    window.location.href = "http://localhost:8080/oauth2/authorization/google";
  };

  // En src/context/AuthContext.tsx

  const logout = async () => {
    try {
      await api.logout(); // Llamamos al backend
    } catch (error) {
      console.log("Error al desloguear, limpiando localmente...");
    } finally {
      // Pase lo que pase, limpiamos el estado y volvemos al inicio
      setUser(null);
      window.location.href = "http://localhost:5173";
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