"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MonthCalendar } from "@/components/booking/month-calendar";
import { BottomBar } from "@/components/bottom-bar";
import { Button } from "@/components/button";
import { Chip } from "@/components/chip";
import { TextArea } from "@/components/form";
import { FormError } from "@/components/form-error";
import { PageTitle } from "@/components/page-title";
import { DetailRow, Row, Section, SectionTitle } from "@/components/section";
import { apiErrorCode, apiSendJson } from "@/lib/api";
import type { ApiErrorCode } from "@/lib/api";
import { BOOKING_RULES } from "@/lib/booking-rules";
import { listBookableDays, listStartSlots } from "@/lib/booking-slots";
import type { Availability, StartSlot } from "@/lib/booking-slots";
import type { BookingResponse, NewBookingRequest } from "@/lib/bookings";
import type { BikeDetails, CatalogPlan } from "@/lib/catalog";
import type { MessageKey } from "@/lib/i18n/messages/ru";
import { useLocale, useT } from "@/lib/i18n/use-t";
import { formatDateTime, formatTime, isSameDay } from "@/lib/rental-time";
import type { CalendarDay } from "@/lib/rental-time";
import { requestWriteAccess } from "@/lib/telegram/dialogs";
import { useTelegram } from "@/lib/telegram/use-telegram";
import { refreshApi } from "@/lib/use-api";

// What to tell the customer when the server refuses the request.
const ERROR_MESSAGES: Partial<Record<ApiErrorCode, MessageKey>> = {
  dates_taken: "book.errorDatesTaken",
  start_not_allowed: "book.errorStartNotAllowed",
  plan_unavailable: "book.errorPlanUnavailable",
  too_many_bookings: "book.errorTooManyBookings",
  already_requested: "book.errorAlreadyRequested",
  write_access_required: "book.errorWriteAccess",
};

type BookingFormProps = {
  bike: BikeDetails;
  // At least one plan: the page doesn't show the form without plans.
  plans: CatalogPlan[];
  availability: Availability;
  // Called when the server says the picked time is gone: the page reloads
  // the bike's busy times.
  onAvailabilityOutdated: () => void;
};

