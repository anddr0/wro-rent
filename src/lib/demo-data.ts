// Made-up data for the skeleton screens (slice 0.2), so they look like the
// wireframes before there is an API. Each slice replaces its part with real
// data; delete this file when nothing imports it anymore.
import type { Enums } from "@/lib/database.types";

export type DemoBike = {
  id: string;
  name: string;
  description: string;
  isVisible: boolean;
  // "у клиента до 14 дек", or null when the bike is free.
  busyUntil: string | null;
};

export type DemoPlan = {
  id: string;
  name: string;
  duration: string;
  price: number;
  isActive: boolean;
};

export type DemoBooking = {
  id: string;
  bikeName: string;
  customerName: string;
  customerUsername: string;
  planName: string;
  startsAt: string;
  endsAt: string;
  price: number;
  status: Enums<"booking_status">;
  comment: string | null;
};

export const DEMO_BIKES: DemoBike[] = [
  {
    id: "city-1",
    name: "Городской #1",
    description:
      "Удобный городской велосипед: 7 скоростей, корзина, фонари. Подходит для роста 160–190 см.",
    isVisible: true,
    busyUntil: null,
  },
  {
    id: "electro-1",
    name: "Электро #1",
    description: "Электровелосипед, запас хода до 60 км. Зарядка в комплекте.",
    isVisible: true,
    busyUntil: "14 дек",
  },
  {
    id: "city-2",
    name: "Городской #2",
    description: "Лёгкий городской велосипед с одной скоростью.",
    isVisible: false,
    busyUntil: null,
  },
];

export const DEMO_PLANS: DemoPlan[] = [
  { id: "day", name: "День", duration: "1 день", price: 70, isActive: true },
  {
    id: "week",
    name: "Неделя",
    duration: "7 дней",
    price: 220,
    isActive: true,
  },
  {
    id: "month",
    name: "Месяц",
    duration: "1 месяц",
    price: 500,
    isActive: true,
  },
];

export const DEMO_BOOKINGS: DemoBooking[] = [
  {
    id: "b1",
    bikeName: "Электро #1",
    customerName: "Олег Петров",
    customerUsername: "oleg_p",
    planName: "Неделя",
    startsAt: "7 дек 10:00",
    endsAt: "14 дек 10:00",
    price: 220,
    status: "pending",
    comment: "Нужен замок",
  },
  {
    id: "b2",
    bikeName: "Городской #2",
    customerName: "Marta Nowak",
    customerUsername: "marta_n",
    planName: "День",
    startsAt: "9 дек 12:00",
    endsAt: "10 дек 12:00",
    price: 70,
    status: "confirmed",
    comment: null,
  },
  {
    id: "b3",
    bikeName: "Городской #1",
    customerName: "Ivan Kowalski",
    customerUsername: "ivan_k",
    planName: "Неделя",
    startsAt: "1 дек 10:00",
    endsAt: "8 дек 10:00",
    price: 220,
    status: "active",
    comment: null,
  },
  {
    id: "b4",
    bikeName: "Городской #1",
    customerName: "Олег Петров",
    customerUsername: "oleg_p",
    planName: "Месяц",
    startsAt: "1 окт 10:00",
    endsAt: "1 ноя 10:00",
    price: 500,
    status: "completed",
    comment: null,
  },
  {
    id: "b5",
    bikeName: "Электро #1",
    customerName: "Marta Nowak",
    customerUsername: "marta_n",
    planName: "День",
    startsAt: "20 сен 09:00",
    endsAt: "21 сен 09:00",
    price: 70,
    status: "cancelled",
    comment: null,
  },
];

const CURRENT_STATUSES: Enums<"booking_status">[] = [
  "pending",
  "confirmed",
  "active",
];

export function isCurrentBooking(booking: DemoBooking): boolean {
  return CURRENT_STATUSES.includes(booking.status);
}

export function findDemoBike(id: string): DemoBike | undefined {
  return DEMO_BIKES.find((bike) => bike.id === id);
}

export function findDemoBooking(id: string): DemoBooking | undefined {
  return DEMO_BOOKINGS.find((booking) => booking.id === id);
}

// Price "from" in the catalog: the cheapest active plan.
export function cheapestDemoPlan(): DemoPlan {
  const activePlans = DEMO_PLANS.filter((plan) => plan.isActive);
  let cheapest = activePlans[0];
  for (const plan of activePlans) {
    if (plan.price < cheapest.price) {
      cheapest = plan;
    }
  }
  return cheapest;
}
