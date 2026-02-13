"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

interface Market {
  id: string;
  question: string;
  volume: number;
  liquidity: number;
  endDate: number;
  outcomes: { name: string; probability: number }[];
  category: string;
}

interface Trade {
  market: string;
  side: string;
  amount: number;
  wallet: string;
  timestamp: number;
}

async function fetchPolymarketData() {
  const res = await fetch("/api/polymarket");
  const data = await res.json();
  return {
    markets: data.data?.markets || [],
    whaleActivity: data.data?.whaleActivity || [],
  };
}

function formatVolume(num: number): string {
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(0)}K`;
  return `$${num.toFixed(0)}`;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function PolymarketPage() {
  const [time, setTime] = useState(new Date());
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["polymarket"],
    queryFn: fetchPolymarketData,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="p-4 text-[#00ff00]">
        <pre className="text-[11px]">
{`
╔════════════════════════════════════════════════════════════════╗
║  POLYMARKET TERMINAL                                           ║
║  Loading prediction markets...                                 ║
║  [████████████████████████████████████████] 100%              ║
╚════════════════════════════════════════════════════════════════╝
`}
        </pre>
      </div>
    );
  }

  const { markets, whaleActivity } = data || { markets: [], whaleActivity: [] };
  const sortedMarkets = [...markets].sort((a: Market, b: Market) => b.volume - a.volume);
  const topMarkets = sortedMarkets.slice(0, 20);

  return (
    <div className="p-2 text-[12px]">
      {/* Header */}
      <div className="bg-[#111] border border-[#2a2a2a] mb-2 px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-[#00ff00] font-bold">POLYMARKET TERMINAL</span>
            <span className="text-[#ff3333]">●</span>
            <span className="text-[#888] text-[10px]">LIVE</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-[#555]">
            <span>MARKETS: {markets.length}</span>
            <span>WHALE TRADES: {whaleActivity.length}</span>
            <span>{time.toLocaleTimeString('en-US', { hour12: false })}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-2">
        {/* Left - Market List */}
        <div className="col-span-7">
          <div className="bg-[#111] border border-[#2a2a2a]">
            <div className="border-b border-[#2a2a2a] px-2 py-1 text-[10px] text-[#555] uppercase tracking-wider flex items-center justify-between">
              <span>┌─ TOP MARKETS BY VOLUME ──────────────────────────────────────────┐</span>
            </div>
            
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 px-2 py-1 border-b border-[#2a2a2a] text-[10px] text-[#555] uppercase">
              <div className="col-span-5">MARKET</div>
              <div className="col-span-2 text-right">VOLUME</div>
              <div className="col-span-2 text-center">YES</div>
              <div className="col-span-2 text-center">NO</div>
              <div className="col-span-1 text-right">END</div>
            </div>

            {/* Market Rows */}
            <div className="max-h-[500px] overflow-y-auto">
              {topMarkets.map((market: Market, idx: number) => {
                const yesProb = market.outcomes.find(o => o.name === "Yes")?.probability || 0.5;
                const noProb = market.outcomes.find(o => o.name === "No")?.probability || 0.5;
                const isSelected = selectedMarket === market.id;
                
                return (
                  <div 
                    key={market.id}
                    onClick={() => setSelectedMarket(isSelected ? null : market.id)}
                    className={`grid grid-cols-12 gap-2 px-2 py-2 border-b border-[#1a1a1a] cursor-pointer transition-all ${
                      isSelected ? "bg-[#00ff00]/10 border-l-2 border-l-[#00ff00]" : "hover:bg-[#1a1a1a]"
                    }`}
                  >
                    <div className="col-span-5 flex items-center gap-2">
                      <span className="text-[#555] text-[10px] w-4">{idx + 1}</span>
                      <span className="truncate" title={market.question}>
                        {market.question.length > 50 ? market.question.slice(0, 50) + "..." : market.question}
                      </span>
                    </div>
                    <div className="col-span-2 text-right text-[#00ccff]">
                      {formatVolume(market.volume)}
                    </div>
                    <div className="col-span-2 text-center">
                      <span className={`px-2 py-0.5 ${yesProb > 0.5 ? "bg-[#00ff00]/20 text-[#00ff00]" : "text-[#888]"}`}>
                        {(yesProb * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className={`px-2 py-0.5 ${noProb > 0.5 ? "bg-[#ff3333]/20 text-[#ff3333]" : "text-[#888]"}`}>
                        {(noProb * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="col-span-1 text-right text-[10px] text-[#555]">
                      {formatDate(market.endDate)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right - Whale Trades */}
        <div className="col-span-5">
          <div className="bg-[#111] border border-[#2a2a2a] mb-2">
            <div className="border-b border-[#2a2a2a] px-2 py-1 text-[10px] text-[#555] uppercase tracking-wider">
              ┌─ WHALE TRADES (LIVE) ───────────────────┐
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {whaleActivity.length === 0 ? (
                <div className="p-4 text-center text-[#555]">
                  NO WHALE ACTIVITY DETECTED
                </div>
              ) : (
                whaleActivity.map((trade: Trade, idx: number) => (
                  <div 
                    key={idx}
                    className={`px-2 py-2 border-b border-[#1a1a1a] ${
                      trade.side === "YES" ? "border-l-2 border-l-[#00ff00]" : "border-l-2 border-l-[#ff3333]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-bold ${
                        trade.side === "YES" ? "text-[#00ff00]" : "text-[#ff3333]"
                      }`}>
                        {trade.side}
                      </span>
                      <span className="text-[10px] text-[#555]">{formatTime(trade.timestamp)}</span>
                    </div>
                    <div className="text-[11px] truncate mb-1" title={trade.market}>
                      {trade.market}
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-[#00ccff]">{formatVolume(trade.amount)}</span>
                      <span className="text-[#555]">{trade.wallet}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Market Stats */}
          <div className="bg-[#111] border border-[#2a2a2a]">
            <div className="border-b border-[#2a2a2a] px-2 py-1 text-[10px] text-[#555] uppercase tracking-wider">
              ┌─ MARKET STATS ────────────────────────┐
            </div>
            <div className="p-2">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="text-[#555]">TOTAL VOLUME:</div>
                <div className="text-[#00ff00]">
                  {formatVolume(markets.reduce((sum: number, m: Market) => sum + m.volume, 0))}
                </div>
                <div className="text-[#555]">AVG VOLUME:</div>
                <div className="text-[#888]">
                  {formatVolume(markets.reduce((sum: number, m: Market) => sum + m.volume, 0) / (markets.length || 1))}
                </div>
                <div className="text-[#555]">TOP MARKET:</div>
                <div className="text-[#00ccff] truncate">
                  {topMarkets[0]?.question.slice(0, 30)}...
                </div>
                <div className="text-[#555]">WHALE BETS 24H:</div>
                <div className="text-[#ffcc00]">{whaleActivity.length}</div>
              </div>
            </div>
          </div>

          {/* Selected Market Detail */}
          {selectedMarket && (
            <div className="bg-[#111] border border-[#00ff00] mt-2">
              <div className="border-b border-[#2a2a2a] px-2 py-1 text-[10px] text-[#00ff00] uppercase tracking-wider">
                ┌─ SELECTED MARKET ──────────────────────┐
              </div>
              <div className="p-2">
                {(() => {
                  const market = markets.find((m: Market) => m.id === selectedMarket);
                  if (!market) return null;
                  
                  return (
                    <div className="text-[11px]">
                      <div className="mb-2 text-[#888]">{market.question}</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-[#00ff00]/10 p-2 text-center">
                          <div className="text-[#00ff00] text-lg font-bold">
                            {((market.outcomes.find((o: { name: string; probability: number }) => o.name === "Yes")?.probability || 0.5) * 100).toFixed(0)}%
                          </div>
                          <div className="text-[10px] text-[#555]">YES</div>
                        </div>
                        <div className="bg-[#ff3333]/10 p-2 text-center">
                          <div className="text-[#ff3333] text-lg font-bold">
                            {((market.outcomes.find((o: { name: string; probability: number }) => o.name === "No")?.probability || 0.5) * 100).toFixed(0)}%
                          </div>
                          <div className="text-[10px] text-[#555]">NO</div>
                        </div>
                      </div>
                      <div className="mt-2 text-[10px] text-[#555]">
                        Volume: {formatVolume(market.volume)} | Ends: {formatDate(market.endDate)}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Command Line */}
      <div className="mt-2 bg-[#111] border border-[#2a2a2a] px-2 py-1">
        <div className="flex items-center text-[11px]">
          <span className="text-[#00ff00]">polymarket</span>
          <span className="text-[#888]">@</span>
          <span className="text-[#00ccff]">insider</span>
          <span className="text-[#888]">:~$</span>
          <span className="ml-2 text-[#555]">Click on market to view details | Tracking {whaleActivity.length} whale trades</span>
          <span className="ml-1 animate-pulse">█</span>
        </div>
      </div>
    </div>
  );
}
