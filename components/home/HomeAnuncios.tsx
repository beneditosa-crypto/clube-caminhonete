import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { collection, onSnapshot } from "firebase/firestore";

import { db } from "../../services/firebase";

const { width } = Dimensions.get("window");

const CARD_WIDTH = Math.round(width / 2.78);

type Anuncio = {
  id: string;
  titulo?: string;
  marca?: string;
  modelo?: string;
  ano?: number;
  preco?: number | string;
  estado?: string;
  cidade?: string;
  fotos?: string[];
  status?: string;
  destaque?: boolean;
  criadoEm?: any;
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
    const unsubscribe = onSnapshot(
      collection(db, "anuncios"),
      (snapshot) => {
        const lista = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Anuncio[];

        const ativos = lista.filter(
          (item) =>
            String(item.status || "").toUpperCase() === "ATIVO"
        );

        setAnuncios(ordenarPorData(ativos));
        setCarregando(false);
      },
      () => {
        setCarregando(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filtrados = useMemo(() => {
    const buscaNormalizada = busca.trim().toLowerCase();
    const estadoNormalizado = estado.trim().toLowerCase();
    const marcaNormalizada = marca.trim().toLowerCase();
    const modeloNormalizado = modelo.trim().toLowerCase();

    let resultado = anuncios.filter((item) => {
      const texto = [
        item.titulo,
        item.marca,
        item.modelo,
        item.estado,
        item.cidade,
        item.ano,
      ]
        .join(" ")
        .toLowerCase();

      const passaBusca =
        !buscaNormalizada || texto.includes(buscaNormalizada);

      const passaEstado =
        !estadoNormalizado ||
        String(item.estado || "")
          .toLowerCase()
          .includes(estadoNormalizado);

      const passaMarca =
        !marcaNormalizada ||
        String(item.marca || "")
          .toLowerCase()
          .includes(marcaNormalizada);

      const passaModelo =
        !modeloNormalizado ||
        String(item.modelo || "")
          .toLowerCase()
          .includes(modeloNormalizado);

      return (
        passaBusca &&
        passaEstado &&
        passaMarca &&
        passaModelo
      );
    });

    if (tipo === "destaque") {
      resultado = resultado.filter(
        (item) => item.destaque === true
      );
    }

    if (limite) return resultado.slice(0, limite);

    if (tipo === "destaque") {
      return resultado.slice(0, 8);
    }

    return resultado;
  }, [anuncios, busca, estado, marca, modelo, tipo, limite]);

  function formatarPreco(valor?: number | string) {
    if (!valor) return "Consultar";

    if (
      typeof valor === "string" &&
      valor.trim().includes("R$")
    ) {
      return valor;
    }

    const numero =
      typeof valor === "number"
        ? valor
        : Number(
            String(valor)
              .replace(/\s/g, "")
              .replace("R$", "")
              .replace(/\./g, "")
              .replace(",", ".")
          );

    if (Number.isNaN(numero)) return String(valor);

    return numero.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function obterTitulo(item: Anuncio) {
    return (
      item.titulo ||
      `${item.marca || ""} ${item.modelo || ""}`.trim() ||
      "Veículo clássico"
    );
  }

  function obterLocal(item: Anuncio) {
    return [item.cidade, item.estado]
      .filter(Boolean)
      .join(" - ");
  }

  if (carregando) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="small" color="#1E3A8A" />

        <Text style={styles.loadingTexto}>
          Carregando anúncios...
        </Text>
      </View>
    );
  }

  if (filtrados.length === 0) {
    return (
      <View style={styles.vazio}>
        <Text style={styles.vazioTitulo}>
          Nenhum anúncio encontrado
        </Text>

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
        decelerationRate="fast"
        snapToAlignment="start"
      >
        {filtrados.map((item) => {
          const titulo = obterTitulo(item);
          const local = obterLocal(item);
          const imagem = item.fotos?.[0];
          const destacado = item.destaque === true;

          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.card,
                destacado && styles.cardDestaque,
              ]}
              activeOpacity={0.9}
              onPress={() =>
                router.push(`/detalhe/${item.id}` as any)
              }
            >
              <View style={styles.fotoBox}>
                {imagem ? (
                  <Image
                    source={{ uri: imagem }}
                    style={styles.foto}
                    resizeMode="cover"
                  />
                ) : (
                  <Image
                    source={require("../../assets/images/logo.png")}
                    style={styles.fotoLogo}
                    resizeMode="contain"
                  />
                )}

                <View style={styles.overlay} />

                {destacado && (
                  <View style={styles.estrelaBox}>
                    <Ionicons
                      name="star"
                      size={11}
                      color="#E5E7EB"
                    />
                  </View>
                )}

                <View style={styles.textoFoto}>
                  <Text
                    style={styles.titulo}
                    numberOfLines={2}
                  >
                    {titulo}
                  </Text>

                  <Text
                    style={styles.local}
                    numberOfLines={1}
                  >
                    {local || "Brasil"}
                  </Text>
                </View>
              </View>

              <View style={styles.info}>
                <Text
                  style={styles.preco}
                  numberOfLines={1}
                >
                  {formatarPreco(item.preco)}
                </Text>

                {!!item.ano && (
                  <Text
                    style={styles.ano}
                    numberOfLines={1}
                  >
                    {item.ano}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

function ordenarPorData(lista: Anuncio[]) {
  return [...lista].sort((a, b) => {
    const dataA =
      a?.criadoEm?.seconds ||
      a?.criadoEm?._seconds ||
      0;

    const dataB =
      b?.criadoEm?.seconds ||
      b?.criadoEm?._seconds ||
      0;

    return dataB - dataA;
  });
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
  },

  lista: {
    paddingLeft: 16,
    paddingRight: 8,
    gap: 10,
  },

  card: {
    width: CARD_WIDTH,
    borderRadius: 17,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  cardDestaque: {
    borderColor: "#2B2F36",
    borderWidth: 1.2,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.13,
    shadowRadius: 12,
    elevation: 4,
  },

  fotoBox: {
    position: "relative",
    width: "100%",
    height: 112,
    backgroundColor: "#F3F4F6",
  },

  foto: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F3F4F6",
  },

  fotoLogo: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F3F4F6",
    opacity: 0.28,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.34)",
  },

  textoFoto: {
    position: "absolute",
    left: 9,
    right: 9,
    bottom: 9,
  },

  titulo: {
    color: "#FFFFFF",
    fontSize: 12.6,
    fontWeight: "900",
    lineHeight: 15.5,
    letterSpacing: -0.25,
    textShadowColor: "rgba(0,0,0,0.22)",
    textShadowOffset: {
      width: 0,
      height: 1,
    },
    textShadowRadius: 8,
  },

  local: {
    marginTop: 4,
    color: "rgba(255,255,255,0.82)",
    fontSize: 10.4,
    fontWeight: "700",
  },

  estrelaBox: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 21,
    height: 21,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.78)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },

  info: {
    minHeight: 43,
    paddingHorizontal: 8,
    paddingTop: 7,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 6,
  },

  preco: {
    flex: 1,
    color: "#1E3A8A",
    fontSize: 12.4,
    fontWeight: "900",
    letterSpacing: -0.18,
  },

  ano: {
    color: "#6B7280",
    fontSize: 10.8,
    fontWeight: "800",
  },

  loadingBox: {
    marginTop: 8,
    marginHorizontal: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 17,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  loadingTexto: {
    color: "#6B7280",
    fontSize: 12.5,
    fontWeight: "700",
  },

  vazio: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 15,
    borderRadius: 17,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  vazioTitulo: {
    fontSize: 14.5,
    fontWeight: "900",
    color: "#111111",
    textAlign: "center",
  },

  vazioTexto: {
    marginTop: 5,
    fontSize: 12.5,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 18,
    fontWeight: "600",
  },
});