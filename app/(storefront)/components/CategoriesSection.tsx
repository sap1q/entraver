import type { StorefrontCategory } from "@/lib/api/types";
import CategoryGrid from "./CategoryGrid";

type CategoriesSectionProps = {
  categories: StorefrontCategory[];
  totalCategories?: number;
  error?: string | null;
  showViewAll?: boolean;
  viewAllLink?: string;
};

export default function CategoriesSection({
  categories,
  totalCategories,
  error,
  showViewAll = true,
  viewAllLink = "/products?view=all",
}: CategoriesSectionProps) {
  return (
    <section className="bg-white py-12">
      <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Kategori Pilihan</p>
          <h2 className="mt-2 max-w-3xl text-3xl font-extrabold uppercase leading-[1.08] text-slate-900 md:text-5xl">
            Experience Beyond Limits
          </h2>
        </div>

        {error ? (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {error}
          </div>
        ) : null}

        {categories.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            Belum ada kategori yang tersedia.
          </div>
        ) : (
          <CategoryGrid
            categories={categories}
            totalCategories={totalCategories}
            showViewAll={showViewAll}
            viewAllLink={viewAllLink}
          />
        )}
      </div>
    </section>
  );
}
