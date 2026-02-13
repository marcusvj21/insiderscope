"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Volume2,
  Settings,
  Filter,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Alert {
  id: string;
  type: "whale_buy" | "whale_sell" | "price_spike" | "volume_surge" | "liquidation";
  asset: string;
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  value: number;
  timestamp: Date;
  wallet?: string;
}

async function fetchAlerts(): Promise<Alert[]> {
  // In production, this would come from on-chain monitoring
  const alerts: Alert[] = [
    {
      id: "1",
      type: "whale_buy",
      asset: "BTC",
      title: "Massive BTC Accumulation Detected",
      description: "Wallet 0x7a2...f3e bought 500 BTC in a single transaction",
      severity: "critical",
      value: 33500000,
      timestamp: new Date(Date.now() - 300000),
      wallet: "0x7a2...f3e",
    },
    {
      id: "2",
      type: "whale_sell",
      asset: "ETH",
      title: "Large ETH Transfer to Exchange",
      description: "10,000 ETH moved to Binance hot wallet - potential sell pressure",
      severity: "warning",
      value: 25000000,
      timestamp: new Date(Date.now() - 900000),
      wallet: "0x3b1...a9d",
    },
    {
      id: "3",
      type: "liquidation",
      asset: "BTC",
      title: "Large Liquidation Cascade",
      description: "$15M in long positions liquidated in the last hour",
      severity: "critical",
      value: 15000000,
      timestamp: new Date(Date.now() - 1800000),
    },
    {
      id: "4",
      type: "volume_surge",
      asset: "HYPE",
      title: "Unusual Volume Spike on HYPE",
      description: "Trading volume 400% above 24h average",
      severity: "warning",
      value: 50000000,
      timestamp: new Date(Date.now() - 2700000),
    },
    {
      id: "5",
      type: "whale_buy",
      asset: "ETH",
      title: "Smart Money Accumulating ETH",
      description: "Known profitable wallet bought 2,500 ETH at $2,480",
      severity: "info",
      value: 6200000,
      timestamp: new Date(Date.now() - 3600000),
      wallet: "0x9c4...b2e",
    },
    {
      id: "6",
      type: "price_spike",
      asset: "BTC",
      title: "BTC Price Spike +3.2% in 15 Minutes",
      description: "Rapid price movement detected, possibly news-driven",
      severity: "warning",
      value: 67500,
      timestamp: new Date(Date.now() - 4500000),
    },
    {
      id: "7",
      type: "whale_sell",
      asset: "HYPE",
      title: "Early Investor Selling HYPE",
      description: "Wallet from seed round moved 500,000 HYPE to exchange",
      severity: "critical",
      value: 12500000,
      timestamp: new Date(Date.now() - 5400000),
      wallet: "0x1d7...c8f",
    },
    {
      id: "8",
      type: "whale_buy",
      asset: "BTC",
      title: "MicroStrategy Wallet Active",
      description: "Known corporate treasury wallet showing accumulation pattern",
      severity: "info",
      value: 100000000,
      timestamp: new Date(Date.now() - 7200000),
      wallet: "bc1q...xyz",
    },
  ];

  return alerts;
}

function formatValue(value: number, type: string): string {
  if (type === "price_spike") {
    return `$${value.toLocaleString()}`;
  }
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

export default function AlertsPage() {
  const [filter, setFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const { data: alerts, isLoading } = useQuery({
    queryKey: ["alerts"],
    queryFn: fetchAlerts,
    refetchInterval: 30000,
  });

  const filteredAlerts = alerts?.filter((alert) => {
    const assetMatch = filter === "all" || alert.asset === filter;
    const severityMatch = severityFilter === "all" || alert.severity === severityFilter;
    return assetMatch && severityMatch;
  });

  const typeIcons = {
    whale_buy: <TrendingUp className="w-5 h-5" />,
    whale_sell: <TrendingDown className="w-5 h-5" />,
    price_spike: <AlertTriangle className="w-5 h-5" />,
    volume_surge: <Volume2 className="w-5 h-5" />,
    liquidation: <AlertTriangle className="w-5 h-5" />,
  };

  const severityStyles = {
    critical: {
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      icon: "text-red-400",
      badge: "bg-red-500/20 text-red-400",
    },
    warning: {
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/30",
      icon: "text-yellow-400",
      badge: "bg-yellow-500/20 text-yellow-400",
    },
    info: {
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      icon: "text-blue-400",
      badge: "bg-blue-500/20 text-blue-400",
    },
  };

  const typeLabels = {
    whale_buy: "Whale Buy",
    whale_sell: "Whale Sell",
    price_spike: "Price Spike",
    volume_surge: "Volume Surge",
    liquidation: "Liquidation",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const criticalCount = alerts?.filter((a) => a.severity === "critical").length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6 text-purple-400" />
            Whale Alerts
            {criticalCount > 0 && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 animate-pulse">
                {criticalCount} Critical
              </span>
            )}
          </h1>
          <p className="text-gray-500">Real-time whale movements and market alerts</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#12121a] border border-gray-800 text-gray-400 hover:text-white transition-colors">
          <Settings className="w-4 h-4" />
          Configure Alerts
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-500">Asset:</span>
          {["all", "BTC", "ETH", "HYPE"].map((asset) => (
            <button
              key={asset}
              onClick={() => setFilter(asset)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === asset
                  ? "bg-purple-500 text-white"
                  : "bg-[#12121a] text-gray-400 hover:text-white border border-gray-800"
              }`}
            >
              {asset === "all" ? "All" : asset}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Severity:</span>
          {["all", "critical", "warning", "info"].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                severityFilter === sev
                  ? "bg-purple-500 text-white"
                  : "bg-[#12121a] text-gray-400 hover:text-white border border-gray-800"
              }`}
            >
              {sev.charAt(0).toUpperCase() + sev.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts?.map((alert) => {
          const styles = severityStyles[alert.severity];
          return (
            <div
              key={alert.id}
              className={`${styles.bg} rounded-xl border ${styles.border} p-5 hover:scale-[1.01] transition-transform cursor-pointer`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${styles.bg} ${styles.icon}`}>
                  {typeIcons[alert.type]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles.badge}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-400">
                      {alert.asset}
                    </span>
                    <span className="text-xs text-gray-500">
                      {typeLabels[alert.type]}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-1">{alert.title}</h3>
                  <p className="text-gray-400 text-sm mb-2">{alert.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-semibold text-white">
                      {formatValue(alert.value, alert.type)}
                    </span>
                    {alert.wallet && (
                      <span className="text-gray-500">
                        Wallet: <code className="text-purple-400">{alert.wallet}</code>
                      </span>
                    )}
                    <span className="text-gray-500">
                      {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAlerts?.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No alerts matching your filters</p>
        </div>
      )}
    </div>
  );
}
