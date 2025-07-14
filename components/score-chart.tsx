"use client"

import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface ScoreChartProps {
  proScore: number
  conScore: number
}

export function ScoreChart({ proScore, conScore }: ScoreChartProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="bg-green-500 text-white">
            PRO
          </Badge>
          <span className="font-semibold">{proScore}/100</span>
        </div>
        <Progress value={proScore} className="h-3 bg-green-100" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="bg-red-500 text-white">
            CON
          </Badge>
          <span className="font-semibold">{conScore}/100</span>
        </div>
        <Progress value={conScore} className="h-3 bg-red-100" />
      </div>
    </div>
  )
}
