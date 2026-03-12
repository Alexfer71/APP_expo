import type { Question } from "./bank";

/**
 * Elige una pregunta random evitando repetir la anterior (comparando por id).
 * - Si hay 1 sola pregunta, inevitablemente repetirá.
 */
export function pickRandomNotSameById(
  questions: Question[],
  current: Question | null
): Question {
  if (questions.length === 0) throw new Error("No questions");
  if (questions.length === 1) return questions[0];

  const currentId = current?.id;
  const pool = currentId ? questions.filter((q) => q.id !== currentId) : questions;
  const list = pool.length ? pool : questions;

  return list[Math.floor(Math.random() * list.length)];
}
