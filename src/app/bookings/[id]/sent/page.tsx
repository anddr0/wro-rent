"use client";

import { Check } from "lucide-react";
import { useParams } from "next/navigation";
import { ButtonLink } from "@/components/button";
import { NotFoundText } from "@/components/not-found-text";
import { DetailRow, Row, Section } from "@/components/section";
import { findDemoBooking } from "@/lib/demo-data";

const NEXT_STEPS = [
  { title: "Заявка отправлена", isDone: true },
  { title: "Админ подтверждает заявку", isDone: false },
  { title: "Вы забираете велосипед", isDone: false },
];

export default function BookingSentPage() {
  const { id } = useParams<{ id: string }>();
  // TODO(slice 2.3): the booking from the API.
  const booking = findDemoBooking(id);

  if (!booking) {
    return <NotFoundText>Бронь не найдена</NotFoundText>;
  }

  return (
    <>
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-primary text-3xl text-primary-foreground">
          <Check className="size-8" strokeWidth={2.5} />
        </span>
        <h1 className="text-2xl font-semibold">Заявка отправлена</h1>
        <p className="text-muted-foreground">
          Спасибо! Мы подтвердим заявку и напишем вам в Telegram.
        </p>
      </div>

      <Section title="Что дальше">
        {NEXT_STEPS.map((step) => (
          <Row
            key={step.title}
            start={<StepMark isDone={step.isDone} />}
            title={step.title}
          />
        ))}
      </Section>

      <Section title="Ваша заявка">
        <DetailRow label="Велосипед" value={booking.bikeName} />
        <DetailRow label="Тариф" value={booking.planName} />
        <DetailRow
          label="Даты"
          value={`${booking.startsAt} → ${booking.endsAt}`}
        />
        <DetailRow label="Цена" value={`${booking.price} zł`} />
      </Section>

      {/* TODO(К-5): the real address and what to bring — ask the client. */}
      <Section title="Где и как">
        <DetailRow label="Адрес" value="ул. Примерная 1, Вроцлав" />
        <DetailRow label="Оплата" value="на месте, наличными или BLIK" />
      </Section>

      <ButtonLink href="/" replace>
        На главную
      </ButtonLink>
    </>
  );
}

function StepMark({ isDone }: { isDone: boolean }) {
  if (isDone) {
    return (
      <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
        <Check className="size-3" strokeWidth={3} />
      </span>
    );
  }
  return <span className="size-5 rounded-full border-2" />;
}
