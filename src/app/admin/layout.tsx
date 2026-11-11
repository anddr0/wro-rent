"use client";

import { useCurrentUser } from "@/components/current-user";
import { NotFoundText } from "@/components/not-found-text";

// Hiding admin pages from customers is only for convenience:
// the real protection is requireAdmin in every /api/admin route.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = useCurrentUser();

  if (user.role !== "admin") {
    return <NotFoundText>Раздел только для администраторов</NotFoundText>;
  }
  return children;
}
