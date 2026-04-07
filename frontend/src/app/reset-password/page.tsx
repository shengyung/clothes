"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { resetPassword } from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("兩次輸入的密碼不一致");
      return;
    }
    if (newPassword.length < 8) {
      setError("密碼至少需要 8 個字元");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, newPassword);
      router.replace("/login");
    } catch (e) {
      setError(e instanceof Error ? e.message : "重設失敗，連結可能已失效");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <p className="text-red-500 text-[0.82rem] text-center">
        無效的重設連結，請重新申請。
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-[0.72rem] tracking-[0.08em] uppercase text-taupe">新密碼</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          placeholder="至少 8 個字元"
          className="border border-[var(--forma-border)] px-3 py-2.5 text-[0.88rem] text-cream bg-white outline-none focus:border-cream transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[0.72rem] tracking-[0.08em] uppercase text-taupe">確認新密碼</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          placeholder="再次輸入密碼"
          className="border border-[var(--forma-border)] px-3 py-2.5 text-[0.88rem] text-cream bg-white outline-none focus:border-cream transition-colors"
        />
      </div>

      {error && <p className="text-red-500 text-[0.78rem]">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-cream text-white py-3 text-[0.78rem] tracking-[0.12em] uppercase cursor-pointer transition-colors hover:bg-forma-accent disabled:opacity-40 disabled:cursor-not-allowed border-none mt-1"
      >
        {loading ? "處理中..." : "重設密碼"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7] px-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-10">
          <div className="font-serif text-[2rem] font-light tracking-[0.15em] text-cream">
            FOR<span className="text-forma-accent">MA</span>
          </div>
          <p className="text-[0.78rem] text-taupe mt-1 tracking-[0.06em]">設定新密碼</p>
        </div>

        <div className="bg-white border border-[var(--forma-border)] p-8 shadow-sm">
          <Suspense fallback={<p className="text-taupe text-[0.82rem]">載入中...</p>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}