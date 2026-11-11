export type BitrixProfile = {
  ID: string;
  ADMIN: boolean;
  NAME: string;
  LAST_NAME: string;
};

type BitrixError = {
  error?: string;
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

export async function bitrixCall<T>(method: string, body?: unknown): Promise<T> {
  const response = await fetch(`${webhookBase()}/${method}`, {
    method: body ? "POST" : "GET",
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });

  const payload = (await response.json()) as BitrixError & { result?: T };
  if (!response.ok || payload.error) {
    throw new Error(
      safeError(payload.error_description || payload.error || `Портал ответил ${response.status}`),
    );
  }
  return payload.result as T;
}

export function getProfile(): Promise<BitrixProfile> {
  return bitrixCall<BitrixProfile>("profile");
}
