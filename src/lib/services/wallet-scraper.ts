/**
 * Whale Wallet Scraper
 * Collects whale addresses from public sources
 */

import { withCache } from "../cache";

export interface ScrapedWallet {
  address: string;
  label?: string;
  source: string;
  asset: "BTC" | "ETH" | "HYPE";
  type: "exchange" | "whale" | "smart_money" | "fund" | "protocol" | "unknown";
  balance?: number;
  lastUpdated: number;
}

/**
 * Scrape top ETH holders from Etherscan
 */
async function scrapeEtherscanRichList(): Promise<ScrapedWallet[]> {
  const wallets: ScrapedWallet[] = [];
  
  try {
    // Etherscan accounts page (top holders)
    const response = await fetch("https://etherscan.io/accounts", {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; InsiderScope/1.0)",
      },
    });
    
    const html = await response.text();
    
    // Extract addresses from the page
    const addressRegex = /href="\/address\/(0x[a-fA-F0-9]{40})"/g;
    const labelRegex = /<a[^>]*href="\/address\/(0x[a-fA-F0-9]{40})"[^>]*>([^<]+)<\/a>/g;
    
    let match;
    const seen = new Set<string>();
    
    while ((match = labelRegex.exec(html)) !== null) {
      const address = match[1];
      const label = match[2].trim();
      
      if (!seen.has(address.toLowerCase())) {
        seen.add(address.toLowerCase());
        wallets.push({
          address,
          label: label !== address ? label : undefined,
          source: "etherscan",
          asset: "ETH",
          type: classifyWalletType(label),
          lastUpdated: Date.now(),
        });
      }
    }
  } catch (error) {
    console.error("Error scraping Etherscan:", error);
  }
  
  return wallets;
}

/**
 * Scrape labeled addresses from Etherscan
 */
async function scrapeEtherscanLabels(): Promise<ScrapedWallet[]> {
  const wallets: ScrapedWallet[] = [];
  const labelPages = [
    "https://etherscan.io/labelcloud", // Main label cloud
    "https://etherscan.io/accounts/label/exchange", // Exchange wallets
    "https://etherscan.io/accounts/label/fund", // Fund wallets
  ];
  
  for (const url of labelPages) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; InsiderScope/1.0)",
        },
      });
      
      const html = await response.text();
      const addressRegex = /0x[a-fA-F0-9]{40}/g;
      
      let match;
      const seen = new Set<string>();
      
      while ((match = addressRegex.exec(html)) !== null) {
        const address = match[0];
        if (!seen.has(address.toLowerCase())) {
          seen.add(address.toLowerCase());
          wallets.push({
            address,
            source: "etherscan-labels",
            asset: "ETH",
            type: url.includes("exchange") ? "exchange" : url.includes("fund") ? "fund" : "whale",
            lastUpdated: Date.now(),
          });
        }
      }
    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
    }
  }
  
  return wallets;
}

/**
 * Fetch known wallets from public APIs
 */
