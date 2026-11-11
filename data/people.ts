import { STEPS, TITLE_PREFIX, type StepTitle } from "./route";

export type Contour = "магазин" | "склад" | "продажи" | "офис";

export type PersonSpec = {
  name: string;
  contour: Contour;
  /** Сколько первых пунктов чеклиста закрыто. Остальные открыты. */
  doneSteps: number;
  start: string | { daysAgo: number };
  checkIn: string | { daysAgo: number } | null;
  left: string | null;
  mentor?: string;
};

export const PEOPLE: PersonSpec[] = [
  {
    name: "Марина Соколова",
    contour: "магазин",
    doneSteps: 2,
    start: "2026-06-20",
    checkIn: "2026-07-26",
    left: "2026-08-01",
  },
  {
    name: "Илья Пахомов",
    contour: "магазин",
    doneSteps: 2,
    start: "2026-06-01",
    checkIn: "2026-07-12",
    left: "2026-07-15",
  },
  {
    name: "Олег Белов",
    contour: "склад",
    doneSteps: 2,
    start: "2026-07-01",
    checkIn: "2026-09-02",
    left: "2026-09-10",
  },
  {
    name: "Кирилл Демин",
    contour: "продажи",
    doneSteps: 2,
    start: "2026-05-01",
    checkIn: null,
    left: "2026-05-15",
  },
  {
    name: "Елена Широкова",
    contour: "офис",
    doneSteps: 2,
    start: "2026-03-01",
    checkIn: "2026-04-14",
    left: "2026-04-20",
  },
  {
    name: "Анна Котова",
    contour: "магазин",
    doneSteps: 5,
    start: "2025-08-01",
    checkIn: "2025-12-18",
    left: "2025-12-20",
  },
  {
    name: "Сергей Минин",
    contour: "магазин",
    doneSteps: 5,
    start: "2025-06-01",
    checkIn: "2026-01-08",
    left: "2026-01-10",
  },
  {
    name: "Дарья Волкова",
    contour: "магазин",
    doneSteps: 5,
    start: "2025-09-01",
    checkIn: "2026-01-03",
    left: "2026-01-05",
  },
  {
    name: "Павел Гусев",
    contour: "склад",
    doneSteps: 5,
    start: "2025-05-01",
    checkIn: "2025-10-30",
    left: "2025-11-01",
  },
  {
    name: "Никита Ершов",
    contour: "склад",
    doneSteps: 5,
    start: "2025-03-01",
    checkIn: "2025-12-26",
    left: "2025-12-28",
  },
  {
    name: "Алина Морозова",
    contour: "продажи",
    doneSteps: 5,
    start: "2025-07-01",
    checkIn: "2025-12-08",
    left: "2025-12-10",
  },
  {
    name: "Роман Сафин",
    contour: "продажи",
    doneSteps: 5,
    start: "2025-04-01",
    checkIn: "2025-11-29",
    left: "2025-12-01",
  },
  {
    name: "Ольга Белых",
    contour: "продажи",
    doneSteps: 5,
    start: "2025-01-10",
    checkIn: "2026-02-13",
    left: "2026-02-15",
  },
  {
    name: "Игорь Цветков",
    contour: "офис",
    doneSteps: 5,
    start: "2025-08-15",
    checkIn: "2025-12-23",
    left: "2025-12-25",
  },
  {
    name: "Татьяна Яшина",
    contour: "офис",
    doneSteps: 5,
    start: "2025-05-20",
    checkIn: "2025-12-28",
    left: "2025-12-30",
  },
  {
    name: "Пётр Назаров",
    contour: "магазин",
    doneSteps: 2,
    start: { daysAgo: 20 },
    checkIn: { daysAgo: 5 },
    left: null,
    mentor: "директор магазина",
  },
  {
    name: "Василий Орлов",
    contour: "склад",
    doneSteps: 2,
    start: { daysAgo: 30 },
    checkIn: { daysAgo: 8 },
    left: null,
    mentor: "старший смены",
  },
  {
    name: "Нина Кравцова",
    contour: "офис",
    doneSteps: 3,
    start: { daysAgo: 45 },
    checkIn: { daysAgo: 1 },
    left: null,
    mentor: "руководитель офиса",
  },
];

export function personTitle(person: Pick<PersonSpec, "name" | "contour">): string {
  return `${TITLE_PREFIX} ${person.name} · ${person.contour}`;
}

export function openStep(doneSteps: number): StepTitle | null {
  return STEPS[doneSteps] ?? null;
}
