import { GraduationCap } from "lucide-react"
import Link from "next/link"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/30 px-4">
      <Link href="/" className="mb-8 flex items-center gap-2 font-bold text-xl">
        <GraduationCap className="h-6 w-6 text-primary" />
        Code Academy
      </Link>
      {children}
    </div>
  )
}
