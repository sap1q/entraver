"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Search } from "lucide-react";
import { AddressShortcut } from "@/src/components/layout/AddressShortcut";
import { CartShortcut } from "@/src/components/layout/CartShortcut";
import { ProfileShortcut } from "@/src/components/layout/ProfileShortcut";
import { ProductMegaDropdown } from "@/src/components/layout/ProductMegaDropdown";

const NAV_ITEMS = [
  { label: "Beranda", href: "/" },
  { label: "Produk", href: "/products" },
  { label: "Trade In", href: "/trade-in" },
  { label: "Tentang Kami", href: "/tentang-kami" },
  { label: "Garansi", href: "/garansi" },
] as const;

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
      className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-md"
    >
      <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
        <div className="flex h-16 items-center gap-3 md:h-[72px]">
          <Link href="/" className="flex min-w-fit items-center">
            <Image
              src="/assets/images/hero/entraverse.png"
              alt="Entraverse"
              width={140}
              height={40}
              className="h-7 w-auto md:h-8"
              quality={100}
              priority
            />
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-6 lg:flex">
            {NAV_ITEMS.map((item) => {
              if (item.label !== "Produk") {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-sm font-medium text-slate-700 transition-colors hover:text-blue-600"
                  >
                    {item.label}
                  </Link>
                );
              }

              return (
                <button
                  key={item.href}
                  type="button"
                  onMouseEnter={openMegaMenu}
                  onMouseLeave={scheduleCloseMegaMenu}
                  onFocus={openMegaMenu}
                  onBlur={scheduleCloseMegaMenu}
                  onClick={() => {
                    clearCloseTimer();
                    setIsMegaMenuOpen((prev) => !prev);
                  }}
                  className="group inline-flex items-center gap-1 text-sm font-medium text-slate-700 transition-colors hover:text-blue-600"
                  aria-expanded={isMegaMenuOpen}
                  aria-haspopup="menu"
                  aria-label="Buka menu produk"
                >
                  {item.label}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      isMegaMenuOpen ? "rotate-180 text-blue-600" : "text-slate-500 group-hover:text-blue-600"
                    }`}
                  />
                </button>
              );
            })}
          </nav>

          <div className="ml-auto hidden min-w-0 items-center gap-3 lg:flex">
            <AddressShortcut />

            <label className="flex h-11 w-full max-w-[420px] items-center gap-2 rounded-full border border-slate-200/70 bg-slate-100/50 px-4 text-slate-600 transition-colors focus-within:border-blue-300">
              <Search className="h-4 w-4 shrink-0 text-slate-500" strokeWidth={1.5} />
              <input
                aria-label="Cari produk"
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                defaultValue=""
                placeholder="Cari produk di Entraverse"
              />
            </label>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="lg:hidden">
              <AddressShortcut />
            </div>

            <CartShortcut />

            <ProfileShortcut />
          </div>
        </div>

        <div className="pb-3 lg:hidden">
          <label className="flex h-10 w-full items-center gap-2 rounded-full border border-slate-200/70 bg-slate-100/50 px-4 text-slate-600 transition-colors focus-within:border-blue-300">
            <Search className="h-4 w-4 shrink-0 text-slate-500" strokeWidth={1.5} />
            <input
              aria-label="Cari produk"
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              defaultValue=""
              placeholder="Cari produk di Entraverse"
            />
          </label>
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
