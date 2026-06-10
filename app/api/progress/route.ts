import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { lessonId, courseId } = await req.json()
  if (!lessonId) return NextResponse.json({ error: "Missing lessonId" }, { status: 400 })

  // Mark lesson as complete (ignore if already done)
  await supabase
    .from("lesson_progress")
    .upsert({ student_id: user.id, lesson_id: lessonId }, { onConflict: "student_id,lesson_id" })

  // Badge checks
  await checkAndAwardBadges(supabase, user.id, courseId)

  return NextResponse.json({ ok: true })
}

async function checkAndAwardBadges(supabase: any, userId: string, courseId?: string) {
  const { data: badges } = await supabase.from("badges").select("id, name")
  if (!badges) return

  const badgeMap = Object.fromEntries(badges.map((b: any) => [b.name, b.id]))

  // "First Step" — first lesson ever completed
  const { count: totalProgress } = await supabase
    .from("lesson_progress")
    .select("id", { count: "exact", head: true })
    .eq("student_id", userId)

  if (totalProgress === 1 && badgeMap["First Step"]) {
    await supabase
      .from("student_badges")
      .upsert({ student_id: userId, badge_id: badgeMap["First Step"] }, { onConflict: "student_id,badge_id", ignoreDuplicates: true })
  }

  // "Weekly Warrior" — 5 lessons this week
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { count: weeklyProgress } = await supabase
    .from("lesson_progress")
    .select("id", { count: "exact", head: true })
    .eq("student_id", userId)
    .gte("completed_at", weekAgo)

  if (weeklyProgress >= 5 && badgeMap["Weekly Warrior"]) {
    await supabase
      .from("student_badges")
      .upsert({ student_id: userId, badge_id: badgeMap["Weekly Warrior"] }, { onConflict: "student_id,badge_id", ignoreDuplicates: true })
  }

  // "Code Explorer" — enrolled in 3+ courses
  const { count: enrollCount } = await supabase
    .from("enrollments")
    .select("id", { count: "exact", head: true })
    .eq("student_id", userId)

  if (enrollCount >= 3 && badgeMap["Code Explorer"]) {
    await supabase
      .from("student_badges")
      .upsert({ student_id: userId, badge_id: badgeMap["Code Explorer"] }, { onConflict: "student_id,badge_id", ignoreDuplicates: true })
  }

  // "Course Complete" — all lessons in a course done
  if (courseId) {
    const { count: totalLessons } = await supabase
      .from("lessons")
      .select("id", { count: "exact", head: true })
      .eq("course_id", courseId)

    const { count: doneLessons } = await supabase
      .from("lesson_progress")
      .select("id", { count: "exact", head: true })
      .eq("student_id", userId)
      .in("lesson_id",
        (await supabase.from("lessons").select("id").eq("course_id", courseId)).data?.map((l: any) => l.id) ?? []
      )

    if (totalLessons > 0 && doneLessons >= totalLessons && badgeMap["Course Complete"]) {
      await supabase
        .from("student_badges")
        .upsert({ student_id: userId, badge_id: badgeMap["Course Complete"] }, { onConflict: "student_id,badge_id", ignoreDuplicates: true })
    }
  }
}
