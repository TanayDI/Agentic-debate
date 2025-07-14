"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, MessageSquare } from "lucide-react"

interface DebateStatsProps {
  stats: {
    totalDebates: number
    totalTime: number
    averageDebateTime: number
    winRates: {
      pro: number
      con: number
      tie: number
    }
  }
}

export function DebateStats({ stats }: DebateStatsProps) {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Debates */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  )}