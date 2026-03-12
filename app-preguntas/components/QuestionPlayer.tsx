// components/QuestionPlayer.tsx
import { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import type { Question } from "../lib/bank";
import { recordAnswer } from "../lib/progress";

type Props = {
  questions: Question[];
  modeLabel: string;

  // ✅ Ahora recibe el current para evitar repetir la anterior
  pickNext: (questions: Question[], current: Question | null) => Question;

  onEmpty?: () => void;
};

export default function QuestionPlayer({ questions, modeLabel, pickNext, onEmpty }: Props) {
  const [current, setCurrent] = useState<Question | null>(() =>
    questions.length ? pickNext(questions, null) : null
  );

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [lastResult, setLastResult] = useState<"correct" | "wrong" | null>(null);

  const hasQuestions = questions.length > 0;

  const isCorrect = useMemo(() => {
    if (!current || selectedIndex === null) return false;
    return selectedIndex === current.answerIndex;
  }, [current, selectedIndex]);

  async function onPick(index: number) {
    if (!current) return;
    if (revealed) return;

    setSelectedIndex(index);
    setRevealed(true);

    const ok = index === current.answerIndex;
    setLastResult(ok ? "correct" : "wrong");

    // Guardamos progreso global
    await recordAnswer(current.id, ok);
  }

  function nextQuestion() {
    if (!hasQuestions) return;

    const next = pickNext(questions, current);
    setCurrent(next);
    setSelectedIndex(null);
    setRevealed(false);
    setLastResult(null);
  }

  if (!current) {
    onEmpty?.();
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{modeLabel}</Text>
        <Text style={styles.text}>No hay preguntas para mostrar.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{modeLabel}</Text>
      <Text style={styles.subtitle}>
        {current.topic ? `Tema: ${current.topic}` : "Modo práctica"}
      </Text>

      <View style={styles.card}>
        <Text style={styles.question}>{current.question}</Text>

        <View style={styles.options}>
          {current.options.map((opt, idx) => {
            const chosen = selectedIndex === idx;
            const correct = current.answerIndex === idx;

            const show = revealed;
            const border =
              show && correct
                ? styles.optCorrectBorder
                : show && chosen && !correct
                ? styles.optWrongBorder
                : styles.optBorder;

            const bg =
              show && correct
                ? styles.optCorrectBg
                : show && chosen && !correct
                ? styles.optWrongBg
                : styles.optBg;

            return (
              <Pressable
                key={`${current.id}_${idx}`}
                onPress={() => onPick(idx)}
                style={({ pressed }) => [
                  styles.option,
                  border,
                  bg,
                  pressed && !revealed ? styles.pressed : null,
                ]}
              >
                <Text style={styles.optionText}>{opt}</Text>
              </Pressable>
            );
          })}
        </View>

        {revealed && (
          <Text style={styles.result}>
            {lastResult === "correct" ? "✅ Correcto" : "❌ Incorrecto"}
          </Text>
        )}

        <View style={styles.row}>
          <Pressable
            onPress={nextQuestion}
            disabled={!revealed}
            style={[styles.buttonPrimary, !revealed && { opacity: 0.5 }]}
          >
            <Text style={styles.buttonText}>Siguiente</Text>
          </Pressable>

          <Pressable onPress={nextQuestion} style={styles.buttonGhost}>
            <Text style={styles.buttonText}>Saltar</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.footer}>
        “Siguiente” se activa después de responder. “Saltar” no cuenta.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 10, backgroundColor: "#0b0b0f" },
  title: { fontSize: 26, fontWeight: "900", color: "white" },
  subtitle: { color: "white", opacity: 0.75 },

  card: {
    marginTop: 10,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.06)",
    gap: 12,
  },
  question: { color: "white", fontSize: 18, fontWeight: "900", lineHeight: 24 },
  options: { gap: 10, marginTop: 4 },

  option: { borderRadius: 14, paddingVertical: 12, paddingHorizontal: 12, borderWidth: 1 },
  optBorder: { borderColor: "rgba(255,255,255,0.15)" },
  optBg: { backgroundColor: "rgba(0,0,0,0.22)" },

  optCorrectBorder: { borderColor: "rgba(120,255,160,0.5)" },
  optCorrectBg: { backgroundColor: "rgba(120,255,160,0.12)" },

  optWrongBorder: { borderColor: "rgba(255,120,120,0.55)" },
  optWrongBg: { backgroundColor: "rgba(255,120,120,0.12)" },

  pressed: { transform: [{ scale: 0.99 }], opacity: 0.92 },
  optionText: { color: "white", fontWeight: "800" },

  result: { color: "white", fontWeight: "900", marginTop: 2 },

  row: { flexDirection: "row", gap: 10, marginTop: 6 },
  buttonPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  buttonGhost: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  buttonText: { color: "white", fontWeight: "900" },

  text: { color: "white", opacity: 0.85 },
  footer: { marginTop: 10, color: "white", opacity: 0.6, fontSize: 12 },
});
