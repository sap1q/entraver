"use client";

import { ShieldCheck } from "lucide-react";
import { formatCurrencyIDR } from "@/lib/utils/formatter";
import type { CartSummary as CartSummaryValue } from "@/types/cart.types";

interface CartSummaryProps {
  summary: CartSummaryValue;
  disabled?: boolean;
  onCheckout: () => void;
}

export function CartSummary({ summary, disabled = false, onCheckout }: CartSummaryProps) {
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 lg:sticky lg:top-24">
      <h2 className="text-2xl font-bold text-slate-900">Ringkasan Belanja</h2>

      <div className="mt-6 space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-slate-800">Total Harga ({summary.selectedQuantity} Barang)</p>
          <p className="font-semibold text-slate-900">{formatCurrencyIDR(summary.totalPrice)}</p>
        </div>

        <div className="flex items-center justify-between">
          <p className="font-semibold text-orange-600">Potongan Trade-In</p>
          <p className="font-semibold text-orange-600">- {formatCurrencyIDR(summary.tradeInDiscount)}</p>
        </div>
      </div>

      <div className="my-4 border-t border-slate-200" />

      <div className="flex items-center justify-between">
        <p className="text-base font-semibold text-slate-900">Total Bayar</p>
        <p className="text-xl font-bold text-blue-600">{formatCurrencyIDR(summary.totalPayable)}</p>
      </div>

      <button
        type="button"
        onClick={onCheckout}
        disabled={disabled}
        className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Belanja/Jual
      </button>

      <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-xs text-slate-600">
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <p>Transaksi aman dengan perlindungan pembeli kami. Barang original atau uang kembali 100%.</p>
        </div>
      </div>
    </aside>
  );
}
