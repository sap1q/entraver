"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/hooks/useCart";
import { formatCurrencyIDR } from "@/lib/utils/formatter";

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

const formatVariantSummary = (variants: Record<string, string>): string => {
  const entries = Object.entries(variants);
  if (entries.length === 0) return "Varian default";
  return entries.map(([name, value]) => `${name}: ${value}`).join(", ");
};

export function CartShortcut() {
  const rootRef = useRef<HTMLDivElement>(null);
  const { items, cartCount, refreshCart } = useCart();

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    void refreshCart({ silent: true });

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
  }, [open, refreshCart]);

  const subtotal = useMemo(
    () => items.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [items]
  );

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="relative rounded-full p-2 text-slate-700 transition-colors hover:text-blue-600"
        aria-label="Keranjang"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((prev) => !prev)}
      >
        <ShoppingCart className="h-5 w-5" strokeWidth={1.5} />
        <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white">
          {cartCount}
        </span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={panelMotion}
            className="absolute right-0 top-[calc(100%+10px)] z-[80] w-[min(92vw,340px)] origin-top-right rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_16px_52px_rgba(15,23,42,0.2)]"
            role="menu"
            aria-label="Keranjang"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Keranjang</p>
              <span className="text-xs text-slate-500">{cartCount} item</span>
            </div>

            {items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
                <p className="text-sm font-medium text-slate-700">Keranjang masih kosong</p>
                <p className="mt-1 text-xs text-slate-500">Yuk tambahkan produk favorit kamu.</p>
                <Link
                  href="/products"
                  className="mt-3 inline-flex rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                  onClick={() => setOpen(false)}
                >
                  Lihat Produk
                </Link>
              </div>
            ) : (
              <>
                <ul className="max-h-[260px] space-y-2 overflow-auto pr-1">
                  {items.map((item) => (
                    <li key={item.id} className="rounded-xl border border-slate-200 px-3 py-3">
                      <div className="flex items-start gap-3">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="56px"
                            className="object-cover"
                            unoptimized
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="line-clamp-2 text-sm font-semibold text-slate-800">{item.name}</p>
                            <div className="shrink-0 text-right">
                              <p className="text-[11px] text-slate-400">Qty</p>
                              <p className="text-xs font-semibold text-slate-600">{item.quantity}</p>
                            </div>
                          </div>

                          <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                            {formatVariantSummary(item.variants)}
                          </p>
                          <p className="mt-1 text-base font-bold text-slate-900">
                            {formatCurrencyIDR(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="font-semibold text-slate-900">{formatCurrencyIDR(subtotal)}</span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link
                    href="/cart"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-center text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                    onClick={() => setOpen(false)}
                  >
                    Lihat Keranjang
                  </Link>
                  <Link
                    href="/checkout"
                    className="rounded-lg bg-blue-600 px-3 py-2 text-center text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                    onClick={() => setOpen(false)}
                  >
                    Checkout
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
