import { Archive } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageTitle } from "@/components/page-title";

// TODO(slice 5.4): archived bikes, with a button to bring each one back.
export default function ArchivedBikesPage() {
  return (
    <>
      <PageTitle>Архив</PageTitle>
      <EmptyState
        icon={Archive}
        title="Архив пуст"
        description="Сюда попадают велосипеды, которые больше не сдаются. Их история броней сохраняется."
      />
    </>
  );
}
