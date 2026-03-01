"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AddProductFormLayout from "@/src/components/products/AddProductFormLayout";
import api from "@/src/lib/axios";
import type { MatrixPricing, ProductFormState } from "@/src/types/product";
import {
  createInitialProductForm,
  DEFAULT_MATRIX_ROW,
  INPUT_BASE_CLASS,
} from "@/src/utils/product-form-defaults";
import { calculateFinalBeli, generateCombinations } from "@/src/utils/product-helpers";

export default function CreateProductPage() {
  const [form, setForm] = useState<ProductFormState>(createInitialProductForm);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [payloadPreview, setPayloadPreview] = useState("");

  const combinations = useMemo(() => generateCombinations(form.variants), [form.variants]);

  useEffect(() => {
    setForm((prev) => {
      const nextMatrix: Record<string, MatrixPricing> = {};
      combinations.forEach((combo) => {
        nextMatrix[combo.key] = { ...DEFAULT_MATRIX_ROW, ...(prev.matrix[combo.key] ?? {}) };
      });
      return { ...prev, matrix: nextMatrix };
    });
  }, [combinations]);

  useEffect(() => () => form.photos.forEach((slot) => slot.preview && URL.revokeObjectURL(slot.preview)), [form.photos]);

  const updateBasicField = <K extends keyof ProductFormState["basic"]>(field: K, value: ProductFormState["basic"][K]) =>
    setForm((prev) => ({ ...prev, basic: { ...prev.basic, [field]: value } }));

  const updateInventoryField = (field: keyof ProductFormState["inventoryPlan"], value: number) =>
    setForm((prev) => ({
      ...prev,
      inventoryPlan: { ...prev.inventoryPlan, [field]: Number.isFinite(value) ? value : 0 },
    }));

  const updateMatrixField = useCallback((key: string, field: keyof MatrixPricing, value: number | string) => {
    setForm((prev) => ({
      ...prev,
      matrix: {
        ...prev.matrix,
        [key]: {
          ...DEFAULT_MATRIX_ROW,
          ...(prev.matrix[key] ?? {}),
          [field]: typeof value === "number" && !Number.isFinite(value) ? 0 : value,
        },
      },
    }));
  }, []);

  const updatePhotoSlot = (slotIndex: number, file: File | null) =>
    setForm((prev) => {
      const nextSlots = [...prev.photos];
      const currentPreview = nextSlots[slotIndex]?.preview;
      if (currentPreview) URL.revokeObjectURL(currentPreview);
      nextSlots[slotIndex] = { file, preview: file ? URL.createObjectURL(file) : "" };
      return { ...prev, photos: nextSlots };
    });

  const addVariant = () =>
    setForm((prev) => ({
      ...prev,
      variants: [...prev.variants, { id: crypto.randomUUID(), name: "", options: [], draftOption: "" }],
    }));

  const removeVariant = (variantId: string) =>
    setForm((prev) => ({ ...prev, variants: prev.variants.filter((variant) => variant.id !== variantId) }));

  const updateVariantName = (variantId: string, value: string) =>
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) => (variant.id === variantId ? { ...variant, name: value } : variant)),
    }));

  const updateDraftOption = (variantId: string, value: string) =>
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) => (variant.id === variantId ? { ...variant, draftOption: value } : variant)),
    }));

  const addVariantOption = (variantId: string) =>
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) => {
        if (variant.id !== variantId) return variant;
        const nextValue = variant.draftOption.trim();
        if (!nextValue || variant.options.includes(nextValue)) return variant;
        return { ...variant, options: [...variant.options, nextValue], draftOption: "" };
      }),
    }));

  const removeVariantOption = (variantId: string, option: string) =>
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) =>
        variant.id === variantId ? { ...variant, options: variant.options.filter((entry) => entry !== option) } : variant
      ),
    }));

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage("");

    const variantPricingPayload = combinations.map((combo) => {
      const row = form.matrix[combo.key] ?? DEFAULT_MATRIX_ROW;
      return {
        sku: `${form.basic.spu || "SKU"}-${combo.key.replaceAll("|", "-").replaceAll(":", "-")}`,
        label: combo.label,
        options: combo.values,
        stock: row.stock,
        purchase_price: row.purchasePrice,
        currency: row.currency,
        exchange_rate: row.exchangeRate,
        exchange_value: row.exchangeValue,
        shipping: row.shipping,
        shipping_cost: row.shippingCost,
        arrival_cost: row.arrivalCost,
        purchase_price_idr: calculateFinalBeli(row),
        offline_price: row.offlinePrice,
        entraverse_price: row.entraversePrice,
        tokopedia_price: row.tokopediaPrice,
        shopee_price: row.shopeePrice,
        sku_seller: row.skuSeller,
        item_weight: row.itemWeight,
        avg_sales_a: row.avgSalesA,
        stockout_date_a: row.stockoutDateA,
        stockout_factor_a: row.stockoutFactorA,
        avg_sales_b: row.avgSalesB,
        stockout_date_b: row.stockoutDateB,
        stockout_factor_b: row.stockoutFactorB,
        avg_daily_final: row.avgDailyFinal,
        predicted_initial_stock: row.predictedInitialStock,
        lead_time: row.leadTime,
        reorder_point: row.reorderPoint,
        need_15_days: row.need15Days,
        in_transit_stock: row.inTransitStock,
        next_procurement: row.nextProcurement,
        status: row.procurementStatus,
      };
    });

    const payload = {
      name: form.basic.name,
      category: form.basic.category,
      brand: form.basic.brand,
      spu: form.basic.spu,
      barcode: form.basic.barcode,
      product_status: form.basic.status,
      trade_in: form.tradeIn,
      description: form.description,
      inventory: {
        total_stock: variantPricingPayload.reduce((sum, row) => sum + row.stock, 0),
        weight: form.inventoryPlan.weight,
        dimensions_cm: form.inventoryPlan.length
          ? { length: form.inventoryPlan.length, width: form.inventoryPlan.width, height: form.inventoryPlan.height }
          : { length: 0, width: 0, height: 0 },
        volume_m3: form.inventoryPlan.volume,
      },
      variants: form.variants.map((variant) => ({ name: variant.name, options: variant.options })),
      variant_pricing: variantPricingPayload,
      photos: form.photos.filter((slot) => slot.file).map((slot) => slot.file?.name ?? ""),
    };

    setPayloadPreview(JSON.stringify(payload, null, 2));
    try {
      await api.post("/v1/admin/products", payload);
      setSaveMessage("Produk berhasil disimpan.");
    } catch {
      setSaveMessage("Payload berhasil dibentuk, tetapi penyimpanan API gagal (cek autentikasi/admin API).");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AddProductFormLayout
      form={form}
      combinations={combinations}
      inputClassName={INPUT_BASE_CLASS}
      isSaving={isSaving}
      saveMessage={saveMessage}
      payloadPreview={payloadPreview}
      onSave={handleSave}
      onBasicFieldChange={updateBasicField}
      onPhotoChange={updatePhotoSlot}
      onDescriptionChange={(value) => setForm((prev) => ({ ...prev, description: value }))}
      onInventoryFieldChange={updateInventoryField}
      onToggleTradeIn={() => setForm((prev) => ({ ...prev, tradeIn: !prev.tradeIn }))}
      onAddVariant={addVariant}
      onRemoveVariant={removeVariant}
      onUpdateVariantName={updateVariantName}
      onUpdateDraftOption={updateDraftOption}
      onAddVariantOption={addVariantOption}
      onRemoveVariantOption={removeVariantOption}
      onUpdateMatrixField={updateMatrixField}
    />
  );
}
