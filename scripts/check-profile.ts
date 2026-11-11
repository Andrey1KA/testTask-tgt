import { getProfile, safeError } from "../lib/bitrix";
import { loadEnv } from "./load-env";

loadEnv();

async function main(): Promise<void> {
  try {
    const profile = await getProfile();
    const name = [profile.NAME, profile.LAST_NAME].filter(Boolean).join(" ");
    console.log(
      `OK id=${profile.ID} admin=${profile.ADMIN}${name ? ` name=${name}` : ""}`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Портал не ответил";
    console.error(`FAIL ${safeError(message)}`);
    process.exit(1);
  }
}

void main();
