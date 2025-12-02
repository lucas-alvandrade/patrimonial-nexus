import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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