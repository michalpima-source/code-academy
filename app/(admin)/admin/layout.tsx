import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { GraduationCap, ArrowRight } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { AdminNav } from "@/components/admin/admin-nav-link"
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") redirect("/dashboard")

  const displayName = profile?.display_name ?? user.email ?? ""

  return (
    <div className="flex h-screen overflow-hidden" dir="rtl">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-l bg-card/80 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-2 border-b px-5 py-4 font-bold text-lg">
          <GraduationCap className="h-5 w-5 text-primary" />
          ניהול
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          <AdminNav />
        </nav>
        <div className="border-t p-3 space-y-1">
          <div className="px-3 py-2 text-sm text-muted-foreground truncate">{displayName}</div>
          <div className="flex items-center gap-1">
            <Link
              href="/dashboard"
              className="flex flex-1 items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <ArrowRight className="h-4 w-4" />
              חזרה לאפליקציה
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <AdminMobileNav displayName={displayName} />

      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">{children}</main>
    </div>
  )
}
