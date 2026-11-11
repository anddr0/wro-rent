"use client";

import { useCurrentUser } from "@/components/current-user";
import { AdminHome } from "@/components/home/admin-home";
import { CustomerHome } from "@/components/home/customer-home";

// One address, two home pages: an admin opens the app to work, a customer to rent.
export default function HomePage() {
  const user = useCurrentUser();

  if (user.role === "admin") {
    return <AdminHome />;
  }
  return <CustomerHome />;
}
