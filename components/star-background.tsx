"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { SparklesCore } from "@/components/ui/sparkles"

export function StarBackground() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const isDark = resolvedTheme === "dark"

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
      {isDark ? (
        /* ── Dark mode: deep navy + sparkles ── */
        <>
          <div className="absolute inset-0 bg-[#060b1a]" />
          {/* nebula blobs */}
          <div className="absolute top-[-10%] left-[10%] h-[500px] w-[500px] rounded-full bg-indigo-900/30 blur-[120px]" />
          <div className="absolute bottom-[10%] right-[5%] h-[400px] w-[400px] rounded-full bg-violet-900/25 blur-[100px]" />
          <div className="absolute top-[40%] left-[55%] h-[300px] w-[300px] rounded-full bg-blue-900/20 blur-[80px]" />
          <SparklesCore
            id="starfield"
            background="transparent"
            minSize={0.4}
            maxSize={1.4}
            speed={0.6}
            particleDensity={90}
            particleColor="#ffffff"
            className="absolute inset-0 h-full w-full"
          />
        </>
      ) : (
        /* ── Light mode: warm off-white + subtle grid + colour blobs ── */
        <>
          {/* base: very soft warm gradient, not pure white */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #f8f6ff 0%, #f0f4ff 40%, #faf5ff 70%, #fff8f0 100%)" }} />
          {/* fine dot grid */}
          <div
            className="absolute inset-0 opacity-[0.3]"
            style={{
              backgroundImage: "radial-gradient(circle, #a5b4fc 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          {/* colour blobs */}
          <div className="absolute top-[-8%] right-[10%] h-[450px] w-[450px] rounded-full bg-indigo-200/40 blur-[110px]" />
          <div className="absolute bottom-[0%] left-[5%] h-[380px] w-[380px] rounded-full bg-violet-200/35 blur-[100px]" />
          <div className="absolute top-[35%] left-[40%] h-[280px] w-[280px] rounded-full bg-sky-200/30 blur-[80px]" />
          {/* subtle vignette to soften edges */}
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 90% 80% at 50% 50%, transparent 60%, rgba(240,244,255,0.6) 100%)" }} />
        </>
      )}
    </div>
  )
}
