"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, FileText, LifeBuoy, Loader2, MoreVertical, PackageSearch, RefreshCcw, ReceiptText, X } from "lucide-react";
import { AccountShell } from "@/app/(storefront)/account/components/AccountShell";
import { Button } from "@/components/ui/Button";
import { useRequireStorefrontAuth } from "@/hooks/useRequireStorefrontAuth";
import type {
  CustomerOrder,
  CustomerOrderFilterKey,
  CustomerOrderFilterOption,
  CustomerOrderProgressStage,
} from "@/lib/api/customer-orders";
import { customerOrdersApi } from "@/lib/api/customer-orders";
import { formatCurrencyIDR, formatDateID } from "@/lib/utils/formatter";
import { resolveApiAssetUrl } from "@/lib/utils/media";

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

const normalizeFilterKey = (value: string): CustomerOrderFilterKey => {
  const normalized = value.trim().toLowerCase();
  if (normalized === "ongoing" || normalized === "berlangsung") return "ongoing";
  if (normalized === "success" || normalized === "berhasil") return "success";
  if (normalized === "cancelled" || normalized === "canceled" || normalized === "dibatalkan") return "cancelled";
  return "all";
};

const statusBadgeClass = (group: string): string => {
  switch (group) {
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "cancelled":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-blue-200 bg-blue-50 text-blue-700";
  }
};

const toFriendlyError = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return "Terjadi gangguan saat menghubungkan ke API Laravel.";
};

