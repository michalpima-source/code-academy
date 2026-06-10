import { createClient as createSupabaseAdmin } from "@supabase/supabase-js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"
import { ImpersonateButton } from "@/components/impersonate-button"
import { StudentManager } from "@/components/admin/student-manager"

export default async function AdminStudentsPage() {
  const adminClient = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
  )

  const [
    { data: students },
    { data: authUsers },
    { data: courses },
  ] = await Promise.all([
    adminClient
      .from("profiles")
      .select(`id, display_name, created_at, enrollments(course_id, courses(title))`)
      .eq("role", "student")
      .order("created_at", { ascending: false }),
    adminClient.auth.admin.listUsers(),
    adminClient.from("courses").select("id, title, published").order("title"),
  ])

  const emailMap = Object.fromEntries(
    (authUsers?.users ?? []).map((u) => [u.id, u.email ?? ""])
  )

  // Fetch lesson progress counts per student per course
  const { data: progressRows } = await adminClient
    .from("lesson_progress")
    .select("student_id, lessons(course_id)")

  const progressMap: Record<string, Record<string, number>> = {}
  for (const row of progressRows ?? []) {
    const courseId = (row.lessons as unknown as { course_id: string } | null)?.course_id
    if (!courseId) continue
    const sid = row.student_id as string
    if (!progressMap[sid]) progressMap[sid] = {}
    progressMap[sid][courseId] = (progressMap[sid][courseId] ?? 0) + 1
  }

  // Fetch lesson counts per course
  const { data: lessonCounts } = await adminClient
    .from("lessons")
    .select("course_id, id")

  const lessonCountMap: Record<string, number> = {}
  for (const l of lessonCounts ?? []) {
    lessonCountMap[l.course_id] = (lessonCountMap[l.course_id] ?? 0) + 1
  }

  return (
    <div className="px-4 py-6 md:p-6 max-w-5xl mx-auto space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">תלמידים</h1>
        <Badge variant="secondary">{students?.length ?? 0} סה&quot;כ</Badge>
      </div>

      <div className="space-y-4">
        {students?.map((student) => {
          const enrollments = ((student.enrollments ?? []) as unknown as {
            course_id: string
            courses: { title: string } | null
          }[])
          const email = emailMap[student.id] ?? ""
          const joinDate = new Date(student.created_at)
          const isNew = (Date.now() - joinDate.getTime()) < 7 * 24 * 60 * 60 * 1000

          return (
            <Card key={student.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                      {(student.display_name ?? "?").charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{student.display_name ?? "ללא שם"}</CardTitle>
                        {isNew && <Badge variant="secondary" className="text-xs">חדש</Badge>}
                      </div>
                      {email && <p className="text-xs text-muted-foreground font-mono mt-0.5">{email}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{joinDate.toLocaleDateString("he-IL")}</span>
                    {email && <ImpersonateButton email={email} name={student.display_name ?? email} />}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <StudentManager
                  studentId={student.id}
                  studentName={student.display_name ?? "תלמיד"}
                  enrollments={enrollments}
                  allCourses={(courses ?? []) as { id: string; title: string; published: boolean }[]}
                  progressMap={progressMap[student.id] ?? {}}
                  lessonCountMap={lessonCountMap}
                />
              </CardContent>
            </Card>
          )
        })}

        {(!students || students.length === 0) && (
          <div className="py-12 text-center text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
            עדיין אין תלמידים רשומים
          </div>
        )}
      </div>
    </div>
  )
}
