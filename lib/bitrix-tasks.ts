import { NOVICE_TAG, STEPS } from "../data/route";
import { bitrixCall } from "./bitrix";

export type PortalTask = {
  id: string;
  title: string;
  description: string;
  status: string;
};

export type ChecklistItem = {
  id: string;
  title: string;
  done: boolean;
};

type ItemResult = {
  item?: Record<string, unknown>;
  items?: Array<Record<string, unknown>>;
};

export async function listNoviceTasks(): Promise<PortalTask[]> {
  const result = await bitrixCall<ItemResult>("tasks.task.list", {
    select: ["id", "title", "description", "status"],
    order: { id: "ASC" },
    pagination: { limit: 50 },
  }, "v3");
  return (result.items ?? []).map(toPortalTask).filter((task) => task.title.startsWith("[НОВИЧОК]"));
}

export async function getTask(taskId: string): Promise<PortalTask> {
  const result = await bitrixCall<ItemResult>("tasks.task.get", {
    id: Number(taskId),
    select: ["id", "title", "description", "status"],
  }, "v3");
  return toPortalTask(result.item ?? {});
}

export async function addTask(input: {
  title: string;
  description: string;
  deadline: string;
}): Promise<string> {
  const result = await bitrixCall<ItemResult>("tasks.task.add", {
    fields: {
      title: input.title,
      description: input.description,
      creatorId: 1,
      responsibleId: 1,
      deadline: `${input.deadline}T18:00:00+05:00`,
    },
  }, "v3");
  const id = result.item?.id;
  if (id === undefined) throw new Error("Портал не вернул id задачи");
  return String(id);
}

export async function updateDescription(taskId: string, description: string): Promise<void> {
  await bitrixCall("tasks.task.update", {
    id: Number(taskId),
    fields: { description },
  }, "v3");
}

export async function addChecklist(taskId: string): Promise<ChecklistItem[]> {
  const items: ChecklistItem[] = [];
  for (const [index, title] of STEPS.entries()) {
    const result = await bitrixCall<number | { id?: number; ID?: number }>(
      "task.checklistitem.add",
      {
        TASKID: Number(taskId),
        FIELDS: { TITLE: title, SORT_INDEX: (index + 1) * 10, IS_COMPLETE: "N" },
      },
      "v3",
    );
    const id = typeof result === "number" ? result : (result.id ?? result.ID);
    if (id === undefined) throw new Error(`Портал не вернул пункт «${title}»`);
    items.push({ id: String(id), title, done: false });
  }
  return items;
}

export async function completeChecklistItem(taskId: string, itemId: string): Promise<void> {
  await bitrixCall("task.checklistitem.complete", {
    TASKID: Number(taskId),
    ITEMID: Number(itemId),
  }, "v3");
}

export async function getChecklist(taskId: string): Promise<ChecklistItem[]> {
  const result = await bitrixCall<unknown>("task.checklistitem.getlist", {
    TASKID: Number(taskId),
  }, "v3");
  return unwrapList(result).map((row) => ({
    id: String(row.ID ?? row.id ?? ""),
    title: String(row.TITLE ?? row.title ?? ""),
    done: row.IS_COMPLETE === "Y" || row.IS_COMPLETE === true || row.isComplete === "Y",
  }));
}

export async function completeTask(taskId: string): Promise<void> {
  await bitrixCall("tasks.task.complete", { id: Number(taskId) }, "v3");
}

export async function renewTask(taskId: string): Promise<void> {
  await bitrixCall("tasks.task.renew", { id: Number(taskId) }, "v3");
}

export async function startTask(taskId: string): Promise<void> {
  await bitrixCall("tasks.task.start", { id: Number(taskId) }, "v3");
}

function unwrapList(result: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(result)) return result as Array<Record<string, unknown>>;
  if (result && typeof result === "object") {
    const record = result as Record<string, unknown>;
    for (const key of ["items", "checklist"]) {
      if (Array.isArray(record[key])) return record[key] as Array<Record<string, unknown>>;
    }
  }
  return [];
}

function toPortalTask(row: Record<string, unknown>): PortalTask {
  return {
    id: String(row.id ?? row.ID ?? ""),
    title: String(row.title ?? row.TITLE ?? ""),
    description: String(row.description ?? row.DESCRIPTION ?? ""),
    status: String(row.status ?? row.STATUS ?? ""),
  };
}

export const NOVICE_MARKER = NOVICE_TAG;
