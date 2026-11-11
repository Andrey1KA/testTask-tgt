import { getProfile, safeError } from "@/lib/bitrix";

export const dynamic = "force-dynamic";

export default async function Home() {
  const connection = await readConnection();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-sm uppercase tracking-wide text-slate-400">Новичок · первые 90 дней</p>
      <h1 className="mt-3 text-4xl font-semibold">Разбор обрыва маршрута</h1>
      <p className="mt-4 max-w-xl text-lg text-slate-300">
        Каркас подключён к тестовому порталу. Задачи адаптации ещё не создавались.
      </p>
      <section className="mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-sm uppercase tracking-wide text-slate-400">Портал</h2>
        {connection.ok ? (
          <p className="mt-3 text-lg">
            Отвечает администратор, id {connection.id}
            {connection.name ? `, ${connection.name}` : ""}.
          </p>
        ) : (
          <p className="mt-3 text-lg text-red-300">{connection.message}</p>
        )}
      </section>
    </main>
  );
}

async function readConnection(): Promise<
  { ok: true; id: string; name: string } | { ok: false; message: string }
> {
  try {
    const profile = await getProfile();
    return {
      ok: true,
      id: profile.ID,
      name: [profile.NAME, profile.LAST_NAME].filter(Boolean).join(" "),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Портал не ответил";
    return { ok: false, message: safeError(message) };
  }
}
