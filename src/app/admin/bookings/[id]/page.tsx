"use client";

import { MessageCircle, Pencil } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { BottomBar } from "@/components/bottom-bar";
import { Button, ButtonLink } from "@/components/button";
import { ErrorState } from "@/components/error-state";
import { TextArea } from "@/components/form";
import { FormError } from "@/components/form-error";
import { NotFoundText } from "@/components/not-found-text";
import { PageTitle } from "@/components/page-title";
import { DetailRow, Row, Section } from "@/components/section";
import { Skeleton } from "@/components/skeleton";
import type {
  AdminBooking,
  AdminBookingResponse,
  BookingAction,
  BookingActionRequest,
} from "@/lib/admin-bookings";
import { MAX_REASON_LENGTH } from "@/lib/admin-bookings";
import { apiErrorCode, apiSendJson } from "@/lib/api";
import type { Locale } from "@/lib/i18n/locales";
import type { MessageKey } from "@/lib/i18n/messages/ru";
import type { Translate } from "@/lib/i18n/translate";
import { useLocale, useT } from "@/lib/i18n/use-t";
import { PAYMENT_METHOD_LABELS } from "@/lib/payments";
import { formatDateTime } from "@/lib/rental-time";
import { openTelegramChat } from "@/lib/telegram/dialogs";
import { useTelegram } from "@/lib/telegram/use-telegram";
import { isNotFound, refreshApi, useApi } from "@/lib/use-api";

export default function AdminBookingPage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const { data, error, mutate } = useApi<AdminBookingResponse>(
    `/api/admin/bookings/${id}`,
  );

  if (isNotFound(error)) {
    return <NotFoundText>{t("common.bookingNotFound")}</NotFoundText>;
  }
  if (error && !data) {
    return <ErrorState onRetry={() => mutate()} />;
  }
  if (!data) {
    return <Skeleton className="h-96 rounded-xl" />;
  }

  return <AdminBookingCard booking={data.booking} />;
}

// The two actions that end a booking against the customer's wish. Before
// either of them the admin may write why.
type DeclineAction = "reject" | "cancel";

// The booking with everything an admin can do about it (А-7).
function AdminBookingCard({ booking }: { booking: AdminBooking }) {
  const t = useT();
  const locale = useLocale();
  const { webApp } = useTelegram();
  const [runningAction, setRunningAction] = useState<BookingAction | null>(
    null,
  );
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);
  // Set while the admin is asked for the reason of a rejection or cancellation.
  const [decliningAction, setDecliningAction] = useState<DeclineAction | null>(
    null,
  );

  // `reason` is for "reject" and "cancel": what the customer is told.
  async function runAction(action: BookingAction, reason = "") {
    if (runningAction !== null) {
      return;
    }

    const request: BookingActionRequest = { action, reason };

    setRunningAction(action);
    setErrorKey(null);
    try {
      await apiSendJson<AdminBookingResponse>(
        "POST",
        `/api/admin/bookings/${booking.id}/status`,
        request,
      );
      setDecliningAction(null);
    } catch (error) {
      console.error(error);
      const code = apiErrorCode(error);
      if (code === "dates_taken") {
        setErrorKey("adminBooking.errorDatesTaken");
      } else if (code === "bike_unavailable") {
        setErrorKey("adminBooking.errorBikeUnavailable");
      } else if (code === "status_changed") {
        setErrorKey("adminBooking.errorStatusChanged");
      } else {
        setErrorKey("adminBooking.errorGeneric");
      }
    } finally {
      // Reload even after an error: the status may have changed meanwhile.
      // Lists, this card and the home summary all start with /api/admin.
      await refreshApi("/api/admin");
      setRunningAction(null);
    }
  }

  const customer = booking.customer;
  const customerUsername = customer.username;

  return (
    <>
      <PageTitle
        description={booking.planName}
        end={<BookingStatusBadge status={booking.status} />}
      >
        {booking.bike.name}
      </PageTitle>

      <Section title={t("adminBooking.customer")}>
        <Row
          start={
            <Avatar
              photoUrl={customer.photoUrl}
              name={customer.fullName}
              size={40}
            />
          }
          title={customer.fullName}
          subtitle={
            customerUsername
              ? `@${customerUsername}`
              : t("adminBooking.noUsername")
          }
          end={
            customerUsername && (
              <Button
                variant="secondary"
                size="small"
                onClick={() => openTelegramChat(webApp, customerUsername)}
              >
                <MessageCircle />
                {t("adminBooking.message")}
              </Button>
            )
          }
        />
      </Section>

      <Section title={t("adminBooking.rental")}>
        <DetailRow
          label={t("common.start")}
          value={formatDateTime(booking.startsAt, locale)}
        />
        <DetailRow
          label={t("common.end")}
          value={formatDateTime(booking.endsAt, locale)}
        />
        {booking.pickedUpAt && (
          <DetailRow
            label={t("adminBooking.pickedUpAt")}
            value={formatDateTime(booking.pickedUpAt, locale)}
          />
        )}
        {booking.returnedAt && (
          <DetailRow
            label={t("adminBooking.returnedAt")}
            value={formatDateTime(booking.returnedAt, locale)}
          />
        )}
        {booking.planName && (
          <DetailRow label={t("common.plan")} value={booking.planName} />
        )}
        <DetailRow
          label={t("common.price")}
          value={t("common.priceValue", { price: booking.price })}
        />
        {booking.comment && (
          <DetailRow label={t("common.comment")} value={booking.comment} />
        )}
        {booking.declineReason && (
          <DetailRow
            label={t("booking.reason")}
            value={booking.declineReason}
          />
        )}
      </Section>

      <Section title={t("common.payment")}>
        <DetailRow
          label={t("adminBooking.deposit")}
          value={
            booking.deposit === null
              ? "—"
              : t("common.priceValue", { price: booking.deposit })
          }
        />
        <DetailRow
          label={t("common.payment")}
          value={paymentText(booking, locale, t)}
        />
        <DetailRow
          label={t("adminBooking.note")}
          value={booking.adminNote ?? "—"}
        />
      </Section>

      {/* Price, payment and the note can be changed in any status. */}
      <ButtonLink
        href={`/admin/bookings/${booking.id}/edit`}
        variant="secondary"
      >
        <Pencil />
        {t("adminBooking.edit")}
      </ButtonLink>

      {decliningAction === null ? (
        <StatusActions
          booking={booking}
          errorKey={errorKey}
          isBusy={runningAction !== null}
          onAction={runAction}
          onDecline={setDecliningAction}
        />
      ) : (
        <DeclineForm
          action={decliningAction}
          errorKey={errorKey}
          isBusy={runningAction !== null}
          onBack={() => setDecliningAction(null)}
          onSubmit={(reason) => runAction(decliningAction, reason)}
        />
      )}
    </>
  );
}

