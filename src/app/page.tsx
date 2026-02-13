"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

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
  value: number;
}

interface Sentiment {
  symbol: string;
  overall: string;
  score: number;
  summary: string;
  signals: { indicator: string; signal: string; value: number }[];
}

async function fetchDashboardData() {
  const [pricesRes, alertsRes, sentimentRes, walletsRes] = await Promise.all([
    fetch("/api/prices"),
    fetch("/api/alerts"),
    fetch("/api/sentiment"),
    fetch("/api/wallets"),
  ]);

  const prices = await pricesRes.json();
  const alerts = await alertsRes.json();
  const sentiment = await sentimentRes.json();
  const wallets = await walletsRes.json();

  return {
    prices: prices.data?.prices || [],
    funding: prices.data?.funding || {},
    alerts: alerts.data?.alerts || [],
    sentiments: sentiment.data?.assets || [],
    marketBias: sentiment.data?.marketBias || "NEUTRAL",
    walletStats: wallets.data?.stats || { total: 0 },
  };
}

function formatPrice(num: number): string {
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatVolume(num: number): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toFixed(0);
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour12: false });
}

export default function Dashboard() {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardData,
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="p-4 text-[#00ff00]">
        <pre>
{`
 ██╗███╗   ██╗███████╗██╗██████╗ ███████╗██████╗ 
 ██║████╗  ██║██╔════╝██║██╔══██╗██╔════╝██╔══██╗
 ██║██╔██╗ ██║███████╗██║██║  ██║█████╗  ██████╔╝
 ██║██║╚██╗██║╚════██║██║██║  ██║██╔══╝  ██╔══██╗
 ██║██║ ╚████║███████║██║██████╔╝███████╗██║  ██║
 ╚═╝╚═╝  ╚═══╝╚══════╝╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝
                                                  
 LOADING MARKET DATA...
 [████████████████████████████████████████] 100%
`}
        </pre>
      </div>
    );
  }

  const { prices, funding, alerts, sentiments, marketBias, walletStats } = data || {
    prices: [],
    funding: {},
    alerts: [],
    sentiments: [],
    marketBias: "NEUTRAL",
    walletStats: { total: 0 },
  };

  return (
    <div className="p-2 text-[12px]">
      {/* Ticker Tape */}
      <div className="bg-[#111] border border-[#2a2a2a] mb-2 overflow-hidden">
        <div className="flex items-center py-1 px-2 animate-pulse">
          <span className="text-[#ff3333] mr-2">●</span>
          <span className="text-[#888]">LIVE</span>
          <span className="mx-4 text-[#2a2a2a]">│</span>
          {prices.map((p: PriceData) => (
            <span key={p.symbol} className="mx-4">
              <span className="text-[#888]">{p.symbol}</span>
              <span className="mx-2">${formatPrice(p.price)}</span>
              <span className={p.change24h >= 0 ? "text-[#00ff00]" : "text-[#ff3333]"}>
                {p.change24h >= 0 ? "▲" : "▼"} {Math.abs(p.change24h).toFixed(2)}%
              </span>
            </span>
          ))}
          <span className="mx-4 text-[#2a2a2a]">│</span>
          <span className="text-[#888]">{time.toLocaleTimeString('en-US', { hour12: false })}</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-2">
        {/* Left Panel - Prices */}
        <div className="col-span-4">
          <div className="bg-[#111] border border-[#2a2a2a] h-full">
            <div className="border-b border-[#2a2a2a] px-2 py-1 text-[10px] text-[#555] uppercase tracking-wider">
              ┌─ MARKET DATA ─────────────────────┐
            </div>
            <div className="p-2">
              {prices.map((asset: PriceData) => (
                <div key={asset.symbol} className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#00ff00] font-bold">{asset.symbol}</span>
                    <span className={asset.change24h >= 0 ? "text-[#00ff00]" : "text-[#ff3333]"}>
                      {asset.change24h >= 0 ? "+" : ""}{asset.change24h.toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-2xl font-bold mb-1">
                    ${formatPrice(asset.price)}
                  </div>
                  <div className="text-[10px] text-[#555] grid grid-cols-2 gap-2">
                    <span>VOL: ${formatVolume(asset.volume24h)}</span>
                    <span>FUND: {(funding[asset.symbol] || 0).toFixed(4)}%</span>
                  </div>
                  <div className="mt-1 h-1 bg-[#1a1a1a]">
                    <div 
                      className={`h-full ${asset.change24h >= 0 ? "bg-[#00ff00]" : "bg-[#ff3333]"}`}
                      style={{ width: `${Math.min(Math.abs(asset.change24h) * 10, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Middle Panel - Sentiment */}
        <div className="col-span-4">
          <div className="bg-[#111] border border-[#2a2a2a] mb-2">
            <div className="border-b border-[#2a2a2a] px-2 py-1 text-[10px] text-[#555] uppercase tracking-wider">
              ┌─ MARKET SENTIMENT ────────────────┐
            </div>
            <div className="p-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#888]">BIAS:</span>
                <span className={`font-bold ${
                  marketBias === "BULLISH" ? "text-[#00ff00]" : 
                  marketBias === "BEARISH" ? "text-[#ff3333]" : "text-[#888]"
                }`}>
                  {marketBias}
                </span>
              </div>
              {sentiments.map((s: Sentiment) => (
                <div key={s.symbol} className="mb-2 pb-2 border-b border-[#1a1a1a] last:border-0">
                  <div className="flex items-center justify-between">
                    <span>{s.symbol}</span>
                    <span className={`text-[10px] px-2 py-0.5 ${
                      s.overall.includes("BUY") ? "bg-[#00ff00]/20 text-[#00ff00]" :
                      s.overall.includes("SELL") ? "bg-[#ff3333]/20 text-[#ff3333]" :
                      "bg-[#888]/20 text-[#888]"
                    }`}>
                      {s.overall.replace("_", " ")}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-[#1a1a1a] relative">
                      <div 
                        className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-[#555]"
                      />
                      <div 
                        className={`absolute top-0 bottom-0 ${s.score >= 0 ? "bg-[#00ff00]" : "bg-[#ff3333]"}`}
                        style={{
                          left: s.score >= 0 ? "50%" : `${50 + s.score / 2}%`,
                          width: `${Math.abs(s.score) / 2}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] w-8">{s.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-[#111] border border-[#2a2a2a]">
            <div className="border-b border-[#2a2a2a] px-2 py-1 text-[10px] text-[#555] uppercase tracking-wider">
              ┌─ SYSTEM STATUS ───────────────────┐
            </div>
            <div className="p-2 text-[11px]">
              <div className="grid grid-cols-2 gap-1">
                <span className="text-[#555]">WALLETS:</span>
                <span className="text-[#00ff00]">{walletStats.total}</span>
                <span className="text-[#555]">ALERTS:</span>
                <span className="text-[#ffcc00]">{alerts.length}</span>
                <span className="text-[#555]">API:</span>
                <span className="text-[#00ff00]">ONLINE</span>
                <span className="text-[#555]">LATENCY:</span>
                <span className="text-[#00ff00]">42ms</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Alerts */}
        <div className="col-span-4">
          <div className="bg-[#111] border border-[#2a2a2a] h-full">
            <div className="border-b border-[#2a2a2a] px-2 py-1 text-[10px] text-[#555] uppercase tracking-wider">
              ┌─ LIVE ALERTS ─────────────────────┐
            </div>
            <div className="p-2 max-h-96 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="text-[#555] text-center py-4">
                  NO ACTIVE ALERTS
                </div>
              ) : (
                alerts.slice(0, 15).map((alert: Alert) => (
                  <div 
                    key={alert.id} 
                    className={`mb-2 p-2 border-l-2 ${
                      alert.severity === "critical" ? "border-[#ff3333] bg-[#ff3333]/5" :
                      alert.severity === "warning" ? "border-[#ffcc00] bg-[#ffcc00]/5" :
                      "border-[#00ccff] bg-[#00ccff]/5"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] ${
                        alert.severity === "critical" ? "text-[#ff3333]" :
                        alert.severity === "warning" ? "text-[#ffcc00]" :
                        "text-[#00ccff]"
                      }`}>
                        [{alert.severity.toUpperCase()}]
                      </span>
                      <span className="text-[10px] text-[#555]">
                        {formatTime(alert.timestamp)}
                      </span>
                    </div>
                    <div className="text-[11px]">
                      <span className="text-[#00ff00]">{alert.asset}</span>
                      <span className="text-[#888] mx-1">│</span>
                      <span>{alert.title}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom - Command Line */}
      <div className="mt-2 bg-[#111] border border-[#2a2a2a] px-2 py-1">
        <div className="flex items-center text-[11px]">
          <span className="text-[#00ff00]">root@insiderscope</span>
          <span className="text-[#888]">:</span>
          <span className="text-[#00ccff]">~</span>
          <span className="text-[#888]">$</span>
          <span className="ml-2 text-[#555]">Ready for commands... Press F1-F5 to navigate</span>
          <span className="ml-1 animate-pulse">█</span>
        </div>
      </div>
    </div>
  );
}
