"use client";

import { Plus } from "lucide-react";
import { BottomBar } from "@/components/bottom-bar";
import { Button } from "@/components/button";
import { PageTitle } from "@/components/page-title";
import { Row, Section } from "@/components/section";
import { DEMO_PLANS } from "@/lib/demo-data";
import { useT } from "@/lib/i18n/use-t";

// TODO(slice 6.1): plans from the API; create, edit and hide them.
export default function AdminPlansPage() {
  const t = useT();

  return (
    <>
      <PageTitle description={t("adminPlans.description")}>
        {t("adminPlans.title")}
      </PageTitle>

      <Section>
        {DEMO_PLANS.map((plan) => (
          <Row
            key={plan.id}
            title={plan.name}
            subtitle={plan.duration}
            end={
              <span className="font-semibold">
                {t("common.priceValue", { price: plan.price })}
              </span>
            }
          />
        ))}
      </Section>

      <BottomBar>
        <Button>
          <Plus />
          {t("adminPlans.add")}
        </Button>
      </BottomBar>
    </>
  );
}
