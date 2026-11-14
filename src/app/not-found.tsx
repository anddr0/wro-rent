"use client";

import { ButtonLink } from "@/components/button";
import { NotFoundText } from "@/components/not-found-text";
import { useT } from "@/lib/i18n/use-t";

// An address the app doesn't have, e.g. an old link from a bot message.
export default function NotFoundPage() {
  const t = useT();

  return (
    <>
      <NotFoundText>{t("common.pageNotFound")}</NotFoundText>
      <ButtonLink href="/" replace>
        {t("sent.toHome")}
      </ButtonLink>
    </>
  );
}
