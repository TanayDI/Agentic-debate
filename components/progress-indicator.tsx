"use client"

import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Search, MessageSquare, Gavel, CheckCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProgressIndicatorProps {
  currentPhase: "research" | "debate" | "judgment" | "complete"
  progress: number
}

export function ProgressIndicator({ currentPhase, progress }: ProgressIndicatorProps) {
  const phases = [
    {
      id: "research",
      label: "Research",
      icon: Search,
      description: "Judge researching topic",
    },
    {
      id: "debate",
      label: "Debate",
      icon: MessageSquare,
      description: "Agents debating",
    },
    {
      id: "judgment",
      label: "Judgment",
      icon: Gavel,
      description: "Judge evaluating",
    },
    {
      id: "complete",
      label: "Complete",
      icon: CheckCircle,
      description: "Results ready",
    },
  ]

  const getCurrentPhaseIndex = () => {
    return phases.findIndex((phase) => phase.id === currentPhase)
  }

  const currentPhaseIndex = getCurrentPhaseIndex()

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        {phases.map((phase, index) => {
          const Icon = phase.icon
          const isActive = index === currentPhaseIndex
          const isCompleted = index < currentPhaseIndex
          const isUpcoming = index > currentPhaseIndex

          return (
            <div key={phase.id} className="flex flex-col items-center space-y-2">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200",
                  isActive && "bg-blue-500 border-blue-500 text-white",
                  isCompleted && "bg-green-500 border-green-500 text-white",
                  isUpcoming && "bg-muted border-muted-foreground/20 text-muted-foreground",
                )}
              >
                {isActive && currentPhase !== "complete" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <div className="text-center">
                <Badge variant={isActive ? "default" : isCompleted ? "secondary" : "outline"} className="text-xs">
                  {phase.label}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1 max-w-20">{phase.description}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <Progress value={progress} className="h-2" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-white mix-blend-difference">{progress.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  )
}
