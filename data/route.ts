export const STEPS = [
  "Инструктаж",
  "Стажировка",
  "Самостоятельная смена",
  "Сдача зачёта",
  "Успешная адаптация",
] as const;

export type StepTitle = (typeof STEPS)[number];

export const NOVICE_TAG = "новичок";
export const TITLE_PREFIX = "[НОВИЧОК]";
