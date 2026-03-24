"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { loginUser, registerUser, ssoLogin } from "@/lib/api";
import { setToken, setStoredUser } from "@/lib/auth";

type Tab = "login" | "register";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // When NextAuth SSO session arrives, exchange for our backend JWT
  useEffect(() => {
    if (status !== "authenticated" || !session) return;

    async function exchangeToken() {
      try {
        const s = session as unknown as Record<string, unknown>;
        const user = session!.user!;
        const res = await ssoLogin(
          s.provider as string,
          s.providerId as string,
          user.email!,
          user.name,
          (s.providerAvatar as string | null) ?? user.image
        );
        setToken(res.token);
        setStoredUser(res.user);
        router.replace("/");
      } catch (e) {
        setError(e instanceof Error ? e.message : "SSO 登入失敗");
      }
    }

    exchangeToken();
  }, [session, status, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res =
        tab === "login"
          ? await loginUser(email, password)
          : await registerUser(email, password, name || undefined);
      setToken(res.token);
      setStoredUser(res.user);
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失敗");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7] px-4">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="font-serif text-[2rem] font-light tracking-[0.15em] text-cream">
            FOR<span className="text-forma-accent">MA</span>
          </div>
          <p className="text-[0.78rem] text-taupe mt-1 tracking-[0.06em]">虛擬試衣間</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[var(--forma-border)] p-8 shadow-sm">
          {/* Tabs */}
          <div className="flex border-b border-[var(--forma-border)] mb-6">
            {(["login", "register"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); }}
                className={`flex-1 py-2 text-[0.78rem] tracking-[0.08em] uppercase transition-colors cursor-pointer bg-transparent border-none ${
                  tab === t
                    ? "text-cream border-b-2 border-cream -mb-px"
                    : "text-taupe hover:text-cream"
                }`}
              >
                {t === "login" ? "登入" : "註冊"}
              </button>
            ))}
          </div>

          {/* Email form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {tab === "register" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.72rem] tracking-[0.08em] uppercase text-taupe">姓名</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="選填"
                  className="border border-[var(--forma-border)] px-3 py-2.5 text-[0.88rem] text-cream bg-white outline-none focus:border-cream transition-colors"
                />
              </div>
            )}

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

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.72rem] tracking-[0.08em] uppercase text-taupe">密碼</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="border border-[var(--forma-border)] px-3 py-2.5 text-[0.88rem] text-cream bg-white outline-none focus:border-cream transition-colors"
              />
            </div>

            {error && (
              <p className="text-red-500 text-[0.78rem]">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cream text-white py-3 text-[0.78rem] tracking-[0.12em] uppercase cursor-pointer transition-colors hover:bg-forma-accent disabled:opacity-40 disabled:cursor-not-allowed border-none mt-1"
            >
              {loading ? "處理中..." : tab === "login" ? "登入" : "建立帳號"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[var(--forma-border)]" />
            <span className="text-[0.72rem] text-taupe tracking-[0.06em]">或使用</span>
            <div className="flex-1 h-px bg-[var(--forma-border)]" />
          </div>

          {/* SSO buttons */}
          <div className="flex flex-col gap-2.5">
            {[
              { provider: "google", label: "Google 登入", icon: "G" },
              { provider: "line", label: "LINE 登入", icon: "L" },
              { provider: "facebook", label: "Facebook 登入", icon: "f" },
              { provider: "apple", label: "Apple 登入", icon: "" },
            ].map(({ provider, label, icon }) => (
              <button
                key={provider}
                onClick={() => signIn(provider)}
                className="w-full flex items-center gap-3 border border-[var(--forma-border)] px-4 py-2.5 text-[0.78rem] tracking-[0.04em] text-cream cursor-pointer transition-colors hover:bg-black/[0.04] bg-white"
              >
                <span className="w-5 text-center font-medium text-[0.85rem]">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
