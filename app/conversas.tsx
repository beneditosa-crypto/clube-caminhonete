import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { router } from "expo-router";

import {
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import AppHeader from "../components/layout/AppHeader";

import { useAuth } from "../contexts/AuthContext";

import { db } from "../services/firebase";

import { colors } from "../utils/theme";

type Conversa = {
  id: string;

  anuncioId?: string;

  anuncioTitulo?: string;

  anuncioPreco?: string;

  anuncioCidade?: string;

  anuncioEstado?: string;

  anuncioFoto?: string;

  ultimaMensagem?: string;

  participantes?: string[];

  compradorEmail?: string;

  vendedorEmail?: string;

  naoLidasComprador?: number;

  naoLidasVendedor?: number;

  atualizadoEm?: any;

  ocultoPara?: string[];
};

function formatarHorario(valor: any) {
  try {
    const data = valor?.toDate?.();

    if (!data) return "";

    return data.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function Conversas() {
  const { usuario, carregando } = useAuth();

  const [conversas, setConversas] = useState<Conversa[]>([]);

  const [carregandoConversas, setCarregandoConversas] =
    useState(true);

  useEffect(() => {
    if (!carregando && !usuario?.email) {
      router.replace("/login");
    }
  }, [usuario, carregando]);

  useEffect(() => {
    if (carregando || !usuario?.email) {
      return;
    }

    const emailTratado = usuario.email.trim().toLowerCase();

    const q = query(
      collection(db, "conversas"),
      where("participantes", "array-contains", emailTratado)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const lista = snapshot.docs
          .map((documento) => ({
            id: documento.id,
            ...documento.data(),
          }))
          .filter((item: any) => {
            const ocultoPara = (item.ocultoPara || []).map((email: string) =>
              email.trim().toLowerCase()
            );

            return !ocultoPara.includes(emailTratado);
          }) as Conversa[];

        const ordenadas = lista.sort((a, b) => {
          const dataA = a.atualizadoEm?.toMillis?.() || 0;
          const dataB = b.atualizadoEm?.toMillis?.() || 0;

          return dataB - dataA;
        });

        setConversas(ordenadas);

        setCarregandoConversas(false);
      },
      () => {
        setCarregandoConversas(false);

        Alert.alert("Erro", "Não foi possível carregar as conversas.");
      }
    );

    return unsubscribe;
  }, [usuario, carregando]);

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

  async function excluirConversa(conversaId: string) {
    const emailTratado = usuario?.email?.trim().toLowerCase();

    if (!emailTratado) {
      return;
    }

    Alert.alert(
      "Excluir conversa",
      "Deseja remover esta conversa da sua lista?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await updateDoc(doc(db, "conversas", conversaId), {
                ocultoPara: arrayUnion(emailTratado),
              });
            } catch {
              Alert.alert("Erro", "Não foi possível excluir a conversa.");
            }
          },
        },
      ]
    );
  }

  if (carregando || carregandoConversas) {
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

  if (!usuario) {
    return null;
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
            Quando você enviar ou receber mensagens, elas aparecerão aqui.
          </Text>
        </View>
      ) : (
        <View style={styles.lista}>
          {conversas.map((item) => {
            const naoLidas = obterNaoLidas(item);

            const temNaoLidas = naoLidas > 0;

            return (
              <View key={item.id} style={styles.cardLinha}>
                <TouchableOpacity
                  style={[styles.card, temNaoLidas && styles.cardNovo]}
                  activeOpacity={0.85}
                  onPress={() => router.push(`/conversa/${item.id}` as any)}
                >
                  <Image
                    source={{
                      uri:
                        item.anuncioFoto ||
                        "https://volante.app.br/assets/logo.png",
                    }}
                    style={styles.foto}
                  />

                  <View style={styles.cardInfo}>
                    <View style={styles.tituloLinha}>
                      <Text
                        style={[
                          styles.titulo,
                          temNaoLidas && styles.tituloNovo,
                        ]}
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

                    <Text style={styles.infoAnuncio} numberOfLines={1}>
                      {item.anuncioPreco || ""}
                      {item.anuncioCidade ? ` • ${item.anuncioCidade}` : ""}
                      {item.anuncioEstado ? ` - ${item.anuncioEstado}` : ""}
                    </Text>

                    <Text
                      style={[
                        styles.mensagem,
                        temNaoLidas && styles.mensagemNova,
                      ]}
                      numberOfLines={2}
                    >
                      {item.ultimaMensagem || "Toque para abrir a conversa."}
                    </Text>

                    <Text style={styles.horario}>
                      {formatarHorario(item.atualizadoEm)}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={temNaoLidas ? colors.primary : colors.iconMuted}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.botaoExcluir}
                  activeOpacity={0.85}
                  onPress={() => excluirConversa(item.id)}
                >
                  <Ionicons name="trash-outline" size={18} color="#DC2626" />
                </TouchableOpacity>
              </View>
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

  cardLinha: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },

  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  cardNovo: {
    borderColor: colors.primary,
    backgroundColor: "#F8FAFF",
  },

  foto: {
    width: 74,
    height: 74,
    borderRadius: 18,
    backgroundColor: "#E5E7EB",
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

  infoAnuncio: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "700",
  },

  mensagem: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    fontWeight: "600",
  },

  mensagemNova: {
    color: colors.text,
    fontWeight: "900",
  },

  horario: {
    marginTop: 6,
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "700",
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

  botaoExcluir: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    alignItems: "center",
    justifyContent: "center",
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