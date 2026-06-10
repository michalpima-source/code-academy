"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { GraduationCap, LayoutDashboard, BookOpen, MessageSquare, LogOut, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
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

export function AppSidebar({ userName, isAdmin }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success("התנתקת בהצלחה")
    router.push("/")
    router.refresh()
  }

  return (
    <aside className="flex w-60 flex-col border-l bg-card/80 backdrop-blur-xl">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b px-5 py-4 font-bold text-lg">
        <GraduationCap className="h-5 w-5 text-primary" />
        Code Academy
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
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

      {/* User */}
      <div className="border-t p-3">
        <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="flex-1 truncate text-sm font-medium">{userName}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 justify-start gap-3 text-muted-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            התנתק
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  )
}
