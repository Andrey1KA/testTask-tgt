import assert from "node:assert/strict";
import test from "node:test";
import { daysAgo, daysBetween } from "./dates";
import { formatDescription, parseDescription } from "./description";

test("описание Марины читается обратно", () => {
  const source = {
    contour: "магазин" as const,
    start: "2026-06-20",
    checkIn: "2026-07-26",
    left: "2026-08-01",
    mentor: null,
    doneSteps: [],
  };
  const parsed = parseDescription(formatDescription(source));
  assert.deepEqual(parsed, source);
  assert.equal(daysBetween(parsed.checkIn!, parsed.left!), 6);
  assert.equal(daysBetween(parsed.start, parsed.left!), 42);
});

test("без чек-ина строка не пишется", () => {
  const parsed = parseDescription(
    formatDescription({
      contour: "продажи",
      start: "2026-05-01",
      checkIn: null,
      left: "2026-05-15",
      mentor: null,
      doneSteps: ["Инструктаж", "Стажировка"],
    }),
  );
  assert.equal(parsed.checkIn, null);
  assert.equal(daysBetween(parsed.start, parsed.left!), 14);
});

test("живой новичок считается от сегодняшнего дня", () => {
  const today = new Date(2026, 10, 12);
  assert.equal(daysAgo(5, today), "2026-11-07");
  assert.equal(daysBetween(daysAgo(5, today), "2026-11-12"), 5);
  assert.equal(daysBetween(daysAgo(8, today), "2026-11-12"), 8);
  assert.equal(daysBetween(daysAgo(1, today), "2026-11-12"), 1);
});
