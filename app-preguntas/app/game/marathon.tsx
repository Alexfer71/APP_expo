import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import QuestionPlayer from "../../components/QuestionPlayer";
import { loadBank, type Question } from "../../lib/bank";
import { pickRandomNotSameById } from "../../lib/pick";

export default function MarathonScreen() {
  const [bank, setBank] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const b = await loadBank();
      setBank(b);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Cargando banco…</Text>
      </View>
    );
  }

  return (
    <QuestionPlayer
      questions={bank}
      modeLabel="Maratón"
      pickNext={pickRandomNotSameById}
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
});
