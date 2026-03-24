"use client";

import { useEffect, useState } from "react";
import { fetchGarments, Garment } from "@/lib/api";

interface ClothesPanelProps {
  selectedGarmentId: string | null;
  onSelectGarment: (id: string) => void;
  hasPersonImage: boolean;
  onTryOn: () => void;
}

export default function ClothesPanel({
  selectedGarmentId,
  onSelectGarment,
  hasPersonImage,
  onTryOn,
}: ClothesPanelProps) {
  const [garments, setGarments] = useState<Garment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGarments()
      .then(setGarments)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const canTryOn = !!selectedGarmentId && hasPersonImage;

  return (
    <aside className="backdrop-blur-xl bg-warm-white border-l border-[var(--forma-border)] overflow-y-auto p-7 flex flex-col gap-5">
      {/* Header with action buttons */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--forma-border)]">
        <div className="font-serif text-[1.1rem] font-normal text-cream tracking-[0.05em]">
          選擇服裝
        </div>
        <div className="flex gap-2">
          <button className="bg-transparent border border-[var(--forma-border)] text-taupe px-3 py-1.5 font-sans text-[0.72rem] tracking-[0.08em] uppercase cursor-pointer transition-all hover:border-black/30 hover:text-cream">
            匯入衣物
          </button>
          <button className="bg-forma-accent-dark text-white border-none px-3 py-1.5 font-sans text-[0.72rem] tracking-[0.08em] uppercase cursor-pointer transition-colors hover:bg-forma-accent">
            儲存造型
          </button>
        </div>
      </div>

      {/* Garments from API */}
      {loading && (
        <p className="text-center text-taupe text-sm">載入服裝中...</p>
      )}
      {error && (
        <p className="text-center text-red-400 text-sm">載入失敗: {error}</p>
      )}

      {!loading && !error && garments.length > 0 && (
        <div>
          <div className="text-[0.7rem] tracking-[0.1em] uppercase text-taupe mb-2">
            服裝列表
          </div>
          <div className="grid grid-cols-2 gap-[10px]">
            {garments.map((g) => (
              <button
                key={g.id}
                onClick={() => onSelectGarment(g.id)}
                className={`aspect-[3/4] bg-white border cursor-pointer overflow-hidden relative transition-all flex flex-col items-center justify-center hover:border-forma-accent-dark hover:scale-[1.02] ${
                  selectedGarmentId === g.id
                    ? "border-forma-accent-dark border-2"
                    : "border-[var(--forma-border)]"
                }`}
              >
                {g.image_url ? (
                  <img
                    src={g.image_url}
                    alt={g.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[2.2rem] opacity-50">👔</span>
                )}
                <span className="absolute bottom-1.5 left-0 right-0 text-center text-[0.62rem] tracking-[0.08em] uppercase text-taupe">
                  {g.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="h-px bg-[var(--forma-border)]" />

      {/* Recommendation */}
      <div>
        <div className="text-[0.7rem] tracking-[0.1em] uppercase text-taupe mb-2">
          匹配建議
        </div>
        <div className="text-[0.75rem] text-taupe leading-relaxed">
          根據您的體型，推薦{" "}
          <strong className="text-cream">修身直筒剪裁</strong>，搭配{" "}
          <strong className="text-cream">高腰設計</strong>{" "}
          可拉長腿部比例。
        </div>
      </div>

      {/* Try-on button */}
      <button
        onClick={onTryOn}
        disabled={!canTryOn}
        className="w-full bg-forma-accent-dark text-white border-none py-[13px] font-sans text-[0.8rem] tracking-[0.12em] uppercase cursor-pointer transition-colors hover:bg-forma-accent disabled:opacity-30 disabled:cursor-not-allowed mt-2"
      >
        {!hasPersonImage
          ? "請先上傳照片"
          : !selectedGarmentId
            ? "請選擇服裝"
            : "✦ 立即試穿"}
      </button>
    </aside>
  );
}
