import { NextResponse } from "next/server";
import { getPriceData, getFundingRates } from "@/lib/services/prices";

export const dynamic = "force-dynamic";
export const revalidate = 30;

export async function GET() {
  try {
    const [prices, funding] = await Promise.all([
      getPriceData(),
      getFundingRates(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        prices,
        funding,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    console.error("Error fetching prices:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
