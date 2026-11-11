import { analyze } from "../lib/analysis";
import { getTask, listNoviceTasks, updateDescription } from "../lib/bitrix-tasks";
import { isoDate } from "../lib/dates";
import { loadEnv } from "./load-env";

loadEnv();

function breakAtShift(tasks: { id: string; title: string; description: string }[]): number {
  const board = analyze(tasks, isoDate(new Date()), null);
  return board.steps.find((step) => step.title === "Самостоятельная смена")?.breakCount ?? -1;
}

async function main(): Promise<void> {
  const before = await listNoviceTasks();
  const initial = breakAtShift(before);
  const marina = before.find((task) => task.title.includes("Марина Соколова"));
  if (!marina) throw new Error("Марина не найдена");
  const original = (await getTask(marina.id)).description;
  const changed = original.replace(
    "Пройдено: Инструктаж; Стажировка",
    "Пройдено: Инструктаж; Стажировка; Самостоятельная смена",
  );
  if (changed === original) throw new Error("Строка прохождения не найдена");

  try {
    await updateDescription(marina.id, changed);
    const middle = breakAtShift(await listNoviceTasks());
    console.log(`before=${initial} after-edit=${middle}`);
    if (middle !== initial - 1) throw new Error("Обрыв не уменьшился после правки описания");
  } finally {
    await updateDescription(marina.id, original);
  }

  const restored = breakAtShift(await listNoviceTasks());
  console.log(`restored=${restored}`);
  if (restored !== initial) throw new Error("Описание Марины не вернулось");
}

void main();
