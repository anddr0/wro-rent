import { BikeForm } from "@/components/admin/bike-form";
import { BottomBar } from "@/components/bottom-bar";
import { Button } from "@/components/button";
import { PageTitle } from "@/components/page-title";

export default function NewBikePage() {
  return (
    <>
      <PageTitle>Новый велосипед</PageTitle>
      <BikeForm />
      <BottomBar>
        <Button>Добавить</Button>
      </BottomBar>
    </>
  );
}
