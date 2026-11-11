import type { Contour } from "../data/people";

export type TaskFacts = {
  contour: Contour;
  start: string;
  checkIn: string | null;
  left: string | null;
  mentor: string | null;
  doneSteps: string[];
};

export function formatDescription(facts: TaskFacts): string {
  const lines = [`Контур: ${facts.contour}`, `Дата выхода: ${facts.start}`];
  if (facts.checkIn) lines.push(`Последний чек-ин: ${facts.checkIn}`);
  if (facts.left) lines.push(`Дата ухода: ${facts.left}`);
  if (facts.mentor) lines.push(`Наставник: ${facts.mentor}`);
  if (facts.doneSteps.length > 0) lines.push(`Пройдено: ${facts.doneSteps.join("; ")}`);
  return lines.join("\n");
}

export function parseDescription(text: string): TaskFacts {
  const contour = read(text, /^Контур:\s*(магазин|склад|продажи|офис)\s*$/m, "Контур");
  const start = read(text, /^Дата выхода:\s*(\d{4}-\d{2}-\d{2})\s*$/m, "Дата выхода");
  return {
    contour: contour as Contour,
    start,
    checkIn: readOptional(text, /^Последний чек-ин:\s*(\d{4}-\d{2}-\d{2})\s*$/m),
    left: readOptional(text, /^Дата ухода:\s*(\d{4}-\d{2}-\d{2})\s*$/m),
    mentor: readOptional(text, /^Наставник:\s*(.+?)\s*$/m),
    doneSteps: (readOptional(text, /^Пройдено:\s*(.+?)\s*$/m) ?? "")
      .split(";")
      .map((step) => step.trim())
      .filter(Boolean),
  };
}

function read(text: string, pattern: RegExp, label: string): string {
  const value = readOptional(text, pattern);
  if (!value) throw new Error(`В описании нет строки «${label}»`);
  return value;
}

function readOptional(text: string, pattern: RegExp): string | null {
  return pattern.exec(text)?.[1] ?? null;
}
