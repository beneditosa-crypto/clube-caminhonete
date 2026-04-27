import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { anuncios } from "./dados";

export default function Home() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Clube da Caminhonete</Text>

      <TouchableOpacity style={styles.botao} onPress={() => router.push("/publicar")}>
        <Text style={styles.botaoTexto}>+ Publicar Anúncio</Text>
      </TouchableOpacity>

      <FlatList
        data={anuncios}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.titulo}>{item.titulo}</Text>
            <Text style={styles.preco}>R$ {item.preco}</Text>
            <Text style={styles.info}>{item.cidade}</Text>
            <Text style={styles.info}>Ano: {item.ano}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F14",
    padding: 20,
  },
  logo: {
    color: "#C9A227",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  botao: {
    backgroundColor: "#C9A227",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  botaoTexto: {
    fontWeight: "bold",
    color: "#0B0F14",
  },
  card: {
    backgroundColor: "#151B23",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  titulo: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  preco: {
    color: "#C9A227",
    fontSize: 16,
    marginTop: 4,
  },
  info: {
    color: "#AAA",
  },
});