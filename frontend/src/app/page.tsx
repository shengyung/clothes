import Link from "next/link";
import SizeFinder from "@/components/SizeFinder";
import Navbar from "@/components/Navbar";

// ─── Data ─────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    num: "01",
    title: "上傳人像",
    desc: "選一張全身正面照，建議光線均勻、背景乾淨",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        className="w-7 h-7"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="12" cy="10" r="3" />
        <path d="M6 21v-1a6 6 0 0 1 12 0v1" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "挑選服裝",
    desc: "從 Uniqlo、H&M、Zara 等品牌的最新款式中選擇",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        className="w-7 h-7"
        aria-hidden="true"
      >
        <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "即時試穿",
    desc: "30 秒內生成高真實感的效果圖，看見衣服穿上身的樣子",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        className="w-7 h-7"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4l3 2" />
      </svg>
    ),
  },
];

const FEATURES = [
  {
    title: "高精度試穿引擎",
    desc: "精準還原布料垂墜、皺褶與身形輪廓，讓每張試穿圖都像真實拍攝",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        className="w-6 h-6"
        aria-hidden="true"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    title: "多品牌服裝庫",
    desc: "Uniqlo、H&M、Zara 等主流品牌持續更新，每週新增百款服裝",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        className="w-6 h-6"
        aria-hidden="true"
      >
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  {
    title: "尺寸智慧推薦",
    desc: "輸入身高、體重、胸圍，自動分析體型給出最合身的尺寸建議",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        className="w-6 h-6"
        aria-hidden="true"
      >
        <rect x="2" y="7" width="20" height="10" rx="2" />
        <line x1="7" y1="7" x2="7" y2="12" />
        <line x1="12" y1="7" x2="12" y2="10" />
        <line x1="17" y1="7" x2="17" y2="12" />
      </svg>
    ),
  },
  {
    title: "歷史記錄保存",
    desc: "登入後所有試穿記錄自動保存，隨時回顧、比較不同穿搭方案",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        className="w-6 h-6"
        aria-hidden="true"
      >
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
  {
    title: "隱私安全保障",
    desc: "照片僅用於本次試穿生成，不用於訓練模型，可隨時刪除",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        className="w-6 h-6"
        aria-hidden="true"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    title: "完全免費使用",
    desc: "無需訂閱、無需信用卡，匿名即可立即試穿，享受完整功能",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        className="w-6 h-6"
        aria-hidden="true"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
];

const STATS = [
  { num: "30s", label: "平均生成時間" },
  { num: "500+", label: "服裝款式" },
  { num: "6+", label: "合作品牌" },
];


// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F]">
      <Navbar />

      {/* ── Hero ───────────────────────────────────────────── */}
      <section
        className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden pt-20"
        aria-label="主視覺"
      >
        <div className="flex flex-col items-center text-center gap-8 px-6 max-w-3xl">
          {/* Eyebrow */}
          <p className="text-[0.62rem] tracking-[0.22em] uppercase text-[rgba(0,0,0,0.32)]">
            虛擬試衣間
          </p>

          {/* Headline */}
          <h1 className="font-serif text-[clamp(3.5rem,10vw,6rem)] font-light tracking-[0.1em] text-[#1D1D1F] leading-[0.95]">
            Shape<span className="italic text-[#6E6E73]">OnYou</span>
          </h1>

          <p className="text-[clamp(1rem,2.5vw,1.2rem)] font-light tracking-[0.03em] text-[rgba(0,0,0,0.5)] leading-relaxed max-w-md">
            上傳照片，30 秒看見真實的自己。
            <br />
            每一個購物決策，從此更有把握。
          </p>

          {/* CTA group */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
            <Link
              href="/studio"
              className="bg-[#1D1D1F] text-white px-14 py-4 text-[0.8rem] tracking-[0.16em] uppercase no-underline transition-colors duration-200 hover:bg-[#3a3a3c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D1D1F]"
            >
              免費立即試穿
            </Link>
            <a
              href="#how-it-works"
              className="text-[0.75rem] tracking-[0.1em] uppercase text-[rgba(0,0,0,0.4)] hover:text-[#1D1D1F] transition-colors duration-200 cursor-pointer flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D1D1F]"
            >
              了解如何使用
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="w-3.5 h-3.5"
                aria-hidden="true"
              >
                <polyline points="3 8 13 8 10 5" />
                <polyline points="10 11 13 8" />
              </svg>
            </a>
          </div>

          {/* Trust indicators */}
          <p className="text-[0.7rem] tracking-[0.08em] text-[rgba(0,0,0,0.28)]">
            免費使用 &nbsp;·&nbsp; 無需登入 &nbsp;·&nbsp; 30 秒出結果
            &nbsp;·&nbsp; 不儲存個人資料
          </p>
        </div>

        {/* Visual: mock before/after cards */}
        <div className="mt-20 flex items-end justify-center gap-4 px-6 w-full max-w-2xl mx-auto">
          {/* Before card */}
          <div className="flex-1 max-w-[180px] bg-white border border-[rgba(0,0,0,0.07)] shadow-sm overflow-hidden">
            <div className="aspect-[3/4] bg-[#F5F5F7] flex items-center justify-center">
              <svg
                viewBox="0 0 80 120"
                fill="none"
                className="w-20 opacity-20"
                aria-hidden="true"
              >
                <rect
                  x="25"
                  y="10"
                  width="30"
                  height="35"
                  rx="15"
                  fill="#1D1D1F"
                />
                <path d="M10 55h60l-5 55H15L10 55z" fill="#1D1D1F" />
                <rect
                  x="15"
                  y="55"
                  width="15"
                  height="40"
                  rx="3"
                  fill="#6E6E73"
                />
                <rect
                  x="50"
                  y="55"
                  width="15"
                  height="40"
                  rx="3"
                  fill="#6E6E73"
                />
              </svg>
            </div>
            <div className="px-3 py-2 border-t border-[rgba(0,0,0,0.05)]">
              <p className="text-[0.6rem] tracking-[0.12em] uppercase text-[rgba(0,0,0,0.3)]">
                上傳照片
              </p>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex-shrink-0 mb-8">
            <svg
              viewBox="0 0 32 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="w-8 h-4 text-[rgba(0,0,0,0.2)]"
              aria-hidden="true"
            >
              <path d="M0 8h28M22 2l10 6-10 6" />
            </svg>
          </div>

          {/* After card */}
          <div className="flex-1 max-w-[180px] bg-white border border-[#1D1D1F] shadow-md overflow-hidden">
            <div className="aspect-[3/4] bg-gradient-to-b from-[#F5F5F7] to-white flex items-center justify-center relative">
              <svg
                viewBox="0 0 80 120"
                fill="none"
                className="w-20 opacity-30"
                aria-hidden="true"
              >
                <rect
                  x="25"
                  y="10"
                  width="30"
                  height="35"
                  rx="15"
                  fill="#1D1D1F"
                />
                <path d="M10 55h60l-5 55H15L10 55z" fill="#6E6E73" />
                <rect
                  x="8"
                  y="55"
                  width="18"
                  height="38"
                  rx="4"
                  fill="#1D1D1F"
                />
                <rect
                  x="54"
                  y="55"
                  width="18"
                  height="38"
                  rx="4"
                  fill="#1D1D1F"
                />
                <rect
                  x="15"
                  y="48"
                  width="50"
                  height="14"
                  rx="3"
                  fill="#1D1D1F"
                />
              </svg>
              <div className="absolute bottom-2 right-2 bg-[#1D1D1F] text-white text-[0.55rem] tracking-[0.1em] px-2 py-1 uppercase">
                試穿效果
              </div>
            </div>
            <div className="px-3 py-2 border-t border-[rgba(0,0,0,0.1)]">
              <p className="text-[0.6rem] tracking-[0.12em] uppercase text-[rgba(0,0,0,0.5)]">
                試穿效果
              </p>
            </div>
          </div>
        </div>

      </section>

      {/* ── Brands strip (hidden: personal use only) ──────── */}

      {/* ── How It Works ───────────────────────────────────── */}
      <section
        id="how-it-works"
        className="py-32 px-6 bg-[#F5F5F7]"
        aria-labelledby="how-heading"
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-[0.65rem] tracking-[0.22em] uppercase text-[rgba(0,0,0,0.32)] mb-3">
              使用方式
            </p>
            <h2
              id="how-heading"
              className="font-serif text-[clamp(1.8rem,4vw,2.4rem)] font-light tracking-[0.08em]"
            >
              三步驟，輕鬆試穿
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 relative">
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                className="relative flex flex-col items-center text-center"
              >
                {/* Connector line (between cards) */}
                {i < STEPS.length - 1 && (
                  <div
                    className="hidden md:block absolute top-12 left-[calc(50%+3rem)] w-[calc(100%-6rem)]"
                    aria-hidden="true"
                  >
                    {/* seam-guide connector: a nod to the pattern-cutting lines of garment-making */}
                    <div className="w-full border-t border-dashed border-[rgba(0,0,0,0.18)]" />
                    <div className="absolute -top-[5px] left-0 w-px h-[10px] bg-[rgba(0,0,0,0.25)]" />
                    <div className="absolute -top-[5px] right-0 w-px h-[10px] bg-[rgba(0,0,0,0.25)]" />
                  </div>
                )}

                {/* Card */}
                <div className="bg-white border border-[rgba(0,0,0,0.06)] px-8 py-10 w-full flex flex-col items-center gap-5 hover:border-[rgba(0,0,0,0.15)] transition-colors duration-200">
                  <div className="flex items-center gap-3">
                    <span className="font-serif text-[0.65rem] tracking-[0.2em] text-[rgba(0,0,0,0.3)]">
                      {step.num}
                    </span>
                    <div className="text-[rgba(0,0,0,0.4)]">{step.icon}</div>
                  </div>
                  <div>
                    <h3 className="font-serif text-[1.05rem] font-light tracking-[0.06em] mb-2">
                      {step.title}
                    </h3>
                    <p className="text-[0.78rem] text-[rgba(0,0,0,0.45)] leading-relaxed tracking-[0.02em]">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-14">
            <Link
              href="/studio"
              className="inline-block bg-[#1D1D1F] text-white px-12 py-4 text-[0.78rem] tracking-[0.16em] uppercase no-underline transition-colors duration-200 hover:bg-[#3a3a3c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D1D1F]"
            >
              開始試穿
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────── */}
      <section className="bg-[#1D1D1F] py-20 px-6" aria-label="平台數據">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-8 text-center">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col gap-2">
              <span className="font-serif text-[clamp(2rem,5vw,3rem)] font-light tracking-[0.08em] text-white">
                {s.num}
              </span>
              <span className="text-[0.68rem] tracking-[0.14em] uppercase text-[rgba(255,255,255,0.4)]">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section
        id="features"
        className="bg-white py-32 px-6"
        aria-labelledby="features-heading"
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-[0.65rem] tracking-[0.22em] uppercase text-[rgba(0,0,0,0.32)] mb-3">
              功能特色
            </p>
            <h2
              id="features-heading"
              className="font-serif text-[clamp(1.8rem,4vw,2.4rem)] font-light tracking-[0.08em]"
            >
              穿搭，從此不再猜測
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[rgba(0,0,0,0.06)]">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white px-8 py-10 flex flex-col gap-4 hover:bg-[#F5F5F7] transition-colors duration-200 group"
              >
                <div className="text-[rgba(0,0,0,0.35)] group-hover:text-[rgba(0,0,0,0.6)] transition-colors duration-200">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-serif text-[1rem] font-light tracking-[0.05em] text-[#1D1D1F] mb-2">
                    {f.title}
                  </h3>
                  <p className="text-[0.78rem] text-[rgba(0,0,0,0.45)] leading-relaxed tracking-[0.01em]">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Size Finder ────────────────────────────────────── */}
      <SizeFinder />

      {/* ── Final CTA ──────────────────────────────────────── */}
      <section
        className="py-36 px-6 bg-[#F5F5F7] text-center relative overflow-hidden"
        aria-label="行動呼籲"
      >
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-8">
          <div className="border border-[rgba(0,0,0,0.1)] px-4 py-1.5 text-[0.65rem] tracking-[0.2em] uppercase text-[rgba(0,0,0,0.35)]">
            免費 · 無需登入
          </div>

          <h2 className="font-serif text-[clamp(2.2rem,6vw,3.8rem)] font-light tracking-[0.08em] text-[#1D1D1F] leading-tight">
            試穿，比想像
            <br />
            <span className="italic text-[#6E6E73]">更真實</span>
          </h2>

          <p className="text-[0.9rem] font-light tracking-[0.03em] text-[rgba(0,0,0,0.45)] leading-relaxed max-w-sm">
            不再猜測衣服穿上身的樣子。 上傳一張照片，ShapeOnYou 幫你在 30
            秒內看見答案。
          </p>

          <Link
            href="/studio"
            className="mt-2 bg-[#1D1D1F] text-white px-16 py-5 text-[0.82rem] tracking-[0.18em] uppercase no-underline transition-colors duration-200 hover:bg-[#3a3a3c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D1D1F]"
          >
            立即免費試穿
          </Link>

          <p className="text-[0.68rem] tracking-[0.08em] text-[rgba(0,0,0,0.25)]">
            無需信用卡 · 無需訂閱 · 永久免費
          </p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="bg-[#1D1D1F] py-10 px-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-serif text-[1.1rem] font-light tracking-[0.15em] text-white">
            ShapeOn<span className="text-[#6E6E73]">You</span>
          </span>

          <nav className="flex items-center gap-6" aria-label="頁尾導覽">
            <Link
              href="/studio"
              className="text-[0.68rem] tracking-[0.12em] uppercase text-[rgba(255,255,255,0.4)] hover:text-white transition-colors duration-200 no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              試衣間
            </Link>
            <Link
              href="/login"
              className="text-[0.68rem] tracking-[0.12em] uppercase text-[rgba(255,255,255,0.4)] hover:text-white transition-colors duration-200 no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              登入
            </Link>
          </nav>

          <p className="text-[0.62rem] tracking-[0.06em] text-[rgba(255,255,255,0.25)]">
            © 2025 ShapeOnYou. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
