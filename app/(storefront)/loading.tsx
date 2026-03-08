import CategoryGridSkeleton from "./components/CategoryGridSkeleton";

export default function StorefrontLoading() {
  return (
    <div className="bg-[#f4f5f7] py-8">
      <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
        <div className="h-72 animate-pulse rounded-xl bg-slate-200" />
      </div>

      <CategoryGridSkeleton />

      <div className="mx-auto mt-8 w-full max-w-7xl space-y-8 px-4 md:px-6">
        <div className="h-44 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-52 animate-pulse rounded-xl bg-slate-200" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-96 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      </div>
    </div>
  );
}
