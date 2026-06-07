"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { fetchGarments, type Garment } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type SizeKey = "XS" | "S" | "M" | "L" | "XL";
type BodyTab = "top" | "bottom";
type ShoulderFit = "fitted" | "dropped" | "oversized";
type HemlineType = "crop" | "standard" | "long";
type BottomLength = "short" | "standard" | "long";

interface BodyAnalysis {
  size: SizeKey;
  bmi: number;
  shoulder: ShoulderFit;
  topHem: HemlineType;
  bottomLen: BottomLength;
}

// ─── Size chart ───────────────────────────────────────────────────────────────

const SIZE_ORDER: SizeKey[] = ["XS", "S", "M", "L", "XL"];

const STD_CHART: Record<SizeKey, { chest: string; waist: string; hip: string }> = {
  XS: { chest: "76–80", waist: "60–64", hip: "84–88" },
  S:  { chest: "80–84", waist: "64–68", hip: "88–92" },
  M:  { chest: "84–88", waist: "68–72", hip: "92–96" },
  L:  { chest: "88–94", waist: "72–78", hip: "96–102" },
  XL: { chest: "94–100", waist: "78–84", hip: "102–108" },
};

// ─── Demo garments (fallback when API unavailable) ────────────────────────────

const DEMO_GARMENTS: Garment[] = [
  { id: "1",  name: "White T-Shirt",      category: "upper_body", image_url: "" },
  { id: "2",  name: "Black T-Shirt",      category: "upper_body", image_url: "" },
  { id: "3",  name: "Blue Denim Shirt",   category: "upper_body", image_url: "" },
  { id: "4",  name: "Red Polo Shirt",     category: "upper_body", image_url: "" },
  { id: "5",  name: "Grey Hoodie",        category: "upper_body", image_url: "" },
  { id: "6",  name: "Navy Blazer",        category: "upper_body", image_url: "" },
  { id: "7",  name: "Striped Shirt",      category: "upper_body", image_url: "" },
  { id: "8",  name: "Green Sweater",      category: "upper_body", image_url: "" },
  { id: "9",  name: "White Button-Down",  category: "upper_body", image_url: "" },
  { id: "10", name: "Black Jacket",       category: "upper_body", image_url: "" },
  { id: "11", name: "Black Slim Pants",   category: "lower_body", image_url: "" },
  { id: "12", name: "Wide Leg Jeans",     category: "lower_body", image_url: "" },
  { id: "13", name: "Beige Midi Skirt",   category: "lower_body", image_url: "" },
];

// ─── Analysis logic (demo) ───────────────────────────────────────────────────

function analyze(h: number, w: number): BodyAnalysis {
  const bmi = w / (h / 100) ** 2;

  // Size
  let idx = 2;
  if (h < 157) idx = 0;
  else if (h < 162) idx = 1;
  else if (h < 170) idx = 2;
  else if (h < 176) idx = 3;
  else idx = 4;
  if (bmi < 17.5) idx -= 1;
  else if (bmi >= 22 && bmi < 25) idx += 1;
  else if (bmi >= 25 && bmi < 28) idx += 2;
  else if (bmi >= 28) idx += 3;
  const size = SIZE_ORDER[Math.min(Math.max(idx, 0), SIZE_ORDER.length - 1)];

  // Shoulder fit: BMI-driven
  const shoulder: ShoulderFit = bmi < 19 ? "fitted" : bmi < 24 ? "dropped" : "oversized";

  // Top hem: height-driven
  const topHem: HemlineType = h < 158 ? "crop" : h < 172 ? "standard" : "long";

  // Bottom length: height-driven
  const bottomLen: BottomLength = h < 158 ? "short" : h < 168 ? "standard" : "long";

  return { size, bmi, shoulder, topHem, bottomLen };
}

// ─── SVG illustrations ────────────────────────────────────────────────────────

