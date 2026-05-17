// src/app/api/ai/heygen-video/route.ts
// ── HeyGen AI avatar video generation ────────────────────────────────────────
// TEMPORARILY DISABLED — revisit when Creatify.ai integration is ready.
// HeyGen polling caused Vercel timeout (300s) because video generation takes
// 1–3 minutes and the function waited synchronously for completion.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'

// ── COMMENTED OUT: HeyGen + Claude integration ────────────────────────────────
//
// import { createServiceClient } from '@/lib/supabase-server'
//
// const DEFAULT_AVATAR_ID = 'Abigail_expressive_2024112501'
// const DEFAULT_VOICE_ID  = '97dd67ab8ce242b6a9e7689cb00c6414'
//
// export const VIDEO_FORMATS: Record<string, { width: number; height: number; label: string; description: string }> = {
//   tiktok:       { width: 720,  height: 1280, label: 'TikTok / Reels / Shorts', description: 'Vertical 9:16' },
//   instagram_sq: { width: 1080, height: 1080, label: 'Instagram Feed (Square)', description: 'Square 1:1' },
//   youtube:      { width: 1920, height: 1080, label: 'YouTube / Facebook',       description: 'Landscape 16:9' },
//   pinterest:    { width: 1000, height: 1500, label: 'Pinterest',                description: 'Tall 2:3' },
//   twitter:      { width: 1280, height: 720,  label: 'Twitter / X',              description: 'Landscape 16:9 (720p)' },
// }
//
// const DEFAULT_FORMAT   = 'tiktok'
// const POLL_ATTEMPTS    = 60
// const POLL_INTERVAL_MS = 5000
//
// export async function POST(req: NextRequest) {
//   try {
//     const authHeader = req.headers.get('authorization')
//     const token = authHeader?.replace('Bearer ', '')
//     if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
//
//     const supabase = createServiceClient()
//     const { data: { user } } = await supabase.auth.getUser(token)
//     if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
//
//     const { data: profile } = await supabase
//       .from('profiles')
//       .select('stripe_onboarded')
//       .eq('id', user.id)
//       .single()
//
//     if (!profile?.stripe_onboarded) {
//       return NextResponse.json({ error: 'Pro plan required for AI video generation' }, { status: 403 })
//     }
//
//     const body = await req.json()
//     const { title, description, category, price, commission_rate, imageUrl, format = DEFAULT_FORMAT, avatarId = DEFAULT_AVATAR_ID, voiceId = DEFAULT_VOICE_ID } = body
//
//     if (!title || !description) {
//       return NextResponse.json({ error: 'title and description are required' }, { status: 400 })
//     }
//
//     const resolvedFormat = VIDEO_FORMATS[format] ?? VIDEO_FORMATS[DEFAULT_FORMAT]
//     const { width, height } = resolvedFormat
//     const isVertical = height > width
//
//     // Claude script generation
//     const scriptPrompt = `...` // (script prompt omitted for brevity)
//     const claudeRes = await fetch('https://api.anthropic.com/v1/messages', { ... })
//     const script = claudeData.content?.[0]?.text?.trim()
//     if (!script) return NextResponse.json({ error: 'Failed to generate promo script' }, { status: 500 })
//
//     // HeyGen submission
//     const heygenRes = await fetch('https://api.heygen.com/v2/video/generate', { ... })
//     const videoId = heygenData.data?.video_id
//     if (!videoId) return NextResponse.json({ error: 'HeyGen did not return a video ID' }, { status: 500 })
//
//     // Polling loop (caused Vercel timeout — 60 × 5s = 300s)
//     for (let i = 0; i < POLL_ATTEMPTS; i++) {
//       await new Promise(r => setTimeout(r, POLL_INTERVAL_MS))
//       const statusRes = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, { ... })
//       const status = statusData.data?.status
//       if (status === 'completed') return NextResponse.json({ video_url: videoUrl, ... })
//       if (status === 'failed') return NextResponse.json({ error: 'Video generation failed' }, { status: 500 })
//     }
//
//     return NextResponse.json({ error: 'Video generation timed out' }, { status: 504 })
//   } catch (err) {
//     return NextResponse.json({ error: 'Failed to generate video' }, { status: 500 })
//   }
// }
// ── END COMMENTED OUT ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      error: 'AI video generation is temporarily unavailable. Please upload your own promo video instead.',
      coming_soon: true,
    },
    { status: 503 }
  )
}