"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface EnrollButtonProps {
  courseId: string
  userId?: string
}

export function EnrollButton({ courseId, userId }: EnrollButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleEnroll() {
    if (!userId) {
      router.push("/signup")
      return
    }
    setLoading(true)
    const res = await fetch("/api/enroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    })
    if (res.ok) {
      toast.success("נרשמת לקורס בהצלחה!")
      router.refresh()
    } else {
      const { error } = await res.json()
      toast.error(error ?? "שגיאה בהרשמה")
    }
    setLoading(false)
  }

  return (
    <Button size="lg" onClick={handleEnroll} disabled={loading} className="px-8">
      {loading ? "נרשם..." : userId ? "הירשם לקורס — בחינם" : "הירשם כדי להתחיל"}
    </Button>
  )
}
