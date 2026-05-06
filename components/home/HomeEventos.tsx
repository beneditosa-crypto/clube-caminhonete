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
import { collection, onSnapshot } from "firebase/firestore";

import { db } from "../../services/firebase";
import { colors } from "../../utils/theme";

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
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "eventos"), (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Evento[];

      const ativos = lista.filter((item) => item.status === "ATIVO");

      setEventos(ativos);
      setCarregando(false);
    });

    return () => unsubscribe();
  }, []);

  const eventosOrdenados = useMemo(() => {
    return [...eventos].reverse().slice(0, 6);
  }, [eventos]);

  if (carregando) {
    return (
      <View style={styles.secao}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.secao}>
      {eventosOrdenados.length === 0 ? (
        <View style={styles.vazio}>
          <Text style={styles.vazioTitulo}>Nenhum evento aprovado ainda</Text>
          <Text style={styles.vazioTexto}>
            Em breve os encontros aparecerão por aqui.
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.lista}
        >
          {eventosOrdenados.map((evento) => (
            <TouchableOpacity
              key={evento.id}
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => router.push(`/detalhe-evento/${evento.id}`)}
            >
              {evento.fotos?.[0] ? (
                <Image source={{ uri: evento.fotos[0] }} style={styles.foto} />
              ) : (
                <View style={styles.semFoto}>
                  <Text style={styles.semFotoTexto}>Evento</Text>
                </View>
              )}

              <View style={styles.info}>
                <Text style={styles.data}>
                  {evento.data || "Data em breve"}
                </Text>

                <Text style={styles.tituloEvento} numberOfLines={2}>
                  {evento.titulo || "Evento de antigomobilismo"}
                </Text>

                <Text style={styles.local} numberOfLines={1}>
                  {evento.cidade || "Cidade"} - {evento.estado || "UF"}
                </Text>

                <Text style={styles.texto} numberOfLines={3}>
                  {evento.descricao ||
                    "Encontro para veículos antigos e apaixonados por clássicos."}
                </Text>

                <View style={styles.botao}>
                  <Text style={styles.botaoTexto}>Ver detalhes</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  secao: {
    marginTop: 6,
    paddingBottom: 20,
    backgroundColor: colors.background,
  },

  lista: {
    paddingLeft: 20,
    paddingRight: 10,
    gap: 14,
  },

  vazio: {
    marginHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },

  vazioTitulo: {
    color: colors.text,
    fontWeight: "900",
    fontSize: 16,
  },

  vazioTexto: {
    color: colors.textMuted,
    marginTop: 6,
    lineHeight: 20,
    fontWeight: "600",
  },

  card: {
    width: 250,
    backgroundColor: "#111827",
    borderRadius: 20,
    overflow: "hidden",
  },

  foto: {
    width: "100%",
    height: 130,
    backgroundColor: "#F3F4F6",
  },

  semFoto: {
    width: "100%",
    height: 130,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },

  semFotoTexto: {
    color: colors.primary,
    fontWeight: "900",
    fontSize: 14,
  },

  info: {
    padding: 16,
  },

  data: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 8,
  },

  tituloEvento: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 6,
  },

  local: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 8,
  },

  texto: {
    color: "#E5E7EB",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },

  botao: {
    marginTop: 16,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 11,
    alignItems: "center",
  },

  botaoTexto: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
});