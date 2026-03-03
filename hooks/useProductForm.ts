"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  InventoryPlan,
  MatrixPricing,
  ProductFormState,
  VariantCombination,
  VariantDefinition,
} from "@/types/product";
import { createInitialProductForm, DEFAULT_MATRIX_ROW } from "@/lib/utils";

const IMAGE_SLOT_COUNT = 5;
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

const buildVariantCombinations = (variants: VariantDefinition[]): VariantCombination[] => {
  const normalized = variants
    .map((variant) => ({
      name: variant.name.trim(),
      options: variant.options.map((option) => option.trim()).filter(Boolean),
    }))
    .filter((variant) => variant.name.length > 0 && variant.options.length > 0);

  if (normalized.length === 0) {
    return [{ key: "default", label: "Default", values: {} }];
  }

  let combinations: Array<Record<string, string>> = [{}];
  normalized.forEach((variant) => {
    const next: Array<Record<string, string>> = [];
    combinations.forEach((current) => {
      variant.options.forEach((option) => {
        next.push({ ...current, [variant.name]: option });
      });
    });
    combinations = next;
  });

  return combinations.map((values) => {
    const entries = Object.entries(values);
    return {
      key: entries.map(([name, option]) => `${name}:${option}`).join("|"),
      label: entries.map(([name, option]) => `${name}: ${option}`).join(" / "),
      values,
    };
  });
};

const syncMatrixWithVariants = (
  variants: VariantDefinition[],
  prevMatrix: Record<string, MatrixPricing>
): Record<string, MatrixPricing> => {
  const nextMatrix: Record<string, MatrixPricing> = {};
  buildVariantCombinations(variants).forEach((combo) => {
    nextMatrix[combo.key] = { ...DEFAULT_MATRIX_ROW, ...(prevMatrix[combo.key] ?? {}) };
  });
  return nextMatrix;
};

const createInitialState = (): ProductFormState => {
  const initial = createInitialProductForm();
  const normalizedPhotos = Array.from({ length: IMAGE_SLOT_COUNT }, (_, index) => {
    return initial.photos[index] ?? { file: null, preview: "" };
  });
  return {
    ...initial,
    photos: normalizedPhotos,
    matrix: syncMatrixWithVariants(initial.variants, initial.matrix),
  };
};

