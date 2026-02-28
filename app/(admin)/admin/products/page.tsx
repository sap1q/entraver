"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronsUpDown,
  Globe,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  ShoppingBag,
} from "lucide-react";
import api from "@/src/lib/axios";
import { useDebounce } from "@/src/hooks/useDebounce";

type ProductStatus = "active" | "pending" | "inactive";

type VariantPricingRow = {
  sku: string;
  label: string;
  stock: number;
  offlinePrice: number | null;
  entraversePrice: number | null;
  tokopediaPrice: number | null;
  shopeePrice: number | null;
};

type ProductRow = {
  id: string;
  name: string;
  spu: string;
  brand?: string | null;
  inventory?: {
    total_stock?: number;
  };
  photo: string;
  status: ProductStatus;
  platforms: Array<"web" | "tiktok">;
  variant_pricing?: VariantPricingRow[];
};

type ApiProduct = {
  id: string;
  name: string;
  brand?: string | null;
  spu?: string | null;
  status?: string | null;
  main_image?: string | null;
  inventory?: {
    total_stock?: number;
  } | null;
  variant_pricing?: Array<Record<string, unknown>> | null;
};

const statusPillBase =
  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition";

const parsePrice = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const normalized = value.replace(/[^\d]/g, "");
  if (normalized.length === 0) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeStatus = (status: string | null | undefined): ProductStatus => {
  if (status === "pending" || status === "pending_approval") return "pending";
  if (status === "inactive") return "inactive";
  return "active";
};

const mapApiProduct = (product: ApiProduct): ProductRow => {
  const variantRows = Array.isArray(product.variant_pricing) ? product.variant_pricing : [];
  const normalizedVariants: VariantPricingRow[] = variantRows.map((variant) => {
    const skuValue = variant.sku ?? variant.variant_code ?? product.spu ?? "UNKNOWN-SKU";
    const labelValue = variant.label ?? variant.variant_name ?? variant.code ?? "Default";

    return {
      sku: String(skuValue),
      label: String(labelValue),
      stock: Number(variant.stock ?? 0),
      offlinePrice: parsePrice(variant.offline_price),
      entraversePrice: parsePrice(variant.entraverse_price ?? variant.price),
      tokopediaPrice: parsePrice(variant.tokopedia_price),
      shopeePrice: parsePrice(variant.shopee_price),
    };
  });

  return {
    id: product.id,
    name: product.name,
    brand: product.brand ?? null,
    spu: product.spu ?? "N/A",
    inventory: {
      total_stock: product.inventory?.total_stock ?? normalizedVariants.reduce((sum, item) => sum + item.stock, 0),
    },
    photo: product.main_image ?? "/product-placeholder.svg",
    status: normalizeStatus(product.status),
    platforms: ["web", "tiktok"],
    variant_pricing: normalizedVariants,
  };
};

