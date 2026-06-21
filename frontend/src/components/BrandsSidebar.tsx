"use client";

export default function BrandsSidebar() {
  return (
    <aside className="bg-white border-r border-[var(--forma-border)] flex flex-col items-center justify-center px-6">
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border border-[var(--forma-border)] flex items-center justify-center mx-auto mb-4">
          <svg viewBox="0 0 20 20" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="1.4" className="w-5 h-5">
            <path d="M6 2 3 6v12a2 2 0 002 2h10a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="17" y2="6" />
            <path d="M13 10a3 3 0 01-6 0" />
          </svg>
        </div>
        <p className="text-[0.75rem] font-medium text-[#1D1D1F] mb-1.5">品牌與分類篩選</p>
        <p className="text-[0.62rem] text-[rgba(0,0,0,0.38)] leading-relaxed">
          合作品牌上線後<br />即可在此瀏覽選購
        </p>
        <div className="mt-4 inline-block text-[0.55rem] tracking-[0.08em] text-[rgba(0,0,0,0.28)] border border-[rgba(0,0,0,0.12)] px-2.5 py-1 rounded">
          即將推出
        </div>
      </div>
    </aside>
  );
}
