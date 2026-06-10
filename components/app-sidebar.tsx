"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  GraduationCap, LayoutDashboard, BookOpen, MessageSquare,
  LogOut, ShieldCheck, Menu,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface AppSidebarProps {
  userName: string
  isAdmin: boolean
}

const navItems = [
  { href: "/dashboard", label: "דשבורד", icon: LayoutDashboard },
  { href: "/courses", label: "קורסים", icon: BookOpen },
  { href: "/chat", label: "AI Tutor", icon: MessageSquare },
]

const adminItems = [
  { href: "/admin", label: "ניהול", icon: ShieldCheck },
]

function SidebarInner({
  userName, isAdmin, pathname, onNavigate, onLogout,
}: {
  userName: string
  isAdmin: boolean
  pathname: string
  onNavigate?: () => void
  onLogout: () => void
}) {
  return (
    <>
      <div className="flex items-center gap-2 border-b px-5 py-4 font-bold text-lg shrink-0">
        <GraduationCap className="h-5 w-5 text-primary" />
        Code Academy
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname === href || pathname.startsWith(href + "/")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}

        {isAdmin && (
          <>
            <div className="my-2 border-t" />
            {adminItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname.startsWith(href)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="border-t p-3 shrink-0">
        <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="flex-1 truncate text-sm font-medium">{userName}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 justify-start gap-3 text-muted-foreground"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4" />
            התנתק
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </>
  )
}

export function AppSidebar({ userName, isAdmin }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success("התנתקת בהצלחה")
    router.push("/")
    router.refresh()
  }

  const innerProps = { userName, isAdmin, pathname, onLogout: handleLogout }

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-60 flex-col border-l bg-card/80 backdrop-blur-xl shrink-0">
        <SidebarInner {...innerProps} />
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 inset-x-0 z-50 flex items-center justify-between h-14 px-4 border-b bg-card/90 backdrop-blur-xl">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-base">
          <GraduationCap className="h-5 w-5 text-primary" />
          Code Academy
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent transition-colors" aria-label="תפריט">
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0 bg-card/95 backdrop-blur-xl border-l" dir="rtl">
              <div className="flex h-full flex-col">
                <SidebarInner {...innerProps} onNavigate={() => setOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  )
}
