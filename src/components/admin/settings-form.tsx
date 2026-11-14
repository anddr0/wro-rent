"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BottomBar } from "@/components/bottom-bar";
import { Button } from "@/components/button";
import { Field, Select, TextInput } from "@/components/form";
import { FormError } from "@/components/form-error";
import { SectionTitle } from "@/components/section";
import { Switch } from "@/components/switch";
import { apiSendJson } from "@/lib/api";
import type { MessageKey } from "@/lib/i18n/messages/ru";
import { useT } from "@/lib/i18n/use-t";
import {
  formatMinuteOfDay,
  listMinutesOfDay,
  parseTelegramUsername,
} from "@/lib/settings";
import type { AdminSettingsResponse, RentalSettings } from "@/lib/settings";
import { refreshApi } from "@/lib/use-api";

// Opening hours and the contact for customers.
export function SettingsForm({ settings }: { settings: RentalSettings }) {
  const t = useT();
  const router = useRouter();

  const [isRoundTheClock, setIsRoundTheClock] = useState(
    settings.isRoundTheClock,
  );
  const [firstStartMinute, setFirstStartMinute] = useState(
    settings.firstStartMinute,
  );
  const [lastStartMinute, setLastStartMinute] = useState(
    settings.lastStartMinute,
  );
  const [supportUsername, setSupportUsername] = useState(
    settings.supportUsername ?? "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);

  async function save() {
    if (!isRoundTheClock && firstStartMinute > lastStartMinute) {
      setErrorKey("adminSettings.hoursInvalid");
      return;
    }

    // An empty field means "no contact".
    let username: string | null = null;
    if (supportUsername.trim() !== "") {
      username = parseTelegramUsername(supportUsername);
      if (username === null) {
        setErrorKey("adminSettings.contactInvalid");
        return;
      }
    }

    const newSettings: RentalSettings = {
      firstStartMinute,
      lastStartMinute,
      isRoundTheClock,
      supportUsername: username,
    };

    setIsSaving(true);
    setErrorKey(null);
    try {
      await apiSendJson<AdminSettingsResponse>(
        "PATCH",
        "/api/admin/settings",
        newSettings,
      );
      // This form, the contact buttons and the calendars of all bikes.
      await refreshApi("/api/admin/settings");
      await refreshApi("/api/settings");
      await refreshApi("/api/bikes");
      router.back();
    } catch (error) {
      console.error(error);
      setErrorKey("common.saveFailed");
    } finally {
      setIsSaving(false);
    }
  }

  const minutes = listMinutesOfDay();

  return (
    <>
      <section className="flex flex-col gap-2">
        <SectionTitle>{t("adminSettings.hours")}</SectionTitle>
        <Switch
          label={t("adminSettings.roundTheClock")}
          description={t("adminSettings.roundTheClockHint")}
          isOn={isRoundTheClock}
          onChange={setIsRoundTheClock}
        />

        {!isRoundTheClock && (
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("adminSettings.firstStart")}>
              <Select
                value={firstStartMinute}
                onChange={(event) =>
                  setFirstStartMinute(Number(event.target.value))
                }
              >
                {minutes.map((minute) => (
                  <option key={minute} value={minute}>
                    {formatMinuteOfDay(minute)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("adminSettings.lastStart")}>
              <Select
                value={lastStartMinute}
                onChange={(event) =>
                  setLastStartMinute(Number(event.target.value))
                }
              >
                {minutes.map((minute) => (
                  <option key={minute} value={minute}>
                    {formatMinuteOfDay(minute)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        )}
        <p className="px-1 text-sm text-muted-foreground">
          {t("adminSettings.hoursHint")}
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <SectionTitle>{t("adminSettings.contact")}</SectionTitle>
        <TextInput
          value={supportUsername}
          onChange={(event) => setSupportUsername(event.target.value)}
          placeholder="@username"
          autoCapitalize="none"
          autoCorrect="off"
          aria-label={t("adminSettings.contact")}
        />
        <p className="px-1 text-sm text-muted-foreground">
          {t("adminSettings.contactHint")}
        </p>
      </section>

      <BottomBar>
        {errorKey !== null && <FormError>{t(errorKey)}</FormError>}
        <Button onClick={save} disabled={isSaving}>
          {t("common.save")}
        </Button>
      </BottomBar>
    </>
  );
}
