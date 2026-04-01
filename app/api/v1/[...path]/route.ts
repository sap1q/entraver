import { NextRequest, NextResponse } from "next/server";
import {
  addMockCartItem,
  getMockProduct,
  listMockActiveBanners,
  listMockBrands,
  listMockCategories,
  listMockProductReviews,
  listMockProducts,
  listMockProductSuggestions,
  parseMockProductQuery,
  toggleMockWishlist,
} from "@/lib/mock-store-api";

type RouteContext = {
  params: Promise<{
    path?: string[];
  }>;
};

const json = (payload: unknown, init?: ResponseInit) => NextResponse.json(payload, init);

const notFound = () =>
  json(
    {
      success: false,
      message: "Endpoint tidak ditemukan.",
    },
    { status: 404 }
  );

export async function GET(request: NextRequest, context: RouteContext) {
  const { path = [] } = await context.params;
  const searchParams = request.nextUrl.searchParams;

  if (path.length === 1 && path[0] === "categories") {
    const limit = searchParams.get("limit");
    return json(listMockCategories(limit ? Number(limit) : undefined));
  }

  if (path.length === 1 && path[0] === "brands") {
    const limit = searchParams.get("limit");
    return json(listMockBrands(limit ? Number(limit) : undefined));
  }

  if (path.length === 2 && path[0] === "banners" && path[1] === "active") {
    return json(listMockActiveBanners());
  }

  if (path.length === 1 && path[0] === "products") {
    return json(listMockProducts(parseMockProductQuery(searchParams)));
  }

  if (path.length === 2 && path[0] === "products" && path[1] === "load-more") {
    return json(listMockProducts(parseMockProductQuery(searchParams)));
  }

  if (path.length === 2 && path[0] === "products" && path[1] === "suggestions") {
    const search = searchParams.get("search") ?? "";
    const limit = Number(searchParams.get("limit") ?? "6");
    return json(listMockProductSuggestions(search, Number.isFinite(limit) ? limit : 6));
  }

  if (path.length === 2 && path[0] === "products") {
    const product = getMockProduct(path[1]);
    if (!product) {
      return json(
        {
          success: false,
          message: "Produk tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    return json({
      success: true,
      data: product,
    });
  }

  if (path.length === 3 && path[0] === "products" && path[2] === "reviews") {
    return json(
      listMockProductReviews(path[1], {
        page: Number(searchParams.get("page") ?? "1"),
        perPage: Number(searchParams.get("per_page") ?? "10"),
        sort: (searchParams.get("sort") as "newest" | "highest" | "lowest" | null) ?? "newest",
        withPhotos: searchParams.get("with_photos") === "1",
      })
    );
  }

  return notFound();
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { path = [] } = await context.params;

  if (path.length === 3 && path[0] === "wishlist" && path[1] === "toggle") {
    return json(toggleMockWishlist(path[2]));
  }

  if (path.length === 2 && path[0] === "cart" && path[1] === "add") {
    const body = (await request.json().catch(() => ({}))) as {
      product_id?: string;
      quantity?: number;
      variant?: Record<string, string>;
    };

    const result = addMockCartItem({
      productId: body.product_id,
      quantity: body.quantity,
      variant: body.variant,
    });

    return json(result, { status: result.success ? 200 : 404 });
  }

  return notFound();
}
