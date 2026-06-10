import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { EnrollButton } from "@/components/enroll-button"
import { Play, Clock, CheckCircle2, BookOpen, Lock } from "lucide-react"

const levelLabels = { beginner: "מתחיל", intermediate: "בינוני", advanced: "מתקדם" }
const levelColors = {
  beginner: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
  intermediate: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25",
  advanced: "bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/25",
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}:${String(m % 60).padStart(2, "0")} שעות`
  return `${m} דקות`
}

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: course }, { data: enrollment }, { data: progress }] = await Promise.all([
    supabase
      .from("courses")
      .select("*, lessons(id, title, description, youtube_id, duration_seconds, order_index)")
      .eq("id", id)
      .eq("published", true)
      .order("order_index", { referencedTable: "lessons", ascending: true })
      .single(),
    user
      ? supabase.from("enrollments").select("enrolled_at").eq("student_id", user.id).eq("course_id", id).single()
      : Promise.resolve({ data: null }),
    user
      ? supabase.from("lesson_progress").select("lesson_id").eq("student_id", user.id)
      : Promise.resolve({ data: [] }),
  ])

  if (!course) notFound()

  const lessons = course.lessons as any[]
  const completedIds = new Set((progress ?? []).map((p: any) => p.lesson_id))
  const completedCount = lessons.filter((l) => completedIds.has(l.id)).length
  const progressPct = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0
  const totalSeconds = lessons.reduce((s: number, l: any) => s + (l.duration_seconds ?? 0), 0)
  const nextLesson = lessons.find((l: any) => !completedIds.has(l.id))
  const isEnrolled = !!enrollment
  const previewLesson = lessons[0]

  return (
    <div className="min-h-full" dir="rtl">
      {/* Video preview hero */}
      {previewLesson && (
        <div className="relative bg-black">
          <div className="relative w-full" style={{ paddingTop: "42%" }}>
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube.com/embed/${previewLesson.youtube_id}?rel=0&modestbranding=1${!isEnrolled ? "&controls=1" : ""}`}
              title={previewLesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            {/* Overlay for non-enrolled users after first few seconds */}
            {!isEnrolled && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
            )}
          </div>
          {/* Cover image fallback overlay label */}
          <div className="absolute bottom-0 start-0 end-0 p-4 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
            <p className="text-white/90 text-sm font-medium">
              {isEnrolled ? "▶ ממשיך מ:" : "👁 תצוגה מקדימה:"} {previewLesson.title}
            </p>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Course header */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={`border ${levelColors[course.level as keyof typeof levelColors]}`}>
              {levelLabels[course.level as keyof typeof levelLabels]}
            </Badge>
            <span className="text-sm text-muted-foreground">{lessons.length} שיעורים</span>
            {totalSeconds > 0 && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {formatDuration(totalSeconds)} סה&quot;כ
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold leading-tight">{course.title}</h1>
          {course.description && (
            <p className="text-muted-foreground text-lg leading-relaxed">{course.description}</p>
          )}

          {/* CTA area */}
          <div className="rounded-xl border bg-card p-5 space-y-4">
            {isEnrolled ? (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">התקדמות</span>
                    <span className="font-semibold">{completedCount}/{lessons.length} שיעורים ({progressPct}%)</span>
                  </div>
                  <Progress value={progressPct} className="h-2.5" />
                </div>
                {completedCount === lessons.length ? (
                  <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                    <CheckCircle2 className="h-5 w-5" />
                    סיימת את הקורס! כל הכבוד 🎉
                  </div>
                ) : nextLesson ? (
                  <Link href={`/learn/${id}/${nextLesson.id}`}>
                    <Button className="w-full gap-2" size="lg">
                      <Play className="h-4 w-4" />
                      המשך: {nextLesson.title}
                    </Button>
                  </Link>
                ) : null}
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  <span>הרשמה חינמית — גישה מיידית לכל {lessons.length} השיעורים</span>
                </div>
                <EnrollButton courseId={id} userId={user?.id} />
              </div>
            )}
          </div>
        </div>

        {/* Lessons list */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold">תוכן הקורס</h2>
          <div className="rounded-xl border divide-y overflow-hidden">
            {lessons.map((lesson: any, i: number) => {
              const done = completedIds.has(lesson.id)
              const canAccess = isEnrolled || i === 0

              return (
                <div
                  key={lesson.id}
                  className={`flex items-center gap-4 p-4 transition-colors ${
                    canAccess ? "hover:bg-muted/40" : "opacity-60"
                  }`}
                >
                  {/* Index / status */}
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                    {done ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : canAccess ? (
                      <span className="text-muted-foreground font-mono text-xs">{i + 1}</span>
                    ) : (
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>

                  {/* Title + duration */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm truncate ${done ? "text-muted-foreground line-through" : ""}`}>
                      {lesson.title}
                    </p>
                    {lesson.duration_seconds > 0 && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Clock className="h-3 w-3" />
                        {formatDuration(lesson.duration_seconds)}
                      </span>
                    )}
                  </div>

                  {/* Action */}
                  {canAccess && (
                    <Link href={`/learn/${id}/${lesson.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs shrink-0">
                        <Play className="h-3 w-3" />
                        {done ? "צפה שוב" : i === 0 && !isEnrolled ? "תצוגה מקדימה" : "צפה"}
                      </Button>
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
