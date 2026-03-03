"use client";

import { useMemo, useState } from "react";
import type { MatrixPricing, VariantCombination } from "@/types/product";
import { DEFAULT_MATRIX_ROW } from "@/lib/utils";
import VariantRow from "@/components/features/products/VariantRow";
import PriceCalculatorModal from "@/components/features/products/PriceCalculatorModal";
import { useVariantCalculations } from "@/hooks/useVariantCalculations";

type VariantTableProps = {
  combinations: VariantCombination[];
  matrixData: Record<string, MatrixPricing>;
  onUpdateField: (key: string, field: keyof MatrixPricing, value: number | string) => void;
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
  "Harga Jual Entraverse.id",
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

export default function VariantTable({ combinations, matrixData, onUpdateField }: VariantTableProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const { calculateVariant } = useVariantCalculations();

  const normalizedRows = useMemo(() => {
    const result: Record<string, MatrixPricing> = {};
    combinations.forEach((combo) => {
      result[combo.key] = calculateVariant({ ...DEFAULT_MATRIX_ROW, ...(matrixData[combo.key] ?? {}) });
    });
    return result;
  }, [calculateVariant, combinations, matrixData]);

  const selectedVariant = selectedKey ? normalizedRows[selectedKey] ?? null : null;

  const applySelectedToAll = () => {
    if (!selectedVariant) return;
    combinations.forEach((combo) => {
      onUpdateField(combo.key, "offlinePrice", selectedVariant.offlinePrice);
      onUpdateField(combo.key, "entraversePrice", selectedVariant.entraversePrice);
      onUpdateField(combo.key, "tokopediaPrice", selectedVariant.tokopediaPrice);
      onUpdateField(combo.key, "shopeePrice", selectedVariant.shopeePrice);
    });
  };

  return (
    <>
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          disabled={!selectedKey}
          onClick={() => setCalculatorOpen(true)}
          className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 disabled:opacity-50"
        >
          Kalkulator Harga
        </button>
      </div>

      <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-[5200px] w-full">
          <thead className="bg-slate-50">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={header}
                  className={`px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 ${index === 0 ? "sticky left-0 z-20 bg-slate-50 shadow-[4px_0_8px_rgba(0,0,0,0.04)]" : ""}`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {combinations.map((combo) => (
              <VariantRow
                key={combo.key}
                combo={combo}
                row={normalizedRows[combo.key]}
                onUpdateField={onUpdateField}
                selected={selectedKey === combo.key}
                onSelect={() => setSelectedKey(combo.key)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <PriceCalculatorModal
        open={calculatorOpen && Boolean(selectedVariant)}
        variant={selectedVariant}
        onClose={() => setCalculatorOpen(false)}
        onApplyAll={applySelectedToAll}
      />
    </>
  );
}
