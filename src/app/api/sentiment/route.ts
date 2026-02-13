import { NextResponse } from "next/server";
import { getAllSentiments } from "@/lib/services/technical-analysis";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function GET() {
  try {
    const sentiments = await getAllSentiments();

    // Calculate overall market sentiment
    const avgScore = sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length;
    
    let marketBias: string;
    if (avgScore >= 40) marketBias = "BULLISH";
    else if (avgScore <= -40) marketBias = "BEARISH";
    else marketBias = "NEUTRAL";

    return NextResponse.json({
      success: true,
      data: {
        assets: sentiments,
        marketBias,
        avgScore,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Error fetching sentiment:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
