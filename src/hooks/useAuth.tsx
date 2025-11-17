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
        // For local admin, create a session directly without Supabase auth
        // Set user data manually for local authentication
        const adminUser = {
          id: 'local-admin',
          email: 'admin@sistema.local',
          user_metadata: { ldap_id: 'admin' },
          app_metadata: {},
          aud: 'authenticated',
          role: 'authenticated',
          created_at: new Date().toISOString(),
          email_confirmed_at: new Date().toISOString(),
          phone_confirmed_at: null,
          confirmed_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as User;

        // Create a mock session
        const adminSession = {
          access_token: 'local-admin-token',
          refresh_token: 'local-admin-refresh',
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          token_type: 'bearer',
          user: adminUser
        } as Session;

        // Set state directly for local auth
        setUser(adminUser);
        setSession(adminSession);
        setUserRole('admin');

        return true;
      }

      // Try LDAP authentication
      const response = await fetch(
        'https://bqwaasdjpxlucgsknryp.supabase.co/functions/v1/ldap-auth',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxd2Fhc2RqcHhsdWNnc2tucnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2OTQ0NDksImV4cCI6MjA3MzI3MDQ0OX0.7edknT33F4_EOQXU3-PlbBqmt6G1TDXaDA8EkiUas6s`,
          },
          body: JSON.stringify({
            ldapId: username,
            password: password,
          }),
        }
      );

      const data = await response.json();

      if (data.success && data.user) {
        const ldapUser = data.user;
        const isAdmin = data.isAdmin || false;

        // Sign in with Supabase Auth using password
        const email = ldapUser.mail || `${ldapUser.uid}@company.com`;
        
        // Try to sign in first
        let authResult = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

        // If sign in fails, create the user
        if (authResult.error) {
          const signUpResult = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
              data: {
                ldap_id: ldapUser.uid,
                display_name: ldapUser.displayName || `User ${ldapUser.uid}`,
              },
            },
          });

          if (signUpResult.error) {
            console.error('Error creating user:', signUpResult.error);
            return false;
          }

          authResult = signUpResult;
        }

        if (authResult.data.user) {
          // Ensure user exists in usuarios table
          const { data: existingUser } = await supabase
            .from('usuarios')
            .select('id')
            .eq('ldap_id', ldapUser.uid)
            .maybeSingle();

          if (!existingUser) {
            // Create user in usuarios table
            const { error: insertError } = await supabase
              .from('usuarios')
              .insert({
                ldap_id: ldapUser.uid,
                nome: ldapUser.displayName || `User ${ldapUser.uid}`,
                email: email,
                role: isAdmin ? 'admin' : 'user',
              });

            if (insertError) {
              console.error('Error creating user in usuarios table:', insertError);
            }
          }

          setUser(authResult.data.user);
          setSession(authResult.data.session);
          setUserRole(isAdmin ? 'admin' : 'user');

          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    // For local auth, just clear the state
    setUser(null);
    setSession(null);
    setUserRole(null);
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