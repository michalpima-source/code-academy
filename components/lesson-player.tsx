"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { AiTutorChat } from "@/components/ai-tutor-chat"
import { CheckCircle2, ChevronRight, MessageSquare, Play, FileText, Bookmark, BookmarkCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Lesson {
  id: string
  title: string
  description: string | null
  youtube_id: string
  duration_seconds: number | null
  order_index: number
}

interface LessonPlayerProps {
  course: { id: string; title: string }
  lessons: Lesson[]
  currentLesson: Lesson
  completedIds: string[]
  nextLesson: Lesson | null
  courseId: string
  initialNote?: string
}

type Tab = "video" | "notes" | "ai"

export function LessonPlayer({
  course,
  lessons,
  currentLesson,
  completedIds,
  nextLesson,
  courseId,
  initialNote = "",
}: LessonPlayerProps) {
  const router = useRouter()
  const supabase = createClient()
  const [completed, setCompleted] = useState(new Set(completedIds))
  const [marking, setMarking] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>("video")
  const [note, setNote] = useState(initialNote)
  const [noteSaving, setNoteSaving] = useState(false)
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isDone = completed.has(currentLesson.id)
  const progress = Math.round((completed.size / lessons.length) * 100)

  // Load note for current lesson
  useEffect(() => {
    async function loadNote() {
      const { data } = await supabase
        .from("lesson_notes")
        .select("content")
        .eq("lesson_id", currentLesson.id)
        .maybeSingle()
      setNote(data?.content ?? "")
    }
    loadNote()
  }, [currentLesson.id])

  // Auto-save note with debounce
  useEffect(() => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    if (note === initialNote) return
    setNoteSaving(true)
    saveTimeout.current = setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from("lesson_notes").upsert({
        student_id: user.id,
        lesson_id: currentLesson.id,
        content: note,
        updated_at: new Date().toISOString(),
      })
      setNoteSaving(false)
    }, 1000)
  }, [note])

  async function markComplete() {
    if (isDone) return
    setMarking(true)
    const res = await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: currentLesson.id, courseId }),
    })
    if (res.ok) {
      setCompleted((prev) => new Set([...prev, currentLesson.id]))
      toast.success("שיעור הושלם! 🎉")
      if (nextLesson) {
        setTimeout(() => router.push(`/learn/${courseId}/${nextLesson.id}`), 800)
      }
    } else {
      toast.error("שגיאה בשמירת ההתקדמות")
    }
    setMarking(false)
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "video", label: "שיעור", icon: <Play className="h-3.5 w-3.5" /> },
    { id: "notes", label: "הערות", icon: <FileText className="h-3.5 w-3.5" /> },
    { id: "ai", label: "AI Tutor", icon: <MessageSquare className="h-3.5 w-3.5" /> },
  ]

  return (
    <div className="flex h-full flex-col" dir="rtl">
      {/* Top progress bar */}
      <div className="border-b bg-card px-4 py-2 flex items-center gap-4 shrink-0">
        <Link href={`/courses/${courseId}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
          ← {course.title}
        </Link>
        <div className="flex-1 flex items-center gap-3">
          <Progress value={progress} className="h-1.5 flex-1" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">{progress}% ({completed.size}/{lessons.length})</span>
        </div>
        {isDone && <Badge variant="secondary" className="text-green-600 shrink-0 text-xs">✓ הושלם</Badge>}
      </div>

      {/* Main content: lesson sidebar + content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Lesson list sidebar */}
        <aside className="w-64 flex-shrink-0 overflow-y-auto border-l bg-card">
          <div className="p-3 border-b">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">שיעורים</p>
          </div>
          <div className="divide-y">
            {lessons.map((lesson, i) => {
              const done = completed.has(lesson.id)
              const isCurrent = lesson.id === currentLesson.id
              return (
                <Link
                  key={lesson.id}
                  href={`/learn/${courseId}/${lesson.id}`}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 text-sm transition-colors",
                    isCurrent
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-accent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs">
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : isCurrent ? (
                      <Play className="h-3 w-3 text-primary" />
                    ) : (
                      <span className="text-muted-foreground font-mono">{i + 1}</span>
                    )}
                  </div>
                  <span className={cn("truncate text-xs leading-snug", done && "line-through opacity-50")}>{lesson.title}</span>
                </Link>
              )
            })}
          </div>
        </aside>

        {/* Right panel: tabs + content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b bg-background shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}

            {/* Actions on the left */}
            <div className="mr-auto flex items-center gap-2 px-4">
              <Button size="sm" onClick={markComplete} disabled={isDone || marking} className="h-7 text-xs gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {isDone ? "הושלם" : marking ? "שומר..." : "סמן כנצפה"}
              </Button>
              {nextLesson && (
                <Link href={`/learn/${courseId}/${nextLesson.id}`}>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
                    הבא
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {/* VIDEO TAB */}
            {activeTab === "video" && (
              <div className="space-y-0">
                <div className="relative w-full bg-black" style={{ paddingTop: "56.25%" }}>
                  <iframe
                    className="absolute inset-0 h-full w-full"
                    src={`https://www.youtube.com/embed/${currentLesson.youtube_id}?rel=0&modestbranding=1`}
                    title={currentLesson.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="p-5 space-y-2">
                  <h1 className="text-lg font-bold">{currentLesson.title}</h1>
                  {currentLesson.description && (
                    <p className="text-muted-foreground text-sm leading-relaxed">{currentLesson.description}</p>
                  )}
                </div>
              </div>
            )}

            {/* NOTES TAB */}
            {activeTab === "notes" && (
              <div className="p-5 space-y-3 h-full flex flex-col">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    הערות לשיעור: {currentLesson.title}
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {noteSaving ? "שומר..." : note ? "נשמר אוטומטית ✓" : ""}
                  </span>
                </div>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={`כתוב כאן הערות, קישורים, שאלות לעצמך...\n\nדוגמה:\n• נקודה חשובה מהשיעור\n• https://לינק-מועיל.com\n• שאלה: מה ההבדל בין X ל-Y?`}
                  className="flex-1 min-h-[300px] text-sm resize-none font-mono leading-relaxed"
                  dir="auto"
                />
                <p className="text-xs text-muted-foreground">
                  הערות נשמרות אוטומטית • ניתן להדביק קישורים, קוד, כל טקסט
                </p>
              </div>
            )}

            {/* AI TUTOR TAB */}
            {activeTab === "ai" && (
              <div className="p-4 h-full flex flex-col">
                <AiTutorChat
                  lessonId={currentLesson.id}
                  courseId={courseId}
                  lessonTitle={currentLesson.title}
                  courseTitle={course.title}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
