// src/app/api/ai/generate-ugc/route.ts
// Generates AI lifestyle/UGC images for products using Replicate FLUX model

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { title, description, category } = await req.json()

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description required' }, { status: 400 })
    }

    const prompts = [
      `Professional lifestyle product photography of ${title}, ${category} product, clean white background, soft natural lighting, high end commercial photography, 4k`,
      `UGC style authentic photo of someone using ${title}, casual home setting, natural daylight, relatable everyday lifestyle, instagram style`,
      `Flat lay product shot of ${title}, minimal aesthetic, clean composition, pastel background, professional product photography`,
      `Close up detail shot of ${title}, macro photography, beautiful lighting, premium product feel, editorial quality`,
    ]

    const images: string[] = []

    for (const prompt of prompts) {
      const response = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: {
            prompt,
            num_outputs: 1,
            aspect_ratio: '1:1',
            output_format: 'webp',
            output_quality: 80,
          }
        }),
      })

      const prediction = await response.json()

      // Poll for completion
      let result = prediction
      let attempts = 0
      while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < 30) {
        await new Promise(r => setTimeout(r, 1000))
        const poll = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
          headers: { 'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}` }
        })
        result = await poll.json()
        attempts++
      }

      if (result.status === 'succeeded' && result.output?.[0]) {
        images.push(result.output[0])
      }
    }

    return NextResponse.json({ images })
  } catch (err) {
    console.error('[generate-ugc] error:', err)
    return NextResponse.json({ error: 'Failed to generate images' }, { status: 500 })
  }
}