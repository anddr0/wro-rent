"use client";

import { useParams } from "next/navigation";
import { BikePhoto } from "@/components/bike-photo";
import { ButtonLink } from "@/components/button";
import { NotFoundText } from "@/components/not-found-text";
import { PageTitle } from "@/components/page-title";
import { Row, Section } from "@/components/section";
import { DEMO_PLANS, findDemoBike } from "@/lib/demo-data";

export default function BikePage() {
  const { id } = useParams<{ id: string }>();
  // TODO(slice 1.2): the bike and active plans from the API.
  const bike = findDemoBike(id);
  const plans = DEMO_PLANS.filter((plan) => plan.isActive);

  if (!bike) {
    return <NotFoundText>Велосипед не найден</NotFoundText>;
  }

  return (
    <>
      <BikePhoto size="large" />
      {/* TODO(slice 1.3): swipeable photos instead of thumbnails. */}
      <div className="flex gap-2">
        <BikePhoto size="small" />
        <BikePhoto size="small" />
        <BikePhoto size="small" />
      </div>

      <PageTitle>{bike.name}</PageTitle>
      <p>{bike.description}</p>

      <Section title="Цены">
        {plans.map((plan) => (
          <Row
            key={plan.id}
            title={plan.name}
            subtitle={plan.duration}
            end={<span className="font-medium">{plan.price} zł</span>}
          />
        ))}
      </Section>

      <ButtonLink href={`/bikes/${bike.id}/book`}>Забронировать</ButtonLink>
    </>
  );
}
