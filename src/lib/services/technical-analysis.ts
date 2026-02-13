/**
 * Technical Analysis & Market Sentiment
 * TradingView-style pattern detection
 */

import { withCache } from "../cache";
import { API_ENDPOINTS } from "../constants";

export interface TechnicalIndicators {
  symbol: string;
  price: number;
  
  // Moving Averages
  sma20: number;
  sma50: number;
  sma200: number;
  ema12: number;
  ema26: number;
  
  // Oscillators
  rsi14: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  
  // Volatility
  atr14: number;
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  
  // Volume
  volumeSma20: number;
  volumeRatio: number; // Current vs average
  
  // Funding (for perps)
  fundingRate: number;
  openInterest: number;
}

export interface MarketSentiment {
  symbol: string;
  overall: "STRONG_BUY" | "BUY" | "NEUTRAL" | "SELL" | "STRONG_SELL";
  score: number; // -100 to +100
  
  signals: {
    indicator: string;
    signal: "BUY" | "NEUTRAL" | "SELL";
    value: number;
    description: string;
  }[];
  
  patterns: {
    name: string;
    type: "bullish" | "bearish" | "neutral";
    confidence: number;
    description: string;
  }[];
  
  summary: string;
  timestamp: number;
}

/**
 * Fetch OHLCV data from Hyperliquid
 */
async function fetchOHLCV(symbol: string, interval: string = "1h", limit: number = 200): Promise<{
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}[]> {
  try {
    const response = await fetch(API_ENDPOINTS.HYPERLIQUID, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "candleSnapshot",
        req: {
          coin: symbol,
          interval: interval,
          startTime: Date.now() - limit * 3600000, // Last N hours
          endTime: Date.now(),
        },
      }),
    });

    if (!response.ok) return [];

    const data = await response.json();
    
    return (data || []).map((candle: any) => ({
      time: candle.t,
      open: parseFloat(candle.o),
      high: parseFloat(candle.h),
      low: parseFloat(candle.l),
      close: parseFloat(candle.c),
      volume: parseFloat(candle.v),
    }));
  } catch (error) {
    console.error(`Error fetching OHLCV for ${symbol}:`, error);
    return [];
  }
}

/**
 * Calculate Simple Moving Average
 */
function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  const slice = prices.slice(-period);
  return slice.reduce((sum, p) => sum + p, 0) / period;
}

/**
 * Calculate Exponential Moving Average
 */
function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  
  const multiplier = 2 / (period + 1);
  let ema = calculateSMA(prices.slice(0, period), period);
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
}

/**
 * Calculate RSI
 */
function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

/**
 * Calculate MACD
 */
function calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macd = ema12 - ema26;
  
  // Signal line (9-period EMA of MACD)
  // Simplified: just use last few MACD values
  const signal = macd * 0.8; // Approximation
  const histogram = macd - signal;
  
  return { macd, signal, histogram };
}

/**
 * Calculate Bollinger Bands
 */
function calculateBollingerBands(prices: number[], period: number = 20): {
  upper: number;
  middle: number;
  lower: number;
} {
  const sma = calculateSMA(prices, period);
  const slice = prices.slice(-period);
  
  const squaredDiffs = slice.map((p) => Math.pow(p - sma, 2));
  const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / period;
  const stdDev = Math.sqrt(variance);
  
  return {
    upper: sma + stdDev * 2,
    middle: sma,
    lower: sma - stdDev * 2,
  };
}

/**
 * Calculate ATR (Average True Range)
 */
function calculateATR(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 14
): number {
  if (highs.length < period + 1) return 0;
  
  const trueRanges: number[] = [];
  
  for (let i = 1; i < highs.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trueRanges.push(tr);
  }
  
  return calculateSMA(trueRanges, period);
}

/**
 * Detect chart patterns
 */
