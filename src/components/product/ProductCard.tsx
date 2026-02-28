import Image from "next/image";
import type { Product } from "@/src/types/product";
import { Button } from "@/src/components/ui/Button";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_8px_30px_rgba(2,8,23,0.45)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_50px_-24px_rgba(37,99,235,0.7)]">
      <div className="relative h-56 w-full overflow-hidden bg-slate-900">
        <Image
          src={product.main_image || "/product-placeholder.svg"}
          alt={product.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <div className="space-y-3 p-5">
        <h3 className="text-lg font-semibold tracking-tight text-white">
          {product.name}
        </h3>
        <p className="text-sm text-slate-400">{product.brand}</p>
        <p className="text-xl font-bold text-brand-primary">
          {product.formatted_price || `Rp ${Number(product.price).toLocaleString("id-ID")}`}
        </p>
        <Button className="w-full">View Details</Button>
      </div>
    </article>
  );
}
