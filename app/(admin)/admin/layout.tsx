"use client";

import Cookies from "js-cookie";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Bell,
  Box,
  ChevronRight,
  ClipboardList,
  FileText,
  FolderKanban,
  Home,
  Megaphone,
  Menu,
  LogOut,
  Search,
  Shield,
  ShoppingCart,
  Tag,
  Truck,
  User,
} from "lucide-react";
import axios from "@/src/lib/axios";

type AdminLayoutProps = {
  children: React.ReactNode;
};

type MenuItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const ecommerceItems: MenuItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: Home },
  { label: "Kategori", href: "/admin/categories", icon: Tag },
  { label: "Iklan", href: "/admin/ads", icon: Megaphone },
  { label: "Pembelian", href: "/admin/purchases", icon: ClipboardList },
  { label: "Pengadaan", href: "/admin/procurement", icon: FolderKanban },
  { label: "Laporan", href: "/admin/reports", icon: FileText },
  { label: "Garansi Produk", href: "/admin/warranty", icon: Shield },
];

const vendorItems: MenuItem[] = [
  { label: "Vendor Pengiriman", href: "/admin/vendor-shipping", icon: Truck },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(
    pathname.startsWith("/admin/products") ||
      pathname.startsWith("/admin/master-produk") ||
      pathname.startsWith("/admin/marketplace-produk")
  );
  const [salesOpen, setSalesOpen] = useState(
    pathname.startsWith("/admin/sales") ||
      pathname.startsWith("/admin/pemesanan") ||
      pathname.startsWith("/admin/penawaran") ||
      pathname.startsWith("/admin/penagihan")
  );
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isProductGroupActive = useMemo(
    () =>
      pathname.startsWith("/admin/products") ||
      pathname.startsWith("/admin/master-produk") ||
      pathname.startsWith("/admin/marketplace-produk"),
    [pathname]
  );

  const isSalesGroupActive = useMemo(
    () =>
      pathname.startsWith("/admin/sales") ||
      pathname.startsWith("/admin/pemesanan") ||
      pathname.startsWith("/admin/penawaran") ||
      pathname.startsWith("/admin/penagihan"),
    [pathname]
  );

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      await axios.post(
        "http://localhost:8000/api/v1/admin/logout",
        {},
        { withCredentials: true }
      );
    } catch {
      // Continue logout flow on frontend.
    } finally {
      Cookies.remove("admin_token");
      router.push("/auth/login");
      setIsLoggingOut(false);
    }
  };

  const menuItemClass = (active: boolean): string =>
    `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
      active
        ? "bg-[#EFF6FF] text-[#2563EB]"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
    }`;

  const closeMobileSidebar = () => setMobileOpen(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <button
        type="button"
        className="fixed left-4 top-4 z-50 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-100 bg-white text-slate-700 shadow-sm md:hidden"
        onClick={() => setMobileOpen((prev) => !prev)}
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={closeMobileSidebar}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-gray-100 bg-white shadow-sm transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#2563EB]">
              <Box className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-800">Entraverse</p>
              <p className="text-xs text-slate-500">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          <section>
            <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              E-COMMERCE
            </p>

            <div className="space-y-1">
              {/* Produk Dropdown */}
              <button
                type="button"
                onClick={() => setProductOpen((prev) => !prev)}
                className={menuItemClass(isProductGroupActive)}
              >
                {isProductGroupActive ? (
                  <span className="absolute left-0 top-[calc(50%-12px)] h-6 w-1 rounded-r bg-[#2563EB]" />
                ) : null}
                <Box className="h-4 w-4" />
                <span className="flex-1 text-left">Produk</span>
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${productOpen ? "rotate-90" : ""}`}
                />
              </button>

              {productOpen ? (
                <div className="ml-5 space-y-1 border-l border-gray-200 pl-4">
                  <Link
                    href="/admin/master-produk"
                    onClick={closeMobileSidebar}
                    className={menuItemClass(pathname.startsWith("/admin/master-produk"))}
                  >
                    {pathname.startsWith("/admin/master-produk") ? (
                      <span className="absolute left-0 top-[calc(50%-12px)] h-6 w-1 rounded-r bg-[#2563EB]" />
                    ) : null}
                    <Box className="h-4 w-4" />
                    <span>Master Produk</span>
                  </Link>
                  <Link
                    href="/admin/marketplace-produk"
                    onClick={closeMobileSidebar}
                    className={menuItemClass(pathname.startsWith("/admin/marketplace-produk"))}
                  >
                    {pathname.startsWith("/admin/marketplace-produk") ? (
                      <span className="absolute left-0 top-[calc(50%-12px)] h-6 w-1 rounded-r bg-[#2563EB]" />
                    ) : null}
                    <ShoppingCart className="h-4 w-4" />
                    <span>Marketplace Produk</span>
                  </Link>
                </div>
              ) : null}

              {/* Penjualan Dropdown */}
              <button
                type="button"
                onClick={() => setSalesOpen((prev) => !prev)}
                className={menuItemClass(isSalesGroupActive)}
              >
                {isSalesGroupActive ? (
                  <span className="absolute left-0 top-[calc(50%-12px)] h-6 w-1 rounded-r bg-[#2563EB]" />
                ) : null}
                <ShoppingCart className="h-4 w-4" />
                <span className="flex-1 text-left">Penjualan</span>
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${salesOpen ? "rotate-90" : ""}`}
                />
              </button>

              {salesOpen ? (
                <div className="ml-5 space-y-1 border-l border-gray-200 pl-4">
                  <Link
                    href="/admin/pemesanan"
                    onClick={closeMobileSidebar}
                    className={menuItemClass(pathname.startsWith("/admin/pemesanan"))}
                  >
                    {pathname.startsWith("/admin/pemesanan") ? (
                      <span className="absolute left-0 top-[calc(50%-12px)] h-6 w-1 rounded-r bg-[#2563EB]" />
                    ) : null}
                    <ClipboardList className="h-4 w-4" />
                    <span>Pemesanan</span>
                  </Link>
                  <Link
                    href="/admin/penawaran"
                    onClick={closeMobileSidebar}
                    className={menuItemClass(pathname.startsWith("/admin/penawaran"))}
                  >
                    {pathname.startsWith("/admin/penawaran") ? (
                      <span className="absolute left-0 top-[calc(50%-12px)] h-6 w-1 rounded-r bg-[#2563EB]" />
                    ) : null}
                    <FileText className="h-4 w-4" />
                    <span>Penawaran</span>
                  </Link>
                  <Link
                    href="/admin/penagihan"
                    onClick={closeMobileSidebar}
                    className={menuItemClass(pathname.startsWith("/admin/penagihan"))}
                  >
                    {pathname.startsWith("/admin/penagihan") ? (
                      <span className="absolute left-0 top-[calc(50%-12px)] h-6 w-1 rounded-r bg-[#2563EB]" />
                    ) : null}
                    <FileText className="h-4 w-4" />
                    <span>Penagihan</span>
                  </Link>
                </div>
              ) : null}

              {/* Other E-commerce menu items */}
              {ecommerceItems.map((item) => {
                const active = pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileSidebar}
                    className={menuItemClass(active)}
                  >
                    {active ? (
                      <span className="absolute left-0 top-[calc(50%-12px)] h-6 w-1 rounded-r bg-[#2563EB]" />
                    ) : null}
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </section>

          <section>
            <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              VENDOR
            </p>
            <div className="space-y-1">
              {vendorItems.map((item) => {
                const active = pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileSidebar}
                    className={menuItemClass(active)}
                  >
                    {active ? (
                      <span className="absolute left-0 top-[calc(50%-12px)] h-6 w-1 rounded-r bg-[#2563EB]" />
                    ) : null}
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        </nav>

        <div className="border-t border-gray-100 p-3">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" />
            <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
          </button>
        </div>
      </aside>

      <div className="md:pl-72">
        <header className="sticky top-0 z-20 border-b border-gray-100 bg-white">
          <div className="flex h-16 items-center justify-between gap-4 px-4 pl-16 md:px-8 md:pl-8">
            <h1 className="text-lg font-semibold text-slate-800">Dashboard</h1>
            <div className="hidden w-full max-w-md items-center gap-2 rounded-lg border border-gray-100 bg-slate-50 px-3 py-2 text-slate-500 md:flex">
              <Search className="h-4 w-4" />
              <input
                type="text"
                placeholder="Search here..."
                className="w-full bg-transparent text-sm text-slate-600 outline-none placeholder:text-slate-400"
              />
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <button
                type="button"
                className="hidden items-center gap-1 rounded-lg border border-gray-100 px-2.5 py-1.5 text-xs font-medium text-slate-500 md:flex"
              >
                Eng (US)
                <ChevronRight className="h-3.5 w-3.5 rotate-90" />
              </button>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-100 text-slate-500"
              >
                <Bell className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white px-2 py-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <User className="h-4 w-4" />
                </div>
                <div className="hidden text-left md:block">
                  <p className="text-xs font-medium text-slate-800">Admin</p>
                  <p className="text-[11px] text-slate-500">Entraverse</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-64px)] overflow-y-auto bg-[#F8FAFC] px-4 py-6 md:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}