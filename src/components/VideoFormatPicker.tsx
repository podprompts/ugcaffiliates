// src/components/VideoFormatPicker.tsx
// Drop this into your vendor product listing page wherever the video generation UI lives.
// Vendor picks their target platform before clicking "Generate video".

'use client'

import { VIDEO_FORMATS, VideoFormatKey, DEFAULT_FORMAT } from '@/lib/video-formats'

interface Props {
  value: VideoFormatKey
  onChange: (format: VideoFormatKey) => void
  disabled?: boolean
}

export default function VideoFormatPicker({ value, onChange, disabled }: Props) {
  return (
    <div>
      <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888', marginBottom: '0.75rem' }}>
        Target platform
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
        {(Object.entries(VIDEO_FORMATS) as [VideoFormatKey, typeof VIDEO_FORMATS[VideoFormatKey]][]).map(([key, fmt]) => {
          const active = value === key
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              disabled={disabled}
              style={{
                textAlign: 'left',
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                border: active ? '1.5px solid #0d0d0d' : '1.5px solid #e8e6e2',
                background: active ? '#0d0d0d' : '#ffffff',
                color: active ? '#ffffff' : '#0d0d0d',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                fontFamily: 'inherit',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ fontSize: '18px', marginBottom: '0.25rem' }}>{fmt.icon}</div>
              <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '0.2rem' }}>{fmt.label}</div>
              <div style={{ fontSize: '11px', color: active ? 'rgba(255,255,255,0.65)' : '#888', lineHeight: 1.4 }}>{fmt.description}</div>
              <div style={{ fontSize: '10px', color: active ? 'rgba(255,255,255,0.45)' : '#aaa', marginTop: '0.35rem', fontFamily: 'monospace' }}>
                {fmt.width} × {fmt.height}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}