function GarmentPlaceholder({ category }: { category: string }) {
  const isBottom = category === "lower_body";
  return (
    <svg viewBox="0 0 48 56" fill="none" className="w-full h-full" aria-hidden="true">
      {isBottom ? (
        <>
          <rect x="14" y="4" width="20" height="8" rx="1" stroke="currentColor" strokeWidth="0.8" />
          <path d="M14 12 L10 52 L22 52 L24 30 L26 52 L38 52 L34 12 Z"
            stroke="currentColor" strokeWidth="0.8" fill="rgba(0,0,0,0.03)" />
        </>
      ) : (
        <>
          <path d="M20 4 L16 8 L8 12 L10 20 L16 18 L16 52 L32 52 L32 18 L38 20 L40 12 L32 8 L28 4 A4 4 0 0 1 20 4Z"
            stroke="currentColor" strokeWidth="0.8" fill="rgba(0,0,0,0.03)" />
        </>
      )}
    </svg>
  );
}

// Shoulder width illustration (front view garment)
function ShoulderSVG({ variant, highlight }: { variant: ShoulderFit; highlight: boolean }) {
  // sx = sleeve start x, shoulder_w = how far sleeve extends past body
  const cfg = {
    fitted:    { sx: 16, sw: 6,  label: "合肩",  desc: "肩縫對齊肩骨，俐落有型" },
    dropped:   { sx: 10, sw: 9,  label: "落肩",  desc: "肩縫下移，自然休閒感" },
    oversized: { sx: 4,  sw: 13, label: "過肩",  desc: "肩縫大幅外移，寬鬆oversize" },
  }[variant];

  const bodyL = 30 - cfg.sx;
  const bodyR = 30 + cfg.sx;

  return (
    <div className={`flex flex-col items-center gap-2 p-3 border transition-colors duration-150 cursor-default ${
      highlight
        ? "border-[#1D1D1F] bg-[#1D1D1F] text-white"
        : "border-[rgba(0,0,0,0.08)] bg-white text-[#1D1D1F] hover:border-[rgba(0,0,0,0.2)]"
    }`}>
      <svg viewBox="0 0 60 72" fill="none" className="w-14 h-16" aria-hidden="true">
        {/* Head */}
        <circle cx="30" cy="9" r="7" stroke="currentColor" strokeWidth="0.9" />
        {/* Neck */}
        <line x1="30" y1="16" x2="30" y2="21" stroke="currentColor" strokeWidth="0.9" />
        {/* Shoulder line + seam markers */}
        <line x1={bodyL} y1="21" x2={bodyR} y2="21" stroke="currentColor" strokeWidth="0.9" />
        <circle cx={bodyL} cy="21" r="2" fill="currentColor" />
        <circle cx={bodyR} cy="21" r="2" fill="currentColor" />
        {/* Arms (from seam markers, angled down) */}
        <line x1={bodyL} y1="21" x2={bodyL - cfg.sw} y2="42" stroke="currentColor" strokeWidth="0.9" />
        <line x1={bodyR} y1="21" x2={bodyR + cfg.sw} y2="42" stroke="currentColor" strokeWidth="0.9" />
        {/* Torso */}
        <path
          d={`M${bodyL},21 L${bodyL - 1},65 L${bodyR + 1},65 L${bodyR},21`}
          stroke="currentColor" strokeWidth="0.9"
          fill={highlight ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)"}
        />
      </svg>
      <div className="text-center">
        <p className={`text-[0.72rem] tracking-[0.1em] font-serif ${highlight ? "text-white" : "text-[#1D1D1F]"}`}>
          {cfg.label}
          {highlight && (
            <span className="ml-1.5 text-[0.55rem] tracking-[0.08em] opacity-70">推薦</span>
          )}
        </p>
        <p className={`text-[0.62rem] mt-0.5 leading-snug ${highlight ? "text-[rgba(255,255,255,0.6)]" : "text-[rgba(0,0,0,0.4)]"}`}>
          {cfg.desc}
        </p>
      </div>
    </div>
  );
}

