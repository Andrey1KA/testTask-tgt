import { PEOPLE, personTitle, type PersonSpec } from "../data/people";
import { STEPS } from "../data/route";
import { daysAgo } from "./dates";
import { formatDescription } from "./description";

export type FallbackTask = {
  id: string;
  title: string;
  description: string;
};

export function buildFallbackTasks(today: Date): FallbackTask[] {
  return PEOPLE.map((person, index) => ({
    id: `fallback-${index + 1}`,
    title: personTitle(person),
    description: formatDescription({
      contour: person.contour,
      start: asDate(person.start, today),
      checkIn: person.checkIn === null ? null : asDate(person.checkIn, today),
      left: person.left,
      mentor: person.mentor ?? null,
      doneSteps: STEPS.slice(0, person.doneSteps),
    }),
  }));
}

function asDate(value: string | { daysAgo: number }, today: Date): string {
  return typeof value === "string" ? value : daysAgo(value.daysAgo, today);
}

export function doneStepCount(person: PersonSpec): number {
  return person.doneSteps;
}
