export type CartVariantMap = Record<string, string>;

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  slug?: string;
  image: string;
  price: number;
  variantSku?: string;
  quantity: number;
  stock: number;
  minOrder: number;
  selected: boolean;
  variants: CartVariantMap;
  tradeInEnabled: boolean;
  tradeInValue: number;
  tradeInUnitValue: number;
}

export interface CartSummary {
  totalPrice: number;
  tradeInDiscount: number;
  totalPayable: number;
  selectedLineCount: number;
  selectedQuantity: number;
}

export interface AddToCartMetadata {
  name?: string;
  slug?: string;
  image?: string;
  price?: number;
  variantSku?: string;
  stock?: number;
  minOrder?: number;
  tradeInEnabled?: boolean;
  tradeInValue?: number;
  tradeInUnitValue?: number;
}

export interface CartActionResult {
  success: boolean;
  message?: string;
}
