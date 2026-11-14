"use client";

import { Check } from "lucide-react";
import { Section } from "@/components/section";
import type { BookingStatus, CustomerBooking } from "@/lib/bookings";
import type { MessageKey } from "@/lib/i18n/messages/ru";
import { useLocale, useT } from "@/lib/i18n/use-t";
import { formatDateTime } from "@/lib/rental-time";

type StepState = "done" | "current" | "upcoming";

type Step = {
  title: string;
  hint: string | null;
  state: StepState;
};

// A booking goes through four steps. This is how many of them are behind
// for each status; the next one is the current step.
const DONE_STEPS: Partial<Record<BookingStatus, number>> = {
  pending: 1,
  confirmed: 2,
  active: 3,
};

// Bookings that are over have no next step, only a line about how they ended.
const ENDED_NOTES: Partial<Record<BookingStatus, MessageKey>> = {
  completed: "steps.completed",
  cancelled: "steps.cancelled",
  rejected: "steps.rejected",
};

// "What's next" for the customer: where the booking is now and what to
// expect, from the request to bringing the bike back.
export function BookingSteps({ booking }: { booking: CustomerBooking }) {
  const t = useT();
  const locale = useLocale();

  const endedNote = ENDED_NOTES[booking.status];
  if (endedNote) {
    return <p className="text-sm text-muted-foreground">{t(endedNote)}</p>;
  }

  const doneCount = DONE_STEPS[booking.status] ?? 0;

  function stateOf(stepNumber: number): StepState {
    if (stepNumber <= doneCount) {
      return "done";
    }
    if (stepNumber === doneCount + 1) {
      return "current";
    }
    return "upcoming";
  }

  // The second and third steps are named differently once they are behind.
  let confirmTitle = t("steps.waiting");
  let confirmHint: string | null = t("steps.waitingHint");
  if (stateOf(2) === "done") {
    confirmTitle = t("steps.confirmed");
    confirmHint = null;
  }

  let pickUpTitle = t("steps.pickUp");
  if (stateOf(3) === "done") {
    pickUpTitle = t("steps.pickedUp");
  }

  const steps: Step[] = [
    {
      title: t("steps.sent"),
      hint: formatDateTime(booking.createdAt, locale),
      state: stateOf(1),
    },
    { title: confirmTitle, hint: confirmHint, state: stateOf(2) },
    {
      title: pickUpTitle,
      hint: t("steps.pickUpHint", {
        date: formatDateTime(booking.startsAt, locale),
        address: t("sent.addressValue"),
      }),
      state: stateOf(3),
    },
    {
      title: t("steps.return"),
      hint: t("steps.returnHint", {
        date: formatDateTime(booking.endsAt, locale),
      }),
      state: stateOf(4),
    },
  ];

  return (
    <Section title={t("steps.title")}>
      {steps.map((step) => (
        <div key={step.title} className="flex items-start gap-3 px-4 py-3">
          <StepMark state={step.state} />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span
              className={
                step.state === "upcoming"
                  ? "text-muted-foreground"
                  : "font-medium"
              }
            >
              {step.title}
            </span>
            {step.hint && (
              <span className="text-sm text-muted-foreground wrap-anywhere">
                {step.hint}
              </span>
            )}
          </div>
        </div>
      ))}
    </Section>
  );
}

// A filled circle with a check — done, a ring with a dot — now, an empty ring — later.
function StepMark({ state }: { state: StepState }) {
  const box =
    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full";

  if (state === "done") {
    return (
      <span className={`${box} bg-primary text-primary-foreground`}>
        <Check className="size-3" strokeWidth={3} />
      </span>
    );
  }
  if (state === "current") {
    return (
      <span className={`${box} border-2 border-primary`}>
        <span className="size-2 rounded-full bg-primary" />
      </span>
    );
  }
  return <span className={`${box} border-2 border-muted-foreground/40`} />;
}
