"use client";

import { useState } from "react";
import { forgotPassword } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch {
      setError("請求失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7] px-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-10">
          <div className="font-serif text-[2rem] font-light tracking-[0.15em] text-cream">
            FOR<span className="text-forma-accent">MA</span>
          </div>
          <p className="text-[0.78rem] text-taupe mt-1 tracking-[0.06em]">重設密碼</p>
        </div>

        <div className="bg-white border border-[var(--forma-border)] p-8 shadow-sm">
          {sent ? (
            <div className="text-center">
              <p className="text-cream text-[0.88rem] mb-2">重設連結已寄出</p>
              <p className="text-taupe text-[0.78rem]">請檢查您的電子信箱，連結1小時內有效。</p>
              <a
                href="/login"
                className="block mt-6 text-[0.78rem] tracking-[0.08em] uppercase text-taupe hover:text-cream transition-colors"
              >
                返回登入
              </a>
            </div>
          ) : (
            <>
              <p className="text-taupe text-[0.82rem] mb-6">
                輸入您的 Email，我們將寄送密碼重設連結。
              </p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.72rem] tracking-[0.08em] uppercase text-taupe">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your@email.com"
                    className="border border-[var(--forma-border)] px-3 py-2.5 text-[0.88rem] text-cream bg-white outline-none focus:border-cream transition-colors"
                  />
                </div>

                {error && <p className="text-red-500 text-[0.78rem]">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-cream text-white py-3 text-[0.78rem] tracking-[0.12em] uppercase cursor-pointer transition-colors hover:bg-forma-accent disabled:opacity-40 disabled:cursor-not-allowed border-none mt-1"
                >
                  {loading ? "處理中..." : "寄送重設連結"}
                </button>
              </form>

              <div className="text-center mt-5">
                <a
                  href="/login"
                  className="text-[0.72rem] text-taupe hover:text-cream transition-colors tracking-[0.04em]"
                >
                  返回登入
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
