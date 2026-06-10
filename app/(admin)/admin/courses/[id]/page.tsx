"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Plus, Trash2, Loader2, Search, GripVertical, Eye, EyeOff, ArrowRight, FileText } from "lucide-react"
import Link from "next/link"

interface Lesson {
  id?: string
  youtube_id: string
  title: string
  thumbnail?: string
  order_index: number
  isNew?: boolean
}

type Level = "beginner" | "intermediate" | "advanced"

const levelLabels: Record<Level, string> = {
  beginner: "מתחיל",
  intermediate: "בינוני",
  advanced: "מתקדם",
}

export default function EditCoursePage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [level, setLevel] = useState<Level>("beginner")
  const [published, setPublished] = useState(false)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [fetching, setFetching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fetchingTranscript, setFetchingTranscript] = useState<string | null>(null)

  async function fetchTranscript(lessonId: string, youtubeId: string) {
    setFetchingTranscript(lessonId)
    try {
      const res = await fetch("/api/youtube/transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, youtubeId }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`תמלול נשמר (${data.length} תווים)`)
      } else {
        toast.error(data.error ?? "לא נמצאו כתוביות לסרטון זה")
      }
    } catch {
      toast.error("שגיאה בשליפת תמלול")
    } finally {
      setFetchingTranscript(null)
    }
  }

  useEffect(() => {
    async function load() {
      const { data: course, error } = await supabase
        .from("courses")
        .select("*, lessons(id, title, youtube_id, order_index)")
        .eq("id", id)
        .single()

      if (error || !course) {
        toast.error("קורס לא נמצא")
        router.push("/admin/courses")
        return
      }

      setTitle(course.title)
      setDescription(course.description ?? "")
      setLevel(course.level as Level)
      setPublished(course.published)
      setLessons(
        ((course.lessons as Lesson[]) ?? []).sort((a, b) => a.order_index - b.order_index)
      )
      setLoading(false)
    }
    load()
  }, [id])

  async function fetchYoutube() {
    if (!youtubeUrl.trim()) return
    setFetching(true)
    try {
      const res = await fetch(`/api/youtube?url=${encodeURIComponent(youtubeUrl)}`)
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }

      const base = lessons.length

      if (data.type === "playlist") {
        const newLessons: Lesson[] = data.videos.map((v: { youtube_id: string; title: string }, i: number) => ({
          youtube_id: v.youtube_id,
          title: v.title,
          order_index: base + i + 1,
          isNew: true,
        }))
        setLessons((prev) => [...prev, ...newLessons])
        toast.success(`${newLessons.length} שיעורים נוספו מה-Playlist!`)
      } else {
        setLessons((prev) => [
          ...prev,
          { youtube_id: data.id, title: data.title, thumbnail: data.thumbnail, order_index: base + 1, isNew: true },
        ])
        toast.success(`"${data.title}" נוסף`)
      }
      setYoutubeUrl("")
    } catch {
      toast.error("שגיאה בשליפת הסרטון")
    } finally {
      setFetching(false)
    }
  }

  function removeLesson(idx: number) {
    setLessons((prev) =>
      prev.filter((_, i) => i !== idx).map((l, i) => ({ ...l, order_index: i + 1 }))
    )
  }

  function updateLessonTitle(idx: number, val: string) {
    setLessons((prev) => prev.map((l, i) => (i === idx ? { ...l, title: val } : l)))
  }

  async function save(publishOverride?: boolean) {
    if (!title.trim()) { toast.error("הכנס שם לקורס"); return }
    setSaving(true)

    const finalPublished = publishOverride ?? published

    const { error: courseErr } = await supabase
      .from("courses")
      .update({ title, description, level, published: finalPublished })
      .eq("id", id)

    if (courseErr) {
      toast.error("שגיאה בשמירת הקורס: " + courseErr.message)
      setSaving(false)
      return
    }

    // Upsert existing lessons (update title/order_index) and insert new ones
    const toUpsert = lessons
      .filter((l) => l.id)
      .map((l) => ({ id: l.id, course_id: id, title: l.title, youtube_id: l.youtube_id, order_index: l.order_index }))

    const toInsert = lessons
      .filter((l) => l.isNew && !l.id)
      .map((l) => ({ course_id: id, title: l.title, youtube_id: l.youtube_id, order_index: l.order_index }))

    const errors: string[] = []

    if (toUpsert.length > 0) {
      const { error } = await supabase.from("lessons").upsert(toUpsert)
      if (error) errors.push(error.message)
    }
    if (toInsert.length > 0) {
      const { error } = await supabase.from("lessons").insert(toInsert)
      if (error) errors.push(error.message)
    }

    if (errors.length > 0) {
      toast.error("שגיאה בשמירת שיעורים: " + errors.join(", "))
    } else {
      setPublished(finalPublished)
      toast.success(finalPublished ? "הקורס פורסם!" : "הקורס נשמר כטיוטה")
      // Reload to get IDs for newly inserted lessons
      router.refresh()
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="px-4 py-6 md:p-6 max-w-3xl mx-auto space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <Link href="/admin/courses">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">עריכת קורס</h1>
        <Badge variant={published ? "default" : "secondary"} className="mr-auto">
          {published ? "פורסם" : "טיוטה"}
        </Badge>
      </div>

      {/* Course details */}
      <Card>
        <CardHeader><CardTitle>פרטי הקורס</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>שם הקורס</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>תיאור</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label>רמה</Label>
            <div className="flex gap-2">
              {(Object.entries(levelLabels) as [Level, string][]).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setLevel(val)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    level === val
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-accent"
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
              placeholder="https://www.youtube.com/watch?v=... או playlist?list=..."
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
                <div
                  key={lesson.id ?? `new-${i}`}
                  className={`flex items-center gap-3 rounded-lg border p-3 ${lesson.isNew ? "border-primary/40 bg-primary/5" : ""}`}
                >
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
                  {lesson.isNew && <Badge variant="outline" className="text-xs shrink-0">חדש</Badge>}
                  {lesson.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      title="שלוף תמלול לAI"
                      disabled={fetchingTranscript === lesson.id}
                      onClick={() => fetchTranscript(lesson.id!, lesson.youtube_id)}
                    >
                      {fetchingTranscript === lesson.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <FileText className="h-3.5 w-3.5 text-blue-500" />}
                    </Button>
                  )}
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
        <Button variant="outline" onClick={() => router.push("/admin/courses")}>ביטול</Button>
        <Button variant="outline" onClick={() => save(false)} disabled={saving} className="gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          <EyeOff className="h-4 w-4" />
          שמור כטיוטה
        </Button>
        <Button onClick={() => save(true)} disabled={saving} className="gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          <Eye className="h-4 w-4" />
          {published ? "שמור ושמור פרסום" : "שמור ופרסם"}
        </Button>
      </div>
    </div>
  )
}
