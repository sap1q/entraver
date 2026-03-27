import { isAxiosError } from "axios";
import api from "@/lib/axios";
import type { ProductVariantPricingRow } from "@/types/product.types";

type JsonRecord = Record<string, unknown>;

export type CheckoutShippingOption = {
  service: string;
  description: string | null;
  cost: number;
  etd: string | null;
  note: string | null;
};

export type ShippingCostResult = {
  courier: string;
  destinationCityId: string;
  destinationDistrictId: string | null;
  itemWeight: number;
  packagingWeight: number;
  weight: number;
  strictMode: boolean;
  options: CheckoutShippingOption[];
};

export type ShippingCostPayload = {
  courier: string;
  address_id?: string;
  city_id?: string;
  district_id?: string;
  weight?: number;
  items?: CheckoutProcessItemPayload[];
};

export type CheckoutProcessItemPayload = {
  product_id: string;
  quantity: number;
  variant_sku?: string;
  variants?: Record<string, string>;
};

export type CheckoutProcessPayload = {
  address_id: string;
  courier: string;
  service: string;
  notes?: string;
  items: CheckoutProcessItemPayload[];
};

export type CheckoutOrderItem = {
  id: string;
  productId: string;
  productName: string;
  variantName: string | null;
  variantSku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type CheckoutOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  shippingCourier: string | null;
  shippingService: string | null;
  shippingEtd: string | null;
  shippingWeight: number;
  items: CheckoutOrderItem[];
};

export type CheckoutProcessResult = {
  order: CheckoutOrder;
  snapToken: string;
  snapRedirectUrl: string | null;
  midtransClientKey: string;
  midtransSnapJsUrl: string;
  shipping: CheckoutShippingOption;
  shippingWeight: number;
};

export type ProductSnapshot = {
  id: string;
  name: string;
  price: number;
  stock: number;
  weight: number;
  image: string;
  variant_pricing: ProductVariantPricingRow[];
};

const toObject = (value: unknown): JsonRecord => {
  if (!value || typeof value !== "object") return {};
  return value as JsonRecord;
};

const toStringValue = (value: unknown): string | null => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
};

const toNumberValue = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

const mapVariantPricingRow = (raw: unknown): ProductVariantPricingRow | null => {
  const row = toObject(raw);
  const rawOptions = toObject(row.options);
  const options = Object.fromEntries(
    Object.entries(rawOptions)
      .map(([key, value]) => [String(key).trim(), toStringValue(value) ?? ""])
      .filter(([key, value]) => key.length > 0 && value.length > 0)
  );

  return {
    sku: toStringValue(row.sku) ?? undefined,
    sku_seller: toStringValue(row.sku_seller) ?? undefined,
    variant_code: toStringValue(row.variant_code) ?? undefined,
    label: toStringValue(row.label) ?? undefined,
    options: Object.keys(options).length > 0 ? options : undefined,
    stock: toNumberValue(row.stock) || undefined,
    item_weight: toNumberValue(row.item_weight) || undefined,
    offline_price: toNumberValue(row.offline_price) || undefined,
    entraverse_price: toNumberValue(row.entraverse_price) || undefined,
    tokopedia_price: toNumberValue(row.tokopedia_price) || undefined,
    shopee_price: toNumberValue(row.shopee_price) || undefined,
  };
};

const extractErrorMessage = (error: unknown): string => {
  if (!isAxiosError(error)) return "Terjadi kesalahan saat memproses checkout.";

  const payload = toObject(error.response?.data);
  const directMessage = toStringValue(payload.message);
  if (directMessage) return directMessage;

  const errors = toObject(payload.errors);
  const firstError = Object.values(errors)[0];
  if (Array.isArray(firstError) && firstError.length > 0) {
    const message = toStringValue(firstError[0]);
    if (message) return message;
  }

  return "Terjadi kesalahan saat memproses checkout.";
};

const mapShippingOption = (raw: unknown): CheckoutShippingOption | null => {
  const row = toObject(raw);
  const service = toStringValue(row.service);
  if (!service) return null;

  return {
    service,
    description: toStringValue(row.description),
    cost: Math.max(0, Math.round(toNumberValue(row.cost))),
    etd: toStringValue(row.etd),
    note: toStringValue(row.note),
  };
};

