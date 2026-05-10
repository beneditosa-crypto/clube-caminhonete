import { useEffect, useMemo, useState } from "react";

import { router } from "expo-router";

import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  collection,
  onSnapshot,
} from "firebase/firestore";

import { db } from "../../services/firebase";

type Evento = {
  id: string;
  titulo?: string;
  cidade?: string;
  estado?: string;
  data?: string;
  descricao?: string;
  status?: string;
  fotos?: string[];
};

export default function HomeEventos() {
  const [eventos, setEventos] = useState<
    Evento[]
  >([]);

  const [carregando, setCarregando] =
    useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "eventos"),
      (snapshot) => {
        const lista = snapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data(),
          })
        ) as Evento[];

        const ativos = lista.filter(
          (item) =>
            item.status === "ATIVO"
        );

        setEventos(ativos);

        setCarregando(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const eventosOrdenados =
    useMemo(() => {
      return [...eventos]
        .reverse()
        .slice(0, 8);
    }, [eventos]);

  if (carregando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color="#1E3A8A"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {eventosOrdenados.length ===
      0 ? (
        <View style={styles.vazio}>
          <Text
            style={styles.vazioTitulo}
          >
            Nenhum evento aprovado
            ainda
          </Text>

          <Text
            style={styles.vazioTexto}
          >
            Em breve os encontros
            aparecerão por aqui.
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.lista
          }
        >
          {eventosOrdenados.map(
            (evento) => (
              <TouchableOpacity
                key={evento.id}
                style={styles.card}
                activeOpacity={0.92}
                onPress={() =>
                  router.push(
                    `/detalhe-evento/${evento.id}`
                  )
                }
              >
                {evento.fotos?.[0] ? (
                  <Image
                    source={{
                      uri: evento
                        .fotos[0],
                    }}
                    style={
                      styles.foto
                    }
                  />
                ) : (
                  <View
                    style={
                      styles.semFoto
                    }
                  >
                    <Text
                      style={
                        styles.semFotoTexto
                      }
                    >
                      Evento
                    </Text>
                  </View>
                )}

                <View
                  style={
                    styles.overlay
                  }
                >
                  <Text
                    style={
                      styles.data
                    }
                    numberOfLines={1}
                  >
                    {evento.data ||
                      "Data em breve"}
                  </Text>

                  <Text
                    style={
                      styles.titulo
                    }
                    numberOfLines={2}
                  >
                    {evento.titulo ||
                      "Evento"}
                  </Text>

                  <Text
                    style={
                      styles.local
                    }
                    numberOfLines={1}
                  >
                    {evento.cidade ||
                      "Cidade"}{" "}
                    -{" "}
                    {evento.estado ||
                      "UF"}
                  </Text>
                </View>
              </TouchableOpacity>
            )
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
    paddingBottom: 12,
  },

  loading: {
    paddingVertical: 40,
  },

  lista: {
    paddingLeft: 20,
    paddingRight: 10,
    gap: 12,
  },

  vazio: {
    marginHorizontal: 20,

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

  card: {
    width: 170,
    height: 230,

    borderRadius: 24,

    overflow: "hidden",

    backgroundColor: "#E5E7EB",

    position: "relative",
  },

  foto: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },

  semFoto: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#E5E7EB",
  },

  semFotoTexto: {
    color: "#6B7280",
    fontWeight: "700",
  },

  overlay: {
    position: "absolute",

    left: 0,
    right: 0,
    bottom: 0,

    paddingHorizontal: 14,
    paddingTop: 28,
    paddingBottom: 14,

    backgroundColor:
      "rgba(15,23,42,0.60)",
  },

  data: {
    color: "rgba(255,255,255,0.80)",

    fontSize: 10,

    fontWeight: "900",

    marginBottom: 5,

    textTransform: "uppercase",
  },

  titulo: {
    color: "#FFFFFF",

    fontSize: 14,

    fontWeight: "900",

    lineHeight: 18,
  },

  local: {
    marginTop: 5,

    color: "rgba(255,255,255,0.82)",

    fontSize: 11,

    fontWeight: "700",
  },
});