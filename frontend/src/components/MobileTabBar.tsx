"use client";

import { Shirt, Store, History } from "lucide-react";

export type MobileTab = "tryon" | "brands" | "records";

const TABS: { key: MobileTab; label: string; Icon: React.ElementType }[] = [
  { key: "tryon",   label: "試穿", Icon: Shirt   },
  { key: "brands",  label: "品牌", Icon: Store   },
  { key: "records", label: "紀錄", Icon: History },
];

interface MobileTabBarProps {
  activeTab: MobileTab;
  onChange: (tab: MobileTab) => void;
  className?: string;
}

export default function MobileTabBar({ activeTab, onChange, className = "" }: MobileTabBarProps) {
  return (
    <nav className={`flex shrink-0 border-t border-[var(--forma-border)] bg-white ${className}`}>
      {TABS.map(({ key, label, Icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-colors ${
            activeTab === key ? "text-[#1D1D1F]" : "text-[rgba(0,0,0,0.32)] hover:text-[rgba(0,0,0,0.6)]"
          }`}
        >
          <Icon className="w-5 h-5" strokeWidth={1.5} />
          <span className="text-[0.6rem] tracking-[0.06em]">{label}</span>
        </button>
      ))}
    </nav>
  );
}
