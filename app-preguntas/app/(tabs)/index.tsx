// app/(tabs)/index.tsx
import { ScrollView, View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import type { Href } from "expo-router";

type MenuItem = {
  title: string;
  subtitle: string;
  route: Href;
};

const MENU: MenuItem[] = [
  {
    title: "Maratón",
    subtitle: "Sin límite. Practica hasta cansarte.",
    route: "/game/marathon",
  },
  {
    title: "Simulacro Examen",
    subtitle: "160 preguntas aleatorias, como el real.",
    route: "/game/exam",
  },
  {
    title: "Solo falladas",
    subtitle: "Repite únicamente las que fallaste.",
    route: "/game/wrong",
  },
  {
    title: "Modo racha",
    subtitle: "Mantén la racha viva. Pierdes al fallar.",
    route: "/game/streak",
  },
  {
    title: "Estadísticas",
    subtitle: "Progreso, aciertos, fallos, rachas.",
    route: "/game/stats",
  },
  {
    title: "Banco de preguntas",
    subtitle: "Importar JSON, borrar banco, estado.",
    route: "/game/bank",
  },
];

export default function HomeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.kicker}>Study Game</Text>
        <Text style={styles.title}>Selecciona un modo</Text>
        <Text style={styles.caption}>
          Tu progreso se guardará offline (lo conectaremos pronto).
        </Text>
      </View>

      <View style={styles.grid}>
        {MENU.map((item) => (
          <Pressable
            key={String(item.route)}
            onPress={() => router.push(item.route)}
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
          >
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            <Text style={styles.cardHint}>Entrar →</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Siguiente: conectamos banco JSON + guardado offline del progreso.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 28,
    gap: 16,

    // ✅ Fondo oscuro para que no se vea “todo negro” con texto negro
    backgroundColor: "#0b0b0f",
  },
  header: {
    gap: 6,
    paddingTop: 6,
  },
  kicker: {
    fontSize: 12,
    opacity: 0.75,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "white",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "white",
  },
  caption: {
    fontSize: 14,
    opacity: 0.85,
    lineHeight: 20,
    color: "white",
  },
  grid: {
    gap: 12,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.06)",
    gap: 8,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "white",
  },
  cardSubtitle: {
    fontSize: 14,
    opacity: 0.85,
    lineHeight: 20,
    color: "white",
  },
  cardHint: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "800",
    opacity: 0.75,
    color: "white",
  },
  footer: {
    marginTop: 6,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 12,
    opacity: 0.7,
    color: "white",
  },
});
