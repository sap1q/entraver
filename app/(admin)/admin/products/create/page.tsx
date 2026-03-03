"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import BasicInfo from "@/components/features/products/BasicInfo";
import MediaUpload from "@/components/features/products/MediaUpload";
import DescriptionEditor from "@/components/features/products/DescriptionEditor";
import LogisticsParams from "@/components/features/products/LogisticsParams";
import TradeInToggle from "@/components/features/products/TradeInToggle";
import VariantManager from "@/components/features/products/VariantManager";
import VariantMatrix from "@/components/features/products/VariantMatrix";
import api from "@/lib/axios";
import { calculateFinalBeli, DEFAULT_MATRIX_ROW } from "@/lib/utils";
import { useProductForm } from "@/hooks/useProductForm";

export default function CreateProductPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [payloadPreview, setPayloadPreview] = useState("");
  const {
    form,
    variants,
    photos,
    imageErrors,
    matrixData,
    combinations,
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
  } = useProductForm();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setSaveMessage("");

    const variantPricingPayload = combinations.map((combo) => {
      const row = matrixData?.[combo.key] ?? DEFAULT_MATRIX_ROW;
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
        tokopedia_fee: row.tokopediaFee,
        shopee_price: row.shopeePrice,
        shopee_fee: row.shopeeFee,
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
      slug: form.basic.slug,
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
      variants: variants.map((variant) => ({ name: variant.name, options: variant.options })),
      variant_pricing: variantPricingPayload,
      photos: photos.filter((slot) => slot.file).map((slot) => slot.file?.name ?? ""),
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
    <div className="mx-auto w-full max-w-7xl">
      <form onSubmit={handleSubmit} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-800">Tambah Produk</h1>
            <p className="mt-1 text-sm text-slate-500">Perbarui detail produk dan varian Anda.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/master-produk"
              className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
            >
              Batalkan
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </div>

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

          <VariantMatrix combinations={combinations} matrixData={matrixData} updateField={updateField} />
        </div>

        {saveMessage && (
          <div
            className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
              saveMessage.includes("berhasil")
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-amber-200 bg-amber-50 text-amber-700"
            }`}
          >
            {saveMessage}
          </div>
        )}

        {payloadPreview && (
          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold text-slate-700">Preview Payload JSON</p>
            <pre className="max-h-72 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
              {payloadPreview}
            </pre>
          </div>
        )}
      </form>
    </div>
  );
}
