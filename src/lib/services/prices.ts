import { API_ENDPOINTS, TRACKED_ASSETS, CACHE_TTL } from "../constants";
import { withCache } from "../cache";

export interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  lastUpdated: number;
}

export interface HyperliquidMeta {
  universe: { name: string; szDecimals: number }[];
}

export interface HyperliquidAssetCtx {
  dayNtlVlm: string;
  funding: string;
  openInterest: string;
  prevDayPx: string;
}

/**
 * Fetch real-time prices from Hyperliquid
 */
export async function fetchHyperliquidPrices(): Promise<Record<string, string>> {
  const response = await fetch(API_ENDPOINTS.HYPERLIQUID, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "allMids" }),
    next: { revalidate: CACHE_TTL.PRICES },
  });

  if (!response.ok) {
    throw new Error(`Hyperliquid API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch metadata and 24h stats from Hyperliquid
 */
export async function fetchHyperliquidMeta(): Promise<[HyperliquidMeta, HyperliquidAssetCtx[]]> {
  const response = await fetch(API_ENDPOINTS.HYPERLIQUID, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "metaAndAssetCtxs" }),
    next: { revalidate: CACHE_TTL.PRICES },
  });

  if (!response.ok) {
    throw new Error(`Hyperliquid meta API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Get comprehensive price data for tracked assets
 */
export async function getPriceData(): Promise<PriceData[]> {
  return withCache("prices:all", CACHE_TTL.PRICES, async () => {
    const [mids, metaAndCtx] = await Promise.all([
      fetchHyperliquidPrices(),
      fetchHyperliquidMeta(),
    ]);

    const [meta, assetCtxs] = metaAndCtx;
    const symbols = Object.keys(TRACKED_ASSETS);
    const now = Date.now();

    return symbols.map((symbol) => {
      const price = parseFloat(mids[symbol] || "0");
      const assetIndex = meta.universe.findIndex((u) => u.name === symbol);
      const ctx = assetIndex >= 0 ? assetCtxs[assetIndex] : null;

      const prevDayPx = ctx ? parseFloat(ctx.prevDayPx) : price;
      const change24h = prevDayPx > 0 ? ((price - prevDayPx) / prevDayPx) * 100 : 0;
      const volume24h = ctx ? parseFloat(ctx.dayNtlVlm) : 0;

      return {
        symbol,
        price,
        change24h,
        volume24h,
        high24h: price * 1.02, // Placeholder - would need historical data
        low24h: price * 0.98,
        lastUpdated: now,
      };
    });
  });
}

/**
 * Get funding rates (useful for sentiment analysis)
 */
export async function getFundingRates(): Promise<Record<string, number>> {
  return withCache("funding:all", CACHE_TTL.PRICES, async () => {
    const [, metaAndCtx] = await Promise.all([
      fetchHyperliquidPrices(),
      fetchHyperliquidMeta(),
    ]);

    const [meta, assetCtxs] = metaAndCtx;
    const rates: Record<string, number> = {};

    Object.keys(TRACKED_ASSETS).forEach((symbol) => {
      const assetIndex = meta.universe.findIndex((u) => u.name === symbol);
      if (assetIndex >= 0 && assetCtxs[assetIndex]) {
        rates[symbol] = parseFloat(assetCtxs[assetIndex].funding) * 100;
      }
    });

    return rates;
  });
}
