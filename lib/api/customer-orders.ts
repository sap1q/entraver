import api, { isAxiosError } from "@/lib/axios";

type JsonRecord = Record<string, unknown>;

export type CustomerOrderFilterKey = "all" | "ongoing" | "success" | "cancelled";

export type CustomerOrderProgressStage = {
  step: number;
  code: string;
  label: string;
};

export type CustomerOrderFilterOption = {
  key: string;
  label: string;
};

export type CustomerOrderItem = {
  id: string;
  productId: string;
  productName: string;
  variantName: string | null;
  variantSku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  productImage: string | null;
};

export type CustomerOrderPrimaryItem = {
  id: string;
  productId: string;
  productName: string;
  variantName: string | null;
  variantSku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  productImage: string | null;
};

export type CustomerOrder = {
  id: string;
  orderNumber: string;
  status: string;
  statusStageCode: string;
  statusStep: number;
  statusLabel: string;
  statusGroup: string;
  paymentStatus: string;
  paymentMethod: string | null;
  paymentMethodLabel: string;
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  totalAmount: number;
  shippingCourier: string | null;
  shippingService: string | null;
  shippingEtd: string | null;
  canTrackPackage: boolean;
  trackingNumber: string | null;
  trackingUrl: string | null;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  customerAddress: string | null;
  primaryItem: CustomerOrderPrimaryItem | null;
  items: CustomerOrderItem[];
  createdAt: string | null;
  updatedAt: string | null;
};

export type CustomerOrderListResult = {
  items: CustomerOrder[];
  filters: {
    active: string;
    items: CustomerOrderFilterOption[];
  };
  statusCatalog: {
    steps: CustomerOrderProgressStage[];
  };
  pagination: {
    currentPage: number;
    perPage: number;
    total: number;
    lastPage: number;
  };
};

export type CustomerOrderPaymentResult = {
  orderId: string;
  orderNumber: string;
  paymentStatus: string;
  status: string;
  statusStep: number;
  totalAmount: number;
  snapToken: string | null;
  snapRedirectUrl: string | null;
  midtransClientKey: string;
  midtransSnapJsUrl: string;
};

const DEFAULT_PROGRESS_STAGES: CustomerOrderProgressStage[] = [
  { step: 1, code: "waiting_payment", label: "Menunggu Pembayaran" },
  { step: 2, code: "waiting_confirmation", label: "Menunggu Konfirmasi" },
  { step: 3, code: "order_shipped", label: "Pesanan Dikirim" },
  { step: 4, code: "order_delivered", label: "Pesanan Terkirim" },
  { step: 5, code: "completed", label: "Selesai" },
];

const DEFAULT_FILTERS: CustomerOrderFilterOption[] = [
  { key: "all", label: "Semua" },
  { key: "ongoing", label: "Berlangsung" },
  { key: "success", label: "Berhasil" },
  { key: "cancelled", label: "Dibatalkan" },
];

const FAILED_PAYMENT_STATUSES = new Set(["deny", "cancel", "cancelled", "expire", "expired", "failure", "failed"]);
const SUCCESS_PAYMENT_STATUSES = new Set(["settlement", "capture", "paid"]);

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
    const normalized = Number(value.replace(/[^\d.-]/g, ""));
    if (Number.isFinite(normalized)) return normalized;
  }
  return 0;
};

const toBooleanValue = (value: unknown): boolean | null => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1") return true;
    if (normalized === "false" || normalized === "0") return false;
  }

  return null;
};

const clampStep = (value: number): number => {
  const rounded = Math.round(value);
  if (!Number.isFinite(rounded) || rounded < 1) return 1;
  if (rounded > 5) return 5;
  return rounded;
};

const resolvePaymentMethodLabelFallback = (paymentMethod: string | null): string => {
  const normalized = (paymentMethod ?? "").trim().toLowerCase();
  if (!normalized) return "Belum dipilih";

  const map: Record<string, string> = {
    midtrans_snap: "Midtrans Snap",
    bank_transfer: "Transfer Bank",
    credit_card: "Kartu Kredit",
    debit_card: "Kartu Debit",
    echannel: "Mandiri Bill",
    permata_va: "Permata Virtual Account",
    bca_va: "BCA Virtual Account",
    bni_va: "BNI Virtual Account",
    bri_va: "BRI Virtual Account",
    gopay: "GoPay",
    shopeepay: "ShopeePay",
    qris: "QRIS",
  };

  if (map[normalized]) return map[normalized];
  return normalized.replace(/[_-]+/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());
};

