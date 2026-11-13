"use client";

import { useCurrentUser } from "@/components/current-user";
import { NotFoundText } from "@/components/not-found-text";
import { useT } from "@/lib/i18n/use-t";

// Hiding admin pages from customers is only for convenience:
// the real protection is requireAdmin in every /api/admin route.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = useCurrentUser();
  const t = useT();

  if (user.role !== "admin") {
    return <NotFoundText>{t("common.adminOnly")}</NotFoundText>;
  }
  return children;
}
