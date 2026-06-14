"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Types & data ─────────────────────────────────────────────────────────────

type Brand = "Uniqlo" | "H&M" | "Zara" | "Mango" | "COS";
type SizeKey = "XS" | "S" | "M" | "L" | "XL";

const BRANDS: Brand[] = ["Uniqlo", "H&M", "Zara", "Mango", "COS"];

const SIZE_CHART: Record<Brand, Record<SizeKey, { chest: string; waist: string; hip: string }>> = {
  Uniqlo: {
    XS: { chest: "76–80", waist: "60–64", hip: "84–88" },
    S:  { chest: "80–84", waist: "64–68", hip: "88–92" },
    M:  { chest: "84–88", waist: "68–72", hip: "92–96" },
    L:  { chest: "88–94", waist: "72–78", hip: "96–102" },
    XL: { chest: "94–100", waist: "78–84", hip: "102–108" },
  },
  "H&M": {
    XS: { chest: "78–82", waist: "62–66", hip: "86–90" },
    S:  { chest: "82–86", waist: "66–70", hip: "90–94" },
    M:  { chest: "86–90", waist: "70–74", hip: "94–98" },
    L:  { chest: "90–96", waist: "74–80", hip: "98–104" },
    XL: { chest: "96–102", waist: "80–86", hip: "104–110" },
  },
  Zara: {
    XS: { chest: "78–82", waist: "62–66", hip: "86–90" },
    S:  { chest: "82–86", waist: "66–70", hip: "90–94" },
    M:  { chest: "86–91", waist: "70–75", hip: "94–99" },
    L:  { chest: "91–97", waist: "75–81", hip: "99–105" },
    XL: { chest: "97–103", waist: "81–87", hip: "105–111" },
  },
  Mango: {
    XS: { chest: "78–82", waist: "62–66", hip: "86–90" },
    S:  { chest: "82–86", waist: "66–70", hip: "90–94" },
    M:  { chest: "86–91", waist: "70–75", hip: "94–99" },
    L:  { chest: "91–97", waist: "75–81", hip: "99–105" },
    XL: { chest: "97–103", waist: "81–87", hip: "105–111" },
  },
  COS: {
    XS: { chest: "76–80", waist: "60–64", hip: "84–88" },
    S:  { chest: "80–84", waist: "64–68", hip: "88–92" },
    M:  { chest: "84–88", waist: "68–72", hip: "92–96" },
    L:  { chest: "88–94", waist: "72–78", hip: "96–102" },
    XL: { chest: "94–100", waist: "78–84", hip: "102–108" },
  },
};

const SIZE_ORDER: SizeKey[] = ["XS", "S", "M", "L", "XL"];

// ─── Size calculation (demo logic) ───────────────────────────────────────────

