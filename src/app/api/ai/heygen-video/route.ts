// src/app/api/ai/heygen-video/route.ts
// Generates AI avatar product videos using HeyGen v2 Studio API (Avatar IV engine)
// Vendor selects platform format; Claude generates the promo script; HeyGen renders with audio + lip-sync
// Requires: HEYGEN_API_KEY + ANTHROPIC_API_KEY in .env

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

// ─── AVATAR / VOICE DEFAULTS ──────────────────────────────────────────────────
// Run `npx tsx scripts/list-heygen-avatars.ts` to browse all available IDs.
// Replace these with UGC-style avatars you've selected from your HeyGen dashboard.
const DEFAULT_AVATAR_ID = 'Abigail_expressive_2024112501'
const DEFAULT_VOICE_ID  = '97dd67ab8ce242b6a9e7689cb00c6414' // female voice

// ─── PLATFORM FORMAT MAP ──────────────────────────────────────────────────────
// Vendors pick a platform; we resolve to the correct pixel dimensions.
// HeyGen's dimension object accepts any width/height pair.
export const VIDEO_FORMATS: Record<string, { width: number; height: number; label: string; description: string }> = {
  tiktok:       { width: 720,  height: 1280, label: 'TikTok / Reels / Shorts', description: 'Vertical 9:16 — best for TikTok, Instagram Reels, YouTube Shorts' },
  instagram_sq: { width: 1080, height: 1080, label: 'Instagram Feed (Square)', description: 'Square 1:1 — best for Instagram and Facebook feed posts' },
  youtube:      { width: 1920, height: 1080, label: 'YouTube / Facebook',       description: 'Landscape 16:9 — best for YouTube, Facebook, and embedded web video' },
  pinterest:    { width: 1000, height: 1500, label: 'Pinterest',                description: 'Tall 2:3 — optimized for Pinterest and blog thumbnails' },
  twitter:      { width: 1280, height: 720,  label: 'Twitter / X',              description: 'Landscape 16:9 (720p) — standard for Twitter/X video posts' },
}

// Default format if vendor doesn't specify
const DEFAULT_FORMAT = 'tiktok'

