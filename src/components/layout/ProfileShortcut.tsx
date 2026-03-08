"use client";

import { AnimatePresence, motion } from "framer-motion";
import { User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { clearPersistedAuth } from "@/lib/axios";
import { getStoredAdmin, getToken, removeStoredAdmin, removeToken } from "@/lib/utils/storage";

const panelMotion = {
  hidden: { opacity: 0, scale: 0, y: -8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 520, damping: 34, mass: 0.68 },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    y: -6,
    transition: { duration: 0.15, ease: "easeInOut" },
  },
} as const;

const profileLinks = [
  { label: "Akun Saya", href: "/akun-saya" },
  { label: "Alamat", href: "/alamat" },
  { label: "Transaksi", href: "/transaksi" },
] as const;

export function ProfileShortcut() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [storedRole, setStoredRole] = useState<string | null>(null);
  const [storedName, setStoredName] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = getToken();
    const admin = getStoredAdmin();
    setIsLoggedIn(Boolean(token));
    setStoredRole(admin?.role ?? null);
    setStoredName(admin?.name ?? null);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onClickOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const canAccessAdminPanel = useMemo(() => {
    if (!storedRole) return false;
    return storedRole === "superadmin" || storedRole === "admin";
  }, [storedRole]);

  const handleLogout = () => {
    removeToken();
    removeStoredAdmin();
    clearPersistedAuth();
    setOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="rounded-full p-2 text-slate-700 transition-colors hover:text-blue-600"
        aria-label="Menu profil"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((prev) => !prev)}
      >
        <User className="h-5 w-5" strokeWidth={1.5} />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={panelMotion}
            className="absolute right-0 top-[calc(100%+10px)] z-[80] w-[min(88vw,280px)] origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_16px_52px_rgba(15,23,42,0.2)]"
            role="menu"
            aria-label="Menu Profil"
          >
            <div className="px-2 pb-2 pt-1">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Profil</p>
              <p className="truncate text-sm font-semibold text-slate-900">
                {storedName || (isLoggedIn ? "Pengguna Entraverse" : "Guest")}
              </p>
            </div>

            <div className="space-y-1">
              {canAccessAdminPanel ? (
                <Link
                  href="/admin/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 hover:text-blue-600"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                >
                  <p className="font-medium">Admin Panel</p>
                  <p className="text-[11px] text-slate-500">Hanya untuk role superadmin dan admin saja</p>
                </Link>
              ) : null}

              {profileLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 hover:text-blue-600"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

              {isLoggedIn ? (
                <button
                  type="button"
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
                  role="menuitem"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              ) : (
                <Link
                  href="/auth/login"
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