export default function MasterProdukPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [activeStatus, setActiveStatus] = useState<ProductStatus>("active");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    const controller = new AbortController();
    let stillMounted = true;

    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const response = await api.get("/v1/products", {
          params: {
            search: debouncedSearch || undefined,
            per_page: 100,
          },
          signal: controller.signal,
        });

        const payload = response.data as { data?: ApiProduct[] };
        const items = Array.isArray(payload?.data) ? payload.data : [];

        if (!stillMounted) return;
        setProducts(items.map(mapApiProduct));
      } catch {
        if (!stillMounted) return;
        setProducts([]);
      } finally {
        if (stillMounted) setIsLoading(false);
      }
    };

    fetchProducts();

    return () => {
      stillMounted = false;
      controller.abort();
    };
  }, [debouncedSearch]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesStatus = product.status === activeStatus;
      return matchesStatus;
    });
  }, [activeStatus, products]);

  const statusCounts = useMemo(
    () => ({
      active: products.filter((product) => product.status === "active").length,
      pending: products.filter((product) => product.status === "pending").length,
      inactive: products.filter((product) => product.status === "inactive").length,
    }),
    [products]
  );

  const toggleRow = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const currencyFormatter = new Intl.NumberFormat("id-ID");
  const formatPrice = (value: number | null | undefined) =>
    typeof value === "number" ? `Rp ${currencyFormatter.format(value)}` : "-";
  const variantList = {
    hidden: {
      opacity: 0,
    },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
      },
    },
  };
  const variantItem = {
    hidden: {
      opacity: 0,
      y: -6,
    },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.18,
      },
    },
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Produk</h1>
            <p className="mt-1 text-sm text-slate-500">
              Kelola katalog produk Anda, atur trade-in, dan sinkronisasi stok.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Terakhir disinkronisasi Mekari Jurnal pada{" "}
              <span className="font-semibold text-slate-800">
                Sabtu, 28 Februari 2026 pukul 23.00
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3.5 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
            >
              <ChevronsUpDown className="h-4 w-4" />
              Petakan produk
            </button>
            <Link
              href="/admin/master-produk/tambah"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              + Tambah produk
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-slate-800">Daftar Produk</h2>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                {filteredProducts.length} produk
              </span>
            </div>

            <label className="flex w-full max-w-xs items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 text-slate-500">
              <Search className="h-4 w-4 text-blue-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search"
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-blue-500" /> : null}
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveStatus("active")}
              className={`${statusPillBase} ${
                activeStatus === "active"
                  ? "border-blue-500 bg-blue-600 text-white"
                  : "border-blue-200 bg-blue-50 text-blue-700"
              }`}
            >
              Aktif
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] ${
                  activeStatus === "active" ? "bg-white/20 text-white" : "bg-white text-blue-700"
                }`}
              >
                {statusCounts.active}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveStatus("pending")}
              className={`${statusPillBase} ${
                activeStatus === "pending"
                  ? "border-blue-500 bg-blue-600 text-white"
                  : "border-blue-200 bg-blue-50 text-blue-700"
              }`}
            >
              Menunggu Persetujuan
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] ${
                  activeStatus === "pending" ? "bg-white/20 text-white" : "bg-white text-blue-700"
                }`}
              >
                {statusCounts.pending}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveStatus("inactive")}
              className={`${statusPillBase} ${
                activeStatus === "inactive"
                  ? "border-blue-500 bg-blue-600 text-white"
                  : "border-blue-200 bg-blue-50 text-blue-700"
              }`}
            >
              Non Aktif
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] ${
                  activeStatus === "inactive" ? "bg-white/20 text-white" : "bg-white text-blue-700"
                }`}
              >
                {statusCounts.inactive}
              </span>
            </button>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="border-b border-gray-100 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Foto
                </th>
                <th className="border-b border-gray-100 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Nama Produk
                </th>
                <th className="border-b border-gray-100 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="border-b border-gray-100 px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <tr key={`skeleton-${index}`}>
                    <td className="border-b border-gray-100 px-3 py-4">
                      <div className="h-12 w-12 animate-pulse rounded-lg bg-slate-200" />
                    </td>
                    <td className="border-b border-gray-100 px-3 py-4">
                      <div className="space-y-2">
                        <div className="h-4 w-56 animate-pulse rounded bg-slate-200" />
                        <div className="h-3 w-32 animate-pulse rounded bg-slate-100" />
                      </div>
                    </td>
                    <td className="border-b border-gray-100 px-3 py-4">
                      <div className="h-7 w-16 animate-pulse rounded-full bg-slate-200" />
                    </td>
                    <td className="border-b border-gray-100 px-3 py-4 text-right">
                      <div className="ml-auto h-8 w-8 animate-pulse rounded-full bg-slate-200" />
                    </td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-12 text-center text-sm text-slate-500">
                    Tidak ada produk yang sesuai filter atau pencarian.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isExpanded = product.id === expandedId;

                  return (
                    <Fragment key={product.id}>
                      <tr
                        onClick={() => toggleRow(product.id)}
                        className={`cursor-pointer transition ${
                          isExpanded ? "bg-blue-50/70" : "hover:bg-slate-50/80"
                        }`}
                      >
                        <td className="border-b border-gray-100 px-3 py-4 align-top">
                          <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-gray-100 bg-white">
                            <Image
                              src={product.photo}
                              alt={product.name}
                              fill
                              sizes="48px"
                              className="object-cover"
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
                          <p className="mt-1 text-xs text-slate-500">
                            Total Stok: {product.inventory?.total_stock ?? 0}
                          </p>
                        </td>
                        <td className="border-b border-gray-100 px-3 py-4 align-top">
                          <div className="flex items-center gap-2">
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
                        <td className="border-b border-gray-100 px-3 py-4 text-right align-top">
                          <button
                            type="button"
                            onClick={(event) => event.stopPropagation()}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 text-blue-700 transition hover:bg-blue-50"
                            aria-label={`Aksi untuk ${product.name}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
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
                                transition={{
                                  type: "spring",
                                  stiffness: 300,
                                  damping: 30,
                                }}
                                className="overflow-hidden"
                              >
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-sm font-semibold text-slate-800">
                                      {product.variant_pricing?.length ?? 0} SKU tersedia
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      Pantau stok dan harga jual offline setiap SKU.
                                    </p>
                                  </div>

                                  <div className="overflow-x-auto">
                                    <table className="min-w-[900px] w-full">
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
                                      <motion.tbody
                                        variants={variantList}
                                        initial="hidden"
                                        animate="show"
                                      >
                                        {product.variant_pricing?.map((variant) => (
                                          <motion.tr
                                            key={variant.sku}
                                            className="border-b border-blue-100/80"
                                            variants={variantItem}
                                          >
                                            <td className="px-2 py-2.5">
                                              <p className="text-xs font-semibold text-slate-700">
                                                {variant.sku}
                                              </p>
                                              <p className="text-xs text-slate-500">{variant.label}</p>
                                            </td>
                                            <td className="px-2 py-2.5 text-xs text-slate-700">
                                              {variant.stock}
                                            </td>
                                            <td className="px-2 py-2.5 text-xs text-slate-700">
                                              {formatPrice(variant.offlinePrice)}
                                            </td>
                                            <td className="px-2 py-2.5 text-xs text-slate-700">
                                              {formatPrice(variant.entraversePrice)}
                                            </td>
                                            <td className="px-2 py-2.5 text-xs text-slate-700">
                                              {formatPrice(variant.tokopediaPrice)}
                                            </td>
                                            <td className="px-2 py-2.5 text-xs text-slate-700">
                                              {formatPrice(variant.shopeePrice)}
                                            </td>
                                          </motion.tr>
                                        ))}
                                        {(product.variant_pricing?.length ?? 0) === 0 ? (
                                          <motion.tr variants={variantItem}>
                                            <td
                                              colSpan={6}
                                              className="px-2 py-3 text-xs text-slate-500"
                                            >
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
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
