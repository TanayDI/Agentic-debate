"use client"

import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

export type DebateMessage = {
  role: "pro" | "con" | "judge" | "system"
  content: string
  timestamp: number
  metadata?: any
}

type AgentConfig = {
  model: string
  provider: string
  temperature: number
  max_tokens: number
}

type DebateConfig = {
  max_turns: number
  max_time: number
  turn_timeout: number
}

type ToolsConfig = {
  web_search: {
    provider: string
    max_results: number
    timeout: number
  }
}

type ConfigState = {
  debate: DebateConfig
  agents: {
    pro: AgentConfig
    con: AgentConfig
    judge: AgentConfig
  }
  tools: ToolsConfig
  api_keys: Record<string, string>
}

type DebateMeta = {
  topic: string
  startTime: number
}

type ResultsType = {
  topic: string
  winner: string
  reasoning: string
  score: { pro_score: number; con_score: number }
  transcript: DebateMessage[]
  metadata: any
}

interface DebateStore {
  /* — runtime — */
  isDebating: boolean
  currentDebate: DebateMeta | null
  currentPhase: string | null
  messages: DebateMessage[]
  results: ResultsType[]
  stats: {
    totalDebates: number
    totalTime: number
    averageDebateTime: number
    winRates: { pro: number; con: number; tie: number }
  }

  /* — config — */
  config: ConfigState
  updateConfig: (cfg: ConfigState) => void
  resetConfig: () => void

  /* — actions — */
  startDebate: (topic: string) => Promise<void>
  stopDebate: () => void
  resetDebate: () => void
}

const defaultConfig: ConfigState = {
  debate: { max_turns: 10, max_time: 1800, turn_timeout: 120 },
  agents: {
    pro: { model: "gemini-1.5-flash", provider: "google", temperature: 0.7, max_tokens: 1000 },
    con: { model: "gemini-1.5-flash", provider: "google", temperature: 0.7, max_tokens: 1000 },
    judge: { model: "gemini-1.5-flash", provider: "google", temperature: 0.3, max_tokens: 1500 },
  },
  tools: { web_search: { provider: "duckduckgo", max_results: 5, timeout: 30 } },
  api_keys: {},
}

export const useDebateStore = create<DebateStore>()(
  immer((set, get) => ({
    /* — runtime — */
    isDebating: false,
    currentDebate: null,
    currentPhase: null,
    messages: [],
    results: [],
    stats: {
      totalDebates: 0,
      totalTime: 0,
      averageDebateTime: 0,
      winRates: { pro: 0, con: 0, tie: 0 },
    },

    /* — config — */
    config: defaultConfig,
    updateConfig: (cfg) => set({ config: cfg }),
    resetConfig: () => set({ config: defaultConfig }),

    /* — actions — */
    startDebate: async (topic: string) => {
      if (get().isDebating) return
      const startTime = Date.now()
      set((s) => {
        s.isDebating = true
        s.currentDebate = { topic, startTime }
        s.currentPhase = "starting"
        s.messages = []
      })

      try {
        // Use Server-Sent Events for real-time streaming
        const response = await fetch("http://localhost:8000/debate/stream", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "text/event-stream"
          },
          body: JSON.stringify({ topic, ...get().config.debate }),
        })

        if (!response.ok) {
          throw new Error(`Unexpected response (${response.status})`)
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          throw new Error("No reader available")
        }

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                
                if (data.type === 'message') {
                  // Add new message in real-time
                  set((s) => {
                    s.messages.push(data.message)
                  })
                } else if (data.type === 'phase') {
                  // Update current phase
                  set((s) => {
                    s.currentPhase = data.phase
                  })
                } else if (data.type === 'complete') {
                  // Debate completed
                  set((s) => {
                    s.results.push(data.result)
                    s.stats.totalDebates += 1
                    s.stats.totalTime += data.result.metadata.duration
                    s.stats.averageDebateTime = s.stats.totalTime / s.stats.totalDebates
                    const winner = data.result.winner.toLowerCase()
                    if (winner === "pro") s.stats.winRates.pro += 1
                    else if (winner === "con") s.stats.winRates.con += 1
                    else s.stats.winRates.tie += 1
                  })
                  break
                } else if (data.type === 'error') {
                  console.error('Debate error:', data.error)
                  break
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e)
              }
            }
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        set({ isDebating: false, currentDebate: null, currentPhase: null })
      }
    },

    stopDebate: () => set({ isDebating: false }),
    resetDebate: () => set({ messages: [], currentDebate: null, isDebating: false, currentPhase: null }),
  })),
)
