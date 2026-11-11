import { TITLE_PREFIX, STEPS, type StepTitle } from "../data/route";
import type { Contour } from "../data/people";
import { daysBetween } from "./dates";
import { parseDescription } from "./description";

export type Tone = "red" | "yellow" | "neutral";

export type PersonView = {
  id: string;
  name: string;
  contour: Contour;
  mentor: string | null;
  hasCheckIn: boolean;
  silence: number;
  living: boolean;
  early: boolean;
  stepIndex: number | null;
  stepTitle: StepTitle | null;
  url: string | null;
  badge: { tone: Tone; text: string };
  action: string | null;
};

export type FunnelStep = {
  title: StepTitle;
  reached: number;
  totalLeavers: number;
  breakCount: number;
  livingCount: number;
};

export type Board = {
  source: "bitrix" | "fallback";
  warning: string | null;
  headline: string;
  livingLine: string;
  steps: FunnelStep[];
  people: PersonView[];
};

type TaskInput = {
  id: string;
  title: string;
  description: string;
};

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle];
  return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

export function daysWord(count: number): string {
  const abs = Math.abs(count) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return "дней";
  if (last === 1) return "день";
  if (last >= 2 && last <= 4) return "дня";
  return "дней";
}

export function analyze(tasks: TaskInput[], today: string, origin: string | null): Board {
  const people = tasks.map((task) => toPerson(task, today, origin));
  const leavers = people.filter((person) => !person.living);
  const living = people.filter((person) => person.living);
  const early = leavers.filter((person) => person.early);
  const earlyMedian = median(early.map((person) => person.silence));

  const steps = STEPS.map((title, index) => ({
    title,
    reached: leavers.filter((person) => reached(person, index)).length,
    totalLeavers: leavers.length,
    breakCount: leavers.filter((person) => person.stepIndex === index).length,
    livingCount: living.filter((person) => person.stepIndex === index).length,
  }));

  const withBadges = people.map((person) => {
    const stepMedian =
      person.stepIndex === null ? null : median(silenceAt(leavers, person.stepIndex));
    return {
      ...person,
      badge: badge(person, stepMedian),
      action: person.living ? todayAction(person, stepMedian) : null,
    };
  });

  return {
    source: "bitrix",
    warning: null,
    headline: headline(leavers.length, early.length, earlyMedian),
    livingLine: `Сейчас в первые 90 дней ${living.length} ${noviceWord(living.length)}`,
    steps,
    people: withBadges,
  };
}

export function riskLine(step: FunnelStep, people: PersonView[]): string {
  const here = people.filter((person) => person.living && person.stepTitle === step.title);
  const head = `Сейчас на «${step.title}» ${countPeople(here.length)}.`;
  const stepMedian = median(
    people.filter((person) => !person.living && person.stepTitle === step.title).map((person) => person.silence),
  );
  const overdue = here
    .filter((person) => stepMedian !== null && person.silence >= stepMedian)
    .sort((left, right) => right.silence - left.silence);
  const first = overdue[0];
  if (!first || stepMedian === null) return head;
  return `${head} ${first.name.split(" ")[0]} молчит ${first.silence} ${daysWord(first.silence)} — дольше медианы обрыва.`;
}

function toPerson(task: TaskInput, today: string, origin: string | null): PersonView {
  const facts = parseDescription(task.description);
  const name = readName(task.title);
  const living = facts.left === null;
  const tenure = facts.left ? daysBetween(facts.start, facts.left) : daysBetween(facts.start, today);
  const stepIndex = facts.doneSteps.length < STEPS.length ? facts.doneSteps.length : null;
  return {
    id: task.id,
    name,
    contour: facts.contour,
    mentor: facts.mentor,
    hasCheckIn: facts.checkIn !== null,
    silence: silenceDays(facts, today),
    living,
    early: !living && tenure < 90,
    stepIndex,
    stepTitle: stepIndex === null ? null : STEPS[stepIndex],
    url: origin && /^\d+$/.test(task.id) ? `${origin}/company/personal/user/1/tasks/task/view/${task.id}/` : null,
    badge: { tone: "neutral", text: "" },
    action: null,
  };
}

function silenceDays(
  facts: { start: string; checkIn: string | null; left: string | null },
  today: string,
): number {
  if (facts.left) return daysBetween(facts.checkIn ?? facts.start, facts.left);
  return daysBetween(facts.checkIn ?? facts.start, today);
}

function reached(person: PersonView, index: number): boolean {
  return person.stepIndex === null || person.stepIndex > index;
}

function silenceAt(leavers: PersonView[], index: number): number[] {
  return leavers.filter((person) => person.stepIndex === index).map((person) => person.silence);
}

function badge(person: PersonView, stepMedian: number | null): { tone: Tone; text: string } {
  if (stepMedian === null) {
    return {
      tone: "neutral",
      text: `На этом шаге обрывов не было. Молчит ${person.silence} ${daysWord(person.silence)}`,
    };
  }
  if (!person.hasCheckIn) {
    return {
      tone: "red",
      text: `Чек-ина не было. ${person.silence} ${daysWord(person.silence)} при медиане ${stepMedian}`,
    };
  }
  if (person.silence >= stepMedian) {
    return {
      tone: "red",
      text: `Чек-ин был, но не помог. ${person.silence} из ${stepMedian} ${daysWord(stepMedian)}`,
    };
  }
  if (stepMedian - person.silence === 1) {
    return {
      tone: "yellow",
      text: `Чек-ин был. Приближается к медиане (${person.silence} из ${stepMedian} ${daysWord(stepMedian)})`,
    };
  }
  return {
    tone: "yellow",
    text: `Чек-ин был. Пока в пределах нормы (${person.silence} из ${stepMedian} ${daysWord(stepMedian)})`,
  };
}

function todayAction(person: PersonView, stepMedian: number | null): string {
  const mentor = person.mentor ?? "наставник не указан";
  if (stepMedian === null) {
    return `Наставник: ${mentor}. На этом шаге обрывов не было. Сегодня эскалация не нужна.`;
  }
  if (person.silence >= stepMedian) {
    return `Наставник: ${mentor}. Сегодня: провести 1:1, молчит уже дольше медианы обрыва.`;
  }
  if (stepMedian - person.silence === 1) {
    return `Наставник: ${mentor}. Сегодня: сверка, до медианы обрыва остался 1 день.`;
  }
  return `Наставник: ${mentor}. Сегодня: короткая сверка, молчание пока ниже медианы.`;
}

function headline(leaverCount: number, earlyCount: number, earlyMedian: number | null): string {
  const medianText =
    earlyMedian === null ? "" : ` Медиана молчания — ${earlyMedian} ${daysWord(earlyMedian)}.`;
  return `Из ${leaverCount} ${peopleWord(leaverCount)} ${earlyCount} сошли с дистанции до 3 месяцев.${medianText}`;
}

function countPeople(count: number): string {
  if (count === 2) return "двое";
  return `${count} ${peopleWord(count)}`;
}

function peopleWord(count: number): string {
  const abs = Math.abs(count) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return "человек";
  if (last === 1) return "человек";
  if (last >= 2 && last <= 4) return "человека";
  return "человек";
}

function noviceWord(count: number): string {
  const abs = Math.abs(count) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return "новичков";
  if (last === 1) return "новичок";
  if (last >= 2 && last <= 4) return "новичка";
  return "новичков";
}

function readName(title: string): string {
  const match = new RegExp(`^\\${TITLE_PREFIX}\\s+(.+?)\\s+·\\s+`).exec(title);
  return match?.[1] ?? title;
}
