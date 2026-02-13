"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Eye,
  TrendingUp,
  TrendingDown,
  Copy,
  ExternalLink,
  Search,
  Star,
  StarOff,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface WhaleWallet {
  address: string;
  label?: string;
  totalValue: number;
  pnl24h: number;
  pnlPercent: number;
  holdings: {
    asset: string;
    amount: number;
    value: number;
  }[];
  recentActivity: {
    type: "buy" | "sell";
    asset: string;
    amount: number;
    value: number;
    timestamp: Date;
  }[];
  tags: string[];
  tracked: boolean;
}

async function fetchWhales(): Promise<WhaleWallet[]> {
  // In production, use on-chain data from Arkham, Nansen, or direct RPC
  const whales: WhaleWallet[] = [
    {
      address: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
      label: "Smart Money #1",
      totalValue: 156000000,
      pnl24h: 2400000,
      pnlPercent: 1.56,
      holdings: [
        { asset: "BTC", amount: 1500, value: 100500000 },
        { asset: "ETH", amount: 15000, value: 37500000 },
        { asset: "HYPE", amount: 500000, value: 18000000 },
      ],
      recentActivity: [
        { type: "buy", asset: "BTC", amount: 50, value: 3350000, timestamp: new Date(Date.now() - 1800000) },
        { type: "sell", asset: "ETH", amount: 1000, value: 2500000, timestamp: new Date(Date.now() - 7200000) },
      ],
      tags: ["Institution", "Long-term Holder"],
      tracked: true,
    },
    {
      address: "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD",
      label: "Whale #47",
      totalValue: 89000000,
      pnl24h: -1200000,
      pnlPercent: -1.33,
      holdings: [
        { asset: "BTC", amount: 800, value: 53600000 },
        { asset: "ETH", amount: 12000, value: 30000000 },
        { asset: "HYPE", amount: 150000, value: 5400000 },
      ],
      recentActivity: [
        { type: "sell", asset: "BTC", amount: 100, value: 6700000, timestamp: new Date(Date.now() - 3600000) },
        { type: "buy", asset: "HYPE", amount: 50000, value: 1800000, timestamp: new Date(Date.now() - 14400000) },
      ],
      tags: ["Active Trader", "Profit Taker"],
      tracked: true,
    },
    {
      address: "0x28C6c06298d514Db089934071355E5743bf21d60",
      label: "Binance Hot Wallet",
      totalValue: 2500000000,
      pnl24h: 15000000,
      pnlPercent: 0.6,
      holdings: [
        { asset: "BTC", amount: 25000, value: 1675000000 },
        { asset: "ETH", amount: 300000, value: 750000000 },
        { asset: "HYPE", amount: 2000000, value: 75000000 },
      ],
      recentActivity: [
        { type: "buy", asset: "BTC", amount: 500, value: 33500000, timestamp: new Date(Date.now() - 900000) },
        { type: "sell", asset: "ETH", amount: 5000, value: 12500000, timestamp: new Date(Date.now() - 5400000) },
      ],
      tags: ["Exchange", "High Volume"],
      tracked: false,
    },
    {
      address: "0xDef1C0ded9bec7F1a1670819833240f027b25EfF",
      label: "DeFi Power User",
      totalValue: 42000000,
      pnl24h: 800000,
      pnlPercent: 1.94,
      holdings: [
        { asset: "ETH", amount: 12000, value: 30000000 },
        { asset: "HYPE", amount: 300000, value: 12000000 },
      ],
      recentActivity: [
        { type: "buy", asset: "HYPE", amount: 100000, value: 3600000, timestamp: new Date(Date.now() - 2700000) },
      ],
      tags: ["DeFi", "Yield Farmer"],
      tracked: true,
    },
    {
      address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
      label: "Early Investor",
      totalValue: 78000000,
      pnl24h: 3100000,
      pnlPercent: 4.14,
      holdings: [
        { asset: "BTC", amount: 600, value: 40200000 },
        { asset: "ETH", amount: 8000, value: 20000000 },
        { asset: "HYPE", amount: 500000, value: 17800000 },
      ],
      recentActivity: [
        { type: "buy", asset: "BTC", amount: 100, value: 6700000, timestamp: new Date(Date.now() - 1200000) },
        { type: "buy", asset: "ETH", amount: 2000, value: 5000000, timestamp: new Date(Date.now() - 4800000) },
      ],
      tags: ["Diamond Hands", "Accumulator"],
      tracked: true,
    },
  ];

  return whales;
}

