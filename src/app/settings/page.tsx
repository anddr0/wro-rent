import { Check } from "lucide-react";
import { PageTitle } from "@/components/page-title";
import { Row, Section } from "@/components/section";

const LANGUAGES = ["Polski", "English", "Українська", "Русский"];

// Opens from "Settings" in the mini app's ⋯ menu.
export default function SettingsPage() {
  return (
    <>
      <PageTitle>Настройки</PageTitle>
      {/* TODO(slice 0.3): switch and save the language. */}
      <Section title="Язык">
        {LANGUAGES.map((language) => (
          <Row
            key={language}
            title={language}
            end={language === "Русский" && <Check className="size-5" />}
          />
        ))}
      </Section>
    </>
  );
}
