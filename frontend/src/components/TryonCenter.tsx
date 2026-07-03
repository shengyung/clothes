"use client";

import { useRef, useState } from "react";
import { uploadGarment } from "@/lib/api";

const STEPS = [
  {
    num: 1,
    label: "上傳照片",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
        <path d="M10 13V3M6 7l4-4 4 4" />
        <path d="M3 17h14" />
      </svg>
    ),
  },
  {
    num: 2,
    label: "選擇商品",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
        <path d="M6 2 3 6v12a2 2 0 002 2h10a2 2 0 002-2V6l-3-4z" />
        <path d="M3 6h14M13 10a3 3 0 01-6 0" />
      </svg>
    ),
  },
  {
    num: 3,
    label: "生成試穿",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
        <circle cx="10" cy="10" r="7" />
        <path d="M10 7v4l2.5 1.5" />
      </svg>
    ),
  },
  {
    num: 4,
    label: "儲存分享",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
        <path d="M13 4l3 3-3 3M4 14v1a1 1 0 001 1h10a1 1 0 001-1v-1" />
        <path d="M16 7H8a4 4 0 000 8" />
      </svg>
    ),
  },
];

const DAILY_CREDITS = 5;

interface TryonCenterProps {
  personImage: File | null;
  onImageChange: (file: File | null) => void;
  selectedGarmentId: string | null;
  onSelectGarment: (id: string) => void;
  onTryOn: () => void;
  onReset: () => void;
  creditsRemaining: number | null;
}

