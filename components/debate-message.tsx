"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ThumbsUp, ThumbsDown, Gavel, Search, Clock, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  role: "pro" | "con" | "judge" | "system"
  content: string
  timestamp: number
  metadata?: any
}

interface DebateMessageProps {
  message: Message
  isLatest?: boolean
}

export function DebateMessage({ message, isLatest }: DebateMessageProps) {
  const getAgentConfig = (role: string) => {
    switch (role) {
      case "pro":
        return {
          name: "PRO Agent",
          icon: ThumbsUp,
          color: "bg-green-500",
          textColor: "text-green-700",
          bgColor: "bg-green-50 dark:bg-green-950/20",
          borderColor: "border-green-200 dark:border-green-800",
        }
      case "con":
        return {
          name: "CON Agent",
          icon: ThumbsDown,
          color: "bg-red-500",
          textColor: "text-red-700",
          bgColor: "bg-red-50 dark:bg-red-950/20",
          borderColor: "border-red-200 dark:border-red-800",
        }
      case "judge":
        return {
          name: "JUDGE Agent",
          icon: Gavel,
          color: "bg-purple-500",
          textColor: "text-purple-700",
          bgColor: "bg-purple-50 dark:bg-purple-950/20",
          borderColor: "border-purple-200 dark:border-purple-800",
        }
      case "system":
        return {
          name: "System",
          icon: Search,
          color: "bg-gray-500",
          textColor: "text-gray-700",
          bgColor: "bg-gray-50 dark:bg-gray-950/20",
          borderColor: "border-gray-200 dark:border-gray-800",
        }
      default:
        return {
          name: "Unknown",
          icon: MessageSquare,
          color: "bg-gray-500",
          textColor: "text-gray-700",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
        }
    }
  }

  const config = getAgentConfig(message.role)
  const Icon = config.icon

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const isResearchMessage = message.role === "system" && message.content.includes("Research")

  return (
    <Card
      className={cn(
        "transition-all duration-200",
        config.borderColor,
        isLatest && "ring-2 ring-blue-200 dark:ring-blue-800",
      )}
    >
      <CardContent className={cn("p-4", config.bgColor)}>
        <div className="flex items-start space-x-3">
          {/* Avatar */}
          <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
            <AvatarFallback className={cn("text-white", config.color)}>
              <Icon className="w-5 h-5" />
            </AvatarFallback>
          </Avatar>

          {/* Message Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <h4 className={cn("font-semibold", config.textColor)}>{config.name}</h4>
                {message.metadata?.turn && (
                  <Badge variant="outline" className="text-xs">
                    Turn {message.metadata.turn}
                  </Badge>
                )}
                {message.metadata?.agent_config && (
                  <Badge variant="secondary" className="text-xs">
                    {message.metadata.agent_config.model}
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{formatTime(message.timestamp)}</span>
              </div>
            </div>

            {/* Message Text */}
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {isResearchMessage ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                    <Search className="w-4 h-4" />
                    <span>Research Phase Completed</span>
                  </div>
                  <div className="text-sm bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 border">{message.content}</div>
                </div>
              ) : (
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
              )}
            </div>

            {/* Metadata */}
            {message.metadata && message.metadata.phase && (
              <div className="mt-2 flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {message.metadata.phase}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
