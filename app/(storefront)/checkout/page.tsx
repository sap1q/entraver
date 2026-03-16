"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Loader2, MapPin, Truck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAddress } from "@/hooks/useAddress";
import { useCart } from "@/hooks/useCart";
import { useRequireStorefrontAuth } from "@/hooks/useRequireStorefrontAuth";
import {
  checkoutApi,
  type CheckoutProcessResult,
  type CheckoutShippingOption,
  type ProductSnapshot,
} from "@/lib/api/checkout";
import { formatCurrencyIDR } from "@/lib/utils/formatter";
import {
  resolveSelectedVariantRow,
  resolveVariantRowPrice,
  resolveVariantRowWeight,
} from "../products/[slug]/components/productPricing";

type MidtransSnapPayOptions = {
  onSuccess?: (result: unknown) => void;
  onPending?: (result: unknown) => void;
  onError?: (result: unknown) => void;
  onClose?: () => void;
};

type MidtransSnap = {
  pay: (token: string, options?: MidtransSnapPayOptions) => void;
};

declare global {
  interface Window {
    snap?: MidtransSnap;
  }
}

const COURIER_OPTIONS = [
  { label: "JNE", value: "jne" },
  { label: "J&T Express", value: "jnt" },
  { label: "SiCepat (Belum Tersedia)", value: "sicepat", disabled: true },
  { label: "POS Indonesia", value: "pos" },
];

const loadSnapScript = async (src: string, clientKey: string): Promise<void> => {
  if (typeof window === "undefined") return;
  if (window.snap) return;

  await new Promise<void>((resolve, reject) => {
    const existing = document.getElementById("midtrans-snap-script") as HTMLScriptElement | null;
    if (existing) {
      if (window.snap) {
        resolve();
        return;
      }

      if (existing.dataset.loaded === "true") {
        reject(new Error("Midtrans Snap.js termuat tetapi objek snap tidak tersedia."));
        return;
      }

      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Gagal memuat Midtrans Snap.js.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = "midtrans-snap-script";
    script.src = src;
    script.async = true;
    script.setAttribute("data-client-key", clientKey);
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error("Gagal memuat Midtrans Snap.js."));
    document.body.appendChild(script);
  });
};

const redirectToMidtrans = (url: string): void => {
  if (typeof window === "undefined") return;
  window.location.assign(url);
};

