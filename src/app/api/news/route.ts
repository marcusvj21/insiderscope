import { NextResponse } from "next/server";
import { getNews } from "@/lib/services/news";

export const dynamic = "force-dynamic";
export const revalidate = 180;

export async function GET() {
  try {
    const news = await getNews();

    return NextResponse.json({
      success: true,
      data: news,
      count: news.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
