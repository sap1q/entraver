"use client";

import { Plus, Trash2 } from "lucide-react";
import type { CategoryFees, FeeComponent, ValueType } from "@/types/category.types";

type FeeComponentsProps = {
  fees: CategoryFees;
  onChange: (next: CategoryFees) => void;
};

const channels = [
  { key: "marketplace", label: "Marketplace (Tokopedia/TikTok)" },
  { key: "shopee", label: "Shopee" },
  { key: "entraverse", label: "Entraverse" },
] as const;

const createComponent = (): FeeComponent => ({
  id: crypto.randomUUID(),
  label: "",
  value: "",
  valueType: "percent",
  min: 0,
  max: 0,
});

export default function FeeComponents({ fees, onChange }: FeeComponentsProps) {
  const updateFee = (channel: keyof CategoryFees, updater: (items: FeeComponent[]) => FeeComponent[]) => {
    const current = fees[channel]?.components ?? [];
    onChange({
      ...fees,
      [channel]: {
        components: updater(current),
      },
    });
  };

  const updateField = (
    channel: keyof CategoryFees,
    index: number,
    key: keyof FeeComponent,
    value: string | number | ValueType
  ) => {
    updateFee(channel, (items) => {
      const base = items.length > 0 ? items : [createComponent()];
      return base.map((item, idx) => (idx === index ? { ...item, [key]: value } : item));
    });
  };

  return (
    <div className="space-y-4">
      {channels.map((channel) => {
        const list = fees[channel.key].components;

        return (
          <section key={channel.key} className="rounded-2xl border border-slate-200 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">{channel.label}</h3>
              <button
                type="button"
                onClick={() => updateFee(channel.key, (items) => [...items, createComponent()])}
                className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
              >
                <Plus className="h-3.5 w-3.5" />
                Komponen
              </button>
            </div>

            <div className="space-y-2">
              {(list.length ? list : [createComponent()]).map((item, index) => (
                <div key={item.id ?? `${channel.key}-${index}`} className="grid gap-2 rounded-xl bg-slate-50 p-3 md:grid-cols-12">
                  <input
                    value={item.label}
                    onChange={(event) => updateField(channel.key, index, "label", event.target.value)}
                    className="md:col-span-4 h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                    placeholder="Nama komponen"
                    title="Nama komponen biaya"
                  />
                  <select
                    value={item.valueType}
                    onChange={(event) =>
                      updateField(channel.key, index, "valueType", event.target.value as ValueType)
                    }
                    className="md:col-span-2 h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                    title="Pilih jenis nilai"
                  >
                    <option value="percent">%</option>
                    <option value="amount">Rp</option>
                  </select>
                  <input
                    value={String(item.value)}
                    onChange={(event) => updateField(channel.key, index, "value", event.target.value)}
                    className="md:col-span-2 h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                    placeholder="Nilai"
                    title="Nilai biaya (persen atau rupiah)"
                  />
                  <input
                    type="number"
                    min={0}
                    value={item.min ?? 0}
                    onChange={(event) => updateField(channel.key, index, "min", Number(event.target.value) || 0)}
                    className="md:col-span-1 h-10 rounded-lg border border-slate-200 bg-white px-2 text-sm"
                    placeholder="Min"
                    title="Batas minimum dalam Rupiah"
                  />
                  <input
                    type="number"
                    min={0}
                    value={item.max ?? 0}
                    onChange={(event) => updateField(channel.key, index, "max", Number(event.target.value) || 0)}
                    className="md:col-span-1 h-10 rounded-lg border border-slate-200 bg-white px-2 text-sm"
                    placeholder="Max"
                    title="Batas maksimum dalam Rupiah"
                  />
                  <button
                    type="button"
                    onClick={() => updateFee(channel.key, (items) => items.filter((_, idx) => idx !== index))}
                    className="md:col-span-2 h-10 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                    title="Hapus komponen biaya"
                  >
                    <span className="inline-flex items-center gap-1 text-xs font-semibold">
                      <Trash2 className="h-3.5 w-3.5" />
                      Hapus
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
