"use client";

import Link from "next/link";
import { Folder } from "lucide-react";
import { useMemo, useState } from "react";
import type { StorefrontCategory } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type CategoryCardProps = {
  category: StorefrontCategory;
  overlay?: string;
  className?: string;
};

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
const API_ORIGIN = RAW_API_URL.replace(/\/api(?:\/v\d+)?\/?$/i, "");
const ABSOLUTE_URL_REGEX = /^(https?:\/\/|data:|blob:)/i;

const isRawSvg = (value: string): boolean => {
  const trimmed = value.trim();
  return trimmed.startsWith("<svg") || (trimmed.startsWith("<?xml") && trimmed.includes("<svg"));
};

const toAbsolute = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (ABSOLUTE_URL_REGEX.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return `${API_ORIGIN}${trimmed}`;
  return `${API_ORIGIN}/${trimmed.replace(/^\/+/, "")}`;
};

const appendCandidate = (target: string[], value: string | null | undefined) => {
  if (!value) return;
  const trimmed = value.trim();
  if (!trimmed) return;
  if (target.includes(trimmed)) return;
  target.push(trimmed);
};

export default function CategoryCard({ category, overlay, className }: CategoryCardProps) {
  const href = `/products/${encodeURIComponent(category.slug)}`;
  const categorySignature = `${category.id}|${category.imageUrl ?? ""}|${category.imageSvg ?? ""}`;
  const imageCandidates = useMemo(() => {
    const candidates: string[] = [];

    appendCandidate(candidates, category.imageUrl);

    if (category.imageSvg && !isRawSvg(category.imageSvg)) {
      appendCandidate(candidates, category.imageSvg);
    }

    if (category.imageUrl) {
      const absolute = toAbsolute(category.imageUrl);
      appendCandidate(candidates, absolute);

      if (absolute.includes("/api/") && absolute.includes("/storage/")) {
        appendCandidate(candidates, absolute.replace("/api/", "/"));
      }

      const storagePathMatch = absolute.match(/(\/storage\/.+)$/);
      if (storagePathMatch?.[1]) {
        const storagePath = storagePathMatch[1];
        appendCandidate(candidates, `${API_ORIGIN}${storagePath}`);
        if (typeof window !== "undefined") {
          appendCandidate(candidates, `${window.location.origin}${storagePath}`);
        }
      }
    }

    return candidates;
  }, [category.imageSvg, category.imageUrl]);
  const [imageState, setImageState] = useState<{ signature: string; index: number }>({
    signature: categorySignature,
    index: 0,
  });
  const imageIndex = imageState.signature === categorySignature ? imageState.index : 0;
  const activeImage = imageCandidates[imageIndex] ?? null;

  return (
    <Link
      href={href}
      className={cn(
        "group relative block overflow-hidden rounded-2xl bg-slate-900",
        "shadow-sm transition-all duration-500 ease-out",
        "hover:-translate-y-0.5 hover:shadow-lg",
        className
      )}
    >
      <div className="absolute inset-0">
        {activeImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activeImage}
            alt={category.name}
            className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
            onError={() => {
              setImageState((current) => {
                const currentIndex = current.signature === categorySignature ? current.index : 0;
                const nextIndex = currentIndex + 1;
                if (nextIndex >= imageCandidates.length) {
                  return { signature: categorySignature, index: currentIndex };
                }

                return { signature: categorySignature, index: nextIndex };
              });
            }}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900" />
        )}
      </div>

      <div className="absolute inset-0 bg-slate-900/30 transition-all duration-500 ease-out group-hover:bg-slate-900/50" />

      {!activeImage ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <Folder className="h-12 w-12 text-white/70" />
        </div>
      ) : null}

      <div className="relative z-10 flex h-full flex-col p-4 text-white md:p-6">
        {overlay ? (
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/90 md:text-xs">{overlay}</p>
        ) : (
          <span />
        )}

        <div className="mt-auto max-w-[88%]">
          <div className="flex flex-col items-start">
            <h3 className="text-left text-xl font-extrabold leading-tight tracking-tight text-white/85 md:text-2xl lg:text-[2rem]">
              {category.name}
            </h3>
            <span className="mt-2 inline-flex translate-y-2 items-center text-xs font-semibold uppercase tracking-[0.18em] text-white/85 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100">
              Explore
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
