"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { RefreshCcw, ShoppingCart, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/utils";
import { formatCurrencyIDR } from "@/lib/utils/formatter";
import type { ProductDetail } from "@/types/product.types";

interface OrderSidebarProps {
  product: ProductDetail;
  selectedVariants: Record<string, string>;
}

const STOCK_STYLE: Record<ProductDetail["stock_status"], { label: string; className: string }> = {
  in_stock: { label: "Stok tersedia", className: "text-blue-600" },
  low_stock: { label: "Stok menipis", className: "text-orange-600" },
  out_of_stock: { label: "Stok habis", className: "text-rose-600" },
};

export const OrderSidebar = ({ product, selectedVariants }: OrderSidebarProps) => {
  const router = useRouter();
  const [quantity, setQuantity] = useState(product.min_order ?? 1);
  const { addToCart, loading, error } = useCart();

  const stockInfo = STOCK_STYLE[product.stock_status];
  const outOfStock = product.stock_status === "out_of_stock" || product.stock <= 0;
  const subtotal = useMemo(() => quantity * product.price, [product.price, quantity]);

  const variantSummary = Object.entries(selectedVariants)
    .map(([name, value]) => `${name}: ${value}`)
    .join(", ");

  const handleAddToCart = async () => {
    await addToCart(product.id, quantity, selectedVariants);
  };

  const handleBuyNow = async () => {
    const result = await addToCart(product.id, quantity, selectedVariants);
    if (result.success) {
      router.push("/checkout");
    }
  };

  const handleTradeIn = () => {
    const params = new URLSearchParams({
      product_id: product.id,
      product_slug: product.slug,
      product_name: product.name,
    });

    router.push(`/trade-in?${params.toString()}`);
  };

  return (
    <>
      <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_35px_-24px_rgba(15,23,42,0.45)] lg:sticky lg:top-24">
        <h2 className="text-2xl font-semibold text-slate-900">Rincian Pesanan</h2>
        <p className={cn("mt-2 text-sm font-semibold", stockInfo.className)}>
          {stockInfo.label}: {product.stock}
        </p>

        <div className="mt-5 space-y-4 text-sm">
          <div>
            <p className="mb-2 font-semibold text-slate-700">Jumlah</p>
            <QuantitySelector
              value={quantity}
              onChange={setQuantity}
              min={product.min_order ?? 1}
              max={Math.max(product.max_order ?? product.stock, product.min_order ?? 1)}
            />
          </div>

          {variantSummary ? (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-slate-700">
              <p className="font-semibold">Varian dipilih</p>
              <p className="mt-1 text-xs leading-relaxed">{variantSummary}</p>
            </div>
          ) : null}

          <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Harga</span>
              <span className="font-medium text-slate-800">{formatCurrencyIDR(product.price)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Jumlah</span>
              <span className="font-medium text-slate-800">{quantity} item</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900">
              <span>Total</span>
              <span>{formatCurrencyIDR(subtotal)}</span>
            </div>
          </div>

          {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : null}

          <div className="space-y-2.5">
            <Button
              type="button"
              onClick={handleAddToCart}
              loading={loading}
              disabled={outOfStock || loading}
              variant="outline"
              className="h-11 w-full border-slate-300"
            >
              <ShoppingCart className="h-4 w-4" />
              Tambahkan Keranjang
            </Button>

            <Button
              type="button"
              onClick={handleBuyNow}
              loading={loading}
              disabled={outOfStock || loading}
              className="h-11 w-full bg-blue-600 hover:bg-blue-700"
            >
              <Zap className="h-4 w-4" />
              Beli Sekarang
            </Button>

            {product.trade_in ? (
              <Button
                type="button"
                onClick={handleTradeIn}
                disabled={loading}
                className="h-11 w-full bg-emerald-600 hover:bg-emerald-700"
              >
                <RefreshCcw className="h-4 w-4" />
                Jual produk ini
              </Button>
            ) : null}
          </div>

          <div className="mt-1 flex items-center gap-2.5 border-t border-slate-200 pt-3">
            <Image
              src="/assets/images/hero/e-logo.png?v=3"
              alt="Entraverse"
              width={53}
              height={82}
              className="h-6 w-auto shrink-0 object-contain"
              unoptimized
            />
            <p className="text-[15px] font-medium leading-none text-slate-500">Dijual dan dikirim oleh Entraverse</p>
          </div>
        </div>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-10px_30px_-18px_rgba(15,23,42,0.55)] lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-500">Total</p>
            <p className="truncate text-lg font-bold text-slate-900">{formatCurrencyIDR(subtotal)}</p>
          </div>

          <Button
            type="button"
            onClick={handleAddToCart}
            loading={loading}
            disabled={outOfStock || loading}
            variant="outline"
            className="h-11 min-w-11 px-3"
            aria-label="Tambahkan ke keranjang"
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            onClick={handleBuyNow}
            loading={loading}
            disabled={outOfStock || loading}
            className="h-11 flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <Zap className="h-4 w-4" />
            Beli Sekarang
          </Button>
        </div>
      </div>
    </>
  );
};