async function fetchKnownWallets(): Promise<ScrapedWallet[]> {
  const wallets: ScrapedWallet[] = [];
  
  // Known major exchange wallets (manually curated, always accurate)
  const knownExchanges: Record<string, { addresses: string[]; type: "exchange" }> = {
    "Binance": {
      addresses: [
        "0x28C6c06298d514Db089934071355E5743bf21d60",
        "0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549",
        "0xDFd5293D8e347dFe59E90eFd55b2956a1343963d",
        "0x56Eddb7aa87536c09CCc2793473599fD21A8b17F",
        "0xF977814e90dA44bFA03b6295A0616a897441aceC",
        "0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8",
        "0x5a52E96BAcdaBb82fd05763E25335261B270Efcb",
        "0x8894E0a0c962CB723c1976a4421c95949bE2D4E3",
        "0x4976a4A02f38326660D17bf34b431dC6e2eb2327",
        "0xe2fc31F816A9b94326492132018C3aEcC4a93aE1",
      ],
      type: "exchange",
    },
    "Coinbase": {
      addresses: [
        "0x71660c4005BA85c37ccec55d0C4493E66Fe775d3",
        "0x503828976D22510aad0201ac7EC88293211D23Da",
        "0xddfAbCdc4D8FfC6d5beaf154f18B778f892A0740",
        "0x3cD751E6b0078Be393132286c442345e5DC49699",
        "0xb5d85CBf7cB3EE0D56b3bB207D5Fc4B82f43F511",
        "0xA9D1e08C7793af67e9d92fe308d5697FB81d3E43",
      ],
      type: "exchange",
    },
    "Kraken": {
      addresses: [
        "0x2910543Af39abA0Cd09dBb2D50200b3E800A63D2",
        "0x0A869d79a7052C7f1b55a8EbAbbEa3420F0D1E13",
        "0xDA9dfA130Df4dE4673b89022EE50ff26f6EA73Cf",
        "0xAe2D4617c862309A3d75A0fFB358c7a5009c673F",
      ],
      type: "exchange",
    },
    "OKX": {
      addresses: [
        "0x6cC5F688a315f3dC28A7781717a9A798a59fDA7b",
        "0x236F9F97e0E62388479bf9E5BA4889e46B0273C3",
        "0xA7EFAe728D2936e78BDA97dc267687568dD593f3",
      ],
      type: "exchange",
    },
    "Bitfinex": {
      addresses: [
        "0x1151314c646Ce4E0eFD76d1aF4760aE66a9Fe30F",
        "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        "0x876EabF441B2EE5B5b0554Fd502a8E0600950cFa",
      ],
      type: "exchange",
    },
    "Gemini": {
      addresses: [
        "0xD24400ae8BfEBb18cA49Be86258a3C749cf46853",
        "0x6Fc82a5fe25A5cDb58BC74600A40A69C065263f8",
        "0x61EDCDf5bb737ADffE5043706e7C5bb1f1a56eEA",
      ],
      type: "exchange",
    },
    "KuCoin": {
      addresses: [
        "0x2B5634C42055806a59e9107ED44D43c426E58258",
        "0x689C56AEf474Df92D44A1B70850f808488F9769C",
      ],
      type: "exchange",
    },
    "Gate.io": {
      addresses: [
        "0x0D0707963952f2fBA59dD06f2b425ace40b492Fe",
        "0x1C4b70a3968436B9A0a9cf5205c787eb81Bb558c",
      ],
      type: "exchange",
    },
    "Bybit": {
      addresses: [
        "0xf89d7b9c864f589bbF53a82105107622B35EaA40",
        "0x1Db92e2EeBC8E0c075a02BeA49a2935BcD2dFCF4",
      ],
      type: "exchange",
    },
    "HTX (Huobi)": {
      addresses: [
        "0xAb5C66752a9e8167967685F1450532fB96d5d24f",
        "0x6748F50f686bfbcA6Fe8ad62b22228b87F31ff2b",
        "0xfdb16996831753d5331fF813c29a93c76834A0AD",
      ],
      type: "exchange",
    },
  };
  
  // Known protocol/fund wallets
  const knownFunds: Record<string, { addresses: string[]; type: "fund" | "protocol" }> = {
    "Ethereum Foundation": {
      addresses: [
        "0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe",
        "0x9ee457023bB3De16D51A003a247BaEaD7fce313D",
      ],
      type: "fund",
    },
    "Paradigm": {
      addresses: [
        "0xd4B88Df4D29F5CedD6857912842cff3b20C8Cfa3",
      ],
      type: "fund",
    },
    "a]": {
      addresses: [
        "0x0716a17FBAeE714f1E6aB0f9d59edbC5f09815C0",
      ],
      type: "fund",
    },
    "Jump Trading": {
      addresses: [
        "0xf584F8728B874a6a5c7A8d4d387C9aae9172D621",
      ],
      type: "fund",
    },
    "Wintermute": {
      addresses: [
        "0x0000000fE6A514a32aBDCDfcc076A10fFeAaeFc9",
        "0xDBF5E9c5206d0dB70a90108bf936DA60221dC080",
      ],
      type: "fund",
    },
    "Aave Treasury": {
      addresses: [
        "0x464C71f6c2F760DdA6093dCB91C24c39e5d6e18c",
      ],
      type: "protocol",
    },
    "Uniswap Treasury": {
      addresses: [
        "0x1a9C8182C09F50C8318d769245beA52c32BE35BC",
      ],
      type: "protocol",
    },
    "Compound Treasury": {
      addresses: [
        "0x2775b1c75658Be0F640272CCb8c72ac986009e38",
      ],
      type: "protocol",
    },
  };
  
  // Add exchange wallets
  for (const [name, data] of Object.entries(knownExchanges)) {
    for (const address of data.addresses) {
      wallets.push({
        address,
        label: name,
        source: "curated",
        asset: "ETH",
        type: data.type,
        lastUpdated: Date.now(),
      });
    }
  }
  
  // Add fund/protocol wallets
  for (const [name, data] of Object.entries(knownFunds)) {
    for (const address of data.addresses) {
      wallets.push({
        address,
        label: name,
        source: "curated",
        asset: "ETH",
        type: data.type,
        lastUpdated: Date.now(),
      });
    }
  }
  
  return wallets;
}

