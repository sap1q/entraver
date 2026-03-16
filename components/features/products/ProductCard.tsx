"use client";

import type { MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Star } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";
import { formatCurrencyIDR } from "@/lib/utils/formatter";
import type { Product } from "@/types/product.types";

interface ProductCardProps {
  product: Product;
  view?: "grid" | "list";
}

const ratingStars = Array.from({ length: 5 }, (_, index) => index + 1);

export const ProductCard = ({ product, view = "grid" }: ProductCardProps) => {
  const { toggleWishlist, isInWishlist, isPending } = useWishlist();
  const isWishlisted = Boolean(product.is_wishlisted) || isInWishlist(product.id);
  const wishlistPending = isPending(product.id);
  const imageSrc = product.image?.trim() ? product.image : "/assets/images/hero/e-hero.png";
  const roundedRating = Math.max(0, Math.min(5, Math.round(product.rating)));
  const hasOriginalPrice = typeof product.original_price === "number" && product.original_price > product.price;

  const handleWishlistClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    void toggleWishlist(product.id);
  };

  return (
    <Link href={`/products/${encodeURIComponent(product.slug)}`} className="group block h-full">
      <article
        className={cn(
          "h-full overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-200",
          "shadow-[0_10px_28px_-24px_rgba(15,23,42,0.55)] hover:-translate-y-0.5 hover:shadow-[0_18px_35px_-26px_rgba(37,99,235,0.5)]",
          view === "list" ? "sm:flex" : ""
        )}
      >
        <div
          className={cn(
            "relative aspect-square overflow-hidden bg-slate-50",
            view === "list" ? "w-full sm:w-44 sm:flex-shrink-0" : "w-full"
          )}
        >
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
            unoptimized
            sizes={
              view === "list"
                ? "(max-width: 640px) 100vw, 176px"
                : "(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1280px) 24vw, 19vw"
            }
            loading="lazy"
          />

          <button
            type="button"
            onClick={handleWishlistClick}
            disabled={wishlistPending}
            className={cn(
              "absolute right-2 top-2 z-10 rounded-full border border-slate-200 bg-white p-1.5",
              "shadow-sm transition-all duration-200 hover:scale-105 hover:border-slate-300 hover:bg-slate-50",
              wishlistPending ? "cursor-not-allowed opacity-70" : ""
            )}
            aria-label={isWishlisted ? "Hapus dari wishlist" : "Tambah ke wishlist"}
          >
            <Heart
              className={cn(
                "h-4 w-4 transition-all duration-200",
                isWishlisted ? "fill-rose-500 text-rose-500" : "text-slate-500"
              )}
            />
          </button>

          {product.discount_percentage ? (
            <span className="absolute bottom-2 left-2 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
              {product.discount_percentage}%
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col p-3 sm:p-4">
          <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
            <span className="truncate rounded-full bg-slate-100 px-2 py-1">{product.category.name}</span>
            <span className="truncate">{product.brand.name}</span>
          </div>

          <h3
            className={cn(
              "mt-2 line-clamp-2 text-sm font-semibold leading-snug text-slate-900 transition-colors group-hover:text-blue-700",
              view === "list"
                ? "sm:text-base"
                : "min-h-[2.75rem]"
            )}
          >
            {product.name}
          </h3>

          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <div className="flex items-center gap-0.5">
              {ratingStars.map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "h-3.5 w-3.5",
                    star <= roundedRating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"
                  )}
                />
              ))}
            </div>
            <span className="font-semibold text-slate-700">{product.rating.toFixed(1)}</span>
            <span className="text-slate-400">- {product.sold_count} terjual</span>
          </div>

          <div className="mt-2 space-y-0.5">
            {hasOriginalPrice ? (
              <p className="text-xs text-slate-400 line-through">{formatCurrencyIDR(product.original_price as number)}</p>
            ) : null}
            <p className={cn("font-bold text-slate-950", view === "list" ? "text-lg" : "text-base sm:text-lg")}>
              {formatCurrencyIDR(product.price)}
            </p>
          </div>

          {product.free_shipping ? (
            <div className="mt-2 inline-flex w-fit rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
              Gratis ongkir
            </div>
          ) : null}
        </div>
      </article>
    </Link>
  );
};
