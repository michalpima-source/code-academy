import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  // Verify caller is admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { studentEmail } = await req.json()
  if (!studentEmail) return NextResponse.json({ error: "Missing email" }, { status: 400 })

  // Use service role to generate a magic link for the student
  const adminClient = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
  )

  const { data, error } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email: studentEmail,
  })

  if (error || !data.properties?.action_link) {
    return NextResponse.json({ error: error?.message ?? "Failed to generate link" }, { status: 500 })
  }

  return NextResponse.json({ url: data.properties.action_link })
}
