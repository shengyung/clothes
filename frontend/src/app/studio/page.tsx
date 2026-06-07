"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import BrandsSidebar from "@/components/BrandsSidebar";
import TryonCenter from "@/components/TryonCenter";
import OutfitRecords from "@/components/OutfitRecords";
import TryonModal from "@/components/TryonModal";
import { TryonResult } from "@/lib/api";

export default function StudioPage() {
  const [personImage, setPersonImage] = useState<File | null>(null);
  const [selectedGarmentId, setSelectedGarmentId] = useState<string | null>(
    null,
  );
  const [showTryonModal, setShowTryonModal] = useState(false);

  function handleTryonComplete(result: TryonResult) {
    console.log("Tryon complete:", result.task_id);
  }

  function handleReset() {
    setSelectedGarmentId(null);
  }

  return (
    <>
      <Navbar variant="app" />

      {/* ── Page title ─────────────────────────────────────── */}
      {/* <div className="shrink-0 px-8 py-4 border-b border-[var(--forma-border)] bg-white">
        <p className="text-[0.62rem] tracking-[0.22em] uppercase text-[rgba(0,0,0,0.32)] mb-1">
          AI 虛擬試衣間
        </p>
        <h1 className="font-serif text-[1.2rem] font-light tracking-[0.08em] text-[#1D1D1F]">
          試衣間
        </h1>
      </div> */}

      <main className="flex-1 grid grid-cols-[260px_1fr_280px] overflow-hidden min-h-0">
        <BrandsSidebar />
        <TryonCenter
          personImage={personImage}
          onImageChange={setPersonImage}
          selectedGarmentId={selectedGarmentId}
          onSelectGarment={setSelectedGarmentId}
          onTryOn={() => setShowTryonModal(true)}
          onReset={handleReset}
        />
        <OutfitRecords />
      </main>

      {showTryonModal && selectedGarmentId && personImage && (
        <TryonModal
          personImage={personImage}
          garmentId={selectedGarmentId}
          onClose={() => setShowTryonModal(false)}
          onComplete={handleTryonComplete}
        />
      )}
    </>
  );
}
