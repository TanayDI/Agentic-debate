"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Play, Square, RotateCcw, MessageSquare, Brain, Clock, TrendingUp, Loader2 } from "lucide-react"

import { useDebateStore } from "@/store/debate-store"
import { DebateMessage } from "@/components/debate-message"
import { ProgressIndicator } from "@/components/progress-indicator"

export function DebateInterface() {
  const { currentDebate, isDebating, messages, stopDebate, resetDebate, config, startDebate, currentPhase, results, isHydrated, hydrateConfig } = useDebateStore()

  const [topic, setTopic] = useState("")
  const [debateError, setDebateError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Hydrate the config on mount
  useEffect(() => {
    if (!isHydrated) {
      hydrateConfig()
    }
  }, [isHydrated, hydrateConfig])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleStartDebate = async () => {
    if (!topic.trim()) return

    setDebateError(null)
    try {
      await startDebate(topic)
    } catch (err: any) {
      setDebateError(err.message || "Unknown error occurred")
      console.error('Debate error:', err)
    }
  }

  const handleStopDebate = () => {
    stopDebate()
  }

  const handleResetDebate = () => {
    resetDebate()
    setTopic("")
    setDebateError(null)
  }

  const latestResult = results[results.length - 1]
  const isCompleted = !isDebating && latestResult

  const getProgressPercentage = () => {
    if (!currentDebate || !isHydrated) return 0
    const maxTurns = config.debate.max_turns
    const currentTurn = messages.filter((m) => m.role === "pro" || m.role === "con").length
    return Math.min((currentTurn / maxTurns) * 100, 100)
  }

  const getDisplayPhase = (): "research" | "debate" | "judgment" | "complete" => {
    if (!isDebating && !currentDebate) return "complete"
    if (!currentPhase) return "research"
    
    switch (currentPhase) {
      case "research":
      case "starting":
        return "research"
      case "debate":
      case "debate_start":
        return "debate"
      case "judgment":
        return "judgment"
      default:
        return "complete"
    }
  }

  const getRemainingTime = () => {
    if (!currentDebate || !isHydrated) return 0
    const elapsed = Math.floor((Date.now() - currentDebate.startTime) / 1000)
    return Math.max(0, config.debate.max_time - elapsed)
  }

  return (
    <div className="space-y-6">
      {/* Topic Input and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Debate Topic</span>
            </div>
            {currentDebate && isHydrated && (
              <Badge variant="outline" className="text-xs">
                Turn {messages.filter((m) => m.role === "pro" || m.role === "con").length} / {config.debate.max_turns}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Enter debate topic (e.g., 'Should AI be regulated by governments?')"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isDebating}
              onKeyPress={(e) => e.key === "Enter" && handleStartDebate()}
              className="flex-1"
            />
            <Button
              onClick={handleStartDebate}
              disabled={!topic.trim() || isDebating}
              className="px-6"
            >
              {isDebating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {currentPhase ? `${currentPhase}...` : "Starting..."}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Debate
                </>
              )}
            </Button>
          </div>
          {debateError && (
            <div className="text-red-500 text-sm">{debateError}</div>
          )}

          {/* Controls */}
          {currentDebate && (
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                {isDebating ? (
                  <Button variant="outline" size="sm" onClick={handleStopDebate}>
                    <Square className="w-4 h-4 mr-2" />
                    Stop
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={handleResetDebate}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                )}
              </div>

              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>
                    {Math.floor(getRemainingTime() / 60)}:{(getRemainingTime() % 60).toString().padStart(2, "0")}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>{getProgressPercentage().toFixed(0)}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {currentDebate && (
            <div className="space-y-2">
              <Progress value={getProgressPercentage()} className="h-2" />
              <ProgressIndicator
                currentPhase={getDisplayPhase()}
                progress={getProgressPercentage()}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debate Messages */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5" />
              <span>Debate Conversation</span>
            </div>
            {currentDebate && <Badge variant="secondary">{currentDebate.topic}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px] px-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No debate in progress</h3>
                <p className="text-muted-foreground max-w-md">
                  Enter a debate topic above and click "Start Debate" to begin a structured argument between AI agents.
                </p>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                {messages.map((message, index) => (
                  <DebateMessage key={index} message={message} isLatest={index === messages.length - 1} />
                ))}
                {isCompleted && latestResult && (
                  <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
                    <CardHeader>
                      <CardTitle className="text-center">
                        🏆 Debate Results
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          Winner: {latestResult.winner}
                        </div>
                        <div className="text-sm text-gray-600 mt-2">
                          {latestResult.reasoning}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-sm text-gray-500">PRO Score</div>
                          <div className="text-lg font-semibold text-green-600">
                            {latestResult.score.pro_score || 0}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-500">CON Score</div>
                          <div className="text-lg font-semibold text-red-600">
                            {latestResult.score.con_score || 0}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-center text-sm text-gray-500">
                        Duration: {Math.round(latestResult.metadata.duration)}s | 
                        Turns: {latestResult.metadata.total_turns}
                      </div>
                    </CardContent>
                  </Card>
                )}
                {isDebating && (
                  <div className="flex items-center justify-center py-4">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Agent is thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
