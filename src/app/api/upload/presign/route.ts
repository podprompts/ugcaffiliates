// src/app/api/upload/presign/route.ts
// Returns a presigned URL for direct browser-to-R2 upload
// Bypasses Vercel's 4.5MB body limit entirely

import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createServiceClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET  = process.env.R2_BUCKET_NAME || 'ugcaffiliates'
const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || 'https://cdn.ugcaffiliates.com'

export async function POST(req: NextRequest) {
  try {
    // Auth
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createServiceClient()
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { filename, contentType, type } = await req.json()
    if (!filename || !contentType || !type) {
      return NextResponse.json({ error: 'filename, contentType and type required' }, { status: 400 })
    }

    const ext    = filename.split('.').pop()?.toLowerCase() || (type === 'video' ? 'mp4' : 'jpg')
    const folder = type === 'video' ? 'promo-videos' : 'product-images'
    const key    = `${folder}/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`

    const command = new PutObjectCommand({
      Bucket:       BUCKET,
      Key:          key,
      ContentType:  contentType,
      CacheControl: 'public, max-age=31536000',
    })

    // Presigned URL valid for 1 hour
    const presignedUrl = await getSignedUrl(r2, command, { expiresIn: 3600 })
    const publicUrl    = `${CDN_URL}/${key}`

    return NextResponse.json({ presignedUrl, publicUrl, key })
  } catch (err: any) {
    console.error('[presign] error:', err)
    return NextResponse.json({ error: err.message ?? 'Failed to generate upload URL' }, { status: 500 })
  }
}