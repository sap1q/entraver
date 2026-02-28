"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus, Upload, X, Grid3x3, Table, DollarSign, TrendingUp, Package, Calendar, Truck, Ship, Eye, EyeOff } from "lucide-react";
import api from "@/src/lib/axios";

type VariantDefinition = {
  id: string;
  name: string;
  options: string[];
  draftOption: string;
};

type VariantCombination = {
  key: string;
  label: string;
  values: Record<string, string>;
};

type MatrixPricing = {
  stock: number;
  purchasePrice: number;
  currency: string;
  exchangeRate: number;
  exchangeValue: number;
  shipping: string;
  shippingCost: number;
  arrivalCost: number;
  offlinePrice: number;
  entraversePrice: number;
  tokopediaPrice: number;
  shopeePrice: number;
  skuSeller: string;
  itemWeight: number;
  avgSalesA: number;
  stockoutDateA: string;
  stockoutFactorA: string;
  avgSalesB: number;
  stockoutDateB: string;
  stockoutFactorB: string;
  avgDailyFinal: number;
  predictedInitialStock: number;
  leadTime: number;
  reorderPoint: number;
  need15Days: number;
  inTransitStock: number;
  nextProcurement: number;
  procurementStatus: string;
};

type PhotoSlot = {
  file: File | null;
  preview: string;
};

type ProductFormState = {
  basic: {
    name: string;
    category: string;
    brand: string;
    spu: string;
    status: "active" | "pending_approval" | "inactive";
    barcode: string;
  };
  description: string;
  inventoryPlan: {
    weight: number;
    length: number;
    width: number;
    height: number;
    volume: number;
  };
  tradeIn: boolean;
  photos: PhotoSlot[];
  variants: VariantDefinition[];
  matrix: Record<string, MatrixPricing>;
};

const MAX_PHOTOS = 5;

const inputBase =
  "w-full rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white";
const matrixInputBase =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500";
const matrixInputNumberBase = `${matrixInputBase} text-right font-mono`;
const matrixSelectBase = `${matrixInputBase} text-left`;
const matrixStaticBase = 
  "h-12 w-full rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-3 text-right text-sm font-bold text-blue-700 shadow-sm";

const defaultMatrixRow: MatrixPricing = {
  stock: 0,
  purchasePrice: 0,
  currency: "SGD",
  exchangeRate: 1,
  exchangeValue: 13338,
  shipping: "Laut",
  shippingCost: 0,
  arrivalCost: 0,
  offlinePrice: 0,
  entraversePrice: 0,
  tokopediaPrice: 0,
  shopeePrice: 0,
  skuSeller: "",
  itemWeight: 0,
  avgSalesA: 0,
  stockoutDateA: "-",
  stockoutFactorA: "-",
  avgSalesB: 0,
  stockoutDateB: "-",
  stockoutFactorB: "-",
  avgDailyFinal: 0,
  predictedInitialStock: 0,
  leadTime: 0,
  reorderPoint: 0,
  need15Days: 0,
  inTransitStock: 0,
  nextProcurement: 0,
  procurementStatus: "Normal",
};

const createPhotoSlots = (): PhotoSlot[] =>
  Array.from({ length: MAX_PHOTOS }, () => ({ file: null, preview: "" }));

const createInitialForm = (): ProductFormState => ({
  basic: {
    name: "",
    category: "",
    brand: "",
    spu: "",
    status: "active",
    barcode: "",
  },
  description: "",
  inventoryPlan: {
    weight: 0,
    length: 0,
    width: 0,
    height: 0,
    volume: 0,
  },
  tradeIn: false,
  photos: createPhotoSlots(),
  variants: [{ id: crypto.randomUUID(), name: "Garansi", options: ["Tanpa Garansi"], draftOption: "" }],
  matrix: {},
});

const generateCombinations = (variants: VariantDefinition[]): VariantCombination[] => {
  const validVariants = variants
    .map((variant) => ({
      name: variant.name.trim(),
      options: variant.options.filter((option) => option.trim() !== ""),
    }))
    .filter((variant) => variant.name && variant.options.length > 0);

  if (validVariants.length === 0) {
    return [{ key: "default", label: "Default", values: {} }];
  }

  const combine = (
    index: number,
    current: Record<string, string>,
    acc: VariantCombination[]
  ) => {
    if (index >= validVariants.length) {
      const entries = Object.entries(current);
      const key = entries.map(([name, option]) => `${name}:${option}`).join("|");
      const label = entries.map(([, option]) => option).join(" / ");
      acc.push({ key, label, values: { ...current } });
      return;
    }

    const currentVariant = validVariants[index];
    currentVariant.options.forEach((option) => {
      current[currentVariant.name] = option;
      combine(index + 1, current, acc);
      delete current[currentVariant.name];
    });
  };

  const result: VariantCombination[] = [];
  combine(0, {}, result);
  return result;
};

