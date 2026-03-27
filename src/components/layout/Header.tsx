"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";
import { CartShortcut } from "@/src/components/layout/CartShortcut";
import { ProfileShortcut } from "@/src/components/layout/ProfileShortcut";
import { ProductMegaDropdown } from "@/src/components/layout/ProductMegaDropdown";
import { StorefrontSearchBar } from "@/src/components/layout/StorefrontSearchBar";

export function Header() {
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = useCallback(() => {
    if (!closeTimerRef.current) return;
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  }, []);

  const openMegaMenu = useCallback(() => {
    clearCloseTimer();
    setIsMegaMenuOpen(true);
  }, [clearCloseTimer]);

  const closeMegaMenu = useCallback(() => {
    clearCloseTimer();
    setIsMegaMenuOpen(false);
  }, [clearCloseTimer]);

  const scheduleCloseMegaMenu = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setIsMegaMenuOpen(false);
    }, 160);
  }, [clearCloseTimer]);

  useEffect(() => {
    return () => clearCloseTimer();
  }, [clearCloseTimer]);

  useEffect(() => {
    if (!isMegaMenuOpen) return;

    const onClickOutside = (event: MouseEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) {
        closeMegaMenu();
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMegaMenu();
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [closeMegaMenu, isMegaMenuOpen]);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 shadow-[0_8px_24px_rgba(15,23,42,0.06)] backdrop-blur-md"
    >
      <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
        <div className="flex h-16 items-center justify-between gap-3 md:h-[72px]">
          {/* Logo dengan margin kanan untuk memberi jarak */}
          <Link href="/" className="flex min-w-fit items-center mr-4 md:mr-6 lg:mr-8">
            <Image
              src="/assets/images/hero/e-logo.png"
              alt="Entraverse"
              width={140}
              height={40}
              className="h-7 w-auto md:h-8"
              priority
            />
          </Link>

          <div className="hidden min-w-0 flex-1 items-center gap-2 px-2 lg:flex">
            <button
              type="button"
              onMouseEnter={openMegaMenu}
              onMouseLeave={scheduleCloseMegaMenu}
              onFocus={openMegaMenu}
              onBlur={scheduleCloseMegaMenu}
              onClick={() => {
                clearCloseTimer();
                setIsMegaMenuOpen((previous) => !previous);
              }}
              className="hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 lg:inline-flex ml-2 md:ml-3 lg:ml-4"
              aria-expanded={isMegaMenuOpen}
              aria-haspopup="menu"
              aria-label="Buka menu kategori"
            >
              <Menu className="h-5 w-5" strokeWidth={1.8} />
            </button>

            <StorefrontSearchBar />
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            <CartShortcut />
            <ProfileShortcut />
          </div>
        </div>

        <div className="pb-3 lg:hidden">
          <div className="flex items-center gap-2">
            <Link
              href="/products"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 ml-1 md:ml-2"
              aria-label="Buka kategori produk"
            >
              <Menu className="h-5 w-5" strokeWidth={1.8} />
            </Link>

            <StorefrontSearchBar compact />
          </div>
        </div>
      </div>

      <ProductMegaDropdown
        open={isMegaMenuOpen}
        onMouseEnter={openMegaMenu}
        onMouseLeave={scheduleCloseMegaMenu}
        onClose={closeMegaMenu}
      />
    </header>
  );
}
