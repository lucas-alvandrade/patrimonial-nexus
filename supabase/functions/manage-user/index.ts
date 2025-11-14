import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verificar se o usuário que está fazendo a requisição é admin
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Verificar se é admin
    const { data: isAdminData, error: isAdminError } = await supabaseAdmin.rpc('is_admin')
    if (isAdminError || !isAdminData) {
      return new Response(
        JSON.stringify({ error: 'Only admins can manage users' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    const body = await req.json()
    const { action, nome, email, senha, role } = body

    if (action === 'create') {
      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: senha,
        email_confirm: true,
        user_metadata: {
          nome,
          ldap_id: `user_${Date.now()}_${Math.random().toString(36).substring(7)}`
        }
      })

      if (authError) {
        return new Response(
          JSON.stringify({ error: authError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // Criar registro na tabela usuarios
      const { error: dbError } = await supabaseAdmin
        .from('usuarios')
        .insert({
          nome,
          email,
          ldap_id: authData.user.user_metadata.ldap_id,
          role
        })

      if (dbError) {
        // Tentar remover usuário do auth se falhar ao criar no banco
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        
        return new Response(
          JSON.stringify({ error: dbError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      return new Response(
        JSON.stringify({ success: true, user: authData.user }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    if (action === 'update_password') {
      // Buscar usuário pelo email
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (listError) {
        return new Response(
          JSON.stringify({ error: listError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      const targetUser = users.find(u => u.email === email)
      
      if (!targetUser) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        )
      }

      // Atualizar senha do usuário
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        targetUser.id,
        { password: senha }
      )

      if (updateError) {
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
