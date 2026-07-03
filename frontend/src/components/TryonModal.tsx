"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createTryon, getTryonStatus, TryonResult } from "@/lib/api";

interface TryonModalProps {
  personImage: File;
  garmentId: string;
  onClose: () => void;
  onComplete?: (result: TryonResult) => void;
}

type ModalStep = "processing" | "result";

export default function TryonModal({ personImage, garmentId, onClose, onComplete }: TryonModalProps) {
  const [step, setStep] = useState<ModalStep>("processing");
  const [error, setError] = useState<string | null>(null);
  const [pollingStatus, setPollingStatus] = useState<string>("pending");
  const [result, setResult] = useState<TryonResult | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submittedRef = useRef(false);

  const handleComplete = useCallback((r: TryonResult) => {
    setResult(r);
    setStep("result");
    if (r.status == "completed") onComplete?.(r);
  }, [onComplete]);

  const startPolling = useCallback((taskId: string) => {
    intervalRef.current = setInterval(async () => {
      try {
        const r = await getTryonStatus(taskId);
        setPollingStatus(r.status);
        if (r.status === "completed" || r.status === "failed") {
          if (intervalRef.current) clearInterval(intervalRef.current);
          handleComplete(r);
        }
      } catch {
        // Keep polling
      }
    }, 3000);
  }, [handleComplete]);

  useEffect(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;

    async function submit() {
      try {
        const res = await createTryon(personImage, garmentId);
        startPolling(res.task_id);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "提交失敗");
        setStep("result");
      }
    }

    submit();
  }, [personImage, garmentId, startPolling]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const isSuccess = step === "result" && result?.status === "completed";
  const isFailed = step === "result" && (result?.status === "failed" || error);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative bg-white rounded-2xl shadow-2xl w-[92vw] max-w-[780px] max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-neutral-100">
          <h2 className="text-[1.05rem] font-medium text-neutral-900 tracking-wide">
            {isFailed ? "試穿失敗" : isSuccess ? "試穿結果" : "AI 生成中"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors flex items-center justify-center text-neutral-500 hover:text-neutral-800 text-sm"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* Processing */}
          {step === "processing" && !error && (
            <div className="flex flex-col items-center justify-center py-20 gap-5">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-full border-[3px] border-neutral-100" />
                <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-neutral-800 animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-[0.92rem] font-medium text-neutral-800">
                  {pollingStatus === "pending" ? "排隊等待中" : "AI 生成試穿效果中"}
                </p>
                <p className="text-[0.75rem] text-neutral-400 mt-1">通常需要 30–45 秒</p>
              </div>
            </div>
          )}

          {/* Error from submit */}
          {step === "processing" && error && (
            <div className="flex flex-col items-center justify-center py-16 gap-4 px-8">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-400 text-xl">!</div>
              <p className="text-[0.88rem] text-red-500 text-center">{error}</p>
            </div>
          )}

          {/* Result */}
          {step === "result" && result && (
            <div>
              {result.status === "failed" ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4 px-8">
                  <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-400 text-xl">!</div>
                  <p className="text-[0.88rem] text-red-500 text-center">{result.error || "未知錯誤，請重試"}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 divide-x divide-neutral-100">
                  {/* Left: original */}
                  <div className="flex flex-col">
                    <div className="px-6 py-3 bg-neutral-50 border-b border-neutral-100">
                      <span className="text-[0.62rem] tracking-[0.15em] uppercase text-neutral-400 font-medium">原始照片</span>
                    </div>
                    <div className="p-4">
                      <img
                        src={result.person_image_url}
                        alt="Original"
                        className="w-full object-contain max-h-[420px] rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Right: result */}
                  <div className="flex flex-col">
                    <div className="px-6 py-3 bg-neutral-50 border-b border-neutral-100">
                      <span className="text-[0.62rem] tracking-[0.15em] uppercase text-neutral-400 font-medium">試穿效果</span>
                    </div>
                    <div className="p-4">
                      <img
                        src={result.result_image_url}
                        alt="Try-on result"
                        className="w-full object-contain max-h-[420px] rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {(isSuccess || isFailed) && (
          <div className="px-7 py-5 border-t border-neutral-100 flex flex-col gap-3">
            {isSuccess && (
              <p className="text-[0.68rem] text-neutral-400 text-center">
                試穿結果將於 <span className="text-neutral-600 font-medium">30 天</span>後自動刪除，請記得下載保存
              </p>
            )}
            <div className="flex gap-3">
              {isSuccess && result?.result_image_url && (
                <a
                  href={result.result_image_url}
                  download="tryon-result.png"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 text-center border border-neutral-200 text-neutral-600 hover:bg-neutral-50 py-3 rounded-xl text-[0.78rem] tracking-[0.06em] transition-colors"
                >
                  下載圖片
                </a>
              )}
              <button
                onClick={onClose}
                className="flex-1 bg-neutral-900 text-white py-3 rounded-xl text-[0.78rem] tracking-[0.06em] hover:bg-neutral-700 transition-colors"
              >
                {isSuccess ? "繼續挑選" : "關閉"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
