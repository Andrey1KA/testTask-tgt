"use client";

import { useState } from "react";
import type { Board, PersonView } from "@/lib/analysis";
import { daysWord, riskLine } from "@/lib/analysis";

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
  const leaverCount = board.steps[0]?.totalLeavers ?? 0;
  const earlyCount = board.people.filter((person) => person.early).length;
  const livingCount = board.people.filter((person) => person.living).length;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
      <header className="overflow-hidden rounded-[28px] bg-stone-950 text-stone-50 shadow-xl shadow-stone-900/10">
        <div className="px-6 py-7 sm:px-8 sm:py-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">Новичок · первые 90 дней</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Разбор обрыва маршрута</h1>
          <p className="mt-4 max-w-3xl text-xl leading-snug text-stone-100 sm:text-2xl">{board.headline}</p>
          <p className="mt-4 text-sm text-stone-300">{board.livingLine}</p>
          {board.warning ? (
            <p className="mt-5 rounded-2xl border border-amber-300/40 bg-amber-200 px-4 py-3 text-sm text-amber-950">
              {board.warning}
            </p>
          ) : (
            <p className="mt-5 text-sm text-stone-400">Цифры прочитаны из задач Битрикс24.</p>
          )}
        </div>
        <dl className="grid border-t border-white/10 sm:grid-cols-3">
          <Stat value={String(leaverCount)} label="ушли и попали в разбор" />
          <Stat value={String(earlyCount)} label="сошли до 3 месяцев" />
          <Stat value={String(livingCount)} label="сейчас в первые 90 дней" />
        </dl>
      </header>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
        <section className="rounded-[28px] border border-stone-200/80 bg-white/80 p-4 shadow-sm sm:p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Воронка маршрута</h2>
          <ol className="mt-4 space-y-2">
            {board.steps.map((item, index) => {
              const total = item.totalLeavers || 1;
              const reachedWidth = Math.round((item.reached / total) * 100);
              const breakWidth = Math.round((item.breakCount / total) * 100);
              const selected = index === stepIndex;
              const breakOn = selected && mode === "left";
              const riskOn = selected && mode === "risk";
              const breakChip = selected
                ? breakOn
                  ? "bg-red-400/25 text-red-100 ring-1 ring-red-300/50"
                  : "bg-transparent text-red-200/80 ring-1 ring-red-300/25"
                : "bg-red-50 text-red-900 ring-1 ring-red-200";
              const livingChip =
                item.livingCount === 0
                  ? selected
                    ? "bg-white/10 text-stone-400 ring-1 ring-white/10"
                    : "bg-white text-stone-500 ring-1 ring-stone-200"
                  : selected
                    ? riskOn
                      ? "bg-sky-300/20 text-sky-100 ring-1 ring-sky-200/40"
                      : "bg-transparent text-sky-200/80 ring-1 ring-sky-200/25"
                    : "bg-sky-50 text-sky-950 ring-1 ring-sky-200";
              return (
                <li
                  key={item.title}
                  className={`relative cursor-pointer rounded-2xl border px-3 py-3 transition ${
                    selected ? "border-stone-950 bg-stone-950 text-stone-50 shadow-md" : "border-transparent bg-stone-100/80"
                  }`}
                  onClick={() => setStepIndex(index)}
                >
                    <div className="flex items-start justify-between gap-3 text-left">
                      <span className="flex min-w-0 items-baseline gap-3">
                        <span className={`text-xs font-semibold tabular-nums ${selected ? "text-stone-500" : "text-stone-400"}`}>
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="font-semibold">{item.title}</span>
                      </span>
                      <span className={`shrink-0 text-sm tabular-nums ${selected ? "text-stone-300" : "text-stone-500"}`}>
                        дошли {item.reached} из {item.totalLeavers}
                      </span>
                    </div>
                    <div className={`mt-3 h-2.5 overflow-hidden rounded-full ${selected ? "bg-white/10" : "bg-stone-200"}`}>
                      <div className="flex h-full">
                        <div className={`h-full ${selected ? "bg-stone-300" : "bg-stone-800"}`} style={{ width: `${reachedWidth}%` }} />
                        {item.breakCount > 0 ? (
                          <div className={`h-full ${selected ? "bg-red-300/80" : "bg-red-400"}`} style={{ width: `${breakWidth}%` }} />
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.breakCount > 0 ? (
                        <button
                          type="button"
                          className={`rounded-full px-3 py-1 text-sm font-medium ${breakChip}`}
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
                        className={`rounded-full px-3 py-1 text-sm font-medium ${livingChip}`}
                        onClick={() => {
                          setStepIndex(index);
                          setMode("risk");
                        }}
                      >
                        сейчас {item.livingCount}
                      </button>
                    </div>
                </li>
              );
            })}
          </ol>
          <p className="mt-4 text-xs leading-relaxed text-stone-500">
            Залитая часть полосы — кто дошёл до шага. Красная — кто оборвался здесь.
          </p>
        </section>

        <section className="rounded-[28px] border border-stone-200/80 bg-white p-4 shadow-sm sm:p-6 lg:sticky lg:top-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Шаг {stepIndex + 1} · {step.title}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-stone-100 p-1">
            <ModeButton active={mode === "left"} onClick={() => setMode("left")}>
              Ушедшие на этом шаге
            </ModeButton>
            <ModeButton active={mode === "risk"} onClick={() => setMode("risk")}>
              Сейчас в зоне риска
            </ModeButton>
          </div>
          {mode === "risk" ? (
            <p className="mt-4 rounded-2xl bg-stone-950 px-4 py-3 text-sm leading-relaxed text-stone-50">
              {riskLine(step, board.people)}
            </p>
          ) : null}
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
      </div>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-white/10 px-6 py-4 sm:px-8 sm:py-5 [&:not(:last-child)]:border-b sm:[&:not(:last-child)]:border-r sm:[&:not(:last-child)]:border-b-0">
      <dt className="text-xs text-stone-400">{label}</dt>
      <dd className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">{value}</dd>
    </div>
  );
}

function EmptyStep({ living, onOpen }: { living: PersonView[]; onOpen: () => void }) {
  if (living.length === 0) {
    return (
      <p className="mt-4 rounded-2xl border border-dashed border-stone-300 px-4 py-8 text-center text-sm leading-relaxed text-stone-600">
        На этом шаге никто не оборвался, и сейчас здесь никого нет.
      </p>
    );
  }
  const names = living.map((person) => `${person.name}, молчит ${person.silence} ${daysWord(person.silence)}`).join("; ");
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-sm leading-relaxed text-stone-700">
      <p>На этом шаге никто не оборвался. Сейчас здесь {names}.</p>
      <button
        type="button"
        className="mt-3 rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white"
        onClick={onOpen}
      >
        Открыть живую карточку
      </button>
    </div>
  );
}

