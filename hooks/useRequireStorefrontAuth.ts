"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getToken } from "@/lib/utils/storage";

type RequireAuthResult = {
  isAuthenticated: boolean;
  isChecking: boolean;
};

export const useRequireStorefrontAuth = (redirectPath?: string): RequireAuthResult => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      const query = searchParams.toString();
      const next = redirectPath ?? `${pathname}${query ? `?${query}` : ""}`;
      router.replace(`/auth/login?redirect=${encodeURIComponent(next)}`);
      setIsAuthenticated(false);
      setIsChecking(false);
      return;
    }

    setIsAuthenticated(true);
    setIsChecking(false);
  }, [pathname, redirectPath, router, searchParams]);

  return {
    isAuthenticated,
    isChecking,
  };
};
