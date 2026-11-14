"use client";

import { useParams } from "next/navigation";
import { PlanForm } from "@/components/admin/plan-form";
import { ErrorState } from "@/components/error-state";
import { NotFoundText } from "@/components/not-found-text";
import { PageTitle } from "@/components/page-title";
import { Skeleton } from "@/components/skeleton";
import type { AdminPlanResponse, PlanFields } from "@/lib/admin-plans";
import { apiSendJson } from "@/lib/api";
import { useT } from "@/lib/i18n/use-t";
import { isNotFound, useApi } from "@/lib/use-api";

export default function AdminPlanPage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const { data, error, mutate } = useApi<AdminPlanResponse>(
    `/api/admin/plans/${id}`,
  );

  if (isNotFound(error)) {
    return <NotFoundText>{t("adminPlans.notFound")}</NotFoundText>;
  }
  if (error && !data) {
    return <ErrorState onRetry={() => mutate()} />;
  }
  if (!data) {
    return <Skeleton className="h-96 rounded-xl" />;
  }

  const { plan } = data;

  function savePlan(fields: PlanFields) {
    return apiSendJson<AdminPlanResponse>(
      "PATCH",
      `/api/admin/plans/${plan.id}`,
      fields,
    );
  }

  return (
    <>
      <PageTitle>{plan.name}</PageTitle>
      <PlanForm
        initialFields={plan}
        submitLabel={t("common.save")}
        onSubmit={savePlan}
      />
    </>
  );
}
