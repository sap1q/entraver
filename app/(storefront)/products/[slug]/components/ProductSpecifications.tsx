import type { ProductDetail } from "@/types/product.types";
import { formatDimension } from "@/lib/utils/formatter";

interface ProductSpecificationsProps {
  product: ProductDetail;
}

const humanizeKey = (value: string): string => {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

export const ProductSpecifications = ({ product }: ProductSpecificationsProps) => {
  const baseRows = [
    { label: "Brand", value: product.brand.name || "-" },
    { label: "Berat", value: product.weight > 0 ? `${product.weight} gram` : "-" },
    { label: "SKU", value: product.sku || "-" },
    { label: "Dimensi", value: formatDimension(product.dimensions) },
    { label: "Barcode", value: product.barcode || "-" },
    { label: "Garansi", value: product.warranty || "-" },
  ];

  const technicalRows = Object.entries(product.specifications).map(([key, value]) => ({
    label: humanizeKey(key),
    value,
  }));

  const rows = [...baseRows, ...technicalRows];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-slate-900">Spesifikasi Produk</h2>

      <dl className="mt-4 space-y-3">
        {rows.map((item) => (
          <div key={item.label} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2 last:border-none last:pb-0">
            <dt className="text-sm text-slate-500">{item.label}</dt>
            <dd className="text-sm font-medium text-right text-slate-800">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};
