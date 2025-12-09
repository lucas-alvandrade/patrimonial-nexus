import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LocalUser {
  id: number;
  nome: string;
  email: string | null;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: LocalUser | null;
  userRole: 'admin' | 'user' | null;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AUTH_STORAGE_KEY = 'siif_auth_user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as LocalUser;
        setUser(parsedUser);
        setUserRole(parsedUser.role);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Query the usuarios table for matching credentials
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome, email, role, senha')
        .eq('nome', username)
        .single();

      if (error || !data) {
        console.error('User not found:', error);
        return false;
      }

      // Check password (simple comparison for now)
      if (data.senha !== password) {
        console.error('Invalid password');
        return false;
      }

      const localUser: LocalUser = {
        id: data.id,
        nome: data.nome,
        email: data.email,
        role: data.role as 'admin' | 'user'
      };

      // Store user in localStorage
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(localUser));
      
      setUser(localUser);
      setUserRole(localUser.role);

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
    setUserRole(null);
  };

  const isAdmin = userRole === 'admin';

  const value = {
    user,
    userRole,
    isAdmin,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
