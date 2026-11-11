import Link from "next/link";
import { BikePhoto } from "@/components/bike-photo";
import { ButtonLink } from "@/components/button";
import { PageTitle } from "@/components/page-title";
import { cheapestDemoPlan, DEMO_BIKES } from "@/lib/demo-data";

export default function BikesPage() {
  // TODO(slice 1.1): visible bikes from the API.
  const bikes = DEMO_BIKES.filter((bike) => bike.isVisible);
  const cheapestPlan = cheapestDemoPlan();

  return (
    <>
      <PageTitle>Выберите велосипед</PageTitle>
      {bikes.map((bike) => (
        <div
          key={bike.id}
          className="flex flex-col gap-2 rounded-xl border bg-card p-3 shadow-sm"
        >
          <Link href={`/bikes/${bike.id}`} className="active:opacity-70">
            <BikePhoto size="medium" />
          </Link>
          <div className="flex flex-col">
            <span className="font-medium">{bike.name}</span>
            <span className="text-sm text-muted-foreground">
              от {cheapestPlan.price} zł / {cheapestPlan.name.toLowerCase()}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <ButtonLink href={`/bikes/${bike.id}`} variant="secondary">
              Подробнее
            </ButtonLink>
            <ButtonLink href={`/bikes/${bike.id}/book`}>
              Забронировать
            </ButtonLink>
          </div>
        </div>
      ))}
    </>
  );
}
