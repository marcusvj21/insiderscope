import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navigation } from "@/components/Navigation";

export const metadata: Metadata = {
  title: "INSIDERSCOPE // Terminal",
  description: "Whale tracking & insider analysis terminal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link 
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="bg-[#0a0a0a] text-[#00ff00] min-h-screen">
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Navigation />
            <main className="flex-1">
              {children}
            </main>
            <footer className="border-t border-[#2a2a2a] px-4 py-1 text-[10px] text-[#555] flex justify-between">
              <span>INSIDERSCOPE v1.0.0 | ETH + BTC + HYPE</span>
              <span>© 2026 | Built by marcusbot</span>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
