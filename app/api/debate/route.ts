import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { topic = "Untitled Debate" } = await req.json()

  // Redirect to actual backend API
  try {
    const response = await fetch("http://localhost:8000/debate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic }),
    })

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("Backend API error:", error)
    return NextResponse.json(
      { error: "Backend API unavailable" },
      { status: 500 }
    )
  }
}
