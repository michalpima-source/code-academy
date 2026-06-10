"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, BookOpen } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface AdminChartsProps {
  dailyActivity: { date: string; שיעורים: number }[]
  courseStats: { name: string; תלמידים: number; שיעורים: number }[]
}

export function AdminCharts({ dailyActivity, courseStats }: AdminChartsProps) {
  const totalActivity = dailyActivity.reduce((s, d) => s + d["שיעורים"], 0)

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Daily activity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" />
            פעילות יומית — 14 ימים אחרונים
          </CardTitle>
          <p className="text-xs text-muted-foreground">{totalActivity} שיעורים הושלמו סה&quot;כ</p>
        </CardHeader>
        <CardContent className="pt-0">
          {totalActivity === 0 ? (
            <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">
              עדיין אין נתוני פעילות
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={dailyActivity} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                  interval={2}
                />
                <YAxis tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="שיעורים" fill="oklch(0.55 0.22 264)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Course enrollment */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-green-500" />
            תלמידים לפי קורס
          </CardTitle>
          <p className="text-xs text-muted-foreground">{courseStats.length} קורסים במערכת</p>
        </CardHeader>
        <CardContent className="pt-0">
          {courseStats.length === 0 ? (
            <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">
              עדיין אין קורסים
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={courseStats} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} allowDecimals={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={90}
                  tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="תלמידים" fill="oklch(0.55 0.18 150)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