function formatValue(num: number): string {
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function WhalesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"value" | "pnl" | "activity">("value");

  const { data: whales, isLoading } = useQuery({
    queryKey: ["whales"],
    queryFn: fetchWhales,
    refetchInterval: 60000,
  });

  const filteredWhales = whales
    ?.filter(
      (whale) =>
        whale.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        whale.label?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "value") return b.totalValue - a.totalValue;
      if (sortBy === "pnl") return b.pnlPercent - a.pnlPercent;
      return (
        b.recentActivity[0]?.timestamp.getTime() -
        a.recentActivity[0]?.timestamp.getTime()
      );
    });

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
            <Eye className="w-6 h-6 text-purple-400" />
            Whale Tracker
          </h1>
          <p className="text-gray-500">Monitor the biggest wallets in crypto</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by address or label..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#12121a] border border-gray-800 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          {[
            { key: "value", label: "Total Value" },
            { key: "pnl", label: "24h PnL" },
            { key: "activity", label: "Recent Activity" },
          ].map((option) => (
            <button
              key={option.key}
              onClick={() => setSortBy(option.key as any)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                sortBy === option.key
                  ? "bg-purple-500 text-white"
                  : "bg-[#12121a] text-gray-400 hover:text-white border border-gray-800"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Whale Cards */}
      <div className="grid gap-4">
        {filteredWhales?.map((whale) => (
          <div
            key={whale.address}
            className="bg-[#12121a] rounded-xl border border-gray-800 p-6 hover:border-purple-500/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">
                      {whale.label || shortenAddress(whale.address)}
                    </h3>
                    <button className="text-gray-500 hover:text-purple-400 transition-colors">
                      {whale.tracked ? (
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ) : (
                        <StarOff className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <code>{shortenAddress(whale.address)}</code>
                    <button
                      onClick={() => navigator.clipboard.writeText(whale.address)}
                      className="hover:text-purple-400 transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <a
                      href={`https://etherscan.io/address/${whale.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-purple-400 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{formatValue(whale.totalValue)}</p>
                <p
                  className={`text-sm flex items-center justify-end gap-1 ${
                    whale.pnl24h >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {whale.pnl24h >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {whale.pnl24h >= 0 ? "+" : ""}
                  {formatValue(whale.pnl24h)} ({whale.pnlPercent.toFixed(2)}%)
                </p>
              </div>
            </div>

            {/* Tags */}
            <div className="flex gap-2 mb-4">
              {whale.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Holdings */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              {whale.holdings.map((holding) => (
                <div
                  key={holding.asset}
                  className="bg-[#0a0a0f] rounded-lg p-3"
                >
                  <p className="text-sm text-gray-500">{holding.asset}</p>
                  <p className="font-semibold">
                    {holding.amount.toLocaleString()} {holding.asset}
                  </p>
                  <p className="text-sm text-gray-400">{formatValue(holding.value)}</p>
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="border-t border-gray-800 pt-4">
              <p className="text-sm text-gray-500 mb-2">Recent Activity</p>
              <div className="flex gap-3">
                {whale.recentActivity.slice(0, 3).map((activity, i) => (
                  <div
                    key={i}
                    className={`flex-1 p-3 rounded-lg ${
                      activity.type === "buy"
                        ? "bg-green-500/10"
                        : "bg-red-500/10"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-medium ${
                          activity.type === "buy"
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {activity.type.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm font-medium">
                      {activity.amount.toLocaleString()} {activity.asset}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatValue(activity.value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
