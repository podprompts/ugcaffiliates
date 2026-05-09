// src/app/api/ai/generate-assets/route.ts
// Generates affiliate marketing assets using Claude API

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { title, description, category, commission_rate, price } = await req.json()

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description required' }, { status: 400 })
    }

    const prompt = `You are an expert affiliate marketer. Generate affiliate marketing assets for this product:

Product: ${title}
Category: ${category || 'General'}
Price: $${price || 'N/A'}
Commission: ${commission_rate || 'N/A'}%
Description: ${description}

Generate the following assets that affiliates can use to promote this product. Make them compelling, authentic, and platform-appropriate.

Respond ONLY with a valid JSON object, no markdown, no backticks, exactly this structure:
{
  "tiktok_hook": "A compelling 1-2 sentence TikTok video hook that grabs attention in the first 3 seconds",
  "ig_caption": "An Instagram caption with emojis, 2-3 sentences, ends with call to action",
  "email_swipe": "A short email pitch, 2-3 sentences, personal tone, includes call to action",
  "youtube_script": "A 3-4 sentence YouTube intro script that introduces the product naturally"
}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    const text = data.content?.[0]?.text

    if (!text) {
      return NextResponse.json({ error: 'Failed to generate assets' }, { status: 500 })
    }

    // Parse JSON response
    const clean = text.replace(/```json|```/g, '').trim()
    const assets = JSON.parse(clean)

    return NextResponse.json({ assets })
  } catch (err) {
    console.error('[generate-assets] error:', err)
    return NextResponse.json({ error: 'Failed to generate assets' }, { status: 500 })
  }
}