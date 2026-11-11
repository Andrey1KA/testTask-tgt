import assert from "node:assert/strict";
import test from "node:test";
import { analyze, riskLine } from "./analysis";
import { buildFallbackTasks } from "./fallback";

const today = new Date(2026, 10, 12);
const board = analyze(
  buildFallbackTasks(today),
  "2026-11-12",
  "https://portal.example",
);

test("фраза и доля ровно треть", () => {
  assert.equal(
    board.headline,
    "Из 15 человек 5 сошли с дистанции до 3 месяцев. Медиана молчания — 6 дней.",
  );
  assert.equal(board.livingLine, "Сейчас в первые 90 дней 3 новичка");
});

test("воронка шагов", () => {
  const reached = board.steps.map((step) => step.reached);
  const breaks = board.steps.map((step) => step.breakCount);
  const living = board.steps.map((step) => step.livingCount);
  assert.deepEqual(reached, [15, 15, 10, 10, 10]);
  assert.deepEqual(breaks, [0, 0, 5, 0, 0]);
  assert.deepEqual(living, [0, 0, 2, 1, 0]);
});

test("бейджи ранней трети и живых", () => {
  const text = (name: string) => board.people.find((person) => person.name === name)?.badge.text;
  assert.match(text("Марина Соколова") ?? "", /Чек-ин был, но не помог\. 6 из 6/);
  assert.match(text("Илья Пахомов") ?? "", /Пока в пределах нормы \(3 из 6/);
  assert.match(text("Кирилл Демин") ?? "", /Чек-ина не было\. 14 дней при медиане 6/);
  assert.match(text("Пётр Назаров") ?? "", /Приближается к медиане \(5 из 6/);
  assert.match(text("Василий Орлов") ?? "", /Чек-ин был, но не помог\. 8 из 6/);
  assert.match(text("Нина Кравцова") ?? "", /На этом шаге обрывов не было\. Молчит 1 день/);
});

test("зона риска ставит Василия выше Петра", () => {
  const step = board.steps[2];
  const living = board.people
    .filter((person) => person.living && person.stepTitle === step.title)
    .sort((left, right) => right.silence - left.silence);
  assert.deepEqual(
    living.map((person) => person.name),
    ["Василий Орлов", "Пётр Назаров"],
  );
  assert.match(riskLine(step, board.people), /двое\. Василий молчит 8 дней/);
  assert.match(board.people.find((person) => person.name === "Василий Орлов")?.action ?? "", /провести 1:1/);
  assert.match(board.people.find((person) => person.name === "Пётр Назаров")?.action ?? "", /остался 1 день/);
  assert.equal(board.people.find((person) => person.name === "Илья Пахомов")?.action, null);
});
