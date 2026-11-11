import { writeFileSync } from "node:fs";
import { buildFallbackTasks } from "../lib/fallback";

const tasks = buildFallbackTasks(new Date());
writeFileSync("data/fallback-tasks.json", `${JSON.stringify(tasks, null, 2)}\n`);
console.log(`fallback tasks=${tasks.length}`);
