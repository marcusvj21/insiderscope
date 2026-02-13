"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Clock,
  ExternalLink,
  Target,
  Zap,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface PolymarketBet {
  id: string;
  question: string;
  category: string;
  volume: number;
  liquidity: number;
  endDate: Date;
  outcomes: {
    name: string;
    probability: number;
    change24h: number;
  }[];
  whaleActivity: {
    wallet: string;
    side: string;
    amount: number;
    timestamp: Date;
  }[];
  trending: boolean;
}

async function fetchPolymarketData(): Promise<PolymarketBet[]> {
  // In production, use Polymarket's API or on-chain data
  const markets: PolymarketBet[] = [
    {
      id: "1",
      question: "Will BTC reach $100,000 by March 2026?",
      category: "Crypto",
      volume: 15000000,
      liquidity: 8000000,
      endDate: new Date("2026-03-31"),
      outcomes: [
        { name: "Yes", probability: 0.42, change24h: 5.2 },
        { name: "No", probability: 0.58, change24h: -5.2 },
      ],
      whaleActivity: [
        { wallet: "0x7a2...f3e", side: "Yes", amount: 250000, timestamp: new Date(Date.now() - 3600000) },
        { wallet: "0x3b1...a9d", side: "No", amount: 180000, timestamp: new Date(Date.now() - 7200000) },
      ],
      trending: true,
    },
    {
      id: "2",
      question: "Will ETH ETF be approved in Q1 2026?",
      category: "Crypto",
      volume: 8500000,
      liquidity: 4200000,
      endDate: new Date("2026-03-31"),
      outcomes: [
        { name: "Yes", probability: 0.68, change24h: 8.5 },
        { name: "No", probability: 0.32, change24h: -8.5 },
      ],
      whaleActivity: [
        { wallet: "0x9c4...b2e", side: "Yes", amount: 500000, timestamp: new Date(Date.now() - 1800000) },
      ],
      trending: true,
    },
    {
      id: "3",
      question: "Will Hyperliquid token reach top 20 by market cap?",
      category: "Crypto",
      volume: 3200000,
      liquidity: 1500000,
      endDate: new Date("2026-06-30"),
      outcomes: [
        { name: "Yes", probability: 0.35, change24h: 12.3 },
        { name: "No", probability: 0.65, change24h: -12.3 },
      ],
      whaleActivity: [
        { wallet: "0x1d7...c8f", side: "Yes", amount: 150000, timestamp: new Date(Date.now() - 5400000) },
      ],
      trending: false,
    },
    {
      id: "4",
      question: "Fed rate cut in March 2026 FOMC meeting?",
      category: "Economics",
      volume: 22000000,
      liquidity: 12000000,
      endDate: new Date("2026-03-19"),
      outcomes: [
        { name: "Yes", probability: 0.72, change24h: 3.1 },
        { name: "No", probability: 0.28, change24h: -3.1 },
      ],
      whaleActivity: [
        { wallet: "0x7a2...f3e", side: "Yes", amount: 800000, timestamp: new Date(Date.now() - 900000) },
        { wallet: "0x3b1...a9d", side: "Yes", amount: 450000, timestamp: new Date(Date.now() - 2700000) },
      ],
      trending: true,
    },
    {
      id: "5",
      question: "Will total crypto market cap exceed $5T in 2026?",
      category: "Crypto",
      volume: 12000000,
      liquidity: 6500000,
      endDate: new Date("2026-12-31"),
      outcomes: [
        { name: "Yes", probability: 0.55, change24h: 2.8 },
        { name: "No", probability: 0.45, change24h: -2.8 },
      ],
      whaleActivity: [
        { wallet: "0x9c4...b2e", side: "Yes", amount: 300000, timestamp: new Date(Date.now() - 4500000) },
      ],
      trending: false,
    },
  ];

  return markets;
}

