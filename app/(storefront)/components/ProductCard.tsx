import Link from "next/link";
import type { StorefrontProduct } from "@/lib/api/types";

type ProductCardProps = {
  product: StorefrontProduct;
};

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/products/${encodeURIComponent(product.slug)}`}
      className="block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="aspect-square bg-slate-100">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">No Image</div>
        )}
      </div>

      <div className="space-y-3 p-4">
        <h3 className="min-h-10 text-sm font-semibold text-slate-900 md:text-base">{product.name}</h3>
        <p className="text-lg font-bold text-blue-700 md:text-xl">{product.formattedPrice}</p>
      </div>
    </Link>
  );
}
