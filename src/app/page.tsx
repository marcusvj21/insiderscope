"use client";

import { useQuery } from "@tanstack/react-query";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  DollarSign,
  AlertTriangle,
  Zap,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  lastUpdated: number;
}

interface Alert {
  id: string;
  type: string;
  asset: string;
  title: string;
  severity: "critical" | "warning" | "info";
  timestamp: number;
}

async function fetchDashboardData() {
  const [pricesRes, alertsRes] = await Promise.all([
    fetch("/api/prices"),
    fetch("/api/alerts"),
  ]);

  const prices = await pricesRes.json();
  const alerts = await alertsRes.json();

  return {
    prices: prices.data?.prices || [],
    funding: prices.data?.funding || {},
    alerts: alerts.data?.alerts || [],
    alertSummary: alerts.data?.summary || { total: 0, critical: 0 },
  };
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
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardData,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading market data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 text-red-400">
        <AlertTriangle className="w-6 h-6 mr-2" />
        Error loading dashboard data
      </div>
    );
  }

  const { prices, funding, alerts, alertSummary } = data || { 
    prices: [], 
    funding: {}, 
    alerts: [], 
    alertSummary: { total: 0, critical: 0 } 
  };

  const totalVolume = prices.reduce((sum: number, p: PriceData) => sum + (p.volume24h || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Market Overview</h1>
          <p className="text-gray-500">Real-time tracking of BTC, ETH, HYPE</p>
        </div>
        {alertSummary.critical > 0 && (
          <Link
            href="/alerts"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors animate-pulse"
          >
            <AlertTriangle className="w-4 h-4" />
            {alertSummary.critical} Critical Alert{alertSummary.critical > 1 ? "s" : ""}
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<DollarSign className="w-5 h-5" />}
          label="24h Volume"
          value={formatNumber(totalVolume)}
        />
        <StatCard
          icon={<Activity className="w-5 h-5" />}
          label="Active Alerts"
          value={alertSummary.total.toString()}
          highlight={alertSummary.critical > 0}
        />
        <StatCard
          icon={<Zap className="w-5 h-5" />}
          label="BTC Funding"
          value={`${(funding.BTC || 0).toFixed(4)}%`}
          trend={funding.BTC}
        />
        <StatCard
          icon={<Zap className="w-5 h-5" />}
          label="ETH Funding"
          value={`${(funding.ETH || 0).toFixed(4)}%`}
          trend={funding.ETH}
        />
      </div>

      {/* Asset Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {prices.map((asset: PriceData) => (
          <AssetCard key={asset.symbol} asset={asset} funding={funding[asset.symbol]} />
        ))}
      </div>

      {/* Recent Alerts */}
      {alerts.length > 0 && (
        <div className="bg-[#12121a] rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-purple-400" />
              Recent Alerts
            </h2>
            <Link
              href="/alerts"
              className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert: Alert) => (
              <AlertRow key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickLink href="/whales" label="Whale Tracker" description="Monitor large wallets" />
        <QuickLink href="/news" label="Market News" description="Latest crypto news" />
        <QuickLink href="/alerts" label="All Alerts" description="Price & whale alerts" />
        <QuickLink href="/polymarket" label="Polymarket" description="Prediction markets" />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  trend,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: number;
  highlight?: boolean;
}) {
  return (
    <div className={`bg-[#12121a] rounded-xl border p-4 ${highlight ? "border-red-500/50" : "border-gray-800"}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
          {icon}
        </div>
        {trend !== undefined && (
          <span className={trend >= 0 ? "text-green-400" : "text-red-400"}>
            {trend >= 0 ? "+" : ""}{trend.toFixed(4)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

function AssetCard({ asset, funding }: { asset: PriceData; funding?: number }) {
  const isPositive = asset.change24h >= 0;

  return (
    <div className="bg-[#12121a] rounded-xl border border-gray-800 p-6 hover:border-purple-500/50 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold">{asset.symbol}</h3>
          <p className="text-sm text-gray-500">
            Updated {formatDistanceToNow(asset.lastUpdated, { addSuffix: true })}
          </p>
        </div>
        <div
          className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
            isPositive
              ? "bg-green-500/20 text-green-400"
              : "bg-red-500/20 text-red-400"
          }`}
        >
          {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {isPositive ? "+" : ""}{asset.change24h.toFixed(2)}%
        </div>
      </div>

      <p className="text-4xl font-bold mb-4">{formatPrice(asset.price)}</p>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
        <div>
          <p className="text-sm text-gray-500">24h Volume</p>
          <p className="font-semibold">{formatNumber(asset.volume24h)}</p>
        </div>
        {funding !== undefined && (
          <div>
            <p className="text-sm text-gray-500">Funding Rate</p>
            <p className={`font-semibold ${funding >= 0 ? "text-green-400" : "text-red-400"}`}>
              {funding >= 0 ? "+" : ""}{funding.toFixed(4)}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function AlertRow({ alert }: { alert: Alert }) {
  const severityColors = {
    critical: "bg-red-500/10 border-red-500/30 text-red-400",
    warning: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
    info: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  };

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${severityColors[alert.severity]}`}>
      <div className="flex items-center gap-3">
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-400">
          {alert.asset}
        </span>
        <span className="font-medium">{alert.title}</span>
      </div>
      <span className="text-sm text-gray-500">
        {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
      </span>
    </div>
  );
}

function QuickLink({ href, label, description }: { href: string; label: string; description: string }) {
  return (
    <Link
      href={href}
      className="bg-[#12121a] rounded-xl border border-gray-800 p-4 hover:border-purple-500/50 hover:bg-[#15151f] transition-all group"
    >
      <h3 className="font-semibold group-hover:text-purple-400 transition-colors">{label}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </Link>
  );
}
