import { API_ENDPOINTS, CACHE_TTL } from "../constants";
import { withCache } from "../cache";

export interface PolymarketMarket {
  id: string;
  question: string;
  description: string;
  category: string;
  volume: number;
  liquidity: number;
  endDate: number;
  outcomes: {
    name: string;
    probability: number;
    change24h: number;
  }[];
  active: boolean;
  tags: string[];
}

export interface PolymarketTrade {
  id: string;
  marketId: string;
  side: "YES" | "NO";
  size: number;
  price: number;
  timestamp: number;
  maker: string;
  taker: string;
}

interface GammaMarket {
  id: string;
  question: string;
  description: string;
  category: string;
  volume: string;
  liquidity: string;
  endDate: string;
  outcomes: string;
  outcomePrices: string;
  active: boolean;
  tags: { label: string }[];
}

/**
 * Fetch markets from Polymarket Gamma API
 */
export async function fetchPolymarketMarkets(): Promise<PolymarketMarket[]> {
  try {
    // Fetch crypto-related markets
    const response = await fetch(
      `${API_ENDPOINTS.GAMMA_API}/markets?tag=crypto&active=true&limit=50`,
      {
        headers: {
          "Accept": "application/json",
        },
        next: { revalidate: CACHE_TTL.POLYMARKET },
      }
    );

    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status}`);
    }

    const markets: GammaMarket[] = await response.json();

    return markets.map((market): PolymarketMarket => {
      const outcomes = JSON.parse(market.outcomes || "[]");
      const outcomePrices = JSON.parse(market.outcomePrices || "[]");

      return {
        id: market.id,
        question: market.question,
        description: market.description,
        category: market.category || "Crypto",
        volume: parseFloat(market.volume) || 0,
        liquidity: parseFloat(market.liquidity) || 0,
        endDate: new Date(market.endDate).getTime(),
        outcomes: outcomes.map((name: string, i: number) => ({
          name,
          probability: parseFloat(outcomePrices[i]) || 0.5,
          change24h: 0, // Would need historical data
        })),
        active: market.active,
        tags: market.tags?.map((t) => t.label) || [],
      };
    });
  } catch (error) {
    console.error("Error fetching Polymarket markets:", error);
    return getFallbackMarkets();
  }
}

/**
 * Fetch recent trades for a market
 */
export async function fetchMarketTrades(marketId: string): Promise<PolymarketTrade[]> {
  try {
    const response = await fetch(
      `${API_ENDPOINTS.POLYMARKET}/trades?market=${marketId}&limit=50`,
      {
        headers: {
          "Accept": "application/json",
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    const trades = await response.json();
    
    return trades.map((trade: any): PolymarketTrade => ({
      id: trade.id,
      marketId: trade.market,
      side: trade.side,
      size: parseFloat(trade.size),
      price: parseFloat(trade.price),
      timestamp: new Date(trade.timestamp).getTime(),
      maker: trade.maker,
      taker: trade.taker,
    }));
  } catch (error) {
    console.error("Error fetching market trades:", error);
    return [];
  }
}

/**
 * Get crypto-related Polymarket data with whale activity
 */
export async function getPolymarketData(): Promise<{
  markets: PolymarketMarket[];
  whaleActivity: {
    market: string;
    side: string;
    amount: number;
    wallet: string;
    timestamp: number;
  }[];
}> {
  return withCache("polymarket:crypto", CACHE_TTL.POLYMARKET, async () => {
    const markets = await fetchPolymarketMarkets();

    // Filter for BTC/ETH/crypto markets
    const cryptoMarkets = markets.filter((m) => {
      const text = (m.question + m.description).toLowerCase();
      return (
        text.includes("bitcoin") ||
        text.includes("btc") ||
        text.includes("ethereum") ||
        text.includes("eth") ||
        text.includes("crypto") ||
        text.includes("sec") ||
        text.includes("etf")
      );
    });

    // Get trades for top markets by volume
    const topMarkets = cryptoMarkets
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10);

    const whaleActivity: {
      market: string;
      side: string;
      amount: number;
      wallet: string;
      timestamp: number;
    }[] = [];

    // Fetch trades for top markets and identify whale activity
    for (const market of topMarkets.slice(0, 5)) {
      const trades = await fetchMarketTrades(market.id);
      
      // Filter for whale-sized trades (>$10k)
      const whaleTrades = trades.filter((t) => t.size * t.price > 10000);
      
      whaleTrades.forEach((trade) => {
        whaleActivity.push({
          market: market.question.substring(0, 50),
          side: trade.side,
          amount: trade.size * trade.price,
          wallet: `${trade.taker.substring(0, 6)}...${trade.taker.substring(trade.taker.length - 4)}`,
          timestamp: trade.timestamp,
        });
      });
    }

    return {
      markets: cryptoMarkets,
      whaleActivity: whaleActivity
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 20),
    };
  });
}

/**
 * Fallback markets when API fails
 */
function getFallbackMarkets(): PolymarketMarket[] {
  return [
    {
      id: "fallback",
      question: "Polymarket data temporarily unavailable",
      description: "Please check back later",
      category: "System",
      volume: 0,
      liquidity: 0,
      endDate: Date.now() + 86400000,
      outcomes: [
        { name: "Yes", probability: 0.5, change24h: 0 },
        { name: "No", probability: 0.5, change24h: 0 },
      ],
      active: false,
      tags: [],
    },
  ];
}
