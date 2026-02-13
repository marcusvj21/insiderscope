// Tracked assets configuration
export const TRACKED_ASSETS = {
  BTC: {
    symbol: "BTC",
    name: "Bitcoin",
    coingeckoId: "bitcoin",
    decimals: 8,
    // Known whale wallets (public addresses for tracking)
    whaleWallets: [
      "bc1qgdjqv0av3q56jvd82tkdjpy7gdp9ut8tlqmgrpmv24sq90ecnvqqjwvw97", // Bitfinex
      "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo", // Binance
      "3M219KR5vEneNb47ewrPfWyb5jQ2DjxRP6", // Binance Cold
    ],
  },
  ETH: {
    symbol: "ETH",
    name: "Ethereum",
    coingeckoId: "ethereum",
    decimals: 18,
    whaleWallets: [
      "0x28C6c06298d514Db089934071355E5743bf21d60", // Binance
      "0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549", // Binance
      "0xDf9Eb223bAFBE5c5271415C75aeCD68C21fE3D7F", // Foundation
    ],
  },
  HYPE: {
    symbol: "HYPE",
    name: "Hyperliquid",
    coingeckoId: "hyperliquid",
    decimals: 18,
    whaleWallets: [],
  },
} as const;

// API endpoints
export const API_ENDPOINTS = {
  HYPERLIQUID: "https://api.hyperliquid.xyz/info",
  COINGECKO: "https://api.coingecko.com/api/v3",
  ETHERSCAN: "https://api.etherscan.io/api",
  BLOCKCHAIR: "https://api.blockchair.com",
  CRYPTOPANIC: "https://cryptopanic.com/api/v1",
  POLYMARKET: "https://clob.polymarket.com",
  GAMMA_API: "https://gamma-api.polymarket.com",
} as const;

// Cache TTLs (in seconds)
export const CACHE_TTL = {
  PRICES: 30, // 30 seconds
  WHALE_BALANCES: 300, // 5 minutes
  NEWS: 180, // 3 minutes
  POLYMARKET: 60, // 1 minute
} as const;

// Alert thresholds
export const ALERT_THRESHOLDS = {
  WHALE_TRADE_USD: 1000000, // $1M minimum for whale alert
  PRICE_SPIKE_PERCENT: 3, // 3% move triggers alert
  VOLUME_SURGE_MULTIPLIER: 3, // 3x average volume
  LIQUIDATION_USD: 5000000, // $5M liquidation cascade
} as const;

// Support/Resistance levels (should be configurable)
export const KEY_LEVELS = {
  BTC: {
    supports: [62500, 60000, 58000],
    resistances: [68000, 71000, 75000],
  },
  ETH: {
    supports: [2200, 2000, 1800],
    resistances: [2800, 3000, 3500],
  },
  HYPE: {
    supports: [20, 18, 15],
    resistances: [30, 35, 40],
  },
} as const;
