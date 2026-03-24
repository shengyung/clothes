"use client";

import { useState } from "react";

const BRANDS = ["全部", "Uniqlo", "H&M", "Zara", "Gap"];
const CATEGORIES = ["全部", "上衣", "褲子", "外套", "洋裝", "鞋子"];
const OCCASIONS = ["全部", "運動", "工作", "正式場合", "休閒"];

export interface FilterState {
  brand: string;
  category: string;
  occasion: string;
}

interface FilterTabsProps {
  onChange?: (filters: FilterState) => void;
}

function TabGroup({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: string[];
  value: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 flex-1">
      <div className="text-[0.62rem] tracking-[0.12em] uppercase text-taupe">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={`px-3 py-1 text-[0.72rem] tracking-[0.04em] border transition-all ${
              value === opt
                ? "bg-forma-accent-dark text-white border-forma-accent-dark"
                : "bg-transparent text-taupe border-[var(--forma-border)] hover:border-black/30 hover:text-cream"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function FilterTabs({ onChange }: FilterTabsProps) {
  const [filters, setFilters] = useState<FilterState>({
    brand: "全部",
    category: "全部",
    occasion: "全部",
  });

  const update = (key: keyof FilterState, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    onChange?.(next);
  };

  return (
    <div className="px-8 py-3 border-b border-[var(--forma-border)] backdrop-blur-xl bg-warm-white flex gap-6 items-start">
      <TabGroup label="品牌" options={BRANDS} value={filters.brand} onSelect={(v) => update("brand", v)} />
      <div className="w-px self-stretch bg-[var(--forma-border)] my-0.5" />
      <TabGroup label="類型" options={CATEGORIES} value={filters.category} onSelect={(v) => update("category", v)} />
      <div className="w-px self-stretch bg-[var(--forma-border)] my-0.5" />
      <TabGroup label="場合" options={OCCASIONS} value={filters.occasion} onSelect={(v) => update("occasion", v)} />
    </div>
  );
}
