"use client";

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

  const content = (
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
