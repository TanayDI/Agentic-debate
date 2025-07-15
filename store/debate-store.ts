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
  abortController: AbortController | null
  stats: {
    totalDebates: number
    totalTime: number
    averageDebateTime: number
    winRates: { pro: number; con: number; tie: number }
  }

  /* — config — */
  config: ConfigState
  isHydrated: boolean
  updateConfig: (cfg: ConfigState) => void
  resetConfig: () => void
  hydrateConfig: () => void

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

// Load configuration from localStorage
const loadConfigFromStorage = (): ConfigState => {
  if (typeof window === 'undefined') return defaultConfig
  
  try {
    const stored = localStorage.getItem('debate-config')
    if (stored) {
      const parsed = JSON.parse(stored)
      return { ...defaultConfig, ...parsed }
    }
  } catch (e) {
    console.error('Error loading config from localStorage:', e)
  }
  
  return defaultConfig
}

// Save configuration to localStorage
const saveConfigToStorage = (config: ConfigState) => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem('debate-config', JSON.stringify(config))
  } catch (e) {
    console.error('Error saving config to localStorage:', e)
  }
}

export const useDebateStore = create<DebateStore>()(
  immer((set, get) => ({
    /* — runtime — */
    isDebating: false,
    currentDebate: null,
    currentPhase: null,
    messages: [],
    results: [],
    abortController: null,
    stats: {
      totalDebates: 0,
      totalTime: 0,
      averageDebateTime: 0,
      winRates: { pro: 0, con: 0, tie: 0 },
    },

    /* — config — */
    config: defaultConfig,
    isHydrated: false,
    updateConfig: (cfg) => {
      saveConfigToStorage(cfg)
      set({ config: cfg })
    },
    resetConfig: () => {
      saveConfigToStorage(defaultConfig)
      set({ config: defaultConfig })
    },
    hydrateConfig: () => {
      const loadedConfig = loadConfigFromStorage()
      set({ config: loadedConfig, isHydrated: true })
    },

    /* — actions — */
    startDebate: async (topic: string) => {
      if (get().isDebating) return
      
      const startTime = Date.now()
      const abortController = new AbortController()
      
      set((s) => {
        s.isDebating = true
        s.currentDebate = { topic, startTime }
        s.currentPhase = "starting"
        s.messages = []
        s.abortController = abortController
      })

      try {
        // Filter out empty API keys
        const filteredApiKeys = Object.entries(get().config.api_keys)
          .filter(([_, value]) => value && value.trim() !== '')
          .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})

        // Prepare request payload with all configuration
        const requestPayload = {
          topic,
          max_turns: get().config.debate.max_turns,
          max_time: get().config.debate.max_time,
          pro_model: get().config.agents.pro.model,
          pro_provider: get().config.agents.pro.provider,
          pro_temperature: get().config.agents.pro.temperature,
          pro_max_tokens: get().config.agents.pro.max_tokens,
          con_model: get().config.agents.con.model,
          con_provider: get().config.agents.con.provider,
          con_temperature: get().config.agents.con.temperature,
          con_max_tokens: get().config.agents.con.max_tokens,
          judge_model: get().config.agents.judge.model,
          judge_provider: get().config.agents.judge.provider,
          judge_temperature: get().config.agents.judge.temperature,
          judge_max_tokens: get().config.agents.judge.max_tokens,
          tools: get().config.tools,
          api_keys: filteredApiKeys
        }

        // Use Server-Sent Events for real-time streaming
        const response = await fetch("http://localhost:8000/debate/stream", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "text/event-stream"
          },
          body: JSON.stringify(requestPayload),
          signal: abortController.signal
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          throw new Error("No reader available")
        }

        let debateComplete = false
        
        while (!debateComplete && !abortController.signal.aborted) {
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
                  debateComplete = true
                  break
                } else if (data.type === 'error') {
                  throw new Error(data.error)
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e)
              }
            }
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log('Debate was aborted')
        } else {
          console.error('Debate error:', err)
          throw err
        }
      } finally {
        set((s) => {
          s.isDebating = false
          s.currentDebate = null
          s.currentPhase = null
          s.abortController = null
        })
      }
    },

    stopDebate: () => {
      const { abortController } = get()
      if (abortController) {
        abortController.abort()
      }
      set((s) => {
        s.isDebating = false
        s.currentDebate = null
        s.currentPhase = null
        s.abortController = null
      })
    },
    resetDebate: () => set((s) => {
      s.messages = []
      s.currentDebate = null
      s.isDebating = false
      s.currentPhase = null
      s.abortController = null
    }),
  })),
)
