"use client";

import { useState } from "react";
import { ChevronDown, Star } from "lucide-react";
import { useProductFilters } from "@/hooks/useProductFilters";
import { RATING_OPTIONS } from "@/lib/constants/filters";

export const RatingFilter = () => {
  const [isOpen, setIsOpen] = useState(true);
  const { toggleFilter, isFilterActive } = useProductFilters();

  return (
    <section className="border-b border-slate-200 pb-5">
      <button
        type="button"
        onClick={() => setIsOpen((state) => !state)}
        className="flex w-full items-center justify-between text-slate-800 hover:text-slate-600"
      >
        <span className="text-sm font-semibold tracking-wide">RATING</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen ? (
        <div className="mt-4 space-y-2.5">
          {RATING_OPTIONS.map((rating) => (
            <label key={rating} className="group flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={isFilterActive("rating", String(rating))}
                onChange={() => toggleFilter("rating", String(rating))}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={`${rating}-${index}`}
                    className={`h-4 w-4 ${
                      index < rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-slate-600 group-hover:text-slate-900">ke atas</span>
            </label>
          ))}
        </div>
      ) : null}
    </section>
  );
};