const resolveStatusFallback = (
  status: string,
  paymentStatus: string
): {
  statusStageCode: string;
  statusStep: number;
  statusLabel: string;
  statusGroup: string;
  canTrackPackage: boolean;
} => {
  const normalizedStatus = status.trim().toLowerCase();
  const normalizedPaymentStatus = paymentStatus.trim().toLowerCase();

  if (normalizedStatus === "dibatalkan" || FAILED_PAYMENT_STATUSES.has(normalizedPaymentStatus)) {
    return {
      statusStageCode: "cancelled",
      statusStep: 1,
      statusLabel: "Dibatalkan",
      statusGroup: "cancelled",
      canTrackPackage: false,
    };
  }

  if (normalizedStatus === "selesai") {
    return {
      statusStageCode: "completed",
      statusStep: 5,
      statusLabel: "Selesai",
      statusGroup: "success",
      canTrackPackage: true,
    };
  }

  if (normalizedStatus === "terkirim") {
    return {
      statusStageCode: "order_delivered",
      statusStep: 4,
      statusLabel: "Pesanan Terkirim",
      statusGroup: "ongoing",
      canTrackPackage: true,
    };
  }

  if (normalizedStatus === "dikirim") {
    return {
      statusStageCode: "order_shipped",
      statusStep: 3,
      statusLabel: "Pesanan Dikirim",
      statusGroup: "ongoing",
      canTrackPackage: true,
    };
  }

  if (normalizedStatus === "diproses" || SUCCESS_PAYMENT_STATUSES.has(normalizedPaymentStatus)) {
    return {
      statusStageCode: "waiting_confirmation",
      statusStep: 2,
      statusLabel: "Menunggu Konfirmasi",
      statusGroup: "ongoing",
      canTrackPackage: false,
    };
  }

  return {
    statusStageCode: "waiting_payment",
    statusStep: 1,
    statusLabel: "Menunggu Pembayaran",
    statusGroup: "ongoing",
    canTrackPackage: false,
  };
};

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (!isAxiosError(error)) return fallback;

  const payload = toObject(error.response?.data);
  const message = toStringValue(payload.message);
  if (message) return message;

  return fallback;
};

const mapOrderItem = (raw: unknown): CustomerOrderItem => {
  const row = toObject(raw);

  return {
    id: toStringValue(row.id) ?? "",
    productId: toStringValue(row.product_id) ?? "",
    productName: toStringValue(row.product_name) ?? "Produk",
    variantName: toStringValue(row.variant_name),
    variantSku: toStringValue(row.variant_sku) ?? "",
    quantity: Math.max(1, Math.round(toNumberValue(row.quantity) || 1)),
    unitPrice: toNumberValue(row.unit_price),
    lineTotal: toNumberValue(row.line_total),
    productImage: toStringValue(row.product_image),
  };
};

const mapPrimaryItem = (raw: unknown): CustomerOrderPrimaryItem | null => {
  const row = toObject(raw);
  const id = toStringValue(row.id);
  if (!id) return null;

  return {
    id,
    productId: toStringValue(row.product_id) ?? "",
    productName: toStringValue(row.product_name) ?? "Produk",
    variantName: toStringValue(row.variant_name),
    variantSku: toStringValue(row.variant_sku) ?? "",
    quantity: Math.max(1, Math.round(toNumberValue(row.quantity) || 1)),
    unitPrice: toNumberValue(row.unit_price),
    lineTotal: toNumberValue(row.line_total),
    productImage: toStringValue(row.product_image),
  };
};

const mapOrder = (raw: unknown): CustomerOrder => {
  const row = toObject(raw);
  const items = Array.isArray(row.items) ? row.items : [];
  const status = toStringValue(row.status) ?? "";
  const paymentStatus = toStringValue(row.payment_status) ?? "pending";
  const statusFallback = resolveStatusFallback(status, paymentStatus);
  const statusStep = clampStep(toNumberValue(row.status_step) || statusFallback.statusStep);
  const canTrackPackage = toBooleanValue(row.can_track_package) ?? statusStep >= 3;
  const paymentMethod = toStringValue(row.payment_method);

  return {
    id: toStringValue(row.id) ?? "",
    orderNumber: toStringValue(row.order_number) ?? "",
    status,
    statusStageCode: toStringValue(row.status_stage_code) ?? statusFallback.statusStageCode,
    statusStep,
    statusLabel: toStringValue(row.status_label) ?? statusFallback.statusLabel,
    statusGroup: toStringValue(row.status_group) ?? statusFallback.statusGroup,
    paymentStatus,
    paymentMethod,
    paymentMethodLabel: toStringValue(row.payment_method_label) ?? resolvePaymentMethodLabelFallback(paymentMethod),
    subtotal: toNumberValue(row.subtotal),
    shippingCost: toNumberValue(row.shipping_cost),
    discountAmount: toNumberValue(row.discount_amount),
    totalAmount: toNumberValue(row.total_amount),
    shippingCourier: toStringValue(row.shipping_courier),
    shippingService: toStringValue(row.shipping_service),
    shippingEtd: toStringValue(row.shipping_etd),
    canTrackPackage,
    trackingNumber: toStringValue(row.tracking_number),
    trackingUrl: toStringValue(row.tracking_url),
    customerName: toStringValue(row.customer_name) ?? "Pelanggan",
    customerPhone: toStringValue(row.customer_phone),
    customerEmail: toStringValue(row.customer_email),
    customerAddress: toStringValue(row.customer_address),
    primaryItem: mapPrimaryItem(row.primary_item),
    items: items.map(mapOrderItem),
    createdAt: toStringValue(row.created_at),
    updatedAt: toStringValue(row.updated_at),
  };
};

