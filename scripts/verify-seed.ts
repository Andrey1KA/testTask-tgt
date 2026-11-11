import { PEOPLE, personTitle } from "../data/people";
import { STEPS } from "../data/route";
import { listNoviceTasks } from "../lib/bitrix-tasks";
import { daysAgo, daysBetween, isoDate } from "../lib/dates";
import { parseDescription } from "../lib/description";
import { loadEnv } from "./load-env";

loadEnv();

async function main(): Promise<void> {
const today = isoDate(new Date());
const tasks = await listNoviceTasks();
const byTitle = new Map(tasks.map((task) => [task.title, task]));
let problems = 0;

for (const person of PEOPLE) {
  const task = byTitle.get(personTitle(person));
  if (!task) {
    console.log(`НЕТ ${person.name}`);
    problems += 1;
    continue;
  }
  const facts = parseDescription(task.description);
  const start = typeof person.start === "string" ? person.start : daysAgo(person.start.daysAgo);
  const checkIn =
    person.checkIn === null
      ? null
      : typeof person.checkIn === "string"
        ? person.checkIn
        : daysAgo(person.checkIn.daysAgo);
  const left = person.left;
  const expectedDone = STEPS.slice(0, person.doneSteps).join("; ");
  const actualDone = facts.doneSteps.join("; ");
  const silence =
    left && checkIn
      ? daysBetween(checkIn, left)
      : left
        ? daysBetween(start, left)
        : checkIn
          ? daysBetween(checkIn, today)
          : null;
  const ok =
    facts.start === start &&
    facts.checkIn === checkIn &&
    facts.left === left &&
    facts.contour === person.contour &&
    actualDone === expectedDone;
  if (!ok) problems += 1;
  console.log(
    `${ok ? "OK" : "BAD"} ${person.name} шаг=${facts.doneSteps.length} молчание=${silence} статус=${task.status}`,
  );
}

console.log(`tasks=${tasks.length} problems=${problems}`);
if (problems > 0) process.exit(1);
}

void main();
