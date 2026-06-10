import { createClient as createSupabaseAdmin } from "@supabase/supabase-js"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Edit, Eye, EyeOff } from "lucide-react"

const levelLabels = { beginner: "מתחיל", intermediate: "בינוני", advanced: "מתקדם" }

export default async function AdminCoursesPage() {
  const supabase = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
  )
  const { data: courses } = await supabase
    .from("courses")
    .select("*, lessons(count)")
    .order("created_at", { ascending: false })

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ניהול קורסים</h1>
        <Link href="/admin/courses/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            קורס חדש
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {courses?.map((course) => {
          const lessonCount = (course.lessons as { count: number }[])?.[0]?.count ?? 0
          return (
            <Card key={course.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{course.title}</h3>
                    <Badge variant={course.published ? "default" : "secondary"}>
                      {course.published ? "פורסם" : "טיוטה"}
                    </Badge>
                    <Badge variant="outline">
                      {levelLabels[course.level as keyof typeof levelLabels]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">{course.description}</p>
                  <p className="text-xs text-muted-foreground">{lessonCount} שיעורים</p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/courses/${course.id}`}>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Edit className="h-3.5 w-3.5" />
                      ערוך
                    </Button>
                  </Link>
                  <Link href={`/courses/${course.id}`}>
                    <Button variant="ghost" size="sm" className="gap-1.5">
                      <Eye className="h-3.5 w-3.5" />
                      תצוגה
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {(!courses || courses.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            אין קורסים עדיין —{" "}
            <Link href="/admin/courses/new" className="text-primary hover:underline">
              צור קורס ראשון
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
