"use client";

import { useMemo } from "react";
import { useVariantSelection } from "@/hooks/useVariantSelection";
import type { ProductDetail } from "@/types/product.types";
import { OrderSidebar } from "./OrderSidebar";
import { ProductDescription } from "./ProductDescription";
import { ProductHero } from "./ProductHero";
import { ProductReviews } from "./ProductReviews";
import { ProductSpecifications } from "./ProductSpecifications";
import { resolveSelectedProductPrice, resolveSelectedVariantRow, resolveVariantRowIdentity } from "./productPricing";

interface ProductDetailClientProps {
  product: ProductDetail;
}

export const ProductDetailClient = ({ product }: ProductDetailClientProps) => {
  const { selectedVariants, updateVariant } = useVariantSelection(product.variants ?? []);
  const selectedVariantRow = useMemo(
    () => resolveSelectedVariantRow(product, selectedVariants),
    [product, selectedVariants]
  );
  const selectedVariantSku = useMemo(
    () => (selectedVariantRow ? resolveVariantRowIdentity(selectedVariantRow) : null),
    [selectedVariantRow]
  );
  const selectedPrice = useMemo(
    () => resolveSelectedProductPrice(product, selectedVariants, selectedVariantSku),
    [product, selectedVariantSku, selectedVariants]
  );

  return (
    <div className="mt-8 pb-24 lg:pb-0">
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <ProductHero
            product={product}
            selectedPrice={selectedPrice}
            selectedVariants={selectedVariants}
            onVariantChange={updateVariant}
          />
          <ProductSpecifications product={product} />
          <ProductDescription description={product.description} />
          <ProductReviews productId={product.id} initialSummary={product.reviews_summary} />
        </div>

        <div className="space-y-4 lg:col-span-4">
          <OrderSidebar
            product={product}
            selectedPrice={selectedPrice}
            selectedVariants={selectedVariants}
            selectedVariantSku={selectedVariantSku}
          />
        </div>
      </div>
    </div>
  );
};
