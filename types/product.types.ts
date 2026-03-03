export type SupportedCurrency = "IDR" | "USD" | "CNY";

export interface PlatformPrices {
  entraverse: number;
  tokopedia: number;
  shopee: number;
  tiktok: number;
}

export interface PriceBreakdown {
  basePrice: number;
  exchangeRate: number;
  shippingAir: number;
  shippingSea: number;
  commission: number;
  cashback: number;
  insurance: number;
  warrantyCost: number;
  warrantyProfit: number;
  shippingNew: number;
  totalCost: number;
  recommendedPrice: number;
  platformPrices: PlatformPrices;
}

export interface VariantAttribute {
  name: string;
  values: string[];
}

export interface VariantCombination {
  id: string;
  attributes: Record<string, string>;
  sku: string;
  price: number;
  stock: number;
  image?: string;
}

export interface PricingFormInput {
  basePriceAmount: number;
  basePriceCurrency: SupportedCurrency;
  exchangeRate: number;
  weightKg: number;
  volumeCbm: number;
  shippingAirRate: number;
  shippingSeaRate: number;
  marginPercent: number;
  tiktokCommissionPercent: number;
  xtraCashbackPercent: number;
  shopeeInsurancePercent: number;
  warrantyCostPercent: number;
  warrantyProfitPercent: number;
  shippingNewCost: number;
  tokopediaFeePercent: number;
  shopeeFeePercent: number;
  tiktokFeePercent: number;
  roundToNearest?: number;
}
