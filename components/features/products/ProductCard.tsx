"use client";

import type { MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Star, Truck } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product.types";

interface ProductCardProps {
  product: Product;
  view?: "grid" | "list";
}

const formatCurrency = (value: number): string => {
  return `Rp ${new Intl.NumberFormat("id-ID").format(Math.max(0, Math.round(value)))}`;
};

const ratingStars = Array.from({ length: 5 }, (_, index) => index + 1);

export const ProductCard = ({ product, view = "grid" }: ProductCardProps) => {
  const { toggleWishlist, isInWishlist, isPending } = useWishlist();
  const isWishlisted = Boolean(product.is_wishlisted) || isInWishlist(product.id);
  const wishlistPending = isPending(product.id);
  const imageSrc = product.image?.trim() ? product.image : "/assets/images/hero/e-hero.png";

  const handleWishlistClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    void toggleWishlist(product.id);
  };

  return (
    <Link href={`/products/${encodeURIComponent(product.slug)}`} className="group block h-full">
      <article
        className={cn(
          "h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300",
          "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-100/60",
          view === "list" ? "md:flex md:min-h-[228px]" : ""
        )}
      >
        <div
          className={cn(
            "relative overflow-hidden bg-slate-100",
            view === "list" ? "md:w-64 md:flex-shrink-0" : "aspect-square"
          )}
        >
          <div className={cn("relative", view === "list" ? "aspect-[4/3] h-full md:aspect-auto" : "aspect-square")}>
            <Image
              src={imageSrc}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              unoptimized
              sizes={
                view === "list"
                  ? "(max-width: 768px) 100vw, 260px"
                  : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              }
              loading="lazy"
            />
          </div>

          <button
            type="button"
            onClick={handleWishlistClick}
            disabled={wishlistPending}
            className={cn(
              "absolute right-3 top-3 z-10 rounded-full p-2.5 shadow-lg transition-all duration-300",
              "border border-white/60 bg-white/35 backdrop-blur-md hover:scale-110 hover:bg-white/45",
              wishlistPending ? "cursor-not-allowed opacity-70" : ""
            )}
            aria-label={isWishlisted ? "Hapus dari wishlist" : "Tambah ke wishlist"}
          >
            <Heart
              className={cn(
                "h-5 w-5 transition-all duration-300",
                isWishlisted ? "fill-rose-500 text-rose-500" : "text-white drop-shadow-sm"
              )}
            />
          </button>

          {product.discount_percentage ? (
            <span className="absolute bottom-3 left-3 rounded-full bg-rose-500 px-2 py-1 text-xs font-semibold text-white">
              {product.discount_percentage}%
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col p-4">
          <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
            <span className="truncate">{product.category.name}</span>
            <span aria-hidden>•</span>
            <span className="truncate">{product.brand.name}</span>
          </div>

          <h3 className="line-clamp-2 min-h-12 text-sm font-semibold text-slate-800 transition-colors group-hover:text-blue-600 md:text-base">
            {product.name}
          </h3>

          <div className="mt-2 flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              {ratingStars.map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "h-4 w-4",
                    star <= Math.floor(product.rating)
                      ? "fill-amber-400 text-amber-400"
                      : "fill-slate-200 text-slate-200"
                  )}
                />
              ))}
              <span className="font-medium text-slate-700">{product.rating.toFixed(1)}</span>
            </div>
            <span className="text-slate-400">|</span>
            <span className="text-slate-500">{product.sold_count} terjual</span>
          </div>

          <div className="mt-3 space-y-1">
            {typeof product.original_price === "number" ? (
              <p className="text-sm text-slate-400 line-through">{formatCurrency(product.original_price)}</p>
            ) : null}
            <p className="text-xl font-bold text-slate-900">{formatCurrency(product.price)}</p>
          </div>

          {product.free_shipping ? (
            <div className="mt-3 inline-flex w-fit items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
              <Truck className="h-3.5 w-3.5" />
              <span>Gratis ongkir</span>
            </div>
          ) : null}

          <p className="mt-3 text-xs">
            {product.stock > 10 ? (
              <span className="font-medium text-emerald-600">Stok tersedia</span>
            ) : product.stock > 0 ? (
              <span className="font-medium text-amber-600">Sisa {product.stock}</span>
            ) : (
              <span className="font-medium text-rose-600">Stok habis</span>
            )}
          </p>
        </div>
      </article>
    </Link>
  );
};
