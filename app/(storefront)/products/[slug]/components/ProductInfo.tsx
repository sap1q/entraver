import { Star } from "lucide-react";
import { ProductVariantSelector } from "./ProductVariantSelector";
import { ProductAdminEditShortcut } from "./ProductAdminEditShortcut";
import { RatingStars } from "@/components/ui/RatingStars";
import { formatCompactNumber, formatCurrencyIDR } from "@/lib/utils/formatter";
import type { ProductDetail } from "@/types/product.types";

interface ProductInfoProps {
  product: ProductDetail;
  selectedPrice: number;
  selectedVariants: Record<string, string>;
  onVariantChange: (groupName: string, option: string) => void;
}

export const ProductInfo = ({ product, selectedPrice, selectedVariants, onVariantChange }: ProductInfoProps) => {
  return (
    <section className="rounded-2xl border border-slate-100 bg-slate-50/40 p-5">
      <span className="inline-flex rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-700">
        Ready Stock
      </span>

      <div className="mt-3 flex items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold leading-tight text-slate-900 md:text-3xl">{product.name}</h1>
        <ProductAdminEditShortcut productId={product.id} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
        <div className="inline-flex items-center gap-1.5">
          <RatingStars rating={product.rating} size="sm" />
          <span className="font-semibold text-slate-700">{product.rating.toFixed(1)}</span>
        </div>
        <span>{formatCompactNumber(product.sold_count)} terjual</span>
        <span className="inline-flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          {product.reviews_summary.total_count} ulasan
        </span>
      </div>

      <div className="mt-5 flex items-end gap-3">
        <p className="text-3xl font-bold text-slate-900 md:text-4xl">{formatCurrencyIDR(selectedPrice)}</p>
        {typeof product.original_price === "number" && product.original_price > selectedPrice ? (
          <p className="pb-1 text-base text-slate-400 line-through">{formatCurrencyIDR(product.original_price)}</p>
        ) : null}
      </div>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <ProductVariantSelector variants={product.variants ?? []} selectedVariants={selectedVariants} onChange={onVariantChange} />
      </div>
    </section>
  );
};
