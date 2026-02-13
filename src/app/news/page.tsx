"use client";

import { useQuery } from "@tanstack/react-query";
import { 
  Newspaper, 
  ExternalLink, 
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: Date;
  sentiment: "bullish" | "bearish" | "neutral";
  assets: string[];
  importance: "high" | "medium" | "low";
}

// In production, this would call a real news aggregation API
async function fetchNews(): Promise<NewsItem[]> {
  // Simulated news data - in production, use CryptoPanic, CoinTelegraph API, etc.
  const mockNews: NewsItem[] = [
    {
      id: "1",
      title: "Bitcoin ETF Sees Record $1.2B Inflows as Institutional Demand Surges",
      summary: "BlackRock's IBIT leads with $800M in single-day inflows, signaling renewed institutional confidence in Bitcoin.",
      source: "Bloomberg",
      url: "#",
      publishedAt: new Date(Date.now() - 1800000),
      sentiment: "bullish",
      assets: ["BTC"],
      importance: "high",
    },
    {
      id: "2",
      title: "Ethereum Whale Moves 50,000 ETH to Exchange - Potential Sell Pressure",
      summary: "On-chain data reveals a dormant wallet transferring significant ETH holdings to Binance hot wallet.",
      source: "Whale Alert",
      url: "#",
      publishedAt: new Date(Date.now() - 3600000),
      sentiment: "bearish",
      assets: ["ETH"],
      importance: "high",
    },
    {
      id: "3",
      title: "Hyperliquid TVL Reaches All-Time High of $2.5B",
      summary: "The perpetual DEX continues to attract traders with competitive fees and deep liquidity.",
      source: "DeFiLlama",
      url: "#",
      publishedAt: new Date(Date.now() - 7200000),
      sentiment: "bullish",
      assets: ["HYPE"],
      importance: "medium",
    },
    {
      id: "4",
      title: "Fed Minutes Signal Potential Rate Cuts in Q2 - Risk Assets Rally",
      summary: "Federal Reserve officials indicate openness to earlier rate cuts if inflation continues cooling.",
      source: "Reuters",
      url: "#",
      publishedAt: new Date(Date.now() - 10800000),
      sentiment: "bullish",
      assets: ["BTC", "ETH"],
      importance: "high",
    },
    {
      id: "5",
      title: "Major Mining Pool Shifts 15% Hashrate Away from Bitcoin",
      summary: "Analysis shows significant hashrate reallocation, possibly indicating miner capitulation.",
      source: "CoinDesk",
      url: "#",
      publishedAt: new Date(Date.now() - 14400000),
      sentiment: "bearish",
      assets: ["BTC"],
      importance: "medium",
    },
    {
      id: "6",
      title: "Ethereum Foundation Sells 100 ETH for Operational Costs",
      summary: "Routine treasury management as Foundation continues funding ecosystem development.",
      source: "EthereumFoundation",
      url: "#",
      publishedAt: new Date(Date.now() - 18000000),
      sentiment: "neutral",
      assets: ["ETH"],
      importance: "low",
    },
    {
      id: "7",
      title: "SEC Chair Hints at Spot ETH ETF Approval Timeline",
      summary: "Gary Gensler suggests regulatory clarity for Ethereum products could come within months.",
      source: "The Block",
      url: "#",
      publishedAt: new Date(Date.now() - 21600000),
      sentiment: "bullish",
      assets: ["ETH"],
      importance: "high",
    },
    {
      id: "8",
      title: "Whale Accumulation: 3 Wallets Buy $200M in BTC Over 48 Hours",
      summary: "On-chain analysis reveals coordinated accumulation pattern among institutional-sized wallets.",
      source: "Glassnode",
      url: "#",
      publishedAt: new Date(Date.now() - 25200000),
      sentiment: "bullish",
      assets: ["BTC"],
      importance: "high",
    },
  ];

  return mockNews;
}

export default function NewsPage() {
  const { data: news, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["news"],
    queryFn: fetchNews,
    refetchInterval: 60000,
  });

  const sentimentIcons = {
    bullish: <TrendingUp className="w-4 h-4" />,
    bearish: <TrendingDown className="w-4 h-4" />,
    neutral: <Minus className="w-4 h-4" />,
  };

  const sentimentColors = {
    bullish: "text-green-400 bg-green-500/10",
    bearish: "text-red-400 bg-red-500/10",
    neutral: "text-gray-400 bg-gray-500/10",
  };

  const importanceColors = {
    high: "border-l-red-500",
    medium: "border-l-yellow-500",
    low: "border-l-gray-500",
  };

  const assetFilters = ["ALL", "BTC", "ETH", "HYPE"];
  const [selectedAsset, setSelectedAsset] = useState("ALL");

  const filteredNews = news?.filter(
    (item) => selectedAsset === "ALL" || item.assets.includes(selectedAsset)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-purple-400" />
            Market News
          </h1>
          <p className="text-gray-500">Real-time news affecting your tracked assets</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {assetFilters.map((asset) => (
          <button
            key={asset}
            onClick={() => setSelectedAsset(asset)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedAsset === asset
                ? "bg-purple-500 text-white"
                : "bg-[#12121a] text-gray-400 hover:text-white border border-gray-800"
            }`}
          >
            {asset}
          </button>
        ))}
      </div>

      {/* News List */}
      <div className="space-y-4">
        {filteredNews?.map((item) => (
          <article
            key={item.id}
            className={`bg-[#12121a] rounded-xl border border-gray-800 p-5 border-l-4 ${
              importanceColors[item.importance]
            } hover:bg-[#15151f] transition-colors`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-500">{item.source}</span>
                  <span className="text-gray-700">•</span>
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(item.publishedAt, { addSuffix: true })}
                  </span>
                  <div className="flex gap-1 ml-2">
                    {item.assets.map((asset) => (
                      <span
                        key={asset}
                        className="px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-400"
                      >
                        {asset}
                      </span>
                    ))}
                  </div>
                </div>
                
                <h2 className="text-lg font-semibold mb-2 hover:text-purple-400 transition-colors cursor-pointer">
                  {item.title}
                </h2>
                
                <p className="text-gray-400 text-sm mb-3">{item.summary}</p>
                
                <div className="flex items-center gap-4">
                  <span
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                      sentimentColors[item.sentiment]
                    }`}
                  >
                    {sentimentIcons[item.sentiment]}
                    {item.sentiment.charAt(0).toUpperCase() + item.sentiment.slice(1)}
                  </span>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    Read more <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

import { useState } from "react";
