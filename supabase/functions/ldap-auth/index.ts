import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LDAPUser {
  displayName?: string;
  mail?: string;
  uid: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ldapId, password } = await req.json();

    if (!ldapId || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'LDAP ID and password are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get LDAP configuration from environment
    const ldapHost = Deno.env.get('LDAP_HOST');
    const ldapBindDn = Deno.env.get('LDAP_BIND_DN');
    const ldapBindPassword = Deno.env.get('LDAP_BIND_PASSWORD');
    const ldapBaseDn = Deno.env.get('LDAP_BASE_DN');

    if (!ldapHost || !ldapBindDn || !ldapBindPassword || !ldapBaseDn) {
      console.error('Missing LDAP configuration');
      return new Response(
        JSON.stringify({ success: false, error: 'LDAP configuration incomplete' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Attempting LDAP authentication for user: ${ldapId}`);

    // Simulate LDAP authentication (replace with actual LDAP client)
    // For demonstration purposes, we'll accept any user with a valid format
    const isValidCredentials = await authenticateWithLDAP(
      ldapHost,
      ldapBindDn,
      ldapBindPassword,
      ldapBaseDn,
      ldapId,
      password
    );

    if (isValidCredentials) {
      // Check if this is the admin user
      const isAdminUser = ldapId === '222574';
      
      const user: LDAPUser = {
        uid: ldapId,
        displayName: `User ${ldapId}`, // This would come from LDAP
        mail: `${ldapId}@company.com`, // This would come from LDAP
      };

      console.log(`LDAP authentication successful for user: ${ldapId}`);
      
      if (isAdminUser) {
        console.log(`Admin user detected: ${ldapId}`);
      }

      // Create Supabase client with service role to bypass RLS
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
      
      if (supabaseUrl && supabaseServiceKey) {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        });

        try {
          // Check if user exists in usuarios table
          const { data: existingUser, error: checkError } = await supabaseAdmin
            .from('usuarios')
            .select('id')
            .eq('ldap_id', ldapId)
            .maybeSingle();

          if (checkError) {
            console.error('Error checking user in usuarios table:', checkError);
          }

          // If user doesn't exist, create them
          if (!existingUser) {
            console.log(`Creating user in usuarios table: ${ldapId}`);
            
            const { error: insertError } = await supabaseAdmin
              .from('usuarios')
              .insert({
                ldap_id: ldapId,
                nome: user.displayName,
                email: user.mail,
                role: isAdminUser ? 'admin' : 'user',
              });

            if (insertError) {
              console.error('Error creating user in usuarios table:', insertError);
            } else {
              console.log(`User created successfully in usuarios table: ${ldapId}`);
            }
          } else {
            console.log(`User already exists in usuarios table: ${ldapId}`);
          }
        } catch (error) {
          console.error('Error managing user in database:', error);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          user: user,
          isAdmin: isAdminUser,
          message: 'Authentication successful'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      console.log(`LDAP authentication failed for user: ${ldapId}`);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid credentials' 
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

  } catch (error) {
    console.error('LDAP authentication error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function authenticateWithLDAP(
  host: string,
  bindDn: string,
  bindPassword: string,
  baseDn: string,
  userId: string,
  userPassword: string
): Promise<boolean> {
  try {
    // For demo purposes, we'll simulate LDAP authentication
    // In a real implementation, you would use an LDAP client library
    
    console.log(`Connecting to LDAP server: ${host}`);
    console.log(`Using bind DN: ${bindDn}`);
    console.log(`Searching in base DN: ${baseDn}`);
    console.log(`Authenticating user: ${userId}`);
    
    // Simulate authentication logic
    // Replace this with actual LDAP authentication
    if (userId && userPassword && userPassword.length >= 3) {
      // Simulate successful authentication for demo
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('LDAP connection error:', error);
    return false;
  }
}