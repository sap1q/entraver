"use client";

import { useEffect, useMemo } from "react";
import BasicInfo from "@/components/features/products/BasicInfo";
import MediaUpload from "@/components/features/products/MediaUpload";
import DescriptionEditor from "@/components/features/products/DescriptionEditor";
import LogisticsParams from "@/components/features/products/LogisticsParams";
import TradeInToggle from "@/components/features/products/TradeInToggle";
import VariantManager from "@/components/features/products/VariantManager";
import VariantMatrix from "@/components/features/products/VariantMatrix";
import type { useProductForm } from "@/hooks/useProductForm";
import { useCategoryOptions } from "@/hooks/useCategories";

type ProductFormProps = {
  formState: ReturnType<typeof useProductForm>;
};

export default function ProductForm({ formState }: ProductFormProps) {
  const {
    form,
    variants,
    photos,
    imageErrors,
    matrixData,
    combinations,
    syncWarrantyVariantOptions,
    updateField,
    handleUpdateBasicInfo,
    logistics,
    tradeIn,
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
  } = formState;
  const { getCategory } = useCategoryOptions();
  const selectedCategory = useMemo(
    () => (form.basic.categoryId ? getCategory(form.basic.categoryId) ?? null : null),
    [form.basic.categoryId, getCategory]
  );

  const warrantyComponentsFromCategory = useMemo(() => {
    type WarrantyComponent = {
      label: string;
      valueType: "percent" | "amount";
      value: number;
      notes?: string;
    };

    const normalizeLabel = (value: string) => value.trim().replace(/\s+/g, " ");
    const pushUnique = (target: WarrantyComponent[], source: WarrantyComponent) => {
      const key = normalizeLabel(source.label).toLowerCase();
      if (!key) return;
      if (target.some((item) => normalizeLabel(item.label).toLowerCase() === key)) return;
      target.push(source);
    };

    const parseComponent = (item: unknown): WarrantyComponent | null => {
      if (typeof item === "string") {
        const label = normalizeLabel(item);
        if (!label) return null;
        return { label, valueType: "percent", value: 0 };
      }

      if (typeof item === "object" && item !== null) {
        const row = item as Record<string, unknown>;
        const label = normalizeLabel(String(row.label ?? row.name ?? ""));
        if (!label) return null;
        return {
          label,
          valueType: row.valueType === "amount" ? "amount" : "percent",
          value: Math.max(0, Number(row.value) || 0),
          notes: String(row.notes ?? "").trim() || undefined,
        };
      }

      return null;
    };

    const rawValue = selectedCategory?.program_garansi;
    const result: WarrantyComponent[] = [];
    if (!rawValue) return result;

    const extractFromParsed = (parsed: unknown) => {
      if (Array.isArray(parsed)) {
        parsed.forEach((item) => {
          const component = parseComponent(item);
          if (component) pushUnique(result, component);
        });
        return;
      }

      if (typeof parsed === "object" && parsed !== null) {
        const row = parsed as Record<string, unknown>;
        if (Array.isArray(row.components)) {
          row.components.forEach((item) => {
            const component = parseComponent(item);
            if (component) pushUnique(result, component);
          });
        }
      }
    };

    if (typeof rawValue === "string") {
      const trimmed = rawValue.trim();
      if (!trimmed) return result;

      try {
        extractFromParsed(JSON.parse(trimmed));
      } catch {
        trimmed
          .split(/\r?\n|,/)
          .map((item) => normalizeLabel(item))
          .filter(Boolean)
          .forEach((label) => pushUnique(result, { label, valueType: "percent", value: 0 }));
      }

      return result;
    }

    extractFromParsed(rawValue);
    return result;
  }, [selectedCategory?.program_garansi]);

  const categoryPricing = useMemo(() => {
    if (!selectedCategory) {
      return {
        minMarginPercent: 0,
        fees: null,
        currencySurcharge: 50,
        warrantyComponents: [],
      };
    }

    return {
      minMarginPercent: selectedCategory.min_margin ?? 0,
      fees: selectedCategory.fees ?? null,
      currencySurcharge: 50,
      warrantyComponents: warrantyComponentsFromCategory,
    };
  }, [selectedCategory, warrantyComponentsFromCategory]);

  const warrantyOptionsFromCategory = useMemo(() => {
    return warrantyComponentsFromCategory.map((item) => item.label).filter(Boolean);
  }, [warrantyComponentsFromCategory]);

  useEffect(() => {
    syncWarrantyVariantOptions(warrantyOptionsFromCategory);
  }, [syncWarrantyVariantOptions, warrantyOptionsFromCategory]);

  return (
    <div className="space-y-8">
      <BasicInfo basic={form.basic} handleUpdateBasicInfo={handleUpdateBasicInfo} />

      <MediaUpload
        photos={photos}
        imageErrors={imageErrors}
        handleImageChange={handleImageChange}
        handleRemoveImage={handleRemoveImage}
      />

      <DescriptionEditor value={form.description} onChange={handleDescriptionChange} />

      <LogisticsParams logistics={logistics} updateLogistics={updateLogistics} />

      <TradeInToggle tradeIn={tradeIn} toggleTradeIn={toggleTradeIn} />

      <VariantManager
        variants={variants}
        onAddVariant={addVariant}
        onRemoveVariant={removeVariant}
        onUpdateVariantName={updateVariantName}
        onUpdateDraftOption={updateDraftOption}
        onAddVariantOption={addVariantOption}
        onRemoveVariantOption={removeVariantOption}
      />

      <VariantMatrix
        combinations={combinations}
        matrixData={matrixData}
        updateField={updateField}
        inventoryVolumeCbm={logistics.volume}
        categoryPricing={categoryPricing}
      />
    </div>
  );
}

