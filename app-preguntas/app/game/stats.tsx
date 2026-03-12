import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from "react-native";
import { loadProgress, resetProgress, type Progress } from "../../lib/progress";
import { loadBank } from "../../lib/bank";

export default function StatsScreen() {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [bankCount, setBankCount] = useState<number>(0);

  const refresh = useCallback(async () => {
    const p = await loadProgress();
    const bank = await loadBank();
    setProgress(p);
    setBankCount(bank.length);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const accuracy = useMemo(() => {
    if (!progress) return 0;
    if (progress.totalAnswered === 0) return 0;
    return Math.round((progress.totalCorrect / progress.totalAnswered) * 100);
  }, [progress]);

  const wrongUnique = progress?.wrongIds.length ?? 0;

  async function onReset() {
    Alert.alert(
      "Reiniciar estadísticas",
      "Esto borrará tu progreso (aciertos, fallos y falladas). El banco de preguntas NO se borra.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Reiniciar",
          style: "destructive",
          onPress: async () => {
            await resetProgress();
            await refresh();
          },
        },
      ]
    );
  }

  if (!progress) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Estadísticas</Text>
        <Text style={styles.text}>Cargando…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Estadísticas</Text>
      <Text style={styles.subtitle}>Banco: {bankCount} preguntas</Text>

      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Respondidas</Text>
          <Text style={styles.cardValue}>{progress.totalAnswered}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Aciertos</Text>
          <Text style={styles.cardValue}>{progress.totalCorrect}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Fallos</Text>
          <Text style={styles.cardValue}>{progress.totalWrong}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Precisión</Text>
          <Text style={styles.cardValue}>{accuracy}%</Text>
        </View>

        <View style={styles.cardWide}>
          <Text style={styles.cardLabel}>Falladas (únicas)</Text>
          <Text style={styles.cardValue}>{wrongUnique}</Text>
          <Text style={styles.cardHint}>
            “Únicas” = cuántas preguntas diferentes has fallado al menos una vez.
          </Text>
        </View>
      </View>

      <Pressable onPress={refresh} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <Text style={styles.buttonText}>Actualizar</Text>
      </Pressable>

      <Pressable
        onPress={onReset}
        style={({ pressed }) => [styles.buttonDanger, pressed && styles.pressed]}
      >
        <Text style={styles.buttonText}>Reiniciar estadísticas</Text>
      </Pressable>

      <Text style={styles.footer}>
        Siguiente paso: “Solo falladas” usando wrongIds para filtrar el banco.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    gap: 12,
    backgroundColor: "#0b0b0f",
  },
  title: { fontSize: 26, fontWeight: "900", color: "white" },
  subtitle: { color: "white", opacity: 0.75 },

  grid: { gap: 12, marginTop: 8 },
  card: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.06)",
    gap: 6,
  },
  cardWide: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.06)",
    gap: 6,
  },
  cardLabel: { color: "white", opacity: 0.75, fontWeight: "800" },
  cardValue: { color: "white", fontSize: 28, fontWeight: "900" },
  cardHint: { color: "white", opacity: 0.6, fontSize: 12, lineHeight: 18 },

  button: {
    marginTop: 6,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  buttonDanger: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,80,80,0.35)",
    backgroundColor: "rgba(255,80,80,0.12)",
  },
  pressed: { transform: [{ scale: 0.99 }], opacity: 0.92 },
  buttonText: { color: "white", fontWeight: "900" },

  text: { color: "white", opacity: 0.85 },
  footer: { marginTop: 6, color: "white", opacity: 0.6, fontSize: 12 },
});
