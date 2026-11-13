"use client";

import { Check } from "lucide-react";
import { useParams } from "next/navigation";
import { ButtonLink } from "@/components/button";
import { NotFoundText } from "@/components/not-found-text";
import { DetailRow, Row, Section } from "@/components/section";
import { findDemoBooking } from "@/lib/demo-data";
import type { MessageKey } from "@/lib/i18n/messages/ru";
import { useT } from "@/lib/i18n/use-t";

const NEXT_STEPS: { title: MessageKey; isDone: boolean }[] = [
  { title: "sent.stepSent", isDone: true },
  { title: "sent.stepConfirm", isDone: false },
  { title: "sent.stepPickUp", isDone: false },
];

export default function BookingSentPage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  // TODO(slice 2.3): the booking from the API.
  const booking = findDemoBooking(id);

  if (!booking) {
    return <NotFoundText>{t("common.bookingNotFound")}</NotFoundText>;
  }

  return (
    <>
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-8" strokeWidth={2.5} />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("sent.title")}
        </h1>
        <p className="text-muted-foreground">{t("sent.thanks")}</p>
      </div>

      <Section title={t("sent.whatNext")}>
        {NEXT_STEPS.map((step) => (
          <Row
            key={step.title}
            start={<StepMark isDone={step.isDone} />}
            title={t(step.title)}
          />
        ))}
      </Section>

      <Section title={t("sent.yourRequest")}>
        <DetailRow label={t("common.bike")} value={booking.bikeName} />
        <DetailRow label={t("common.plan")} value={booking.planName} />
        <DetailRow
          label={t("common.dates")}
          value={`${booking.startsAt} → ${booking.endsAt}`}
        />
        <DetailRow
          label={t("common.price")}
          value={t("common.priceValue", { price: booking.price })}
        />
      </Section>

      {/* TODO(К-5): the real address and what to bring — ask the client. */}
      <Section title={t("sent.whereAndHow")}>
        <DetailRow label={t("sent.address")} value={t("sent.addressValue")} />
        <DetailRow
          label={t("common.payment")}
          value={t("common.paymentOptions")}
        />
      </Section>

      <ButtonLink href="/" replace>
        {t("sent.toHome")}
      </ButtonLink>
    </>
  );
}

function StepMark({ isDone }: { isDone: boolean }) {
  if (isDone) {
    return (
      <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Check className="size-3" strokeWidth={3} />
      </span>
    );
  }
  return <span className="size-5 rounded-full border-2" />;
}
