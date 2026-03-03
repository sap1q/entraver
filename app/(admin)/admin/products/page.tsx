"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronsUpDown, Plus } from "lucide-react";
import { isAxiosError } from "axios";
import api from "@/lib/axios";
import { useDebounce } from "@/src/hooks/useDebounce";
import ProductTable, { type ProductTableProduct } from "@/components/features/products/ProductTable";

type ApiVariantPricingRow = Record<string, unknown>;

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
  variant_pricing?: ApiVariantPricingRow[] | null;
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
    photo: product.main_image ?? "/product-placeholder.svg",
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

export default function MasterProdukPage() {
  const [products, setProducts] = useState<ProductTableProduct[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [reloadTick, setReloadTick] = useState(0);
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    const controller = new AbortController();
    let stillMounted = true;

    const fetchProducts = async () => {
      setIsLoading(true);
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
        if (process.env.NODE_ENV === "development") {
          if (isAxiosError(error)) {
            console.error("[Products Fetch Error]", {
              status: error.response?.status,
              url: error.config?.url,
              baseURL: error.config?.baseURL,
              params: error.config?.params,
              data: error.response?.data,
            });
          } else {
            console.error("[Products Fetch Error]", error);
          }
        }
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
    </div>
  );
}