// Garment length illustration (top hemline)
function TopHemSVG({ variant, highlight }: { variant: HemlineType; highlight: boolean }) {
  const cfg = {
    crop:     { hemY: 50, label: "短版 / Crop", desc: "腰部以上，顯腰顯腿長" },
    standard: { hemY: 68, label: "標準長度",    desc: "過腰到臀，百搭款型" },
    long:     { hemY: 84, label: "長版",         desc: "蓋過臀部，修飾身形" },
  }[variant];

  return (
    <div className={`flex flex-col items-center gap-2 p-3 border transition-colors duration-150 cursor-default ${
      highlight
        ? "border-[#1D1D1F] bg-[#1D1D1F] text-white"
        : "border-[rgba(0,0,0,0.08)] bg-white text-[#1D1D1F] hover:border-[rgba(0,0,0,0.2)]"
    }`}>
      <svg viewBox="0 0 60 100" fill="none" className="w-14 h-20" aria-hidden="true">
        {/* Head */}
        <circle cx="30" cy="8" r="6" stroke="currentColor" strokeWidth="0.9" />
        {/* Body outline — same height always, just hemline moves */}
        <path
          d="M18,22 L12,32 L12,88 L48,88 L48,32 L42,22"
          stroke="currentColor" strokeWidth="0.9"
          strokeDasharray="2 2"
          opacity="0.25"
        />
        {/* Actual garment */}
        <path
          d={`M18,22 L12,32 L12,${cfg.hemY} L48,${cfg.hemY} L48,32 L42,22`}
          stroke="currentColor" strokeWidth="0.9"
          fill={highlight ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)"}
        />
        {/* Hemline indicator */}
        <line
          x1="8" y1={cfg.hemY} x2="52" y2={cfg.hemY}
          stroke="currentColor" strokeWidth="1.2"
          strokeDasharray="3 2"
          opacity={highlight ? 0.6 : 0.4}
        />
        {/* Legs (below garment) */}
        <line x1="22" y1="88" x2="20" y2="100" stroke="currentColor" strokeWidth="0.9" opacity="0.4" />
        <line x1="38" y1="88" x2="40" y2="100" stroke="currentColor" strokeWidth="0.9" opacity="0.4" />
      </svg>
      <div className="text-center">
        <p className={`text-[0.72rem] tracking-[0.1em] font-serif ${highlight ? "text-white" : "text-[#1D1D1F]"}`}>
          {cfg.label}
          {highlight && <span className="ml-1.5 text-[0.55rem] tracking-[0.08em] opacity-70">推薦</span>}
        </p>
        <p className={`text-[0.62rem] mt-0.5 leading-snug ${highlight ? "text-[rgba(255,255,255,0.6)]" : "text-[rgba(0,0,0,0.4)]"}`}>
          {cfg.desc}
        </p>
      </div>
    </div>
  );
}