const mapCheckoutOrder = (raw: unknown): CheckoutOrder => {
  const row = toObject(raw);
  const items = Array.isArray(row.items) ? row.items : [];

  return {
    id: toStringValue(row.id) ?? "",
    orderNumber: toStringValue(row.order_number) ?? "",
    status: toStringValue(row.status) ?? "",
    paymentStatus: toStringValue(row.payment_status) ?? "pending",
    subtotal: toNumberValue(row.subtotal),
    shippingCost: toNumberValue(row.shipping_cost),
    totalAmount: toNumberValue(row.total_amount),
    shippingCourier: toStringValue(row.shipping_courier),
    shippingService: toStringValue(row.shipping_service),
    shippingEtd: toStringValue(row.shipping_etd),
    shippingWeight: Math.max(1, Math.round(toNumberValue(row.shipping_weight) || 1)),
    items: items.map((item) => {
      const itemRow = toObject(item);

      return {
        id: toStringValue(itemRow.id) ?? "",
        productId: toStringValue(itemRow.product_id) ?? "",
        productName: toStringValue(itemRow.product_name) ?? "Produk",
        variantName: toStringValue(itemRow.variant_name),
        variantSku: toStringValue(itemRow.variant_sku) ?? "",
        quantity: Math.max(1, Math.round(toNumberValue(itemRow.quantity) || 1)),
        unitPrice: toNumberValue(itemRow.unit_price),
        lineTotal: toNumberValue(itemRow.line_total),
      } satisfies CheckoutOrderItem;
    }),
  };
};

export const checkoutApi = {
  async getShippingCost(payload: ShippingCostPayload): Promise<ShippingCostResult> {
    try {
      const response = await api.post("/shipping/cost", payload);
      const source = toObject(response.data);
      const data = toObject(source.data);
      const options = Array.isArray(data.options) ? data.options : [];

      return {
        courier: toStringValue(data.courier) ?? payload.courier,
        destinationCityId: toStringValue(data.destination_city_id) ?? payload.city_id ?? "",
        destinationDistrictId: toStringValue(data.destination_district_id),
        itemWeight: Math.max(0, Math.round(toNumberValue(data.item_weight))),
        packagingWeight: Math.max(0, Math.round(toNumberValue(data.packaging_weight))),
        weight: Math.max(1, Math.round(toNumberValue(data.weight) || toNumberValue(payload.weight) || 1)),
        strictMode: Boolean(data.strict_mode),
        options: options
          .map(mapShippingOption)
          .filter((item): item is CheckoutShippingOption => item !== null),
      };
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  async processCheckout(payload: CheckoutProcessPayload): Promise<CheckoutProcessResult> {
    try {
      const response = await api.post("/checkout/process", payload);
      const source = toObject(response.data);
      const data = toObject(source.data);
      const shipping = mapShippingOption(data.shipping) ?? {
        service: payload.service,
        description: null,
        cost: 0,
        etd: null,
        note: null,
      };

      return {
        order: mapCheckoutOrder(data.order),
        snapToken: toStringValue(data.snap_token) ?? "",
        snapRedirectUrl: toStringValue(data.snap_redirect_url),
        midtransClientKey: toStringValue(data.midtrans_client_key) ?? "",
        midtransSnapJsUrl:
          toStringValue(data.midtrans_snap_js_url) ?? "https://app.sandbox.midtrans.com/snap/snap.js",
        shipping,
        shippingWeight: Math.max(1, Math.round(toNumberValue(data.shipping_weight) || 1)),
      };
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  async getProductSnapshot(productId: string): Promise<ProductSnapshot> {
    try {
      const response = await api.get(`/v1/products/${productId}`);
      const source = toObject(response.data);
      const data = toObject(source.data);
      const inventory = toObject(data.inventory);

      return {
        id: toStringValue(data.id) ?? productId,
        name: toStringValue(data.name) ?? "Produk",
        price: toNumberValue(data.price) || toNumberValue(inventory.price),
        stock: Math.max(0, Math.round(toNumberValue(data.stock) || toNumberValue(inventory.total_stock))),
        weight: Math.max(1, Math.round(toNumberValue(inventory.weight) || toNumberValue(data.weight) || 1)),
        image:
          toStringValue(data.main_image) ??
          (Array.isArray(data.photos) && data.photos.length > 0
            ? toStringValue(toObject(data.photos[0]).url) ?? "/assets/images/hero/e-hero.png"
            : "/assets/images/hero/e-hero.png"),
        variant_pricing: (Array.isArray(data.variant_pricing) ? data.variant_pricing : [])
          .map(mapVariantPricingRow)
          .filter((item): item is ProductVariantPricingRow => item !== null),
      };
    } catch {
      throw new Error("Gagal mengambil data master produk.");
    }
  },
};
