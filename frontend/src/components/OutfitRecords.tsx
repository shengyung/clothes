"use client";

import { useEffect, useRef, useState } from "react";
import { fetchTryonHistory, TryonResult } from "@/lib/api";
import { getToken } from "@/lib/auth";

interface OutfitRecordsProps {
  refreshTrigger?: number;
}

function timeAgo(dateStr: string): string {
  const utcStr = dateStr.endsWith("Z") || dateStr.includes("+") ? dateStr : dateStr + "Z";
  const diff = Date.now() - new Date(utcStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "剛剛";
  if (mins < 60) return `${mins} 分鐘前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} 小時前`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} 天前`;
  return `${Math.floor(days / 7)} 週前`;
}

export default function OutfitRecords({ refreshTrigger }: OutfitRecordsProps) {
  const [records, setRecords] = useState<TryonResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [enlarged, setEnlarged] = useState<TryonResult | null>(null);
  const prevTrigger = useRef<number | undefined>(undefined);

  useEffect(() => {
    setIsLoggedIn(!!getToken());
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    // 首次載入，或 refreshTrigger 變化時重新抓
    if (prevTrigger.current === refreshTrigger && prevTrigger.current !== undefined) return;
    prevTrigger.current = refreshTrigger;
    loadHistory();
  }, [isLoggedIn, refreshTrigger]);

  async function loadHistory() {
    setLoading(true);
    try {
      const data = await fetchTryonHistory();
      setRecords(data);
    } catch {
      // 未登入或 API 錯誤，靜默忽略
    } finally {
      setLoading(false);
    }
  }

  function toggleLike(id: string) {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      <aside className="bg-white border-l border-[var(--forma-border)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-[var(--forma-border)] flex items-center justify-between shrink-0">
          <span className="text-[0.78rem] font-medium text-[#1D1D1F]">我的穿搭紀錄</span>
          <button
            onClick={loadHistory}
            className="text-[0.62rem] text-[#6E6E73] hover:text-[#1D1D1F] transition-colors"
          >
            重新整理 ↻
          </button>
        </div>

        {/* Records */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          {!isLoggedIn ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <p className="text-[0.72rem] text-[rgba(0,0,0,0.35)] text-center">
                登入後可查看試穿紀錄
              </p>
              <a
                href="/login"
                className="text-[0.68rem] text-[#1D1D1F] underline underline-offset-2 hover:opacity-60 transition-opacity"
              >
                前往登入
              </a>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-20 text-[0.72rem] text-[rgba(0,0,0,0.35)]">
              載入中...
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-1">
              <p className="text-[0.72rem] text-[rgba(0,0,0,0.35)] text-center">還沒有試穿紀錄</p>
              <p className="text-[0.62rem] text-[rgba(0,0,0,0.25)] text-center">完成試穿後會出現在這裡</p>
            </div>
          ) : (
            records.map((record) => (
              <div
                key={record.task_id}
                className="border border-[var(--forma-border)] rounded-xl overflow-hidden hover:border-[rgba(0,0,0,0.18)] transition-colors"
              >
                <div className="flex gap-3 p-3">
                  {/* Thumbnail */}
                  <button
                    onClick={() => record.result_image_url && setEnlarged(record)}
                    className="w-12 shrink-0 rounded-lg overflow-hidden bg-[#F5F5F7] flex items-center justify-center"
                    style={{ aspectRatio: "3/4" }}
                  >
                    {record.result_image_url ? (
                      <img
                        src={record.result_image_url}
                        alt="試穿結果"
                        className="w-full h-full object-cover"
                      />
                    ) : record.status === "failed" ? (
                      <span className="text-[0.55rem] text-red-400 text-center px-1">失敗</span>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1.2" className="w-5 h-5 animate-pulse">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 2" />
                      </svg>
                    )}
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-[0.65rem] font-medium mb-1 ${
                      record.status === "completed" ? "text-green-600"
                      : record.status === "failed" ? "text-red-500"
                      : "text-[rgba(0,0,0,0.4)]"
                    }`}>
                      {record.status === "completed" ? "試穿完成"
                        : record.status === "failed" ? "試穿失敗"
                        : record.status === "processing" ? "處理中..."
                        : "等待中..."}
                    </div>
                    {record.error && (
                      <div className="text-[0.58rem] text-red-400 truncate">{record.error}</div>
                    )}
                    <div className="text-[0.58rem] text-[rgba(0,0,0,0.28)] mt-1">
                      {timeAgo(record.created_at)}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-[var(--forma-border)] flex items-center px-3 py-1.5 gap-3">
                  <button
                    onClick={() => toggleLike(record.task_id)}
                    className={`transition-colors ${
                      liked.has(record.task_id) ? "text-red-500" : "text-[rgba(0,0,0,0.28)]"
                    } hover:text-red-400`}
                  >
                    <svg
                      viewBox="0 0 16 16"
                      fill={liked.has(record.task_id) ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="w-3.5 h-3.5"
                    >
                      <path d="M8 14s-6-3.5-6-8a4 4 0 0 1 6-3.46A4 4 0 0 1 14 6c0 4.5-6 8-6 8z" />
                    </svg>
                  </button>
                  {record.result_image_url && (
                    <a
                      href={record.result_image_url}
                      download
                      className="flex items-center gap-1 text-[0.6rem] text-[rgba(0,0,0,0.28)] hover:text-[#1D1D1F] transition-colors"
                    >
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                        <path d="M8 2v9M4 8l4 4 4-4" />
                        <path d="M2 13h12" />
                      </svg>
                      下載
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Enlarged image overlay */}
      {enlarged && enlarged.result_image_url && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-8"
          onClick={() => setEnlarged(null)}
        >
          <img
            src={enlarged.result_image_url}
            alt="試穿結果"
            className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setEnlarged(null)}
            className="absolute top-6 right-6 w-10 h-10 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center transition-colors text-lg"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
