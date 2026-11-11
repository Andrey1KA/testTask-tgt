"use client";

import { useState } from "react";
import type { Board, PersonView } from "@/lib/analysis";
import { riskLine } from "@/lib/analysis";

export function BoardView({ board }: { board: Board }) {
  const breakStep = board.steps.findIndex((step) => step.breakCount > 0);
  const [stepIndex, setStepIndex] = useState(breakStep === -1 ? 0 : breakStep);
  const [mode, setMode] = useState<"left" | "risk">("left");
  const step = board.steps[stepIndex];
  const people = board.people
    .filter((person) => person.stepTitle === step.title)
    .filter((person) => (mode === "risk" ? person.living : !person.living))
    .sort((left, right) => right.silence - left.silence);
  const livingHere = board.people.filter((person) => person.living && person.stepTitle === step.title);

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <p className="text-sm text-stone-500">Новичок · первые 90 дней</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Разбор обрыва маршрута</h1>
      <p className="mt-4 text-xl leading-snug">{board.headline}</p>
      <p className="mt-2 text-stone-600">{board.livingLine}</p>
      {board.warning ? (
        <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950">
          {board.warning}
        </p>
      ) : (
        <p className="mt-4 text-sm text-stone-500">Цифры прочитаны из задач Битрикс24.</p>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-medium uppercase tracking-wide text-stone-500">Воронка маршрута</h2>
        <ol className="mt-3 space-y-2">
          {board.steps.map((item, index) => {
            const width = item.totalLeavers === 0 ? 0 : Math.round((item.reached / item.totalLeavers) * 100);
            const selected = index === stepIndex;
            return (
              <li key={item.title}>
                <div
                  className={`rounded-xl border px-3 py-3 ${selected ? "border-stone-900 bg-white" : "border-stone-200 bg-stone-50"}`}
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 text-left"
                    onClick={() => setStepIndex(index)}
                  >
                    <span className="font-medium">{item.title}</span>
                    <span className="text-sm text-stone-500">
                      дошли {item.reached} из {item.totalLeavers}
                    </span>
                  </button>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-200">
                    <div className="h-full rounded-full bg-stone-700" style={{ width: `${width}%` }} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.breakCount > 0 ? (
                      <button
                        type="button"
                        className="rounded-full bg-red-600 px-3 py-1 text-sm text-white"
                        onClick={() => {
                          setStepIndex(index);
                          setMode("left");
                        }}
                      >
                        Обрыв: {item.breakCount} чел.
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="rounded-full bg-sky-700 px-3 py-1 text-sm text-white"
                      onClick={() => {
                        setStepIndex(index);
                        setMode("risk");
                      }}
                    >
                      сейчас {item.livingCount}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="mt-8">
        <div className="flex gap-2">
          <ModeButton active={mode === "left"} onClick={() => setMode("left")}>
            Ушедшие на этом шаге
          </ModeButton>
          <ModeButton active={mode === "risk"} onClick={() => setMode("risk")}>
            Сейчас в зоне риска
          </ModeButton>
        </div>
        {mode === "risk" ? <p className="mt-4 text-lg">{riskLine(step, board.people)}</p> : null}
        {people.length === 0 ? (
          <EmptyStep living={livingHere} onOpen={() => setMode("risk")} />
        ) : (
          <ul className="mt-4 space-y-3">
            {people.map((person) => (
              <Card key={person.id} person={person} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function EmptyStep({ living, onOpen }: { living: PersonView[]; onOpen: () => void }) {
  if (living.length === 0) {
    return (
      <p className="mt-4 rounded-xl border border-dashed border-stone-300 px-4 py-6 text-stone-600">
        На этом шаге никто не оборвался, и сейчас здесь никого нет.
      </p>
    );
  }
  const names = living.map((person) => `${person.name}, молчит ${person.silence} ${day(person.silence)}`).join("; ");
  return (
    <p className="mt-4 rounded-xl border border-dashed border-stone-300 px-4 py-6 text-stone-700">
      На этом шаге никто не оборвался. Сейчас здесь {names}.{" "}
      <button type="button" className="underline" onClick={onOpen}>
        Открыть живую карточку
      </button>
    </p>
  );
}

function Card({ person }: { person: PersonView }) {
  const tone =
    person.badge.tone === "red"
      ? "bg-red-50 text-red-900"
      : person.badge.tone === "yellow"
        ? "bg-amber-50 text-amber-950"
        : "bg-stone-100 text-stone-700";
  return (
    <li className="rounded-2xl border border-stone-200 bg-white p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-lg font-medium">{person.name}</h3>
        <span className="text-sm text-stone-500">{person.contour}</span>
      </div>
      <p className={`mt-3 rounded-lg px-3 py-2 text-sm ${tone}`}>{person.badge.text}</p>
      {person.action ? <p className="mt-3 text-sm">{person.action}</p> : null}
      {person.url ? (
        <a className="mt-3 inline-block text-sm underline" href={person.url} target="_blank" rel="noreferrer">
          Открыть в Битрикс24
        </a>
      ) : null}
    </li>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm ${active ? "bg-stone-900 text-white" : "bg-white text-stone-700 ring-1 ring-stone-300"}`}
    >
      {children}
    </button>
  );
}

function day(count: number): string {
  const abs = Math.abs(count) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return "дней";
  if (last === 1) return "день";
  if (last >= 2 && last <= 4) return "дня";
  return "дней";
}
