import type { StorefrontBrand, StorefrontProduct } from "@/lib/api/types";
import { storefrontApi } from "@/lib/api/storefront";
import HeroSlider from "./components/HeroSlider";
import CategoriesSection from "./components/CategoriesSection";
import BrandsSection from "./components/BrandsSection";
import FeaturedProducts from "./components/FeaturedProducts";
import BestSellingProducts from "./components/BestSellingProducts";

export const revalidate = 60;

const deriveBrandFallback = (products: StorefrontProduct[], limit = 10): StorefrontBrand[] => {
  const map = new Map<string, StorefrontBrand>();

  products.forEach((product, index) => {
    if (!product.brand) return;
    const normalized = product.brand.trim();
    if (!normalized) return;

    const key = normalized.toLowerCase();
    if (map.has(key)) return;

    map.set(key, {
      id: `fallback-brand-${index + 1}`,
      name: normalized,
      slug: normalized.toLowerCase().replace(/\s+/g, "-"),
      image: product.image,
    });
  });

  return Array.from(map.values()).slice(0, limit);
};

export default async function StorefrontPage() {
  const [categoriesResult, featuredResult, bestSellingResult, newestResult, brandsResult] = await Promise.all([
    storefrontApi.getCategories(12),
    storefrontApi.getFeaturedProducts(10),
    storefrontApi.getBestSellingProducts(10),
    storefrontApi.getNewestProducts(24),
    storefrontApi.getBrands(10),
  ]);

  const featuredProducts =
    featuredResult.data.length > 0 ? featuredResult.data : newestResult.data.slice(0, 10);

  const bestSellingProducts =
    bestSellingResult.data.length > 0 ? bestSellingResult.data : newestResult.data.slice(10, 20);

  const brands =
    brandsResult.data.length > 0
      ? brandsResult.data
      : deriveBrandFallback([...featuredProducts, ...bestSellingProducts], 10);

  return (
    <div className="bg-[#f4f5f7]">
      <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-6 md:px-6 md:pb-14 md:pt-8">
        <HeroSlider />
      </div>

      <CategoriesSection
        categories={categoriesResult.data}
        totalCategories={categoriesResult.total}
        error={categoriesResult.error}
        viewAllLink="/products?view=all"
      />
      <BrandsSection brands={brands} error={brandsResult.error} />
      <FeaturedProducts products={featuredProducts} error={featuredResult.error} />
      <BestSellingProducts products={bestSellingProducts} error={bestSellingResult.error} />
    </div>
  );
}
