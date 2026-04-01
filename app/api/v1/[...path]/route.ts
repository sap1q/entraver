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

type MockAdminRole = "superadmin" | "admin" | "staff" | "editor";

type MockAdmin = {
  id: string;
  name: string;
  email: string;
  role: MockAdminRole;
  last_login_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
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

const AUTH_EXPIRES_IN = 60 * 60 * 24 * 7;

const isValidAdminRole = (value: string | null | undefined): value is MockAdminRole =>
  value === "superadmin" || value === "admin" || value === "staff" || value === "editor";

const normalizeNameFromEmail = (email: string) =>
  email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ") || "Entraverse Admin";

const createMockAdmin = (params: {
  email: string;
  name?: string;
  role?: string | null;
  createdAt?: string;
}): MockAdmin => {
  const normalizedEmail = params.email.trim().toLowerCase();
  const name = params.name?.trim() || normalizeNameFromEmail(normalizedEmail);
  const inferredRole = normalizedEmail.includes("superadmin")
    ? "superadmin"
    : normalizedEmail.includes("staff")
      ? "staff"
      : normalizedEmail.includes("editor")
        ? "editor"
        : "admin";
  const role = isValidAdminRole(params.role) ? params.role : inferredRole;
  const createdAt = params.createdAt ?? "2026-04-01T00:00:00.000Z";
  const now = new Date().toISOString();

  return {
    id: `admin-${Buffer.from(normalizedEmail).toString("base64url").slice(0, 16)}`,
    name,
    email: normalizedEmail,
    role,
    last_login_at: now,
    created_at: createdAt,
    updated_at: now,
  };
};

const encodeMockAdminToken = (admin: MockAdmin) =>
  `mock-admin.${Buffer.from(
    JSON.stringify({
      sub: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      created_at: admin.created_at,
      exp: Date.now() + (AUTH_EXPIRES_IN * 1000),
    })
  ).toString("base64url")}`;

const decodeMockAdminToken = (authorization: string | null): MockAdmin | null => {
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();
  if (!token.startsWith("mock-admin.")) {
    return null;
  }

  const encodedPayload = token.slice("mock-admin.".length);

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as {
      sub?: string;
      name?: string;
      email?: string;
      role?: string;
      created_at?: string;
      exp?: number;
    };

    if (!payload.email || !payload.sub || !payload.name || !isValidAdminRole(payload.role)) {
      return null;
    }

    if (typeof payload.exp === "number" && Date.now() > payload.exp) {
      return null;
    }

    return {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      last_login_at: new Date().toISOString(),
      created_at: payload.created_at ?? "2026-04-01T00:00:00.000Z",
      updated_at: new Date().toISOString(),
    };
  } catch {
    return null;
  }
};

const authResponse = (admin: MockAdmin, message: string) =>
  json({
    success: true,
    message,
    data: {
      token: encodeMockAdminToken(admin),
      token_type: "Bearer" as const,
      admin,
      expires_in: AUTH_EXPIRES_IN,
      refresh_token: `mock-refresh.${admin.id}`,
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: "mock-v1",
    },
  });

const validationError = (message: string, errors: Record<string, string[]>) =>
  json(
    {
      success: false,
      message,
      errors,
      data: null,
    },
    { status: 422 }
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

  if (path.length === 2 && path[0] === "admin" && path[1] === "profile") {
    const admin = decodeMockAdminToken(request.headers.get("authorization"));
    if (!admin) {
      return json(
        {
          success: false,
          message: "Sesi tidak valid. Silakan login kembali.",
          data: null,
        },
        { status: 401 }
      );
    }

    return json({
      success: true,
      message: "Profil admin berhasil dimuat.",
      data: admin,
      meta: {
        timestamp: new Date().toISOString(),
        version: "mock-v1",
      },
    });
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

  if (path.length === 2 && path[0] === "admin" && path[1] === "login") {
    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      password?: string;
      remember?: boolean;
    };

    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    const errors: Record<string, string[]> = {};

    if (!email) {
      errors.email = ["Email wajib diisi."];
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = ["Format email tidak valid."];
    }

    if (!password) {
      errors.password = ["Password wajib diisi."];
    } else if (password.length < 6) {
      errors.password = ["Password minimal 6 karakter."];
    }

    if (Object.keys(errors).length > 0) {
      return validationError("Data login tidak valid.", errors);
    }

    const admin = createMockAdmin({ email });
    return authResponse(admin, "Login berhasil.");
  }

  if (path.length === 2 && path[0] === "admin" && path[1] === "register") {
    const body = (await request.json().catch(() => ({}))) as {
      name?: string;
      email?: string;
      password?: string;
      password_confirmation?: string;
      role?: string;
    };

    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    const confirmation = body.password_confirmation ?? "";
    const errors: Record<string, string[]> = {};

    if (!body.name?.trim()) {
      errors.name = ["Nama wajib diisi."];
    }

    if (!email) {
      errors.email = ["Email wajib diisi."];
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = ["Format email tidak valid."];
    }

    if (!password) {
      errors.password = ["Password wajib diisi."];
    } else if (password.length < 8) {
      errors.password = ["Password minimal 8 karakter."];
    }

    if (!confirmation) {
      errors.password_confirmation = ["Konfirmasi password wajib diisi."];
    } else if (confirmation !== password) {
      errors.password_confirmation = ["Konfirmasi password tidak cocok."];
    }

    if (body.role && !isValidAdminRole(body.role)) {
      errors.role = ["Role admin tidak valid."];
    }

    if (Object.keys(errors).length > 0) {
      return validationError("Data registrasi tidak valid.", errors);
    }

    const admin = createMockAdmin({
      email,
      name: body.name,
      role: body.role,
    });

    return authResponse(admin, "Registrasi admin berhasil.");
  }

  if (path.length === 2 && path[0] === "admin" && path[1] === "logout") {
    return json({
      success: true,
      message: "Logout berhasil.",
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
        version: "mock-v1",
      },
    });
  }

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
