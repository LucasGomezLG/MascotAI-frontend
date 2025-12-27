import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const SERVER_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

  useEffect(() => {
    const initAuth = async () => {
      // ✅ En tu sistema de Java, no hay token en URL, solo flag de sesión
      const wasLoggedIn = localStorage.getItem('mascotai_logged_in') === 'true';

      if (!wasLoggedIn) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.getUserProfile();
        // Verificamos la estructura que devuelve tu Java (user.me)
        if (res && res.data && (res.data.id || res.data.email)) {
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

    initAuth();
  }, []);

  const login = () => {
    localStorage.setItem('mascotai_logged_in', 'true');
    // Esto dispara el flujo de tu SecurityConfig.java
    window.location.href = `${SERVER_URL}/oauth2/authorization/google`;
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