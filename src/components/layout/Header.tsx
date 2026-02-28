import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center gap-4 px-4 md:px-6">
        <div className="flex min-w-fit items-center gap-3">
          <Image
            src="/assets/images/hero/e-hero.png"
            alt="Entraverse"
            width={114}
            height={36}
            className="h-9 w-auto"
          />
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
          >
            {/* Hamburger Logo Color */}
            <div className="flex flex-col gap-1" aria-hidden>
              <span className="h-1 w-5 rounded-full bg-[#1FA3C8]" />
              <span className="h-1 w-5 rounded-full bg-[#FF7A00]" />
              <span className="h-1 w-5 rounded-full bg-[#C83CA6]" />
            </div>

            Menu
            <span className="text-slate-400">v</span>
          </button>
        </div>

        <div className="hidden flex-1 items-center gap-3 lg:flex">
          <button
            type="button"
            className="min-w-42.5 rounded-xl bg-blue-600 px-3 py-2 text-left text-xs font-semibold text-white"
          >
            <span className="block opacity-90">Alamat Pengirim:</span>
            <span className="block truncate">Jakarta Selatan, DKI ...</span>
          </button>

          <div className="flex h-11 flex-1 items-center rounded-xl border border-slate-300 bg-white px-4">
            <Image src="/assets/images/icons/search.png" alt="" width={16} height={16} />
            <input
              aria-label="Cari"
              className="w-full px-3 text-sm text-slate-700 outline-none"
              defaultValue=""
              placeholder="Cari semua yang ada di Entraverse online"
            />
            <button type="button" className="rounded-md p-1 text-slate-500">
              <Image src="/assets/images/icons/camera.svg" alt="" width={18} height={18} />
            </button>
          </div>
        </div>

        <div className="ml-auto flex min-w-fit items-center gap-4">
          <Link href="#" className="hidden text-sm font-semibold text-slate-700 md:block">
            Gabung Jadi Supplier
          </Link>

          <button type="button" className="relative rounded-full p-1.5">
            <Image src="/assets/images/icons/cart.svg" alt="Keranjang" width={22} height={22} />
            <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white">
              0
            </span>
          </button>

          <button
            type="button"
            className="flex max-w-36.25 items-center gap-2 border-l border-slate-200 pl-3"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
              SA
            </span>
            <span className="truncate text-sm font-medium text-slate-800">Shafiq ...</span>
          </button>
        </div>
      </div>
    </header>
  );
}
