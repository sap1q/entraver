export default function CategoryGridSkeleton() {
  return (
    <section className="bg-white py-8 md:py-10">
      <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-6 lg:gap-x-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="aspect-square w-full max-w-[150px] animate-pulse rounded-xl bg-slate-200" />
              <div className="mt-3 h-4 w-24 animate-pulse rounded bg-slate-200" />
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <div className="h-10 w-48 animate-pulse rounded-full bg-slate-200" />
        </div>
      </div>
    </section>
  );
}