export default function CheckoutPage() {
  const { isAuthenticated, isChecking } = useRequireStorefrontAuth("/checkout");
  const {
    items,
    refreshCart,
    loading: cartLoading,
  } = useCart();
  const {
    addresses,
    selectedAddress,
    selectedAddressId,
    loading: addressLoading,
    savingId,
    error: addressError,
    fetchAddresses,
    setMainAddress,
  } = useAddress();

  const [productSnapshots, setProductSnapshots] = useState<Record<string, ProductSnapshot | null>>({});
  const [productsSyncing, setProductsSyncing] = useState(false);
  const [courier, setCourier] = useState<string>(COURIER_OPTIONS[0].value);
  const [shippingOptions, setShippingOptions] = useState<CheckoutShippingOption[]>([]);
  const [selectedService, setSelectedService] = useState<string>("");
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutInfo, setCheckoutInfo] = useState<string | null>(null);

  if (isChecking || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f1f5f9]">
        <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4 text-center">
          <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            Memeriksa sesi login...
          </div>
        </div>
      </div>
    );
  }

  const selectedCartItems = useMemo(() => items.filter((item) => item.selected), [items]);
  const selectedProductIds = useMemo(
    () => Array.from(new Set(selectedCartItems.map((item) => item.productId))),
    [selectedCartItems]
  );
  const hasPendingProductSnapshots = useMemo(
    () => selectedProductIds.some((productId) => !Object.prototype.hasOwnProperty.call(productSnapshots, productId)),
    [productSnapshots, selectedProductIds]
  );
  const pricingReady = selectedProductIds.length === 0 || !hasPendingProductSnapshots;

  useEffect(() => {
    void refreshCart({ silent: true });
    void fetchAddresses({ silent: true });
  }, [fetchAddresses, refreshCart]);

  useEffect(() => {
    if (selectedProductIds.length === 0) {
      setProductSnapshots({});
      return;
    }

    let active = true;

    setProductsSyncing(true);
    setCheckoutError(null);

    Promise.all(
      selectedProductIds.map(async (productId) => {
        try {
          const snapshot = await checkoutApi.getProductSnapshot(productId);
          return [productId, snapshot] as const;
        } catch {
          return [productId, null] as const;
        }
      })
    )
      .then((rows) => {
        if (!active) return;
        setProductSnapshots((prev) => {
          const next = selectedProductIds.reduce<Record<string, ProductSnapshot | null>>((result, productId) => {
            if (Object.prototype.hasOwnProperty.call(prev, productId)) {
              result[productId] = prev[productId] ?? null;
            }
            return result;
          }, {});

          rows.forEach(([productId, snapshot]) => {
            next[productId] = snapshot;
          });
          return next;
        });
      })
      .finally(() => {
        if (!active) return;
        setProductsSyncing(false);
      });

    return () => {
      active = false;
    };
  }, [selectedProductIds]);

  const checkoutItems = useMemo(() => {
    return selectedCartItems.map((item) => {
      const snapshot = productSnapshots[item.productId];
      const selectedVariantRow = snapshot
        ? resolveSelectedVariantRow(
            { variant_pricing: snapshot.variant_pricing },
            item.variants,
            item.variantSku ?? null
          )
        : null;
      const unitPrice =
        (selectedVariantRow ? resolveVariantRowPrice(selectedVariantRow) : null) ??
        snapshot?.price ??
        item.price;
      const weight =
        (selectedVariantRow ? resolveVariantRowWeight(selectedVariantRow) : null) ??
        snapshot?.weight ??
        1;
      const lineTotal = unitPrice * item.quantity;

      return {
        id: item.id,
        productId: item.productId,
        name: snapshot?.name ?? item.name,
        image: snapshot?.image ?? item.image,
        quantity: item.quantity,
        variantSku: item.variantSku,
        variants: item.variants,
        unitPrice,
        weight,
        lineTotal,
      };
    });
  }, [productSnapshots, selectedCartItems]);

  const subtotal = useMemo(
    () => checkoutItems.reduce((total, item) => total + item.lineTotal, 0),
    [checkoutItems]
  );

  const totalWeight = useMemo(
    () =>
      Math.max(
        1,
        checkoutItems.reduce((total, item) => total + (item.weight * item.quantity), 0)
      ),
    [checkoutItems]
  );

  const selectedShipping = useMemo(
    () => shippingOptions.find((option) => option.service === selectedService) ?? null,
    [selectedService, shippingOptions]
  );

  const shippingCost = selectedShipping?.cost ?? 0;
  const totalAmount = subtotal + shippingCost;

  useEffect(() => {
    const cityId = String(selectedAddress?.city_id ?? "").trim();
    const isCityIdValid = /^\d{4}$/.test(cityId);

    if (!cityId || checkoutItems.length === 0) {
      setShippingOptions([]);
      setSelectedService("");
      setShippingError(null);
      return;
    }

    if (!isCityIdValid) {
      setShippingOptions([]);
      setSelectedService("");
      setShippingError("Alamat utama belum memiliki kota/kabupaten RajaOngkir yang valid.");
      return;
    }

    if (!pricingReady || productsSyncing) {
      return;
    }

    let active = true;
    setShippingLoading(true);
    setShippingError(null);

    checkoutApi
      .getShippingCost({
        city_id: cityId,
        courier,
        weight: totalWeight,
      })
      .then((result) => {
        if (!active) return;
        setShippingOptions(result.options);
        setSelectedService((prev) => {
          if (prev && result.options.some((option) => option.service === prev)) {
            return prev;
          }

          return result.options[0]?.service ?? "";
        });
      })
      .catch((error) => {
        if (!active) return;
        setShippingOptions([]);
        setSelectedService("");
        setShippingError(error instanceof Error ? error.message : "Gagal mengambil ongkir.");
      })
      .finally(() => {
        if (!active) return;
        setShippingLoading(false);
      });

    return () => {
      active = false;
    };
  }, [checkoutItems.length, courier, pricingReady, productsSyncing, selectedAddress?.city_id, totalWeight]);

  const openMidtransSnap = async (result: CheckoutProcessResult) => {
    if (!result.snapToken && result.snapRedirectUrl) {
      redirectToMidtrans(result.snapRedirectUrl);
      return;
    }

    if (!result.midtransClientKey) {
      if (result.snapRedirectUrl) {
        setCheckoutInfo("Mengalihkan ke halaman pembayaran Midtrans...");
        redirectToMidtrans(result.snapRedirectUrl);
        return;
      }

      throw new Error("MIDTRANS_CLIENT_KEY belum dikonfigurasi di backend.");
    }

    try {
      await loadSnapScript(result.midtransSnapJsUrl, result.midtransClientKey);
    } catch (error) {
      if (result.snapRedirectUrl) {
        setCheckoutInfo("Popup Midtrans tidak tersedia, mengalihkan ke halaman pembayaran...");
        redirectToMidtrans(result.snapRedirectUrl);
        return;
      }

      throw error;
    }

    if (!window.snap) {
      if (result.snapRedirectUrl) {
        setCheckoutInfo("Midtrans Snap belum siap, mengalihkan ke halaman pembayaran...");
        redirectToMidtrans(result.snapRedirectUrl);
        return;
      }

      throw new Error("Midtrans Snap belum siap.");
    }

    window.snap.pay(result.snapToken, {
      onSuccess: () => {
        setCheckoutInfo(`Pembayaran berhasil untuk order ${result.order.orderNumber}.`);
      },
      onPending: () => {
        setCheckoutInfo(`Pembayaran menunggu penyelesaian untuk order ${result.order.orderNumber}.`);
      },
      onError: () => {
        setCheckoutError("Pembayaran gagal diproses oleh Midtrans.");
      },
      onClose: () => {
        setCheckoutInfo("Popup pembayaran ditutup sebelum transaksi selesai.");
      },
    });
  };

  const handleCheckout = async () => {
    if (!selectedAddress?.id) {
      setCheckoutError("Pilih alamat pengiriman terlebih dahulu.");
      return;
    }

    if (!selectedShipping) {
      setCheckoutError("Pilih layanan pengiriman terlebih dahulu.");
      return;
    }

    if (checkoutItems.length === 0) {
      setCheckoutError("Keranjang checkout kosong.");
      return;
    }

    setSubmitLoading(true);
    setCheckoutError(null);
    setCheckoutInfo(null);

    try {
      const result = await checkoutApi.processCheckout({
        address_id: selectedAddress.id,
        courier,
        service: selectedShipping.service,
        items: checkoutItems.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
          variant_sku: item.variantSku,
          variants: item.variants,
        })),
      });

      await openMidtransSnap(result);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Checkout gagal diproses.");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (selectedCartItems.length === 0 && !cartLoading) {
    return (
      <div className="min-h-screen bg-[#f1f5f9]">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center px-4 py-20 text-center sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-slate-900">Checkout</h1>
          <p className="mt-3 text-sm text-slate-500">Belum ada produk yang dipilih untuk checkout.</p>
          <Link
            href="/cart"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Kembali ke Keranjang
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">Checkout</h1>
        <p className="mt-2 text-sm text-slate-500 sm:text-base">
          Periksa detail pesanan dan alamat pengiriman sebelum lanjut ke pembayaran.
        </p>

        {addressError ? (
          <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
            {addressError}
          </div>
        ) : null}
        {shippingError ? (
          <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
            {shippingError}
          </div>
        ) : null}
        {checkoutError ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {checkoutError}
          </div>
        ) : null}
        {checkoutInfo ? (
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            {checkoutInfo}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 lg:grid-cols-12 lg:items-start">
          <div className="space-y-4 lg:col-span-8">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Alamat</p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-900">Alamat Pengiriman</h2>
                </div>
                <Link
                  href="/account/addresses"
                  className="inline-flex h-10 items-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Kelola Alamat
                </Link>
              </div>

              <div className="mt-4 grid gap-3">
                {addressLoading && addresses.length === 0 ? (
                  <div className="h-24 animate-pulse rounded-xl border border-slate-200 bg-slate-50" />
                ) : null}

                {addresses.map((address) => {
                  const active = selectedAddressId === address.id;
                  return (
                    <button
                      key={address.id}
                      type="button"
                      disabled={savingId === address.id}
                      onClick={() => {
                        void setMainAddress(address.id);
                      }}
                      className={`rounded-xl border p-4 text-left transition ${
                        active
                          ? "border-blue-500 bg-blue-50/60"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-900">{address.recipient_name}</p>
                        {savingId === address.id ? <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> : null}
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{address.recipient_phone ?? "-"}</p>
                      <p className="mt-1 text-sm text-slate-700">{address.full_address}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Barang</p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-900">Barang Dipesan</h2>
                </div>
                {hasPendingProductSnapshots || productsSyncing ? (
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Sinkronisasi harga master produk...
                  </div>
                ) : null}
              </div>

              <div className="mt-4 space-y-3">
                {checkoutItems.map((item) => (
                  <div key={item.id} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex gap-3">
                      <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold text-slate-900">{item.name}</p>
                        {pricingReady ? (
                          <>
                            <p className="mt-1 text-xs text-slate-500">
                              {item.quantity} x {formatCurrencyIDR(item.unitPrice)}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">
                              {formatCurrencyIDR(item.lineTotal)}
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="mt-2 h-3.5 w-28 animate-pulse rounded bg-slate-200" />
                            <div className="mt-2 h-4 w-24 animate-pulse rounded bg-slate-200" />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Kurir</p>
                  <select
                    value={courier}
                    onChange={(event) => setCourier(event.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700 focus:border-blue-500 focus:outline-none"
                  >
                    {COURIER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value} disabled={option.disabled}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Layanan</p>
                  <select
                    value={selectedService}
                    disabled={shippingLoading || shippingOptions.length === 0}
                    onChange={(event) => setSelectedService(event.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    {shippingOptions.length === 0 ? <option value="">Pilih layanan</option> : null}
                    {shippingOptions.map((option) => (
                      <option key={option.service} value={option.service}>
                        {option.service} - {formatCurrencyIDR(option.cost)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                {shippingLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Truck className="h-3.5 w-3.5" />}
                <span>Estimasi tiba: {selectedShipping?.etd ? `${selectedShipping.etd} hari` : "-"}</span>
                <span className="text-slate-400">•</span>
                <span>Berat total: {totalWeight} gram</span>
              </div>
            </section>
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 lg:sticky lg:top-24 lg:col-span-4">
            <h2 className="text-3xl font-bold text-slate-900">Ringkasan Pesanan</h2>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-800">Subtotal</p>
                {pricingReady ? (
                  <p className="font-semibold text-slate-900">{formatCurrencyIDR(subtotal)}</p>
                ) : (
                  <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-800">Ongkos Kirim</p>
                <p className="font-semibold text-slate-900">{formatCurrencyIDR(shippingCost)}</p>
              </div>
              <div className="border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between">
                  <p className="text-base font-semibold text-slate-900">Total</p>
                  {pricingReady ? (
                    <p className="text-xl font-bold text-blue-600">{formatCurrencyIDR(totalAmount)}</p>
                  ) : (
                    <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50/70 p-3">
              <p className="text-sm font-semibold text-blue-900">Metode Pembayaran</p>
              <p className="mt-1 text-xs text-blue-700">Bayar Sekarang via Midtrans Snap.</p>
              <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-blue-700">
                <MapPin className="h-3.5 w-3.5" />
                Tokenisasi Midtrans aktif
              </div>
            </div>

            <Button
              type="button"
              loading={submitLoading}
              disabled={
                submitLoading ||
                shippingLoading ||
                cartLoading ||
                addressLoading ||
                !pricingReady ||
                checkoutItems.length === 0 ||
                !selectedAddress?.id ||
                !selectedShipping
              }
              onClick={() => {
                void handleCheckout();
              }}
              className="mt-5 h-11 w-full rounded-xl bg-blue-600 hover:bg-blue-700"
            >
              Buat Pesanan
            </Button>

            <p className="mt-3 text-xs text-slate-500">
              Ringkasan ini selalu sinkron dengan API Master Produk (harga, stok, dan berat).
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
