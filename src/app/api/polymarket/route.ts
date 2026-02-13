import { NextResponse } from "next/server";
import { getPolymarketData } from "@/lib/services/polymarket";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function GET() {
  try {
    const data = await getPolymarketData();

    return NextResponse.json({
      success: true,
      data: {
        markets: data.markets,
        whaleActivity: data.whaleActivity,
        marketCount: data.markets.length,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Error fetching Polymarket data:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
