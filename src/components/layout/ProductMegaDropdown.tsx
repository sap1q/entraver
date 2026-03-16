"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Flame, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { productsApi } from "@/lib/api/products";
import type { Category, Product } from "@/types/product.types";

type ProductBadge = "BARU" | "HOT";

type HighlightProduct = {
  product: Product;
  badge: ProductBadge;
};

type ProductMegaDropdownProps = {
  open: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClose: () => void;
};

const dropdownMotion = {
  initial: { opacity: 0, y: -20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -14,
    transition: { duration: 0.16, ease: "easeInOut" },
  },
} as const;

const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
} as const;

const productPanelMotion = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.26,
      ease: "easeOut",
      when: "beforeChildren",
      staggerChildren: 0.045,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.22, ease: "easeInOut" },
  },
} as const;

const productCardMotion = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: springTransition,
  },
} as const;

const SERVICE_LINKS = [
  { label: "Trade-In", href: "/trade-in" },
  { label: "Garansi", href: "/garansi" },
] as const;

const makeHighlights = (newest: Product[], hottest: Product[]): HighlightProduct[] => {
  const fresh = newest.slice(0, 4).map((product) => ({ product, badge: "BARU" as const }));
  const taken = new Set(fresh.map((item) => item.product.id));
  const hot = hottest
    .filter((product) => !taken.has(product.id))
    .slice(0, 4)
    .map((product) => ({ product, badge: "HOT" as const }));

  return [...fresh, ...hot];
};

