"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AiTutorChat } from "@/components/ai-tutor-chat"
import { Sparkles, X, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

interface CourseAiPanelProps {
  courseId?: string
  courseTitle?: string
}

export function CourseAiPanel({ courseId, courseTitle }: CourseAiPanelProps = {}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-6 end-6 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl",
          open && "opacity-0 pointer-events-none scale-90"
        )}
      >
        <Sparkles className="h-4 w-4" />
        <span className="text-sm font-medium">שאל את ה-AI</span>
      </button>

      {/* Panel */}
      <div
        className={cn(
          "fixed bottom-0 start-0 end-0 z-50 transition-all duration-300 ease-out md:bottom-6 md:end-6 md:start-auto md:w-[420px]",
          open ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"
        )}
      >
        <div className="rounded-t-2xl md:rounded-2xl border bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">AI Tutor</p>
                <p className="text-xs text-muted-foreground truncate max-w-[220px]">{courseTitle}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-3">
            <AiTutorChat courseId={courseId} courseTitle={courseTitle} />
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  )
}
