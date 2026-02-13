import { NextResponse } from "next/server";
import { getInsiderSignals } from "@/lib/services/smart-money";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function GET() {
  try {
    const data = await getInsiderSignals();

    return NextResponse.json({
      success: true,
      data,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Error fetching smart money data:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
