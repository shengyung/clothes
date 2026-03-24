"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearToken, getStoredUser, StoredUser } from "@/lib/auth";

export default function Navbar() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const router = useRouter();

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  function handleLogout() {
    clearToken();
    setUser(null);
    router.refresh();
  }

  return (
    <nav className="flex items-center justify-between px-10 py-5 border-b border-[var(--forma-border)] backdrop-blur-xl bg-warm-white relative z-10">
      <Link href="/" className="no-underline">
        <div className="font-serif text-[1.6rem] font-light tracking-[0.15em] text-cream">
          FOR<span className="text-forma-accent">MA</span>
        </div>
      </Link>

      <ul className="flex gap-8 list-none items-center">
        {[
          { label: "試衣間", href: "/" },
          { label: "品牌", href: "#" },
          { label: "收藏", href: "#" },
          { label: "關於", href: "#" },
        ].map(({ label, href }) => (
          <li key={label}>
            <Link
              href={href}
              className="text-[0.78rem] tracking-[0.1em] uppercase text-taupe no-underline transition-colors hover:text-cream"
            >
              {label}
            </Link>
          </li>
        ))}

        {user?.is_admin && (
          <li>
            <Link
              href="/admin"
              className="text-[0.78rem] tracking-[0.1em] uppercase text-taupe no-underline transition-colors hover:text-cream"
            >
              後台
            </Link>
          </li>
        )}

        {user ? (
          <li className="flex items-center gap-3">
            {user.avatar_url && (
              <img
                src={user.avatar_url}
                alt={user.name ?? user.email}
                className="w-7 h-7 rounded-full object-cover border border-[var(--forma-border)]"
              />
            )}
            <Link
              href="/history"
              className="text-[0.78rem] tracking-[0.1em] uppercase text-taupe no-underline transition-colors hover:text-cream"
            >
              歷史
            </Link>
            <button
              onClick={handleLogout}
              className="text-[0.78rem] tracking-[0.1em] uppercase text-taupe transition-colors hover:text-cream bg-transparent border-none cursor-pointer"
            >
              登出
            </button>
          </li>
        ) : (
          <li>
            <Link
              href="/login"
              className="text-[0.78rem] tracking-[0.1em] uppercase bg-cream text-white px-4 py-2 no-underline transition-colors hover:bg-forma-accent"
            >
              登入
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
