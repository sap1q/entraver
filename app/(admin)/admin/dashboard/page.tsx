import {
  Box,
  ShoppingCart,
  Tag,
  Truck,
  TrendingUp,
  Users,
} from "lucide-react";

const summaryCards = [
  {
    label: "Total Produk",
    value: "1,248",
    trend: "+12.5%",
    icon: Box,
    tint: "bg-blue-100 text-blue-600",
  },
  {
    label: "Kategori Aktif",
    value: "84",
    trend: "+4.1%",
    icon: Tag,
    tint: "bg-emerald-100 text-emerald-600",
  },
  {
    label: "Penjualan Hari Ini",
    value: "327",
    trend: "+8.9%",
    icon: ShoppingCart,
    tint: "bg-orange-100 text-orange-600",
  },
  {
    label: "Vendor Pengiriman",
    value: "18",
    trend: "+2.0%",
    icon: Truck,
    tint: "bg-violet-100 text-violet-600",
  },
];

const weeklyRevenue = [32, 42, 36, 48, 40, 51, 56];
const targetSeries = [64, 58, 72, 60, 75, 67, 79];
const actualSeries = [58, 54, 63, 57, 71, 61, 73];

export default function AdminDashboardPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-800 md:text-2xl">
              Ringkasan Performa
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Snapshot data operasional Entraverse minggu ini.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm font-medium text-slate-600"
          >
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            Trend Positif
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.label}
              className="rounded-xl border border-gray-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-800">{card.value}</p>
                </div>
                <div className={`rounded-lg p-2 ${card.tint}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-xs font-medium text-emerald-600">{card.trend} vs minggu lalu</p>
            </article>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <article className="rounded-xl border border-gray-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] xl:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-800">Revenue 7 Hari</h3>
            <span className="text-xs text-slate-500">Updated 5 menit lalu</span>
          </div>
          <div className="mt-6 flex h-56 items-end justify-between gap-2">
            {weeklyRevenue.map((height, index) => (
              <div key={index} className="flex w-full flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-blue-500 to-blue-300"
                  style={{ height: `${height * 3}px` }}
                />
                <span className="text-[11px] text-slate-400">D{index + 1}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-gray-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <h3 className="text-base font-semibold text-slate-800">Customer Insight</h3>
          <p className="mt-1 text-xs text-slate-500">Pengunjung dan pembeli aktif</p>
          <div className="mt-6 space-y-4">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Pelanggan Baru</p>
              <p className="mt-1 flex items-center gap-2 text-lg font-semibold text-slate-800">
                284
                <Users className="h-4 w-4 text-blue-500" />
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Retensi 30 Hari</p>
              <p className="mt-1 text-lg font-semibold text-slate-800">72.3%</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Rasio Repeat Order</p>
              <p className="mt-1 text-lg font-semibold text-slate-800">41.8%</p>
            </div>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <article className="rounded-xl border border-gray-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] xl:col-span-2">
          <h3 className="text-base font-semibold text-slate-800">Target vs Realisasi</h3>
          <p className="mt-1 text-xs text-slate-500">Perbandingan performa harian</p>
          <div className="mt-6 grid grid-cols-7 gap-2">
            {targetSeries.map((target, idx) => (
              <div key={idx} className="space-y-2 text-center">
                <div className="mx-auto flex h-40 w-9 items-end gap-1">
                  <div
                    className="w-4 rounded-t bg-slate-200"
                    style={{ height: `${target}px` }}
                  />
                  <div
                    className="w-4 rounded-t bg-blue-500"
                    style={{ height: `${actualSeries[idx]}px` }}
                  />
                </div>
                <span className="text-[11px] text-slate-400">H{idx + 1}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-gray-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <h3 className="text-base font-semibold text-slate-800">Top Produk</h3>
          <div className="mt-4 space-y-3">
            {[
              { name: "Printer POS Mini", sold: "214 unit", progress: "82%" },
              { name: "Scanner Barcode X2", sold: "189 unit", progress: "74%" },
              { name: "Mesin Kasir Touch", sold: "171 unit", progress: "68%" },
              { name: "Laci Kasir Pro", sold: "162 unit", progress: "61%" },
            ].map((item) => (
              <div key={item.name} className="rounded-lg bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.sold}</p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: item.progress }} />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
