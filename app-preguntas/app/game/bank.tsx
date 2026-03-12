import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  Modal,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import {
  clearBank,
  loadBank,
  parseQuestionsJson,
  saveBank,
  type Question,
} from "../../lib/bank";

const EXAMPLE_JSON = `[
  {
    "question": "¿Cuál es la capital de Ecuador?",
    "options": ["Quito", "Guayaquil", "Cuenca", "Ambato"],
    "answerIndex": 0,
    "topic": "Geografía"
  },
  {
    "question": "¿Cuánto es 15 + 27?",
    "options": ["32", "40", "42", "45"],
    "answerIndex": 2,
    "topic": "Matemáticas"
  }
]`;

const TEMPLATE_JSON = `[
  {
    "question": "Escribe aquí la pregunta",
    "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
    "answerIndex": 0,
    "topic": "Opcional"
  }
]`;

const STRUCTURE_TEXT = `ESTRUCTURA DEL JSON (OBLIGATORIO)

Debes pegar un ARRAY de preguntas:

[
  {
    "question": "Texto de la pregunta",
    "options": ["A","B","C","D"],
    "answerIndex": 0,
    "topic": "Opcional"
  }
]

Campos:
- question: string (obligatorio)
- options: array de strings (mínimo 2) (obligatorio)
- answerIndex: entero (0..options.length-1) (obligatorio)
- topic: string (opcional)
- id: NO requerido (la app lo genera automáticamente)
`;

export default function BankScreen() {
  const [savedCount, setSavedCount] = useState(0);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<string>("");

  const [showHelp, setShowHelp] = useState(false);

  const canSave = useMemo(() => input.trim().length > 0, [input]);

  async function refreshCount() {
    const bank = await loadBank();
    setSavedCount(bank.length);
  }

  useEffect(() => {
    refreshCount();
  }, []);

  async function onSave() {
    try {
      const questions: Question[] = parseQuestionsJson(input);
      await saveBank(questions);
      setStatus(`✅ Guardadas ${questions.length} preguntas.`);
      await refreshCount();
      Alert.alert("Listo", `Se guardaron ${questions.length} preguntas.`);
    } catch (e: any) {
      setStatus(`❌ ${e.message ?? "Error al validar."}`);
      Alert.alert("Error", e.message ?? "JSON inválido");
    }
  }

  async function onClear() {
    Alert.alert(
      "Borrar banco",
      "¿Seguro? Esto elimina todas las preguntas guardadas.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Borrar",
          style: "destructive",
          onPress: async () => {
            await clearBank();
            setStatus("🧹 Banco borrado.");
            await refreshCount();
          },
        },
      ]
    );
  }

  async function copyToClipboard(text: string) {
    await Clipboard.setStringAsync(text);
    setStatus("📋 Copiado al portapapeles.");
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Banco de preguntas</Text>
      <Text style={styles.subtitle}>Preguntas guardadas: {savedCount}</Text>

      <View style={styles.panel}>
        <View style={styles.topButtonsRow}>
          <Pressable
            onPress={() => setShowHelp(true)}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>Estructura JSON</Text>
          </Pressable>

          <Pressable
            onPress={() => setInput(TEMPLATE_JSON)}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>Pegar plantilla</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Pega aquí tu JSON</Text>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder='[ { "question": "...", "options": ["A","B"], "answerIndex": 0 } ]'
          placeholderTextColor="rgba(255,255,255,0.35)"
          multiline
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />

        <View style={styles.row}>
          <Pressable
            onPress={() => setInput(EXAMPLE_JSON)}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>Cargar ejemplo</Text>
          </Pressable>

          <Pressable
            onPress={onSave}
            disabled={!canSave}
            style={({ pressed }) => [
              styles.buttonPrimary,
              pressed && styles.buttonPressed,
              !canSave && { opacity: 0.5 },
            ]}
          >
            <Text style={styles.buttonText}>Validar y guardar</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={onClear}
          style={({ pressed }) => [styles.buttonDanger, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>Borrar banco</Text>
        </Pressable>

        {!!status && <Text style={styles.status}>{status}</Text>}

        <Text style={styles.hint}>
          Tip: si tu JSON tiene errores, te diré en qué pregunta (#) está el problema.
        </Text>
      </View>

      {/* ✅ MODAL: Estructura JSON */}
      <Modal visible={showHelp} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Estructura del JSON</Text>
              <Pressable onPress={() => setShowHelp(false)} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ gap: 10 }}>
              <Text style={styles.modalText}>
                Debes pegar un <Text style={styles.bold}>array</Text> de preguntas.{"\n"}
                Campos obligatorios: <Text style={styles.bold}>question</Text>,{" "}
                <Text style={styles.bold}>options</Text>,{" "}
                <Text style={styles.bold}>answerIndex</Text>.{"\n"}
                <Text style={styles.bold}>id NO es necesario</Text> (la app lo genera sola).
              </Text>

              <View style={styles.monoBox}>
                <Text style={styles.mono}>{STRUCTURE_TEXT}</Text>
              </View>

              <Text style={styles.modalSubtitle}>Ejemplo listo para pegar:</Text>
              <View style={styles.monoBox}>
                <Text style={styles.mono}>{EXAMPLE_JSON}</Text>
              </View>

              <View style={styles.modalRow}>
                <Pressable
                  onPress={() => copyToClipboard(EXAMPLE_JSON)}
                  style={({ pressed }) => [styles.buttonPrimary, pressed && styles.buttonPressed]}
                >
                  <Text style={styles.buttonText}>Copiar ejemplo</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setInput(EXAMPLE_JSON);
                    setShowHelp(false);
                    setStatus("✅ Ejemplo pegado en el editor.");
                  }}
                  style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                >
                  <Text style={styles.buttonText}>Pegar en editor</Text>
                </Pressable>
              </View>

              <Pressable
                onPress={() => copyToClipboard(TEMPLATE_JSON)}
                style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
              >
                <Text style={styles.buttonText}>Copiar plantilla vacía</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  subtitle: { fontSize: 14, color: "white", opacity: 0.85 },

  panel: {
    marginTop: 6,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.06)",
    gap: 10,
  },

  topButtonsRow: { flexDirection: "row", gap: 10 },

  label: { color: "white", fontWeight: "800", opacity: 0.9 },
  input: {
    minHeight: 220,
    borderRadius: 12,
    padding: 12,
    color: "white",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(0,0,0,0.25)",
    textAlignVertical: "top",
    fontSize: 13,
    lineHeight: 18,
  },

  row: { flexDirection: "row", gap: 10 },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  buttonPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  buttonDanger: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,80,80,0.35)",
    backgroundColor: "rgba(255,80,80,0.12)",
  },
  buttonPressed: { transform: [{ scale: 0.99 }], opacity: 0.92 },
  buttonText: { color: "white", fontWeight: "900" },

  status: { color: "white", opacity: 0.9, marginTop: 4 },
  hint: { color: "white", opacity: 0.65, fontSize: 12, lineHeight: 18, marginTop: 6 },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 16,
    justifyContent: "center",
  },
  modalCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "#101018",
    gap: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: { color: "white", fontWeight: "900", fontSize: 18 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  closeText: { color: "white", fontWeight: "900" },

  modalText: { color: "white", opacity: 0.85, lineHeight: 20 },
  modalSubtitle: { color: "white", fontWeight: "900", opacity: 0.9 },

  monoBox: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  mono: { color: "white", opacity: 0.75, fontSize: 12, lineHeight: 18, fontFamily: "monospace" },
  modalRow: { flexDirection: "row", gap: 10 },

  bold: { fontWeight: "900" },
});