// Bottom length illustration
function BottomLenSVG({ variant, highlight }: { variant: BottomLength; highlight: boolean }) {
  const cfg = {
    short:    { endY: 60, label: "短版",         desc: "大腿以上，俏皮顯腿" },
    standard: { endY: 76, label: "及膝 / 中長",  desc: "及膝長度，日常百搭" },
    long:     { endY: 92, label: "長版",         desc: "九分至全長，優雅大方" },
  }[variant];

  return (
    <div className={`flex flex-col items-center gap-2 p-3 border transition-colors duration-150 cursor-default ${
      highlight
        ? "border-[#1D1D1F] bg-[#1D1D1F] text-white"
        : "border-[rgba(0,0,0,0.08)] bg-white text-[#1D1D1F] hover:border-[rgba(0,0,0,0.2)]"
    }`}>
      <svg viewBox="0 0 60 100" fill="none" className="w-14 h-20" aria-hidden="true">
        {/* Head + torso */}
        <circle cx="30" cy="8" r="6" stroke="currentColor" strokeWidth="0.9" />
        <path d="M18,22 L42,22 L44,38 L16,38 Z" stroke="currentColor" strokeWidth="0.9"
          fill={highlight ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)"} />
        {/* Waistband */}
        <rect x="15" y="38" width="30" height="5" stroke="currentColor" strokeWidth="0.9"
          fill={highlight ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)"} />
        {/* Full leg dashed reference */}
        <path d="M15,43 L13,95 M45,43 L47,95"
          stroke="currentColor" strokeWidth="0.9" strokeDasharray="2 2" opacity="0.2" />
        {/* Actual bottom length */}
        <path
          d={`M15,43 L13,${cfg.endY} L47,${cfg.endY} L45,43`}
          stroke="currentColor" strokeWidth="0.9"
          fill={highlight ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)"}
        />
        {/* Hemline */}
        <line
          x1="10" y1={cfg.endY} x2="50" y2={cfg.endY}
          stroke="currentColor" strokeWidth="1.2"
          strokeDasharray="3 2"
          opacity={highlight ? 0.6 : 0.4}
        />
      </svg>
      <div className="text-center">
        <p className={`text-[0.72rem] tracking-[0.1em] font-serif ${highlight ? "text-white" : "text-[#1D1D1F]"}`}>
          {cfg.label}
          {highlight && <span className="ml-1.5 text-[0.55rem] tracking-[0.08em] opacity-70">推薦</span>}
        </p>
        <p className={`text-[0.62rem] mt-0.5 leading-snug ${highlight ? "text-[rgba(255,255,255,0.6)]" : "text-[rgba(0,0,0,0.4)]"}`}>
          {cfg.desc}
        </p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SizeGuideClient() {
  // Form state
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [chest, setChest] = useState("");
  const [waist, setWaist] = useState("");
  const [hip, setHip]     = useState("");
  const [showOptional, setShowOptional] = useState(false);

  // Garment selection
  const [garments, setGarments]               = useState<Garment[]>([]);
  const [loadingGarments, setLoadingGarments] = useState(true);
  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(null);

  // UI tab (when no garment)
  const [bodyTab, setBodyTab] = useState<BodyTab>("top");

  // Load garments from API; fallback to demo data
  useEffect(() => {
    fetchGarments()
      .then(setGarments)
      .catch(() => setGarments(DEMO_GARMENTS))
      .finally(() => setLoadingGarments(false));
  }, []);

  const h = parseFloat(height) || 0;
  const w = parseFloat(weight) || 0;
  const hasBody = h >= 100 && w >= 20;
  const analysis: BodyAnalysis | null = hasBody ? analyze(h, w) : null;

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F]">
      <Navbar />

      {/* ── Page header ──────────────────────────────────────── */}
      <div className="pt-28 pb-10 px-8 max-w-5xl mx-auto">
        <p className="text-[0.62rem] tracking-[0.22em] uppercase text-[rgba(0,0,0,0.32)] mb-3">
          智慧尺寸指南
        </p>
        <h1 className="font-serif text-[clamp(2rem,4vw,2.8rem)] font-light tracking-[0.08em] mb-2">
          找到最適合你的尺寸
        </h1>
        <p className="text-[0.85rem] text-[rgba(0,0,0,0.45)] leading-relaxed">
          輸入身體數據，選擇服裝後可獲得該產品的尺寸推薦；不選服裝也可查看上衣與下身的版型效果說明
        </p>
      </div>

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="px-8 pb-20 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-px bg-[rgba(0,0,0,0.06)]">

          {/* ── Left: Form ─────────────────────────────────── */}
          <div className="bg-white px-8 py-10 flex flex-col gap-8">

            {/* Step 1 – body data */}
            <section aria-labelledby="body-data-heading">
              <h2 id="body-data-heading"
                className="flex items-center gap-2 text-[0.62rem] tracking-[0.2em] uppercase text-[rgba(0,0,0,0.38)] mb-5">
                <span className="w-4 h-4 border border-[rgba(0,0,0,0.2)] flex items-center justify-center text-[0.5rem]">1</span>
                身體數據
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-4">
                {[
                  { id: "sg-height", label: "身高 (cm)", ph: "165", val: height, set: setHeight, required: true },
                  { id: "sg-weight", label: "體重 (kg)", ph: "55",  val: weight, set: setWeight, required: true },
                ].map((f) => (
                  <div key={f.id}>
                    <label htmlFor={f.id}
                      className="block text-[0.62rem] tracking-[0.15em] uppercase text-[rgba(0,0,0,0.42)] mb-1.5">
                      {f.label} {f.required && <span className="text-[#1D1D1F]">*</span>}
                    </label>
                    <input id={f.id} type="number" inputMode="decimal"
                      value={f.val}
                      onChange={(e) => f.set(e.target.value)}
                      placeholder={f.ph}
                      className="w-full bg-[#F5F5F7] border border-[rgba(0,0,0,0.08)] px-3 py-3 text-[0.85rem] text-[#1D1D1F] placeholder:text-[rgba(0,0,0,0.22)] focus:outline-none focus:border-[rgba(0,0,0,0.35)] transition-colors duration-150"
                    />
                  </div>
                ))}
              </div>

              {/* Optional toggle */}
              <button
                type="button"
                onClick={() => setShowOptional((v) => !v)}
                className="flex items-center gap-1.5 text-[0.62rem] tracking-[0.1em] uppercase text-[rgba(0,0,0,0.32)] hover:text-[rgba(0,0,0,0.6)] transition-colors duration-150 cursor-pointer mb-4"
                aria-expanded={showOptional}
              >
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"
                  className={`w-3 h-3 transition-transform duration-200 ${showOptional ? "rotate-45" : ""}`}
                  aria-hidden="true">
                  <line x1="7" y1="1" x2="7" y2="13" />
                  <line x1="1" y1="7" x2="13" y2="7" />
                </svg>
                {showOptional ? "收起圍度欄位" : "加入圍度數據（更精準）"}
              </button>

              {showOptional && (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "sg-chest", label: "胸圍", ph: "86", val: chest, set: setChest },
                    { id: "sg-waist", label: "腰圍", ph: "70", val: waist, set: setWaist },
                    { id: "sg-hip",   label: "臀圍", ph: "92", val: hip,   set: setHip   },
                  ].map((f) => (
                    <div key={f.id}>
                      <label htmlFor={f.id}
                        className="block text-[0.6rem] tracking-[0.12em] uppercase text-[rgba(0,0,0,0.35)] mb-1.5">
                        {f.label} (cm)
                      </label>
                      <input id={f.id} type="number" inputMode="decimal"
                        value={f.val}
                        onChange={(e) => f.set(e.target.value)}
                        placeholder={f.ph}
                        className="w-full bg-[#F5F5F7] border border-[rgba(0,0,0,0.08)] px-3 py-2.5 text-[0.82rem] text-[#1D1D1F] placeholder:text-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.35)] transition-colors duration-150"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Analysis preview (appears once body data is valid) */}
              {analysis && (
                <div className="mt-5 border-t border-[rgba(0,0,0,0.06)] pt-5 flex items-center justify-between">
                  <div>
                    <p className="text-[0.6rem] tracking-[0.14em] uppercase text-[rgba(0,0,0,0.32)]">BMI</p>
                    <p className="font-serif text-[1.1rem] font-light">{analysis.bmi.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-[0.6rem] tracking-[0.14em] uppercase text-[rgba(0,0,0,0.32)]">基準尺寸</p>
                    <p className="font-serif text-[1.1rem] font-light">{analysis.size}</p>
                  </div>
                  <div>
                    <p className="text-[0.6rem] tracking-[0.14em] uppercase text-[rgba(0,0,0,0.32)]">推薦版型</p>
                    <p className="font-serif text-[1.1rem] font-light">
                      {{ fitted: "合身", dropped: "落肩", oversized: "寬鬆" }[analysis.shoulder]}
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* Divider */}
            <div className="border-t border-[rgba(0,0,0,0.06)]" />

            {/* Step 2 – garment (optional) */}
            <section aria-labelledby="garment-heading">
              <h2 id="garment-heading"
                className="flex items-center gap-2 text-[0.62rem] tracking-[0.2em] uppercase text-[rgba(0,0,0,0.38)] mb-2">
                <span className="w-4 h-4 border border-[rgba(0,0,0,0.2)] flex items-center justify-center text-[0.5rem]">2</span>
                選擇服裝
                <span className="text-[0.52rem] tracking-[0.1em] text-[rgba(0,0,0,0.28)]">（選填）</span>
              </h2>
              <p className="text-[0.7rem] text-[rgba(0,0,0,0.38)] mb-4 leading-relaxed">
                選擇後顯示該款尺寸推薦；不選則顯示通用版型效果說明
              </p>

              {/* Clear selection */}
              {selectedGarment && (
                <button
                  type="button"
                  onClick={() => setSelectedGarment(null)}
                  className="mb-3 flex items-center gap-1.5 text-[0.62rem] tracking-[0.1em] uppercase text-[rgba(0,0,0,0.35)] hover:text-[#1D1D1F] transition-colors duration-150 cursor-pointer"
                >
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3" aria-hidden="true">
                    <line x1="1" y1="1" x2="13" y2="13" />
                    <line x1="13" y1="1" x2="1" y2="13" />
                  </svg>
                  取消選擇
                </button>
              )}

              {loadingGarments ? (
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="aspect-square bg-[#F5F5F7] animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                  {garments.map((g) => {
                    const isSelected = selectedGarment?.id === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setSelectedGarment(isSelected ? null : g)}
                        aria-pressed={isSelected}
                        className={`aspect-square border flex flex-col items-center justify-center gap-1.5 p-2 cursor-pointer transition-colors duration-150 ${
                          isSelected
                            ? "border-[#1D1D1F] bg-[#1D1D1F] text-white"
                            : "border-[rgba(0,0,0,0.08)] bg-[#F5F5F7] text-[rgba(0,0,0,0.5)] hover:border-[rgba(0,0,0,0.25)]"
                        }`}
                      >
                        {g.image_url ? (
                          <img src={g.image_url} alt={g.name}
                            className="w-8 h-8 object-cover" />
                        ) : (
                          <div className={`w-8 h-8 ${isSelected ? "text-white opacity-60" : "text-[rgba(0,0,0,0.25)]"}`}>
                            <GarmentPlaceholder category={g.category} />
                          </div>
                        )}
                        <p className="text-[0.55rem] tracking-[0.04em] text-center leading-tight line-clamp-2">
                          {g.name}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* ── Right: Result panel ─────────────────────────── */}
          <div className="bg-[#F5F5F7] px-8 py-10">

            {/* Empty state — no body data */}
            {!analysis && (
              <div className="h-full flex flex-col items-center justify-center text-center gap-4 min-h-64 opacity-40">
                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="0.8"
                  className="w-12 h-12 text-[rgba(0,0,0,0.3)]" aria-hidden="true">
                  <circle cx="24" cy="10" r="8" />
                  <path d="M12,24 L8,44 M36,24 L40,44 M16,44 L32,44 M12,24 C12,22 36,22 36,24 L36,44 L12,44 Z" />
                </svg>
                <div>
                  <p className="text-[0.78rem] font-serif font-light tracking-[0.06em] mb-1">請先輸入身體數據</p>
                  <p className="text-[0.68rem] text-[rgba(0,0,0,0.35)] leading-relaxed">
                    填入身高和體重後
                    <br />
                    尺寸分析將顯示在這裡
                  </p>
                </div>
              </div>
            )}

            {/* With body data + garment selected → size recommendation */}
            {analysis && selectedGarment && (() => {
              const chart = STD_CHART;
              const rec = analysis.size;
              return (
                <div className="flex flex-col gap-7">
                  {/* Product header */}
                  <div className="flex items-start gap-4">
                    <div className={`w-16 h-16 border border-[rgba(0,0,0,0.08)] bg-white flex items-center justify-center shrink-0 ${selectedGarment.image_url ? "" : "text-[rgba(0,0,0,0.25)]"}`}>
                      {selectedGarment.image_url ? (
                        <img src={selectedGarment.image_url} alt={selectedGarment.name}
                          className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-10 h-10">
                          <GarmentPlaceholder category={selectedGarment.category} />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-[0.6rem] tracking-[0.16em] uppercase text-[rgba(0,0,0,0.35)] mb-0.5">
                        {selectedGarment.category === "upper_body" ? "上衣" : selectedGarment.category === "lower_body" ? "下身" : "洋裝"}
                      </p>
                      <p className="font-serif text-[1rem] font-light tracking-[0.04em]">{selectedGarment.name}</p>
                    </div>
                  </div>

                  {/* Recommended size hero */}
                  <div className="bg-white border border-[rgba(0,0,0,0.06)] px-6 py-5 flex items-baseline gap-5">
                    <div>
                      <p className="text-[0.58rem] tracking-[0.18em] uppercase text-[rgba(0,0,0,0.35)] mb-0.5">推薦尺寸</p>
                      <p className="font-serif text-[3.5rem] font-light tracking-[0.1em] text-[#1D1D1F] leading-none">{rec}</p>
                    </div>
                    <div className="border-l border-[rgba(0,0,0,0.08)] pl-5 flex flex-col gap-0.5">
                      <p className="text-[0.68rem] text-[rgba(0,0,0,0.45)]">胸圍 {chart[rec].chest} cm</p>
                      <p className="text-[0.68rem] text-[rgba(0,0,0,0.45)]">腰圍 {chart[rec].waist} cm</p>
                      <p className="text-[0.68rem] text-[rgba(0,0,0,0.45)]">臀圍 {chart[rec].hip} cm</p>
                    </div>
                  </div>

                  {/* Full size chart */}
                  <div>
                    <p className="text-[0.6rem] tracking-[0.16em] uppercase text-[rgba(0,0,0,0.32)] mb-2">完整尺寸對照</p>
                    <table className="w-full text-[0.72rem]" aria-label="尺寸對照表">
                      <thead>
                        <tr className="border-b border-[rgba(0,0,0,0.08)]">
                          {["尺寸", "胸圍", "腰圍", "臀圍"].map((h) => (
                            <th key={h} className={`pb-2 font-normal tracking-[0.06em] text-[rgba(0,0,0,0.35)] ${h === "尺寸" ? "text-left" : "text-right"}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {SIZE_ORDER.map((s) => {
                          const isRec = s === rec;
                          return (
                            <tr key={s} className={`border-b border-[rgba(0,0,0,0.04)] ${isRec ? "bg-[#1D1D1F] text-white" : "text-[rgba(0,0,0,0.55)]"}`}>
                              <td className={`py-2 pl-2 font-serif tracking-[0.1em] ${isRec ? "text-white" : ""}`}>
                                {s}{isRec && <span className="ml-1.5 text-[0.52rem] opacity-55">推薦</span>}
                              </td>
                              <td className="py-2 text-right">{chart[s].chest}</td>
                              <td className="py-2 text-right">{chart[s].waist}</td>
                              <td className="py-2 pr-2 text-right">{chart[s].hip}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* CTA */}
                  <Link href="/studio"
                    className="flex items-center justify-between bg-[#1D1D1F] text-white px-6 py-4 no-underline hover:bg-[#3a3a3c] transition-colors duration-150 group">
                    <span className="text-[0.72rem] tracking-[0.14em] uppercase">
                      去試穿這件 {rec} 碼
                    </span>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
                      className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity duration-150" aria-hidden="true">
                      <polyline points="3 8 13 8 10 5" />
                      <polyline points="10 11 13 8" />
                    </svg>
                  </Link>
                  <p className="text-[0.6rem] text-[rgba(0,0,0,0.28)] -mt-4">* 尺寸建議僅供參考，實際版型因款式而異</p>
                </div>
              );
            })()}

            {/* With body data, no garment → style guide */}
            {analysis && !selectedGarment && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <p className="text-[0.72rem] font-serif font-light tracking-[0.06em] text-[rgba(0,0,0,0.5)]">
                    根據你的體型，以下版型效果供參考：
                  </p>
                  {/* Top / Bottom tab */}
                  <div className="flex">
                    {(["top", "bottom"] as BodyTab[]).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setBodyTab(tab)}
                        className={`px-4 py-1.5 text-[0.65rem] tracking-[0.1em] border transition-colors duration-150 cursor-pointer ${
                          bodyTab === tab
                            ? "bg-[#1D1D1F] text-white border-[#1D1D1F]"
                            : "bg-white text-[rgba(0,0,0,0.45)] border-[rgba(0,0,0,0.12)] hover:border-[rgba(0,0,0,0.3)]"
                        }`}
                        aria-pressed={bodyTab === tab}
                      >
                        {tab === "top" ? "上衣" : "下身"}
                      </button>
                    ))}
                  </div>
                </div>

                {bodyTab === "top" && (
                  <div className="flex flex-col gap-6">
                    {/* Shoulder width */}
                    <div>
                      <p className="text-[0.6rem] tracking-[0.18em] uppercase text-[rgba(0,0,0,0.35)] mb-3">
                        肩寬效果
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {(["fitted", "dropped", "oversized"] as ShoulderFit[]).map((v) => (
                          <ShoulderSVG key={v} variant={v} highlight={analysis.shoulder === v} />
                        ))}
                      </div>
                    </div>
                    {/* Hem length */}
                    <div>
                      <p className="text-[0.6rem] tracking-[0.18em] uppercase text-[rgba(0,0,0,0.35)] mb-3">
                        衣長效果
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {(["crop", "standard", "long"] as HemlineType[]).map((v) => (
                          <TopHemSVG key={v} variant={v} highlight={analysis.topHem === v} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {bodyTab === "bottom" && (
                  <div>
                    <p className="text-[0.6rem] tracking-[0.18em] uppercase text-[rgba(0,0,0,0.35)] mb-3">
                      長度效果
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {(["short", "standard", "long"] as BottomLength[]).map((v) => (
                        <BottomLenSVG key={v} variant={v} highlight={analysis.bottomLen === v} />
                      ))}
                    </div>
                    <p className="mt-4 text-[0.65rem] text-[rgba(0,0,0,0.35)] leading-relaxed">
                      建議選擇服裝後，可獲得更精準的尺寸對照表。
                    </p>
                  </div>
                )}

                {/* Prompt to try on */}
                <Link href="/studio"
                  className="mt-2 flex items-center justify-between border border-[rgba(0,0,0,0.12)] bg-white px-6 py-4 no-underline hover:border-[#1D1D1F] transition-colors duration-150 group cursor-pointer">
                  <span className="text-[0.72rem] tracking-[0.12em] uppercase text-[rgba(0,0,0,0.55)] group-hover:text-[#1D1D1F] transition-colors duration-150">
                    或直接進入試衣間
                  </span>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
                    className="w-4 h-4 text-[rgba(0,0,0,0.3)] group-hover:text-[#1D1D1F] transition-colors duration-150" aria-hidden="true">
                    <polyline points="3 8 13 8 10 5" />
                    <polyline points="10 11 13 8" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
