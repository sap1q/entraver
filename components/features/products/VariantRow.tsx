"use client";

import type { MatrixPricing, VariantCombination } from "@/types/product";

type VariantRowProps = {
  combo: VariantCombination;
  row: MatrixPricing;
  onUpdateField: (key: string, field: keyof MatrixPricing, value: number | string) => void;
  selected: boolean;
  onSelect: () => void;
};

const inputBase =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-300";

const StatusBadge = ({ status }: { status: MatrixPricing["procurementStatus"] }) => {
  const styles: Record<MatrixPricing["procurementStatus"], string> = {
    Normal: "bg-green-100 text-green-800",
    "Low Stock": "bg-yellow-100 text-yellow-800",
    "Out of Stock": "bg-red-100 text-red-800",
  };

  return <span className={`rounded-full px-2 py-1 text-xs font-medium ${styles[status]}`}>{status}</span>;
};

export default function VariantRow({ combo, row, onUpdateField, selected, onSelect }: VariantRowProps) {
  return (
    <tr onClick={onSelect} className={`border-t border-slate-100 align-top ${selected ? "bg-blue-50/40" : ""}`}>
      <td className="sticky left-0 z-10 min-w-[240px] bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-[4px_0_8px_rgba(0,0,0,0.04)]">
        {combo.label}
      </td>
      <td className="min-w-[140px] px-2 py-2">
        <input type="number" min={0} className={inputBase} value={row.purchasePrice} onChange={(e) => onUpdateField(combo.key, "purchasePrice", Number(e.target.value))} />
      </td>
      <td className="min-w-[120px] px-2 py-2">
        <select className={inputBase} value={row.currency} onChange={(e) => onUpdateField(combo.key, "currency", e.target.value)}>
          <option value="SGD">SGD</option>
          <option value="USD">USD</option>
          <option value="AUD">AUD</option>
          <option value="EUR">EUR</option>
          <option value="IDR">IDR</option>
          <option value="CNY">CNY</option>
        </select>
      </td>
      <td className="min-w-[150px] px-2 py-2">
        <input type="number" min={0} className={inputBase} value={row.exchangeValue} onChange={(e) => onUpdateField(combo.key, "exchangeValue", Number(e.target.value))} />
      </td>
      <td className="min-w-[130px] px-2 py-2">
        <select className={inputBase} value={row.shipping} onChange={(e) => onUpdateField(combo.key, "shipping", e.target.value)}>
          <option value="Udara">Udara</option>
          <option value="Laut">Laut</option>
          <option value="Darat">Darat</option>
        </select>
      </td>
      <td className="min-w-[150px] px-2 py-2">
        <input type="number" min={0} className={inputBase} value={row.arrivalCost} onChange={(e) => onUpdateField(combo.key, "arrivalCost", Number(e.target.value))} />
      </td>
      <td className="min-w-[170px] px-2 py-2">
        <input readOnly className={`${inputBase} bg-blue-50 text-blue-700`} value={row.purchasePrice * row.exchangeValue + row.arrivalCost} />
      </td>
      <td className="min-w-[160px] px-2 py-2"><input type="number" min={0} className={inputBase} value={row.offlinePrice} onChange={(e) => onUpdateField(combo.key, "offlinePrice", Number(e.target.value))} /></td>
      <td className="min-w-[180px] px-2 py-2"><input type="number" min={0} className={inputBase} value={row.entraversePrice} onChange={(e) => onUpdateField(combo.key, "entraversePrice", Number(e.target.value))} /></td>
      <td className="min-w-[170px] px-2 py-2"><input type="number" min={0} className={inputBase} value={row.tokopediaPrice} onChange={(e) => onUpdateField(combo.key, "tokopediaPrice", Number(e.target.value))} /></td>
      <td className="min-w-[160px] px-2 py-2"><input type="number" min={0} className={inputBase} value={row.shopeePrice} onChange={(e) => onUpdateField(combo.key, "shopeePrice", Number(e.target.value))} /></td>
      <td className="min-w-[100px] px-2 py-2"><input type="number" min={0} className={inputBase} value={row.stock} onChange={(e) => onUpdateField(combo.key, "stock", Number(e.target.value))} /></td>
      <td className="min-w-[150px] px-2 py-2"><input className={inputBase} value={row.skuSeller} onChange={(e) => onUpdateField(combo.key, "skuSeller", e.target.value)} /></td>
      <td className="min-w-[130px] px-2 py-2"><input type="number" min={0} className={inputBase} value={row.itemWeight} onChange={(e) => onUpdateField(combo.key, "itemWeight", Number(e.target.value))} /></td>
      <td className="min-w-[220px] px-2 py-2"><input type="number" min={0} className={inputBase} value={row.avgSalesA} onChange={(e) => onUpdateField(combo.key, "avgSalesA", Number(e.target.value))} /></td>
      <td className="min-w-[220px] px-2 py-2"><input type="date" className={inputBase} value={row.stockoutDateA} onChange={(e) => onUpdateField(combo.key, "stockoutDateA", e.target.value)} /></td>
      <td className="min-w-[220px] px-2 py-2"><input className={inputBase} value={row.stockoutFactorA} onChange={(e) => onUpdateField(combo.key, "stockoutFactorA", e.target.value)} /></td>
      <td className="min-w-[220px] px-2 py-2"><input type="number" min={0} className={inputBase} value={row.avgSalesB} onChange={(e) => onUpdateField(combo.key, "avgSalesB", Number(e.target.value))} /></td>
      <td className="min-w-[220px] px-2 py-2"><input type="date" className={inputBase} value={row.stockoutDateB} onChange={(e) => onUpdateField(combo.key, "stockoutDateB", e.target.value)} /></td>
      <td className="min-w-[220px] px-2 py-2"><input className={inputBase} value={row.stockoutFactorB} onChange={(e) => onUpdateField(combo.key, "stockoutFactorB", e.target.value)} /></td>
      <td className="min-w-[230px] px-2 py-2"><input readOnly className={`${inputBase} bg-blue-50 text-blue-700`} value={row.avgDailyFinal} /></td>
      <td className="min-w-[130px] px-2 py-2"><input type="date" className={inputBase} value={row.startDate} onChange={(e) => onUpdateField(combo.key, "startDate", e.target.value)} /></td>
      <td className="min-w-[170px] px-2 py-2"><input type="number" min={0} className={inputBase} value={row.predictedInitialStock} onChange={(e) => onUpdateField(combo.key, "predictedInitialStock", Number(e.target.value))} /></td>
      <td className="min-w-[150px] px-2 py-2"><input type="number" min={0} className={inputBase} value={row.leadTime} onChange={(e) => onUpdateField(combo.key, "leadTime", Number(e.target.value))} /></td>
      <td className="min-w-[140px] px-2 py-2"><input readOnly className={`${inputBase} bg-blue-50 text-blue-700`} value={row.reorderPoint} /></td>
      <td className="min-w-[160px] px-2 py-2"><input readOnly className={`${inputBase} bg-blue-50 text-blue-700`} value={row.need15Days} /></td>
      <td className="min-w-[190px] px-2 py-2"><input readOnly className={`${inputBase} bg-blue-50 text-blue-700`} value={row.inTransitStock} /></td>
      <td className="min-w-[220px] px-2 py-2"><input type="number" min={0} className={inputBase} value={row.nextProcurement} onChange={(e) => onUpdateField(combo.key, "nextProcurement", Number(e.target.value))} /></td>
      <td className="min-w-[140px] px-2 py-3"><StatusBadge status={row.procurementStatus} /></td>
    </tr>
  );
}
