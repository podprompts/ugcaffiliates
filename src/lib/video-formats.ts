// src/lib/video-formats.ts
// Single source of truth for supported HeyGen video output formats.
// Import this in both the API route and the vendor UI format picker.

export const VIDEO_FORMATS = {
  tiktok: {
    label: 'TikTok / Reels / Shorts',
    description: 'Vertical 9:16 — TikTok, Instagram Reels, YouTube Shorts',
    width: 720,
    height: 1280,
    icon: '📱',
  },
  instagram_sq: {
    label: 'Instagram Feed',
    description: 'Square 1:1 — Instagram and Facebook feed posts',
    width: 1080,
    height: 1080,
    icon: '⬛',
  },
  youtube: {
    label: 'YouTube / Facebook',
    description: 'Landscape 16:9 — YouTube, Facebook, embedded web video',
    width: 1920,
    height: 1080,
    icon: '🖥️',
  },
  pinterest: {
    label: 'Pinterest',
    description: 'Tall 2:3 — Pinterest and blog thumbnails',
    width: 1000,
    height: 1500,
    icon: '📌',
  },
  twitter: {
    label: 'Twitter / X',
    description: 'Landscape 16:9 (720p) — Twitter/X video posts',
    width: 1280,
    height: 720,
    icon: '🐦',
  },
} as const

export type VideoFormatKey = keyof typeof VIDEO_FORMATS

export const DEFAULT_FORMAT: VideoFormatKey = 'tiktok'