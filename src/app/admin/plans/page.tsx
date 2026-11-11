import { Plus } from "lucide-react";
import { BottomBar } from "@/components/bottom-bar";
import { Button } from "@/components/button";
import { PageTitle } from "@/components/page-title";
import { Row, Section } from "@/components/section";
import { DEMO_PLANS } from "@/lib/demo-data";

// TODO(slice 6.1): plans from the API; create, edit and hide them.
export default function AdminPlansPage() {
  return (
    <>
      <PageTitle description="Общие для всех велосипедов. Новая цена не меняет уже созданные брони.">
        Тарифы
      </PageTitle>

      <Section>
        {DEMO_PLANS.map((plan) => (
          <Row
            key={plan.id}
            title={plan.name}
            subtitle={plan.duration}
            end={<span className="font-semibold">{plan.price} zł</span>}
          />
        ))}
      </Section>

      <BottomBar>
        <Button>
          <Plus />
          Добавить тариф
        </Button>
      </BottomBar>
    </>
  );
}