export default function TryonCenter({
  personImage,
  onImageChange,
  selectedGarmentId,
  onSelectGarment,
  onTryOn,
  onReset,
  creditsRemaining,
}: TryonCenterProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
const [uploadedGarmentPreview, setUploadedGarmentPreview] = useState<string | null>(null);
  const [isUploadingGarment, setIsUploadingGarment] = useState(false);
  const [garmentUploadError, setGarmentUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const garmentInputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    onImageChange(file);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
  }

  function handleReset() {
    onImageChange(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
    onReset();
  }

  async function handleGarmentFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setGarmentUploadError(null);
    setIsUploadingGarment(true);
    if (uploadedGarmentPreview) URL.revokeObjectURL(uploadedGarmentPreview);
    setUploadedGarmentPreview(URL.createObjectURL(file));
    try {
      const garment = await uploadGarment(file);
      onSelectGarment(garment.id);
    } catch {
      setGarmentUploadError("上傳失敗，請再試一次");
      setUploadedGarmentPreview(null);
      onSelectGarment("");
    } finally {
      setIsUploadingGarment(false);
    }
  }

  const outOfCredits = creditsRemaining !== null && creditsRemaining === 0;
  const canTryOn = !!personImage && !!selectedGarmentId && !outOfCredits;
  const currentStep = !personImage ? 1 : !selectedGarmentId ? 2 : 3;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Main area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Photo area */}
        <div className="flex-1 relative bg-[#F5F5F7] overflow-hidden flex flex-col">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-3 z-10">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 20 20" fill="none" stroke="#1D1D1F" strokeWidth="1.4" className="w-4 h-4">
                <circle cx="10" cy="10" r="8" />
                <path d="M10 6v5l3 2" />
              </svg>
              <span className="text-[0.78rem] font-medium text-[#1D1D1F]">虛擬試穿</span>
            </div>
          </div>

          {/* Photo display */}
          <div className="flex-1 flex items-center justify-center mt-12 mb-16 overflow-hidden px-4">
            {personImage && preview ? (
              <div className="relative h-full flex items-center justify-center">
                <img
                  src={preview}
                  alt="Uploaded photo"
                  className="max-h-full max-w-full object-contain rounded-lg"
                />
                <button
                  onClick={() => inputRef.current?.click()}
                  className="absolute top-3 right-3 bg-black/10 backdrop-blur-sm text-[#1D1D1F] px-3 py-1.5 text-[0.65rem] tracking-[0.05em] uppercase rounded-lg border border-black/10 hover:bg-black/20 transition-colors"
                >
                  重新上傳
                </button>
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center gap-4 w-full h-full"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const file = e.dataTransfer.files[0];
                  if (file) handleFile(file);
                }}
              >
                <button
                  onClick={() => inputRef.current?.click()}
                  className={`w-52 h-72 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 transition-colors bg-white/60 ${
                    dragging
                      ? "border-[#1D1D1F] bg-white/80"
                      : "border-[rgba(0,0,0,0.15)] hover:border-[rgba(0,0,0,0.3)]"
                  }`}
                >
                  <svg viewBox="0 0 48 48" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1.4" className="w-12 h-12">
                    <circle cx="24" cy="14" r="8" />
                    <path d="M8 44c0-8.84 7.16-16 16-16s16 7.16 16 16" />
                  </svg>
                  <div className="text-center px-4">
                    <p className="text-[0.75rem] text-[rgba(0,0,0,0.5)] font-medium">上傳全身照片</p>
                    <p className="text-[0.62rem] text-[rgba(0,0,0,0.3)] mt-1.5 leading-relaxed">正面站姿<br />背景盡量乾淨</p>
                  </div>
                </button>
                <p className="text-[0.68rem] text-[rgba(0,0,0,0.3)]">點擊選取，或將照片拖曳至此</p>
              </div>
            )}
          </div>

          {/* Bottom controls */}
          <div className="absolute bottom-0 left-0 right-0 px-5 py-3 flex items-center gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-[0.7rem] tracking-[0.05em] text-[#6E6E73] border border-[rgba(0,0,0,0.12)] rounded-lg hover:border-[rgba(0,0,0,0.3)] hover:text-[#1D1D1F] transition-all bg-white/80 backdrop-blur-sm"
            >
              重設
            </button>
            <div className="flex items-center gap-2 px-4 py-2 text-[0.7rem] text-[rgba(0,0,0,0.28)] border border-[rgba(0,0,0,0.08)] rounded-lg bg-white/80 backdrop-blur-sm cursor-not-allowed select-none">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                <path d="M1 1l14 14M15 1l-4 4M1 15l4-4" />
                <path d="M11 1h4v4M1 11v4h4" />
              </svg>
              隨機搭配
              <span className="text-[0.55rem] tracking-[0.06em] text-[rgba(0,0,0,0.22)] border border-[rgba(0,0,0,0.12)] px-1.5 py-0.5 rounded">即將推出</span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-[0.68rem] text-[rgba(0,0,0,0.28)]">對比模式</span>
              <div className="w-9 h-5 rounded-full bg-[rgba(0,0,0,0.08)] relative shrink-0 cursor-not-allowed">
                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
              </div>
              <span className="text-[0.55rem] tracking-[0.06em] text-[rgba(0,0,0,0.22)] border border-[rgba(0,0,0,0.12)] px-1.5 py-0.5 rounded">即將推出</span>
            </div>
          </div>
        </div>

        {/* Product panel */}
        <div className="w-[220px] border-l border-[var(--forma-border)] bg-white flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--forma-border)] shrink-0">
            <div className="text-[0.78rem] font-medium text-[#1D1D1F]">服裝照片</div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
            <input
              ref={garmentInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleGarmentFile(file);
                e.target.value = "";
              }}
            />

            {uploadedGarmentPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-[rgba(0,0,0,0.1)]">
                <img
                  src={uploadedGarmentPreview}
                  alt="上傳的服裝"
                  className="w-full aspect-[3/4] object-cover"
                />
                {isUploadingGarment && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <span className="text-[0.7rem] text-[rgba(0,0,0,0.5)]">上傳中...</span>
                  </div>
                )}
                {!isUploadingGarment && (
                  <button
                    onClick={() => garmentInputRef.current?.click()}
                    className="absolute top-2 right-2 bg-black/10 backdrop-blur-sm text-[#1D1D1F] px-2 py-1 text-[0.6rem] tracking-[0.05em] uppercase rounded-lg border border-black/10 hover:bg-black/20 transition-colors"
                  >
                    重新上傳
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => garmentInputRef.current?.click()}
                disabled={isUploadingGarment}
                className="w-full flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[rgba(0,0,0,0.15)] rounded-xl py-10 hover:border-[rgba(0,0,0,0.3)] transition-colors disabled:cursor-not-allowed"
              >
                {isUploadingGarment ? (
                  <span className="text-[0.72rem] text-[rgba(0,0,0,0.4)]">上傳中...</span>
                ) : (
                  <>
                    <svg viewBox="0 0 48 48" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" className="w-10 h-10">
                      <path d="M38.5 6.5 30 2a8 8 0 0 1-16 0L5.5 6.5a4 4 0 0 0-2.7 4.46l1.15 7.14a2 2 0 0 0 1.97 1.7H10v20a4 4 0 0 0 4 4h20a4 4 0 0 0 4-4V19.8h4.08a2 2 0 0 0 1.97-1.7l1.15-7.14a4 4 0 0 0-2.7-4.46z" />
                    </svg>
                    <div className="text-center px-2">
                      <p className="text-[0.68rem] text-[rgba(0,0,0,0.5)]">點擊上傳服裝照片</p>
                      <p className="text-[0.58rem] text-[rgba(0,0,0,0.3)] mt-1">建議正面白底</p>
                    </div>
                  </>
                )}
              </button>
            )}

            {garmentUploadError && (
              <p className="text-[0.65rem] text-red-500 text-center">{garmentUploadError}</p>
            )}
          </div>

          <div className="p-3 border-t border-[var(--forma-border)] shrink-0 flex flex-col gap-2">
            {/* Credits indicator */}
            {creditsRemaining !== null && (
              <div className="flex items-center justify-between px-1">
                <span className="text-[0.6rem] text-[rgba(0,0,0,0.35)] tracking-[0.03em]">今日剩餘次數</span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: DAILY_CREDITS }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i < creditsRemaining
                          ? "bg-[#1D1D1F]"
                          : "bg-[rgba(0,0,0,0.12)]"
                      }`}
                    />
                  ))}
                  <span className={`text-[0.6rem] ml-1 font-medium ${outOfCredits ? "text-red-500" : "text-[rgba(0,0,0,0.45)]"}`}>
                    {creditsRemaining}/{DAILY_CREDITS}
                  </span>
                </div>
              </div>
            )}
            <button
              onClick={onTryOn}
              disabled={!canTryOn}
              className="w-full bg-[#1D1D1F] text-white py-2.5 text-[0.72rem] tracking-[0.08em] uppercase rounded-lg hover:bg-[#6E6E73] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {outOfCredits ? "今日次數已達上限" : !personImage ? "請先上傳照片" : !selectedGarmentId ? "請上傳服裝" : "立即試穿"}
            </button>
          </div>
        </div>
      </div>

      {/* Step guide */}
      <div className="shrink-0 border-t border-[var(--forma-border)] bg-white px-4 py-2.5 flex items-center justify-center gap-1">
        {STEPS.map((step, i) => (
          <div key={step.num} className="flex items-center gap-1">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                currentStep === step.num
                  ? "bg-[#1D1D1F] text-white"
                  : currentStep > step.num
                  ? "text-[rgba(0,0,0,0.45)]"
                  : "text-[rgba(0,0,0,0.22)]"
              }`}
            >
              {step.icon}
              <span className="text-[0.62rem] tracking-[0.03em] whitespace-nowrap">{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <svg viewBox="0 0 12 12" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="1.5" className="w-2.5 h-2.5 shrink-0 mx-0.5">
                <path d="M3 1l5 5-5 5" />
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