function OrderProgress({
  currentStep,
  stages,
}: {
  currentStep: number;
  stages: CustomerOrderProgressStage[];
}) {
  const orderedStages = useMemo(
    () =>
      [...stages]
        .sort((left, right) => left.step - right.step)
        .filter((stage, index) => index < 5),
    [stages]
  );

  const stepCount = orderedStages.length > 0 ? orderedStages.length : 5;
  const safeStep = Math.min(Math.max(1, Math.round(currentStep || 1)), stepCount);
  const safeStages = orderedStages.length > 0 ? orderedStages : DEFAULT_PROGRESS_STAGES;

  return (
    <div className="mt-5 overflow-x-auto pb-1">
      <div className="min-w-[640px]">
        <div className="grid grid-cols-5 gap-2">
          {safeStages.map((stage, index) => {
            const isPointActive = stage.step <= safeStep;
            const isLeftLineActive = stage.step <= safeStep;
            const isRightLineActive = stage.step < safeStep;

            return (
              <div key={`${stage.code}-${stage.step}`} className="relative flex flex-col items-center gap-2 text-center">
                <div className="relative flex w-full items-center justify-center">
                  {index > 0 ? (
                    <span
                      className={`absolute left-0 right-1/2 h-[3px] rounded-full ${
                        isLeftLineActive ? "bg-blue-600" : "bg-slate-200"
                      }`}
                    />
                  ) : null}

                  {index < safeStages.length - 1 ? (
                    <span
                      className={`absolute left-1/2 right-0 h-[3px] rounded-full ${
                        isRightLineActive ? "bg-blue-600" : "bg-slate-200"
                      }`}
                    />
                  ) : null}

                  <span
                    className={`relative z-10 h-3.5 w-3.5 rounded-full border-2 ${
                      isPointActive ? "border-blue-600 bg-blue-600" : "border-slate-300 bg-white"
                    }`}
                  />
                </div>

                <p className={`text-[11px] leading-4 ${isPointActive ? "font-semibold text-blue-700" : "text-slate-500"}`}>
                  {stage.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function OrderDetailModal({
  order,
  onClose,
}: {
  order: CustomerOrder | null;
  onClose: () => void;
}) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div
        className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Detail Transaksi</h2>
            <p className="mt-1 text-sm text-slate-500">Invoice: {order.orderNumber}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
            aria-label="Tutup detail transaksi"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 sm:grid-cols-2">
          <p>
            <span className="font-semibold text-slate-900">Tanggal:</span>{" "}
            {order.createdAt ? formatDateID(order.createdAt) : "-"}
          </p>
          <p>
            <span className="font-semibold text-slate-900">Status:</span> {order.statusLabel}
          </p>
          <p>
            <span className="font-semibold text-slate-900">Pembayaran:</span> {order.paymentMethodLabel}
          </p>
          <p>
            <span className="font-semibold text-slate-900">Total:</span> {formatCurrencyIDR(order.totalAmount)}
          </p>
          {order.customerAddress ? (
            <p className="sm:col-span-2">
              <span className="font-semibold text-slate-900">Alamat:</span> {order.customerAddress}
            </p>
          ) : null}
        </div>

        <div className="mt-5 space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-200 px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{item.productName}</p>
                  <p className="text-xs text-slate-500">
                    {item.variantName ? `${item.variantName} • ` : ""}
                    {item.quantity} x {formatCurrencyIDR(item.unitPrice)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-slate-900">{formatCurrencyIDR(item.lineTotal)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  const { isAuthenticated, isChecking } = useRequireStorefrontAuth("/transaksi");
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [activeFilter, setActiveFilter] = useState<CustomerOrderFilterKey>("all");
  const [availableFilters, setAvailableFilters] = useState<CustomerOrderFilterOption[]>(DEFAULT_FILTERS);
  const [progressStages, setProgressStages] = useState<CustomerOrderProgressStage[]>(DEFAULT_PROGRESS_STAGES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [openMenuOrderId, setOpenMenuOrderId] = useState<string | null>(null);
  const [detailOrder, setDetailOrder] = useState<CustomerOrder | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    if (!openMenuOrderId) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.closest("[data-order-menu-root='true']")) {
        setOpenMenuOrderId(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenuOrderId(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [openMenuOrderId]);

  useEffect(() => {
    if (!detailOrder) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDetailOrder(null);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [detailOrder]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let isCancelled = false;

    const loadOrders = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await customerOrdersApi.getOrders({
          filter: activeFilter,
          per_page: 20,
        });

        if (isCancelled) return;
        setOrders(result.items);
        setAvailableFilters(result.filters.items.length > 0 ? result.filters.items : DEFAULT_FILTERS);
        setProgressStages(result.statusCatalog.steps.length > 0 ? result.statusCatalog.steps : DEFAULT_PROGRESS_STAGES);
      } catch (loadError) {
        if (isCancelled) return;
        setError(toFriendlyError(loadError));
      } finally {
        if (isCancelled) return;
        setLoading(false);
      }
    };

    void loadOrders();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, activeFilter, reloadTick]);

  const filterTabs = useMemo(() => {
    const serverMap = new Map(availableFilters.map((filter) => [normalizeFilterKey(filter.key), filter]));

    return DEFAULT_FILTERS.map((baseFilter) => {
      const normalizedKey = normalizeFilterKey(baseFilter.key);
      const fromServer = serverMap.get(normalizedKey);
      if (!fromServer) return baseFilter;
      return {
        key: normalizedKey,
        label: fromServer.label,
      };
    });
  }, [availableFilters]);

  const openHelpCenter = (order: CustomerOrder) => {
    if (typeof window === "undefined") return;

    const subject = encodeURIComponent(`Bantuan Pesanan ${order.orderNumber}`);
    const body = encodeURIComponent(
      `Halo Tim Entraverse,\nSaya membutuhkan bantuan untuk pesanan ${order.orderNumber}.\nTerima kasih.`
    );

    window.location.href = `mailto:support@entraverse.id?subject=${subject}&body=${body}`;
  };

  const handleTrackPackage = (order: CustomerOrder) => {
    setInfo(null);

    if (typeof window === "undefined") return;

    if (order.trackingUrl) {
      window.open(order.trackingUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (order.trackingNumber) {
      setInfo(`Nomor resi: ${order.trackingNumber}. Tautan tracking belum tersedia dari kurir.`);
      return;
    }

    setInfo("Nomor resi belum tersedia. Silakan cek kembali beberapa saat lagi.");
  };

  if (isChecking || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.10),_transparent_32%),linear-gradient(180deg,#f8fbff_0%,#f3f6fb_100%)]">
        <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4 text-center">
          <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            Memeriksa sesi login...
          </div>
        </div>
      </div>
    );
  }

  return (
    <AccountShell
      title="Pesanan Saya"
      description="Lihat riwayat belanja Anda, pantau progres pesanan, dan akses tindakan transaksi sesuai status terbaru."
    >
      <OrderDetailModal
        order={detailOrder}
        onClose={() => {
          setDetailOrder(null);
        }}
      />

      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
            {filterTabs.map((filter) => {
              const key = normalizeFilterKey(filter.key);
              const isActive = key === activeFilter;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setActiveFilter(key);
                    setOpenMenuOrderId(null);
                    setInfo(null);
                  }}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    isActive ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => {
              setReloadTick((previous) => previous + 1);
            }}
            className="h-10 rounded-xl border-slate-300"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {error ? (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        ) : null}

        {info ? (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">{info}</div>
        ) : null}

        <div className="space-y-4">
          {loading && orders.length === 0 ? (
            Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-white" />
            ))
          ) : null}

          {!loading && orders.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
              <ReceiptText className="mx-auto h-10 w-10 text-slate-300" />
              <h2 className="mt-4 text-xl font-semibold text-slate-900">Belum ada pesanan</h2>
              <p className="mt-2 text-sm text-slate-500">
                Riwayat pesanan akan muncul di halaman ini setelah Anda menyelesaikan checkout.
              </p>
            </div>
          ) : null}

          {orders.map((order) => {
            const primaryItem = order.primaryItem ?? order.items[0] ?? null;
            const imageSource = resolveApiAssetUrl(primaryItem?.productImage) ?? "/product-placeholder.svg";

            return (
              <article key={order.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <header className="grid gap-4 border-b border-slate-200 pb-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto]">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Tanggal Transaksi</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {order.createdAt ? formatDateID(order.createdAt) : "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">No. Pesanan</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{order.orderNumber}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Total Harga</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{formatCurrencyIDR(order.totalAmount)}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Status</p>
                    <span className={`mt-1 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(order.statusGroup)}`}>
                      {order.statusLabel}
                    </span>
                  </div>

                  <div className="relative justify-self-end" data-order-menu-root="true">
                    <button
                      type="button"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      aria-label={`Buka menu aksi pesanan ${order.orderNumber}`}
                      aria-haspopup="menu"
                      aria-expanded={openMenuOrderId === order.id}
                      onClick={() => {
                        setOpenMenuOrderId((previous) => (previous === order.id ? null : order.id));
                      }}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {openMenuOrderId === order.id ? (
                      <div
                        className="absolute right-0 top-12 z-20 w-52 rounded-xl border border-slate-200 bg-white p-1 shadow-[0_16px_40px_rgba(15,23,42,0.18)]"
                        role="menu"
                        aria-label={`Aksi untuk pesanan ${order.orderNumber}`}
                      >
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                          role="menuitem"
                          onClick={() => {
                            setDetailOrder(order);
                            setOpenMenuOrderId(null);
                          }}
                        >
                          <FileText className="h-4 w-4 text-slate-500" />
                          Detail Transaksi
                        </button>

                        {order.canTrackPackage ? (
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                            role="menuitem"
                            onClick={() => {
                              setOpenMenuOrderId(null);
                              handleTrackPackage(order);
                            }}
                          >
                            <PackageSearch className="h-4 w-4 text-slate-500" />
                            Lacak Paket
                          </button>
                        ) : null}

                        <button
                          type="button"
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                          role="menuitem"
                          onClick={() => {
                            setOpenMenuOrderId(null);
                            openHelpCenter(order);
                          }}
                        >
                          <LifeBuoy className="h-4 w-4 text-slate-500" />
                          Pusat Bantuan
                        </button>
                      </div>
                    ) : null}
                  </div>
                </header>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      <Image
                        src={imageSource}
                        alt={primaryItem?.productName ?? "Produk utama pesanan"}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-slate-900">
                        {primaryItem?.productName ?? "Produk tidak tersedia"}
                      </p>
                      <p className="mt-0.5 text-sm text-emerald-700">Pembayaran: {order.paymentMethodLabel}</p>
                      {order.trackingNumber && order.canTrackPackage ? (
                        <p className="mt-0.5 text-xs text-slate-500">Resi: {order.trackingNumber}</p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <OrderProgress stages={progressStages} currentStep={order.statusStep} />
              </article>
            );
          })}
        </div>

        {!loading && orders.length > 0 ? (
          <p className="text-sm text-slate-500">Menampilkan {orders.length} pesanan.</p>
        ) : null}
      </div>
    </AccountShell>
  );
}
