import api from "@/lib/axios";
import type {
  ApiSuccessResponse,
  Brand,
  Category,
  Product,
  ProductApiResponse,
  ProductFilters,
  WishlistToggleResponse,
} from "@/types/product.types";

type ProductDetailResponse = ApiSuccessResponse<Product>;

const toCsvParam = (value?: string[] | number[]) => {
  if (!value || value.length === 0) return undefined;
  return value.join(",");
};

type JsonRecord = Record<string, unknown>;

const toObject = (value: unknown): JsonRecord => {
  if (!value || typeof value !== "object") return {};
  return value as JsonRecord;
};

const toStringValue = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toNumberValue = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const slugify = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

const resolveImageFromRow = (row: JsonRecord): string => {
  const direct = toStringValue(row.image) ?? toStringValue(row.main_image);
  if (direct) return direct;

  const photos = Array.isArray(row.photos) ? row.photos : [];
  for (const photo of photos) {
    if (typeof photo === "string") {
      const url = toStringValue(photo);
      if (url) return url;
      continue;
    }

    const photoObject = toObject(photo);
    const url = toStringValue(photoObject.url);
    if (url) return url;
  }

  return "/assets/images/hero/e-hero.png";
};

const resolveCategory = (row: JsonRecord): Product["category"] => {
  const categoryObject = toObject(row.category);
  if (Object.keys(categoryObject).length > 0) {
    const name = toStringValue(categoryObject.name) ?? "Kategori";
    const slug = toStringValue(categoryObject.slug) ?? (slugify(name) || "kategori");
    const id = toStringValue(categoryObject.id) ?? slug;
    return { id, name, slug };
  }

  const categoryName = toStringValue(row.category) ?? "Kategori";
  const categorySlug = slugify(categoryName) || "kategori";
  const categoryId = toStringValue(row.category_id) ?? categorySlug;

  return {
    id: categoryId,
    name: categoryName,
    slug: categorySlug,
  };
};

const resolveBrand = (row: JsonRecord): Product["brand"] => {
  const brandReference = toObject(row.brand_ref);
  const brandObject =
    Object.keys(brandReference).length > 0 ? brandReference : toObject(row.brand);
  if (Object.keys(brandObject).length > 0) {
    const name = toStringValue(brandObject.name) ?? "Unknown Brand";
    const slug = toStringValue(brandObject.slug) ?? (slugify(name) || "unknown-brand");
    const id = toStringValue(brandObject.id) ?? slug;
    return { id, name, slug };
  }

  const brandName = toStringValue(row.brand) ?? toStringValue(brandReference.name) ?? "Unknown Brand";
  const brandSlug = slugify(brandName) || "unknown-brand";

  return {
    id: brandSlug,
    name: brandName,
    slug: brandSlug,
  };
};

const mapProduct = (raw: unknown): Product => {
  const row = toObject(raw);
  const name = toStringValue(row.name) ?? "Produk";
  const slug = toStringValue(row.slug) ?? (slugify(name) || "produk");
  const price = toNumberValue(row.price) ?? toNumberValue(toObject(row.inventory).price) ?? 0;
  const originalPrice = toNumberValue(row.original_price) ?? undefined;
  const discountPercentage =
    toNumberValue(row.discount_percentage) ??
    (originalPrice && originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : undefined);

  return {
    id: toStringValue(row.id) ?? toStringValue(row.uuid) ?? slug,
    name,
    slug,
    price,
    original_price: originalPrice,
    discount_percentage: discountPercentage,
    rating: toNumberValue(row.rating) ?? 4.8,
    sold_count: toNumberValue(row.sold_count) ?? 0,
    image: resolveImageFromRow(row),
    category: resolveCategory(row),
    brand: resolveBrand(row),
    is_wishlisted: Boolean(row.is_wishlisted),
    free_shipping: Boolean(row.free_shipping),
    stock: toNumberValue(row.stock) ?? toNumberValue(toObject(row.inventory).total_stock) ?? 0,
    specs: toObject(row.specs),
  };
};

