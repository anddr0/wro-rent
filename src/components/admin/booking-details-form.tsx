"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BottomBar } from "@/components/bottom-bar";
import { Button } from "@/components/button";
import { Chip } from "@/components/chip";
import { Field, TextArea, TextInput } from "@/components/form";
import { FormError } from "@/components/form-error";
import { PageTitle } from "@/components/page-title";
import { SectionTitle } from "@/components/section";
import { Switch } from "@/components/switch";
import type {
  AdminBooking,
  AdminBookingResponse,
  BookingDetailsUpdate,
  PaymentMethod,
} from "@/lib/admin-bookings";
import { parseAmount } from "@/lib/amounts";
import { apiSendJson } from "@/lib/api";
import type { MessageKey } from "@/lib/i18n/messages/ru";
import { useLocale, useT } from "@/lib/i18n/use-t";
import { OFFERED_PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from "@/lib/payments";
import { formatDateTime } from "@/lib/rental-time";
import { refreshApi } from "@/lib/use-api";

// The part of a booking an admin edits by hand: price, deposit, payment, note.
export function BookingDetailsForm({ booking }: { booking: AdminBooking }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();

  // Amounts are kept as typed text, so "70," can be typed on the way to "70,5".
  const [price, setPrice] = useState(String(booking.price));
  const [deposit, setDeposit] = useState(
    booking.deposit === null ? "" : String(booking.deposit),
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    booking.paymentMethod,
  );
  const [isPaid, setIsPaid] = useState(booking.paidAt !== null);
  const [note, setNote] = useState(booking.adminNote ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);

  const isPriceChanged = parseAmount(price) !== booking.price;

  async function save() {
    const newPrice = parseAmount(price);
    if (newPrice === null) {
      setErrorKey("adminBooking.priceInvalid");
      return;
    }

    let newDeposit: number | null = null;
    if (deposit.trim() !== "") {
      newDeposit = parseAmount(deposit);
      if (newDeposit === null) {
        setErrorKey("adminBooking.depositInvalid");
        return;
      }
    }

    const update: BookingDetailsUpdate = {
      price: newPrice,
      deposit: newDeposit,
      paymentMethod,
      isPaid,
      adminNote: note,
    };

    setIsSaving(true);
    setErrorKey(null);
    try {
      await apiSendJson<AdminBookingResponse>(
        "PATCH",
        `/api/admin/bookings/${booking.id}`,
        update,
      );
      await refreshApi("/api/admin");
      router.back();
    } catch (error) {
      console.error(error);
      setErrorKey("common.saveFailed");
    } finally {
      setIsSaving(false);
    }
  }

  function togglePaymentMethod(method: PaymentMethod) {
    // Tapping the picked method again clears it.
    if (method === paymentMethod) {
      setPaymentMethod(null);
    } else {
      setPaymentMethod(method);
    }
  }

  let paidHint: string | undefined;
  if (booking.paidAt) {
    paidHint = formatDateTime(booking.paidAt, locale);
  }

  return (
    <>
      <PageTitle description={booking.customer.fullName}>
        {booking.bike.name}
      </PageTitle>

      <Field label={t("adminBooking.priceField")}>
        <TextInput
          inputMode="decimal"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
        />
      </Field>
      {isPriceChanged && (
        <p className="-mt-4 px-1 text-sm text-muted-foreground">
          {t("adminBooking.priceChangeHint")}
        </p>
      )}

      <Field label={t("adminBooking.depositField")}>
        <TextInput
          inputMode="decimal"
          value={deposit}
          onChange={(event) => setDeposit(event.target.value)}
          placeholder={t("adminBooking.depositPlaceholder")}
        />
      </Field>

      <section className="flex flex-col gap-2">
        <SectionTitle>{t("adminBooking.paymentMethod")}</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {OFFERED_PAYMENT_METHODS.map((method) => (
            <Chip
              key={method}
              label={t(PAYMENT_METHOD_LABELS[method])}
              isSelected={method === paymentMethod}
              onSelect={() => togglePaymentMethod(method)}
            />
          ))}
        </div>
      </section>

      <Switch
        label={t("adminBooking.paid")}
        description={paidHint}
        isOn={isPaid}
        onChange={setIsPaid}
      />

      <Field label={t("adminBooking.note")}>
        <TextArea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={1000}
          placeholder={t("adminBooking.notePlaceholder")}
          rows={4}
        />
      </Field>

      <BottomBar>
        {errorKey !== null && <FormError>{t(errorKey)}</FormError>}
        <Button onClick={save} disabled={isSaving}>
          {t("common.save")}
        </Button>
      </BottomBar>
    </>
  );
}
