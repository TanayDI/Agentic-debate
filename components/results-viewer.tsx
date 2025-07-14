"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import {
  Trophy,
  BarChart3,
  FileText,
  Download,
  Share2,
  Clock,
  MessageSquare,
  TrendingUp,
  Award,
  Target,
} from "lucide-react"

import { useDebateStore } from "@/store/debate-store"
import { ScoreChart } from "@/components/score-chart"

export function ResultsViewer() {
  const { results, currentDebate, messages } = useDebateStore()
  const [selectedResult, setSelectedResult] = useState(0)

  if (!results || results.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No results yet</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Complete a debate to see detailed results, scoring, and analysis.
          </p>
        </CardContent>
      </Card>
    )
  }

  const result = results[selectedResult]

  const exportResults = () => {
    const dataStr = JSON.stringify(result, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `debate-results-${Date.now()}.json`
    link.click()
  }

  const shareResults = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Debate Results: ${result.topic}`,
          text: `Winner: ${result.winner} - ${result.reasoning}`,
          url: window.location.href,
        })
      } catch (err) {
        console.log("Error sharing:", err)
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5" />
              <span>Debate Results</span>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={shareResults}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={exportResults}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Topic */}
            <div>
              <h3 className="text-lg font-semibold mb-2">{result.topic}</h3>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>
                    {Math.floor(result.metadata.duration / 60)}m {Math.floor(result.metadata.duration % 60)}s
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageSquare className="w-4 h-4" />
                  <span>{result.metadata.total_turns} turns</span>
                </div>
              </div>
            </div>

            {/* Winner */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">Winner: {result.winner} Agent</h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Score: {result.score[`${result.winner.toLowerCase()}_score`]}/100
                  </p>
                </div>
              </div>
              <Badge
                variant="secondary"
                className="bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200"
              >
                Victory
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results */}
      <Tabs defaultValue="analysis" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="scoring">Scoring</TabsTrigger>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
        </TabsList>

        {/* Analysis */}
        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>Judge's Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="text-sm leading-relaxed">{result.reasoning}</p>
              </div>

              {result.metadata.analysis && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {/* PRO Analysis */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base text-green-700 dark:text-green-300">PRO Agent Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <h5 className="font-medium text-sm mb-2">Strengths</h5>
                        <ul className="text-sm space-y-1">
                          {result.metadata.analysis.pro_strengths?.map((strength, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-green-500 mt-1">•</span>
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium text-sm mb-2">Weaknesses</h5>
                        <ul className="text-sm space-y-1">
                          {result.metadata.analysis.pro_weaknesses?.map((weakness, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-red-500 mt-1">•</span>
                              <span>{weakness}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  {/* CON Analysis */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base text-red-700 dark:text-red-300">CON Agent Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <h5 className="font-medium text-sm mb-2">Strengths</h5>
                        <ul className="text-sm space-y-1">
                          {result.metadata.analysis.con_strengths?.map((strength, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-green-500 mt-1">•</span>
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium text-sm mb-2">Weaknesses</h5>
                        <ul className="text-sm space-y-1">
                          {result.metadata.analysis.con_weaknesses?.map((weakness, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-red-500 mt-1">•</span>
                              <span>{weakness}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scoring */}
        <TabsContent value="scoring" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Score Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Final Scores</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">PRO Agent</span>
                      <span className="text-sm font-bold">{result.score.pro_score}/100</span>
                    </div>
                    <Progress value={result.score.pro_score} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-red-700 dark:text-red-300">CON Agent</span>
                      <span className="text-sm font-bold">{result.score.con_score}/100</span>
                    </div>
                    <Progress value={result.score.con_score} className="h-2" />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Score Difference</span>
                    <span className="text-sm font-bold">
                      {Math.abs(result.score.pro_score - result.score.con_score)} points
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Score Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Score Visualization</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScoreChart proScore={result.score.pro_score} conScore={result.score.con_score} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Transcript */}
        <TabsContent value="transcript" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Full Transcript</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px] px-6">
                <div className="space-y-4 py-4">
                  {result.transcript.map((message, index) => (
                    <div key={index} className="border-l-2 border-muted pl-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="capitalize">
                          {message.role}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
