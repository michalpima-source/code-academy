import * as React from "react"
import Link from "next/link"
import { Play, BookOpen, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface CourseCardProps {
  id: string
  title: string
  description: string
  level: "beginner" | "intermediate" | "advanced"
  lessonCount: number
  coverImageUrl?: string
  enrolledAt?: Date | null
  progress?: number
}

const levelConfig = {
  beginner: { label: "מתחיל", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25" },
  intermediate: { label: "בינוני", className: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25" },
  advanced: { label: "מתקדם", className: "bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/25" },
}

const fallbackGradients = [
  "from-blue-600 via-indigo-500 to-violet-500",
  "from-emerald-500 via-teal-500 to-cyan-500",
  "from-orange-500 via-rose-500 to-pink-500",
  "from-indigo-600 via-blue-500 to-cyan-400",
  "from-violet-600 via-purple-500 to-fuchsia-500",
  "from-amber-500 via-orange-500 to-rose-500",
]

export function CourseCard({
  id,
  title,
  description,
  level,
  lessonCount,
  coverImageUrl,
  enrolledAt,
  progress = 0,
}: CourseCardProps) {
  const isEnrolled = !!enrolledAt
  const levelInfo = levelConfig[level]
  const gradientIndex = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % fallbackGradients.length

  return (
    <Link href={`/courses/${id}`} className="group block h-full">
      <div className="flex flex-col h-full overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/30 dark:hover:shadow-primary/10">
        {/* Cover image — fixed height */}
        <div className="relative h-48 shrink-0 overflow-hidden">
          {coverImageUrl ? (
            <img
              src={coverImageUrl}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className={cn("h-full w-full bg-gradient-to-br transition-transform duration-500 group-hover:scale-105", fallbackGradients[gradientIndex])} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          <div className="absolute top-3 start-3">
            <Badge className={cn("border text-xs font-medium backdrop-blur-sm bg-white/90 dark:bg-black/60", levelInfo.className)}>
              {levelInfo.label}
            </Badge>
          </div>

          {isEnrolled && (
            <div className="absolute bottom-3 end-3">
              <span className="rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-white">
                {progress}%
              </span>
            </div>
          )}
        </div>

        {/* Content — flex-1 so all cards stretch to same height */}
        <div className="flex flex-col flex-1 p-5 gap-3">
          {/* Title + description — flex-1 pushes footer down */}
          <div className="flex-1 space-y-1.5">
            <h3 className="font-bold text-base leading-snug group-hover:text-primary transition-colors line-clamp-2">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed min-h-[2.5rem]">
              {description || <span className="opacity-0">placeholder</span>}
            </p>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Play className="h-3 w-3" />
              {lessonCount} שיעורים
            </span>
          </div>

          {/* Progress bar — always reserve space when enrolled */}
          <div className="h-8">
            {isEnrolled && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">התקדמות</span>
                  <span className="font-semibold tabular-nums">{progress}%</span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>
            )}
          </div>

          {/* CTA button — always at bottom */}
          <Button
            size="sm"
            className="w-full gap-2"
            variant={isEnrolled ? "default" : "outline"}
          >
            {isEnrolled ? (
              <><BookOpen className="h-3.5 w-3.5" />המשך ללמוד</>
            ) : (
              <>צפה בקורס</>
            )}
          </Button>
        </div>
      </div>
    </Link>
  )
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
export function CourseCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="h-48 bg-muted animate-pulse" />
      <div className="p-5 space-y-3">
        <div className="space-y-2">
          <div className="h-4 bg-muted animate-pulse rounded-md w-3/4" />
          <div className="h-3 bg-muted animate-pulse rounded-md w-full" />
          <div className="h-3 bg-muted animate-pulse rounded-md w-2/3" />
        </div>
        <div className="h-3 bg-muted animate-pulse rounded-md w-1/4" />
        <div className="h-9 bg-muted animate-pulse rounded-lg w-full" />
      </div>
    </div>
  )
}
