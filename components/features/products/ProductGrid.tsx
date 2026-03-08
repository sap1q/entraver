"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useProductsContext } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/features/products/ProductCard";
import { ProductGridSkeleton } from "@/components/features/products/ProductGridSkeleton";

const getViewMode = (view: string | null): "grid" | "list" => {
  return view === "list" ? "list" : "grid";
};

export const ProductGrid = () => {
  const searchParams = useSearchParams();
  const { products, loading, error, meta, refetch } = useProductsContext();
  const view = getViewMode(searchParams.get("view"));

  if (loading) {
    return <ProductGridSkeleton count={8} view={view} />;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-rose-500" />
        <p className="mt-3 text-sm text-rose-700">{error}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700"
        >
          <RefreshCcw className="h-4 w-4" />
          Muat ulang
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <h3 className="text-lg font-semibold text-slate-800">Produk tidak ditemukan</h3>
        <p className="mt-2 text-sm text-slate-500">
          Coba ubah filter atau kata kunci pencarian untuk melihat produk lainnya.
        </p>
      </div>
    );
  }

  const startItem = meta ? (meta.current_page - 1) * meta.per_page + 1 : 1;
  const endItem = meta ? Math.min(meta.current_page * meta.per_page, meta.total) : products.length;
  const total = meta?.total ?? products.length;

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">
        Menampilkan <span className="font-semibold text-slate-900">{startItem}</span> -
        <span className="font-semibold text-slate-900"> {endItem}</span> dari{" "}
        <span className="font-semibold text-slate-900">{total}</span> produk
      </p>

      <div
        className={cn(
          "grid gap-4 md:gap-5",
          view === "list" ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        )}
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} view={view} />
        ))}
      </div>
    </div>
  );
};