const toSlug = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export function useProductForm() {
  const [form, setForm] = useState<ProductFormState>(createInitialState);
  const [imageErrors, setImageErrors] = useState<string[]>(
    Array.from({ length: IMAGE_SLOT_COUNT }, () => "")
  );

  const variants = form.variants;
  const photos = form.photos;
  const logistics = form.inventoryPlan;
  const matrixData = form.matrix;
  const tradeIn = form.tradeIn;

  const combinations = useMemo(() => buildVariantCombinations(variants), [variants]);

  useEffect(
    () => () => photos.forEach((slot) => slot.preview && URL.revokeObjectURL(slot.preview)),
    [photos]
  );

  const handleUpdateBasicInfo = <K extends keyof ProductFormState["basic"]>(
    field: K,
    value: ProductFormState["basic"][K]
  ) =>
    setForm((prev) => {
      if (field === "name") {
        const nextName = String(value);
        return {
          ...prev,
          basic: {
            ...prev.basic,
            name: nextName,
            slug: toSlug(nextName),
          },
        };
      }

      if (field === "spu") {
        return {
          ...prev,
          basic: {
            ...prev.basic,
            spu: String(value).replace(/\s+/g, "").toUpperCase(),
          },
        };
      }

      return { ...prev, basic: { ...prev.basic, [field]: value } };
    });

  const updateLogistics = (field: Exclude<keyof InventoryPlan, "volume">, value: number) =>
    setForm((prev) => {
      const normalizedValue = Number.isFinite(value) ? value : 0;
      const nextInventoryPlan = {
        ...prev.inventoryPlan,
        [field]: normalizedValue,
      };
      const volumeM3 = (nextInventoryPlan.length * nextInventoryPlan.width * nextInventoryPlan.height) / 1_000_000;
      nextInventoryPlan.volume = Number(volumeM3.toFixed(6));

      return {
        ...prev,
        inventoryPlan: nextInventoryPlan,
      };
    });

  const updateField = useCallback((key: string, field: keyof MatrixPricing, value: number | string) => {
    setForm((prev) => ({
      ...prev,
      matrix: {
        ...prev.matrix,
        [key]: {
          ...DEFAULT_MATRIX_ROW,
          ...(prev.matrix?.[key] ?? {}),
          [field]: typeof value === "number" && !Number.isFinite(value) ? 0 : value,
        },
      },
    }));
  }, []);

  const handleImageChange = (slotIndex: number, file: File | null) => {
    if (!file) {
      setForm((prev) => {
        const nextSlots = [...prev.photos];
        const currentPreview = nextSlots[slotIndex]?.preview;
        if (currentPreview) URL.revokeObjectURL(currentPreview);
        nextSlots[slotIndex] = { file: null, preview: "" };
        return { ...prev, photos: nextSlots };
      });
      setImageErrors((prev) => {
        const nextErrors = [...prev];
        nextErrors[slotIndex] = "";
        return nextErrors;
      });
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setImageErrors((prev) => {
        const nextErrors = [...prev];
        nextErrors[slotIndex] = "Maksimal ukuran file 2MB.";
        return nextErrors;
      });
      return;
    }

    setForm((prev) => {
      const nextSlots = [...prev.photos];
      const currentPreview = nextSlots[slotIndex]?.preview;
      if (currentPreview) URL.revokeObjectURL(currentPreview);
      nextSlots[slotIndex] = { file, preview: URL.createObjectURL(file) };
      return { ...prev, photos: nextSlots };
    });
    setImageErrors((prev) => {
      const nextErrors = [...prev];
      nextErrors[slotIndex] = "";
      return nextErrors;
    });
  };

  const handleRemoveImage = (slotIndex: number) => {
    setForm((prev) => {
      const nextSlots = [...prev.photos];
      const currentPreview = nextSlots[slotIndex]?.preview;
      if (currentPreview) URL.revokeObjectURL(currentPreview);
      nextSlots[slotIndex] = { file: null, preview: "" };
      return { ...prev, photos: nextSlots };
    });
    setImageErrors((prev) => {
      const nextErrors = [...prev];
      nextErrors[slotIndex] = "";
      return nextErrors;
    });
  };

  const handleDescriptionChange = (html: string) =>
    setForm((prev) => ({ ...prev, description: html }));
  const toggleTradeIn = () => setForm((prev) => ({ ...prev, tradeIn: !prev.tradeIn }));

  const addVariant = () =>
    setForm((prev) => {
      const nextVariants = [...prev.variants, { id: crypto.randomUUID(), name: "", options: [], draftOption: "" }];
      return {
        ...prev,
        variants: nextVariants,
        matrix: syncMatrixWithVariants(nextVariants, prev.matrix),
      };
    });

  const removeVariant = (variantId: string) =>
    setForm((prev) => {
      const nextVariants = prev.variants.filter((variant) => variant.id !== variantId);
      return {
        ...prev,
        variants: nextVariants,
        matrix: syncMatrixWithVariants(nextVariants, prev.matrix),
      };
    });

  const updateVariantName = (variantId: string, value: string) =>
    setForm((prev) => {
      const nextVariants = prev.variants.map((variant) =>
        variant.id === variantId ? { ...variant, name: value } : variant
      );
      return {
        ...prev,
        variants: nextVariants,
        matrix: syncMatrixWithVariants(nextVariants, prev.matrix),
      };
    });

  const updateDraftOption = (variantId: string, value: string) =>
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) =>
        variant.id === variantId ? { ...variant, draftOption: value } : variant
      ),
    }));

  const addVariantOption = (variantId: string) =>
    setForm((prev) => {
      const nextVariants = prev.variants.map((variant) => {
        if (variant.id !== variantId) return variant;
        const nextValue = variant.draftOption.trim();
        if (!nextValue || variant.options.includes(nextValue)) return variant;
        return { ...variant, options: [...variant.options, nextValue], draftOption: "" };
      });
      return {
        ...prev,
        variants: nextVariants,
        matrix: syncMatrixWithVariants(nextVariants, prev.matrix),
      };
    });

  const removeVariantOption = (variantId: string, option: string) =>
    setForm((prev) => {
      const nextVariants = prev.variants.map((variant) =>
        variant.id === variantId ? { ...variant, options: variant.options.filter((entry) => entry !== option) } : variant
      );
      return {
        ...prev,
        variants: nextVariants,
        matrix: syncMatrixWithVariants(nextVariants, prev.matrix),
      };
    });

  const buildCombinations = useCallback(
    (nextVariants?: VariantDefinition[]) => buildVariantCombinations(nextVariants ?? variants),
    [variants]
  );

  return {
    form,
    setForm,
    variants,
    photos,
    logistics,
    tradeIn,
    imageErrors,
    matrixData,
    combinations,
    generateCombinations: buildCombinations,
    updateField,
    handleUpdateBasicInfo,
    updateLogistics,
    handleImageChange,
    handleRemoveImage,
    handleDescriptionChange,
    toggleTradeIn,
    addVariant,
    removeVariant,
    updateVariantName,
    updateDraftOption,
    addVariantOption,
    removeVariantOption,
  };
}
