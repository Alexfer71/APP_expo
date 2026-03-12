import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { loadBank, type Question } from "../../lib/bank";
import { recordAnswer } from "../../lib/progress";
import { loadStreak, recordStreakAnswer, resetStreak, type StreakState } from "../../lib/streak";

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function StreakScreen() {
  const [loading, setLoading] = useState(true);
  const [bank, setBank] = useState<Question[]>([]);
  const [current, setCurrent] = useState<Question | null>(null);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [status, setStatus] = useState<"correct" | "wrong" | null>(null);

  const [streak, setStreak] = useState<StreakState>({ currentStreak: 0, bestStreak: 0 });

  useEffect(() => {
    (async () => {
      const [b, s] = await Promise.all([loadBank(), loadStreak()]);
      setBank(b);
      setStreak(s);
      setCurrent(b.length ? pickRandom(b) : null);
      setLoading(false);
    })();
  }, []);

  async function onPick(idx: number) {
    if (!current) return;
    if (revealed) return;

    setSelectedIndex(idx);
    setRevealed(true);

    const ok = idx === current.answerIndex;
    setStatus(ok ? "correct" : "wrong");

    // 1) estadísticas globales
    await recordAnswer(current.id, ok);

    // 2) racha
    const newStreak = await recordStreakAnswer(ok);
    setStreak(newStreak);
  }

  function nextQuestion() {
    if (!bank.length) return;
    setCurrent(pickRandom(bank));
    setSelectedIndex(null);
    setRevealed(false);
    setStatus(null);
  }

  function retryAfterLose() {
    // Solo cambiamos de pregunta, la racha ya quedó en 0
    nextQuestion();
  }

  async function onResetStreak() {
    Alert.alert(
      "Reiniciar racha",
      "Esto pondrá tu racha actual y mejor racha en 0.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Reiniciar",
          style: "destructive",
          onPress: async () => {
            await resetStreak();
            const s = await loadStreak();
            setStreak(s);
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Cargando racha…</Text>
      </View>
    );
  }

  if (!current) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Modo racha</Text>
        <Text style={styles.text}>No hay preguntas guardadas.</Text>
        <Text style={styles.textSmall}>Ve a Banco y pega tu JSON.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={{ gap: 4 }}>
          <Text style={styles.title}>Modo racha</Text>
          <Text style={styles.subtitle}>
            Racha: <Text style={styles.bold}>{streak.currentStreak}</Text> • Mejor:{" "}
            <Text style={styles.bold}>{streak.bestStreak}</Text>
          </Text>
        </View>

        <Pressable onPress={onResetStreak} style={styles.smallButton}>
          <Text style={styles.smallButtonText}>Reset</Text>
        </Pressable>
      </View>

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

        {revealed && status === "correct" && (
          <Text style={styles.resultOk}>🔥 Correcto — racha +1</Text>
        )}

        {revealed && status === "wrong" && (
          <View style={styles.loseBox}>
            <Text style={styles.resultBad}>💥 Fallaste — racha reiniciada</Text>
            <Text style={styles.loseHint}>Intenta otra vez para volver a subir.</Text>
            <Pressable onPress={retryAfterLose} style={styles.buttonPrimary}>
              <Text style={styles.buttonText}>Volver a intentar</Text>
            </Pressable>
          </View>
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
        Reglas: aciertas = suma racha. fallas = racha vuelve a 0.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: "#0b0b0f",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: { color: "white", opacity: 0.8 },

  container: { flex: 1, padding: 16, gap: 10, backgroundColor: "#0b0b0f" },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },

  title: { fontSize: 26, fontWeight: "900", color: "white" },
  subtitle: { color: "white", opacity: 0.78 },
  bold: { fontWeight: "900" },

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

  resultOk: { color: "white", fontWeight: "900" },

  loseBox: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,120,120,0.35)",
    backgroundColor: "rgba(255,120,120,0.12)",
    gap: 8,
  },
  resultBad: { color: "white", fontWeight: "900" },
  loseHint: { color: "white", opacity: 0.75, fontSize: 12, lineHeight: 18 },

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

  smallButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  smallButtonText: { color: "white", fontWeight: "900", fontSize: 12 },

  text: { color: "white", opacity: 0.85, lineHeight: 20 },
  textSmall: { color: "white", opacity: 0.65, lineHeight: 18, fontSize: 12 },
  footer: { marginTop: 10, color: "white", opacity: 0.6, fontSize: 12 },
});
