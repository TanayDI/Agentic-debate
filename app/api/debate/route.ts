import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { topic = "Untitled Debate" } = await req.json()

  // A tiny demo payload so the UI can render something useful
  const now = Date.now()
  const demoResult = {
    topic,
    winner: Math.random() > 0.5 ? "PRO" : "CON",
    reasoning: "This is a mock response so you can preview the UI without a backend.",
    score: { pro_score: 72, con_score: 65 },
    transcript: [
      {
        role: "pro",
        content: `Opening argument in favor of “${topic}”.`,
        timestamp: now,
        metadata: { turn: 1 },
      },
      {
        role: "con",
        content: `Opening rebuttal against “${topic}”.`,
        timestamp: now + 1000,
        metadata: { turn: 2 },
      },
    ],
    metadata: {
      duration: 8,
      total_turns: 2,
      analysis: {
        pro_strengths: ["Clear introduction"],
        pro_weaknesses: ["Needs more evidence"],
        con_strengths: ["Identified key flaw"],
        con_weaknesses: ["Lacked citations"],
      },
    },
  }

  return NextResponse.json(demoResult, { status: 200 })
}
