"use client";

import { Check, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useSetCurrentUser } from "@/components/current-user";
import { PageTitle } from "@/components/page-title";
import { Section } from "@/components/section";
import { SupportContacts } from "@/components/support-contacts";
import { apiFetch } from "@/lib/api";
import type { Tables } from "@/lib/database.types";
import { LOCALE_NAMES, LOCALES } from "@/lib/i18n/locales";
import type { Locale } from "@/lib/i18n/locales";
import { useLocale, useT } from "@/lib/i18n/use-t";

// Opens from "Settings" in the mini app's ⋯ menu.
export default function SettingsPage() {
  const t = useT();
  const currentLocale = useLocale();
  const setCurrentUser = useSetCurrentUser();
  const [savingLocale, setSavingLocale] = useState<Locale | null>(null);
  const [hasFailed, setHasFailed] = useState(false);

  async function changeLocale(locale: Locale) {
    if (locale === currentLocale || savingLocale) {
      return;
    }

    setSavingLocale(locale);
    setHasFailed(false);
    try {
      const { user } = await apiFetch<{ user: Tables<"users"> }>("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      // The whole app switches language as soon as the user is replaced.
      setCurrentUser(user);
    } catch (error) {
      console.error(error);
      setHasFailed(true);
    } finally {
      setSavingLocale(null);
    }
  }

  return (
    <>
      <PageTitle>{t("settings.title")}</PageTitle>

      <Section title={t("settings.language")}>
        {LOCALES.map((locale) => (
          <LanguageRow
            key={locale}
            name={LOCALE_NAMES[locale]}
            isSelected={locale === currentLocale}
            isSaving={locale === savingLocale}
            onSelect={() => changeLocale(locale)}
          />
        ))}
      </Section>

      {hasFailed && (
        <p className="px-1 text-sm text-destructive">
          {t("settings.saveFailed")}
        </p>
      )}

      <SupportContacts />
    </>
  );
}

type LanguageRowProps = {
  name: string;
  isSelected: boolean;
  isSaving: boolean;
  onSelect: () => void;
};

function LanguageRow({
  name,
  isSelected,
  isSaving,
  onSelect,
}: LanguageRowProps) {
  let mark = null;
  if (isSaving) {
    mark = (
      <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
    );
  } else if (isSelected) {
    mark = <Check className="size-5" />;
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex min-h-14 items-center justify-between gap-3 px-4 py-3 text-left font-medium transition-colors active:bg-muted"
    >
      {name}
      {mark}
    </button>
  );
}
