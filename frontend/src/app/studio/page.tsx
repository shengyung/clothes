"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import BrandsSidebar from "@/components/BrandsSidebar";
import TryonCenter from "@/components/TryonCenter";
import OutfitRecords from "@/components/OutfitRecords";
import TryonModal from "@/components/TryonModal";
import { getMe, TryonResult } from "@/lib/api";

export default function StudioPage() {
  const router = useRouter();
  const [personImage, setPersonImage] = useState<File | null>(null);
  const [selectedGarmentId, setSelectedGarmentId] = useState<string | null>(null);
  const [showTryonModal, setShowTryonModal] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [outfitRefreshTrigger, setOutfitRefreshTrigger] = useState(0);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  async function refreshCredits() {
    try {
      const user = await getMe();
      setCreditsRemaining(user.credits_remaining);
      setIsLoggedIn(true);
    } catch {
      setCreditsRemaining(null);
      setIsLoggedIn(false);
    }
  }

  useEffect(() => {
    refreshCredits();
  }, []);

  function handleTryOn() {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }
    setShowTryonModal(true);
  }

  function handleTryonComplete(result: TryonResult) {
    console.log("Tryon complete:", result.task_id);
    setOutfitRefreshTrigger((n) => n + 1);
  }

  function handleModalClose() {
    setShowTryonModal(false);
    refreshCredits();
  }

  function handleReset() {
    setSelectedGarmentId(null);
  }

  return (
    <>
      <Navbar variant="app" />

      <main className="flex-1 grid grid-cols-[260px_1fr_280px] overflow-hidden min-h-0">
        <BrandsSidebar />
        <TryonCenter
          personImage={personImage}
          onImageChange={setPersonImage}
          selectedGarmentId={selectedGarmentId}
          onSelectGarment={setSelectedGarmentId}
          onTryOn={handleTryOn}
          onReset={handleReset}
          creditsRemaining={creditsRemaining}
        />
        <OutfitRecords refreshTrigger={outfitRefreshTrigger} />
      </main>

      {showTryonModal && selectedGarmentId && personImage && (
        <TryonModal
          personImage={personImage}
          garmentId={selectedGarmentId}
          onClose={handleModalClose}
          onComplete={handleTryonComplete}
        />
      )}

      {/* 未登入提示 */}
      {showLoginPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowLoginPrompt(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-[90vw] max-w-[380px] p-8 flex flex-col items-center gap-5">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="1.5" className="w-6 h-6">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-[1rem] font-medium text-neutral-900">請先登入</p>
              <p className="text-[0.78rem] text-neutral-400 mt-2 leading-relaxed">
                登入後即可使用 AI 虛擬試穿功能，<br />並儲存你的試穿紀錄
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={() => router.push("/login")}
                className="w-full bg-[#1D1D1F] text-white py-3 rounded-xl text-[0.78rem] tracking-[0.06em] hover:bg-neutral-700 transition-colors"
              >
                前往登入 / 註冊
              </button>
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="w-full border border-neutral-200 text-neutral-500 py-3 rounded-xl text-[0.78rem] hover:bg-neutral-50 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
