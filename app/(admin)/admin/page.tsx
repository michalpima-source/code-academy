import { createClient as createSupabaseAdmin } from "@supabase/supabase-js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen, MessageSquare, TrendingUp, GraduationCap } from "lucide-react"
import Link from "next/link"
import { AdminCharts } from "@/components/admin/admin-charts"

export default async function AdminDashboardPage() {
  const supabase = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
  )

  const [
    { count: totalStudents },
    { count: totalCourses },
    { count: totalMessages },
    { count: totalEnrollments },
    { data: recentProgress },
    { data: courses },
    { data: topQuestions },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("courses").select("id", { count: "exact", head: true }),
    supabase.from("chat_messages").select("id", { count: "exact", head: true }),
    supabase.from("enrollments").select("id", { count: "exact", head: true }),
    supabase
      .from("lesson_progress")
      .select("completed_at, student_id, lessons(course_id)")
      .order("completed_at", { ascending: false })
      .limit(200),
    supabase
      .from("courses")
      .select("id, title, published, lessons(count), enrollments(count)")
      .order("title"),
    supabase
      .from("chat_messages")
      .select("content")
      .eq("role", "user")
      .order("created_at", { ascending: false })
      .limit(8),
  ])

  // Build daily activity for last 14 days
  const today = new Date()
  const dailyActivity: { date: string; שיעורים: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toLocaleDateString("he-IL", { day: "numeric", month: "numeric" })
    dailyActivity.push({ date: key, שיעורים: 0 })
  }
  for (const row of recentProgress ?? []) {
    if (!row.completed_at) continue
    const d = new Date(row.completed_at)
    const key = d.toLocaleDateString("he-IL", { day: "numeric", month: "numeric" })
    const entry = dailyActivity.find((e) => e.date === key)
    if (entry) entry["שיעורים"]++
  }

  // Course completion data
  const courseStats = (courses ?? []).map((c) => {
    const lessonCount = (c.lessons as unknown as { count: number }[])?.[0]?.count ?? 0
    const enrollCount = (c.enrollments as unknown as { count: number }[])?.[0]?.count ?? 0
    return {
      name: c.title.length > 20 ? c.title.slice(0, 20) + "…" : c.title,
      תלמידים: enrollCount,
      שיעורים: lessonCount,
    }
  })

  const stats = [
    { label: "תלמידים", value: totalStudents ?? 0, icon: Users, color: "text-blue-500", href: "/admin/students", bg: "bg-blue-500/10" },
    { label: "קורסים", value: totalCourses ?? 0, icon: BookOpen, color: "text-green-500", href: "/admin/courses", bg: "bg-green-500/10" },
    { label: "הרשמות", value: totalEnrollments ?? 0, icon: GraduationCap, color: "text-orange-500", href: "/admin/students", bg: "bg-orange-500/10" },
    { label: "שאלות AI", value: totalMessages ?? 0, icon: MessageSquare, color: "text-purple-500", href: "/admin/students", bg: "bg-purple-500/10" },
  ]

  return (
    <div className="px-4 py-6 md:p-6 max-w-6xl mx-auto space-y-8" dir="rtl">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">דשבורד מורה</h1>
        <span className="text-sm text-muted-foreground">סקירה כללית</span>
      </div>

      {/* Stat cards — all clickable */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, href, bg }) => (
          <Link key={label} href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold group-hover:text-primary transition-colors">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <AdminCharts dailyActivity={dailyActivity} courseStats={courseStats} />

      {/* Recent AI questions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4" />
            שאלות אחרונות ב-AI Tutor
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topQuestions && topQuestions.length > 0 ? (
            <ul className="space-y-2">
              {topQuestions.map((q: { content: string }, i: number) => (
                <li key={i} className="text-sm p-3 rounded-lg bg-muted/50 text-muted-foreground border-r-2 border-primary/30">
                  {q.content.length > 140 ? q.content.slice(0, 140) + "…" : q.content}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">עדיין אין שאלות</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
