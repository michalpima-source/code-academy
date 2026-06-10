"use client"
import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

type Props = {
  id?: string
  className?: string
  background?: string
  particleColor?: string
  particleDensity?: number
  minSize?: number
  maxSize?: number
  speed?: number
}

export const SparklesCore = ({
  id,
  className,
  background = "transparent",
  particleColor = "#ffffff",
  particleDensity = 100,
  minSize = 0.4,
  maxSize = 1.4,
  speed = 0.6,
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animId: number

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener("resize", resize)

    type Star = { x: number; y: number; r: number; vx: number; vy: number; opacity: number; dOpacity: number }
    const stars: Star[] = []
    const count = Math.floor((canvas.width * canvas.height) / (10000 / particleDensity * 10))

    for (let i = 0; i < count; i++) {
      const r = minSize + Math.random() * (maxSize - minSize)
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r,
        vx: (Math.random() - 0.5) * speed * 0.3,
        vy: (Math.random() - 0.5) * speed * 0.3,
        opacity: Math.random(),
        dOpacity: (Math.random() * 0.01 + 0.002) * (Math.random() < 0.5 ? 1 : -1),
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (background !== "transparent") {
        ctx.fillStyle = background
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      for (const s of stars) {
        s.x += s.vx
        s.y += s.vy
        s.opacity += s.dOpacity
        if (s.opacity <= 0 || s.opacity >= 1) s.dOpacity *= -1
        if (s.x < 0) s.x = canvas.width
        if (s.x > canvas.width) s.x = 0
        if (s.y < 0) s.y = canvas.height
        if (s.y > canvas.height) s.y = 0

        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = particleColor
        ctx.globalAlpha = Math.max(0, Math.min(1, s.opacity))
        ctx.fill()
      }
      ctx.globalAlpha = 1
      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("resize", resize)
    }
  }, [background, particleColor, particleDensity, minSize, maxSize, speed])

  return (
    <canvas
      id={id}
      ref={canvasRef}
      className={cn("h-full w-full", className)}
    />
  )
}
