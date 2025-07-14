"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ThumbsUp, ThumbsDown, Gavel, Brain, Zap, Clock, CheckCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface AgentStatusProps {
  agent: "pro" | "con" | "judge"
  status: "ready" | "active" | "thinking" | "researching" | "complete"
  model: string
  provider: string
}

export function AgentStatus({ agent, status, model, provider }: AgentStatusProps) {
  const getAgentConfig = (agent: string) => {
    switch (agent) {
      case "pro":
        return {
          name: "PRO Agent",
          icon: ThumbsUp,
          color: "bg-green-500",
          description: "Argues in favor",
        }
      case "con":
        return {
          name: "CON Agent",
          icon: ThumbsDown,
          color: "bg-red-500",
          description: "Argues against",
        }
      case "judge":
        return {
          name: "JUDGE Agent",
          icon: Gavel,
          color: "bg-purple-500",
          description: "Research & evaluation",
        }
      default:
        return {
          name: "Unknown",
          icon: Brain,
          color: "bg-gray-500",
          description: "Unknown role",
        }
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "ready":
        return {
          label: "Ready",
          icon: CheckCircle,
          color: "text-gray-500",
          bgColor: "bg-gray-100 dark:bg-gray-800",
        }
      case "active":
        return {
          label: "Active",
          icon: Zap,
          color: "text-green-500",
          bgColor: "bg-green-100 dark:bg-green-900/20",
        }
      case "thinking":
        return {
          label: "Thinking",
          icon: Loader2,
          color: "text-blue-500",
          bgColor: "bg-blue-100 dark:bg-blue-900/20",
          animate: true,
        }
      case "researching":
        return {
          label: "Researching",
          icon: Loader2,
          color: "text-purple-500",
          bgColor: "bg-purple-100 dark:bg-purple-900/20",
          animate: true,
        }
      case "complete":
        return {
          label: "Complete",
          icon: CheckCircle,
          color: "text-green-500",
          bgColor: "bg-green-100 dark:bg-green-900/20",
        }
      default:
        return {
          label: "Unknown",
          icon: Clock,
          color: "text-gray-500",
          bgColor: "bg-gray-100",
        }
    }
  }

  const agentConfig = getAgentConfig(agent)
  const statusConfig = getStatusConfig(status)
  const AgentIcon = agentConfig.icon
  const StatusIcon = statusConfig.icon

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          {/* Agent Avatar */}
          <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
            <AvatarFallback className={cn("text-white", agentConfig.color)}>
              <AgentIcon className="w-5 h-5" />
            </AvatarFallback>
          </Avatar>

          {/* Agent Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-sm truncate">{agentConfig.name}</h4>
              <Badge variant="secondary" className={cn("text-xs px-2 py-1", statusConfig.bgColor, statusConfig.color)}>
                <StatusIcon className={cn("w-3 h-3 mr-1", statusConfig.animate && "animate-spin")} />
                {statusConfig.label}
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground mb-2">{agentConfig.description}</p>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Model:</span>
                <span className="font-mono bg-muted px-1 py-0.5 rounded text-xs">{model}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Provider:</span>
                <span className="capitalize font-medium">{provider}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
