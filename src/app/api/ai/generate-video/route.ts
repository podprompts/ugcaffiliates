// src/app/api/ai/generate-video/route.ts
// 'cinematic' style → HeyGen avatar video with Claude-generated promo script
// 'quick' style     → Replicate Wan 2.1 text-to-video (unchanged)

import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_AVATAR_ID = 'Abigail_expressive_2024112501'
const DEFAULT_VOICE_ID  = '97dd67ab8ce242b6a9e7689cb00c6414' // female voice

export async function POST(req: NextRequest) {
  try {
    const { title, description, category, price, commission_rate, style, imageUrl } = await req.json()

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description required' }, { status: 400 })
    }

    // ── CINEMATIC: HeyGen avatar promo video ──────────────────────────────────
    if (style === 'cinematic') {

      // 1. Generate spoken script with Claude
      const scriptPrompt = `You are an expert UGC content creator and influencer. 
Write a 45–60 second spoken video script for an AI avatar to deliver as a product promotion.

Product: ${title}
Category: ${category ?? 'General'}
Price: $${price ?? 'N/A'}
Commission for affiliates: ${commission_rate ? `${(commission_rate * 100).toFixed(0)}%` : 'N/A'}
Description: ${description}

Requirements:
- Conversational, enthusiastic, authentic — NOT a corporate ad
- Open with a strong hook that names the product in the first sentence
- Mention 2–3 specific benefits naturally woven into conversation
- End with a clear call to action
- Written entirely as spoken words — no stage directions, no emojis, no bullet points
- Target length: 120–150 words

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
        return NextResponse.json({ error: 'Failed to generate promo script' }, { status: 500 })
      }

      // 2. Submit to HeyGen
      const background = imageUrl
        ? { type: 'image', url: imageUrl }
        : { type: 'color', value: '#f2f0ec' }

      const heygenRes = await fetch('https://api.heygen.com/v2/video/generate', {
        method: 'POST',
        headers: {
          'X-Api-Key': process.env.HEYGEN_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `${title} — UGC Promo`,
          video_inputs: [{
            character: {
              type: 'avatar',
              avatar_id: DEFAULT_AVATAR_ID,
              avatar_style: 'normal',
              scale: 0.75,
              offset: { x: 0.35, y: 0 },
            },
            voice: {
              type: 'text',
              input_text: script,
              voice_id: DEFAULT_VOICE_ID,
              speed: 1.0,
            },
            background,
          }],
          dimension: { width: 720, height: 1280 },
          caption: true,
        }),
      })

      if (!heygenRes.ok) {
        const err = await heygenRes.text()
        console.error('[generate-video/heygen] error:', err)
        return NextResponse.json({ error: 'HeyGen video generation failed' }, { status: 500 })
      }

      const heygenData = await heygenRes.json()
      const videoId = heygenData.data?.video_id

      if (!videoId) {
        return NextResponse.json({ error: 'HeyGen did not return a video ID' }, { status: 500 })
      }

      // 3. Poll for completion
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 5000))

        const statusRes = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
          headers: { 'X-Api-Key': process.env.HEYGEN_API_KEY! },
        })
        const statusData = await statusRes.json()
        const status = statusData.data?.status

        if (status === 'completed') {
          const videoUrl = statusData.data?.video_url
          if (!videoUrl) return NextResponse.json({ error: 'No video URL returned' }, { status: 500 })
          return NextResponse.json({
            video_url: videoUrl,
            thumbnail_url: statusData.data?.thumbnail_url ?? null,
            script,
            style: 'cinematic',
            credits_used: 3,
          })
        }

        if (status === 'failed') {
          return NextResponse.json({ error: 'Video generation failed' }, { status: 500 })
        }
      }

      return NextResponse.json({ error: 'Video generation timed out' }, { status: 504 })

    // ── QUICK: Replicate Wan 2.1 (unchanged) ─────────────────────────────────
    } else {
      const prompt = `Authentic UGC style video featuring ${title}. ${description.slice(0, 150)}. ${category} product. Professional lighting, smooth camera movement, visually compelling.`

      const response = await fetch('https://api.replicate.com/v1/models/wavespeedai/wan-2.1-t2v-480p/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: {
            prompt,
            num_frames: 81,
            sample_steps: 30,
            frames_per_second: 16,
          }
        }),
      })

      const prediction = await response.json()
      let result = prediction
      let attempts = 0

      while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < 60) {
        await new Promise(r => setTimeout(r, 3000))
        const poll = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
          headers: { 'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}` }
        })
        result = await poll.json()
        attempts++
      }

      if (result.status !== 'succeeded' || !result.output) {
        return NextResponse.json({ error: 'Video generation failed' }, { status: 500 })
      }

      return NextResponse.json({ video_url: result.output, style: 'quick', credits_used: 1 })
    }

  } catch (err) {
    console.error('[generate-video] error:', err)
    return NextResponse.json({ error: 'Failed to generate video' }, { status: 500 })
  }
}