import { Badge } from "@/src/components/ui/Badge";
import { ProductGrid } from "@/src/components/product/ProductGrid";
import { fetchProducts } from "@/src/lib/api/products";

export default async function Page() {
  const products = await fetchProducts();

  return (
    <div className="bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.3),transparent_42%),linear-gradient(to_bottom,#020617,#0f172a_60%,#1e293b)] text-white">
      <section className="mx-auto w-full max-w-7xl px-6 pb-8 pt-14 md:pt-20">
        <Badge variant="primary" className="mb-4 uppercase tracking-[0.2em]">
          Featured Electronics
        </Badge>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
          Discover Precision-Crafted Technology for Modern Living
        </h1>
        <p className="mt-5 max-w-2xl text-base text-slate-300 md:text-lg">
          Curated devices with premium build quality, top-tier performance, and
          minimalist design language.
        </p>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 pb-14">
        <ProductGrid products={products} />
      </section>
    </div>
  );
}
