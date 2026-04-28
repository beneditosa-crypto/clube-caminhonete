import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";

export default function Detalhes() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.texto}>TELA DE DETALHES ABRIU</Text>

      <TouchableOpacity style={styles.botao} onPress={() => router.back()}>
        <Text style={styles.botaoTexto}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  texto: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "bold",
  },
  botao: {
    marginTop: 20,
    backgroundColor: "#4CAF50",
    padding: 14,
    borderRadius: 10,
  },
  botaoTexto: {
    color: "#FFF",
    fontWeight: "bold",
  },
});