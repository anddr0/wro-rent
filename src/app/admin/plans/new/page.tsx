"use client";

import { PlanForm } from "@/components/admin/plan-form";
import { PageTitle } from "@/components/page-title";
import type { AdminPlanResponse, PlanFields } from "@/lib/admin-plans";
import { apiSendJson } from "@/lib/api";
import { useT } from "@/lib/i18n/use-t";

export default function NewPlanPage() {
  const t = useT();

  function createPlan(fields: PlanFields) {
    return apiSendJson<AdminPlanResponse>("POST", "/api/admin/plans", fields);
  }

  return (
    <>
      <PageTitle>{t("adminPlans.new")}</PageTitle>
      <PlanForm
        initialFields={null}
        submitLabel={t("adminPlans.create")}
        onSubmit={createPlan}
      />
    </>
  );
}
