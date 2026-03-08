import type { StorefrontProduct } from "@/lib/api/types";
import ProductCard from "./ProductCard";

type BestSellingProductsProps = {
  products: StorefrontProduct[];
  error?: string | null;
};

export default function BestSellingProducts({ products, error }: BestSellingProductsProps) {
  return (
    <section className="bg-white py-12">
      <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">Produk Terlaris Kami</h2>
        </div>

        {error ? (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {error}
          </div>
        ) : null}

        {products.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            Belum ada produk best selling.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
