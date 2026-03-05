"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronsUpDown,
  ChevronDown,
  ChevronUp,
  Link2,
  Link2Off,
  Loader2,
  Pencil,
  Search,
  Store,
} from "lucide-react";
import api, { isAxiosError } from "@/lib/axios";
import { useDebounce } from "@/src/hooks/useDebounce";

type MarketplaceTab = "tiktok" | "shopee";
type SyncStatus = "ACTIVATE" | "FAILED" | "PENDING";

type ApiVariantPricingRow = Record<string, unknown>;
type ApiPhoto = string | { url?: string | null; is_primary?: boolean | null } | null;
type ApiProduct = {
  id: string;
  name: string;
  brand?: string | null;
  category?: string | null;
  spu?: string | null;
  status?: string | null;
  jurnal_id?: string | null;
  mekari_status?: {
    sync_status?: string | null;
    last_sync?: string | null;
    mekari_id?: string | null;
    last_error?: string | null;
  } | null;
  main_image?: string | null;
  photos?: ApiPhoto[] | null;
  inventory?: {
    total_stock?: number;
  } | null;
  variant_pricing?: ApiVariantPricingRow[] | null;
};

type VariantRow = {
  id: string;
  name: string;
  sellerSku: string;
  price: number;
  stock: number;
};

type SpuRow = {
  id: string;
  photo: string;
  name: string;
  spu: string;
  brand: string;
  category: string;
  totalStock: number;
  status: SyncStatus;
  statusDetail: string | null;
  variants: VariantRow[];
};

type PaginationMeta = {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
};

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
const API_BASE_URL = RAW_API_URL.replace(/\/api\/?$/i, "");
const MARKETPLACE_PAGE_SIZE = 25;

const currencyFormatter = new Intl.NumberFormat("id-ID");
const formatIdr = (value: number): string => `Rp ${currencyFormatter.format(Math.max(0, value))}`;

const parsePrice = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return 0;
  const normalized = value.replace(/[^\d]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseStock = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, value);
  if (typeof value !== "string") return 0;
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

const normalizeImageUrl = (value: unknown): string => {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^(blob:|data:|https?:\/\/)/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return `${API_BASE_URL}${trimmed}`;
  return `${API_BASE_URL}/storage/products/${trimmed}`;
};

const resolvePrimaryPhoto = (product: ApiProduct): string => {
  const main = normalizeImageUrl(product.main_image);
  if (main) return main;

  const photos = Array.isArray(product.photos) ? product.photos : [];
  const normalizedPhotos = photos
    .map((entry) => {
      if (typeof entry === "string") {
        return { url: normalizeImageUrl(entry), isPrimary: false };
      }

      if (entry && typeof entry === "object") {
        return {
          url: normalizeImageUrl(entry.url),
          isPrimary: entry.is_primary === true,
        };
      }

      return { url: "", isPrimary: false };
    })
    .filter((entry) => entry.url.length > 0);

  const explicitPrimary = normalizedPhotos.find((entry) => entry.isPrimary);
  if (explicitPrimary) return explicitPrimary.url;
  return normalizedPhotos[0]?.url ?? "/product-placeholder.svg";
};

const resolveProductsEndpoint = (): string => {
  const base = String(api.defaults.baseURL ?? "").toLowerCase();
  return base.endsWith("/v1") || base.includes("/api/v1") ? "/products" : "/v1/products";
};

const extractProducts = (payload: unknown): ApiProduct[] => {
  if (Array.isArray(payload)) return payload as ApiProduct[];

  if (payload && typeof payload === "object") {
    const data = (payload as { data?: unknown }).data;

    if (Array.isArray(data)) return data as ApiProduct[];
    if (data && typeof data === "object" && Array.isArray((data as { data?: unknown }).data)) {
      return (data as { data: ApiProduct[] }).data;
    }
  }

  return [];
};

const extractPaginationMeta = (payload: unknown): PaginationMeta => {
  const fallback: PaginationMeta = {
    currentPage: 1,
    lastPage: 1,
    perPage: MARKETPLACE_PAGE_SIZE,
    total: 0,
  };

  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const source = payload as {
    meta?: {
      current_page?: number;
      last_page?: number;
      per_page?: number;
      total?: number;
    };
  };

  const meta = source.meta;
  if (!meta) {
    return fallback;
  }

  return {
    currentPage: Number(meta.current_page ?? 1),
    lastPage: Number(meta.last_page ?? 1),
    perPage: Number(meta.per_page ?? MARKETPLACE_PAGE_SIZE),
    total: Number(meta.total ?? 0),
  };
};

