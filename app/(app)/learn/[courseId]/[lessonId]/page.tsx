import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { LessonPlayer } from "@/components/lesson-player"

export default async function LearnPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>
}) {
  const { courseId, lessonId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Verify enrollment
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("enrolled_at")
    .eq("student_id", user.id)
    .eq("course_id", courseId)
    .single()

  if (!enrollment) redirect(`/courses/${courseId}`)

  const [{ data: course }, { data: lessons }, { data: progress }] = await Promise.all([
    supabase.from("courses").select("id, title").eq("id", courseId).single(),
    supabase
      .from("lessons")
      .select("id, title, description, youtube_id, duration_seconds, order_index")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true }),
    supabase
      .from("lesson_progress")
      .select("lesson_id")
      .eq("student_id", user.id),
  ])

  if (!course || !lessons) notFound()

  const currentLesson = lessons.find((l) => l.id === lessonId)
  if (!currentLesson) notFound()

  const completedIds = (progress ?? []).map((p) => p.lesson_id)
  const currentIndex = lessons.findIndex((l) => l.id === lessonId)
  const nextLesson = lessons[currentIndex + 1] ?? null

  return (
    <LessonPlayer
      course={course}
      lessons={lessons}
      currentLesson={currentLesson}
      completedIds={completedIds}
      nextLesson={nextLesson}
      courseId={courseId}
    />
  )
}
