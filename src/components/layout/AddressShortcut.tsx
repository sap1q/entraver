"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { isAxiosError } from "@/lib/axios";
import { userAddressApi } from "@/lib/api/user-address";
import type { UserAddress } from "@/lib/api/types/user-address.types";

const panelMotion = {
  hidden: { opacity: 0, scale: 0, y: -10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 500, damping: 34, mass: 0.7 },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: -6,
    transition: { duration: 0.16, ease: "easeInOut" },
  },
} as const;

const getApiErrorMessage = (error: unknown): string => {
  if (!isAxiosError(error)) return "Gagal memuat alamat.";
  const status = error.response?.status;
  if (status === 401) return "Silakan login untuk memilih alamat pengiriman.";

  const message = error.response?.data?.message;
  return typeof message === "string" && message.trim().length > 0
    ? message
    : "Terjadi kesalahan saat mengambil alamat.";
};

export function AddressShortcut() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);

  const selectedAddress = useMemo(
    () => addresses.find((item) => item.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId]
  );

  const fetchAddresses = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const rows = await userAddressApi.getAll();
      setAddresses(rows);

      const mainAddress = rows.find((item) => item.is_main) ?? rows[0] ?? null;
      setSelectedAddressId(mainAddress?.id ?? null);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setLoading(false);
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    if (!open || isLoaded) return;
    void fetchAddresses();
  }, [isLoaded, open]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleSelectAddress = async (addressId: string) => {
    if (addressId === selectedAddressId || savingId) return;

    setSavingId(addressId);
    setErrorMessage(null);

    try {
      await userAddressApi.setMain(addressId);
      setSelectedAddressId(addressId);
      setAddresses((prev) =>
        prev.map((item) => ({
          ...item,
          is_main: item.id === addressId,
        }))
      );
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-full p-2 text-slate-700 transition-colors hover:text-blue-600"
        aria-label="Ubah alamat pengiriman"
        aria-expanded={open}
        aria-haspopup="dialog"
        title={selectedAddress ? `Alamat aktif: ${selectedAddress.label ?? selectedAddress.recipient_name}` : "Pilih alamat pengiriman"}
      >
        <MapPin className="h-5 w-5" strokeWidth={1.5} />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            variants={panelMotion}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-label="Pilih alamat pengiriman"
            className="absolute right-0 top-[calc(100%+10px)] z-[70] w-[calc(100vw-2rem)] max-w-[420px] origin-top-right rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.2)]"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Alamat Pengiriman</h3>
              <button
                type="button"
                onClick={() => {
                  setIsLoaded(false);
                  void fetchAddresses();
                }}
                className="text-xs font-medium text-blue-600 transition-colors hover:text-blue-700"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-20 animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            ) : null}

            {!loading && errorMessage ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {errorMessage}
              </div>
            ) : null}

            {!loading && !errorMessage && addresses.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
                Belum ada alamat tersimpan.
              </div>
            ) : null}

            {!loading && !errorMessage && addresses.length > 0 ? (
              <ul className="max-h-[320px] space-y-2 overflow-auto pr-1">
                {addresses.map((address) => {
                  const isSelected = selectedAddressId === address.id;
                  const isSaving = savingId === address.id;

                  return (
                    <li key={address.id}>
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => void handleSelectAddress(address.id)}
                        className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                          isSelected
                            ? "border-blue-500 bg-blue-50/70 ring-2 ring-blue-100"
                            : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
                        } ${isSaving ? "cursor-wait opacity-70" : ""}`}
                      >
                        <div className="mb-1.5 flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-slate-900">{address.recipient_name}</p>
                          {address.is_main ? (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                              Utama
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs leading-relaxed text-slate-600">
                          {address.full_address || address.address_line}
                        </p>
                        {address.label ? (
                          <p className="mt-1 text-[11px] font-medium text-slate-500">{address.label}</p>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
