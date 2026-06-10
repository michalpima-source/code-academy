"use client"

import { useState } from "react"
import Link from "next/link"
import { GraduationCap, Menu, ArrowRight } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/theme-toggle"
import { AdminNav } from "@/components/admin/admin-nav-link"

export function AdminMobileNav({ displayName }: { displayName: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden fixed top-0 inset-x-0 z-50 flex items-center justify-between h-14 px-4 border-b bg-card/90 backdrop-blur-xl">
      <div className="flex items-center gap-2 font-bold text-base">
        <GraduationCap className="h-5 w-5 text-primary" />
        ניהול
      </div>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent transition-colors" aria-label="תפריט">
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0 bg-card/95 backdrop-blur-xl border-l" dir="rtl">
            <div className="flex h-full flex-col">
              <div className="flex items-center gap-2 border-b px-5 py-4 font-bold text-lg">
                <GraduationCap className="h-5 w-5 text-primary" />
                ניהול
              </div>
              <nav className="flex flex-1 flex-col gap-1 p-3" onClick={() => setOpen(false)}>
                <AdminNav />
              </nav>
              <div className="border-t p-3 space-y-1">
                <div className="px-3 py-2 text-sm text-muted-foreground truncate">{displayName}</div>
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <ArrowRight className="h-4 w-4" />
                  חזרה לאפליקציה
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
