"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { MonthCalendar } from "@/components/booking/month-calendar";
import { TimePicker } from "@/components/booking/time-picker";
import { BottomBar } from "@/components/bottom-bar";
import { Button } from "@/components/button";
import { TextArea } from "@/components/form";
import { FormError } from "@/components/form-error";
import { PageTitle } from "@/components/page-title";
import { DetailRow, Section, SectionTitle } from "@/components/section";
import { apiErrorCode, apiSendJson } from "@/lib/api";
import type { ApiErrorCode } from "@/lib/api";
import { BOOKING_RULES } from "@/lib/booking-rules";
import {
  dayState,
  listBookableDays,
  listStartSlots,
} from "@/lib/booking-slots";
import type { Availability, DayState, StartSlot } from "@/lib/booking-slots";
import type { BookingResponse, NewBookingRequest } from "@/lib/bookings";
import type { BikeDetails, CatalogPlan } from "@/lib/catalog";
import type { MessageKey } from "@/lib/i18n/messages/ru";
import { useLocale, useT } from "@/lib/i18n/use-t";
import { formatDuration } from "@/lib/plans";
import {
  formatDateTime,
  isSameDay,
  toCalendarDay,
  toDateInputValue,
} from "@/lib/rental-time";
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
  bike_paused: "pause.customerNote",
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
  const [now, setNow] = useState(() => new Date());
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
  // Finding them means checking every start time of every day of the month
  // ahead: too slow to repeat on each typed letter of the comment. useMemo
  // repeats it only when the plan, the busy times or "now" change.
  const bookableDays = useMemo(() => listBookableDays(now), [now]);
  // How every day of the window looks: free, rented, closed by the admin.
  const dayStates = useMemo(() => {
    const planDuration = {
      count: plan.duration_count,
      unit: plan.duration_unit,
    };
    const states = new Map<string, DayState>();
    for (const bookableDay of bookableDays) {
      const daySlots = listStartSlots(
        bookableDay,
        planDuration,
        availability,
        now,
      );
      states.set(toDateInputValue(bookableDay), dayState(daySlots));
    }
    return states;
  }, [
    bookableDays,
    plan.duration_count,
    plan.duration_unit,
    availability,
    now,
  ]);
  const freeDays = bookableDays.filter(
    (bookableDay) => dayStates.get(toDateInputValue(bookableDay)) === "free",
  );

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

  // The calendar tints the days of the rental. Before a time is picked the
  // end is counted from the first time of the day: it gives the same day
  // for every plan that lasts days, weeks or months.
  let rangeEndDay: CalendarDay | null = null;
  const rangeSlot = slot ?? slots[0];
  if (rangeSlot) {
    rangeEndDay = toCalendarDay(rangeSlot.endsAt);
  }

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
        // The form may have been open for a long time: count the start
        // times from the current moment again and reload the busy ones.
        setNow(new Date());
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
        <section className="flex flex-col gap-2">
          <SectionTitle>{t("common.plan")}</SectionTitle>
          <div role="radiogroup" className="flex flex-col gap-2">
            {plans.map((item) => (
              <PlanOption
                key={item.id}
                plan={item}
                isSelected={item.id === plan.id}
                onSelect={() => setChosenPlanId(item.id)}
              />
            ))}
          </div>
        </section>
      )}

      {day === null ? (
        <p className="rounded-xl border border-dashed p-4 text-center text-muted-foreground">
          {t("book.noFreeDates")}
        </p>
      ) : (
        <>
          <Section title={t("book.startDate")}>
            <MonthCalendar
              dayStateOf={(calendarDay) =>
                dayStates.get(toDateInputValue(calendarDay)) ?? "none"
              }
              firstDay={bookableDays[0]}
              lastDay={bookableDays[bookableDays.length - 1]}
              selectedDay={day}
              rangeEndDay={rangeEndDay}
              onSelect={setChosenDay}
            />
          </Section>

          <TimePicker
            // A new day or plan opens the picker on its own start page.
            key={`${toDateInputValue(day)}-${plan.id}`}
            slots={slots}
            selectedSlot={slot}
            onSelect={(picked) => setChosenStart(picked.startsAt.toISOString())}
          />
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

type PlanOptionProps = {
  plan: CatalogPlan;
  isSelected: boolean;
  onSelect: () => void;
};

// A plan to pick. The picked one is filled like the picked day and time,
// with a check mark on the left.
function PlanOption({ plan, isSelected, onSelect }: PlanOptionProps) {
  const t = useT();

  let colors = "border bg-card shadow-sm";
  // The duration under the name is muted; on the filled row "muted" is
  // the row's own text colour made lighter.
  let durationColor = "text-muted-foreground";
  if (isSelected) {
    colors = "border border-primary bg-primary text-primary-foreground";
    durationColor = "text-primary-foreground/70";
  }

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      onClick={onSelect}
      className={`flex min-h-14 items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${colors}`}
    >
      {isSelected ? (
        <Check className="size-5 shrink-0" strokeWidth={2.5} />
      ) : (
        <span className="size-5 shrink-0 rounded-full border-2" />
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-medium wrap-anywhere">{plan.name}</span>
        <span className={`text-sm ${durationColor}`}>
          {formatDuration(
            { count: plan.duration_count, unit: plan.duration_unit },
            t,
          )}
        </span>
      </span>
      <span className="shrink-0 font-medium">
        {t("common.priceValue", { price: plan.price })}
      </span>
    </button>
  );
}