const mapProductToSpuRow = (product: ApiProduct): SpuRow => {
  const variantRows = Array.isArray(product.variant_pricing) ? product.variant_pricing : [];
  const variants: VariantRow[] = variantRows.map((row, index) => {
    const label = String(row.label ?? row.variant_name ?? row.name ?? "Default Variant");
    const sku = String(row.sku_seller ?? row.sku ?? row.variant_code ?? `${product.spu ?? "SPU"}-${index + 1}`);
    const price = parsePrice(row.entraverse_price ?? row.offline_price ?? row.price);
    const stock = parseStock(row.stock);

    return {
      id: `${product.id}:${sku}:${index}`,
      name: label,
      sellerSku: sku,
      price,
      stock,
    };
  });

  const totalStockFromVariants = variants.reduce((sum, variant) => sum + variant.stock, 0);
  const totalStock = product.inventory?.total_stock ?? totalStockFromVariants;
  const syncState = String(product.mekari_status?.sync_status ?? "").toLowerCase();

  const successfulSyncStates = new Set([
    "activate",
    "success",
    "synced",
    "imported_from_jurnal",
    "created",
    "updated",
    "active",
  ]);
  const failedSyncStates = new Set(["failed", "error"]);

  let syncStatus: SyncStatus = "PENDING";
  if (failedSyncStates.has(syncState)) {
    syncStatus = "FAILED";
  } else if (successfulSyncStates.has(syncState)) {
    syncStatus = "ACTIVATE";
  }

  return {
    id: product.id,
    photo: resolvePrimaryPhoto(product),
    name: product.name,
    spu: product.spu ?? "-",
    brand: product.brand ?? "-",
    category: product.category ?? "-",
    totalStock,
    status: syncStatus,
    statusDetail: syncStatus === "FAILED" ? String(product.mekari_status?.last_error ?? "").trim() || null : null,
    variants,
  };
};

const statusClassMap: Record<SyncStatus, string> = {
  ACTIVATE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  FAILED: "border-amber-200 bg-amber-50 text-amber-700",
  PENDING: "border-blue-200 bg-blue-50 text-blue-700",
};

