import { NextResponse } from "next/server";
import { getWhaleActivity } from "@/lib/services/whales";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function GET() {
  try {
    const activity = await getWhaleActivity();

    return NextResponse.json({
      success: true,
      data: activity,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Error fetching whale activity:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