function formatValue(num: number): string {
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(0)}K`;
  return `$${num.toFixed(0)}`;
}

export default function PolymarketPage() {
  const [category, setCategory] = useState<string>("all");

  const { data: markets, isLoading } = useQuery({
    queryKey: ["polymarket"],
    queryFn: fetchPolymarketData,
    refetchInterval: 60000,
  });

  const filteredMarkets = markets?.filter(
    (m) => category === "all" || m.category.toLowerCase() === category
  );

  const totalVolume = markets?.reduce((sum, m) => sum + m.volume, 0) || 0;
  const trendingCount = markets?.filter((m) => m.trending).length || 0;

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
            <Target className="w-6 h-6 text-purple-400" />
            Polymarket Insider
          </h1>
          <p className="text-gray-500">Track whale bets on prediction markets</p>
        </div>
        <a
          href="https://polymarket.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
        >
          Open Polymarket <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#12121a] rounded-xl border border-gray-800 p-4">
          <div className="flex items-center gap-2 text-purple-400 mb-2">
            <DollarSign className="w-5 h-5" />
            <span className="text-sm text-gray-500">Total Volume</span>
          </div>
          <p className="text-2xl font-bold">{formatValue(totalVolume)}</p>
        </div>
        <div className="bg-[#12121a] rounded-xl border border-gray-800 p-4">
          <div className="flex items-center gap-2 text-purple-400 mb-2">
            <Users className="w-5 h-5" />
            <span className="text-sm text-gray-500">Tracked Markets</span>
          </div>
          <p className="text-2xl font-bold">{markets?.length || 0}</p>
        </div>
        <div className="bg-[#12121a] rounded-xl border border-gray-800 p-4">
          <div className="flex items-center gap-2 text-purple-400 mb-2">
            <Zap className="w-5 h-5" />
            <span className="text-sm text-gray-500">Trending</span>
          </div>
          <p className="text-2xl font-bold">{trendingCount}</p>
        </div>
        <div className="bg-[#12121a] rounded-xl border border-gray-800 p-4">
          <div className="flex items-center gap-2 text-purple-400 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm text-gray-500">Whale Bets (24h)</span>
          </div>
          <p className="text-2xl font-bold">
            {markets?.reduce((sum, m) => sum + m.whaleActivity.length, 0) || 0}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["all", "crypto", "economics", "politics"].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              category === cat
                ? "bg-purple-500 text-white"
                : "bg-[#12121a] text-gray-400 hover:text-white border border-gray-800"
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Markets */}
      <div className="space-y-4">
        {filteredMarkets?.map((market) => (
          <div
            key={market.id}
            className="bg-[#12121a] rounded-xl border border-gray-800 p-6 hover:border-purple-500/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {market.trending && (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Trending
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-400">
                    {market.category}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{market.question}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {formatValue(market.volume)} volume
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Ends {format(market.endDate, "MMM d, yyyy")}
                  </span>
                </div>
              </div>
            </div>

            {/* Outcomes */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {market.outcomes.map((outcome) => {
                const isPositive = outcome.change24h >= 0;
                const isLeading = outcome.probability > 0.5;
                
                return (
                  <div
                    key={outcome.name}
                    className={`p-4 rounded-xl border ${
                      isLeading
                        ? "bg-green-500/10 border-green-500/30"
                        : "bg-red-500/10 border-red-500/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{outcome.name}</span>
                      <span
                        className={`text-sm flex items-center gap-1 ${
                          isPositive ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {isPositive ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {isPositive ? "+" : ""}
                        {outcome.change24h.toFixed(1)}%
                      </span>
                    </div>
                    <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden mb-2">
                      <div
                        className={`absolute h-full rounded-full ${
                          isLeading ? "bg-green-500" : "bg-red-500"
                        }`}
                        style={{ width: `${outcome.probability * 100}%` }}
                      />
                    </div>
                    <p className="text-2xl font-bold">
                      {(outcome.probability * 100).toFixed(0)}%
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Whale Activity */}
            {market.whaleActivity.length > 0 && (
              <div className="border-t border-gray-800 pt-4">
                <p className="text-sm text-gray-500 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Recent Whale Bets
                </p>
                <div className="flex flex-wrap gap-3">
                  {market.whaleActivity.map((activity, i) => (
                    <div
                      key={i}
                      className={`px-4 py-2 rounded-lg ${
                        activity.side === "Yes"
                          ? "bg-green-500/10 border border-green-500/30"
                          : "bg-red-500/10 border border-red-500/30"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <code className="text-gray-400">{activity.wallet}</code>
                        <span
                          className={`font-medium ${
                            activity.side === "Yes"
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {activity.side}
                        </span>
                        <span className="text-white font-semibold">
                          {formatValue(activity.amount)}
                        </span>
                        <span className="text-gray-500">
                          {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
