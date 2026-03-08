export default function CategoryGridSkeleton() {
  return (
    <section className="bg-white py-12">
      <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
        <div className="mb-8">
          <div className="h-3 w-32 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-10 w-full max-w-xl animate-pulse rounded bg-slate-200 md:h-12" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12 lg:grid-rows-2">
          <div className="aspect-[16/10] animate-pulse rounded-2xl bg-slate-200 md:aspect-[4/3] lg:col-span-6 lg:row-span-2 lg:aspect-auto lg:min-h-[560px]" />
          <div className="aspect-[16/10] animate-pulse rounded-2xl bg-slate-200 md:aspect-[4/3] lg:col-span-6 lg:aspect-auto lg:min-h-[270px]" />
          <div className="aspect-[16/10] animate-pulse rounded-2xl bg-slate-200 md:aspect-[4/3] lg:col-span-3 lg:aspect-auto lg:min-h-[270px]" />
          <div className="aspect-[16/10] animate-pulse rounded-2xl bg-slate-200 md:aspect-[4/3] lg:col-span-3 lg:aspect-auto lg:min-h-[270px]" />
        </div>

        <div className="mt-8 flex justify-center">
          <div className="h-12 w-56 animate-pulse rounded-full bg-slate-200" />
        </div>
      </div>
    </section>
  );
}
