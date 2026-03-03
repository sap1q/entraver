"use client";

import { Upload, X } from "lucide-react";
import type { PhotoSlot } from "@/types/product";

type MediaUploadProps = {
  photos: PhotoSlot[];
  imageErrors: string[];
  handleImageChange: (slotIndex: number, file: File | null) => void;
  handleRemoveImage: (slotIndex: number) => void;
};

export default function MediaUpload({
  photos,
  imageErrors,
  handleImageChange,
  handleRemoveImage,
}: MediaUploadProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-800">Media Upload</h2>
      <div className="grid grid-cols-5 gap-4">
        {photos.map((slot, index) => {
          const isMainPhoto = index === 0;
          return (
            <div key={index} className="space-y-2">
              <label
                className={`relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 bg-slate-50 transition ${
                  slot.preview
                    ? isMainPhoto
                      ? "border-blue-300"
                      : "border-slate-200"
                    : isMainPhoto
                      ? "border-dashed border-blue-300"
                      : "border-dashed border-slate-300"
                }`}
              >
                {isMainPhoto ? (
                  <span className="absolute left-2 top-2 z-20 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    Foto Utama
                  </span>
                ) : null}

                {slot.preview ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={slot.preview} alt={`preview-${index}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        handleRemoveImage(index);
                      }}
                      className="absolute right-2 top-2 z-20 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
                      aria-label={`Remove image ${index + 1}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center px-3 text-center text-slate-500">
                    <Upload className="h-5 w-5" />
                    <span className="mt-2 text-xs font-semibold">Upload</span>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => handleImageChange(index, event.target.files?.[0] ?? null)}
                />
              </label>
              {imageErrors[index] ? <p className="text-[11px] text-rose-600">{imageErrors[index]}</p> : null}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-slate-500">Unggah hingga 5 foto. Maksimal ukuran tiap file 2MB.</p>
    </section>
  );
}
