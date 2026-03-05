"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Globe, ShoppingBag } from "lucide-react";
import JurnalSyncButton from "@/components/features/integrations/JurnalSyncButton";
import ProductActions from "@/components/features/products/ProductActions";

export type ProductStatus = "active" | "pending" | "inactive";

type VariantPricingRow = {
  sku: string;
  label: string;
  stock: number;
  offlinePrice: number | null;
  entraversePrice: number | null;
  tokopediaPrice: number | null;
  shopeePrice: number | null;
};

export interface ProductTableRowProduct {
  id: string;
  name: string;
  spu: string;
  brand?: string | null;
  jurnal_id?: string | null;
  jurnal_archived?: boolean;
  inventory?: {
    total_stock?: number;
  };
  photo: string;
  status: ProductStatus;
  platforms: Array<"web" | "tiktok">;
  variant_pricing?: VariantPricingRow[];
}

interface ProductTableRowProps {
  product: ProductTableRowProduct;
  onEdit: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  isActionOpen: boolean;
  onActionOpenChange: (open: boolean) => void;
  onJurnalSyncComplete: () => void | Promise<void>;
}

const statusStyle: Record<ProductStatus, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  inactive: "border-slate-200 bg-slate-50 text-slate-600",
};

const statusLabel: Record<ProductStatus, string> = {
  active: "Aktif",
  pending: "Menunggu",
  inactive: "Non Aktif",
};

const currencyFormatter = new Intl.NumberFormat("id-ID");
const formatPrice = (value: number | null | undefined) =>
  typeof value === "number" ? `Rp ${currencyFormatter.format(value)}` : "-";

const variantList = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const variantItem = {
  hidden: { opacity: 0, y: -6 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.18,
    },
  },
};

export default function ProductTableRow({
  product,
  onEdit,
  onDelete,
  isExpanded,
  onToggleExpand,
  isActionOpen,
  onActionOpenChange,
  onJurnalSyncComplete,
}: ProductTableRowProps) {
  return (
    <>
      <tr
        onClick={() => onToggleExpand(product.id)}
        className={`cursor-pointer transition ${isExpanded ? "bg-blue-50/70" : "hover:bg-slate-50/80"}`}
      >
        <td className="border-b border-gray-100 px-3 py-4 align-top">
          <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-gray-100 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.photo || "/product-placeholder.svg"}
              alt={product.name}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={(event) => {
                if (event.currentTarget.dataset.fallbackApplied === "1") return;
                event.currentTarget.dataset.fallbackApplied = "1";
                event.currentTarget.src = "/product-placeholder.svg";
              }}
            />
          </div>
        </td>

        <td className="border-b border-gray-100 px-3 py-4 align-top">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-slate-800">{product.name}</p>
            <motion.span
              initial={false}
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="mt-0.5 inline-flex"
            >
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </motion.span>
          </div>
          <p className="mt-1 text-xs text-slate-500">SPU/SKU: {product.spu}</p>
          <p className="mt-1 text-xs text-slate-500">Brand: {product.brand ?? "-"}</p>
          <p className="mt-1 text-xs text-slate-500">Total Stok: {product.inventory?.total_stock ?? 0}</p>
        </td>

        <td className="border-b border-gray-100 px-3 py-4 align-middle">
          <div className="flex items-center justify-center gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusStyle[product.status]}`}
            >
              {statusLabel[product.status]}
            </span>
            {product.platforms.includes("web") ? (
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-600">
                <Globe className="h-4 w-4" />
              </span>
            ) : null}
            {product.platforms.includes("tiktok") ? (
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700">
                <ShoppingBag className="h-4 w-4" />
              </span>
            ) : null}
          </div>
        </td>

        <td className="border-b border-gray-100 px-3 py-4 align-middle">
          <div onClick={(event) => event.stopPropagation()} className="flex items-center justify-center gap-2">
            <ProductActions
              productId={product.id}
              productName={product.name}
              onEdit={onEdit}
              onDelete={(id) => onDelete(id, product.name)}
              isOpen={isActionOpen}
              onOpenChange={onActionOpenChange}
            />
            <JurnalSyncButton
              productId={product.id}
              initialArchived={Boolean(product.jurnal_archived)}
              onSyncComplete={onJurnalSyncComplete}
              onArchiveChange={() => onJurnalSyncComplete()}
            />
          </div>
        </td>
      </tr>

      <AnimatePresence initial={false}>
        {isExpanded ? (
          <tr className="bg-slate-50">
            <td colSpan={10} className="border-b border-gray-100 px-3 pb-4">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="overflow-hidden"
              >
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800">
                      {product.variant_pricing?.length ?? 0} SKU tersedia
                    </p>
                    <p className="text-xs text-slate-500">Pantau stok dan harga jual offline setiap SKU.</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                      <thead>
                        <tr className="border-b border-blue-200">
                          <th className="px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            SKU & Varian
                          </th>
                          <th className="px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Stok
                          </th>
                          <th className="px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Harga Offline
                          </th>
                          <th className="px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Harga Entraverse.id
                          </th>
                          <th className="px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Harga Tokopedia
                          </th>
                          <th className="px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Harga Shopee
                          </th>
                        </tr>
                      </thead>
                      <motion.tbody variants={variantList} initial="hidden" animate="show">
                        {product.variant_pricing?.map((variant, index) => (
                          <motion.tr
                            key={`${product.id}:${variant.sku}:${variant.label}:${index}`}
                            className="border-b border-blue-100/80"
                            variants={variantItem}
                          >
                            <td className="px-2 py-2.5">
                              <p className="text-xs font-semibold text-slate-700">{variant.sku}</p>
                              <p className="text-xs text-slate-500">{variant.label}</p>
                            </td>
                            <td className="px-2 py-2.5 text-xs text-slate-700">{variant.stock}</td>
                            <td className="px-2 py-2.5 text-xs text-slate-700">{formatPrice(variant.offlinePrice)}</td>
                            <td className="px-2 py-2.5 text-xs text-slate-700">{formatPrice(variant.entraversePrice)}</td>
                            <td className="px-2 py-2.5 text-xs text-slate-700">{formatPrice(variant.tokopediaPrice)}</td>
                            <td className="px-2 py-2.5 text-xs text-slate-700">{formatPrice(variant.shopeePrice)}</td>
                          </motion.tr>
                        ))}
                        {(product.variant_pricing?.length ?? 0) === 0 ? (
                          <motion.tr variants={variantItem}>
                            <td colSpan={6} className="px-2 py-3 text-xs text-slate-500">
                              Belum ada varian pada produk ini.
                            </td>
                          </motion.tr>
                        ) : null}
                      </motion.tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            </td>
          </tr>
        ) : null}
      </AnimatePresence>
    </>
  );
}
