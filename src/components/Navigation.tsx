"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "[DASHBOARD]", key: "F1" },
  { href: "/whales", label: "[WHALES]", key: "F2" },
  { href: "/news", label: "[NEWS]", key: "F3" },
  { href: "/alerts", label: "[ALERTS]", key: "F4" },
  { href: "/polymarket", label: "[PREDICT]", key: "F5" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <header className="border-b border-[#2a2a2a] bg-[#0a0a0a]">
      {/* Top status bar */}
      <div className="flex items-center justify-between px-4 py-1 border-b border-[#2a2a2a] text-[10px] text-[#555]">
        <div className="flex items-center gap-4">
          <span>INSIDERSCOPE v1.0.0</span>
          <span className="text-[#00ff00]">● CONNECTED</span>
        </div>
        <div className="flex items-center gap-4">
          <span>API: HYPERLIQUID</span>
          <span>CHAIN: ETH</span>
          <span>{new Date().toISOString().split('T')[0]}</span>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex items-center px-2 py-1">
        <div className="flex items-center gap-1 text-[11px]">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1 transition-all ${
                  isActive
                    ? "bg-[#00ff00] text-black"
                    : "text-[#888] hover:text-[#00ff00] hover:bg-[#1a1a1a]"
                }`}
              >
                <span className="text-[#555] mr-1">{item.key}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
        
        <div className="ml-auto flex items-center gap-4 text-[10px] text-[#555]">
          <span>MEM: 128MB</span>
          <span>CPU: 2%</span>
          <span className="text-[#00ff00]">LIVE</span>
        </div>
      </div>
    </header>
  );
}
