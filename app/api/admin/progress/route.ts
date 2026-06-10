import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  return profile?.role === "admin" ? supabase : null
}

// POST: mark a lesson complete for a specific student
export async function POST(req: Request) {
  const supabase = await requireAdmin()
  if (!supabase) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { studentId, lessonId } = await req.json()
  const { error } = await supabase
    .from("lesson_progress")
    .upsert({ student_id: studentId, lesson_id: lessonId })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE: unmark a lesson for a student
export async function DELETE(req: Request) {
  const supabase = await requireAdmin()
  if (!supabase) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { studentId, lessonId } = await req.json()
  const { error } = await supabase
    .from("lesson_progress")
    .delete()
    .eq("student_id", studentId)
    .eq("lesson_id", lessonId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
