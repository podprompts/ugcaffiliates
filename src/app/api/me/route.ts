// src/app/api/me/route.ts
// Returns the current user's profile using the service role key

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { createServerClient } from '@supabase/ssr'

export async function GET(req: NextRequest) {
  // Get the user from the auth token in the request
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use service client to bypass RLS
  const supabase = createServiceClient()

  // Verify the token and get the user
  const { data: { user }, error: userError } = await supabase.auth.getUser(token)

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch profile using service role (bypasses RLS)
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  return NextResponse.json({ profile, user })
}