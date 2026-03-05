"use client";

import { RefreshCw, Settings2, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { MatrixPricing, VariantCombination } from "@/types/product";
import type { CategoryFees, FeeChannel } from "@/types/category.types";
import { DEFAULT_MATRIX_ROW } from "@/lib/utils";
import VariantRow from "@/components/features/products/VariantRow";
import { useVariantCalculations } from "@/hooks/useVariantCalculations";

type VariantTableProps = {
  combinations: VariantCombination[];
  matrixData: Record<string, MatrixPricing>;
  onUpdateField: (key: string, field: keyof MatrixPricing, value: number | string) => void;
  inventoryVolumeCbm?: number;
  categoryPricing?: {
    minMarginPercent: number;
    fees: CategoryFees | null;
    currencySurcharge?: number;
    warrantyComponents?: Array<{
      label: string;
      valueType: "percent" | "amount";
      value: number;
      notes?: string;
    }>;
  };
};

const headers = [
  "Varian / Nama Opsi",
  "Harga Beli",
  "Kurs",
  "Nilai Tukar Kurs",
  "Pengiriman",
  "Biaya Kedatangan",
  "Harga Beli (Rp.)",
  "Harga Jual Offline",
  "Harga Jual Entraverse",
  "Harga Jual Tokopedia",
  "Harga Jual Shopee",
  "Stok",
  "SKU Penjual",
  "Berat Barang",
  "Rata-Rata Penjualan Periode A",
  "Tanggal Stok Habis Periode A",
  "Faktor Stok Habis Periode A",
  "Rata-Rata Penjualan Periode B",
  "Tanggal Stok Habis Periode B",
  "Faktor Stok Habis Periode B",
  "Rata-Rata Penjualan per Hari Final",
  "Start Date",
  "Prediksi Stok Awal",
  "Lead Time (hari)",
  "Reorder Point",
  "Kebutuhan 15 Hari",
  "Stok Dalam Perjalanan",
  "Pengadaan Barang Selanjutnya",
  "Status",
];

const groupedHeaders = [
  { label: "Informasi Produk", span: 1, tone: "text-slate-700 bg-slate-100/80" },
  { label: "Harga Beli & Kurs", span: 5, tone: "text-indigo-700 bg-indigo-50" },
  { label: "Landed Cost", span: 1, tone: "text-blue-700 bg-blue-50" },
  { label: "Harga Jual Channel", span: 4, tone: "text-cyan-700 bg-cyan-50" },
  { label: "Operasional SKU", span: 3, tone: "text-violet-700 bg-violet-50" },
  { label: "Forecast Periode A", span: 3, tone: "text-amber-700 bg-amber-50" },
  { label: "Forecast Periode B", span: 3, tone: "text-orange-700 bg-orange-50" },
  { label: "Replenishment Planning", span: 8, tone: "text-emerald-700 bg-emerald-50" },
  { label: "Status", span: 1, tone: "text-slate-700 bg-slate-100/80" },
] as const;

const platformLabel: Record<string, string> = {
  Tokopedia: "text-emerald-700",
  Shopee: "text-orange-700",
  Entraverse: "text-slate-700",
};

type ExchangeMode = "auto" | "manual";

const CURRENCY_OPTIONS: MatrixPricing["currency"][] = ["SGD", "USD", "AUD", "EUR", "IDR", "CNY"];

const BASE_EXCHANGE_RATES: Record<MatrixPricing["currency"], number> = {
  SGD: 13338,
  USD: 15420,
  AUD: 10250,
  EUR: 16700,
  IDR: 1,
  CNY: 2140,
};

const BASE_SHIPPING_RATES: Record<MatrixPricing["shipping"], number> = {
  Laut: 7_500_000,
  Udara: 155_000,
  Darat: 0,
};

const SHIPPING_UNIT_LABEL: Record<MatrixPricing["shipping"], string> = {
  Laut: "CBM",
  Udara: "KG",
  Darat: "Unit",
};

const SHIPPING_HELPER_TEXT: Record<MatrixPricing["shipping"], string> = {
  Laut: "Rumus: volume produk (CBM) x tarif laut.",
  Udara: "Rumus: berat varian (KG) x tarif udara.",
  Darat: "Rumus: tarif darat flat per varian.",
};

const formatRupiah = new Intl.NumberFormat("id-ID");
const PRICE_SYNC_FIELDS: Array<keyof MatrixPricing> = [
  "offlinePrice",
  "entraversePrice",
  "tokopediaPrice",
  "shopeePrice",
  "tokopediaFee",
  "tiktokPrice",
  "tiktokFee",
  "shopeeFee",
];

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizePercent = (value: number): number => Math.max(0, value);
const normalizeText = (value: string): string => value.trim().replace(/\s+/g, " ").toLowerCase();

const calculateFeeTotals = (channel: FeeChannel | undefined, basePrice: number) => {
  const components = channel?.components ?? [];
  let amountTotal = 0;
  let percentTotal = 0;

  components.forEach((component) => {
    const value = Math.max(0, toNumber(component.value));
    const minValue = Math.max(0, toNumber(component.min));
    const maxValue = Math.max(0, toNumber(component.max));
    const isPercent = component.valueType !== "amount";

    let fee = isPercent ? basePrice * (value / 100) : value;
    if (minValue > 0) fee = Math.max(fee, minValue);
    if (maxValue > 0) fee = Math.min(fee, maxValue);

    amountTotal += Math.max(0, fee);
    if (isPercent) percentTotal += value;
  });

  return {
    amountTotal: Math.round(amountTotal),
    percentTotal: normalizePercent(percentTotal),
  };
};

const buildAutoChannelPrices = (
  combo: VariantCombination,
  row: MatrixPricing,
  pricing: VariantTableProps["categoryPricing"]
): Pick<
  MatrixPricing,
  "offlinePrice" | "entraversePrice" | "tokopediaPrice" | "tiktokPrice" | "shopeePrice" | "tokopediaFee" | "tiktokFee" | "shopeeFee"
> => {
  const minMarginPercent = Math.max(0, toNumber(pricing?.minMarginPercent));
  const currencySurcharge = Math.max(0, toNumber(pricing?.currencySurcharge ?? 50));
  const fees = pricing?.fees;
  const marketplaceChannel = fees?.marketplace ?? fees?.tokopedia_tiktok;
  const hasEntraverseComponents = (fees?.entraverse?.components?.length ?? 0) > 0;
  const entraverseChannel = hasEntraverseComponents ? fees?.entraverse : marketplaceChannel;

  const usdSgdSurcharge = row.currency === "USD" || row.currency === "SGD" ? currencySurcharge : 0;
  const landedCost = Math.max(0, row.purchasePrice * row.exchangeValue + row.arrivalCost + row.shippingCost);
  const baseRecommended = Math.round((landedCost + usdSgdSurcharge) * (1 + minMarginPercent / 100));

  const warrantyOption = (() => {
    const warrantyEntry = Object.entries(combo.values ?? {}).find(([key]) => normalizeText(key) === "garansi");
    return warrantyEntry ? String(warrantyEntry[1] ?? "").trim() : "";
  })();

  const warrantyComponent = (pricing?.warrantyComponents ?? []).find(
    (item) => normalizeText(item.label) === normalizeText(warrantyOption)
  );

  const warrantyAdjustment =
    warrantyComponent && warrantyOption
      ? warrantyComponent.valueType === "amount"
        ? Math.round(Math.max(0, toNumber(warrantyComponent.value)))
        : Math.round(baseRecommended * (Math.max(0, toNumber(warrantyComponent.value)) / 100))
      : 0;

  const baseWithWarranty = baseRecommended + warrantyAdjustment;

  const entraverseFee = calculateFeeTotals(entraverseChannel, baseWithWarranty);
  const tokopediaFee = calculateFeeTotals(marketplaceChannel, baseWithWarranty);
  const tiktokFee = calculateFeeTotals(marketplaceChannel, baseWithWarranty);
  const shopeeFee = calculateFeeTotals(fees?.shopee, baseWithWarranty);

  return {
    offlinePrice: baseWithWarranty,
    entraversePrice: baseWithWarranty + entraverseFee.amountTotal,
    tokopediaPrice: baseWithWarranty + tokopediaFee.amountTotal,
    tiktokPrice: baseWithWarranty + tiktokFee.amountTotal,
    shopeePrice: baseWithWarranty + shopeeFee.amountTotal,
    tokopediaFee: tokopediaFee.percentTotal,
    tiktokFee: tiktokFee.percentTotal,
    shopeeFee: shopeeFee.percentTotal,
  };
};

export default function VariantTable({
  combinations,
  matrixData,
  onUpdateField,
  inventoryVolumeCbm = 0,
  categoryPricing,
}: VariantTableProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [exchangeMode, setExchangeMode] = useState<ExchangeMode>("auto");
  const [exchangeRates, setExchangeRates] = useState<Record<MatrixPricing["currency"], number>>(BASE_EXCHANGE_RATES);
  const [rateCurrency, setRateCurrency] = useState<MatrixPricing["currency"]>("SGD");
  const [rateInput, setRateInput] = useState<number>(BASE_EXCHANGE_RATES.SGD);
  const [shippingMethod, setShippingMethod] = useState<MatrixPricing["shipping"]>("Laut");
  const [shippingRates, setShippingRates] = useState<Record<MatrixPricing["shipping"], number>>(BASE_SHIPPING_RATES);
  const [shippingRateInput, setShippingRateInput] = useState<number>(BASE_SHIPPING_RATES.Laut);
  const [lastRateSyncAt, setLastRateSyncAt] = useState<Date>(new Date());
  const { calculateVariant } = useVariantCalculations();

  const normalizedRows = useMemo(() => {
    const result: Record<string, MatrixPricing> = {};
    combinations.forEach((combo) => {
      const calculated = calculateVariant({ ...DEFAULT_MATRIX_ROW, ...(matrixData[combo.key] ?? {}) });
      result[combo.key] = {
        ...calculated,
        ...buildAutoChannelPrices(combo, calculated, categoryPricing),
      };
    });
    return result;
  }, [calculateVariant, categoryPricing, combinations, matrixData]);

  useEffect(() => {
    if (exchangeMode !== "auto") return;

    combinations.forEach((combo) => {
      const row = normalizedRows[combo.key];
      if (!row) return;

      const targetRate = exchangeRates[row.currency];
      if (!Number.isFinite(targetRate)) return;
      if (row.exchangeValue === targetRate) return;

      onUpdateField(combo.key, "exchangeValue", targetRate);
    });
  }, [combinations, exchangeMode, exchangeRates, normalizedRows, onUpdateField]);

  useEffect(() => {
    combinations.forEach((combo) => {
      const calculatedRow = normalizedRows[combo.key];
      const currentRow = matrixData[combo.key] ?? DEFAULT_MATRIX_ROW;

      PRICE_SYNC_FIELDS.forEach((field) => {
        const nextValue = Math.max(0, toNumber(calculatedRow[field]));
        const currentValue = Math.max(0, toNumber(currentRow[field]));
        if (nextValue !== currentValue) {
          onUpdateField(combo.key, field, nextValue);
        }
      });
    });
  }, [combinations, matrixData, normalizedRows, onUpdateField]);

  const handleApplyRate = () => {
    const normalizedRate = Math.max(0, Number(rateInput) || 0);
    setExchangeRates((prev) => ({
      ...prev,
      [rateCurrency]: normalizedRate,
    }));
    setLastRateSyncAt(new Date());
  };

  const handleResetRates = () => {
    setExchangeRates(BASE_EXCHANGE_RATES);
    setRateInput(BASE_EXCHANGE_RATES[rateCurrency]);
    setLastRateSyncAt(new Date());
  };

  const handleApplyShippingRate = () => {
    const normalizedRate = Math.max(0, Number(shippingRateInput) || 0);
    setShippingRates((prev) => ({
      ...prev,
      [shippingMethod]: normalizedRate,
    }));
  };

  const handleResetShippingRates = () => {
    setShippingRates(BASE_SHIPPING_RATES);
    setShippingRateInput(BASE_SHIPPING_RATES[shippingMethod]);
  };

  const handleApplyShippingSettings = () => {
    combinations.forEach((combo) => {
      const row = normalizedRows[combo.key];
      if (!row) return;

      const shippingRate = Math.max(0, Number(shippingRates[shippingMethod]) || 0);
      const weightKg = Math.max(0, Number(row.itemWeight) || 0) / 1000;
      const volumeCbm = Math.max(0, Number(inventoryVolumeCbm) || 0);

      let computedArrivalCost = 0;
      if (shippingMethod === "Udara") {
        computedArrivalCost = Math.round(weightKg * shippingRate);
      } else if (shippingMethod === "Laut") {
        computedArrivalCost = Math.round(volumeCbm * shippingRate);
      } else {
        computedArrivalCost = Math.round(shippingRate);
      }

      onUpdateField(combo.key, "shipping", shippingMethod);
      onUpdateField(combo.key, "arrivalCost", computedArrivalCost);
    });
  };

  return (
    <>
      <div className="relative mb-3 flex items-center justify-end">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsSettingsOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-blue-200 bg-white text-blue-600 shadow-sm transition hover:bg-blue-50"
            title="Pengaturan Kurs & Ongkir"
            aria-label={isSettingsOpen ? "Tutup pengaturan kurs dan ongkir" : "Buka pengaturan kurs dan ongkir"}
            aria-expanded={isSettingsOpen}
          >
            {isSettingsOpen ? <X className="h-4 w-4" /> : <Settings2 className="h-4 w-4" />}
          </button>

          <AnimatePresence>
            {isSettingsOpen ? (
              <motion.div
                initial={{ opacity: 0, x: 20, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute right-0 top-12 z-40 w-[min(92vw,860px)] rounded-xl border border-blue-100 bg-white p-4 shadow-xl"
              >
                <div className="grid gap-4 lg:grid-cols-2">
                  <section className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <h3 className="text-sm font-semibold text-slate-800">Sistem Kurs (Hybrid)</h3>
                    <p className="mt-1 text-xs text-slate-500">Atur kurs global atau aktifkan mode manual per varian.</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Auto pricing: kategori terpilih (margin + fees) dipakai otomatis. Kurs USD/SGD dikenakan tambahan
                      Rp {formatRupiah.format(Math.max(0, toNumber(categoryPricing?.currencySurcharge ?? 50)))}.
                    </p>
                    {(categoryPricing?.warrantyComponents?.length ?? 0) > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {categoryPricing?.warrantyComponents?.map((component) => (
                          <span
                            key={`warranty-${component.label}`}
                            className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-700"
                          >
                            {component.label}: {component.valueType === "amount" ? "Rp" : "%"} {Math.max(0, toNumber(component.value))}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-3 inline-flex rounded-lg border border-slate-200 bg-white p-1">
                      <button
                        type="button"
                        onClick={() => setExchangeMode("auto")}
                        className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                          exchangeMode === "auto" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        Otomatis
                      </button>
                      <button
                        type="button"
                        onClick={() => setExchangeMode("manual")}
                        className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                          exchangeMode === "manual" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        Manual
                      </button>
                    </div>

                    {exchangeMode === "auto" ? (
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <select
                          value={rateCurrency}
                          onChange={(event) => {
                            const nextCurrency = event.target.value as MatrixPricing["currency"];
                            setRateCurrency(nextCurrency);
                            setRateInput(exchangeRates[nextCurrency]);
                          }}
                          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none"
                        >
                          {CURRENCY_OPTIONS.map((currencyCode) => (
                            <option key={currencyCode} value={currencyCode}>
                              {currencyCode}
                            </option>
                          ))}
                        </select>
                        <span>1 {rateCurrency} =</span>
                        <input
                          type="number"
                          min={0}
                          value={rateInput}
                          onChange={(event) => setRateInput(Math.max(0, Number(event.target.value) || 0))}
                          className="h-8 w-28 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none"
                        />
                        <span>IDR</span>
                        <button
                          type="button"
                          onClick={handleApplyRate}
                          className="h-8 rounded-lg border border-blue-200 bg-white px-2.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                        >
                          Set Kurs
                        </button>
                        <button
                          type="button"
                          onClick={handleResetRates}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Reset
                        </button>
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-amber-700">
                        Mode manual aktif. Kolom <span className="font-semibold">Nilai Tukar Kurs</span> bisa diedit per varian.
                      </p>
                    )}

                    <p className="mt-3 text-[11px] text-slate-500">
                      Last update: {lastRateSyncAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </section>

                  <section className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <h3 className="text-sm font-semibold text-slate-800">Pengaturan Ongkir</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Terapkan tarif otomatis berdasarkan metode pengiriman.
                    </p>

                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr,1.4fr]">
                      <select
                        value={shippingMethod}
                        onChange={(event) => {
                          const nextMethod = event.target.value as MatrixPricing["shipping"];
                          setShippingMethod(nextMethod);
                          setShippingRateInput(shippingRates[nextMethod]);
                        }}
                        className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none"
                      >
                        <option value="Laut">Laut</option>
                        <option value="Udara">Udara</option>
                        <option value="Darat">Darat</option>
                      </select>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">
                            Rp
                          </span>
                          <input
                            type="number"
                            min={0}
                            value={shippingRateInput}
                            onChange={(event) => setShippingRateInput(Math.max(0, Number(event.target.value) || 0))}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none"
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-500">/{SHIPPING_UNIT_LABEL[shippingMethod]}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleApplyShippingRate}
                        className="h-8 rounded-lg border border-blue-200 bg-white px-2.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                      >
                        Set Tarif
                      </button>
                      <button
                        type="button"
                        onClick={handleResetShippingRates}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Reset
                      </button>
                      <span className="text-[11px] text-slate-500">
                        Tarif aktif: Rp {formatRupiah.format(shippingRates[shippingMethod])}/{SHIPPING_UNIT_LABEL[shippingMethod]}
                      </span>
                    </div>

                    <p className="mt-2 text-[11px] text-slate-500">{SHIPPING_HELPER_TEXT[shippingMethod]}</p>
                    {shippingMethod === "Laut" ? (
                      <p className="mt-1 text-[11px] text-slate-500">
                        Volume produk saat ini: <span className="font-semibold text-slate-700">{inventoryVolumeCbm.toFixed(3)} CBM</span>
                      </p>
                    ) : null}
                    {shippingMethod === "Laut" && inventoryVolumeCbm <= 0 ? (
                      <p className="mt-1 text-[11px] text-amber-700">
                        Isi dimensi di bagian logistik agar ongkir laut bisa dihitung otomatis.
                      </p>
                    ) : null}

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleApplyShippingSettings}
                        className="h-9 rounded-lg border border-blue-200 bg-white px-3 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                      >
                        Set Harga Ongkir
                      </button>
                      <span className="text-[11px] text-slate-500">
                        {combinations.length} varian akan diperbarui.
                      </span>
                    </div>
                  </section>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-[5200px] w-full">
          <thead className="bg-slate-50">
            <tr>
              {groupedHeaders.map((group, index) => (
                <th
                  key={group.label}
                  colSpan={group.span}
                  className={`border-b border-slate-200 px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide ${group.tone} ${index === 0 ? "sticky left-0 z-30 shadow-[4px_0_8px_rgba(0,0,0,0.04)]" : ""}`}
                >
                  {group.label}
                </th>
              ))}
            </tr>
            <tr>
              {headers.map((header, index) => {
                const isSticky = index === 0;
                const renderedHeader = (() => {
                  if (header === "Harga Jual Tokopedia") {
                    return (
                      <span className="inline-flex items-center gap-1">
                        <span>Harga Jual</span>
                        <span className={platformLabel.Tokopedia}>Tokopedia</span>
                      </span>
                    );
                  }

                  if (header === "Harga Jual Shopee") {
                    return (
                      <span className="inline-flex items-center gap-1">
                        <span>Harga Jual</span>
                        <span className={platformLabel.Shopee}>Shopee</span>
                      </span>
                    );
                  }

                  if (header === "Harga Jual Entraverse") {
                    return (
                      <span className="inline-flex items-center gap-1">
                        <span>Harga Jual</span>
                        <span className={platformLabel.Entraverse}>Entraverse</span>
                      </span>
                    );
                  }

                  return header;
                })();

                return (
                  <th
                    key={header}
                    className={`border-b border-slate-200 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 ${isSticky ? "sticky left-0 z-20 bg-slate-50 shadow-[4px_0_8px_rgba(0,0,0,0.04)]" : ""}`}
                  >
                    {renderedHeader}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {combinations.map((combo) => {
              const row = normalizedRows[combo.key];

              return (
                <VariantRow
                  key={combo.key}
                  combo={combo}
                  row={row}
                  onUpdateField={onUpdateField}
                  selected={selectedKey === combo.key}
                  onSelect={() => {
                    setSelectedKey(combo.key);
                    setShippingMethod(row.shipping);
                    setShippingRateInput(shippingRates[row.shipping]);
                  }}
                  isExchangeValueEditable={exchangeMode === "manual"}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600 sm:grid-cols-3">
        <p>
          <span className="font-semibold text-slate-700">Informasi Produk:</span> Varian, stok, SKU, berat.
        </p>
        <p>
          <span className="font-semibold text-slate-700">Harga & Channel:</span> Offline, Entraverse, Tokopedia, Shopee.
        </p>
        <p>
          <span className="font-semibold text-slate-700">Forecast:</span> Periode A/B dan replenishment planning.
        </p>
      </div>
    </>
  );
}
