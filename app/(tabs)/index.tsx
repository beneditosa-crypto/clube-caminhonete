import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";

// =============================
// DADOS MOCK
// =============================
const destaques = [
  {
    id: "1",
    titulo: "C10 1974 Custom Deluxe",
    preco: "R$ 45.000",
    cidade: "Goiânia, GO",
    imagem: { uri: "https://picsum.photos/300/200?1" },
  },
  {
    id: "2",
    titulo: "D20 1990",
    preco: "R$ 49.000",
    cidade: "Uberlândia, MG",
    imagem: { uri: "https://picsum.photos/300/200?2" },
  },
];

const recentes = [
  {
    id: "3",
    titulo: "F1000 1992 Turbo Diesel",
    preco: "R$ 38.000",
    cidade: "Brasília, DF",
    imagem: { uri: "https://picsum.photos/300/200?3" },
  },
  {
    id: "4",
    titulo: "Ranger XLT 2018",
    preco: "R$ 139.900",
    cidade: "São Paulo, SP",
    imagem: { uri: "https://picsum.photos/300/200?4" },
  },
];

// =============================
// COMPONENTE
// =============================
export default function Home() {
  return (
    <View style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <Ionicons name="menu" size={22} color="#FFF" />
        <Text style={styles.logo}>Clube da Caminhonete</Text>
        <Ionicons name="notifications-outline" size={22} color="#FFF" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* BARRA DE BUSCA */}
        <View style={styles.buscaContainer}>
          <Ionicons name="search" size={18} color="#777" />
          <TextInput
            placeholder="Buscar caminhonetes..."
            placeholderTextColor="#777"
            style={styles.input}
          />
        </View>

        {/* FILTROS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filtros}>
            {["Todos", "F1000", "F250", "Hilux", "D20"].map((item) => (
              <View key={item} style={styles.filtro}>
                <Text style={styles.filtroTexto}>{item}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* DESTAQUES */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Destaques</Text>
          <Text style={styles.verTodos}>Ver todos</Text>
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={destaques}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Link href="/detalhes" asChild>
              <TouchableOpacity style={styles.card}>
                <Image source={item.imagem} style={styles.imagem} />
                <View style={styles.cardConteudo}>
                  <Text style={styles.cardTitulo}>{item.titulo}</Text>
                  <Text style={styles.cardPreco}>{item.preco}</Text>
                  <Text style={styles.cardCidade}>{item.cidade}</Text>
                </View>
              </TouchableOpacity>
            </Link>
          )}
        />

        {/* MAIS RECENTES */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mais recentes</Text>
        </View>

        {recentes.map((item) => (
          <Link key={item.id} href="/detalhes" asChild>
            <TouchableOpacity style={styles.cardHorizontal}>
              <Image source={item.imagem} style={styles.imagemPequena} />
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitulo}>{item.titulo}</Text>
                <Text style={styles.cardPreco}>{item.preco}</Text>
                <Text style={styles.cardCidade}>{item.cidade}</Text>
              </View>
            </TouchableOpacity>
          </Link>
        ))}

        {/* BOTÃO PUBLICAR */}
        <Link href="/publicar" asChild>
          <TouchableOpacity style={styles.botaoPublicar}>
            <Ionicons name="add" size={18} color="#000" />
            <Text style={styles.botaoTexto}>Publicar anúncio</Text>
          </TouchableOpacity>
        </Link>

      </ScrollView>
    </View>
  );
}

// =============================
// ESTILOS
// =============================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0B",
    paddingTop: 40,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 10,
  },

  logo: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
  },

  buscaContainer: {
    flexDirection: "row",
    backgroundColor: "#1A1A1A",
    margin: 16,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  input: {
    color: "#FFF",
    marginLeft: 8,
    flex: 1,
  },

  filtros: {
    flexDirection: "row",
    paddingLeft: 16,
  },

  filtro: {
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },

  filtroTexto: {
    color: "#CCC",
    fontSize: 12,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 20,
    alignItems: "center",
  },

  sectionTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },

  verTodos: {
    color: "#4CAF50",
    fontSize: 12,
  },

  card: {
    backgroundColor: "#1A1A1A",
    marginLeft: 16,
    borderRadius: 14,
    width: 260,
    overflow: "hidden",
  },

  imagem: {
    width: "100%",
    height: 150,
  },

  cardConteudo: {
    padding: 10,
  },

  cardTitulo: {
    color: "#FFF",
    fontWeight: "600",
  },

  cardPreco: {
    color: "#4CAF50",
    marginTop: 4,
    fontWeight: "bold",
  },

  cardCidade: {
    color: "#888",
    fontSize: 12,
  },

  cardHorizontal: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
  },

  imagemPequena: {
    width: 90,
    height: 70,
    borderRadius: 8,
    marginRight: 10,
  },

  cardInfo: {
    flex: 1,
  },

  botaoPublicar: {
    backgroundColor: "#4CAF50",
    margin: 20,
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },

  botaoTexto: {
    color: "#000",
    fontWeight: "bold",
  },
});