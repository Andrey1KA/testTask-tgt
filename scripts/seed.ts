import { PEOPLE, personTitle, type PersonSpec } from "../data/people";
import { STEPS } from "../data/route";
import {
  addChecklist,
  addTask,
  completeChecklistItem,
  completeTask,
  getChecklist,
  getTask,
  listNoviceTasks,
  renewTask,
  startTask,
  updateDescription,
} from "../lib/bitrix-tasks";
import { addDays, daysAgo } from "../lib/dates";
import { formatDescription, parseDescription } from "../lib/description";
import { safeError } from "../lib/bitrix";
import { loadEnv } from "./load-env";

loadEnv();

async function main(): Promise<void> {
  const existing = await listNoviceTasks();
  const titles = new Set(existing.map((task) => task.title));
  if (existing.length >= PEOPLE.length) {
    console.log(`Уже есть ${existing.length} задач новичков. Ничего не создаю.`);
    return;
  }

  let closeLeavers = true;
  let checklist = true;
  const probe = PEOPLE[0];
  if (!titles.has(personTitle(probe))) {
    const probed = await plantProbe(probe);
    closeLeavers = probed.closeLeavers;
    checklist = probed.checklist;
    titles.add(personTitle(probe));
  } else {
    const probed = await readExistingProbe(existing.find((task) => task.title === personTitle(probe))!.id, probe);
    closeLeavers = probed.closeLeavers;
    checklist = probed.checklist;
  }

  let created = 0;
  for (const person of PEOPLE) {
    const title = personTitle(person);
    if (titles.has(title)) {
      if (!checklist) {
        const existingTask = existing.find((task) => task.title === title);
        if (existingTask) await ensureStepsInText(existingTask.id, person);
      }
      continue;
    }
    await plant(person, person.left !== null && closeLeavers, checklist);
    titles.add(title);
    created += 1;
    console.log(`создана ${title}`);
  }

  const after = await listNoviceTasks();
  console.log(
    `Готово. В портале ${after.length} задач, в этом запуске создано ${created}. Ушедших закрываем: ${closeLeavers ? "да" : "нет, уход только в тексте"}.`,
  );
}

async function readExistingProbe(
  taskId: string,
  person: PersonSpec,
): Promise<{ closeLeavers: boolean; checklist: boolean }> {
  try {
    const items = await getChecklist(taskId);
    console.log(`Первая задача уже есть, пунктов чек-листа: ${items.length}.`);
    return { closeLeavers: items.length === STEPS.length, checklist: items.length > 0 };
  } catch (error) {
    const message = error instanceof Error ? error.message : "чек-лист недоступен";
    await ensureStepsInText(taskId, person);
    console.log(`Первая задача уже есть. Чек-лист недоступен (${safeError(message)}), шаги в тексте.`);
    return { closeLeavers: false, checklist: false };
  }
}

async function ensureStepsInText(taskId: string, person: PersonSpec): Promise<void> {
  const stored = await getTask(taskId);
  if (stored.description.includes("Пройдено:")) return;
  await updateDescription(taskId, formatDescription(resolve(person, doneTitles(person))));
}

async function plantProbe(person: PersonSpec): Promise<{ closeLeavers: boolean; checklist: boolean }> {
  try {
    const id = await plant(person, true, true);
    const items = await getChecklist(id);
    const open = items.filter((item) => !item.done).map((item) => item.title);
    const readable = items.length === STEPS.length && open[0] === "Самостоятельная смена";
    console.log(`Проба: пунктов ${items.length}, открытые: ${open.join(", ") || "нет"}.`);
    if (readable) return { closeLeavers: true, checklist: true };
    console.log("Проба: закрытая задача не сохранила открытый пункт. Статус «Завершена» больше не ставлю.");
    await renewTask(id);
    return { closeLeavers: false, checklist: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "чек-лист недоступен";
    const tasks = await listNoviceTasks();
    const created = tasks.find((task) => task.title === personTitle(person));
    if (!created) throw error;
    const facts = resolve(person, doneTitles(person));
    await updateDescription(created.id, formatDescription(facts));
    await renewTask(created.id).catch(() => undefined);
    console.log(`Проба: чек-лист недоступен (${safeError(message)}). Шаги пишу в текст задачи.`);
    return { closeLeavers: false, checklist: false };
  }
}

async function plant(person: PersonSpec, complete: boolean, checklist: boolean): Promise<string> {
  const facts = resolve(person, checklist ? [] : doneTitles(person));
  const id = await addTask({
    title: personTitle(person),
    description: formatDescription(facts),
    deadline: addDays(facts.start, 90),
  });
  if (checklist) {
    const items = await addChecklist(id);
    for (const item of items.slice(0, person.doneSteps)) {
      await completeChecklistItem(id, item.id);
    }
  }
  if (complete) {
    try {
      await completeTask(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "статус не сменился";
      console.log(`Статус «Завершена» не поставился (${safeError(message)}). Уход остаётся в тексте.`);
    }
  } else if (person.left === null) {
    await startTask(id).catch(() => undefined);
  }

  const stored = await getTask(id);
  const parsed = parseDescription(stored.description);
  if (parsed.start !== facts.start || parsed.left !== facts.left || parsed.checkIn !== facts.checkIn) {
    throw new Error(`Описание «${person.name}» прочиталось не так, как записано`);
  }
  return id;
}

function doneTitles(person: PersonSpec): string[] {
  return STEPS.slice(0, person.doneSteps);
}

function resolve(person: PersonSpec, doneSteps: string[] = []) {
  const asDate = (value: string | { daysAgo: number } | null) => {
    if (value === null) return null;
    return typeof value === "string" ? value : daysAgo(value.daysAgo);
  };
  return {
    contour: person.contour,
    start: asDate(person.start)!,
    checkIn: asDate(person.checkIn),
    left: asDate(person.left),
    mentor: person.mentor ?? null,
    doneSteps,
  };
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Посев остановился";
  const cause =
    error instanceof Error && error.cause instanceof Error
      ? `${error.cause.name}: ${error.cause.message}`
      : "";
  console.error(`FAIL ${safeError(message)}${cause ? ` (${safeError(cause)})` : ""}`);
  process.exit(1);
});
