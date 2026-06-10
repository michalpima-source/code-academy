"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { UserPlus, UserMinus, ChevronDown, ChevronUp } from "lucide-react"

interface Course {
  id: string
  title: string
  published: boolean
}

interface Enrollment {
  course_id: string
  courses: { title: string } | null
}

interface StudentManagerProps {
  studentId: string
  studentName: string
  enrollments: Enrollment[]
  allCourses: Course[]
  progressMap: Record<string, number>
  lessonCountMap: Record<string, number>
}

export function StudentManager({
  studentId,
  studentName,
  enrollments: initialEnrollments,
  allCourses,
  progressMap,
  lessonCountMap,
}: StudentManagerProps) {
  const [enrollments, setEnrollments] = useState(initialEnrollments)
  const [expanded, setExpanded] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState("")
  const [loading, setLoading] = useState("")

  const enrolledCourseIds = new Set(enrollments.map((e) => e.course_id))
  const unenrolledCourses = allCourses.filter((c) => !enrolledCourseIds.has(c.id))

  async function enroll() {
    if (!selectedCourse) return
    setLoading("enroll")
    const res = await fetch("/api/admin/enroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, courseId: selectedCourse }),
    })
    if (res.ok) {
      const course = allCourses.find((c) => c.id === selectedCourse)
      setEnrollments((prev) => [...prev, { course_id: selectedCourse, courses: { title: course?.title ?? "" } }])
      setSelectedCourse("")
      toast.success(`${studentName} נרשם לקורס ${course?.title}`)
    } else {
      toast.error("שגיאה בהרשמה")
    }
    setLoading("")
  }

  async function unenroll(courseId: string, courseTitle: string) {
    setLoading("unenroll-" + courseId)
    const res = await fetch("/api/admin/enroll", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, courseId }),
    })
    if (res.ok) {
      setEnrollments((prev) => prev.filter((e) => e.course_id !== courseId))
      toast.success(`${studentName} הוסר מ-${courseTitle}`)
    } else {
      toast.error("שגיאה בהסרה")
    }
    setLoading("")
  }

  return (
    <div className="space-y-3">
      {/* Enrollment overview */}
      <div className="flex flex-wrap gap-2 items-center">
        {enrollments.length === 0 ? (
          <span className="text-sm text-muted-foreground">לא נרשם לקורסים עדיין</span>
        ) : (
          enrollments.map((e) => {
            const total = lessonCountMap[e.course_id] ?? 0
            const done = progressMap[e.course_id] ?? 0
            const pct = total > 0 ? Math.round((done / total) * 100) : 0
            return (
              <div key={e.course_id} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5">
                <span className="text-sm font-medium">{e.courses?.title}</span>
                <span className="text-xs text-muted-foreground">{pct}%</span>
                <div className="w-16">
                  <Progress value={pct} className="h-1" />
                </div>
              </div>
            )
          })
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1 text-muted-foreground"
          onClick={() => setExpanded((o) => !o)}
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {expanded ? "סגור" : "ניהול"}
        </Button>
      </div>

      {/* Expanded management panel */}
      {expanded && (
        <div className="rounded-lg border p-4 space-y-4 bg-muted/30">
          {/* Add enrollment */}
          {unenrolledCourses.length > 0 && (
            <div className="flex gap-2">
              <Select value={selectedCourse} onValueChange={(v) => setSelectedCourse(v ?? "")}>
                <SelectTrigger className="flex-1 h-8 text-sm">
                  <SelectValue placeholder="בחר קורס לשיוך..." />
                </SelectTrigger>
                <SelectContent>
                  {unenrolledCourses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                      {!c.published && <span className="text-muted-foreground mr-1">(טיוטה)</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="h-8 gap-1.5"
                onClick={enroll}
                disabled={!selectedCourse || loading === "enroll"}
              >
                <UserPlus className="h-3.5 w-3.5" />
                הרשם
              </Button>
            </div>
          )}

          {/* Per-course management */}
          {enrollments.map((e) => {
            const total = lessonCountMap[e.course_id] ?? 0
            const done = progressMap[e.course_id] ?? 0
            return (
              <div key={e.course_id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{e.courses?.title}</span>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-xs">{done}/{total} שיעורים</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-destructive hover:text-destructive gap-1"
                      onClick={() => unenroll(e.course_id, e.courses?.title ?? "")}
                      disabled={loading === "unenroll-" + e.course_id}
                    >
                      <UserMinus className="h-3 w-3" />
                      הסר
                    </Button>
                  </div>
                </div>
                <Progress value={total > 0 ? Math.round((done / total) * 100) : 0} className="h-1.5" />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
