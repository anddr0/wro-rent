"use client";

import { Plus, Tags } from "lucide-react";
import { HiddenBadge } from "@/components/admin/hidden-badge";
import { BottomBar } from "@/components/bottom-bar";
import { ButtonLink } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { PageTitle } from "@/components/page-title";
import { Row, Section } from "@/components/section";
import { Skeleton } from "@/components/skeleton";
import type { AdminPlansResponse } from "@/lib/admin-plans";
import { useT } from "@/lib/i18n/use-t";
import { formatDuration } from "@/lib/plans";
import { useApi } from "@/lib/use-api";

export default function AdminPlansPage() {
  const t = useT();

  return (
    <>
      <PageTitle description={t("adminPlans.description")}>
        {t("adminPlans.title")}
      </PageTitle>

      <PlanList />

      <BottomBar>
        <ButtonLink href="/admin/plans/new">
          <Plus />
          {t("adminPlans.add")}
        </ButtonLink>
      </BottomBar>
    </>
  );
}

// Every plan (А-9); a tap opens it for editing.
function PlanList() {
  const t = useT();
  const { data, error, mutate } =
    useApi<AdminPlansResponse>("/api/admin/plans");

  if (error && !data) {
    return <ErrorState onRetry={() => mutate()} />;
  }
  if (!data) {
    return <Skeleton className="h-40 rounded-xl" />;
  }
  if (data.plans.length === 0) {
    return (
      <EmptyState
        icon={Tags}
        title={t("adminPlans.empty")}
        description={t("adminPlans.emptyHint")}
      />
    );
  }

  return (
    <Section>
      {data.plans.map((plan) => (
        <Row
          key={plan.id}
          href={`/admin/plans/${plan.id}`}
          title={plan.name}
          subtitle={formatDuration(
            { count: plan.durationCount, unit: plan.durationUnit },
            t,
          )}
          badge={
            !plan.isActive && <HiddenBadge label={t("adminPlans.hidden")} />
          }
          end={
            <span className="font-semibold">
              {t("common.priceValue", { price: plan.price })}
            </span>
          }
        />
      ))}
    </Section>
  );
}
