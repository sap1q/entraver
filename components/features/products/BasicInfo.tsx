"use client";

import type { ProductBasicInfo } from "@/types/product";

type BasicInfoProps = {
  basic: ProductBasicInfo;
  handleUpdateBasicInfo: <K extends keyof ProductBasicInfo>(field: K, value: ProductBasicInfo[K]) => void;
};

const baseInputClass =
  "h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white";
const baseLabelClass = "mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-500";

export default function BasicInfo({ basic, handleUpdateBasicInfo }: BasicInfoProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-800">Informasi Dasar</h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div>
          <label className={baseLabelClass}>Nama Produk</label>
          <input
            value={basic.name}
            onChange={(event) => handleUpdateBasicInfo("name", event.target.value)}
            className={baseInputClass}
            placeholder="Masukkan nama produk"
          />
        </div>
        <div>
          <label className={baseLabelClass}>Slug</label>
          <input value={basic.slug} readOnly className={`${baseInputClass} cursor-not-allowed opacity-80`} />
        </div>
        <div>
          <label className={baseLabelClass}>Kategori</label>
          <input
            value={basic.category}
            onChange={(event) => handleUpdateBasicInfo("category", event.target.value)}
            className={baseInputClass}
            placeholder="Virtual Reality"
          />
        </div>
        <div>
          <label className={baseLabelClass}>Brand</label>
          <input
            value={basic.brand}
            onChange={(event) => handleUpdateBasicInfo("brand", event.target.value)}
            className={baseInputClass}
            placeholder="Masukkan brand"
          />
        </div>
        <div>
          <label className={baseLabelClass}>SPU (SKU Induk)</label>
          <input
            value={basic.spu}
            onChange={(event) => handleUpdateBasicInfo("spu", event.target.value)}
            className={baseInputClass}
            placeholder="Masukkan SPU produk"
          />
        </div>
        <div>
          <label className={baseLabelClass}>Status Produk</label>
          <select
            value={basic.status}
            onChange={(event) => handleUpdateBasicInfo("status", event.target.value as ProductBasicInfo["status"])}
            className={baseInputClass}
          >
            <option value="active">Aktif</option>
            <option value="pending_approval">Menunggu Persetujuan</option>
            <option value="inactive">Non Aktif</option>
          </select>
        </div>
        <div>
          <label className={baseLabelClass}>Barcode</label>
          <input
            value={basic.barcode}
            onChange={(event) => handleUpdateBasicInfo("barcode", event.target.value)}
            className={baseInputClass}
            placeholder="Masukkan barcode produk"
          />
        </div>
      </div>
    </section>
  );
}