const extractProductRows = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;

  const source = toObject(payload);
  if (Array.isArray(source.data)) return source.data;

  const nested = toObject(source.data);
  if (Array.isArray(nested.data)) return nested.data;

  return [];
};

const extractMeta = (payload: unknown, fallbackCount: number): ProductApiResponse["meta"] => {
  const source = toObject(payload);
  const meta = toObject(source.meta);

  const currentPage = toNumberValue(meta.current_page) ?? toNumberValue(source.current_page) ?? 1;
  const perPage =
    toNumberValue(meta.per_page) ??
    toNumberValue(source.per_page) ??
    (fallbackCount > 0 ? fallbackCount : 12);
  const total = toNumberValue(meta.total) ?? toNumberValue(source.total) ?? fallbackCount;
  const lastPage =
    toNumberValue(meta.last_page) ??
    toNumberValue(source.last_page) ??
    Math.max(1, Math.ceil(total / Math.max(1, perPage)));

  return {
    current_page: currentPage,
    last_page: lastPage,
    total,
    per_page: perPage,
  };
};

const mapCategory = (raw: unknown): Category => {
  const row = toObject(raw);
  const name = toStringValue(row.name) ?? "Kategori";
  const slug = toStringValue(row.slug) ?? (slugify(name) || "kategori");
  const id = toStringValue(row.id) ?? slug;
  const icon = toStringValue(row.icon) ?? undefined;

  return {
    id,
    name,
    slug,
    product_count: toNumberValue(row.product_count) ?? 0,
    icon,
  };
};

const mapBrand = (raw: unknown): Brand => {
  const row = toObject(raw);
  const name = toStringValue(row.name) ?? "Unknown Brand";
  const slug = toStringValue(row.slug) ?? (slugify(name) || "unknown-brand");
  const id = toStringValue(row.id) ?? slug;
  const logo = toStringValue(row.logo) ?? toStringValue(row.image) ?? undefined;

  return {
    id,
    name,
    slug,
    product_count: toNumberValue(row.product_count) ?? 0,
    logo,
  };
};

export const productsApi = {
  getProducts: async (filters?: ProductFilters) => {
    const params = {
      ...filters,
      categories: toCsvParam(filters?.categories),
      brands: toCsvParam(filters?.brands),
      ratings: toCsvParam(filters?.ratings),
    };

    const response = await api.get("/v1/products", { params });
    const rows = extractProductRows(response.data);
    const products = rows.map(mapProduct);
    const meta = extractMeta(response.data, products.length);

    return {
      success: true,
      data: products,
      meta: {
        ...meta,
        filters,
      },
    } satisfies ProductApiResponse;
  },

  getProductBySlug: async (slug: string) => {
    const response = await api.get(`/v1/products/${slug}`);
    const payload = toObject(response.data);
    const row = payload.data ?? payload;

    return {
      success: true,
      data: mapProduct(row),
    } satisfies ProductDetailResponse;
  },

  getCategories: async () => {
    const response = await api.get("/v1/categories");
    const payload = toObject(response.data);
    const rows = Array.isArray(payload.data) ? payload.data : [];

    return {
      success: payload.success !== false,
      data: rows.map(mapCategory),
    } satisfies ApiSuccessResponse<Category[]>;
  },

  getBrands: async () => {
    const response = await api.get("/v1/brands");
    const payload = toObject(response.data);
    const rows = Array.isArray(payload.data) ? payload.data : [];

    return {
      success: payload.success !== false,
      data: rows.map(mapBrand),
    } satisfies ApiSuccessResponse<Brand[]>;
  },

  toggleWishlist: async (productId: string) => {
    const response = await api.post<WishlistToggleResponse>(`/v1/wishlist/toggle/${productId}`);
    return response.data;
  },
};
