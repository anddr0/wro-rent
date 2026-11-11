"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { ButtonLink } from "@/components/button";
import { Chip } from "@/components/chip";
import { TextArea } from "@/components/form";
import { NotFoundText } from "@/components/not-found-text";
import { PageTitle } from "@/components/page-title";
import { DetailRow, Row, Section } from "@/components/section";
import { DEMO_PLANS, findDemoBike } from "@/lib/demo-data";

// TODO(slice 2.2): free start times from the API.
const DEMO_TIMES = ["9:00", "10:00", "11:00", "12:00", "14:00", "16:00"];

export default function BookPage() {
  const { id } = useParams<{ id: string }>();
  const bike = findDemoBike(id);
  const plans = DEMO_PLANS.filter((plan) => plan.isActive);
  const [planId, setPlanId] = useState(plans[0].id);
  const [time, setTime] = useState<string | null>(null);

  if (!bike) {
    return <NotFoundText>Велосипед не найден</NotFoundText>;
  }

  const plan = plans.find((item) => item.id === planId) ?? plans[0];

  return (
    <>
      <PageTitle>{bike.name}</PageTitle>

      {/* With a single plan there is nothing to choose (К-4). */}
      {plans.length > 1 && (
        <Section title="Тариф">
          {plans.map((item) => (
            <label key={item.id} className="cursor-pointer">
              <Row
                start={
                  <input
                    type="radio"
                    name="plan"
                    checked={item.id === planId}
                    onChange={() => setPlanId(item.id)}
                    className="accent-primary"
                  />
                }
                title={item.name}
                end={<span>{item.price} zł</span>}
              />
            </label>
          ))}
        </Section>
      )}

      <Section title="Дата начала">
        {/* TODO(slice 2.2): month calendar with busy days. */}
        <div className="flex aspect-square items-center justify-center p-4 text-center text-muted-foreground">
          Здесь будет календарь
        </div>
      </Section>

      <section className="flex flex-col gap-1.5">
        <h2 className="px-3 text-sm text-muted-foreground">Время начала</h2>
        <div className="flex flex-wrap gap-2">
          {DEMO_TIMES.map((item) => (
            <Chip
              key={item}
              label={item}
              isSelected={item === time}
              onSelect={() => setTime(item)}
            />
          ))}
        </div>
      </section>

      <p className="rounded-xl bg-amber-500/15 p-3 text-sm text-amber-700 dark:text-amber-400">
        Кто-то уже ждёт подтверждения на это время
      </p>

      <Section title="Итого">
        <DetailRow label="Тариф" value={plan.name} />
        <DetailRow label="Начало" value={`7 дек ${time ?? "—"}`} />
        <DetailRow label="Цена" value={`${plan.price} zł`} />
        <DetailRow label="Оплата" value="на месте, наличными или BLIK" />
      </Section>

      <TextArea placeholder="Комментарий для админа (необязательно)" rows={3} />

      {/* TODO(slice 2.3): send the request, then open its "sent" screen.
          replace: "back" from there should not return to this form. */}
      <ButtonLink href="/bookings/b1/sent" replace>
        Отправить заявку
      </ButtonLink>
    </>
  );
}
