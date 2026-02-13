import { CACHE_TTL, TRACKED_ASSETS } from "../constants";
import { withCache } from "../cache";

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: number;
  sentiment: "bullish" | "bearish" | "neutral";
  assets: string[];
  importance: "high" | "medium" | "low";
}

interface CryptoPanicPost {
  id: number;
  title: string;
  url: string;
  source: { title: string };
  published_at: string;
  currencies?: { code: string }[];
  votes?: {
    positive: number;
    negative: number;
    important: number;
  };
}

/**
 * Fetch news from CryptoPanic API
 * Note: Requires API key for production
 */
export async function fetchCryptoPanicNews(): Promise<NewsItem[]> {
  const apiKey = process.env.CRYPTOPANIC_API_KEY;
  
  if (!apiKey) {
    console.warn("CryptoPanic API key not configured, using fallback");
    return getFallbackNews();
  }

  const currencies = Object.keys(TRACKED_ASSETS).join(",");
  const url = `https://cryptopanic.com/api/v1/posts/?auth_token=${apiKey}&currencies=${currencies}&filter=hot`;

  try {
    const response = await fetch(url, {
      next: { revalidate: CACHE_TTL.NEWS },
    });

    if (!response.ok) {
      throw new Error(`CryptoPanic API error: ${response.status}`);
    }

    const data = await response.json();
    
    return (data.results || []).map((post: CryptoPanicPost): NewsItem => {
      const votes = post.votes || { positive: 0, negative: 0, important: 0 };
      
      // Determine sentiment from votes
      let sentiment: "bullish" | "bearish" | "neutral" = "neutral";
      if (votes.positive > votes.negative * 1.5) sentiment = "bullish";
      else if (votes.negative > votes.positive * 1.5) sentiment = "bearish";

      // Determine importance
      let importance: "high" | "medium" | "low" = "low";
      if (votes.important > 10) importance = "high";
      else if (votes.important > 5) importance = "medium";

      return {
        id: post.id.toString(),
        title: post.title,
        summary: post.title, // CryptoPanic doesn't provide summaries
        source: post.source.title,
        url: post.url,
        publishedAt: new Date(post.published_at).getTime(),
        sentiment,
        assets: post.currencies?.map((c) => c.code.toUpperCase()) || [],
        importance,
      };
    });
  } catch (error) {
    console.error("Error fetching CryptoPanic news:", error);
    return getFallbackNews();
  }
}

/**
 * Fetch news by scraping RSS feeds as backup
 */
export async function fetchRSSNews(): Promise<NewsItem[]> {
  const feeds = [
    { url: "https://cointelegraph.com/rss", source: "CoinTelegraph" },
    { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", source: "CoinDesk" },
  ];

  const allNews: NewsItem[] = [];

  for (const feed of feeds) {
    try {
      const response = await fetch(feed.url, {
        next: { revalidate: CACHE_TTL.NEWS },
      });
      
      const xml = await response.text();
      const items = parseRSSItems(xml, feed.source);
      allNews.push(...items);
    } catch (error) {
      console.error(`Error fetching RSS from ${feed.source}:`, error);
    }
  }

  return allNews.sort((a, b) => b.publishedAt - a.publishedAt).slice(0, 20);
}

/**
 * Simple RSS parser
 */
function parseRSSItems(xml: string, source: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/;
  const linkRegex = /<link>(.*?)<\/link>/;
  const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/;
  const descRegex = /<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/;

  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    
    const titleMatch = titleRegex.exec(itemXml);
    const linkMatch = linkRegex.exec(itemXml);
    const pubDateMatch = pubDateRegex.exec(itemXml);
    const descMatch = descRegex.exec(itemXml);

    if (titleMatch && linkMatch) {
      const title = titleMatch[1] || titleMatch[2] || "";
      const assets = detectAssets(title);
      
      items.push({
        id: `${source}-${Date.now()}-${items.length}`,
        title: title.trim(),
        summary: (descMatch?.[1] || descMatch?.[2] || title).substring(0, 200),
        source,
        url: linkMatch[1],
        publishedAt: pubDateMatch ? new Date(pubDateMatch[1]).getTime() : Date.now(),
        sentiment: analyzeSentiment(title),
        assets,
        importance: assets.length > 0 ? "medium" : "low",
      });
    }
  }

  return items;
}

/**
 * Detect mentioned assets in text
 */
function detectAssets(text: string): string[] {
  const upperText = text.toUpperCase();
  const assets: string[] = [];
  
  if (upperText.includes("BITCOIN") || upperText.includes("BTC")) assets.push("BTC");
  if (upperText.includes("ETHEREUM") || upperText.includes("ETH")) assets.push("ETH");
  if (upperText.includes("HYPERLIQUID") || upperText.includes("HYPE")) assets.push("HYPE");
  
  return assets;
}

/**
 * Simple sentiment analysis based on keywords
 */
function analyzeSentiment(text: string): "bullish" | "bearish" | "neutral" {
  const lowerText = text.toLowerCase();
  
  const bullishWords = ["surge", "rally", "soar", "jump", "gain", "bullish", "breakout", "ath", "record", "adoption", "approval"];
  const bearishWords = ["crash", "plunge", "drop", "fall", "bearish", "dump", "sell", "liquidation", "hack", "ban", "reject"];
  
  let bullishScore = 0;
  let bearishScore = 0;
  
  bullishWords.forEach((word) => {
    if (lowerText.includes(word)) bullishScore++;
  });
  
  bearishWords.forEach((word) => {
    if (lowerText.includes(word)) bearishScore++;
  });
  
  if (bullishScore > bearishScore) return "bullish";
  if (bearishScore > bullishScore) return "bearish";
  return "neutral";
}

/**
 * Fallback news when APIs fail
 */
function getFallbackNews(): NewsItem[] {
  return [
    {
      id: "fallback-1",
      title: "News service temporarily unavailable",
      summary: "Unable to fetch live news. Please configure API keys.",
      source: "System",
      url: "#",
      publishedAt: Date.now(),
      sentiment: "neutral",
      assets: [],
      importance: "low",
    },
  ];
}

/**
 * Get aggregated news from all sources
 */
export async function getNews(): Promise<NewsItem[]> {
  return withCache("news:all", CACHE_TTL.NEWS, async () => {
    const [cryptoPanic, rss] = await Promise.allSettled([
      fetchCryptoPanicNews(),
      fetchRSSNews(),
    ]);

    const news: NewsItem[] = [];
    
    if (cryptoPanic.status === "fulfilled") {
      news.push(...cryptoPanic.value);
    }
    
    if (rss.status === "fulfilled") {
      news.push(...rss.value);
    }

    // Deduplicate by title similarity
    const seen = new Set<string>();
    const deduped = news.filter((item) => {
      const key = item.title.toLowerCase().substring(0, 50);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return deduped
      .sort((a, b) => b.publishedAt - a.publishedAt)
      .slice(0, 30);
  });
}