// Poll settings: 60 × 5 s = 5 min max
const POLL_ATTEMPTS   = 60
const POLL_INTERVAL_MS = 5000
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createServiceClient()
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // ── Pro plan check ────────────────────────────────────────────────────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_onboarded')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_onboarded) {
      return NextResponse.json(
        { error: 'Pro plan required for AI video generation' },
        { status: 403 }
      )
    }

    // ── Request body ──────────────────────────────────────────────────────────
    const body = await req.json()
    const {
      title,
      description,
      category,
      price,
      commission_rate,
      imageUrl,
      format    = DEFAULT_FORMAT,    // e.g. 'tiktok' | 'youtube' | 'instagram_sq'
      avatarId  = DEFAULT_AVATAR_ID,
      voiceId   = DEFAULT_VOICE_ID,
    } = body

    if (!title || !description) {
      return NextResponse.json(
        { error: 'title and description are required' },
        { status: 400 }
      )
    }

    // Resolve format → pixel dimensions
    const resolvedFormat = VIDEO_FORMATS[format] ?? VIDEO_FORMATS[DEFAULT_FORMAT]
    const { width, height } = resolvedFormat
    const isVertical = height > width

    // ── Step 1: Generate spoken promo script with Claude ──────────────────────
    const scriptPrompt = `You are an expert UGC content creator and social media influencer.
Write a spoken video script for an AI avatar to deliver as an authentic product promotion.

Product: ${title}
Category: ${category ?? 'General'}
Price: $${price ?? 'N/A'}
Commission for affiliates: ${commission_rate ? `${(commission_rate * 100).toFixed(0)}%` : 'N/A'}
Description: ${description}
Platform format: ${resolvedFormat.label}

Requirements:
- Conversational, enthusiastic, authentic — NOT a corporate ad script
- Open with a strong hook that names the product within the first sentence
- Mention 2–3 specific benefits naturally woven into conversation
- End with a clear, platform-appropriate call to action
- Written entirely as spoken words — no stage directions, no emojis, no bullet points
- Target length: 120–150 words (reads as ~45–60 seconds at natural pace)

Reply with ONLY the script text, nothing else.`

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        messages: [{ role: 'user', content: scriptPrompt }],
      }),
    })

    const claudeData = await claudeRes.json()
    const script = claudeData.content?.[0]?.text?.trim()

    if (!script) {
      console.error('[heygen-video] Claude script generation failed:', claudeData)
      return NextResponse.json({ error: 'Failed to generate promo script' }, { status: 500 })
    }

    // ── Step 2: Build HeyGen video_inputs scene ───────────────────────────────
    // For vertical (9:16) formats: avatar on right, product image fills background
    // For landscape/square: avatar centered, product image as background
    const avatarScale  = isVertical ? 0.65 : 0.8
    const avatarOffset = isVertical ? { x: 0.3, y: 0.05 } : { x: 0, y: 0 }

    const background = imageUrl
      ? { type: 'image', url: imageUrl }
      : { type: 'color', value: '#f2f0ec' }

    const videoInput = {
      character: {
        type: 'avatar',
        avatar_id: avatarId,
        avatar_style: 'normal',
        scale: avatarScale,
        offset: avatarOffset,
      },
      voice: {
        type: 'text',
        input_text: script,
        voice_id: voiceId,
        speed: 1.05,   // slightly faster feels more natural for UGC
      },
      background,
    }

    // ── Step 3: Submit to HeyGen v2 Studio API ────────────────────────────────
    const heygenRes = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: {
        'X-Api-Key': process.env.HEYGEN_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: `${title} — ${resolvedFormat.label}`,
        video_inputs: [videoInput],
        dimension: { width, height },
        caption: true,   // auto-captions improve accessibility and muted-view engagement
      }),
    })

    if (!heygenRes.ok) {
      const err = await heygenRes.text()
      console.error('[heygen-video] submit error:', err)
      return NextResponse.json({ error: 'Failed to start video generation' }, { status: 500 })
    }

    const heygenData = await heygenRes.json()
    const videoId = heygenData.data?.video_id

    if (!videoId) {
      console.error('[heygen-video] no video_id in response:', heygenData)
      return NextResponse.json({ error: 'HeyGen did not return a video ID' }, { status: 500 })
    }

    // ── Step 4: Poll for completion ───────────────────────────────────────────
    for (let i = 0; i < POLL_ATTEMPTS; i++) {
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS))

      const statusRes = await fetch(
        `https://api.heygen.com/v1/video_status.get?video_id=${videoId}`,
        { headers: { 'X-Api-Key': process.env.HEYGEN_API_KEY! } }
      )
      const statusData = await statusRes.json()
      const status = statusData.data?.status

      if (status === 'completed') {
        const videoUrl      = statusData.data?.video_url
        const thumbnailUrl  = statusData.data?.thumbnail_url ?? null

        if (!videoUrl) {
          return NextResponse.json({ error: 'No video URL returned' }, { status: 500 })
        }

        return NextResponse.json({
          video_url:     videoUrl,
          thumbnail_url: thumbnailUrl,
          script,
          format: {
            key:         format,
            label:       resolvedFormat.label,
            description: resolvedFormat.description,
            width,
            height,
          },
          avatar_id: avatarId,
          voice_id:  voiceId,
        })
      }

      if (status === 'failed') {
        console.error('[heygen-video] generation failed:', statusData)
        return NextResponse.json({ error: 'Video generation failed' }, { status: 500 })
      }
      // pending | processing | waiting → keep polling
    }

    return NextResponse.json({ error: 'Video generation timed out' }, { status: 504 })

  } catch (err) {
    console.error('[heygen-video] unexpected error:', err)
    return NextResponse.json({ error: 'Failed to generate video' }, { status: 500 })
  }
}

// Export format options so the frontend can build the format picker UI
// Usage in vendor page: import { VIDEO_FORMATS } from '@/app/api/ai/heygen-video/route'
// Or just copy the VIDEO_FORMATS object into a shared constants file.