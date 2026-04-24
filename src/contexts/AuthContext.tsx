import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AuthUser } from "@/lib/types";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  setUser: (u: AuthUser | null) => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => api.getCurrentUser());
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const fresh = await api.me();
    setUser(fresh);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fresh = await api.me();
        if (!cancelled) setUser(fresh);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
