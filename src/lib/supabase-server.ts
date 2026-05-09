// src/lib/supabase-server.ts

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseSvc  = process.env.SUPABASE_SERVICE_ROLE_KEY!

// RLS-respecting client (Server Components, Route Handlers)
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch {
          // safe to ignore in middleware
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch {}
      },
    },
  })
}

// Service role client — bypasses RLS (postback, cron, admin only)
export function createServiceClient() {
  return createSupabaseClient(supabaseUrl, supabaseSvc, {
    auth: {
      autoRefreshToken: false,
      persistSession:   false,
    },
  })
}