export type SupportedCurrency = "IDR" | "USD" | "CNY";

export interface PlatformPrices {
  entraverse: number;
  tokopedia: number;
  shopee: number;
  tiktok: number;
}

export interface PriceBreakdown {
  basePrice: number;
  exchangeRate: number;
  shippingAir: number;
  shippingSea: number;
  commission: number;
  cashback: number;
  insurance: number;
  warrantyCost: number;
  warrantyProfit: number;
  shippingNew: number;
  totalCost: number;
  recommendedPrice: number;
  platformPrices: PlatformPrices;
}

export interface VariantAttribute {
  name: string;
  values: string[];
}

export interface VariantCombination {
  id: string;
  attributes: Record<string, string>;
  sku: string;
  price: number;
  stock: number;
  image?: string;
}

export interface PricingFormInput {
  basePriceAmount: number;
  basePriceCurrency: SupportedCurrency;
  exchangeRate: number;
  weightKg: number;
  volumeCbm: number;
  shippingAirRate: number;
  shippingSeaRate: number;
  marginPercent: number;
  tiktokCommissionPercent: number;
  xtraCashbackPercent: number;
  shopeeInsurancePercent: number;
  warrantyCostPercent: number;
  warrantyProfitPercent: number;
  shippingNewCost: number;
  tokopediaFeePercent: number;
  shopeeFeePercent: number;
  tiktokFeePercent: number;
  roundToNearest?: number;
}

export interface VariantPrice {
  sku: string;
  sku_seller?: string;
  label: string;
  options: Record<string, string>;
  purchase_price: number;
  currency: "SGD" | "USD" | "AUD" | "EUR" | "IDR";
  exchange_rate: number;
  shipping: "Udara" | "Laut";
  arrival_cost: number;
  purchase_price_idr: number;
  offline_price: number;
  entraverse_price: number;
  tokopedia_price: number;
  shopee_price: number;
  stock: number;
  item_weight: number;
  avg_sales_a: number;
  stockout_date_a: string | null;
  stockout_factor_a: string | null;
  avg_sales_b: number;
  stockout_date_b: string | null;
  stockout_factor_b: string | null;
  avg_daily_final: number;
  start_date: string | null;
  predicted_initial_stock: number;
  lead_time: number;
  reorder_point: number;
  need_15_days: number;
  in_transit_stock: number;
  next_procurement: number;
  status: "Normal" | "Low Stock" | "Out of Stock";
}

export interface ProductFormData {
  name: string;
  category_id: string;
  category_name?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price?: number;
  discount_percentage?: number;
  rating: number;
  sold_count: number;
  image: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  brand: {
    id: string;
    name: string;
    slug: string;
  };
  is_wishlisted?: boolean;
  free_shipping?: boolean;
  stock: number;
  specs?: Record<string, string | number>;
}

export interface ProductFilters {
  categories?: string[];
  price_min?: number;
  price_max?: number;
  ratings?: number[];
  brands?: string[];
  sort_by?: "popular" | "price_asc" | "price_desc" | "newest" | "rating";
  page?: number;
  per_page?: number;
  search?: string;
}

export interface ProductApiResponse {
  success: boolean;
  data: Product[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    filters?: ProductFilters;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  product_count: number;
  icon?: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  product_count: number;
  logo?: string;
}

export interface ApiSuccessResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface WishlistToggleResponse {
  success: boolean;
  message: string;
  is_wishlisted: boolean;
}
