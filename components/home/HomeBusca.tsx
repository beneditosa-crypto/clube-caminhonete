import { StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  busca: string;
  setBusca: (valor: string) => void;
};

export default function HomeBusca({ busca, setBusca }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name="search-outline" size={20} color="#6B7280" />

      <TextInput
        style={styles.input}
        placeholder="Buscar caminhonetes, cidades..."
        placeholderTextColor="#9CA3AF"
        value={busca}
        onChangeText={setBusca}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: "#111111",
  },
});