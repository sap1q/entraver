import type { Product } from "@/src/types/product";

type ProductsApiResponse = {
  data: Product[];
};

export async function fetchProducts(): Promise<Product[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) return [];

  const response = await fetch(`${apiUrl}/products`, { cache: "no-store" });

  if (!response.ok) return [];

  const payload = (await response.json()) as ProductsApiResponse;
  return Array.isArray(payload?.data) ? payload.data : [];
}
