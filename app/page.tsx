"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Brain, MessageSquare, Settings, Trophy, Clock, Users, Zap } from "lucide-react"

import { DebateInterface } from "@/components/debate-interface"
import { ConfigurationPanel } from "@/components/configuration-panel"
import { ResultsViewer } from "@/components/results-viewer"
import { AgentStatus } from "@/components/agent-status"
import { DebateStats } from "@/components/debate-stats"
import { useDebateStore } from "@/store/debate-store"

export default function DebateMirrorApp() {
  const { currentDebate, isDebating, config, stats, isHydrated, hydrateConfig } = useDebateStore()

  const [activeTab, setActiveTab] = useState("debate")

  // Hydrate the config on mount
  useEffect(() => {
    if (!isHydrated) {
      hydrateConfig()
    }
  }, [isHydrated, hydrateConfig])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AgenticDebate
                </h1>
                <p className="text-sm text-muted-foreground">Multi-Agent Debate Orchestration System</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Badge variant={isDebating ? "default" : "secondary"} className="px-3 py-1">
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${isDebating ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}
                />
                {isDebating ? "Active" : "Ready"}
              </Badge>

              {currentDebate && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{Math.floor((Date.now() - currentDebate.startTime) / 1000)}s</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Agent Status */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Agents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!isHydrated ? (
                  <div className="flex items-center justify-center p-8 text-muted-foreground">
                    <div className="w-4 h-4 animate-spin border-2 border-current border-t-transparent rounded-full mr-2"></div>
                    <span>Loading agents...</span>
                  </div>
                ) : (
                  <>
                    <AgentStatus
                      agent="pro"
                      status={isDebating ? "active" : "ready"}
                      model={config.agents.pro.model}
                      provider={config.agents.pro.provider}
                    />
                    <AgentStatus
                      agent="con"
                      status={isDebating ? "active" : "ready"}
                      model={config.agents.con.model}
                      provider={config.agents.con.provider}
                    />
                    <AgentStatus
                      agent="judge"
                      status={isDebating ? "researching" : "ready"}
                      model={config.agents.judge.model}
                      provider={config.agents.judge.provider}
                    />
                  </>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <DebateStats stats={stats} />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="debate" className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>Debate</span>
                </TabsTrigger>
                <TabsTrigger value="config" className="flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Configuration</span>
                </TabsTrigger>
                <TabsTrigger value="results" className="flex items-center space-x-2">
                  <Trophy className="w-4 h-4" />
                  <span>Results</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="debate" className="space-y-4">
                <DebateInterface />
              </TabsContent>

              <TabsContent value="config" className="space-y-4">
                <ConfigurationPanel />
              </TabsContent>

              <TabsContent value="results" className="space-y-4">
                <ResultsViewer />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/50 dark:bg-slate-900/50 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span>2025 AgenticDebate</span>
              <Separator orientation="vertical" className="h-4" />
              <span>Multi-Agent AI Debate System</span>
              <Separator orientation="vertical" className="h-4" />
              <a 
                href="https://github.com/TanayDI" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                GitHub@TanayDI
              </a>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Powered by AI</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
