"use client";

import { useQuery } from "@tanstack/react-query";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  DollarSign,
  Users,
  AlertTriangle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AssetData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  whaleActivity: "high" | "medium" | "low";
  recentTrades: {
    type: "buy" | "sell";
    amount: number;
    usdValue: number;
    time: Date;
    wallet: string;
  }[];
}

// Fetch real price data from Hyperliquid
async function fetchAssetData(): Promise<AssetData[]> {
  try {
    const response = await fetch("https://api.hyperliquid.xyz/info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "allMids" }),
    });
    const mids = await response.json();
    
    // Get 24h stats
    const statsResponse = await fetch("https://api.hyperliquid.xyz/info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "metaAndAssetCtxs" }),
    });
    const statsData = await statsResponse.json();
    
    const assets = [
      { symbol: "BTC", name: "Bitcoin" },
      { symbol: "ETH", name: "Ethereum" },
      { symbol: "HYPE", name: "Hyperliquid" },
    ];
    
    return assets.map((asset) => {
      const price = parseFloat(mids[asset.symbol] || "0");
      const assetCtx = statsData[1]?.find((ctx: any) => 
        statsData[0]?.universe?.find((u: any, i: number) => 
          u.name === asset.symbol && i === statsData[1].indexOf(ctx)
        )
      );
      
      const change24h = assetCtx?.dayNtlVlm 
        ? (Math.random() - 0.5) * 10 // Placeholder - would need historical data
        : (Math.random() - 0.5) * 10;
      
      return {
        symbol: asset.symbol,
        name: asset.name,
        price,
        change24h,
        volume24h: Math.random() * 1000000000,
        whaleActivity: Math.random() > 0.6 ? "high" : Math.random() > 0.3 ? "medium" : "low",
        recentTrades: generateMockTrades(asset.symbol, price),
      };
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}

function generateMockTrades(symbol: string, price: number) {
  const trades = [];
  for (let i = 0; i < 5; i++) {
    const isBuy = Math.random() > 0.5;
    const amount = Math.random() * (symbol === "BTC" ? 100 : symbol === "ETH" ? 1000 : 50000);
    trades.push({
      type: isBuy ? "buy" : "sell" as "buy" | "sell",
      amount,
      usdValue: amount * price,
      time: new Date(Date.now() - Math.random() * 3600000),
      wallet: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
    });
  }
  return trades.sort((a, b) => b.time.getTime() - a.time.getTime());
}

function formatNumber(num: number, decimals = 2): string {
  if (num >= 1e9) return `$${(num / 1e9).toFixed(decimals)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(decimals)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(decimals)}K`;
  return `$${num.toFixed(decimals)}`;
}

function formatPrice(num: number): string {
  if (num >= 1000) return `$${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (num >= 1) return `$${num.toFixed(2)}`;
  return `$${num.toFixed(4)}`;
}

export default function Dashboard() {
  const { data: assets, isLoading, error } = useQuery({
    queryKey: ["assets"],
    queryFn: fetchAssetData,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error || !assets) {
    return (
      <div className="flex items-center justify-center h-96 text-red-400">
        <AlertTriangle className="w-6 h-6 mr-2" />
        Error loading data
      </div>
    );
  }

  const totalVolume = assets.reduce((sum, a) => sum + a.volume24h, 0);
  const highActivityCount = assets.filter((a) => a.whaleActivity === "high").length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<DollarSign className="w-5 h-5" />}
          label="24h Volume"
          value={formatNumber(totalVolume)}
          trend={12.5}
        />
        <StatCard
          icon={<Activity className="w-5 h-5" />}
          label="Active Whales"
          value="127"
          trend={5.2}
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Tracked Wallets"
          value="2,847"
          trend={2.1}
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="High Activity Assets"
          value={highActivityCount.toString()}
          trend={highActivityCount > 1 ? 50 : -25}
        />
      </div>

      {/* Asset Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {assets.map((asset) => (
          <AssetCard key={asset.symbol} asset={asset} />
        ))}
      </div>

      {/* Recent Large Trades */}
      <div className="bg-[#12121a] rounded-xl border border-gray-800 p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-400" />
          Recent Large Trades
        </h2>
        <div className="space-y-3">
          {assets
            .flatMap((a) =>
              a.recentTrades.map((t) => ({ ...t, symbol: a.symbol }))
            )
            .sort((a, b) => b.usdValue - a.usdValue)
            .slice(0, 10)
            .map((trade, i) => (
              <TradeRow key={i} trade={trade} />
            ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: number;
}) {
  const isPositive = trend >= 0;
  
  return (
    <div className="bg-[#12121a] rounded-xl border border-gray-800 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
          {icon}
        </div>
        <div
          className={`flex items-center text-sm ${
            isPositive ? "text-green-400" : "text-red-400"
          }`}
        >
          {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
          {Math.abs(trend).toFixed(1)}%
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

function AssetCard({ asset }: { asset: AssetData }) {
  const isPositive = asset.change24h >= 0;
  const activityColors = {
    high: "bg-red-500/20 text-red-400 border-red-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    low: "bg-green-500/20 text-green-400 border-green-500/30",
  };

  return (
    <div className="bg-[#12121a] rounded-xl border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold">{asset.symbol}</h3>
          <p className="text-sm text-gray-500">{asset.name}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium border ${
            activityColors[asset.whaleActivity]
          }`}
        >
          {asset.whaleActivity.toUpperCase()} ACTIVITY
        </span>
      </div>

      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="text-3xl font-bold">{formatPrice(asset.price)}</p>
          <p
            className={`text-sm flex items-center ${
              isPositive ? "text-green-400" : "text-red-400"
            }`}
          >
            {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            {isPositive ? "+" : ""}
            {asset.change24h.toFixed(2)}%
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">24h Volume</p>
          <p className="font-semibold">{formatNumber(asset.volume24h)}</p>
        </div>
      </div>

      <div className="border-t border-gray-800 pt-4">
        <p className="text-sm text-gray-500 mb-2">Recent Whale Trades</p>
        <div className="space-y-2">
          {asset.recentTrades.slice(0, 3).map((trade, i) => (
            <div
              key={i}
              className={`flex items-center justify-between text-sm p-2 rounded-lg ${
                trade.type === "buy"
                  ? "bg-green-500/10"
                  : "bg-red-500/10"
              }`}
            >
              <span
                className={
                  trade.type === "buy" ? "text-green-400" : "text-red-400"
                }
              >
                {trade.type.toUpperCase()}
              </span>
              <span className="text-gray-400">
                {trade.amount.toFixed(2)} {asset.symbol}
              </span>
              <span className="font-medium">{formatNumber(trade.usdValue)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TradeRow({
  trade,
}: {
  trade: {
    type: "buy" | "sell";
    amount: number;
    usdValue: number;
    time: Date;
    wallet: string;
    symbol: string;
  };
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-[#0a0a0f] hover:bg-[#15151f] transition-colors">
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-lg ${
            trade.type === "buy"
              ? "bg-green-500/20 text-green-400"
              : "bg-red-500/20 text-red-400"
          }`}
        >
          {trade.type === "buy" ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
        </div>
        <div>
          <p className="font-medium">
            {trade.type === "buy" ? "Bought" : "Sold"} {trade.amount.toFixed(2)}{" "}
            {trade.symbol}
          </p>
          <p className="text-sm text-gray-500">{trade.wallet}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold">{formatNumber(trade.usdValue)}</p>
        <p className="text-sm text-gray-500">
          {formatDistanceToNow(trade.time, { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}
