"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getToken } from "@/lib/utils/storage";
import { authApi } from "@/lib/api/auth";

type AuthGuardProps = {
  children: React.ReactNode;
};

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const run = async () => {
      const token = getToken();
      if (!token) {
        const redirect = encodeURIComponent(pathname || "/admin/dashboard");
        router.replace(`/auth/login?redirect=${redirect}`);
        return;
      }

      try {
        await authApi.getProfile();
      } catch {
        const redirect = encodeURIComponent(pathname || "/admin/dashboard");
        router.replace(`/auth/login?redirect=${redirect}`);
        return;
      } finally {
        setIsChecking(false);
      }
    };

    void run();
  }, [pathname, router]);

  if (isChecking) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return <>{children}</>;
}