function calcSize(height: number, weight: number, brand: Brand): SizeKey {
  const bmi = weight / (height / 100) ** 2;

  let idx = 2; // default M
  if (height < 157) idx = 0;
  else if (height < 162) idx = 1;
  else if (height < 170) idx = 2;
  else if (height < 176) idx = 3;
  else idx = 4;

  if (bmi < 17.5) idx -= 1;
  else if (bmi >= 22 && bmi < 25) idx += 1;
  else if (bmi >= 25 && bmi < 28) idx += 2;
  else if (bmi >= 28) idx += 3;

  // Uniqlo & COS use Japanese/Scandinavian sizing — runs 1 size smaller
  if (brand === "Uniqlo" || brand === "COS") idx += 1;

  return SIZE_ORDER[Math.min(Math.max(idx, 0), SIZE_ORDER.length - 1)];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SizeFinder() {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [chest, setChest] = useState("");
  const [waist, setWaist] = useState("");
  const [hip, setHip] = useState("");
  const [brand, setBrand] = useState<Brand>("Uniqlo");
  const [showOptional, setShowOptional] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SizeKey | null>(null);

  const canSubmit = height.trim() !== "" && weight.trim() !== "" && !loading;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setResult(null);

    // Fake async delay for UX — real API call goes here later
    setTimeout(() => {
      setResult(calcSize(Number(height), Number(weight), brand));
      setLoading(false);
    }, 400);
  }

  const chart = SIZE_CHART[brand];

  return (
    <section
      id="size-finder"
      className="bg-white py-32 px-6"
      aria-labelledby="size-heading"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-[0.65rem] tracking-[0.22em] uppercase text-[rgba(0,0,0,0.32)] mb-3">
            智慧尺寸推薦
          </p>
          <h2
            id="size-heading"
            className="font-serif text-[clamp(1.8rem,4vw,2.4rem)] font-light tracking-[0.08em]"
          >
            先找尺寸，再試穿
          </h2>
          <p className="mt-4 text-[0.82rem] text-[rgba(0,0,0,0.45)] leading-relaxed max-w-sm mx-auto">
            輸入身體數據，AI 根據品牌版型幫你找到最合身的尺寸
          </p>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-[rgba(0,0,0,0.06)]">

          {/* ── Left: Form ────────────────────────────────── */}
          <div className="bg-white px-10 py-12">
            <form onSubmit={handleSubmit} noValidate>

              {/* Brand selector */}
              <fieldset className="mb-8">
                <legend className="text-[0.65rem] tracking-[0.18em] uppercase text-[rgba(0,0,0,0.45)] mb-3">
                  品牌
                </legend>
                <div className="flex flex-wrap gap-2">
                  {BRANDS.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => { setBrand(b); setResult(null); }}
                      className={`px-4 py-1.5 text-[0.72rem] tracking-[0.1em] border transition-colors duration-150 cursor-pointer ${
                        brand === b
                          ? "bg-[#1D1D1F] text-white border-[#1D1D1F]"
                          : "bg-transparent text-[rgba(0,0,0,0.55)] border-[rgba(0,0,0,0.15)] hover:border-[rgba(0,0,0,0.4)]"
                      }`}
                      aria-pressed={brand === b}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </fieldset>

              {/* Required measurements */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label
                    htmlFor="sf-height"
                    className="block text-[0.65rem] tracking-[0.15em] uppercase text-[rgba(0,0,0,0.45)] mb-2"
                  >
                    身高 (cm) <span className="text-[#1D1D1F]">*</span>
                  </label>
                  <input
                    id="sf-height"
                    type="number"
                    inputMode="decimal"
                    min={100}
                    max={230}
                    value={height}
                    onChange={(e) => { setHeight(e.target.value); setResult(null); }}
                    placeholder="例：165"
                    required
                    className="w-full bg-[#F5F5F7] border border-[rgba(0,0,0,0.08)] px-4 py-3 text-[0.85rem] text-[#1D1D1F] placeholder:text-[rgba(0,0,0,0.25)] focus:outline-none focus:border-[rgba(0,0,0,0.4)] transition-colors duration-150"
                  />
                </div>
                <div>
                  <label
                    htmlFor="sf-weight"
                    className="block text-[0.65rem] tracking-[0.15em] uppercase text-[rgba(0,0,0,0.45)] mb-2"
                  >
                    體重 (kg) <span className="text-[#1D1D1F]">*</span>
                  </label>
                  <input
                    id="sf-weight"
                    type="number"
                    inputMode="decimal"
                    min={30}
                    max={200}
                    value={weight}
                    onChange={(e) => { setWeight(e.target.value); setResult(null); }}
                    placeholder="例：55"
                    required
                    className="w-full bg-[#F5F5F7] border border-[rgba(0,0,0,0.08)] px-4 py-3 text-[0.85rem] text-[#1D1D1F] placeholder:text-[rgba(0,0,0,0.25)] focus:outline-none focus:border-[rgba(0,0,0,0.4)] transition-colors duration-150"
                  />
                </div>
              </div>

              {/* Optional toggle */}
              <button
                type="button"
                onClick={() => setShowOptional((v) => !v)}
                className="flex items-center gap-2 text-[0.68rem] tracking-[0.1em] uppercase text-[rgba(0,0,0,0.35)] hover:text-[rgba(0,0,0,0.6)] transition-colors duration-150 cursor-pointer mb-4"
                aria-expanded={showOptional}
              >
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${showOptional ? "rotate-45" : ""}`}
                  aria-hidden="true"
                >
                  <line x1="8" y1="2" x2="8" y2="14" />
                  <line x1="2" y1="8" x2="14" y2="8" />
                </svg>
                {showOptional ? "收起選填欄位" : "加入圍度數據（更準確）"}
              </button>

              {/* Optional fields */}
              {showOptional && (
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { id: "sf-chest", label: "胸圍", placeholder: "88", value: chest, set: setChest },
                    { id: "sf-waist", label: "腰圍", placeholder: "70", value: waist, set: setWaist },
                    { id: "sf-hip",   label: "臀圍", placeholder: "94", value: hip,   set: setHip   },
                  ].map((f) => (
                    <div key={f.id}>
                      <label
                        htmlFor={f.id}
                        className="block text-[0.62rem] tracking-[0.12em] uppercase text-[rgba(0,0,0,0.38)] mb-1.5"
                      >
                        {f.label} (cm)
                      </label>
                      <input
                        id={f.id}
                        type="number"
                        inputMode="decimal"
                        min={40}
                        max={180}
                        value={f.value}
                        onChange={(e) => { f.set(e.target.value); setResult(null); }}
                        placeholder={f.placeholder}
                        className="w-full bg-[#F5F5F7] border border-[rgba(0,0,0,0.08)] px-3 py-2.5 text-[0.82rem] text-[#1D1D1F] placeholder:text-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.4)] transition-colors duration-150"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full py-4 text-[0.78rem] tracking-[0.16em] uppercase transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2
                  bg-[#1D1D1F] text-white hover:bg-[#3a3a3c] disabled:bg-[rgba(0,0,0,0.12)] disabled:text-[rgba(0,0,0,0.3)]"
              >
                {loading ? (
                  <>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="w-4 h-4 animate-spin"
                      aria-hidden="true"
                    >
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    計算中…
                  </>
                ) : (
                  "查詢推薦尺寸"
                )}
              </button>
            </form>
          </div>

          {/* ── Right: Result ─────────────────────────────── */}
          <div className="bg-[#F5F5F7] px-10 py-12 flex flex-col">
            {!result && !loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 opacity-40">
                <svg
                  viewBox="0 0 48 48"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="w-12 h-12 text-[rgba(0,0,0,0.3)]"
                  aria-hidden="true"
                >
                  <rect x="8" y="14" width="32" height="20" rx="2" />
                  <line x1="16" y1="14" x2="16" y2="24" />
                  <line x1="24" y1="14" x2="24" y2="20" />
                  <line x1="32" y1="14" x2="32" y2="24" />
                  <line x1="8" y1="34" x2="40" y2="34" />
                </svg>
                <p className="text-[0.75rem] tracking-[0.06em] text-[rgba(0,0,0,0.4)] leading-relaxed">
                  填入身體數據後
                  <br />
                  推薦尺寸將顯示在這裡
                </p>
              </div>
            )}

            {loading && (
              <div className="flex-1 flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="w-8 h-8 animate-spin text-[rgba(0,0,0,0.3)]"
                  aria-hidden="true"
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </div>
            )}

            {result && !loading && (
              <div className="flex flex-col gap-8">
                {/* Recommended size callout */}
                <div className="flex items-baseline gap-4">
                  <div>
                    <p className="text-[0.62rem] tracking-[0.18em] uppercase text-[rgba(0,0,0,0.38)] mb-1">
                      {brand} 推薦尺寸
                    </p>
                    <p className="font-serif text-[4rem] font-light tracking-[0.12em] text-[#1D1D1F] leading-none">
                      {result}
                    </p>
                  </div>
                  <div className="flex-1 border-l border-[rgba(0,0,0,0.1)] pl-4">
                    <p className="text-[0.68rem] text-[rgba(0,0,0,0.45)] leading-relaxed">
                      胸圍 {chart[result].chest} cm
                    </p>
                    <p className="text-[0.68rem] text-[rgba(0,0,0,0.45)] leading-relaxed">
                      腰圍 {chart[result].waist} cm
                    </p>
                    <p className="text-[0.68rem] text-[rgba(0,0,0,0.45)] leading-relaxed">
                      臀圍 {chart[result].hip} cm
                    </p>
                  </div>
                </div>

                {/* Size chart table */}
                <div>
                  <p className="text-[0.6rem] tracking-[0.16em] uppercase text-[rgba(0,0,0,0.32)] mb-2">
                    {brand} 完整尺寸對照
                  </p>
                  <table className="w-full text-[0.72rem]" aria-label={`${brand} 尺寸對照表`}>
                    <thead>
                      <tr className="border-b border-[rgba(0,0,0,0.08)]">
                        <th className="text-left pb-2 font-normal tracking-[0.08em] text-[rgba(0,0,0,0.35)]">尺寸</th>
                        <th className="text-right pb-2 font-normal tracking-[0.08em] text-[rgba(0,0,0,0.35)]">胸圍</th>
                        <th className="text-right pb-2 font-normal tracking-[0.08em] text-[rgba(0,0,0,0.35)]">腰圍</th>
                        <th className="text-right pb-2 font-normal tracking-[0.08em] text-[rgba(0,0,0,0.35)]">臀圍</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SIZE_ORDER.map((s) => {
                        const isRec = s === result;
                        return (
                          <tr
                            key={s}
                            className={`border-b border-[rgba(0,0,0,0.05)] ${
                              isRec ? "bg-[#1D1D1F] text-white" : "text-[rgba(0,0,0,0.55)]"
                            }`}
                          >
                            <td className={`py-2 pl-2 font-serif tracking-[0.1em] ${isRec ? "text-white" : ""}`}>
                              {s}
                              {isRec && (
                                <span className="ml-1.5 text-[0.55rem] tracking-[0.12em] opacity-60">推薦</span>
                              )}
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
                <Link
                  href="/studio"
                  className="flex items-center justify-between bg-[#1D1D1F] text-white px-6 py-4 no-underline hover:bg-[#3a3a3c] transition-colors duration-150 group"
                >
                  <span className="text-[0.75rem] tracking-[0.14em] uppercase">
                    去試穿 {brand} {result} 碼衣服
                  </span>
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity duration-150"
                    aria-hidden="true"
                  >
                    <polyline points="3 8 13 8 10 5" />
                    <polyline points="10 11 13 8" />
                  </svg>
                </Link>

                <p className="text-[0.62rem] text-[rgba(0,0,0,0.3)] tracking-[0.04em]">
                  * 尺寸建議僅供參考，實際版型因款式而異
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