/**
 * Classify wallet type based on label
 */
function classifyWalletType(label?: string): ScrapedWallet["type"] {
  if (!label) return "unknown";
  
  const lowerLabel = label.toLowerCase();
  
  if (
    lowerLabel.includes("binance") ||
    lowerLabel.includes("coinbase") ||
    lowerLabel.includes("kraken") ||
    lowerLabel.includes("exchange") ||
    lowerLabel.includes("okx") ||
    lowerLabel.includes("bitfinex") ||
    lowerLabel.includes("gemini") ||
    lowerLabel.includes("kucoin") ||
    lowerLabel.includes("bybit") ||
    lowerLabel.includes("huobi") ||
    lowerLabel.includes("htx") ||
    lowerLabel.includes("gate.io")
  ) {
    return "exchange";
  }
  
  if (
    lowerLabel.includes("fund") ||
    lowerLabel.includes("capital") ||
    lowerLabel.includes("ventures") ||
    lowerLabel.includes("paradigm") ||
    lowerLabel.includes("a16z") ||
    lowerLabel.includes("jump") ||
    lowerLabel.includes("wintermute")
  ) {
    return "fund";
  }
  
  if (
    lowerLabel.includes("protocol") ||
    lowerLabel.includes("treasury") ||
    lowerLabel.includes("dao") ||
    lowerLabel.includes("aave") ||
    lowerLabel.includes("uniswap") ||
    lowerLabel.includes("compound")
  ) {
    return "protocol";
  }
  
  return "whale";
}

/**
 * Get all whale wallets from all sources
 */
export async function getAllWhaleWallets(): Promise<ScrapedWallet[]> {
  return withCache("whale-wallets:all", 3600, async () => {
    const [knownWallets, etherscanRich, etherscanLabels] = await Promise.allSettled([
      fetchKnownWallets(),
      scrapeEtherscanRichList(),
      scrapeEtherscanLabels(),
    ]);
    
    const allWallets: ScrapedWallet[] = [];
    const seen = new Set<string>();
    
    // Add known wallets first (highest priority)
    if (knownWallets.status === "fulfilled") {
      for (const wallet of knownWallets.value) {
        const key = wallet.address.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          allWallets.push(wallet);
        }
      }
    }
    
    // Add scraped wallets
    if (etherscanRich.status === "fulfilled") {
      for (const wallet of etherscanRich.value) {
        const key = wallet.address.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          allWallets.push(wallet);
        }
      }
    }
    
    if (etherscanLabels.status === "fulfilled") {
      for (const wallet of etherscanLabels.value) {
        const key = wallet.address.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          allWallets.push(wallet);
        }
      }
    }
    
    console.log(`Loaded ${allWallets.length} whale wallets`);
    return allWallets;
  });
}

/**
 * Get wallet count by type
 */
export async function getWalletStats(): Promise<{
  total: number;
  byType: Record<string, number>;
  byAsset: Record<string, number>;
  bySource: Record<string, number>;
}> {
  const wallets = await getAllWhaleWallets();
  
  const byType: Record<string, number> = {};
  const byAsset: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  
  for (const wallet of wallets) {
    byType[wallet.type] = (byType[wallet.type] || 0) + 1;
    byAsset[wallet.asset] = (byAsset[wallet.asset] || 0) + 1;
    bySource[wallet.source] = (bySource[wallet.source] || 0) + 1;
  }
  
  return {
    total: wallets.length,
    byType,
    byAsset,
    bySource,
  };
}