function Card({ person }: { person: PersonView }) {
  const tone =
    person.badge.tone === "red"
      ? "border-red-200 bg-red-50 text-red-950"
      : person.badge.tone === "yellow"
        ? "border-amber-200 bg-amber-50 text-amber-950"
        : "border-stone-200 bg-stone-100 text-stone-700";
  const stripe =
    person.badge.tone === "red" ? "bg-red-600" : person.badge.tone === "yellow" ? "bg-amber-500" : "bg-stone-300";
  return (
    <li className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
      <div className="flex">
        <div className={`w-1.5 shrink-0 ${stripe}`} />
        <div className="min-w-0 flex-1 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold tracking-tight">{person.name}</h3>
              <p className="mt-1 text-sm text-stone-500">{person.contour}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold tabular-nums leading-none">{person.silence}</p>
              <p className="mt-1 text-xs text-stone-500">
                {daysWord(person.silence)} {person.living ? "молчит" : "молчания"}
              </p>
            </div>
          </div>
          <p className={`mt-3 rounded-xl border px-3 py-2 text-sm leading-relaxed ${tone}`}>{person.badge.text}</p>
          {person.action ? <p className="mt-3 text-sm leading-relaxed text-stone-700">{person.action}</p> : null}
          {person.url ? (
            <a
              className="mt-3 inline-flex text-sm font-medium text-stone-950 underline decoration-stone-300 underline-offset-4"
              href={person.url}
              target="_blank"
              rel="noreferrer"
            >
              Открыть в Битрикс24
            </a>
          ) : null}
        </div>
      </div>
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
      className={`rounded-xl px-3 py-2 text-sm font-medium leading-tight ${
        active ? "bg-stone-950 text-white shadow-sm" : "text-stone-600"
      }`}
    >
      {children}
    </button>
  );
}
