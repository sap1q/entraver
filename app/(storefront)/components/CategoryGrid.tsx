import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { StorefrontCategory } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import CategoryCard from "./CategoryCard";

type CategoryGridProps = {
  categories: StorefrontCategory[];
  totalCategories?: number;
  showViewAll?: boolean;
  viewAllLink?: string;
  viewAllLabel?: string;
};

const overlays = ["FOR YOUR LIFESTYLE", "CRAFTED FOR EVERY MOMENT", "", ""] as const;
const gridClasses = [
  "aspect-[16/10] md:aspect-[4/3] lg:col-span-6 lg:row-span-2 lg:aspect-auto lg:min-h-[560px]",
  "aspect-[16/10] md:aspect-[4/3] lg:col-span-6 lg:aspect-auto lg:min-h-[270px]",
  "aspect-[16/10] md:aspect-[4/3] lg:col-span-3 lg:aspect-auto lg:min-h-[270px]",
  "aspect-[16/10] md:aspect-[4/3] lg:col-span-3 lg:aspect-auto lg:min-h-[270px]",
] as const;

export default function CategoryGrid({
  categories,
  totalCategories,
  showViewAll = true,
  viewAllLink = "/products?view=all",
  viewAllLabel = "Lihat Semua Kategori",
}: CategoryGridProps) {
  const displayCategories = categories.slice(0, 4);
  const counter =
    typeof totalCategories === "number" && totalCategories > 0 ? ` (${totalCategories})` : "";

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12 lg:grid-rows-2">
        {displayCategories.map((category, index) => (
          <CategoryCard
            key={category.id}
            category={category}
            overlay={overlays[index]}
            className={cn(gridClasses[index] ?? "aspect-[16/10]")}
          />
        ))}
      </div>

      {showViewAll && categories.length > 0 ? (
        <div className="mt-8 flex justify-center">
          <Link
            href={viewAllLink}
            className="group inline-flex items-center gap-2 rounded-full border border-slate-300 px-6 py-3 text-sm font-medium text-slate-700 transition-all duration-300 hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 md:text-base"
            aria-label={`${viewAllLabel}${counter}`}
          >
            <span>
              {viewAllLabel}
              {counter}
            </span>
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      ) : null}
    </>
  );
}
