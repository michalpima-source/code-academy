import { NextResponse } from "next/server"
import { YoutubeTranscript } from "youtube-transcript"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  // Verify admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { youtubeId, lessonId } = await req.json()
  if (!youtubeId || !lessonId) return NextResponse.json({ error: "Missing params" }, { status: 400 })

  try {
    const items = await YoutubeTranscript.fetchTranscript(youtubeId, { lang: "he" })
      .catch(() => YoutubeTranscript.fetchTranscript(youtubeId, { lang: "en" }))
      .catch(() => YoutubeTranscript.fetchTranscript(youtubeId))

    const transcript = items.map((t) => t.text).join(" ")

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
    )
    await admin
      .from("lessons")
      .update({ transcript, transcript_fetched_at: new Date().toISOString() })
      .eq("id", lessonId)

    return NextResponse.json({ ok: true, length: transcript.length })
  } catch {
    return NextResponse.json({ error: "No transcript available for this video" }, { status: 404 })
  }
}
