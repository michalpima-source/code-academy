"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Plus, Trash2, Loader2, Search, GripVertical, Eye, EyeOff } from "lucide-react"

interface LessonPreview {
  youtube_id: string
  title: string
  thumbnail?: string
  order_index: number
}

type Level = "beginner" | "intermediate" | "advanced"

export default function NewCoursePage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [level, setLevel] = useState<Level>("beginner")
  const [lessons, setLessons] = useState<LessonPreview[]>([])
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [fetching, setFetching] = useState(false)
  const [saving, setSaving] = useState(false)

  async function fetchYoutube() {
    if (!youtubeUrl.trim()) return
    setFetching(true)
    try {
      const res = await fetch(`/api/youtube?url=${encodeURIComponent(youtubeUrl)}`)
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }

      if (data.type === "playlist") {
        const newLessons: LessonPreview[] = data.videos.map((v: any, i: number) => ({
          youtube_id: v.youtube_id,
          title: v.title,
          order_index: lessons.length + i + 1,
        }))
        setLessons((prev) => [...prev, ...newLessons])
        toast.success(`${newLessons.length} שיעורים נוספו מה-Playlist!`)
      } else {
        setLessons((prev) => [
          ...prev,
          { youtube_id: data.id, title: data.title, thumbnail: data.thumbnail, order_index: prev.length + 1 },
        ])
        toast.success(`הסרטון "${data.title}" נוסף`)
      }
      setYoutubeUrl("")
    } catch {
      toast.error("שגיאה בשליפת הסרטון")
    } finally {
      setFetching(false)
    }
  }

  function removeLesson(idx: number) {
    setLessons((prev) => prev.filter((_, i) => i !== idx).map((l, i) => ({ ...l, order_index: i + 1 })))
  }

  function updateLessonTitle(idx: number, title: string) {
    setLessons((prev) => prev.map((l, i) => i === idx ? { ...l, title } : l))
  }

  async function saveCourse(publish = false) {
    if (!title.trim()) { toast.error("הכנס שם לקורס"); return }
    if (lessons.length === 0) { toast.error("הוסף לפחות שיעור אחד"); return }
    setSaving(true)
    const supabase = createClient()
    const { data: course, error: courseErr } = await supabase
      .from("courses")
      .insert({ title, description, level, published: publish })
      .select("id")
      .single()

    if (courseErr || !course) {
      toast.error(courseErr?.message ?? "שגיאה ביצירת הקורס")
      setSaving(false)
      return
    }

    const { error: lessonsErr } = await supabase.from("lessons").insert(
      lessons.map((l) => ({
        course_id: course.id,
        title: l.title,
        youtube_id: l.youtube_id,
        order_index: l.order_index,
      }))
    )

    if (lessonsErr) {
      toast.error("שגיאה בשמירת השיעורים: " + lessonsErr.message)
    } else {
      toast.success(publish ? "הקורס פורסם!" : "הקורס נשמר כטיוטה")
      router.push(`/admin/courses`)
    }
    setSaving(false)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6" dir="rtl">
      <h1 className="text-2xl font-bold">יצירת קורס חדש</h1>

      {/* Course details */}
      <Card>
        <CardHeader><CardTitle>פרטי הקורס</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>שם הקורס</Label>
            <Input placeholder="למשל: JavaScript מהבסיס" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>תיאור</Label>
            <Textarea placeholder="מה ילמדו התלמידים?" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label>רמה</Label>
            <div className="flex gap-2">
              {([["beginner", "מתחיל"], ["intermediate", "בינוני"], ["advanced", "מתקדם"]] as [Level, string][]).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setLevel(val)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    level === val ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* YouTube import */}
      <Card>
        <CardHeader>
          <CardTitle>הוספת שיעורים מ-YouTube</CardTitle>
          <p className="text-sm text-muted-foreground">הדבק לינק לסרטון בודד או ל-Playlist שלם</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="https://www.youtube.com/watch?v=... או https://www.youtube.com/playlist?list=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchYoutube()}
            />
            <Button onClick={fetchYoutube} disabled={fetching || !youtubeUrl.trim()} className="gap-2 shrink-0">
              {fetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              שלוף
            </Button>
          </div>

          {lessons.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{lessons.length} שיעורים:</p>
              {lessons.map((lesson, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground w-5 shrink-0">{i + 1}</span>
                  {lesson.thumbnail && (
                    <img src={lesson.thumbnail} alt="" className="h-9 w-16 rounded object-cover shrink-0" />
                  )}
                  <Input
                    value={lesson.title}
                    onChange={(e) => updateLessonTitle(i, e.target.value)}
                    className="flex-1 h-8 text-sm"
                  />
                  <span className="text-xs text-muted-foreground font-mono shrink-0">{lesson.youtube_id}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeLesson(i)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={() => router.back()}>ביטול</Button>
        <Button variant="outline" onClick={() => saveCourse(false)} disabled={saving} className="gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          <EyeOff className="h-4 w-4" />
          שמור כטיוטה
        </Button>
        <Button onClick={() => saveCourse(true)} disabled={saving} className="gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          <Eye className="h-4 w-4" />
          שמור ופרסם
        </Button>
      </div>
    </div>
  )
}
