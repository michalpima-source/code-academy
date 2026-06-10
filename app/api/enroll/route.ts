import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { courseId } = await req.json()
  if (!courseId) return NextResponse.json({ error: "Missing courseId" }, { status: 400 })

  const { error } = await supabase
    .from("enrollments")
    .insert({ student_id: user.id, course_id: courseId })

  if (error && error.code !== "23505") {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