export function ProductMegaDropdown({
  open,
  onMouseEnter,
  onMouseLeave,
  onClose,
}: ProductMegaDropdownProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [highlights, setHighlights] = useState<HighlightProduct[]>([]);
  const [activeCategorySlug, setActiveCategorySlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchMegaMenuData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Avoid parallel requests here because the local Laravel dev server can serialize them.
        const categoryResponse = await productsApi.getCategories();
        if (!mounted) return;

        const newestResponse = await productsApi.getProducts({ per_page: 8, sort_by: "newest" });
        if (!mounted) return;

        const hottestResponse = await productsApi.getProducts({ per_page: 8, sort_by: "popular" });

        if (!mounted) return;

        const fetchedCategories = categoryResponse.data;
        const highlightedProducts = makeHighlights(newestResponse.data, hottestResponse.data);
        const fallbackCategories = highlightedProducts
          .map((item) => item.product.category)
          .filter(
            (category, index, all) =>
              all.findIndex((candidate) => candidate.slug === category.slug) === index
          )
          .map((category) => ({
            id: category.id,
            slug: category.slug,
            name: category.name,
            product_count: 0,
          }));
        const categoriesForMenu =
          fetchedCategories.length > 0 ? fetchedCategories : fallbackCategories;

        setCategories(categoriesForMenu);
        setHighlights(highlightedProducts);

        setActiveCategorySlug((prev) => {
          if (prev && categoriesForMenu.some((category) => category.slug === prev)) return prev;
          return categoriesForMenu[0]?.slug ?? highlightedProducts[0]?.product.category.slug ?? null;
        });
      } catch (fetchError) {
        if (!mounted) return;
        setError("Gagal memuat menu produk.");
        setCategories([]);
        setHighlights([]);
        console.error(fetchError);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void fetchMegaMenuData();
    return () => {
      mounted = false;
    };
  }, []);

  const visibleCategories = useMemo(() => categories.slice(0, 8), [categories]);

  const filteredHighlights = useMemo(() => {
    if (!activeCategorySlug) return highlights.slice(0, 6);

    const filtered = highlights.filter(
      (item) =>
        item.product.category.slug === activeCategorySlug ||
        item.product.category.id === activeCategorySlug
    );

    return (filtered.length > 0 ? filtered : highlights).slice(0, 6);
  }, [activeCategorySlug, highlights]);

  const handleCategoryActivate = useCallback((slug: string) => {
    setActiveCategorySlug((previous) => (previous === slug ? previous : slug));
  }, []);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial="initial"
          animate="animate"
          exit="exit"
          variants={dropdownMotion}
          className="absolute inset-x-0 top-full z-[70] hidden border-b border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.12)] lg:block"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
            <div className="grid gap-6 py-6 lg:grid-cols-[250px_1fr]">
              <aside className="border-r border-slate-200 pr-5">
                <div className="mb-5 border-b border-slate-200 pb-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Layanan &amp; Jasa
                  </p>

                  <ul className="space-y-1">
                    {SERVICE_LINKS.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className="group relative flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100 hover:text-slate-900"
                        >
                          <span>{item.label}</span>
                          <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Kategori
                </p>

                <ul className="space-y-1">
                  {visibleCategories.map((category) => {
                    const active = category.slug === activeCategorySlug;
                    return (
                      <li key={category.id} className="relative">
                        {active ? (
                          <motion.span
                            layoutId="mega-active-category"
                            transition={springTransition}
                            className="absolute inset-0 rounded-lg bg-slate-900"
                          />
                        ) : null}
                        <Link
                          href={`/products/${category.slug}`}
                          onMouseEnter={() => handleCategoryActivate(category.slug)}
                          onFocus={() => handleCategoryActivate(category.slug)}
                          onClick={onClose}
                          className={`group relative z-10 flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                            active
                              ? "text-white"
                              : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                          }`}
                        >
                          <span>{category.name}</span>
                          <ArrowRight
                            className={`h-4 w-4 transition-transform ${
                              active ? "translate-x-0.5 text-white" : "text-slate-400 group-hover:translate-x-0.5"
                            }`}
                          />
                        </Link>
                      </li>
                    );
                  })}
                </ul>

                <Link
                  href="/products"
                  onClick={onClose}
                  className="mt-5 inline-flex items-center gap-2 border-b border-slate-900 pb-1 text-sm font-semibold text-slate-900 transition-colors hover:text-blue-600 hover:border-blue-600"
                >
                  Lihat Semua Produk
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </aside>

              <section>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Pilihan Produk
                  </p>
                  {activeCategorySlug ? (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                      {categories.find((category) => category.slug === activeCategorySlug)?.name ?? "Semua"}
                    </span>
                  ) : null}
                </div>

                {loading ? (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3">
                        <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
                        <div className="mt-3 h-4 w-4/5 animate-pulse rounded bg-slate-100" />
                        <div className="mt-2 h-3 w-2/5 animate-pulse rounded bg-slate-100" />
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                ) : filteredHighlights.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Produk unggulan belum tersedia.
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div
                      key={activeCategorySlug ?? "all-categories"}
                      variants={productPanelMotion}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                    >
                      {filteredHighlights.map((item) => (
                        <motion.div
                          key={`${item.product.id}-${item.badge}`}
                          variants={productCardMotion}
                          initial="initial"
                          animate="animate"
                        >
                          <Link
                            href={`/products/${item.product.slug}`}
                            onClick={onClose}
                            className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                          >
                            <div className="relative h-32 overflow-hidden rounded-xl bg-slate-100">
                              <Image
                                src={item.product.image}
                                alt={item.product.name}
                                fill
                                unoptimized
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                sizes="(max-width: 1280px) 40vw, 300px"
                              />
                              <span
                                className={`absolute left-2 top-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold text-white ${
                                  item.badge === "HOT" ? "bg-rose-500" : "bg-slate-900"
                                }`}
                              >
                                {item.badge === "HOT" ? (
                                  <Flame className="h-3 w-3" />
                                ) : (
                                  <Sparkles className="h-3 w-3" />
                                )}
                                {item.badge}
                              </span>
                            </div>
                            <p className="mt-3 line-clamp-2 text-sm font-semibold text-slate-900">{item.product.name}</p>
                            <p className="mt-1 text-xs text-slate-500">{item.product.category.name}</p>
                          </Link>
                        </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                )}
              </section>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
