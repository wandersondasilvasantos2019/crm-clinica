// Edge Function: criar-cliente
//
// Cria uma clinica nova (config_cliente) + o login do cliente (auth.users)
// + o vinculo em usuarios (role: 'cliente'), numa unica chamada. So quem
// esta logado como admin (checado via usuarios.role) pode chamar.
//
// Deploy: supabase functions deploy criar-cliente
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY sao
// injetadas automaticamente pelo runtime — nao precisa configurar secret
// nenhum pra essa function funcionar.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function generateTempPassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  const random = Array.from(bytes, (b) => b.toString(36).padStart(2, '0')).join('')
  return `${random.slice(0, 16)}Aa1!`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ error: 'Nao autenticado' }, 401)
  }

  // Cliente "de identidade": mesmas credenciais que o frontend usaria,
  // so pra descobrir quem esta chamando (via o JWT recebido).
  const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: userData, error: userError } = await callerClient.auth.getUser()
  if (userError || !userData.user) {
    return jsonResponse({ error: 'Nao autenticado' }, 401)
  }

  // Cliente com service role, pra tudo que precisa ignorar RLS (checar o
  // role de quem chamou, criar o auth user, inserir nas tabelas).
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  const { data: callerRow, error: callerRowError } = await admin
    .from('usuarios')
    .select('role')
    .eq('id', userData.user.id)
    .maybeSingle()

  if (callerRowError || callerRow?.role !== 'admin') {
    return jsonResponse({ error: 'Apenas administradores podem cadastrar clientes' }, 403)
  }

  let body: {
    nome_empresa?: string
    horario_funcionamento?: string
    tom_voz?: string
    slug?: string
    email?: string
  }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Corpo da requisicao invalido' }, 400)
  }

  const nomeEmpresa = body.nome_empresa?.trim()
  const email = body.email?.trim()
  if (!nomeEmpresa || !email) {
    return jsonResponse({ error: 'nome_empresa e email sao obrigatorios' }, 400)
  }

  const baseSlug = slugify(body.slug || nomeEmpresa)
  if (!baseSlug) {
    return jsonResponse({ error: 'Nao foi possivel gerar um slug valido a partir do nome' }, 400)
  }

  // Garante instance_id unico — acrescenta um sufixo numerico se ja existir.
  let instanceId = baseSlug
  let suffix = 1
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data: existing } = await admin
      .from('config_cliente')
      .select('instance_id')
      .eq('instance_id', instanceId)
      .maybeSingle()
    if (!existing) break
    suffix += 1
    instanceId = `${baseSlug}-${suffix}`
  }

  const { error: configError } = await admin.from('config_cliente').insert({
    instance_id: instanceId,
    slug: instanceId,
    nome_empresa: nomeEmpresa,
    horario_funcionamento: body.horario_funcionamento || null,
    tom_voz: body.tom_voz || null,
  })

  if (configError) {
    return jsonResponse({ error: `Erro ao criar clinica: ${configError.message}` }, 500)
  }

  const tempPassword = generateTempPassword()

  const { data: newUser, error: createUserError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  })

  if (createUserError || !newUser.user) {
    // desfaz a clinica criada pra nao deixar config_cliente orfa sem login
    await admin.from('config_cliente').delete().eq('instance_id', instanceId)
    return jsonResponse(
      { error: `Erro ao criar usuario: ${createUserError?.message ?? 'desconhecido'}` },
      500
    )
  }

  const { error: vinculoError } = await admin.from('usuarios').insert({
    id: newUser.user.id,
    instance_id: instanceId,
    role: 'cliente',
  })

  if (vinculoError) {
    await admin.auth.admin.deleteUser(newUser.user.id)
    await admin.from('config_cliente').delete().eq('instance_id', instanceId)
    return jsonResponse({ error: `Erro ao vincular usuario: ${vinculoError.message}` }, 500)
  }

  return jsonResponse({
    instance_id: instanceId,
    email,
    senha_temporaria: tempPassword,
  })
})
