// scripts/list-heygen-avatars.ts
// Run once to browse available HeyGen avatars and voices, then update
// DEFAULT_AVATAR_ID and DEFAULT_VOICE_ID in your route files.
//
// Usage:
//   HEYGEN_API_KEY=your_key npx tsx scripts/list-heygen-avatars.ts

const API_KEY = process.env.HEYGEN_API_KEY

if (!API_KEY) {
  console.error('Set HEYGEN_API_KEY env var before running this script.')
  process.exit(1)
}

async function main() {
  console.log('\n── HeyGen Public Avatars ─────────────────────────────────')
  const avatarRes = await fetch('https://api.heygen.com/v2/avatars', {
    headers: { 'X-Api-Key': API_KEY! },
  })
  const avatarData = await avatarRes.json()
  const avatars = avatarData.data?.avatars ?? []
  avatars.slice(0, 20).forEach((a: any) => {
    console.log(`  id: ${a.avatar_id}  |  name: ${a.avatar_name}  |  gender: ${a.gender}`)
  })
  console.log(`  ... (${avatars.length} total)`)

  console.log('\n── HeyGen Voices (English) ───────────────────────────────')
  const voiceRes = await fetch('https://api.heygen.com/v2/voices', {
    headers: { 'X-Api-Key': API_KEY! },
  })
  const voiceData = await voiceRes.json()
  const voices = (voiceData.data?.voices ?? []).filter((v: any) => v.language === 'English')
  voices.slice(0, 20).forEach((v: any) => {
    console.log(`  id: ${v.voice_id}  |  name: ${v.display_name}  |  gender: ${v.gender}  |  accent: ${v.accent}`)
  })
  console.log(`  ... (${voices.length} English voices total)`)

  console.log('\nPaste your chosen avatar_id and voice_id into:')
  console.log('  src/app/api/ai/heygen-video/route.ts  (DEFAULT_AVATAR_ID / DEFAULT_VOICE_ID)')
  console.log('  src/app/api/ai/generate-video/route.ts (same constants)')
}

main().catch(console.error)