export default function MarketplaceProdukPage() {
  const [marketplaceTab, setMarketplaceTab] = useState<MarketplaceTab>("tiktok");
  const [products, setProducts] = useState<SpuRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [connectedVariants, setConnectedVariants] = useState<Record<string, boolean>>({});
  const [reloadTick, setReloadTick] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [perPage, setPerPage] = useState(MARKETPLACE_PAGE_SIZE);
  const [importingJurnal, setImportingJurnal] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get(resolveProductsEndpoint(), {
          params: {
            per_page: MARKETPLACE_PAGE_SIZE,
            page: currentPage,
            search: debouncedSearch || undefined,
            brand: selectedBrand !== "all" ? selectedBrand : undefined,
            exclude_failed_sync: false,
          },
          signal: controller.signal,
        });
        const items = extractProducts(response.data).map(mapProductToSpuRow);
        const meta = extractPaginationMeta(response.data);
        if (!mounted) return;
        setProducts(items);
        setCurrentPage(Math.max(1, meta.currentPage));
        setLastPage(Math.max(1, meta.lastPage));
        setPerPage(Math.max(1, meta.perPage));
        setTotalProducts(Math.max(0, meta.total));
      } catch (err) {
        if (!mounted) return;
        if (isAxiosError(err) && err.code === "ERR_CANCELED") return;
        setError(
          (isAxiosError(err) && typeof err.response?.data?.message === "string" && err.response.data.message) ||
            (err instanceof Error ? err.message : "Gagal memuat data marketplace produk.")
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [currentPage, debouncedSearch, selectedBrand, reloadTick]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedBrand]);

  const refreshProducts = useCallback(() => {
    setReloadTick((prev) => prev + 1);
  }, []);

  const handleImportFromJurnal = useCallback(async () => {
    setImportingJurnal(true);
    setImportMessage(null);

    try {
      const response = await api.post("/v1/integrations/jurnal/products/import", {
        page: 1,
        per_page: 50,
        max_pages: 3,
        include_archive: true,
      });

      const result = response.data?.data as
        | {
            created?: number;
            updated?: number;
            failed_count?: number;
            imported_count?: number;
          }
        | undefined;

      setImportMessage(
        `Import Jurnal selesai. Imported: ${result?.imported_count ?? 0}, Created: ${result?.created ?? 0}, Updated: ${result?.updated ?? 0}, Failed: ${result?.failed_count ?? 0}.`
      );
      refreshProducts();
    } catch (error) {
      if (isAxiosError(error)) {
        setImportMessage(error.response?.data?.message ?? "Gagal menarik produk dari Jurnal.");
      } else {
        setImportMessage("Gagal menarik produk dari Jurnal.");
      }
    } finally {
      setImportingJurnal(false);
    }
  }, [refreshProducts]);

  const brandOptions = useMemo(() => {
    const values = Array.from(new Set(products.map((item) => item.brand).filter((value) => value && value !== "-")));
    return values.sort((a, b) => a.localeCompare(b));
  }, [products]);

  const totalVariants = useMemo(
    () => products.reduce((sum, item) => sum + item.variants.length, 0),
    [products]
  );

  const buildConnectionKey = (variantId: string) => `${marketplaceTab}:${variantId}`;
  const isVariantConnected = (variantId: string) => connectedVariants[buildConnectionKey(variantId)] === true;

  const handleConnectVariant = (variantId: string) => {
    setConnectedVariants((prev) => ({
      ...prev,
      [buildConnectionKey(variantId)]: true,
    }));
  };

  const handleDisconnectVariant = (variantId: string) => {
    setConnectedVariants((prev) => ({
      ...prev,
      [buildConnectionKey(variantId)]: false,
    }));
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-800">Marketplace Produk</h1>
        <p className="mt-2 text-sm text-slate-500">
          Tarik katalog marketplace dan pantau sinkronisasi harga serta stok varian dalam satu dashboard.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleImportFromJurnal}
            disabled={importingJurnal}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {importingJurnal ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronsUpDown className="h-4 w-4" />}
            {importingJurnal ? "Menarik dari Jurnal..." : "Tarik dari Jurnal"}
          </button>

          <button
            type="button"
            onClick={() => setMarketplaceTab("tiktok")}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
              marketplaceTab === "tiktok"
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Store className="h-4 w-4" />
            TikTok Shop
          </button>
          <button
            type="button"
            onClick={() => setMarketplaceTab("shopee")}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
              marketplaceTab === "shopee"
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Store className="h-4 w-4" />
            Shopee
          </button>
        </div>

        {importMessage ? <p className="mt-3 text-xs text-slate-600">{importMessage}</p> : null}
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-slate-800">Daftar Produk Marketplace</h2>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
              {totalProducts} produk ({totalVariants} varian di halaman ini)
            </span>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
            <label className="flex min-w-[260px] items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 text-slate-500">
              <Search className="h-4 w-4 text-blue-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama produk, SPU, SKU"
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                aria-label="Cari marketplace produk"
              />
            </label>

            <select
              value={selectedBrand}
              onChange={(event) => setSelectedBrand(event.target.value)}
              className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white"
              aria-label="Filter brand"
            >
              <option value="all">Semua Brand</option>
              {brandOptions.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <th colSpan={4} className="border-b border-gray-100 px-3 py-3">
                  <div className="grid grid-cols-[minmax(0,1fr)_140px_150px_100px] items-center gap-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    <span className="text-left">Produk</span>
                    <span className="text-center">Total Stok</span>
                    <span className="text-center">Sync Status</span>
                    <span className="text-right">Expand</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={`marketplace-skeleton-${index}`}>
                    <td className="border-b border-gray-100 px-3 py-4">
                      <div className="h-12 w-64 animate-pulse rounded bg-slate-100" />
                    </td>
                    <td className="border-b border-gray-100 px-3 py-4">
                      <div className="h-4 w-12 animate-pulse rounded bg-slate-100" />
                    </td>
                    <td className="border-b border-gray-100 px-3 py-4">
                      <div className="h-7 w-20 animate-pulse rounded-full bg-slate-100" />
                    </td>
                    <td className="border-b border-gray-100 px-3 py-4 text-right">
                      <div className="ml-auto h-8 w-16 animate-pulse rounded-lg bg-slate-100" />
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-10 text-center text-sm text-slate-500">
                    Tidak ada produk marketplace yang cocok dengan filter saat ini.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const isExpanded = expanded[product.id] === true;
                  return (
                    <tr key={product.id}>
                      <td colSpan={4} className="border-b border-gray-100 px-0 py-0">
                        <div className="px-3 py-4">
                          <div className="grid grid-cols-[minmax(0,1fr)_140px_150px_100px] items-center gap-3">
                            <div className="flex items-start gap-3">
                              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-white">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={product.photo || "/product-placeholder.svg"}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                  onError={(event) => {
                                    if (event.currentTarget.dataset.fallbackApplied === "1") return;
                                    event.currentTarget.dataset.fallbackApplied = "1";
                                    event.currentTarget.src = "/product-placeholder.svg";
                                  }}
                                />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-800">{product.name}</p>
                                <p className="text-xs text-slate-500">SPU: {product.spu}</p>
                                <p className="text-xs text-slate-500">
                                  Brand: {product.brand} | Kategori: {product.category}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">Jumlah varian: {product.variants.length}</p>
                              </div>
                            </div>

                            <div className="text-center text-sm font-semibold text-slate-700">{product.totalStock}</div>

                            <div className="flex flex-col items-center">
                              <span
                                title={product.statusDetail ?? undefined}
                                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClassMap[product.status]}`}
                              >
                                {product.status}
                              </span>
                              {product.status === "FAILED" && product.statusDetail ? (
                                <p className="mt-1 max-w-[220px] truncate text-center text-[11px] text-amber-700" title={product.statusDetail}>
                                  {product.statusDetail}
                                </p>
                              ) : null}
                            </div>

                            <div className="text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpanded((prev) => ({
                                    ...prev,
                                    [product.id]: !prev[product.id],
                                  }))
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                              >
                                {isExpanded ? "Tutup" : "Buka"}
                                {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </div>
                        </div>

                        {isExpanded ? (
                          <div className="border-t border-gray-100 bg-slate-50/70 px-3 py-3">
                            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                              <table className="min-w-full">
                                <thead>
                                  <tr className="bg-slate-50">
                                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                      SKU / Variant Name
                                    </th>
                                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                      Seller SKU
                                    </th>
                                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                      Harga (IDR)
                                    </th>
                                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                      Stok
                                    </th>
                                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                      Actions
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {product.variants.length === 0 ? (
                                    <tr>
                                      <td colSpan={5} className="px-3 py-3 text-xs text-slate-500">
                                        Belum ada varian untuk produk ini.
                                      </td>
                                    </tr>
                                  ) : (
                                    product.variants.map((variant) => (
                                      <tr key={variant.id} className="border-t border-slate-100">
                                        <td className="px-3 py-2.5 text-xs text-slate-700">{variant.name}</td>
                                        <td className="px-3 py-2.5 text-xs text-slate-500">{variant.sellerSku}</td>
                                        <td className="px-3 py-2.5">
                                          <span className="inline-flex rounded-3xl border border-blue-100 bg-blue-50/50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                            {formatIdr(variant.price)}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2.5 text-xs font-semibold text-slate-700">{variant.stock}</td>
                                        <td className="px-3 py-2.5 text-right">
                                          <div className="inline-flex items-center gap-1.5">
                                            <Link
                                              href={`/admin/master-produk/${product.id}/edit`}
                                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                                              aria-label={`Edit produk ${product.name}`}
                                            >
                                              <Pencil className="h-3.5 w-3.5" />
                                            </Link>
                                            <button
                                              type="button"
                                              onClick={() => handleConnectVariant(variant.id)}
                                              className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border transition hover:bg-slate-50 ${
                                                isVariantConnected(variant.id)
                                                  ? "border-blue-200 bg-blue-50 text-blue-600"
                                                  : "border-slate-200 text-slate-600"
                                              }`}
                                              aria-label={`Connect variant ${variant.name}`}
                                            >
                                              <Link2 className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleDisconnectVariant(variant.id)}
                                              className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border transition hover:bg-slate-50 ${
                                                isVariantConnected(variant.id)
                                                  ? "border-slate-200 text-slate-500"
                                                  : "border-rose-200 bg-rose-50 text-rose-600"
                                              }`}
                                              aria-label={`Disconnect variant ${variant.name}`}
                                            >
                                              <Link2Off className="h-3.5 w-3.5" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Menampilkan {products.length} dari {totalProducts} produk. {perPage} produk per halaman.
          </p>
          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={loading || currentPage <= 1}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sebelumnya
            </button>
            <span className="text-xs font-medium text-slate-500">
              Halaman {currentPage} dari {lastPage}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(lastPage, prev + 1))}
              disabled={loading || currentPage >= lastPage}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Selanjutnya
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
      </section>
    </div>
  );
}
