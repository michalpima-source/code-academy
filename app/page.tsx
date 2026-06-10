import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { CourseCard } from "@/components/course-card"
import { createClient } from "@/lib/supabase/server"
import { GraduationCap, Code2, Zap, Users, BookOpen, ArrowLeft, Sparkles } from "lucide-react"
import Link from "next/link"

export default async function Page() {
  const supabase = await createClient()
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, description, level, cover_image_url, lessons(count)")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(6)

  return (
    <div className="flex min-h-svh flex-col" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b bg-background/80 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center gap-2 font-semibold">
          <GraduationCap className="h-5 w-5 text-primary" />
          Code Academy
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="ghost" size="sm">כניסה</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">התחל בחינם</Button>
          </Link>
        </div>
      </header>

      <main>
        {/* ─── Hero ─── */}
        <section className="relative flex flex-col items-center justify-center gap-8 overflow-hidden px-6 py-32 text-center">
          {/* Grid background using borders */}
          <div
            className="absolute inset-0 -z-10 opacity-[0.4] dark:opacity-[0.15]"
            style={{
              backgroundImage:
                "linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)",
              backgroundSize: "3rem 3rem",
            }}
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-background" />
          {/* Glow blobs */}
          <div className="absolute left-1/3 top-1/4 -z-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute right-1/3 top-1/2 -z-10 h-56 w-56 rounded-full bg-violet-500/15 blur-3xl" />

          <Badge variant="secondary" className="gap-2 px-3 py-1 text-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            Now in Beta — גישה חינמית!
          </Badge>

          <div className="flex max-w-3xl flex-col gap-4">
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl leading-tight">
              ללמוד לקודד,{" "}
              <span className="bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
                לשלוח פרויקטים אמיתיים.
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-muted-foreground text-lg sm:text-xl">
              Code Academy היא פלטפורמת למידה מעשית שבה אתם בונים אפליקציות אמיתיות מהיום הראשון —
              עם AI Tutor שמכיר בדיוק איפה אתם נמצאים.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup">
              <Button size="lg" className="gap-2 px-8 text-base">
                התחל ללמוד עכשיו — בחינם
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-base">
                יש לי חשבון — כניסה
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-12">
            {[
              { value: "500+", label: "תלמידים" },
              { value: "12", label: "קורסים" },
              { value: "98%", label: "שביעות רצון" },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center">
                <span className="text-3xl font-extrabold">{value}</span>
                <span className="text-sm text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Courses ─── */}
        <section className="bg-muted/30 px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <h2 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">הקורסים שלנו</h2>
              <p className="text-muted-foreground text-lg">בחר את הנתיב שמתאים לך ותתחיל ללמוד היום</p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
              {courses?.map((course, i) => (
                <div
                  key={course.id}
                  className="animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
                >
                  <CourseCard
                    id={course.id}
                    title={course.title}
                    description={course.description ?? ""}
                    level={course.level as "beginner" | "intermediate" | "advanced"}
                    lessonCount={(course.lessons as { count: number }[])?.[0]?.count ?? 0}
                    coverImageUrl={course.cover_image_url ?? undefined}
                  />
                </div>
              ))}
              {(!courses || courses.length === 0) && (
                <div className="col-span-3 flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <Sparkles className="h-7 w-7 text-primary" />
                  </div>
                  <p className="font-semibold">קורסים חדשים בדרך!</p>
                  <p className="text-sm text-muted-foreground">הירשם עכשיו כדי לקבל עדכון ראשון</p>
                </div>
              )}
            </div>
            <div className="mt-10 text-center">
              <Link href="/courses">
                <Button variant="outline" size="lg">ראה את כל הקורסים</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ─── Why us ─── */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <h2 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">למה ללמוד אצלנו?</h2>
              <p className="text-muted-foreground text-lg">הגישה שלנו שונה — ומשתלמת</p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                {
                  icon: <Code2 className="h-7 w-7 text-blue-500" />,
                  bg: "bg-blue-500/10",
                  title: "פרויקטים אמיתיים",
                  desc: "כל קורס מסתיים בפרויקט שאפשר להציג ב-Portfolio. לא תרגילים — אפליקציות שאנשים משתמשים בהן.",
                },
                {
                  icon: <Zap className="h-7 w-7 text-yellow-500" />,
                  bg: "bg-yellow-500/10",
                  title: "AI Tutor זמין תמיד",
                  desc: "ה-AI שלנו מכיר בדיוק איזה שיעור אתה צופה ועונה בהתאם — 24/7, בלי להמתין.",
                },
                {
                  icon: <Users className="h-7 w-7 text-green-500" />,
                  bg: "bg-green-500/10",
                  title: "מורה אמיתי מאחורה",
                  desc: "הקורסים בנויים על-ידי מפתח Full Stack עם שנים של ניסיון. תוכן שמסביר ולא רק מדגים.",
                },
              ].map(({ icon, bg, title, desc }) => (
                <div key={title} className="flex flex-col gap-4 rounded-xl border bg-card p-6">
                  <div className={`w-fit rounded-lg p-3 ${bg}`}>{icon}</div>
                  <h3 className="text-xl font-semibold">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA Banner ─── */}
        <section className="bg-primary px-6 py-20 text-primary-foreground">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
            <BookOpen className="h-12 w-12 opacity-80" />
            <h2 className="text-3xl font-bold sm:text-4xl">מוכן להתחיל?</h2>
            <p className="text-primary-foreground/80 text-lg">
              הצטרף לאלפי תלמידים שכבר בונים קוד אמיתי. ללא תשלום, ללא כרטיס אשראי.
            </p>
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="px-8 text-base">
                צור חשבון חינמי עכשיו
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © 2025 Code Academy · כל הזכויות שמורות
      </footer>
    </div>
  )
}
