export type BitrixProfile = {
  ID: string;
  ADMIN: boolean;
  NAME: string;
  LAST_NAME: string;
};

type BitrixError = {
  error?: string | { code?: string; message?: string };
  error_description?: string;
};

export function webhookBase(): string {
  const raw = process.env.BITRIX_WEBHOOK_BASE?.trim();
  if (!raw) {
    throw new Error("BITRIX_WEBHOOK_BASE не задан");
  }
  return raw.replace(/\/+$/, "");
}

export function safeError(message: string): string {
  return message.replace(/https?:\/\/\S+/g, "[скрыто]");
}

let lastCallAt = 0;

async function throttle(): Promise<void> {
  const wait = lastCallAt + 400 - Date.now();
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastCallAt = Date.now();
}

export function apiBase(): string {
  return webhookBase().replace("/rest/", "/rest/api/");
}

function portalError(payload: BitrixError, status: number): string {
  if (typeof payload.error === "string") {
    if (payload.error === "insufficient_scope") {
      return "У вебхука нет права на этот метод.";
    }
    return payload.error_description || payload.error;
  }
  if (payload.error && typeof payload.error === "object") {
    const code = payload.error.code ?? "";
    if (code.includes("INSUFFICIENTSCOPE")) return "У вебхука нет права на этот метод.";
    return payload.error.message || code || `Портал ответил ${status}`;
  }
  return payload.error_description || `Портал ответил ${status}`;
}

export async function bitrixCall<T>(
  method: string,
  body?: unknown,
  version: "legacy" | "v3" = "legacy",
): Promise<T> {
  await throttle();
  const root = version === "v3" ? apiBase() : webhookBase();
  const request = () =>
    fetch(`${root}/${method}`, {
      method: body ? "POST" : "GET",
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(40_000),
    });

  let response: Response | null = null;
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      response = await request();
      break;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  if (!response) throw lastError;

  let payload: BitrixError & { result?: T };
  try {
    payload = (await response.json()) as BitrixError & { result?: T };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "не JSON";
    throw new Error(safeError(`Портал вернул не JSON: ${reason}`));
  }
  if (!response.ok || payload.error) {
    throw new Error(safeError(portalError(payload, response.status)));
  }
  return payload.result as T;
}

export function getProfile(): Promise<BitrixProfile> {
  return bitrixCall<BitrixProfile>("profile");
}
