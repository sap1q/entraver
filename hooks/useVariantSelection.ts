"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ProductVariantGroup } from "@/types/product.types";
import { slugifyValue } from "@/lib/utils/formatter";

const getVariantParamKey = (groupName: string, index: number): string => {
  if (index === 0) return "variant";

  const normalized = slugifyValue(groupName).replace(/-/g, "_");
  return normalized.length > 0 ? `variant_${normalized}` : `variant_${index + 1}`;
};

const findOptionByToken = (options: string[], token: string | null): string | null => {
  if (!token) return null;
  return options.find((option) => slugifyValue(option) === token) ?? null;
};

export const useVariantSelection = (variants: ProductVariantGroup[]) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedVariants = useMemo(() => {
    const result: Record<string, string> = {};

    variants.forEach((group, index) => {
      if (group.options.length === 0) return;

      const paramKey = getVariantParamKey(group.name, index);
      const legacyFirstGroupToken = index === 0 ? searchParams.get("variant") : null;
      const token = searchParams.get(paramKey) ?? legacyFirstGroupToken;

      const matched = findOptionByToken(group.options, token);

      result[group.name] = matched ?? group.options[0];
    });

    return result;
  }, [searchParams, variants]);

  const updateVariant = useCallback(
    (groupName: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const nextSelected = {
        ...selectedVariants,
        [groupName]: value,
      };

      variants.forEach((group, index) => {
        const selected = nextSelected[group.name];
        const paramKey = getVariantParamKey(group.name, index);

        if (!selected) {
          params.delete(paramKey);
          return;
        }

        params.set(paramKey, slugifyValue(selected));
      });

      const nextQuery = params.toString();

      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams, selectedVariants, variants]
  );

  return {
    selectedVariants,
    updateVariant,
    activeVariantToken: searchParams.get("variant") ?? null,
  };
};
