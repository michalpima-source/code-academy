import { createClient } from "@/lib/supabase/server"
import { CourseCard, CourseCardSkeleton } from "@/components/course-card"
import { Suspense } from "react"
import { BookOpen } from "lucide-react"

async function CourseGrid() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: courses }, { data: enrollments }, { data: progressRows }] = await Promise.all([
    supabase
      .from("courses")
      .select("id, title, description, level, cover_image_url, lessons(count)")
      .eq("published", true)
      .order("created_at", { ascending: false }),
    user
      ? supabase.from("enrollments").select("course_id, enrolled_at").eq("student_id", user.id)
      : Promise.resolve({ data: [] }),
    user
      ? supabase.from("lesson_progress").select("lesson_id, lessons(course_id)").eq("student_id", user.id)
      : Promise.resolve({ data: [] }),
  ])

  const enrollmentMap = new Map((enrollments ?? []).map((e) => [e.course_id, e]))

  const completedByCourse = new Map<string, number>()
  for (const row of progressRows ?? []) {
    const courseId = (row.lessons as unknown as { course_id: string } | null)?.course_id
    if (courseId) completedByCourse.set(courseId, (completedByCourse.get(courseId) ?? 0) + 1)
  }

  if (!courses || courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <BookOpen className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <p className="font-semibold text-lg">עדיין אין קורסים זמינים</p>
          <p className="text-muted-foreground text-sm mt-1">קורסים חדשים בדרך — חזור בקרוב</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
      {courses.map((course, i) => {
        const enrollment = enrollmentMap.get(course.id)
        const totalLessons = (course.lessons as { count: number }[])?.[0]?.count ?? 0
        const completedLessons = completedByCourse.get(course.id) ?? 0
        const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

        return (
          <div
            key={course.id}
            className="animate-in fade-in slide-in-from-bottom-4"
            style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
          >
            <CourseCard
              id={course.id}
              title={course.title}
              description={course.description ?? ""}
              level={course.level as "beginner" | "intermediate" | "advanced"}
              lessonCount={totalLessons}
              coverImageUrl={course.cover_image_url ?? undefined}
              enrolledAt={enrollment ? new Date(enrollment.enrolled_at) : null}
              progress={progress}
            />
          </div>
        )
      })}
    </div>
  )
}

function CourseGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
      {Array.from({ length: 6 }).map((_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </div>
  )
}

export default function CoursesPage() {
  return (
    <div className="px-4 py-6 md:p-6 max-w-6xl mx-auto space-y-8" dir="rtl">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">כל הקורסים</h1>
        <p className="text-muted-foreground">בחר קורס והתחל ללמוד היום</p>
      </div>
      <Suspense fallback={<CourseGridSkeleton />}>
        <CourseGrid />
      </Suspense>
    </div>
  )
}