function detectPatterns(
  prices: number[],
  highs: number[],
  lows: number[]
): MarketSentiment["patterns"] {
  const patterns: MarketSentiment["patterns"] = [];
  const currentPrice = prices[prices.length - 1];
  const sma20 = calculateSMA(prices, 20);
  const sma50 = calculateSMA(prices, 50);
  const sma200 = calculateSMA(prices, 200);
  
  // Golden Cross (SMA50 crosses above SMA200)
  if (prices.length >= 200) {
    const prevSma50 = calculateSMA(prices.slice(0, -1), 50);
    const prevSma200 = calculateSMA(prices.slice(0, -1), 200);
    
    if (prevSma50 < prevSma200 && sma50 > sma200) {
      patterns.push({
        name: "Golden Cross",
        type: "bullish",
        confidence: 85,
        description: "50 SMA crossed above 200 SMA - major bullish signal",
      });
    }
    
    // Death Cross
    if (prevSma50 > prevSma200 && sma50 < sma200) {
      patterns.push({
        name: "Death Cross",
        type: "bearish",
        confidence: 85,
        description: "50 SMA crossed below 200 SMA - major bearish signal",
      });
    }
  }
  
  // Price above/below key MAs
  if (currentPrice > sma200 && currentPrice > sma50) {
    patterns.push({
      name: "Bullish Trend",
      type: "bullish",
      confidence: 70,
      description: "Price above both 50 and 200 SMA",
    });
  } else if (currentPrice < sma200 && currentPrice < sma50) {
    patterns.push({
      name: "Bearish Trend",
      type: "bearish",
      confidence: 70,
      description: "Price below both 50 and 200 SMA",
    });
  }
  
  // Support/Resistance test
  const recentLow = Math.min(...lows.slice(-20));
  const recentHigh = Math.max(...highs.slice(-20));
  
  if (currentPrice <= recentLow * 1.02) {
    patterns.push({
      name: "Support Test",
      type: "bullish",
      confidence: 60,
      description: `Testing support at $${recentLow.toFixed(0)}`,
    });
  }
  
  if (currentPrice >= recentHigh * 0.98) {
    patterns.push({
      name: "Resistance Test",
      type: "bearish",
      confidence: 60,
      description: `Testing resistance at $${recentHigh.toFixed(0)}`,
    });
  }
  
  // Higher highs / Higher lows (uptrend)
  const last5Highs = highs.slice(-5);
  const last5Lows = lows.slice(-5);
  
  let higherHighs = true;
  let higherLows = true;
  
  for (let i = 1; i < last5Highs.length; i++) {
    if (last5Highs[i] <= last5Highs[i - 1]) higherHighs = false;
    if (last5Lows[i] <= last5Lows[i - 1]) higherLows = false;
  }
  
  if (higherHighs && higherLows) {
    patterns.push({
      name: "Uptrend Structure",
      type: "bullish",
      confidence: 75,
      description: "Higher highs and higher lows forming",
    });
  }
  
  return patterns;
}

/**
 * Generate trading signals from indicators
 */
function generateSignals(indicators: TechnicalIndicators): MarketSentiment["signals"] {
  const signals: MarketSentiment["signals"] = [];
  
  // RSI
  if (indicators.rsi14 < 30) {
    signals.push({
      indicator: "RSI (14)",
      signal: "BUY",
      value: indicators.rsi14,
      description: "Oversold - potential bounce",
    });
  } else if (indicators.rsi14 > 70) {
    signals.push({
      indicator: "RSI (14)",
      signal: "SELL",
      value: indicators.rsi14,
      description: "Overbought - potential pullback",
    });
  } else {
    signals.push({
      indicator: "RSI (14)",
      signal: "NEUTRAL",
      value: indicators.rsi14,
      description: "Neutral zone",
    });
  }
  
  // MACD
  if (indicators.macd.histogram > 0 && indicators.macd.macd > indicators.macd.signal) {
    signals.push({
      indicator: "MACD",
      signal: "BUY",
      value: indicators.macd.histogram,
      description: "Bullish momentum",
    });
  } else if (indicators.macd.histogram < 0) {
    signals.push({
      indicator: "MACD",
      signal: "SELL",
      value: indicators.macd.histogram,
      description: "Bearish momentum",
    });
  } else {
    signals.push({
      indicator: "MACD",
      signal: "NEUTRAL",
      value: indicators.macd.histogram,
      description: "Neutral momentum",
    });
  }
  
  // Moving Average alignment
  if (indicators.price > indicators.sma20 && indicators.sma20 > indicators.sma50) {
    signals.push({
      indicator: "MA Alignment",
      signal: "BUY",
      value: indicators.sma20,
      description: "Price > SMA20 > SMA50 - bullish alignment",
    });
  } else if (indicators.price < indicators.sma20 && indicators.sma20 < indicators.sma50) {
    signals.push({
      indicator: "MA Alignment",
      signal: "SELL",
      value: indicators.sma20,
      description: "Price < SMA20 < SMA50 - bearish alignment",
    });
  } else {
    signals.push({
      indicator: "MA Alignment",
      signal: "NEUTRAL",
      value: indicators.sma20,
      description: "Mixed MA signals",
    });
  }
  
  // Bollinger Bands
  if (indicators.price <= indicators.bollingerBands.lower) {
    signals.push({
      indicator: "Bollinger Bands",
      signal: "BUY",
      value: indicators.price,
      description: "Price at lower band - oversold",
    });
  } else if (indicators.price >= indicators.bollingerBands.upper) {
    signals.push({
      indicator: "Bollinger Bands",
      signal: "SELL",
      value: indicators.price,
      description: "Price at upper band - overbought",
    });
  } else {
    signals.push({
      indicator: "Bollinger Bands",
      signal: "NEUTRAL",
      value: indicators.price,
      description: "Price within bands",
    });
  }
  
  // Volume
  if (indicators.volumeRatio > 2) {
    signals.push({
      indicator: "Volume",
      signal: indicators.price > indicators.sma20 ? "BUY" : "SELL",
      value: indicators.volumeRatio,
      description: `Volume ${indicators.volumeRatio.toFixed(1)}x average - high activity`,
    });
  }
  
  // Funding Rate (for perps)
  if (indicators.fundingRate < -0.01) {
    signals.push({
      indicator: "Funding Rate",
      signal: "BUY",
      value: indicators.fundingRate,
      description: "Negative funding - shorts paying longs",
    });
  } else if (indicators.fundingRate > 0.05) {
    signals.push({
      indicator: "Funding Rate",
      signal: "SELL",
      value: indicators.fundingRate,
      description: "High positive funding - longs overleveraged",
    });
  }
  
  return signals;
}

