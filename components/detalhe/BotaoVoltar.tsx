import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";

export default function BotaoVoltar() {
  return (
    <TouchableOpacity
      style={styles.botao}
      onPress={() => router.back()}
      activeOpacity={0.85}
    >
      <Text style={styles.textoBotao}>Voltar</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  botao: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 40,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  textoBotao: {
    color: "#111111",
    fontWeight: "800",
  },
});