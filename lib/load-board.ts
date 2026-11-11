import { readFileSync } from "node:fs";
import path from "node:path";
import { analyze, type Board } from "./analysis";
import { webhookBase, safeError } from "./bitrix";
import { listNoviceTasks } from "./bitrix-tasks";
import type { FallbackTask } from "./fallback";

export async function loadBoard(today = new Date()): Promise<Board> {
  const iso = formatDay(today);
  try {
    const tasks = await listNoviceTasks();
    if (tasks.length === 0) throw new Error("В портале нет задач новичков");
    return { ...analyze(tasks, iso, portalOrigin()), source: "bitrix" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Портал не ответил";
    try {
      const fallback = JSON.parse(
        readFileSync(path.join(process.cwd(), "data", "fallback-tasks.json"), "utf8"),
      ) as FallbackTask[];
      return {
        ...analyze(fallback, iso, null),
        source: "fallback",
        warning: `Портал не ответил, показаны запасные данные. ${safeError(message)}`,
      };
    } catch (fallbackError) {
      const reason = fallbackError instanceof Error ? fallbackError.message : "запасной файл не открылся";
      return {
        ...analyze([], iso, null),
        source: "fallback",
        warning: `Портал не ответил, запасные данные тоже не открылись. ${safeError(message)}. ${safeError(reason)}`,
      };
    }
  }
}

function portalOrigin(): string | null {
  try {
    return new URL(webhookBase()).origin;
  } catch {
    return null;
  }
}

function formatDay(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
