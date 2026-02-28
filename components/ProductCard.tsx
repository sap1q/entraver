import Image from "next/image";

type Product = {
  id: number | string;
  name: string;
  brand?: string | null;
  formatted_price?: string | null;
  price?: number | string | null;
  main_image?: string | null;
  image?: string | null;
  image_url?: string | null;
  thumbnail?: string | null;
};

type ProductCardProps = {
  product: Product;
};

function getImageUrl(product: Product): string {
  const imageValue =
    product.main_image ?? product.image_url ?? product.image ?? product.thumbnail;
  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  if (!imageValue) return "/product-placeholder.svg";
  if (imageValue.startsWith("http")) return imageValue;
  if (!apiBase) return "/product-placeholder.svg";
  if (imageValue.startsWith("/")) {
    return `${apiBase}${imageValue}`;
  }

  return `${apiBase}/${imageValue}`;
}

function getPrice(product: Product): string {
  if (product.formatted_price) return product.formatted_price;
  if (product.price === null || product.price === undefined) return "Price on request";

  const numericPrice =
    typeof product.price === "number"
      ? product.price
      : Number.parseFloat(product.price);

  if (Number.isNaN(numericPrice)) return String(product.price);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(numericPrice);
}

export default function ProductCard({ product }: ProductCardProps) {
  const imageUrl = getImageUrl(product);
  const productPrice = getPrice(product);

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/15 bg-white/[0.04] shadow-[0_10px_25px_-15px_rgba(0,0,0,0.6)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(37,99,235,0.7)]">
      <div className="relative h-64 w-full overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <div className="space-y-3 p-5">
        <h2 className="text-xl font-semibold tracking-tight text-white">
          {product.name}
        </h2>
        <p className="text-sm text-slate-400">{product.brand || "Entraverse Select"}</p>
        <p className="text-2xl font-bold text-blue-400">{productPrice}</p>
        <button
          type="button"
          className="w-full rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-medium tracking-wide text-white transition hover:bg-white hover:text-slate-900"
        >
          View Details
        </button>
      </div>
    </article>
  );
}
