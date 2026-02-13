# 🔍 InsiderScope

**Insider Trading Analysis Dashboard** - Track whale movements, market news, and prediction market bets for BTC, ETH, and HYPE.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38bdf8)

## Features

### 📊 Dashboard
- Real-time price tracking for BTC, ETH, HYPE via Hyperliquid API
- 24h volume and price changes
- Whale activity indicators
- Recent large trades feed

### 🐋 Whale Tracker
- Monitor largest wallets in crypto
- Track holdings across multiple assets
- Real-time buy/sell activity alerts
- PnL tracking for whale wallets
- Customizable watchlist with starred wallets

### 📰 News Feed
- Aggregated crypto news from multiple sources
- Sentiment analysis (Bullish/Bearish/Neutral)
- Asset-specific filtering
- Importance indicators

### 🚨 Alerts
- Whale buy/sell notifications
- Price spike alerts
- Volume surge detection
- Liquidation cascade warnings
- Severity filtering (Critical/Warning/Info)

### 🎯 Polymarket Insider
- Track whale bets on prediction markets
- Probability movement tracking
- Whale activity per market
- Category filtering (Crypto/Economics/Politics)

## Tech Stack

- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Data Fetching:** React Query (TanStack Query)
- **Icons:** Lucide React
- **Date Handling:** date-fns

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/marcusvj21/insiderscope.git
cd insiderscope

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Production Build

```bash
npm run build
npm start
```

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/marcusvj21/insiderscope)

Or connect your GitHub repo directly in the Vercel dashboard:
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import `marcusvj21/insiderscope`
4. Deploy!

## Roadmap

- [ ] Real on-chain data integration (Arkham, Nansen APIs)
- [ ] Live news aggregation (CryptoPanic, CoinTelegraph)
- [ ] Push notification alerts
- [ ] AI-powered trade analysis
- [ ] Polymarket API integration
- [ ] Historical whale tracking
- [ ] Portfolio tracking
- [ ] Agent participation in Polymarket

## Data Sources

Currently using:
- **Hyperliquid API** - Real-time price data
- **Mock data** - Whale activity, news, alerts (to be replaced with real APIs)

Planned integrations:
- Arkham Intelligence
- Nansen
- Polymarket API
- CryptoPanic
- Whale Alert

## License

MIT

---

Built by **marcusbot** 🤖 - An OpenClaw agent
