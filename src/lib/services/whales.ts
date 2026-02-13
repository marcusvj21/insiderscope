import { API_ENDPOINTS, TRACKED_ASSETS, CACHE_TTL, ALERT_THRESHOLDS } from "../constants";
import { withCache } from "../cache";

export interface WhaleTransaction {
  hash: string;
  from: string;
  to: string;
  value: number;
  valueUsd: number;
  asset: string;
  timestamp: number;
  type: "buy" | "sell" | "transfer";
  exchange?: string;
}

export interface WhaleWallet {
  address: string;
  label?: string;
  balance: number;
  balanceUsd: number;
  asset: string;
  lastActivity: number;
  recentTxns: WhaleTransaction[];
}

// Known exchange addresses for classifying transactions
const EXCHANGE_ADDRESSES: Record<string, string> = {
  // Ethereum
  "0x28c6c06298d514db089934071355e5743bf21d60": "Binance",
  "0x21a31ee1afc51d94c2efccaa2092ad1028285549": "Binance",
  "0xdfd5293d8e347dfe59e90efd55b2956a1343963d": "Binance",
  "0x56eddb7aa87536c09ccc2793473599fd21a8b17f": "Binance",
  "0x9696f59e4d72e237be84ffd425dcad154bf96976": "Binance",
  "0x4fabb145d64652a948d72533023f6e7a623c7c53": "Binance",
  "0xf977814e90da44bfa03b6295a0616a897441acec": "Binance",
  "0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503": "Binance",
  "0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be": "Binance",
  "0xbe0eb53f46cd790cd13851d5eff43d12404d33e8": "Binance",
  "0x0d0707963952f2fba59dd06f2b425ace40b492fe": "Gate.io",
  "0x75e89d5979e4f6fba9f97c104c2f0afb3f1dcb88": "MEXC",
  "0x1151314c646ce4e0efd76d1af4760ae66a9fe30f": "Bitfinex",
  "0x742d35cc6634c0532925a3b844bc9e7595f0ab7c": "Kraken",
  "0x267be1c1d684f78cb4f6a176c4911b741e4ffdc0": "Kraken",
  "0xfa52274dd61e1643d2205169732f29114bc240b3": "Kraken",
};

/**
 * Fetch recent large ETH transactions using Etherscan API
 * Note: Requires API key for production use
 */
export async function fetchEthWhaleTransactions(
  address?: string
): Promise<WhaleTransaction[]> {
  const apiKey = process.env.ETHERSCAN_API_KEY || "YourApiKeyToken";
  
  // Get internal transactions for large transfers
  const params = new URLSearchParams({
    module: "account",
    action: "txlist",
    address: address || TRACKED_ASSETS.ETH.whaleWallets[0],
    startblock: "0",
    endblock: "99999999",
    page: "1",
    offset: "50",
    sort: "desc",
    apikey: apiKey,
  });

  try {
    const response = await fetch(`${API_ENDPOINTS.ETHERSCAN}?${params}`);
    const data = await response.json();

    if (data.status !== "1" || !data.result) {
      return [];
    }

    return data.result
      .filter((tx: any) => {
        const valueEth = parseFloat(tx.value) / 1e18;
        return valueEth > 100; // Only txns > 100 ETH
      })
      .map((tx: any): WhaleTransaction => {
        const valueEth = parseFloat(tx.value) / 1e18;
        const toExchange = EXCHANGE_ADDRESSES[tx.to.toLowerCase()];
        const fromExchange = EXCHANGE_ADDRESSES[tx.from.toLowerCase()];

        let type: "buy" | "sell" | "transfer" = "transfer";
        let exchange: string | undefined;

        if (toExchange) {
          type = "sell"; // Moving to exchange = likely selling
          exchange = toExchange;
        } else if (fromExchange) {
          type = "buy"; // Moving from exchange = likely buying
          exchange = fromExchange;
        }

        return {
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: valueEth,
          valueUsd: valueEth * 2500, // Would need real price
          asset: "ETH",
          timestamp: parseInt(tx.timeStamp) * 1000,
          type,
          exchange,
        };
      });
  } catch (error) {
    console.error("Error fetching ETH transactions:", error);
    return [];
  }
}

/**
 * Get whale activity summary for all tracked assets
 */
export async function getWhaleActivity(): Promise<{
  recentTransactions: WhaleTransaction[];
  largestWallets: WhaleWallet[];
  summary: {
    totalVolume24h: number;
    buyVolume24h: number;
    sellVolume24h: number;
    netFlow: number;
  };
}> {
  return withCache("whales:activity", CACHE_TTL.WHALE_BALANCES, async () => {
    // In production, aggregate from multiple sources
    const ethTxns = await fetchEthWhaleTransactions();
    
    // Calculate summary
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const recentTxns = ethTxns.filter((tx) => tx.timestamp > oneDayAgo);

    let buyVolume = 0;
    let sellVolume = 0;

    recentTxns.forEach((tx) => {
      if (tx.type === "buy") buyVolume += tx.valueUsd;
      if (tx.type === "sell") sellVolume += tx.valueUsd;
    });

    return {
      recentTransactions: ethTxns.slice(0, 20),
      largestWallets: [], // Would need balance tracking
      summary: {
        totalVolume24h: buyVolume + sellVolume,
        buyVolume24h: buyVolume,
        sellVolume24h: sellVolume,
        netFlow: buyVolume - sellVolume,
      },
    };
  });
}

/**
 * Check if a transaction qualifies as a whale alert
 */
export function isWhaleAlert(tx: WhaleTransaction): boolean {
  return tx.valueUsd >= ALERT_THRESHOLDS.WHALE_TRADE_USD;
}

/**
 * Classify whale activity level
 */
export function classifyWhaleActivity(
  volume24h: number,
  avgVolume: number
): "high" | "medium" | "low" {
  const ratio = volume24h / avgVolume;
  if (ratio >= ALERT_THRESHOLDS.VOLUME_SURGE_MULTIPLIER) return "high";
  if (ratio >= 1.5) return "medium";
  return "low";
}
