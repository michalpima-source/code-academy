"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { LogIn, Loader2 } from "lucide-react"

export function ImpersonateButton({ email, name }: { email: string; name: string }) {
  const [loading, setLoading] = useState(false)

  async function impersonate() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentEmail: email }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      // Open in new tab so admin session stays intact
      window.open(data.url, "_blank")
      toast.success(`נפתח טאב חדש מחובר כ-${name}`)
    } catch {
      toast.error("שגיאה ביצירת קישור")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={impersonate} disabled={loading}>
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogIn className="h-3.5 w-3.5" />}
      התחזה
    </Button>
  )
}
