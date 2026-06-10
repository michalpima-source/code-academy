import { NextRequest, NextResponse } from "next/server"

function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s?#]+)/,
    /youtube\.com\/embed\/([^&\s?#/]+)/,
    /youtube\.com\/shorts\/([^&\s?#/]+)/,
  ]
  for (const pat of patterns) {
    const match = url.match(pat)
    if (match) return match[1]
  }
  return null
}

function extractPlaylistId(url: string): string | null {
  const match = url.match(/[?&]list=([^&]+)/)
  return match ? match[1] : null
}

async function getVideoMeta(videoId: string) {
  const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
  const res = await fetch(oembedUrl)
  if (!res.ok) return null
  const data = await res.json()
  return {
    id: videoId,
    title: data.title as string,
    thumbnail: data.thumbnail_url as string,
    author: data.author_name as string,
  }
}

async function getPlaylistVideos(playlistId: string) {
  // Use YouTube RSS feed (no API key required) to get video IDs and titles
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`
  const res = await fetch(feedUrl)
  if (!res.ok) return null

  const xml = await res.text()

  // Parse video IDs and titles from Atom feed
  const entries: { id: string; title: string }[] = []
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g
  let match

  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1]
    const idMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)
    const titleMatch = entry.match(/<title>([^<]+)<\/title>/)
    if (idMatch && titleMatch) {
      entries.push({ id: idMatch[1], title: titleMatch[1] })
    }
  }

  return entries
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url")
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 })

  const playlistId = extractPlaylistId(url)

  if (playlistId) {
    // Playlist mode
    const videos = await getPlaylistVideos(playlistId)
    if (!videos || videos.length === 0) {
      return NextResponse.json({ error: "לא הצלחתי לשלוף את ה-Playlist. ודא שהוא ציבורי." }, { status: 400 })
    }
    return NextResponse.json({
      type: "playlist",
      playlistId,
      videos: videos.map((v, i) => ({
        youtube_id: v.id,
        title: v.title,
        order_index: i + 1,
      })),
    })
  }

  const videoId = extractYoutubeId(url)
  if (!videoId) {
    return NextResponse.json({ error: "לא זוהה לינק YouTube תקין" }, { status: 400 })
  }

  const meta = await getVideoMeta(videoId)
  if (!meta) {
    return NextResponse.json({ error: "לא הצלחתי לשלוף פרטי הסרטון" }, { status: 400 })
  }

  return NextResponse.json({ type: "video", ...meta })
}
