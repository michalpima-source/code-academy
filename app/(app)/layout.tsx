import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppSidebar } from "@/components/app-sidebar"
import { CourseAiPanel } from "@/components/course-ai-panel"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .single()

  return (
    <div className="flex h-screen overflow-hidden" dir="rtl">
      <AppSidebar
        userName={profile?.display_name ?? user.email ?? ""}
        isAdmin={profile?.role === "admin"}
      />
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {children}
      </main>
      <CourseAiPanel />
    </div>
  )
}
