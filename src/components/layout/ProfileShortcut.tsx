"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { userProfileApi } from "@/lib/api/user-profile";
import { clearPersistedAuth } from "@/lib/axios";
import { getCachedProfileAvatar, getNameInitials, resolveApiAssetUrl } from "@/lib/utils/media";
import { getStoredAdmin, getToken } from "@/lib/utils/storage";
import { AUTH_STATE_EVENT_NAME } from "@/src/lib/auth/tokens";

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
  { label: "Akun Saya", href: "/account/profile" },
  { label: "Alamat", href: "/account/addresses" },
  { label: "Transaksi", href: "/transaksi" },
] as const;

type ProfileShortcutSnapshot = {
  isLoggedIn: boolean;
  name: string | null;
  role: string | null;
};

const serverProfileShortcutSnapshot: ProfileShortcutSnapshot = {
  isLoggedIn: false,
  name: null,
  role: null,
};

let cachedProfileShortcutSnapshot: ProfileShortcutSnapshot = serverProfileShortcutSnapshot;

const getProfileShortcutServerSnapshot = (): ProfileShortcutSnapshot => serverProfileShortcutSnapshot;

const getProfileShortcutSnapshot = (): ProfileShortcutSnapshot => {
  const storedAdmin = getStoredAdmin();
  const nextSnapshot: ProfileShortcutSnapshot = {
    isLoggedIn: Boolean(getToken()),
    name: storedAdmin?.name ?? null,
    role: storedAdmin?.role ?? null,
  };

  if (
    cachedProfileShortcutSnapshot.isLoggedIn === nextSnapshot.isLoggedIn &&
    cachedProfileShortcutSnapshot.name === nextSnapshot.name &&
    cachedProfileShortcutSnapshot.role === nextSnapshot.role
  ) {
    return cachedProfileShortcutSnapshot;
  }

  cachedProfileShortcutSnapshot = nextSnapshot;
  return cachedProfileShortcutSnapshot;
};

const subscribeProfileShortcut = (callback: () => void) => {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const notify = () => callback();

  window.addEventListener("storage", notify);
  window.addEventListener("storefront-profile-updated", notify as EventListener);
  window.addEventListener(AUTH_STATE_EVENT_NAME, notify as EventListener);

  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener("storefront-profile-updated", notify as EventListener);
    window.removeEventListener(AUTH_STATE_EVENT_NAME, notify as EventListener);
  };
};

export function ProfileShortcut() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const profileSnapshot = useSyncExternalStore(
    subscribeProfileShortcut,
    getProfileShortcutSnapshot,
    getProfileShortcutServerSnapshot
  );

  const [open, setOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarBroken, setAvatarBroken] = useState(false);

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

  useEffect(() => {
    if (!profileSnapshot.isLoggedIn) return;

    const controller = new AbortController();

    const loadProfile = async () => {
      try {
        const profile = await userProfileApi.getProfile(controller.signal);
        setAvatarBroken(false);
        setAvatarUrl(getCachedProfileAvatar() || resolveApiAssetUrl(profile.avatar));
      } catch {
        setAvatarUrl(getCachedProfileAvatar());
        setAvatarBroken(false);
      }
    };

    void loadProfile();

    const handleProfileUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ avatar?: string | null; name?: string | null }>).detail;
      setAvatarBroken(false);
      setAvatarUrl(getCachedProfileAvatar() || resolveApiAssetUrl(detail?.avatar));
    };

    window.addEventListener("storefront-profile-updated", handleProfileUpdated as EventListener);

    return () => {
      controller.abort();
      window.removeEventListener("storefront-profile-updated", handleProfileUpdated as EventListener);
    };
  }, [profileSnapshot.isLoggedIn]);

  const canAccessAdminPanel = useMemo(() => {
    if (!profileSnapshot.role) return false;
    return profileSnapshot.role === "superadmin" || profileSnapshot.role === "admin";
  }, [profileSnapshot.role]);

  const displayName = profileSnapshot.name || (profileSnapshot.isLoggedIn ? "Pengguna Entraverse" : "Guest");
  const initials = getNameInitials(displayName, profileSnapshot.isLoggedIn ? "U" : "G");
  const showAvatarImage = Boolean(avatarUrl && !avatarBroken);

  const handleLogout = () => {
    clearPersistedAuth();
    setOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:border-blue-200 hover:text-blue-600"
        aria-label="Menu profil"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((prev) => !prev)}
      >
        {showAvatarImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl ?? ""}
            alt={displayName}
            className="h-full w-full rounded-full object-cover"
            onError={() => {
              const cachedAvatar = getCachedProfileAvatar();
              if (cachedAvatar && cachedAvatar !== avatarUrl) {
                setAvatarUrl(cachedAvatar);
                setAvatarBroken(false);
                return;
              }
              setAvatarBroken(true);
            }}
          />
        ) : (
          <span className="inline-flex h-full w-full items-center justify-center rounded-full bg-blue-600 text-xs font-bold tracking-wide text-white">
            {initials}
          </span>
        )}
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
                {displayName}
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

              {profileSnapshot.isLoggedIn ? (
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
