import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BookOpen, PlayCircle, Trophy, Flame, Target, Rocket } from "lucide-react"

const badgeIcons: Record<string, React.ReactNode> = {
  "🎯": <Target className="h-6 w-6" />,
  "🏆": <Trophy className="h-6 w-6" />,
  "🔥": <Flame className="h-6 w-6" />,
  "🚀": <Rocket className="h-6 w-6" />,
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [{ data: profile }, { data: enrollments }, { data: progressRows }, { data: allBadges }, { data: earnedBadges }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).single(),
    supabase
      .from("enrollments")
      .select("course_id, enrolled_at, courses(id, title, lessons(count))")
      .eq("student_id", user.id)
      .order("enrolled_at", { ascending: false }),
    // lesson_progress has no FK to enrollments — fetch separately and group by course
    supabase
      .from("lesson_progress")
      .select("lesson_id, lessons(course_id)")
      .eq("student_id", user.id),
    supabase.from("badges").select("*"),
    supabase.from("student_badges").select("badge_id").eq("student_id", user.id),
  ])

  // Build courseId → completedCount map
  const completedByCourse = new Map<string, number>()
  for (const row of progressRows ?? []) {
    const courseId = (row.lessons as unknown as { course_id: string } | null)?.course_id
    if (courseId) completedByCourse.set(courseId, (completedByCourse.get(courseId) ?? 0) + 1)
  }

  const earnedBadgeIds = new Set(earnedBadges?.map((b) => b.badge_id) ?? [])

  return (
    <div className="px-4 py-6 md:p-6 max-w-5xl mx-auto space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">שלום, {profile?.display_name ?? "תלמיד"} 👋</h1>
        <p className="text-muted-foreground mt-1">ממשיך מאיפה שעצרת</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "קורסים פעילים", value: enrollments?.length ?? 0, icon: <BookOpen className="h-5 w-5 text-blue-500" /> },
          { label: "הישגים", value: earnedBadgeIds.size, icon: <Trophy className="h-5 w-5 text-yellow-500" /> },
        ].map(({ label, value, icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 p-4">
              {icon}
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* My courses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5" />
            הקורסים שלי
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {enrollments && enrollments.length > 0 ? (
            enrollments.map((enrollment) => {
              const course = enrollment.courses as any
              const totalLessons = course?.lessons?.[0]?.count ?? 0
              const completedLessons = completedByCourse.get(enrollment.course_id) ?? 0
              const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

              return (
                <div key={enrollment.course_id} className="flex items-center gap-4 rounded-lg border p-4">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{course?.title}</span>
                      <span className="text-sm text-muted-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {completedLessons} / {totalLessons} שיעורים הושלמו
                    </p>
                  </div>
                  <Link href={`/courses/${enrollment.course_id}`}>
                    <Button size="sm" variant={progress > 0 ? "default" : "outline"}>
                      {progress > 0 ? "המשך" : "התחל"}
                    </Button>
                  </Link>
                </div>
              )
            })
          ) : (
            <div className="flex flex-col items-center gap-3 py-8 text-center text-muted-foreground">
              <BookOpen className="h-10 w-10 opacity-40" />
              <p>עדיין לא נרשמת לקורסים</p>
              <Link href="/courses">
                <Button size="sm">גלה קורסים</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            הישגים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {allBadges?.map((badge) => {
              const isEarned = earnedBadgeIds.has(badge.id)
              return (
                <div
                  key={badge.id}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all ${
                    isEarned ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20" : "opacity-40 grayscale"
                  }`}
                >
                  <span className="text-3xl">{badge.icon}</span>
                  <span className="text-sm font-semibold">{badge.name}</span>
                  <span className="text-xs text-muted-foreground">{badge.description}</span>
                  {isEarned && <Badge variant="secondary" className="text-xs">הושג!</Badge>}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
