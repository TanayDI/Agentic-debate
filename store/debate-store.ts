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
  /* — runtime — */
  isDebating: boolean
  currentDebate: DebateMeta | null
  messages: DebateMessage[]
  results: ResultsType[]
  stats: {
    totalDebates: number
    totalTime: number
    averageDebateTime: number
    winRates: { pro: number; con: number; tie: number }
  }

  /* — config — */
  config: ConfigState
  updateConfig: (cfg: ConfigState) => void
  resetConfig: () => void

  /* — actions — */
  startDebate: (topic: string) => Promise<void>
  stopDebate: () => void
  resetDebate: () => void
}

const defaultConfig: ConfigState = {
  debate: { max_turns: 10, max_time: 1800, turn_timeout: 120 },
  agents: {
    pro: { model: "gemini-2.0-flash-exp", provider: "google", temperature: 0.7, max_tokens: 1000 },
    con: { model: "gemini-2.0-flash-exp", provider: "google", temperature: 0.7, max_tokens: 1000 },
    judge: { model: "gemini-2.0-flash-exp", provider: "google", temperature: 0.3, max_tokens: 1500 },
  },
  tools: { web_search: { provider: "duckduckgo", max_results: 5, timeout: 30 } },
  api_keys: {},
}

export const useDebateStore = create<DebateStore>()(
  immer((set, get) => ({
    /* — runtime — */
    isDebating: false,
    currentDebate: null,
    messages: [],
    results: [],
    stats: {
      totalDebates: 0,
      totalTime: 0,
      averageDebateTime: 0,
      winRates: { pro: 0, con: 0, tie: 0 },
    },

    /* — config — */
    config: defaultConfig,
    updateConfig: (cfg) => set({ config: cfg }),
    resetConfig: () => set({ config: defaultConfig }),

    /* — actions — */
    startDebate: async (topic: string) => {
      if (get().isDebating) return
      const startTime = Date.now()
      set((s) => {
        s.isDebating = true
        s.currentDebate = { topic, startTime }
        s.messages = []
      })

      try {
        // POST topic & config to the FastAPI backend
        const res = await fetch("/api/debate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic, ...get().config.debate }),
        })
        if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) {
          throw new Error(`Unexpected response (${res.status})`)
        }
        const data: ResultsType = await res.json()

        set((s) => {
          s.messages = (data.transcript as DebateMessage[]) || []
          s.results.push(data)
          s.stats.totalDebates += 1
          s.stats.totalTime += data.metadata.duration
          s.stats.averageDebateTime = s.stats.totalTime / s.stats.totalDebates
          const winner = data.winner.toLowerCase()
          if (winner === "pro") s.stats.winRates.pro += 1
          else if (winner === "con") s.stats.winRates.con += 1
          else s.stats.winRates.tie += 1
        })
      } catch (err) {
        console.error(err)
      } finally {
        set({ isDebating: false, currentDebate: null })
      }
    },

    stopDebate: () => set({ isDebating: false }),
    resetDebate: () => set({ messages: [], currentDebate: null, isDebating: false }),
  })),
)
