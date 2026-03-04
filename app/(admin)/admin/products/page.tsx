"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronsUpDown, Plus } from "lucide-react";
import api, { isAxiosError } from "@/lib/axios";
import { useDebounce } from "@/src/hooks/useDebounce";
import ProductTable, { type ProductTableProduct } from "@/components/features/products/ProductTable";

type ApiVariantPricingRow = Record<string, unknown>;
type ApiPhoto = string | { url?: string | null; is_primary?: boolean | null } | null;

type ApiProduct = {
  id: string;
  name: string;
  brand?: string | null;
  spu?: string | null;
  status?: string | null;
  main_image?: string | null;
  photos?: ApiPhoto[] | null;
  inventory?: {
    total_stock?: number;
  } | null;
  variant_pricing?: ApiVariantPricingRow[] | null;
};

type FetchErrorState = {
  message: string;
  debug: string;
};

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
const API_BASE_URL = RAW_API_URL.replace(/\/api\/?$/i, "");

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

const isRequestCanceled = (error: unknown): boolean => {
  if (isAxiosError(error)) {
    return error.code === "ERR_CANCELED";
  }

  return error instanceof DOMException && error.name === "AbortError";
};

const parsePrice = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const normalized = value.replace(/[^\d]/g, "");
  if (normalized.length === 0) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeStatus = (status: string | null | undefined): ProductTableProduct["status"] => {
  if (status === "pending" || status === "pending_approval") return "pending";
  if (status === "inactive") return "inactive";
  return "active";
};

const mapApiProduct = (product: ApiProduct): ProductTableProduct => {
  const variantRows = Array.isArray(product.variant_pricing) ? product.variant_pricing : [];

  const normalizedVariants = variantRows.map((variant) => {
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
    photo: resolvePrimaryPhoto(product),
    status: normalizeStatus(product.status),
    platforms: ["web", "tiktok"],
    variant_pricing: normalizedVariants,
  };
};

const resolveProductsEndpoint = (): string => {
  const base = String(api.defaults.baseURL ?? "").toLowerCase();
  return base.endsWith("/v1") || base.includes("/api/v1") ? "/products" : "/v1/products";
};

const extractProductsFromPayload = (payload: unknown): ApiProduct[] => {
  if (Array.isArray(payload)) {
    return payload as ApiProduct[];
  }

  if (payload && typeof payload === "object") {
    const data = (payload as { data?: unknown }).data;

    if (Array.isArray(data)) {
      return data as ApiProduct[];
    }

    if (data && typeof data === "object" && Array.isArray((data as { data?: unknown }).data)) {
      return (data as { data: ApiProduct[] }).data;
    }
  }

  return [];
};

const buildFetchErrorState = (error: unknown): FetchErrorState => {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const url = String(error.config?.url ?? resolveProductsEndpoint());
    const baseURL = String(error.config?.baseURL ?? api.defaults.baseURL ?? "N/A");
    const method = String(error.config?.method ?? "GET").toUpperCase();

    if (status === 401) {
      return {
        message: "Sesi login berakhir. Silakan login kembali.",
        debug: `${method} ${baseURL}${url} -> 401`,
      };
    }

    if (status === 404) {
      return {
        message: "Endpoint produk tidak ditemukan.",
        debug: `${method} ${baseURL}${url} -> 404`,
      };
    }

    if (error.code === "ECONNABORTED") {
      return {
        message: "Permintaan timeout. Respons server terlalu lama.",
        debug: `${method} ${baseURL}${url} -> ECONNABORTED`,
      };
    }

    if (error.code === "ERR_NETWORK") {
      return {
        message: "Network error. Pastikan API Laravel aktif dan CORS mengizinkan origin frontend.",
        debug: `${method} ${baseURL}${url} -> ERR_NETWORK`,
      };
    }

    const apiMessage =
      (typeof error.response?.data?.message === "string" && error.response.data.message) ||
      error.message ||
      "Gagal memuat data produk.";

    return {
      message: apiMessage,
      debug: `${method} ${baseURL}${url} -> ${status ?? "NO_STATUS"}`,
    };
  }

  return {
    message: "Terjadi kesalahan yang tidak diketahui saat memuat produk.",
    debug: "UNKNOWN_ERROR",
  };
};

export default function MasterProdukPage() {
  const [products, setProducts] = useState<ProductTableProduct[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState<FetchErrorState | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    const controller = new AbortController();
    let stillMounted = true;

    const fetchProducts = async () => {
      setIsLoading(true);
      setErrorState(null);
      try {
        const response = await api.get(resolveProductsEndpoint(), {
          params: {
            search: debouncedSearch || undefined,
            per_page: 100,
          },
          signal: controller.signal,
        });

        const items = extractProductsFromPayload(response.data);

        if (!stillMounted) return;
        setProducts(items.map(mapApiProduct));
      } catch (error) {
        if (isRequestCanceled(error)) return;

        const nextErrorState = buildFetchErrorState(error);

        if (process.env.NODE_ENV === "development") {
          if (isAxiosError(error)) {
            console.error("[Products Fetch Error]", {
              message: nextErrorState.message,
              status: error.response?.status,
              url: error.config?.url,
              baseURL: error.config?.baseURL,
              params: error.config?.params,
              code: error.code,
              data: error.response?.data,
            });
          } else {
            console.error("[Products Fetch Error]", error);
          }
        }
        if (!stillMounted) return;
        setProducts([]);
        setErrorState(nextErrorState);
      } finally {
        if (stillMounted) setIsLoading(false);
      }
    };

    fetchProducts();

    return () => {
      stillMounted = false;
      controller.abort();
    };
  }, [debouncedSearch, reloadTick]);

  const refreshProducts = useCallback(() => {
    setReloadTick((prev) => prev + 1);
  }, []);

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
              <span className="font-semibold text-slate-800">Sabtu, 28 Februari 2026 pukul 23.00</span>
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

      <ProductTable
        products={products}
        isLoading={isLoading}
        search={search}
        onSearchChange={setSearch}
        onRefresh={refreshProducts}
      />

      {errorState ? (
        <section className="rounded-xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-rose-800">Error loading products</h2>
          <p className="mt-1 text-sm text-rose-700">{errorState.message}</p>
          <p className="mt-2 text-xs text-rose-600">
            Debug: {errorState.debug} | Endpoint: {resolveProductsEndpoint()} | Base URL:{" "}
            {String(api.defaults.baseURL ?? "N/A")}
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={refreshProducts}
              className="inline-flex items-center rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              Coba lagi
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