/**
 * Calculate overall sentiment score
 */
function calculateSentimentScore(signals: MarketSentiment["signals"]): number {
  let score = 0;
  
  signals.forEach((signal) => {
    if (signal.signal === "BUY") score += 20;
    else if (signal.signal === "SELL") score -= 20;
  });
  
  return Math.max(-100, Math.min(100, score));
}

/**
 * Get market sentiment for an asset
 */
export async function getMarketSentiment(symbol: string): Promise<MarketSentiment> {
  return withCache(`sentiment:${symbol}`, 60, async () => {
    const ohlcv = await fetchOHLCV(symbol, "1h", 200);
    
    if (ohlcv.length < 50) {
      return {
        symbol,
        overall: "NEUTRAL",
        score: 0,
        signals: [],
        patterns: [],
        summary: "Insufficient data for analysis",
        timestamp: Date.now(),
      };
    }
    
    const closes = ohlcv.map((c) => c.close);
    const highs = ohlcv.map((c) => c.high);
    const lows = ohlcv.map((c) => c.low);
    const volumes = ohlcv.map((c) => c.volume);
    const currentPrice = closes[closes.length - 1];
    
    // Calculate indicators
    const indicators: TechnicalIndicators = {
      symbol,
      price: currentPrice,
      sma20: calculateSMA(closes, 20),
      sma50: calculateSMA(closes, 50),
      sma200: calculateSMA(closes, 200),
      ema12: calculateEMA(closes, 12),
      ema26: calculateEMA(closes, 26),
      rsi14: calculateRSI(closes, 14),
      macd: calculateMACD(closes),
      atr14: calculateATR(highs, lows, closes, 14),
      bollingerBands: calculateBollingerBands(closes, 20),
      volumeSma20: calculateSMA(volumes, 20),
      volumeRatio: volumes[volumes.length - 1] / calculateSMA(volumes, 20),
      fundingRate: 0, // Would need to fetch separately
      openInterest: 0,
    };
    
    const signals = generateSignals(indicators);
    const patterns = detectPatterns(closes, highs, lows);
    const score = calculateSentimentScore(signals);
    
    // Add pattern influence to score
    let patternScore = 0;
    patterns.forEach((p) => {
      if (p.type === "bullish") patternScore += p.confidence * 0.2;
      else if (p.type === "bearish") patternScore -= p.confidence * 0.2;
    });
    
    const finalScore = Math.max(-100, Math.min(100, score + patternScore));
    
    let overall: MarketSentiment["overall"];
    if (finalScore >= 60) overall = "STRONG_BUY";
    else if (finalScore >= 20) overall = "BUY";
    else if (finalScore <= -60) overall = "STRONG_SELL";
    else if (finalScore <= -20) overall = "SELL";
    else overall = "NEUTRAL";
    
    // Generate summary
    const buySignals = signals.filter((s) => s.signal === "BUY").length;
    const sellSignals = signals.filter((s) => s.signal === "SELL").length;
    const bullishPatterns = patterns.filter((p) => p.type === "bullish").length;
    const bearishPatterns = patterns.filter((p) => p.type === "bearish").length;
    
    let summary = `${symbol} is ${overall.replace("_", " ")}. `;
    summary += `${buySignals} buy signals, ${sellSignals} sell signals. `;
    if (bullishPatterns > 0) summary += `${bullishPatterns} bullish pattern(s). `;
    if (bearishPatterns > 0) summary += `${bearishPatterns} bearish pattern(s). `;
    summary += `RSI: ${indicators.rsi14.toFixed(1)}, Price vs SMA200: ${((currentPrice / indicators.sma200 - 1) * 100).toFixed(1)}%`;
    
    return {
      symbol,
      overall,
      score: finalScore,
      signals,
      patterns,
      summary,
      timestamp: Date.now(),
    };
  });
}

/**
 * Get sentiment for all tracked assets
 */
export async function getAllSentiments(): Promise<MarketSentiment[]> {
  const symbols = ["BTC", "ETH", "HYPE"];
  return Promise.all(symbols.map(getMarketSentiment));
}
