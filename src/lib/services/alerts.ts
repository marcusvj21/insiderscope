import { CACHE_TTL, ALERT_THRESHOLDS, KEY_LEVELS } from "../constants";
import { withCache } from "../cache";
import { getPriceData, getFundingRates } from "./prices";
import { getWhaleActivity, isWhaleAlert } from "./whales";

export interface Alert {
  id: string;
  type: "whale_buy" | "whale_sell" | "price_spike" | "volume_surge" | "liquidation" | "funding_extreme" | "support_test" | "resistance_test";
  asset: string;
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  value: number;
  timestamp: number;
  wallet?: string;
  metadata?: Record<string, any>;
}

/**
 * Generate alerts from whale transactions
 */
async function getWhaleAlerts(): Promise<Alert[]> {
  const alerts: Alert[] = [];
  
  try {
    const whaleData = await getWhaleActivity();
    
    whaleData.recentTransactions.forEach((tx) => {
      if (isWhaleAlert(tx)) {
        alerts.push({
          id: `whale-${tx.hash}`,
          type: tx.type === "buy" ? "whale_buy" : "whale_sell",
          asset: tx.asset,
          title: tx.type === "buy" 
            ? `Large ${tx.asset} Purchase Detected`
            : `Large ${tx.asset} Sale Detected`,
          description: `${tx.value.toFixed(2)} ${tx.asset} ${tx.type === "buy" ? "bought" : "sold"}${tx.exchange ? ` on ${tx.exchange}` : ""}`,
          severity: tx.valueUsd >= ALERT_THRESHOLDS.WHALE_TRADE_USD * 5 ? "critical" : "warning",
          value: tx.valueUsd,
          timestamp: tx.timestamp,
          wallet: tx.from.substring(0, 10) + "..." + tx.from.substring(tx.from.length - 4),
          metadata: { txHash: tx.hash },
        });
      }
    });
  } catch (error) {
    console.error("Error generating whale alerts:", error);
  }
  
  return alerts;
}

/**
 * Generate alerts from price movements
 */
async function getPriceAlerts(): Promise<Alert[]> {
  const alerts: Alert[] = [];
  
  try {
    const prices = await getPriceData();
    
    prices.forEach((asset) => {
      // Price spike alert
      if (Math.abs(asset.change24h) >= ALERT_THRESHOLDS.PRICE_SPIKE_PERCENT) {
        const isUp = asset.change24h > 0;
        alerts.push({
          id: `price-${asset.symbol}-${Date.now()}`,
          type: "price_spike",
          asset: asset.symbol,
          title: `${asset.symbol} ${isUp ? "Surges" : "Drops"} ${Math.abs(asset.change24h).toFixed(1)}%`,
          description: `${asset.symbol} has moved ${isUp ? "up" : "down"} significantly in the last 24h`,
          severity: Math.abs(asset.change24h) >= ALERT_THRESHOLDS.PRICE_SPIKE_PERCENT * 2 ? "critical" : "warning",
          value: asset.price,
          timestamp: asset.lastUpdated,
          metadata: { change24h: asset.change24h },
        });
      }
      
      // Support/Resistance test alerts
      const levels = KEY_LEVELS[asset.symbol as keyof typeof KEY_LEVELS];
      if (levels) {
        // Check supports
        levels.supports.forEach((support) => {
          const distance = ((asset.price - support) / support) * 100;
          if (distance > 0 && distance < 2) {
            alerts.push({
              id: `support-${asset.symbol}-${support}`,
              type: "support_test",
              asset: asset.symbol,
              title: `${asset.symbol} Testing $${support.toLocaleString()} Support`,
              description: `Price is ${distance.toFixed(1)}% above key support level`,
              severity: distance < 1 ? "warning" : "info",
              value: asset.price,
              timestamp: asset.lastUpdated,
              metadata: { supportLevel: support, distance },
            });
          }
        });
        
        // Check resistances
        levels.resistances.forEach((resistance) => {
          const distance = ((resistance - asset.price) / asset.price) * 100;
          if (distance > 0 && distance < 2) {
            alerts.push({
              id: `resistance-${asset.symbol}-${resistance}`,
              type: "resistance_test",
              asset: asset.symbol,
              title: `${asset.symbol} Approaching $${resistance.toLocaleString()} Resistance`,
              description: `Price is ${distance.toFixed(1)}% below key resistance level`,
              severity: distance < 1 ? "warning" : "info",
              value: asset.price,
              timestamp: asset.lastUpdated,
              metadata: { resistanceLevel: resistance, distance },
            });
          }
        });
      }
    });
  } catch (error) {
    console.error("Error generating price alerts:", error);
  }
  
  return alerts;
}

/**
 * Generate alerts from funding rates
 */
async function getFundingAlerts(): Promise<Alert[]> {
  const alerts: Alert[] = [];
  
  try {
    const funding = await getFundingRates();
    
    Object.entries(funding).forEach(([symbol, rate]) => {
      // Extreme funding rates (>0.1% or <-0.1%)
      if (Math.abs(rate) >= 0.1) {
        const isPositive = rate > 0;
        alerts.push({
          id: `funding-${symbol}-${Date.now()}`,
          type: "funding_extreme",
          asset: symbol,
          title: `${symbol} Extreme Funding Rate: ${rate.toFixed(4)}%`,
          description: isPositive 
            ? "Longs are paying shorts - market is overleveraged long"
            : "Shorts are paying longs - market is overleveraged short",
          severity: Math.abs(rate) >= 0.2 ? "critical" : "warning",
          value: rate,
          timestamp: Date.now(),
          metadata: { fundingRate: rate, bias: isPositive ? "long" : "short" },
        });
      }
    });
  } catch (error) {
    console.error("Error generating funding alerts:", error);
  }
  
  return alerts;
}

/**
 * Get all alerts aggregated and sorted by severity/time
 */
export async function getAllAlerts(): Promise<Alert[]> {
  return withCache("alerts:all", 30, async () => {
    const [whaleAlerts, priceAlerts, fundingAlerts] = await Promise.all([
      getWhaleAlerts(),
      getPriceAlerts(),
      getFundingAlerts(),
    ]);

    const allAlerts = [...whaleAlerts, ...priceAlerts, ...fundingAlerts];

    // Sort by severity (critical first) then by time
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    
    return allAlerts.sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.timestamp - a.timestamp;
    });
  });
}
