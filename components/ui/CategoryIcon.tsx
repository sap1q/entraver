"use client";

import { Folder } from "lucide-react";

type CategoryIconProps = {
  icon?: string | null;
  className?: string;
};

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
const API_BASE_URL = RAW_API_URL.replace(/\/api\/?$/i, "");

const resolveIconUrl = (icon: string): string => {
  if (/^https?:\/\//i.test(icon) || icon.startsWith("data:") || icon.startsWith("blob:")) return icon;
  if (icon.startsWith("/")) return `${API_BASE_URL}${icon}`;
  return `${API_BASE_URL}/${icon}`;
};

export default function CategoryIcon({ icon, className = "h-5 w-5" }: CategoryIconProps) {
  if (!icon || !icon.trim()) return <Folder className={`${className} text-slate-400`} />;

  const trimmed = icon.trim();

  if (trimmed.startsWith("<svg") || (trimmed.startsWith("<?xml") && trimmed.includes("<svg"))) {
    return <span className={className} dangerouslySetInnerHTML={{ __html: trimmed }} />;
  }

  const url = resolveIconUrl(trimmed);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="Category icon" className={`${className} object-contain`} />
  );
}

