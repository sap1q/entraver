import type { Metadata } from "next";
import { ProductListingPage } from "@/components/features/products/ProductListingPage";

interface CategoryProductsPageProps {
  params: {
    categorySlug: string;
  };
}

const prettifySlug = (slug: string): string => {
  return slug
    .split("-")
    .filter((item) => item.length > 0)
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(" ");
};

export function generateMetadata({ params }: CategoryProductsPageProps): Metadata {
  const categoryName = prettifySlug(params.categorySlug);

  return {
    title: `${categoryName} - Produk Teknologi Entraverse`,
    description: `Jelajahi produk ${categoryName} terbaru di Entraverse. Temukan gadget dan elektronik original dengan harga terbaik.`,
  };
}

export default function CategoryProductsPage({ params }: CategoryProductsPageProps) {
  return <ProductListingPage forcedCategory={params.categorySlug} />;
}
