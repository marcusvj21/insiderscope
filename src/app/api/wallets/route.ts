import { NextResponse } from "next/server";
import { getAllWhaleWallets, getWalletStats } from "@/lib/services/wallet-scraper";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // 1 hour cache

export async function GET() {
  try {
    const [wallets, stats] = await Promise.all([
      getAllWhaleWallets(),
      getWalletStats(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        stats,
        wallets: wallets.slice(0, 100), // Return top 100 for API
        totalTracked: wallets.length,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Error fetching wallets:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
