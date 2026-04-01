"use client";

import { BatteryCharging, Camera } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Banner } from "@/lib/api/types/banner.types";

type BannerCardProps = {
  banner: Banner;
  isFirst?: boolean;
};

const replaceExtension = (url: string, extension: "webp" | "jpg"): string => {
  const matched = url.match(/^(.*?)(\.[a-zA-Z0-9]+)(\?.*)?$/);
  if (!matched) return url;

  const base = matched[1] ?? url;
  const query = matched[3] ?? "";
  return `${base}.${extension}${query}`;
};

const getExtension = (url: string): string | null => {
  const matched = url.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
  if (!matched || !matched[1]) return null;
  return matched[1].toLowerCase();
};

export function BannerCard({ banner, isFirst = false }: BannerCardProps) {
  const sources = useMemo(() => {
    const extension = getExtension(banner.image_url);

    if (extension === "webp") {
      return {
        webp: banner.image_url,
        jpg: replaceExtension(banner.image_url, "jpg"),
        original: banner.image_url,
      };
    }

    if (extension === "jpg" || extension === "jpeg") {
      return {
        webp: replaceExtension(banner.image_url, "webp"),
        jpg: replaceExtension(banner.image_url, "jpg"),
        original: banner.image_url,
      };
    }

    return {
      webp: null,
      jpg: banner.image_url,
      original: banner.image_url,
    };
  }, [banner.image_url]);

  const [useWebpSource, setUseWebpSource] = useState(Boolean(sources.webp));
  const [imgSrc, setImgSrc] = useState(sources.jpg);
  const alt = banner.alt_text || banner.title || "Banner Entraverse";
  const isRayBanMetaSlide = useMemo(() => {
    const combined = `${banner.title ?? ""} ${banner.alt_text ?? ""}`.toLowerCase();
    return combined.includes("ray-ban") || combined.includes("rayban");
  }, [banner.alt_text, banner.title]);

  const productModels: ReadonlyArray<{ name: string; shiftPercent: number; focal?: boolean }> = [
    { name: "Wayfarer", shiftPercent: 0 },
    { name: "Skyler", shiftPercent: 100, focal: true },
    { name: "Headliner", shiftPercent: 200 },
  ];

  const fallbackSource = () => {
    if (useWebpSource) {
      setUseWebpSource(false);
      setImgSrc(sources.jpg);
      return;
    }

    if (imgSrc !== sources.original) {
      setImgSrc(sources.original);
    }
  };

  const premiumContent = (
    <section className="relative isolate aspect-[2/1] w-full overflow-hidden bg-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,rgba(147,197,253,0.42),rgba(226,232,240,0.9)_52%,rgba(241,245,249,0.98)_82%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/70 to-transparent" />

      <div className="relative mx-auto flex h-full w-full max-w-6xl flex-col px-4 pb-6 pt-6 sm:px-6 sm:pb-8 sm:pt-8">
        <header className="mb-5 text-center sm:mb-7">
          <p className="font-[family-name:Inter,Montserrat,ui-sans-serif] text-[13px] font-semibold uppercase tracking-[0.24em] text-slate-600">
            Ray-Ban | Meta
          </p>
          <p className="mt-1 font-[family-name:Inter,Montserrat,ui-sans-serif] text-xl font-semibold tracking-wide text-slate-900 sm:text-2xl">
            Gen 2
          </p>
        </header>

        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {productModels.map((model) => (
            <article
              key={model.name}
              className={`group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/85 px-3 pb-3 pt-2 shadow-[0_12px_30px_rgba(15,23,42,0.12)] backdrop-blur-[1px] transition duration-300 hover:border-blue-200 hover:bg-white ${
                model.focal ? "sm:scale-[1.06]" : ""
              }`}
            >
              <div className="pointer-events-none absolute inset-x-8 bottom-4 h-5 rounded-[999px] bg-slate-900/20 blur-xl" />

              <div className="relative h-28 overflow-hidden sm:h-36">
                <div
                  className={`absolute inset-y-0 w-[300%] transition-transform duration-500 ease-out group-hover:scale-105 ${
                    model.focal ? "scale-[1.08]" : "scale-100"
                  }`}
                  style={{ left: `-${model.shiftPercent}%` }}
                >
                  <picture>
                    {useWebpSource && sources.webp ? <source srcSet={sources.webp} type="image/webp" /> : null}
                    <img
                      src={imgSrc}
                      alt={alt}
                      loading={isFirst ? "eager" : "lazy"}
                      fetchPriority={isFirst ? "high" : "auto"}
                      decoding="async"
                      className="h-full w-full max-w-none object-cover object-center"
                      onError={fallbackSource}
                    />
                  </picture>
                </div>
              </div>

              <h3 className="mt-2 text-center font-[family-name:Inter,Montserrat,ui-sans-serif] text-xl font-semibold tracking-[0.015em] text-slate-900 transition duration-300 group-hover:text-blue-700">
                {model.name}
              </h3>
            </article>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white/85 px-3 py-2.5 text-slate-700">
            <BatteryCharging className="mt-0.5 h-4 w-4 shrink-0 text-slate-700" strokeWidth={1.8} />
            <p className="text-[11px] leading-relaxed text-slate-600">
              Baterai lebih tahan lama, performa charging lebih efisien.
            </p>
          </div>
          <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white/85 px-3 py-2.5 text-slate-700">
            <Camera className="mt-0.5 h-4 w-4 shrink-0 text-slate-700" strokeWidth={1.8} />
            <p className="text-[11px] leading-relaxed text-slate-600">
              Kamera generasi baru untuk hasil lebih detail dan jernih.
            </p>
          </div>
        </div>
      </div>
    </section>
  );

  const content = (
    <>
      {isRayBanMetaSlide ? (
        premiumContent
      ) : (
        <div className="relative aspect-[2/1] w-full overflow-hidden bg-slate-100">
          <picture>
            {useWebpSource && sources.webp ? <source srcSet={sources.webp} type="image/webp" /> : null}
            <img
              src={imgSrc}
              alt={alt}
              loading={isFirst ? "eager" : "lazy"}
              fetchPriority={isFirst ? "high" : "auto"}
              decoding="async"
              className="h-full w-full scale-[1.02] transform-gpu object-cover object-center md:scale-[1.04]"
              onError={fallbackSource}
            />
          </picture>
        </div>
      )}
    </>
  );

  if (!banner.link_url) {
    return content;
  }

  return (
    <Link href={banner.link_url} className="block">
      {content}
    </Link>
  );
}
