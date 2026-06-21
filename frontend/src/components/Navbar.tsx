"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { getStoredUser, StoredUser } from "@/lib/auth";
import { logoutUser } from "@/lib/api";

const NAV_LINKS: { label: string; href: string; disabled?: boolean }[] = [
  { label: "首頁", href: "/" },
  { label: "試衣間", href: "/studio" },
  { label: "尺寸推薦", href: "/size-guide" },
  { label: "穿搭推薦", href: "#", disabled: true },
];

interface NavbarProps {
  variant?: "site" | "app";
}

export default function Navbar({ variant = "site" }: NavbarProps) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  async function handleLogout() {
    await logoutUser();
    setUser(null);
    await signOut({ redirect: false });
    router.push("/");
  }

  const logo = (
    <Link href="/" className="no-underline shrink-0">
      <span className="font-serif text-[1.3rem] font-light tracking-[0.15em] text-[#1D1D1F]">
        ShapeOn<span className="text-[#6E6E73]">You</span>
      </span>
    </Link>
  );

  const navLinks = (
    <ul className="flex items-center gap-5 list-none">
      {NAV_LINKS.map(({ label, href, disabled }) => {
        const isActive = pathname === href;
        if (disabled) {
          return (
            <li key={label}>
              <span className="text-[0.72rem] tracking-[0.04em] text-[rgba(0,0,0,0.25)] cursor-not-allowed select-none">
                {label}
              </span>
            </li>
          );
        }
        return (
          <li key={label}>
            <Link
              href={href}
              className={`text-[0.72rem] tracking-[0.04em] no-underline transition-colors duration-200 ${
                isActive
                  ? "text-[#1D1D1F] font-medium"
                  : "text-[rgba(0,0,0,0.45)] hover:text-[#1D1D1F]"
              }`}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  if (variant === "site") {
    return (
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 bg-[rgba(245,245,247,0.88)] backdrop-blur-md border-b border-[rgba(0,0,0,0.05)]"
        role="navigation"
        aria-label="主選單"
      >
        {logo}
        <div className="flex items-center gap-6 ml-8">
          {navLinks}
        </div>
        <div className="flex items-center gap-4 ml-auto">
          {user ? (
            <div className="flex items-center gap-2">
              <Link href="/profile" className="no-underline">
                <div className="w-7 h-7 rounded-full bg-[#1D1D1F] flex items-center justify-center text-white text-[0.6rem] font-medium hover:opacity-70 transition-opacity">
                  {(user.name || user.email)[0].toUpperCase()}
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="text-[0.65rem] text-[rgba(0,0,0,0.32)] hover:text-[#1D1D1F] transition-colors duration-200"
              >
                登出
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-[0.72rem] tracking-[0.1em] uppercase text-[rgba(0,0,0,0.45)] hover:text-[#1D1D1F] transition-colors duration-200 no-underline"
            >
              登入
            </Link>
          )}
        </div>
      </nav>
    );
  }

  // variant === "app" — static, full toolbar
  return (
    <nav
      className="flex items-center gap-4 px-6 py-3 border-b border-[var(--forma-border)] bg-white shrink-0 z-10"
      role="navigation"
      aria-label="應用程式導航"
    >
      {logo}
      <div className="ml-3">
        {navLinks}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0 ml-auto">
        {user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-[var(--forma-border)] ml-1">
            <Link href="/profile" className="no-underline flex items-center gap-2 hover:opacity-70 transition-opacity">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name ?? ""}
                  className="w-7 h-7 rounded-full object-cover border border-[var(--forma-border)]"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#1D1D1F] flex items-center justify-center text-white text-[0.6rem] font-medium">
                  {(user.name || user.email)[0].toUpperCase()}
                </div>
              )}
              <span className="text-[0.72rem] text-[#1D1D1F] max-w-[70px] truncate">
                Hi, {user.name || user.email.split("@")[0]}
              </span>
            </Link>
            <button
              onClick={handleLogout}
              className="text-[0.65rem] text-[rgba(0,0,0,0.32)] hover:text-[#1D1D1F] transition-colors ml-1 cursor-pointer"
            >
              登出
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center px-4 py-2 bg-[#1D1D1F] text-white rounded-lg text-[0.7rem] tracking-[0.05em] no-underline hover:bg-[#6E6E73] transition-colors"
          >
            登入
          </Link>
        )}
      </div>
    </nav>
  );
}
