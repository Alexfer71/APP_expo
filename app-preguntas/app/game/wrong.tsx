import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from "react-native";
import { loadBank, type Question } from "../../lib/bank";
import { loadProgress } from "../../lib/progress";
import QuestionPlayer from "../../components/QuestionPlayer";
import { router } from "expo-router";

function pickRandom<T>(arr: T[]) {
  return arr[Math.random() * arr.length | 0];
}

export default function WrongOnlyScreen() {
  const [bank, setBank] = useState<Question[]>([]);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [b, p] = await Promise.all([loadBank(), loadProgress()]);
      setBank(b);
      setWrongIds(p.wrongIds);
      setLoading(false);
    })();
  }, []);

  const wrongQuestions = useMemo(() => {
    if (!bank.length || !wrongIds.length) return [];
    const set = new Set(wrongIds);
    return bank.filter((q) => set.has(q.id));
  }, [bank, wrongIds]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Cargando falladas…</Text>
      </View>
    );
  }

  // Si no hay falladas, pantalla amigable
  if (wrongIds.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.title}>Solo falladas</Text>
        <Text style={styles.text}>
          Aún no tienes falladas. Juega Maratón y falla al menos una 😄
        </Text>

        <Pressable onPress={() => router.push("/game/marathon")} style={styles.button}>
          <Text style={styles.buttonText}>Ir a Maratón</Text>
        </Pressable>
      </View>
    );
  }

  if (wrongQuestions.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.title}>Solo falladas</Text>
        <Text style={styles.text}>
          Tienes falladas registradas, pero no se encuentran en el banco actual.
          (Probablemente cambiaste IDs en el JSON.)
        </Text>
      </View>
    );
  }

  return (
    <QuestionPlayer
      questions={wrongQuestions}
      modeLabel={`Solo falladas (${wrongQuestions.length})`}
      pickNext={pickRandom}
    />
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
  title: { fontSize: 26, fontWeight: "900", color: "white" },
  text: { color: "white", opacity: 0.85, lineHeight: 20 },
  button: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  buttonText: { color: "white", fontWeight: "900" },
});
