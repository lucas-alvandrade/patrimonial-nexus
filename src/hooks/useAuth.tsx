import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: 'admin' | 'user' | null;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user role from database
  const fetchUserRole = async (user: User) => {
    try {
      const ldapId = user.user_metadata?.ldap_id;
      if (!ldapId) return;

      const { data, error } = await supabase
        .from('usuarios')
        .select('role')
        .eq('ldap_id', ldapId)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        setUserRole('user'); // Default to user role
        return;
      }

      setUserRole(data?.role || 'user');
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
      setUserRole('user');
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer role fetching to avoid auth state change issues
          setTimeout(() => {
            fetchUserRole(session.user);
          }, 0);
        } else {
          setUserRole(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Simple local authentication
      if (username === 'admin' && password === '123456') {
        // Check if admin user exists in database
        const { data: existingUser, error: fetchError } = await supabase
          .from('usuarios')
          .select('*')
          .eq('ldap_id', 'admin')
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error fetching user:', fetchError);
          return false;
        }

        let userData = existingUser;

        if (!existingUser) {
          // Create admin user if doesn't exist
          const { data: newUser, error: insertError } = await supabase
            .from('usuarios')
            .insert({
              nome: 'Administrador',
              email: 'admin@sistema.local',
              ldap_id: 'admin',
              role: 'admin'
            })
            .select()
            .single();

          if (insertError) {
            console.error('Error creating admin user:', insertError);
            return false;
          }
          userData = newUser;
        }

        // Sign in with Supabase
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: userData.email,
          password: 'local-auth'
        });

        if (signInError) {
          // If user doesn't exist in auth, create them
          const { error: signUpError } = await supabase.auth.signUp({
            email: userData.email,
            password: 'local-auth',
            options: {
              emailRedirectTo: `${window.location.origin}/`,
              data: {
                display_name: userData.nome,
                ldap_id: userData.ldap_id
              }
            }
          });

          if (signUpError) {
            console.error('Sign up error:', signUpError);
            return false;
          }
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
    }
  };

  const isAdmin = userRole === 'admin';

  const value = {
    user,
    session,
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