const mapProgressStage = (raw: unknown): CustomerOrderProgressStage | null => {
  const row = toObject(raw);
  const step = clampStep(toNumberValue(row.step));
  const code = toStringValue(row.code);
  const label = toStringValue(row.label);
  if (!code || !label) return null;

  return {
    step,
    code,
    label,
  };
};

const mapFilterOption = (raw: unknown): CustomerOrderFilterOption | null => {
  const row = toObject(raw);
  const key = toStringValue(row.key);
  const label = toStringValue(row.label);
  if (!key || !label) return null;

  return {
    key,
    label,
  };
};

export const customerOrdersApi = {
  async getOrders(params?: {
    page?: number;
    per_page?: number;
    status?: string;
    filter?: CustomerOrderFilterKey;
  }): Promise<CustomerOrderListResult> {
    try {
      const response = await api.get("/orders", { params });
      const source = toObject(response.data);
      const rows = Array.isArray(source.data) ? source.data : [];
      const pagination = toObject(source.pagination);
      const filters = toObject(source.filters);
      const statusCatalog = toObject(source.status_catalog);
      const filterRows = Array.isArray(filters.items) ? filters.items : [];
      const stepRows = Array.isArray(statusCatalog.steps) ? statusCatalog.steps : [];
      const mappedFilters = filterRows.map(mapFilterOption).filter((item): item is CustomerOrderFilterOption => item !== null);
      const mappedSteps = stepRows.map(mapProgressStage).filter((item): item is CustomerOrderProgressStage => item !== null);

      return {
        items: rows.map(mapOrder),
        filters: {
          active: toStringValue(filters.active) ?? params?.filter ?? "all",
          items: mappedFilters.length > 0 ? mappedFilters : DEFAULT_FILTERS,
        },
        statusCatalog: {
          steps: mappedSteps.length > 0 ? mappedSteps : DEFAULT_PROGRESS_STAGES,
        },
        pagination: {
          currentPage: Math.max(1, Math.round(toNumberValue(pagination.current_page) || 1)),
          perPage: Math.max(1, Math.round(toNumberValue(pagination.per_page) || 10)),
          total: Math.max(0, Math.round(toNumberValue(pagination.total))),
          lastPage: Math.max(1, Math.round(toNumberValue(pagination.last_page) || 1)),
        },
      };
    } catch (error) {
      throw new Error(extractErrorMessage(error, "Gagal memuat daftar transaksi."));
    }
  },

  async getPayment(orderId: string): Promise<CustomerOrderPaymentResult> {
    try {
      const response = await api.post(`/orders/${orderId}/payment`);
      const source = toObject(response.data);
      const data = toObject(source.data);
      const order = toObject(data.order);

      return {
        orderId: toStringValue(order.id) ?? orderId,
        orderNumber: toStringValue(order.order_number) ?? "",
        paymentStatus: toStringValue(order.payment_status) ?? "pending",
        status: toStringValue(order.status) ?? "",
        statusStep: clampStep(toNumberValue(order.status_step) || 1),
        totalAmount: toNumberValue(order.total_amount),
        snapToken: toStringValue(data.snap_token),
        snapRedirectUrl: toStringValue(data.snap_redirect_url),
        midtransClientKey: toStringValue(data.midtrans_client_key) ?? "",
        midtransSnapJsUrl:
          toStringValue(data.midtrans_snap_js_url) ?? "https://app.sandbox.midtrans.com/snap/snap.js",
      };
    } catch (error) {
      throw new Error(extractErrorMessage(error, "Gagal memuat data pembayaran transaksi."));
    }
  },
};
