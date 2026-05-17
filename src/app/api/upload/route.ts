// src/app/api/upload/route.ts
// Handles video and image uploads to Cloudflare R2
// Videos: up to 2GB, served from cdn.ugcaffiliates.com
// Images: up to 20MB, high-res 1080p+

import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { createServiceClient } from '@/lib/supabase-server'

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.R2_BUCKET_NAME || 'ugcaffiliates'
const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || 'https://cdn.ugcaffiliates.com'

const ALLOWED_VIDEO_TYPES = [
  'video/mp4', 'video/quicktime', 'video/webm',
  'video/mov', 'video/x-msvideo', 'video/x-ms-wmv',
]

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png',
  'image/webp', 'image/gif', 'image/heic',
]

const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024  // 2GB
const MAX_IMAGE_BYTES = 50 * 1024 * 1024         // 50MB — supports 4K images

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createServiceClient()
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // ── Parse form data ───────────────────────────────────────────────────────
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const type = (formData.get('type') as string) || 'image' // 'video' | 'image'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const contentType = file.type || 'application/octet-stream'
    const isVideo = type === 'video'
    const isImage = type === 'image'

    // ── Validate type ─────────────────────────────────────────────────────────
    if (isVideo && !ALLOWED_VIDEO_TYPES.includes(contentType) && !file.name.match(/\.(mp4|mov|webm|avi|wmv)$/i)) {
      return NextResponse.json({ error: 'Invalid video format. Please upload MP4, MOV, or WebM.' }, { status: 400 })
    }

    if (isImage && !ALLOWED_IMAGE_TYPES.includes(contentType) && !file.name.match(/\.(jpg|jpeg|png|webp|gif|heic)$/i)) {
      return NextResponse.json({ error: 'Invalid image format. Please upload JPG, PNG, or WebP.' }, { status: 400 })
    }

    // ── Validate size ─────────────────────────────────────────────────────────
    if (isVideo && file.size > MAX_VIDEO_BYTES) {
      return NextResponse.json({ error: 'Video too large. Maximum size is 2GB.' }, { status: 400 })
    }

    if (isImage && file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'Image too large. Maximum size is 50MB.' }, { status: 400 })
    }

    // ── Build path ────────────────────────────────────────────────────────────
    const ext = file.name.split('.').pop()?.toLowerCase() || (isVideo ? 'mp4' : 'jpg')
    const folder = isVideo ? 'promo-videos' : 'product-images'
    const key = `${folder}/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`

    // ── Upload to R2 ──────────────────────────────────────────────────────────
    const buffer = Buffer.from(await file.arrayBuffer())

    await r2.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000',
    }))

    const url = `${CDN_URL}/${key}`

    console.log(`[upload] ${type} uploaded: ${url}`)
    return NextResponse.json({ url, key, type })

  } catch (err: any) {
    console.error('[upload] error:', err)
    return NextResponse.json({ error: err.message ?? 'Upload failed' }, { status: 500 })
  }
}