// "Оплачено 7 дек., 10:00 · BLIK" or "не оплачено".
function paymentText(
  booking: AdminBooking,
  locale: Locale,
  t: Translate,
): string {
  const parts: string[] = [];
  if (booking.paidAt) {
    parts.push(
      t("adminBooking.paidAt", {
        date: formatDateTime(booking.paidAt, locale),
      }),
    );
  } else {
    parts.push(t("adminBooking.notPaid"));
  }
  if (booking.paymentMethod) {
    parts.push(t(PAYMENT_METHOD_LABELS[booking.paymentMethod]));
  }
  return parts.join(" · ");
}

type StatusActionsProps = {
  booking: AdminBooking;
  errorKey: MessageKey | null;
  // An action is being sent: the buttons wait.
  isBusy: boolean;
  onAction: (action: BookingAction) => void;
  // "Reject" and "cancel" first ask for a reason, see DeclineForm.
  onDecline: (action: DeclineAction) => void;
};

// The buttons depend on the status, see docs/wireframes/README.md.
function StatusActions({
  booking,
  errorKey,
  isBusy,
  onAction,
  onDecline,
}: StatusActionsProps) {
  const t = useT();
  const error = errorKey !== null && <FormError>{t(errorKey)}</FormError>;

  if (booking.status === "pending") {
    return (
      <BottomBar>
        {error}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="destructive"
            disabled={isBusy}
            onClick={() => onDecline("reject")}
          >
            {t("adminBooking.reject")}
          </Button>
          <Button disabled={isBusy} onClick={() => onAction("confirm")}>
            {t("adminBooking.confirm")}
          </Button>
        </div>
      </BottomBar>
    );
  }
  if (booking.status === "confirmed") {
    return (
      <BottomBar>
        {error}
        <Button disabled={isBusy} onClick={() => onAction("handOut")}>
          {t("adminBooking.handedOut")}
        </Button>
        <Button
          variant="destructive"
          disabled={isBusy}
          onClick={() => onDecline("cancel")}
        >
          {t("adminBooking.cancel")}
        </Button>
      </BottomBar>
    );
  }
  if (booking.status === "active") {
    return (
      <BottomBar>
        {error}
        <Button disabled={isBusy} onClick={() => onAction("takeBack")}>
          {t("adminBooking.returned")}
        </Button>
        <Button
          variant="destructive"
          disabled={isBusy}
          onClick={() => onDecline("cancel")}
        >
          {t("adminBooking.cancel")}
        </Button>
      </BottomBar>
    );
  }
  // Finished bookings: nothing to do but edit price, payment and the note.
  return error;
}

const DECLINE_TITLES: Record<DeclineAction, MessageKey> = {
  reject: "adminBooking.rejectTitle",
  cancel: "adminBooking.cancelTitle",
};

const DECLINE_BUTTONS: Record<DeclineAction, MessageKey> = {
  reject: "adminBooking.reject",
  cancel: "adminBooking.cancel",
};

type DeclineFormProps = {
  action: DeclineAction;
  errorKey: MessageKey | null;
  isBusy: boolean;
  onBack: () => void;
  onSubmit: (reason: string) => void;
};

// Shown in place of the buttons after "Reject" or "Cancel": the last
// "are you sure?" and a place to tell the customer why. The reason is optional.
function DeclineForm({
  action,
  errorKey,
  isBusy,
  onBack,
  onSubmit,
}: DeclineFormProps) {
  const t = useT();
  const [reason, setReason] = useState("");

  return (
    <BottomBar>
      <span className="font-semibold">{t(DECLINE_TITLES[action])}</span>
      <TextArea
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        maxLength={MAX_REASON_LENGTH}
        placeholder={t("adminBooking.reasonPlaceholder")}
        rows={3}
        autoFocus
      />
      <span className="text-sm text-muted-foreground">
        {t("adminBooking.reasonHint")}
      </span>
      {errorKey !== null && <FormError>{t(errorKey)}</FormError>}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" disabled={isBusy} onClick={onBack}>
          {t("adminBooking.back")}
        </Button>
        <Button
          variant="destructive"
          disabled={isBusy}
          onClick={() => onSubmit(reason)}
        >
          {t(DECLINE_BUTTONS[action])}
        </Button>
      </div>
    </BottomBar>
  );
}
