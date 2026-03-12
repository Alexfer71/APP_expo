import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, ScrollView } from "react-native";
import { loadBank, type Question } from "../../lib/bank";
import { recordAnswer } from "../../lib/progress";
import { shuffle, take } from "../../lib/shuffle";
import { router } from "expo-router";

const EXAM_SIZE = 160;

export default function ExamScreen() {
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  // ids falladas en ESTE simulacro (para resumen)
  const [wrongThisExam, setWrongThisExam] = useState<string[]>([]);

  const current = exam[index] ?? null;
  const total = exam.length;

  useEffect(() => {
    (async () => {
      const bank = await loadBank();
      if (bank.length === 0) {
        setExam([]);
        setLoading(false);
        return;
      }
      const picked = take(shuffle(bank), EXAM_SIZE);
      setExam(picked);
      setLoading(false);
    })();
  }, []);

  const progressText = useMemo(() => {
    if (!total) return "";
    return `${index + 1} / ${total}`;
  }, [index, total]);

  async function onPick(optIndex: number) {
    if (!current) return;
    if (revealed) return;

    setSelectedIndex(optIndex);
    setRevealed(true);

    const ok = optIndex === current.answerIndex;

    // Guardar progreso global (stats + wrongIds)
    await recordAnswer(current.id, ok);

    if (ok) setCorrectCount((c) => c + 1);
    else {
      setWrongCount((w) => w + 1);
      setWrongThisExam((prev) => (prev.includes(current.id) ? prev : [...prev, current.id]));
    }
  }

  function next() {
    if (!total) return;

    // si ya terminó
    if (index >= total - 1) {
      Alert.alert("Simulacro terminado", "Revisa tu resultado abajo.");
      return;
    }

    setIndex((i) => i + 1);
    setSelectedIndex(null);
    setRevealed(false);
  }

  function finishNow() {
    Alert.alert(
      "Finalizar simulacro",
      "¿Seguro? Se mostrará el resultado con lo respondido hasta ahora.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Finalizar", style: "destructive", onPress: () => setIndex(total - 1) },
      ]
    );
  }

  function restart() {
    Alert.alert("Nuevo simulacro", "Se generará otro set aleatorio.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Generar",
        onPress: async () => {
          setLoading(true);
          setIndex(0);
          setSelectedIndex(null);
          setRevealed(false);
          setCorrectCount(0);
          setWrongCount(0);
          setWrongThisExam([]);

          const bank = await loadBank();
          const picked = take(shuffle(bank), EXAM_SIZE);
          setExam(picked);
          setLoading(false);
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Preparando simulacro…</Text>
      </View>
    );
  }

  if (!current) {
    return (
      <View style={styles.empty}>
        <Text style={styles.title}>Simulacro</Text>
        <Text style={styles.text}>
          No hay preguntas guardadas. Ve a Banco y pega tu JSON.
        </Text>
        <Pressable onPress={() => router.push("/game/bank")} style={styles.button}>
          <Text style={styles.buttonText}>Ir a Banco</Text>
        </Pressable>
      </View>
    );
  }

  const isLast = index === total - 1;

  // Si es el último, mostramos resultado abajo (sin bloquear la última pregunta)
  const showResult = isLast && revealed;

  const accuracy = total ? Math.round((correctCount / Math.max(1, correctCount + wrongCount)) * 100) : 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <View style={{ gap: 2 }}>
          <Text style={styles.title}>Simulacro</Text>
          <Text style={styles.subtitle}>
            Progreso: {progressText} • Banco tomado: {total} (máx {EXAM_SIZE})
          </Text>
        </View>

        <Pressable onPress={finishNow} style={styles.smallButton}>
          <Text style={styles.smallButtonText}>Finalizar</Text>
        </Pressable>
      </View>

      <View style={styles.scoreBar}>
        <Text style={styles.scoreText}>✅ {correctCount}</Text>
        <Text style={styles.scoreText}>❌ {wrongCount}</Text>
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

        <View style={styles.row}>
          <Pressable
            onPress={next}
            disabled={!revealed}
            style={[styles.buttonPrimary, !revealed && { opacity: 0.5 }]}
          >
            <Text style={styles.buttonText}>{isLast ? "Ver resultado" : "Siguiente"}</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              // saltar (no cuenta)
              if (isLast) return;
              setIndex((i) => i + 1);
              setSelectedIndex(null);
              setRevealed(false);
            }}
            style={styles.buttonGhost}
            disabled={isLast}
          >
            <Text style={[styles.buttonText, isLast && { opacity: 0.5 }]}>Saltar</Text>
          </Pressable>
        </View>
      </View>

      {showResult && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Resultado</Text>
          <Text style={styles.resultLine}>Respondidas: {correctCount + wrongCount}</Text>
          <Text style={styles.resultLine}>Aciertos: {correctCount}</Text>
          <Text style={styles.resultLine}>Fallos: {wrongCount}</Text>
          <Text style={styles.resultLine}>Precisión: {accuracy}%</Text>
          <Text style={styles.resultHint}>
            (Las falladas se guardaron también en “Solo falladas”.)
          </Text>

          <View style={styles.resultRow}>
            <Pressable onPress={restart} style={styles.buttonPrimary}>
              <Text style={styles.buttonText}>Nuevo simulacro</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/game/stats")} style={styles.buttonGhost}>
              <Text style={styles.buttonText}>Ver estadísticas</Text>
            </Pressable>
          </View>
        </View>
      )}

      <Text style={styles.footer}>
        Nota: el simulacro usa un set aleatorio sin repetir (hasta 160 o lo que tengas en el banco).
      </Text>
    </ScrollView>
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

  empty: {
    flex: 1,
    backgroundColor: "#0b0b0f",
    padding: 16,
    justifyContent: "center",
    gap: 12,
  },

  container: { flexGrow: 1, padding: 16, gap: 12, backgroundColor: "#0b0b0f" },

  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  title: { fontSize: 26, fontWeight: "900", color: "white" },
  subtitle: { color: "white", opacity: 0.75, lineHeight: 18 },

  scoreBar: {
    flexDirection: "row",
    gap: 12,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  scoreText: { color: "white", fontWeight: "900" },

  card: {
    marginTop: 6,
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
  button: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.12)",
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

  resultCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.06)",
    gap: 8,
  },
  resultTitle: { color: "white", fontWeight: "900", fontSize: 18 },
  resultLine: { color: "white", opacity: 0.9 },
  resultHint: { color: "white", opacity: 0.65, fontSize: 12, lineHeight: 18, marginTop: 4 },
  resultRow: { flexDirection: "row", gap: 10, marginTop: 8 },

  text: { color: "white", opacity: 0.85, lineHeight: 20 },
  footer: { marginTop: 4, color: "white", opacity: 0.6, fontSize: 12, lineHeight: 18 },
});