const calculateFinalBeli = (row: MatrixPricing): number =>
  row.purchasePrice * row.exchangeValue + row.arrivalCost + row.shippingCost;

const calculateMargin = (sellingPrice: number, baseCost: number) => {
  const profit = sellingPrice - baseCost;
  const margin = baseCost > 0 ? (profit / baseCost) * 100 : 0;
  const isProfit = profit >= 0;

  return { profit, margin, isProfit };
};

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function AddMasterProdukPage() {
  const [form, setForm] = useState<ProductFormState>(createInitialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>("");
  const [payloadPreview, setPayloadPreview] = useState<string>("");
  const [activeVariantTab, setActiveVariantTab] = useState<string>("all");
  const [showAllColumns, setShowAllColumns] = useState(false);

  const combinations = useMemo(() => generateCombinations(form.variants), [form.variants]);

  useEffect(() => {
    setForm((prev) => {
      const nextMatrix: Record<string, MatrixPricing> = {};
      combinations.forEach((combo) => {
        nextMatrix[combo.key] = {
          ...defaultMatrixRow,
          ...(prev.matrix[combo.key] ?? {}),
        };
      });
      return { ...prev, matrix: nextMatrix };
    });
  }, [combinations]);

  useEffect(() => {
    return () => {
      form.photos.forEach((slot) => {
        if (slot.preview) URL.revokeObjectURL(slot.preview);
      });
    };
  }, [form.photos]);

  const updateBasicField = <K extends keyof ProductFormState["basic"]>(
    field: K,
    value: ProductFormState["basic"][K]
  ) => {
    setForm((prev) => ({ ...prev, basic: { ...prev.basic, [field]: value } }));
  };

  const updateInventoryField = (field: keyof ProductFormState["inventoryPlan"], value: number) => {
    setForm((prev) => ({
      ...prev,
      inventoryPlan: { ...prev.inventoryPlan, [field]: Number.isFinite(value) ? value : 0 },
    }));
  };

  const updateMatrixField = (key: string, field: keyof MatrixPricing, value: number | string) => {
    setForm((prev) => ({
      ...prev,
      matrix: {
        ...prev.matrix,
        [key]: {
          ...defaultMatrixRow,
          ...(prev.matrix[key] ?? {}),
          [field]: typeof value === "number" && !Number.isFinite(value) ? 0 : value,
        },
      },
    }));
  };

  const addVariant = () => {
    setForm((prev) => ({
      ...prev,
      variants: [...prev.variants, { id: crypto.randomUUID(), name: "", options: [], draftOption: "" }],
    }));
  };

  const removeVariant = (variantId: string) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((variant) => variant.id !== variantId),
    }));
  };

  const updateVariantName = (variantId: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) =>
        variant.id === variantId ? { ...variant, name: value } : variant
      ),
    }));
  };

  const updateDraftOption = (variantId: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) =>
        variant.id === variantId ? { ...variant, draftOption: value } : variant
      ),
    }));
  };

  const addVariantOption = (variantId: string) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) => {
        if (variant.id !== variantId) return variant;
        const nextValue = variant.draftOption.trim();
        if (!nextValue || variant.options.includes(nextValue)) return variant;
        return { ...variant, options: [...variant.options, nextValue], draftOption: "" };
      }),
    }));
  };

  const removeVariantOption = (variantId: string, option: string) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) =>
        variant.id === variantId
          ? { ...variant, options: variant.options.filter((entry) => entry !== option) }
          : variant
      ),
    }));
  };

  const updatePhotoSlot = (slotIndex: number, file: File | null) => {
    setForm((prev) => {
      const nextSlots = [...prev.photos];
      const currentPreview = nextSlots[slotIndex]?.preview;
      if (currentPreview) URL.revokeObjectURL(currentPreview);
      nextSlots[slotIndex] = {
        file,
        preview: file ? URL.createObjectURL(file) : "",
      };
      return { ...prev, photos: nextSlots };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage("");

    const variantPricingPayload = combinations.map((combo) => {
      const row = form.matrix[combo.key] ?? defaultMatrixRow;
      const purchasePriceIdr = calculateFinalBeli(row);

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
        purchase_price_idr: purchasePriceIdr,
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

    const totalStock = variantPricingPayload.reduce((sum, row) => sum + row.stock, 0);
    const inventoryPayload = {
      total_stock: totalStock,
      weight: form.inventoryPlan.weight,
      dimensions_cm: {
        length: form.inventoryPlan.length,
        width: form.inventoryPlan.width,
        height: form.inventoryPlan.height,
      },
      volume_m3: form.inventoryPlan.volume,
    };

    const payload = {
      name: form.basic.name,
      category: form.basic.category,
      brand: form.basic.brand,
      spu: form.basic.spu,
      barcode: form.basic.barcode,
      product_status: form.basic.status,
      trade_in: form.tradeIn,
      description: form.description,
      inventory: inventoryPayload,
      variants: form.variants.map((variant) => ({
        name: variant.name,
        options: variant.options,
      })),
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

  // Filter combinations based on active tab
  const filteredCombinations = useMemo(() => {
    if (activeVariantTab === "all") return combinations;
    return combinations.filter(combo => combo.key.includes(activeVariantTab));
  }, [combinations, activeVariantTab]);

  return (
    <div className="mx-auto w-full max-w-7xl">
      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
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
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {/* Informasi Dasar - Grid 2 kolom */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-800">Informasi Dasar</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nama Produk</label>
                <input
                  value={form.basic.name}
                  onChange={(event) => updateBasicField("name", event.target.value)}
                  className={inputBase}
                  placeholder="Masukkan nama produk"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Kategori</label>
                <input
                  value={form.basic.category}
                  onChange={(event) => updateBasicField("category", event.target.value)}
                  className={inputBase}
                  placeholder="Virtual Reality"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Brand</label>
                <input
                  value={form.basic.brand}
                  onChange={(event) => updateBasicField("brand", event.target.value)}
                  className={inputBase}
                  placeholder="Masukkan brand"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">SPU (SKU Induk)</label>
                <input
                  value={form.basic.spu}
                  onChange={(event) => updateBasicField("spu", event.target.value)}
                  className={inputBase}
                  placeholder="Masukkan SPU produk"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Status Produk</label>
                <select
                  value={form.basic.status}
                  onChange={(event) =>
                    updateBasicField(
                      "status",
                      event.target.value as ProductFormState["basic"]["status"]
                    )
                  }
                  className={inputBase}
                >
                  <option value="active">Aktif</option>
                  <option value="pending_approval">Menunggu Persetujuan</option>
                  <option value="inactive">Non Aktif</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Barcode</label>
                <input
                  value={form.basic.barcode}
                  onChange={(event) => updateBasicField("barcode", event.target.value)}
                  className={inputBase}
                  placeholder="Masukkan barcode produk"
                />
              </div>
            </div>
          </section>

          {/* Foto Produk - Grid dengan card */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-800">Foto Produk</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {form.photos.map((slot, index) => (
                <label
                  key={index}
                  className="relative flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-blue-200 bg-blue-50/50 text-slate-500 transition hover:border-blue-400 hover:bg-blue-50"
                >
                  {slot.preview ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={slot.preview} alt={`preview-${index}`} className="h-full w-full rounded-lg object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 opacity-0 transition hover:opacity-100">
                        <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-slate-700">Ganti</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4 text-center">
                      <Upload className="h-6 w-6 text-blue-500" />
                      <span className="mt-2 text-xs font-medium">Unggah foto</span>
                      <span className="mt-1 text-[10px] text-slate-400">Klik untuk browse</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => updatePhotoSlot(index, event.target.files?.[0] ?? null)}
                  />
                </label>
              ))}
            </div>
            <p className="text-xs text-slate-500">Unggah foto produk langsung dari perangkat Anda (maks. 5 foto).</p>
          </section>

          {/* Deskripsi - Full width */}
          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-800">Deskripsi</h2>
            <textarea
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              className={`${inputBase} min-h-40`}
              placeholder="Tulis detail produk..."
            />
          </section>

          {/* Parameter Perencanaan Stok - Grid 5 kolom */}
          <section className="space-y-4 rounded-lg border border-blue-100 bg-blue-50/30 p-4">
            <h2 className="text-xl font-semibold text-slate-800">Parameter Perencanaan Stok</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  <Package className="mr-1 inline h-4 w-4" /> Berat (gram)
                </label>
                <input
                  type="number"
                  value={form.inventoryPlan.weight}
                  onChange={(event) => updateInventoryField("weight", Number(event.target.value))}
                  className={inputBase}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Panjang (cm)</label>
                <input
                  type="number"
                  value={form.inventoryPlan.length}
                  onChange={(event) => updateInventoryField("length", Number(event.target.value))}
                  className={inputBase}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Lebar (cm)</label>
                <input
                  type="number"
                  value={form.inventoryPlan.width}
                  onChange={(event) => updateInventoryField("width", Number(event.target.value))}
                  className={inputBase}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Tinggi (cm)</label>
                <input
                  type="number"
                  value={form.inventoryPlan.height}
                  onChange={(event) => updateInventoryField("height", Number(event.target.value))}
                  className={inputBase}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Volume (m³)</label>
                <input
                  type="number"
                  value={form.inventoryPlan.volume}
                  onChange={(event) => updateInventoryField("volume", Number(event.target.value))}
                  className={inputBase}
                />
              </div>
            </div>
          </section>

          {/* Trade-In - Card dengan toggle */}
          <section className="flex items-center justify-between rounded-lg border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-800">Trade-In</h2>
              <p className="text-sm text-slate-600">Aktifkan trade-in agar produk dapat ditukar dengan barang lama.</p>
            </div>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, tradeIn: !prev.tradeIn }))}
              className={`relative h-8 w-14 rounded-full transition ${form.tradeIn ? "bg-blue-600" : "bg-slate-300"}`}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-md transition ${form.tradeIn ? "left-7" : "left-1"}`}
              />
            </button>
          </section>

          {/* Varian Produk - Dengan grid untuk opsi */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-800">Varian Produk</h2>
              <button
                type="button"
                onClick={addVariant}
                className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
              >
                <Plus className="h-4 w-4" />
                Tambah Varian
              </button>
            </div>

            <div className="space-y-4">
              {form.variants.map((variant) => (
                <div key={variant.id} className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                    <div className="md:col-span-3">
                      <label className="mb-1 block text-sm font-medium text-slate-700">Nama Varian</label>
                      <input
                        value={variant.name}
                        onChange={(event) => updateVariantName(variant.id, event.target.value)}
                        className={inputBase}
                        placeholder="Contoh: Ukuran, Warna"
                      />
                    </div>
                    <div className="md:col-span-9">
                      <label className="mb-1 block text-sm font-medium text-slate-700">Opsi Varian</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {variant.options.map((option) => (
                          <span
                            key={option}
                            className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm text-blue-700"
                          >
                            {option}
                            <button
                              type="button"
                              onClick={() => removeVariantOption(variant.id, option)}
                              className="ml-1 rounded-full p-0.5 text-blue-500 hover:bg-blue-200"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          value={variant.draftOption}
                          onChange={(event) => updateDraftOption(variant.id, event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              addVariantOption(variant.id);
                            }
                          }}
                          className={`${inputBase} flex-1`}
                          placeholder="Tambah opsi (tekan Enter)"
                        />
                        <button
                          type="button"
                          onClick={() => addVariantOption(variant.id)}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                          Tambah
                        </button>
                        {form.variants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVariant(variant.id)}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-100"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Harga & Detail Varian - Enhanced dengan ukuran lebih besar */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-800">Harga & Detail Varian</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAllColumns(!showAllColumns)}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  {showAllColumns ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {showAllColumns ? "Sembunyikan Kolom" : "Tampilkan Semua Kolom"}
                </button>
                <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => setActiveVariantTab("all")}
                    className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                      activeVariantTab === "all" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    <Table className="h-3.5 w-3.5" />
                    Semua
                  </button>
                  {combinations.slice(0, 3).map((combo, idx) => (
                    <button
                      key={combo.key}
                      type="button"
                      onClick={() => setActiveVariantTab(combo.key)}
                      className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                        activeVariantTab === combo.key ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-800"
                      }`}
                    >
                      <Grid3x3 className="h-3.5 w-3.5" />
                      {combo.label.length > 12 ? `${combo.label.substring(0, 12)}...` : combo.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary Cards - Ukuran lebih besar */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Total Varian</p>
                    <p className="text-3xl font-bold text-slate-800">{combinations.length}</p>
                  </div>
                  <div className="rounded-full bg-blue-100 p-3">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Total Stok</p>
                    <p className="text-3xl font-bold text-slate-800">
                      {combinations.reduce((sum, combo) => sum + (form.matrix[combo.key]?.stock || 0), 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="rounded-full bg-emerald-100 p-3">
                    <TrendingUp className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Rata-rata Harga Beli</p>
                    <p className="text-xl font-bold text-slate-800">
                      {formatRupiah(combinations.reduce((sum, combo) => {
                        const row = form.matrix[combo.key] || defaultMatrixRow;
                        return sum + calculateFinalBeli(row);
                      }, 0) / (combinations.length || 1))}
                    </p>
                  </div>
                  <div className="rounded-full bg-amber-100 p-3">
                    <DollarSign className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Perlu Restock</p>
                    <p className="text-3xl font-bold text-slate-800">
                      {combinations.filter(combo => form.matrix[combo.key]?.procurementStatus === "Perlu Restock").length}
                    </p>
                  </div>
                  <div className="rounded-full bg-purple-100 p-3">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Main Table dengan ukuran input lebih besar */}
            <div className="thin-scrollbar scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent w-full overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="min-w-[3200px] w-full border-separate border-spacing-x-3 border-spacing-y-3">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-30 w-[250px] border-r-2 border-slate-100 bg-slate-50 px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 shadow-[4px_0_8px_rgba(0,0,0,0.05)]">
                      NAMA OPSI
                    </th>
                    
                    {/* Purchase Information Group */}
                    <th colSpan={7} className="bg-blue-50/50 px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-blue-700">
                      <Ship className="mr-1 inline h-4 w-4" /> INFORMASI PEMBELIAN
                    </th>
                    
                    {/* Selling Prices Group */}
                    <th colSpan={4} className="bg-green-50/50 px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-green-700">
                      <DollarSign className="mr-1 inline h-4 w-4" /> HARGA JUAL
                    </th>
                    
                    {/* Basic Info Group */}
                    <th colSpan={3} className="bg-amber-50/50 px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-amber-700">
                      <Package className="mr-1 inline h-4 w-4" /> INFORMASI DASAR
                    </th>
                    
                    {/* Period A Group - Hide if not showAllColumns */}
                    {(showAllColumns || activeVariantTab !== "all") && (
                      <>
                        <th colSpan={3} className="bg-purple-50/50 px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-purple-700">
                          <Calendar className="mr-1 inline h-4 w-4" /> PERIODE A
                        </th>
                        
                        {/* Period B Group */}
                        <th colSpan={3} className="bg-indigo-50/50 px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-indigo-700">
                          <Calendar className="mr-1 inline h-4 w-4" /> PERIODE B
                        </th>
                        
                        {/* Forecasting Group */}
                        <th colSpan={7} className="bg-rose-50/50 px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-rose-700">
                          <TrendingUp className="mr-1 inline h-4 w-4" /> PERAMALAN STOK
                        </th>
                      </>
                    )}
                  </tr>
                  <tr className="bg-slate-50">
                    <th className="sticky left-0 z-20 border-r-2 border-slate-100 bg-slate-50 px-4 py-3 text-left text-xs font-semibold text-slate-500 shadow-[4px_0_8px_rgba(0,0,0,0.05)]">
                      Varian
                    </th>
                    
                    {/* Purchase Information Headers */}
                    <th className="w-[140px] px-3 py-3 text-left text-xs font-semibold text-slate-500">Harga Beli</th>
                    <th className="w-[100px] px-3 py-3 text-left text-xs font-semibold text-slate-500">Kurs</th>
                    <th className="w-[140px] px-3 py-3 text-left text-xs font-semibold text-slate-500">Nilai Tukar</th>
                    <th className="w-[120px] px-3 py-3 text-left text-xs font-semibold text-slate-500">Pengiriman</th>
                    <th className="w-[140px] px-3 py-3 text-left text-xs font-semibold text-slate-500">Biaya Kirim</th>
                    <th className="w-[140px] px-3 py-3 text-left text-xs font-semibold text-slate-500">Biaya Kedatangan</th>
                    <th className="w-[160px] border-r-2 border-slate-100 px-3 py-3 text-left text-xs font-semibold text-blue-600">Harga Beli (Rp)</th>
                    
                    {/* Selling Prices Headers */}
                    <th className="w-[160px] px-3 py-3 text-left text-xs font-semibold text-slate-500">Offline</th>
                    <th className="w-[160px] px-3 py-3 text-left text-xs font-semibold text-blue-600">Entraverse</th>
                    <th className="w-[160px] px-3 py-3 text-left text-xs font-semibold text-green-600">Tokopedia</th>
                    <th className="w-[160px] px-3 py-3 text-left text-xs font-semibold text-orange-600">Shopee</th>
                    
                    {/* Basic Info Headers */}
                    <th className="w-[120px] px-3 py-3 text-left text-xs font-semibold text-slate-500">Stok</th>
                    <th className="w-[160px] px-3 py-3 text-left text-xs font-semibold text-slate-500">SKU Penjual</th>
                    <th className="w-[120px] border-r-2 border-slate-100 px-3 py-3 text-left text-xs font-semibold text-slate-500">Berat</th>
                    
                    {/* Period A Headers - Hide if not showAllColumns */}
                    {(showAllColumns || activeVariantTab !== "all") && (
                      <>
                        <th className="w-[140px] px-3 py-3 text-left text-xs font-semibold text-slate-500">Rata-rata A</th>
                        <th className="w-[150px] px-3 py-3 text-left text-xs font-semibold text-slate-500">Tgl Habis A</th>
                        <th className="w-[120px] px-3 py-3 text-left text-xs font-semibold text-slate-500">Faktor A</th>
                        
                        {/* Period B Headers */}
                        <th className="w-[140px] px-3 py-3 text-left text-xs font-semibold text-slate-500">Rata-rata B</th>
                        <th className="w-[150px] px-3 py-3 text-left text-xs font-semibold text-slate-500">Tgl Habis B</th>
                        <th className="w-[120px] px-3 py-3 text-left text-xs font-semibold text-slate-500">Faktor B</th>
                        
                        {/* Forecasting Headers */}
                        <th className="w-[140px] px-3 py-3 text-left text-xs font-semibold text-slate-500">Rata Final</th>
                        <th className="w-[140px] px-3 py-3 text-left text-xs font-semibold text-slate-500">Prediksi Awal</th>
                        <th className="w-[120px] px-3 py-3 text-left text-xs font-semibold text-slate-500">Lead Time</th>
                        <th className="w-[120px] px-3 py-3 text-left text-xs font-semibold text-slate-500">ROP</th>
                        <th className="w-[120px] px-3 py-3 text-left text-xs font-semibold text-slate-500">Kebutuhan 15H</th>
                        <th className="w-[120px] px-3 py-3 text-left text-xs font-semibold text-slate-500">In Transit</th>
                        <th className="w-[140px] px-3 py-3 text-left text-xs font-semibold text-slate-500">Pengadaan</th>
                        <th className="w-[140px] px-3 py-3 text-left text-xs font-semibold text-slate-500">Status</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredCombinations.map((combo) => {
                    const row: MatrixPricing = {
                      ...defaultMatrixRow,
                      ...(form.matrix[combo.key] ?? {}),
                    };
                    const purchasePriceIdr = calculateFinalBeli(row);
                    const offlineMetrics = calculateMargin(row.offlinePrice, purchasePriceIdr);
                    const entraverseMetrics = calculateMargin(row.entraversePrice, purchasePriceIdr);
                    const tokopediaMetrics = calculateMargin(row.tokopediaPrice, purchasePriceIdr);
                    const shopeeMetrics = calculateMargin(row.shopeePrice, purchasePriceIdr);

                    return (
                      <tr key={combo.key} className="border-b border-slate-100 align-middle transition-colors hover:bg-blue-50/30">
                        <td className="sticky left-0 z-20 border-r-2 border-slate-100 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 shadow-[4px_0_8px_rgba(0,0,0,0.05)]">
                          {combo.label}
                        </td>
                        
                        {/* Purchase Information */}
                        <td className="px-3 py-2 align-middle">
                          <input
                            type="number"
                            className={matrixInputNumberBase}
                            value={row.purchasePrice}
                            placeholder="0"
                            onChange={(event) =>
                              updateMatrixField(combo.key, "purchasePrice", Number(event.target.value))
                            }
                          />
                        </td>
                        <td className="px-3 py-2 align-middle">
                          <select
                            className={matrixSelectBase}
                            value={row.currency}
                            onChange={(event) => updateMatrixField(combo.key, "currency", event.target.value)}
                          >
                            <option value="SGD">SGD</option>
                            <option value="USD">USD</option>
                            <option value="CNY">CNY</option>
                          </select>
                        </td>
                        <td className="px-3 py-2 align-middle">
                          <input
                            type="number"
                            className={matrixInputNumberBase}
                            value={row.exchangeValue}
                            placeholder="0"
                            onChange={(event) =>
                              updateMatrixField(combo.key, "exchangeValue", Number(event.target.value))
                            }
                          />
                        </td>
                        <td className="px-3 py-2 align-middle">
                          <select
                            className={matrixSelectBase}
                            value={row.shipping}
                            onChange={(event) => updateMatrixField(combo.key, "shipping", event.target.value)}
                          >
                            <option value="Laut">Laut</option>
                            <option value="Udara">Udara</option>
                            <option value="Darat">Darat</option>
                          </select>
                        </td>
                        <td className="px-3 py-2 align-middle">
                          <input
                            type="number"
                            className={matrixInputNumberBase}
                            value={row.shippingCost}
                            placeholder="0"
                            onChange={(event) =>
                              updateMatrixField(combo.key, "shippingCost", Number(event.target.value))
                            }
                          />
                        </td>
                        <td className="px-3 py-2 align-middle">
                          <input
                            type="number"
                            className={matrixInputNumberBase}
                            value={row.arrivalCost}
                            placeholder="0"
                            onChange={(event) =>
                              updateMatrixField(combo.key, "arrivalCost", Number(event.target.value))
                            }
                          />
                        </td>
                        <td className="border-r-2 border-slate-100 px-3 py-2 align-middle">
                          <div className={matrixStaticBase}>
                            {formatRupiah(purchasePriceIdr)}
                          </div>
                        </td>
                        
                        {/* Selling Prices */}
                        <td className="px-3 py-2 align-middle">
                          <input
                            type="number"
                            className={`${matrixInputNumberBase} ${!offlineMetrics.isProfit ? "border-red-200 bg-red-50" : ""}`}
                            value={row.offlinePrice}
                            placeholder="0"
                            onChange={(event) =>
                              updateMatrixField(combo.key, "offlinePrice", Number(event.target.value))
                            }
                          />
                          <div className="mt-1 flex items-center justify-between">
                            <span className={`text-[10px] ${offlineMetrics.isProfit ? "text-emerald-600" : "text-red-600"}`}>
                              {offlineMetrics.margin.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 align-middle">
                          <input
                            type="number"
                            className={`${matrixInputNumberBase} text-blue-700 ${!entraverseMetrics.isProfit ? "border-red-200 bg-red-50" : ""}`}
                            value={row.entraversePrice}
                            placeholder="0"
                            onChange={(event) =>
                              updateMatrixField(combo.key, "entraversePrice", Number(event.target.value))
                            }
                          />
                          <div className="mt-1 flex items-center justify-between">
                            <span className={`text-[10px] ${entraverseMetrics.isProfit ? "text-emerald-600" : "text-red-600"}`}>
                              {entraverseMetrics.margin.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 align-middle">
                          <input
                            type="number"
                            className={`${matrixInputNumberBase} text-green-700 ${!tokopediaMetrics.isProfit ? "border-red-200 bg-red-50" : ""}`}
                            value={row.tokopediaPrice}
                            placeholder="0"
                            onChange={(event) =>
                              updateMatrixField(combo.key, "tokopediaPrice", Number(event.target.value))
                            }
                          />
                          <div className="mt-1 flex items-center justify-between">
                            <span className={`text-[10px] ${tokopediaMetrics.isProfit ? "text-emerald-600" : "text-red-600"}`}>
                              {tokopediaMetrics.margin.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 align-middle">
                          <input
                            type="number"
                            className={`${matrixInputNumberBase} text-orange-700 ${!shopeeMetrics.isProfit ? "border-red-200 bg-red-50" : ""}`}
                            value={row.shopeePrice}
                            placeholder="0"
                            onChange={(event) =>
                              updateMatrixField(combo.key, "shopeePrice", Number(event.target.value))
                            }
                          />
                          <div className="mt-1 flex items-center justify-between">
                            <span className={`text-[10px] ${shopeeMetrics.isProfit ? "text-emerald-600" : "text-red-600"}`}>
                              {shopeeMetrics.margin.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        
                        {/* Basic Info */}
                        <td className="px-3 py-2 align-middle">
                          <input
                            type="number"
                            className={matrixInputNumberBase}
                            value={row.stock}
                            placeholder="0"
                            onChange={(event) =>
                              updateMatrixField(combo.key, "stock", Number(event.target.value))
                            }
                          />
                        </td>
                        <td className="px-3 py-2 align-middle">
                          <input
                            className={matrixSelectBase}
                            value={row.skuSeller}
                            onChange={(event) => updateMatrixField(combo.key, "skuSeller", event.target.value)}
                            placeholder="SKU-123"
                          />
                        </td>
                        <td className="border-r-2 border-slate-100 px-3 py-2 align-middle">
                          <input
                            type="number"
                            className={matrixInputNumberBase}
                            value={row.itemWeight}
                            placeholder="0"
                            onChange={(event) =>
                              updateMatrixField(combo.key, "itemWeight", Number(event.target.value))
                            }
                          />
                        </td>
                        
                        {/* Period A - Hide if not showAllColumns */}
                        {(showAllColumns || activeVariantTab !== "all") && (
                          <>
                            <td className="px-3 py-2 align-middle">
                              <input type="number" placeholder="0" className={matrixInputNumberBase} value={row.avgSalesA} onChange={(event) => updateMatrixField(combo.key, "avgSalesA", Number(event.target.value))} />
                            </td>
                            <td className="px-3 py-2 align-middle">
                              <input placeholder="DD/MM/YYYY" className={matrixSelectBase} value={row.stockoutDateA} onChange={(event) => updateMatrixField(combo.key, "stockoutDateA", event.target.value)} />
                            </td>
                            <td className="px-3 py-2 align-middle">
                              <input placeholder="-" className={matrixSelectBase} value={row.stockoutFactorA} onChange={(event) => updateMatrixField(combo.key, "stockoutFactorA", event.target.value)} />
                            </td>
                            
                            {/* Period B */}
                            <td className="px-3 py-2 align-middle">
                              <input type="number" placeholder="0" className={matrixInputNumberBase} value={row.avgSalesB} onChange={(event) => updateMatrixField(combo.key, "avgSalesB", Number(event.target.value))} />
                            </td>
                            <td className="px-3 py-2 align-middle">
                              <input placeholder="DD/MM/YYYY" className={matrixSelectBase} value={row.stockoutDateB} onChange={(event) => updateMatrixField(combo.key, "stockoutDateB", event.target.value)} />
                            </td>
                            <td className="px-3 py-2 align-middle">
                              <input placeholder="-" className={matrixSelectBase} value={row.stockoutFactorB} onChange={(event) => updateMatrixField(combo.key, "stockoutFactorB", event.target.value)} />
                            </td>
                            
                            {/* Forecasting */}
                            <td className="px-3 py-2 align-middle">
                              <input type="number" placeholder="0" className={matrixInputNumberBase} value={row.avgDailyFinal} onChange={(event) => updateMatrixField(combo.key, "avgDailyFinal", Number(event.target.value))} />
                            </td>
                            <td className="px-3 py-2 align-middle">
                              <input type="number" placeholder="0" className={matrixInputNumberBase} value={row.predictedInitialStock} onChange={(event) => updateMatrixField(combo.key, "predictedInitialStock", Number(event.target.value))} />
                            </td>
                            <td className="px-3 py-2 align-middle">
                              <input type="number" placeholder="0" className={matrixInputNumberBase} value={row.leadTime} onChange={(event) => updateMatrixField(combo.key, "leadTime", Number(event.target.value))} />
                            </td>
                            <td className="px-3 py-2 align-middle">
                              <input type="number" placeholder="0" className={matrixInputNumberBase} value={row.reorderPoint} onChange={(event) => updateMatrixField(combo.key, "reorderPoint", Number(event.target.value))} />
                            </td>
                            <td className="px-3 py-2 align-middle">
                              <input type="number" placeholder="0" className={matrixInputNumberBase} value={row.need15Days} onChange={(event) => updateMatrixField(combo.key, "need15Days", Number(event.target.value))} />
                            </td>
                            <td className="px-3 py-2 align-middle">
                              <input type="number" placeholder="0" className={matrixInputNumberBase} value={row.inTransitStock} onChange={(event) => updateMatrixField(combo.key, "inTransitStock", Number(event.target.value))} />
                            </td>
                            <td className="px-3 py-2 align-middle">
                              <input type="number" placeholder="0" className={matrixInputNumberBase} value={row.nextProcurement} onChange={(event) => updateMatrixField(combo.key, "nextProcurement", Number(event.target.value))} />
                            </td>
                            <td className="px-3 py-2 align-middle">
                              <select className={matrixSelectBase} value={row.procurementStatus} onChange={(event) => updateMatrixField(combo.key, "procurementStatus", event.target.value)}>
                                <option value="Normal">Normal</option>
                                <option value="Perlu Restock">Restock</option>
                                <option value="Aman">Aman</option>
                              </select>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Legend untuk informasi margin */}
            {(showAllColumns || activeVariantTab !== "all") && (
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded-full bg-emerald-500"></span>
                  <span>Profit</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded-full bg-red-500"></span>
                  <span>Loss</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-mono">%</span>
                  <span>Margin</span>
                </div>
              </div>
            )}
          </section>
        </div>

        {saveMessage && (
          <div className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
            saveMessage.includes("berhasil") 
              ? "border-green-200 bg-green-50 text-green-700" 
              : "border-amber-200 bg-amber-50 text-amber-700"
          }`}>
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
      </section>
    </div>
  );
}
