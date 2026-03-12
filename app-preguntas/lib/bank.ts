import AsyncStorage from "@react-native-async-storage/async-storage";

export type Question = {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  topic?: string;
};

const BANK_KEY = "BANK_QUESTIONS_V1";

export async function saveBank(questions: Question[]) {
  await AsyncStorage.setItem(BANK_KEY, JSON.stringify(questions));
}

export async function loadBank(): Promise<Question[]> {
  const raw = await AsyncStorage.getItem(BANK_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as Question[];
}

export async function clearBank() {
  await AsyncStorage.removeItem(BANK_KEY);
}

/** Hash simple (determinista) para generar ids estables sin librerías */
function hashString(input: string) {
  let h = 2166136261; // FNV-ish
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // unsigned + base36 corta
  return (h >>> 0).toString(36);
}

function stableIdFromQuestion(q: {
  question: string;
  options: string[];
  answerIndex: number;
  topic?: string;
}) {
  // Normaliza espacios y casing para evitar ids diferentes por detalles mínimos
  const normalized = JSON.stringify({
    question: q.question.trim(),
    options: q.options.map((o) => o.trim()),
    answerIndex: q.answerIndex,
    topic: q.topic?.trim() ?? "",
  });
  return `q_${hashString(normalized)}`;
}

/**
 * Valida y normaliza el JSON pegado por el usuario.
 * - Debe ser array
 * - question string, options array>=2 de strings, answerIndex int válido
 * - id: si no viene, se genera estable por contenido
 */
export function parseQuestionsJson(input: string): Question[] {
  let data: unknown;

  try {
    data = JSON.parse(input);
  } catch {
    throw new Error("El texto no es JSON válido.");
  }

  if (!Array.isArray(data)) {
    throw new Error('El JSON debe ser un ARRAY de preguntas: [ { ... }, { ... } ]');
  }

  const out: Question[] = data.map((item: any, idx: number) => {
    const question = item?.question;
    const options = item?.options;
    const answerIndex = item?.answerIndex;

    if (typeof question !== "string" || question.trim().length === 0) {
      throw new Error(`Pregunta #${idx + 1}: falta "question" (string).`);
    }

    if (
      !Array.isArray(options) ||
      options.length < 2 ||
      !options.every((o: any) => typeof o === "string")
    ) {
      throw new Error(`Pregunta #${idx + 1}: "options" debe ser array de strings (mínimo 2).`);
    }

    if (typeof answerIndex !== "number" || !Number.isInteger(answerIndex)) {
      throw new Error(`Pregunta #${idx + 1}: "answerIndex" debe ser entero.`);
    }

    if (answerIndex < 0 || answerIndex >= options.length) {
      throw new Error(
        `Pregunta #${idx + 1}: "answerIndex" fuera de rango (0 a ${options.length - 1}).`
      );
    }

    const normalizedQuestion = question.trim();
    const normalizedOptions = options.map((s: string) => s.trim());
    const normalizedTopic = typeof item?.topic === "string" ? item.topic.trim() : undefined;

    // ✅ id: si viene y es string no vacía, úsalo; si no, genera uno estable por contenido
    const id =
      typeof item?.id === "string" && item.id.trim().length > 0
        ? item.id.trim()
        : stableIdFromQuestion({
            question: normalizedQuestion,
            options: normalizedOptions,
            answerIndex,
            topic: normalizedTopic,
          });

    return {
      id,
      question: normalizedQuestion,
      options: normalizedOptions,
      answerIndex,
      topic: normalizedTopic,
    };
  });

  // Evitar IDs duplicados (puede pasar si hay preguntas idénticas)
  const seen = new Set<string>();
  for (const q of out) {
    if (seen.has(q.id)) {
      throw new Error(
        `ID duplicado detectado: "${q.id}". (Probablemente tienes preguntas idénticas.)`
      );
    }
    seen.add(q.id);
  }

  return out;
}
