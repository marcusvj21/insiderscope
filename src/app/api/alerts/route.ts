import { NextResponse } from "next/server";
import { getAllAlerts } from "@/lib/services/alerts";

export const dynamic = "force-dynamic";
export const revalidate = 30;

export async function GET() {
  try {
    const alerts = await getAllAlerts();

    const summary = {
      total: alerts.length,
      critical: alerts.filter((a) => a.severity === "critical").length,
      warning: alerts.filter((a) => a.severity === "warning").length,
      info: alerts.filter((a) => a.severity === "info").length,
    };

    return NextResponse.json({
      success: true,
      data: {
        alerts,
        summary,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
