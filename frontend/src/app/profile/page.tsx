"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { updateProfile, changePassword } from "@/lib/api";
import { getStoredUser, setStoredUser } from "@/lib/auth";
import type { StoredUser } from "@/lib/auth";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);

  // Profile fields
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace("/login");
      return;
    }
    setUser(stored);
    setName(stored.name ?? "");
    setAvatarUrl(stored.avatar_url ?? "");
  }, [router]);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileMessage(null);
    setProfileLoading(true);
    try {
      const updated = await updateProfile(name || undefined, avatarUrl || undefined);
      const newStored: StoredUser = {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        avatar_url: updated.avatar_url,
        is_admin: updated.is_admin,
        oauth_provider: updated.oauth_provider,
      };
      setStoredUser(newStored);
      setUser(newStored);
      setProfileMessage({ type: "ok", text: "資料已更新" });
    } catch (e) {
      setProfileMessage({ type: "err", text: e instanceof Error ? e.message : "更新失敗" });
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwMessage(null);
    if (newPassword !== confirmPassword) {
      setPwMessage({ type: "err", text: "兩次輸入的密碼不一致" });
      return;
    }
    setPwLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPwMessage({ type: "ok", text: "密碼已更新，下次登入請使用新密碼" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      setPwMessage({ type: "err", text: e instanceof Error ? e.message : "更改失敗" });
    } finally {
      setPwLoading(false);
    }
  }

  if (!user) return null;

  const isEmailUser = !user.oauth_provider;

  return (
    <div className="min-h-screen bg-[#F5F5F7] py-16 px-4">
      <div className="max-w-[480px] mx-auto">
        <h1 className="font-serif text-[1.4rem] font-light tracking-[0.12em] text-cream mb-8">
          個人設定
        </h1>

        {/* Profile Section */}
        <div className="bg-white border border-[var(--forma-border)] p-8 shadow-sm mb-5">
          <h2 className="text-[0.72rem] tracking-[0.1em] uppercase text-taupe mb-6">個人資料</h2>

          <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.72rem] tracking-[0.08em] uppercase text-taupe">Email</label>
              <p className="text-[0.88rem] text-cream px-3 py-2.5 border border-[var(--forma-border)] bg-black/[0.02]">
                {user.email}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.72rem] tracking-[0.08em] uppercase text-taupe">姓名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="您的名稱"
                className="border border-[var(--forma-border)] px-3 py-2.5 text-[0.88rem] text-cream bg-white outline-none focus:border-cream transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.72rem] tracking-[0.08em] uppercase text-taupe">頭像 URL</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="border border-[var(--forma-border)] px-3 py-2.5 text-[0.88rem] text-cream bg-white outline-none focus:border-cream transition-colors"
              />
            </div>

            {profileMessage && (
              <p className={`text-[0.78rem] ${profileMessage.type === "ok" ? "text-green-600" : "text-red-500"}`}>
                {profileMessage.text}
              </p>
            )}

            <button
              type="submit"
              disabled={profileLoading}
              className="w-full bg-cream text-white py-3 text-[0.78rem] tracking-[0.12em] uppercase cursor-pointer transition-colors hover:bg-forma-accent disabled:opacity-40 disabled:cursor-not-allowed border-none mt-1"
            >
              {profileLoading ? "儲存中..." : "儲存變更"}
            </button>
          </form>
        </div>

        {/* Password Section (email users only) */}
        {isEmailUser && (
          <div className="bg-white border border-[var(--forma-border)] p-8 shadow-sm mb-5">
            <h2 className="text-[0.72rem] tracking-[0.1em] uppercase text-taupe mb-6">更改密碼</h2>

            <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.72rem] tracking-[0.08em] uppercase text-taupe">目前密碼</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="border border-[var(--forma-border)] px-3 py-2.5 text-[0.88rem] text-cream bg-white outline-none focus:border-cream transition-colors"
                />
              </div>

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
                  placeholder="再次輸入新密碼"
                  className="border border-[var(--forma-border)] px-3 py-2.5 text-[0.88rem] text-cream bg-white outline-none focus:border-cream transition-colors"
                />
              </div>

              {pwMessage && (
                <p className={`text-[0.78rem] ${pwMessage.type === "ok" ? "text-green-600" : "text-red-500"}`}>
                  {pwMessage.text}
                </p>
              )}

              <button
                type="submit"
                disabled={pwLoading}
                className="w-full bg-cream text-white py-3 text-[0.78rem] tracking-[0.12em] uppercase cursor-pointer transition-colors hover:bg-forma-accent disabled:opacity-40 disabled:cursor-not-allowed border-none mt-1"
              >
                {pwLoading ? "處理中..." : "更改密碼"}
              </button>
            </form>
          </div>
        )}

        {/* Back link */}
        <div className="text-center">
          <a
            href="/"
            className="text-[0.72rem] text-taupe hover:text-cream transition-colors tracking-[0.04em]"
          >
            返回首頁
          </a>
        </div>
      </div>
    </div>
  );
}