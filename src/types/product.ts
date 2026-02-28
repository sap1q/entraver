export interface ProductImage {
  url: string;
  alt?: string | null;
  is_primary?: boolean;
}

export interface Product {
  id: number;
  name: string;
  brand: string;
  description?: string | null;
  price: number;
  formatted_price?: string | null;
  stock?: number;
  main_image?: string | null;
  images?: ProductImage[];
  status?: "active" | "inactive" | "draft";
}
