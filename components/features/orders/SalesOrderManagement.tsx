"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Loader2, Plus, Search, X } from "lucide-react";
import api, { isAxiosError } from "@/lib/axios";

type SalesOrderStatus = "dibayar" | "diproses" | "dikirim" | "selesai" | "dibatalkan";

type SalesOrderItem = {
  id: string;
  product_name: string;
  variant_name: string | null;
  variant_sku: string;
  warehouse: string;
  quantity: number;
  unit_price: number;
  landed_cost: number;
  line_total: number;
};

type SalesOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone?: string | null;
  customer_email?: string | null;
  customer_address?: string | null;
  status: SalesOrderStatus;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  total_amount: number;
  notes?: string | null;
  items: SalesOrderItem[];
  created_at: string;
};

type CatalogWarehouse = {
  warehouse: string;
  stock: number;
};

type SalesCatalogItem = {
  id: string;
  product_id: string;
  product_name: string;
  product_spu: string;
  variant_sku: string;
  variant_name: string;
  warehouse_stock: CatalogWarehouse[];
  available_stock: number;
  landed_cost: number;
  unit_price: number;
};

type OrdersResponse = {
  data: SalesOrder[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
};

type ItemDraft = {
  key: string;
  catalog_id: string;
  warehouse: string;
  quantity: number;
};

type FormState = {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  status: SalesOrderStatus;
  shipping_cost: number;
  discount_amount: number;
  notes: string;
  items: ItemDraft[];
};

type CreatePayload = {
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  status: SalesOrderStatus;
  shipping_cost: number;
  discount_amount: number;
  notes?: string;
  items: Array<{
    product_id: string;
    variant_sku: string;
    warehouse: string;
    quantity: number;
    unit_price: number;
  }>;
};

const statusLabel: Record<SalesOrderStatus, string> = {
  dibayar: "Paid",
  diproses: "Processed",
  dikirim: "Shipped",
  selesai: "Done",
  dibatalkan: "Canceled",
};

const statusStyle: Record<SalesOrderStatus, string> = {
  dibayar: "border-blue-200 bg-blue-50 text-blue-700",
  diproses: "border-amber-200 bg-amber-50 text-amber-700",
  dikirim: "border-indigo-200 bg-indigo-50 text-indigo-700",
  selesai: "border-emerald-200 bg-emerald-50 text-emerald-700",
  dibatalkan: "border-rose-200 bg-rose-50 text-rose-700",
};

const steps = ["Paid", "Processed", "Shipped", "Done"];

const endpoint = (): string => {
  const base = String(api.defaults.baseURL ?? "").toLowerCase();
  return base.endsWith("/v1") || base.includes("/api/v1") ? "/admin/sales-orders" : "/v1/admin/sales-orders";
};

const catalogEndpoint = (): string => `${endpoint()}/catalog`;

const stepIndex = (status: SalesOrderStatus): number => {
  if (status === "dibayar") return 1;
  if (status === "diproses") return 2;
  if (status === "dikirim") return 3;
  if (status === "selesai") return 4;
  return 0;
};

const idr = (value: number): string =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const getError = (error: unknown, fallback: string): string => {
  if (isAxiosError(error)) {
    if (typeof error.response?.data?.message === "string") return error.response.data.message;
    const first = error.response?.data?.errors ? Object.values(error.response.data.errors)[0] : null;
    if (Array.isArray(first) && typeof first[0] === "string") return first[0];
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const fetchOrders = async (search: string, status: string, page: number): Promise<OrdersResponse> => {
  const response = await api.get(endpoint(), {
    params: {
      search: search || undefined,
      status: status === "all" ? undefined : status,
      page,
      per_page: 10,
    },
  });

  return {
    data: Array.isArray(response.data?.data) ? response.data.data : [],
    pagination: response.data?.pagination ?? {
      current_page: 1,
      per_page: 10,
      total: 0,
      last_page: 1,
    },
  };
};

const fetchCatalog = async (search: string): Promise<SalesCatalogItem[]> => {
  const response = await api.get(catalogEndpoint(), {
    params: { search: search || undefined },
  });
  return Array.isArray(response.data?.data) ? response.data.data : [];
};

const createOrder = async (payload: CreatePayload): Promise<SalesOrder> => {
  const response = await api.post(endpoint(), payload);
  if (!response.data?.data) throw new Error("Create order response invalid.");
  return response.data.data as SalesOrder;
};

const emptyItem = (): ItemDraft => ({
  key: crypto.randomUUID(),
  catalog_id: "",
  warehouse: "",
  quantity: 1,
});

const initialForm = (): FormState => ({
  customer_name: "",
  customer_phone: "",
  customer_email: "",
  customer_address: "",
  status: "diproses",
  shipping_cost: 0,
  discount_amount: 0,
  notes: "",
  items: [emptyItem()],
});

const printInvoice = (order: SalesOrder): void => {
  const popup = window.open("", "_blank", "noopener,noreferrer,width=860,height=720");
  if (!popup) return;
  const rows = order.items
    .map((item, index) => `<tr><td>${index + 1}</td><td>${item.product_name} (${item.variant_sku})</td><td>${item.warehouse}</td><td>${item.quantity}</td><td>${idr(item.unit_price)}</td><td>${idr(item.line_total)}</td></tr>`)
    .join("");

  popup.document.write(`
    <html>
      <head>
        <title>Invoice ${order.order_number}</title>
        <style>
          body{font-family:Arial,sans-serif;margin:28px;color:#0f172a}
          .head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px}
          .title{font-size:22px;font-weight:700}
          table{width:100%;border-collapse:collapse}
          th,td{border:1px solid #e2e8f0;padding:8px;font-size:12px;text-align:left}
          th{background:#eff6ff;color:#1d4ed8}
          .sum{margin-top:12px;display:flex;justify-content:flex-end}
          .sum table{width:320px}
          .sum td{border:none;padding:4px 0}
        </style>
      </head>
      <body>
        <div class="head">
          <div>
            <div class="title">Invoice Penjualan</div>
            <div>No: ${order.order_number}</div>
            <div>${new Date(order.created_at).toLocaleString("id-ID")}</div>
          </div>
          <div>Entraverse Admin</div>
        </div>
        <div style="margin-bottom:10px">Customer: <strong>${order.customer_name}</strong></div>
        <table>
          <thead><tr><th>#</th><th>Produk</th><th>Warehouse</th><th>Qty</th><th>Harga</th><th>Total</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="sum">
          <table>
            <tr><td>Subtotal</td><td style="text-align:right">${idr(order.subtotal)}</td></tr>
            <tr><td>Shipping</td><td style="text-align:right">${idr(order.shipping_cost)}</td></tr>
            <tr><td>Discount</td><td style="text-align:right">${idr(order.discount_amount)}</td></tr>
            <tr><td><strong>Grand Total</strong></td><td style="text-align:right"><strong>${idr(order.total_amount)}</strong></td></tr>
          </table>
        </div>
      </body>
    </html>
  `);
  popup.document.close();
  popup.focus();
  popup.print();
};

export default function SalesOrderManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | SalesOrderStatus>("all");
  const [page, setPage] = useState(1);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [formError, setFormError] = useState("");

  const ordersQuery = useQuery({
    queryKey: ["sales-orders", { search, status, page }],
    queryFn: () => fetchOrders(search, status, page),
    placeholderData: (prev) => prev,
  });

  const catalogQuery = useQuery({
    queryKey: ["sales-catalog", catalogSearch],
    queryFn: () => fetchCatalog(catalogSearch),
    enabled: openCreate,
  });

  const catalogMap = useMemo(() => {
    const map = new Map<string, SalesCatalogItem>();
    (catalogQuery.data ?? []).forEach((entry) => map.set(entry.id, entry));
    return map;
  }, [catalogQuery.data]);

  const createMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      setOpenCreate(false);
      setForm(initialForm());
      setFormError("");
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-list"] });
    },
    onError: (error) => setFormError(getError(error, "Gagal membuat order.")),
  });

  const orders = ordersQuery.data?.data ?? [];
  const pagination = ordersQuery.data?.pagination ?? { current_page: 1, per_page: 10, total: 0, last_page: 1 };

  const subtotal = useMemo(
    () =>
      form.items.reduce((sum, item) => {
        const selected = catalogMap.get(item.catalog_id);
        if (!selected) return sum;
        return sum + selected.unit_price * item.quantity;
      }, 0),
    [catalogMap, form.items]
  );

  const grandTotal = Math.max(0, subtotal + form.shipping_cost - form.discount_amount);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-800">Pemesanan</h1>
            <p className="mt-1 text-sm text-slate-500">
              Integrasi pemesanan dengan stok per warehouse untuk transaksi end-to-end.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpenCreate(true);
              setFormError("");
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Buat Pesanan Baru
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <label className="flex w-full max-w-xl items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 text-slate-500">
            <Search className="h-4 w-4 text-blue-500" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Cari nomor pesanan atau customer..."
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {(["all", "dibayar", "diproses", "dikirim", "selesai", "dibatalkan"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setStatus(value);
                  setPage(1);
                }}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  status === value
                    ? "border-blue-500 bg-blue-600 text-white"
                    : "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {value === "all" ? "Semua" : statusLabel[value]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {ordersQuery.isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={`sales-loading-${index}`} className="h-24 animate-pulse rounded-xl bg-slate-100" />
            ))
          ) : orders.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              Belum ada data pemesanan.
            </div>
          ) : (
            orders.map((order) => (
              <article key={order.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[190px_minmax(0,1fr)_150px_120px_160px]">
                  <div>
                    <p className="text-sm font-semibold text-blue-700">{order.order_number}</p>
                    <p className="text-xs text-slate-500">{new Date(order.created_at).toLocaleString("id-ID")}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{order.customer_name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {order.items.length} item | {order.items[0]?.product_name ?? "-"}
                    </p>
                  </div>
                  <div className="text-sm text-slate-600">
                    <p>Landed: {idr(order.items.reduce((sum, item) => sum + item.landed_cost * item.quantity, 0))}</p>
                    <p>Total: {idr(order.total_amount)}</p>
                  </div>
                  <div>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusStyle[order.status]}`}
                    >
                      {statusLabel[order.status]}
                    </span>
                  </div>
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => printInvoice(order)}
                      className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Print Invoice
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-4 gap-2">
                  {steps.map((step, index) => {
                    const active = stepIndex(order.status) >= index + 1;
                    return (
                      <div key={`${order.id}:${step}`} className="space-y-1">
                        <div className={`h-1.5 rounded-full ${active ? "bg-blue-600" : "bg-slate-200"}`} />
                        <p className={`text-center text-[11px] ${active ? "text-slate-700" : "text-slate-400"}`}>{step}</p>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Menampilkan {orders.length} dari {pagination.total} pesanan
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || ordersQuery.isFetching}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-xs text-slate-500">
              {pagination.current_page} / {pagination.last_page}
            </span>
            <button
              type="button"
              disabled={page >= pagination.last_page || ordersQuery.isFetching}
              onClick={() => setPage((prev) => Math.min(pagination.last_page, prev + 1))}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {openCreate ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/45 p-4">
          <div className="mx-auto w-full max-w-5xl rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">Buat Sales Order</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Status <strong>Diproses</strong> akan otomatis stock out dari warehouse yang dipilih.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenCreate(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input
                  value={form.customer_name}
                  onChange={(event) => setForm((prev) => ({ ...prev, customer_name: event.target.value }))}
                  placeholder="Nama Customer"
                  className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-300"
                />
                <input
                  value={form.customer_phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, customer_phone: event.target.value }))}
                  placeholder="No. Telepon"
                  className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-300"
                />
                <input
                  value={form.customer_email}
                  onChange={(event) => setForm((prev) => ({ ...prev, customer_email: event.target.value }))}
                  placeholder="Email"
                  className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-300"
                />
                <select
                  value={form.status}
                  onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as SalesOrderStatus }))}
                  className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-300"
                >
                  <option value="dibayar">Paid</option>
                  <option value="diproses">Processed</option>
                  <option value="dikirim">Shipped</option>
                  <option value="selesai">Done</option>
                  <option value="dibatalkan">Canceled</option>
                </select>
              </div>

              <textarea
                value={form.customer_address}
                onChange={(event) => setForm((prev) => ({ ...prev, customer_address: event.target.value }))}
                rows={2}
                placeholder="Alamat Customer"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-300"
              />

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm font-semibold text-slate-700">Item Pesanan</p>
                  <label className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-slate-500">
                    <Search className="h-4 w-4 text-blue-500" />
                    <input
                      value={catalogSearch}
                      onChange={(event) => setCatalogSearch(event.target.value)}
                      placeholder="Cari produk/SKU..."
                      className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                    />
                    {catalogQuery.isFetching ? <Loader2 className="h-4 w-4 animate-spin text-blue-500" /> : null}
                  </label>
                </div>

                <div className="space-y-2">
                  {form.items.map((item) => {
                    const selected = catalogMap.get(item.catalog_id);
                    const warehouseStock = selected?.warehouse_stock.find((entry) => entry.warehouse === item.warehouse)?.stock ?? 0;
                    const lineTotal = (selected?.unit_price ?? 0) * item.quantity;

                    return (
                      <div key={item.key} className="rounded-lg border border-slate-200 bg-white p-3">
                        <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1.8fr)_220px_120px_130px_130px]">
                          <select
                            value={item.catalog_id}
                            onChange={(event) => {
                              const next = catalogMap.get(event.target.value);
                              setForm((prev) => ({
                                ...prev,
                                items: prev.items.map((entry) =>
                                  entry.key === item.key
                                    ? {
                                        ...entry,
                                        catalog_id: event.target.value,
                                        warehouse: next?.warehouse_stock[0]?.warehouse ?? "",
                                      }
                                    : entry
                                ),
                              }));
                            }}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-300"
                          >
                            <option value="">Pilih Produk / SKU</option>
                            {(catalogQuery.data ?? []).map((entry) => (
                              <option key={entry.id} value={entry.id}>
                                {entry.product_name} | {entry.variant_name} | {entry.variant_sku}
                              </option>
                            ))}
                          </select>

                          <select
                            value={item.warehouse}
                            onChange={(event) =>
                              setForm((prev) => ({
                                ...prev,
                                items: prev.items.map((entry) =>
                                  entry.key === item.key ? { ...entry, warehouse: event.target.value } : entry
                                ),
                              }))
                            }
                            disabled={!selected}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-300 disabled:opacity-60"
                          >
                            <option value="">Pilih Warehouse</option>
                            {selected?.warehouse_stock.map((entry) => (
                              <option key={`${item.key}:${entry.warehouse}`} value={entry.warehouse}>
                                {entry.warehouse} (Stock: {entry.stock})
                              </option>
                            ))}
                          </select>

                          <input
                            type="number"
                            min={1}
                            max={warehouseStock > 0 ? warehouseStock : undefined}
                            value={item.quantity}
                            onChange={(event) =>
                              setForm((prev) => ({
                                ...prev,
                                items: prev.items.map((entry) =>
                                  entry.key === item.key ? { ...entry, quantity: Math.max(1, Number(event.target.value) || 1) } : entry
                                ),
                              }))
                            }
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-300"
                          />

                          <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
                            <p className="text-[11px]">Landed</p>
                            <p className="font-semibold">{idr(selected?.landed_cost ?? 0)}</p>
                          </div>

                          <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
                            <p className="text-[11px]">Line Total</p>
                            <p className="font-semibold">{idr(lineTotal)}</p>
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                          <p>
                            Available stock: <span className="font-semibold text-slate-700">{warehouseStock}</span>
                          </p>
                          {form.items.length > 1 ? (
                            <button
                              type="button"
                              onClick={() =>
                                setForm((prev) => ({
                                  ...prev,
                                  items: prev.items.filter((entry) => entry.key !== item.key),
                                }))
                              }
                              className="text-rose-600 hover:text-rose-700"
                            >
                              Hapus item
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      items: [...prev.items, emptyItem()],
                    }))
                  }
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Tambah Item
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <input
                  type="number"
                  min={0}
                  value={form.shipping_cost}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, shipping_cost: Math.max(0, Number(event.target.value) || 0) }))
                  }
                  placeholder="Shipping Cost"
                  className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-300"
                />
                <input
                  type="number"
                  min={0}
                  value={form.discount_amount}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, discount_amount: Math.max(0, Number(event.target.value) || 0) }))
                  }
                  placeholder="Discount Amount"
                  className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-300"
                />
                <div className="rounded-lg bg-blue-50 px-3 py-2.5 text-sm text-blue-700">
                  <p className="text-[11px]">Grand Total</p>
                  <p className="text-base font-semibold">{idr(grandTotal)}</p>
                </div>
              </div>

              <textarea
                value={form.notes}
                onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                rows={2}
                placeholder="Catatan pesanan"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-300"
              />

              {formError ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {formError}
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-4">
              <button
                type="button"
                onClick={() => setOpenCreate(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={createMutation.isPending}
                onClick={async () => {
                  setFormError("");

                  if (form.customer_name.trim() === "") {
                    setFormError("Nama customer wajib diisi.");
                    return;
                  }

                  const invalidItem = form.items.find((item) => {
                    const selected = catalogMap.get(item.catalog_id);
                    if (!selected) return true;
                    if (!item.warehouse) return true;
                    const available = selected.warehouse_stock.find((entry) => entry.warehouse === item.warehouse)?.stock ?? 0;
                    return item.quantity < 1 || item.quantity > available;
                  });

                  if (invalidItem) {
                    setFormError("Pastikan item, warehouse, dan quantity sudah valid sesuai stok.");
                    return;
                  }

                  await createMutation.mutateAsync({
                    customer_name: form.customer_name.trim(),
                    customer_phone: form.customer_phone.trim() || undefined,
                    customer_email: form.customer_email.trim() || undefined,
                    customer_address: form.customer_address.trim() || undefined,
                    status: form.status,
                    shipping_cost: form.shipping_cost,
                    discount_amount: form.discount_amount,
                    notes: form.notes.trim() || undefined,
                    items: form.items.map((item) => {
                      const selected = catalogMap.get(item.catalog_id)!;
                      return {
                        product_id: selected.product_id,
                        variant_sku: selected.variant_sku,
                        warehouse: item.warehouse,
                        quantity: item.quantity,
                        unit_price: selected.unit_price,
                      };
                    }),
                  });
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Simpan Pesanan
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
