import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";

import AppHeader from "../components/layout/AppHeader";
import { auth, db } from "../services/firebase";
import { colors } from "../utils/theme";

type Conversa = {
  id: string;
  anuncioTitulo?: string;
  ultimaMensagem?: string;
  participantes?: string[];
  compradorEmail?: string;
  vendedorEmail?: string;
  naoLidasComprador?: number;
  naoLidasVendedor?: number;
  atualizadoEm?: any;
};

export default function Conversas() {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUsuario(user);

      if (!user?.email) {
        setConversas([]);
        setCarregando(false);
        router.replace("/login");
      }
    });

    return unsubscribeAuth;
  }, []);

  useEffect(() => {
    if (!usuario?.email) return;

    const emailTratado = usuario.email.trim().toLowerCase();

    const q = query(
      collection(db, "conversas"),
      where("participantes", "array-contains", emailTratado)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const lista = snapshot.docs.map((documento) => ({
          id: documento.id,
          ...documento.data(),
        })) as Conversa[];

        const ordenadas = lista.sort((a, b) => {
          const dataA = a.atualizadoEm?.toMillis?.() || 0;
          const dataB = b.atualizadoEm?.toMillis?.() || 0;

          return dataB - dataA;
        });

        setConversas(ordenadas);
        setCarregando(false);
      },
      () => {
        setCarregando(false);
        Alert.alert("Erro", "Não foi possível carregar as conversas.");
      }
    );

    return unsubscribe;
  }, [usuario]);

  function obterNaoLidas(item: Conversa) {
    const emailTratado = usuario?.email?.trim().toLowerCase();
    const compradorEmail = item.compradorEmail?.trim().toLowerCase();
    const vendedorEmail = item.vendedorEmail?.trim().toLowerCase();

    if (emailTratado === compradorEmail) {
      return item.naoLidasComprador || 0;
    }

    if (emailTratado === vendedorEmail) {
      return item.naoLidasVendedor || 0;
    }

    return 0;
  }

  if (carregando) {
    return (
      <View style={styles.container}>
        <AppHeader titulo="Conversas" />

        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingTexto}>Carregando conversas...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.conteudo}
      showsVerticalScrollIndicator={false}
    >
      <AppHeader titulo="Conversas" />

      {conversas.length === 0 ? (
        <View style={styles.vazioBox}>
          <View style={styles.vazioIcone}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={30}
              color={colors.primary}
            />
          </View>

          <Text style={styles.vazioTitulo}>Nenhuma conversa ainda</Text>

          <Text style={styles.vazioTexto}>
            Quando você enviar ou receber mensagens sobre um anúncio, elas
            aparecerão aqui.
          </Text>
        </View>
      ) : (
        <View style={styles.lista}>
          {conversas.map((item) => {
            const naoLidas = obterNaoLidas(item);
            const temNaoLidas = naoLidas > 0;

            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.card, temNaoLidas && styles.cardNovo]}
                activeOpacity={0.85}
                onPress={() => router.push(`/conversa/${item.id}` as any)}
              >
                <View
                  style={[
                    styles.cardIcone,
                    temNaoLidas && styles.cardIconeNovo,
                  ]}
                >
                  <Ionicons
                    name={
                      temNaoLidas
                        ? "chatbubble-ellipses"
                        : "chatbubble-ellipses-outline"
                    }
                    size={20}
                    color="#FFFFFF"
                  />
                </View>

                <View style={styles.cardInfo}>
                  <View style={styles.tituloLinha}>
                    <Text
                      style={[styles.titulo, temNaoLidas && styles.tituloNovo]}
                      numberOfLines={1}
                    >
                      {item.anuncioTitulo || "Conversa"}
                    </Text>

                    {temNaoLidas && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeTexto}>
                          {naoLidas > 9 ? "9+" : naoLidas}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text
                    style={[
                      styles.mensagem,
                      temNaoLidas && styles.mensagemNova,
                    ]}
                    numberOfLines={2}
                  >
                    {item.ultimaMensagem || "Toque para iniciar a conversa."}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={temNaoLidas ? colors.primary : colors.iconMuted}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  conteudo: {
    paddingBottom: 130,
    backgroundColor: colors.background,
  },

  loadingBox: {
    marginTop: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingTexto: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "700",
    color: colors.textMuted,
  },

  lista: {
    paddingHorizontal: 20,
    paddingTop: 6,
  },

  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  cardNovo: {
    borderColor: colors.primary,
    backgroundColor: "#F8FAFF",
  },

  cardIcone: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  cardIconeNovo: {
    backgroundColor: colors.primaryDark,
  },

  cardInfo: {
    flex: 1,
  },

  tituloLinha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  titulo: {
    flex: 1,
    fontSize: 15,
    fontWeight: "900",
    color: colors.text,
  },

  tituloNovo: {
    color: colors.primaryDark,
  },

  mensagem: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    fontWeight: "600",
  },

  mensagemNova: {
    color: colors.text,
    fontWeight: "900",
  },

  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },

  badgeTexto: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  vazioBox: {
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },

  vazioIcone: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  vazioTitulo: {
    fontSize: 17,
    fontWeight: "900",
    color: colors.text,
    textAlign: "center",
  },

  vazioTexto: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: colors.textMuted,
    textAlign: "center",
  },
});