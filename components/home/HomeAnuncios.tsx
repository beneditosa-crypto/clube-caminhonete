import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firebase";

type Anuncio = {
  id: string;
  titulo?: string;
  marca?: string;
  modelo?: string;
  ano?: number;
  preco?: number;
  estado?: string;
  cidade?: string;
  fotos?: string[];
  status?: string;
};

type Props = {
  busca?: string;
  estado?: string;
  marca?: string;
  modelo?: string;
  tipo?: "destaque" | "recentes";
  limite?: number;
  esconderTitulo?: boolean;
};

export default function HomeAnuncios({
  busca = "",
  estado = "",
  marca = "",
  modelo = "",
  tipo = "recentes",
  limite,
}: Props) {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "anuncios"), (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Anuncio[];

      const ativos = lista.filter((item) => item.status === "ATIVO");

      setAnuncios(ativos);
      setCarregando(false);
    });

    return () => unsubscribe();
  }, []);

  const filtrados = useMemo(() => {
    const buscaNormalizada = busca.trim().toLowerCase();

    let resultado = anuncios.filter((item) => {
      const texto = `${item.titulo || ""} ${item.marca || ""} ${
        item.modelo || ""
      } ${item.estado || ""} ${item.cidade || ""}`.toLowerCase();

      return !buscaNormalizada || texto.includes(buscaNormalizada);
    });

    resultado = [...resultado].reverse();

    if (limite) return resultado.slice(0, limite);
    if (tipo === "destaque") return resultado.slice(0, 3);

    return resultado;
  }, [anuncios, busca, tipo, limite]);

  function formatarPreco(valor?: number) {
    if (!valor) return "Consultar";

    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  if (carregando) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0F172A" />
      </View>
    );
  }

  if (filtrados.length === 0) {
    return (
      <View style={styles.vazio}>
        <Text style={styles.vazioTitulo}>Nenhum anúncio encontrado</Text>
        <Text style={styles.vazioTexto}>
          Tente buscar por outro modelo, marca ou cidade.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.lista}
      >
        {filtrados.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => router.push(`/detalhe/${item.id}`)}
          >
            {item.fotos?.[0] ? (
              <Image source={{ uri: item.fotos[0] }} style={styles.foto} />
            ) : (
              <View style={styles.semFoto}>
                <Text style={styles.semFotoTexto}>Sem foto</Text>
              </View>
            )}

            <View style={styles.info}>
              <Text style={styles.nome} numberOfLines={1}>
                {item.titulo || "Veículo"}
              </Text>

              <Text style={styles.preco}>
                {formatarPreco(item.preco)}
              </Text>

              <Text style={styles.local} numberOfLines={1}>
                {item.cidade || "Cidade"} - {item.estado || "UF"}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 6,
  },

  lista: {
    paddingLeft: 20,
    paddingRight: 10,
    gap: 14,
  },

  card: {
    width: 220,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  foto: {
    width: "100%",
    height: 140,
    backgroundColor: "#F3F4F6",
  },

  semFoto: {
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },

  semFotoTexto: {
    color: "#777777",
  },

  info: {
    padding: 12,
  },

  nome: {
    fontSize: 15,
    fontWeight: "900",
    color: "#111111",
  },

  preco: {
    color: "#0F172A", // 🔵 CORRIGIDO
    fontWeight: "900",
    marginTop: 6,
    fontSize: 15,
  },

  local: {
    color: "#6B7280",
    marginTop: 4,
    fontSize: 13,
    fontWeight: "600",
  },

  vazio: {
    marginHorizontal: 20,
    marginTop: 8,
    padding: 18,
    borderRadius: 18,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  vazioTitulo: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111111",
    textAlign: "center",
  },

  vazioTexto: {
    marginTop: 6,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
});