// The request form (К-3, К-4): a plan, a day, a start time and a comment.
export function BookingForm({
  bike,
  plans,
  availability,
  onAvailabilityOutdated,
}: BookingFormProps) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const { webApp } = useTelegram();

  // The moment the form was opened. Start times are counted from it; the
  // server checks them again against its own clock.
  const [now] = useState(() => new Date());
  const [chosenPlanId, setChosenPlanId] = useState<string | null>(null);
  const [chosenDay, setChosenDay] = useState<CalendarDay | null>(null);
  // The picked start time as an ISO string.
  const [chosenStart, setChosenStart] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);

  // Until the customer picks a plan, the first one is chosen.
  const plan = plans.find((item) => item.id === chosenPlanId) ?? plans[0];
  const duration = { count: plan.duration_count, unit: plan.duration_unit };

  // The calendar offers only the days that still have a free start time.
  const bookableDays = listBookableDays(now);
  const freeDays = bookableDays.filter((day) => {
    const slots = listStartSlots(day, duration, availability, now);
    return slots.some((slot) => !slot.isBusy);
  });

  // The picked day, if it is still free with this plan; otherwise the first free one.
  let day: CalendarDay | null = freeDays[0] ?? null;
  if (chosenDay !== null) {
    const isChosenDayFree = freeDays.some((item) => isSameDay(item, chosenDay));
    if (isChosenDayFree) {
      day = chosenDay;
    }
  }

  let slots: StartSlot[] = [];
  if (day !== null) {
    slots = listStartSlots(day, duration, availability, now);
  }
  // The picked time counts only while it is free with this plan on this day.
  const slot =
    slots.find(
      (item) => item.startsAt.toISOString() === chosenStart && !item.isBusy,
    ) ?? null;
  const hasBusySlots = slots.some((item) => item.isBusy);

  async function sendRequest() {
    if (slot === null || isSending) {
      return;
    }

    setIsSending(true);
    setErrorKey(null);
    try {
      // Without it we couldn't tell the customer the answer (К-4).
      const canWrite = await requestWriteAccess(webApp);
      if (!canWrite) {
        setErrorKey("book.errorWriteAccess");
        return;
      }

      const request: NewBookingRequest = {
        bikeId: bike.id,
        planId: plan.id,
        startsAt: slot.startsAt.toISOString(),
        comment,
      };
      const { booking } = await apiSendJson<BookingResponse>(
        "POST",
        "/api/bookings",
        request,
      );

      // The home page and the bike's calendar now show the new request.
      await refreshApi("/api/bookings");
      await refreshApi(`/api/bikes/${bike.id}/availability`);
      // replace: "back" from the "sent" screen should not return to this form.
      router.replace(`/bookings/${booking.id}/sent`);
    } catch (error) {
      console.error(error);
      const code = apiErrorCode(error);
      let messageKey: MessageKey = "book.errorGeneric";
      if (code !== null) {
        messageKey = ERROR_MESSAGES[code] ?? "book.errorGeneric";
      }
      setErrorKey(messageKey);
      if (code === "dates_taken" || code === "start_not_allowed") {
        onAvailabilityOutdated();
      }
    } finally {
      setIsSending(false);
    }
  }

  return (
    <>
      <PageTitle>{bike.name}</PageTitle>

      {/* With a single plan there is nothing to choose (К-4). */}
      {plans.length > 1 && (
        <Section title={t("common.plan")}>
          {plans.map((item) => (
            <label key={item.id} className="cursor-pointer">
              <Row
                start={
                  <input
                    type="radio"
                    name="plan"
                    checked={item.id === plan.id}
                    onChange={() => setChosenPlanId(item.id)}
                    className="accent-primary"
                  />
                }
                title={item.name}
                end={
                  <span>{t("common.priceValue", { price: item.price })}</span>
                }
              />
            </label>
          ))}
        </Section>
      )}

      {day === null ? (
        <p className="rounded-xl border border-dashed p-4 text-center text-muted-foreground">
          {t("book.noFreeDates")}
        </p>
      ) : (
        <>
          <Section title={t("book.startDate")}>
            <MonthCalendar
              availableDays={freeDays}
              firstDay={bookableDays[0]}
              lastDay={bookableDays[bookableDays.length - 1]}
              selectedDay={day}
              onSelect={setChosenDay}
            />
          </Section>

          <section className="flex flex-col gap-2">
            <SectionTitle>{t("book.startTime")}</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {slots.map((item) => (
                <Chip
                  key={item.startsAt.toISOString()}
                  label={formatTime(item.startsAt, locale)}
                  isSelected={item === slot}
                  isDisabled={item.isBusy}
                  onSelect={() => setChosenStart(item.startsAt.toISOString())}
                />
              ))}
            </div>
            {hasBusySlots && (
              <p className="px-1 text-sm text-muted-foreground">
                {t("book.busyTimeHint")}
              </p>
            )}
          </section>
        </>
      )}

      {slot !== null && slot.hasPendingRequests && (
        <p className="rounded-xl bg-amber-500/15 p-3 text-sm text-amber-700 dark:text-amber-400">
          {t("book.othersWaiting")}
        </p>
      )}

      {slot !== null && (
        <Section title={t("book.summary")}>
          <DetailRow label={t("common.plan")} value={plan.name} />
          <DetailRow
            label={t("common.start")}
            value={formatDateTime(slot.startsAt, locale)}
          />
          <DetailRow
            label={t("common.end")}
            value={formatDateTime(slot.endsAt, locale)}
          />
          <DetailRow
            label={t("common.price")}
            value={t("common.priceValue", { price: plan.price })}
          />
          <DetailRow
            label={t("common.payment")}
            value={t("common.paymentOptions")}
          />
        </Section>
      )}

      <TextArea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        maxLength={BOOKING_RULES.maxCommentLength}
        placeholder={t("book.commentPlaceholder")}
        rows={3}
      />

      <BottomBar>
        {errorKey !== null && (
          <FormError>
            {t(errorKey, { count: BOOKING_RULES.maxOpenBookingsPerCustomer })}
          </FormError>
        )}
        <Button onClick={sendRequest} disabled={slot === null || isSending}>
          {isSending ? t("book.sending") : t("book.submit")}
        </Button>
      </BottomBar>
    </>
  );
}
