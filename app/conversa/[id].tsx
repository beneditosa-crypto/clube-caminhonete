import { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import {
  User,
  onAuthStateChanged,
} from "firebase/auth";

import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "../../services/firebase";

import {
  notificarMensagemLocal,
} from "../../services/notificacoes";

import { colors } from "../../utils/theme";

type Mensagem = {
  id: string;
  conversaId?: string;
  texto?: string;
  autorEmail?: string;
  criadoEm?: any;
};

type ConversaDados = {
  anuncioId?: string;
  anuncioTitulo?: string;
  anuncioPreco?: string;
  anuncioCidade?: string;
  anuncioEstado?: string;
  compradorEmail?: string;
  vendedorEmail?: string;
  participantes?: string[];
  naoLidasComprador?: number;
  naoLidasVendedor?: number;
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

export default function Conversa() {
  const params = useLocalSearchParams();

  const conversaId =
    typeof params.id === "string" ? params.id : "";

  const scrollRef = useRef<ScrollView | null>(null);

  const [usuario, setUsuario] = useState<User | null>(null);

  const [carregandoUsuario, setCarregandoUsuario] =
    useState(true);

  const [carregandoConversa, setCarregandoConversa] =
    useState(true);

  const [conversa, setConversa] =
    useState<ConversaDados | null>(null);

  const [mensagens, setMensagens] = useState<Mensagem[]>([]);

  const [texto, setTexto] = useState("");

  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user);

      setCarregandoUsuario(false);

      if (!user) {
        router.replace("/login");
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!conversaId || !usuario?.email) {
      return;
    }

    const ref = doc(db, "conversas", conversaId);

    const unsubscribe = onSnapshot(ref, async (snapshot) => {
      if (!snapshot.exists()) {
        setConversa(null);
        setCarregandoConversa(false);
        return;
      }

      const dados = snapshot.data() as ConversaDados;

      setConversa(dados);

      setCarregandoConversa(false);

      const emailTratado =
        usuario.email?.trim().toLowerCase() || "";

      const compradorEmail =
        dados.compradorEmail?.trim().toLowerCase();

      const vendedorEmail =
        dados.vendedorEmail?.trim().toLowerCase();

      try {
        if (
          emailTratado === compradorEmail &&
          dados.naoLidasComprador
        ) {
          await updateDoc(ref, {
            naoLidasComprador: 0,
          });
        }

        if (
          emailTratado === vendedorEmail &&
          dados.naoLidasVendedor
        ) {
          await updateDoc(ref, {
            naoLidasVendedor: 0,
          });
        }
      } catch {}
    });

    return unsubscribe;
  }, [conversaId, usuario]);

  useEffect(() => {
    if (!conversaId) {
      return;
    }

    const q = query(
      collection(db, "mensagens"),
      where("conversaId", "==", conversaId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map((documento) => ({
        id: documento.id,
        ...documento.data(),
      })) as Mensagem[];

      const ordenadas = lista.sort((a, b) => {
        const dataA = a.criadoEm?.toMillis?.() || 0;
        const dataB = b.criadoEm?.toMillis?.() || 0;

        return dataA - dataB;
      });

      setMensagens(ordenadas);

      setTimeout(() => {
        scrollRef.current?.scrollToEnd({
          animated: true,
        });
      }, 120);
    });

    return unsubscribe;
  }, [conversaId]);

  async function excluirConversa() {
    const emailTratado =
      usuario?.email?.trim().toLowerCase() || "";

    if (!emailTratado || !conversaId) {
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

              router.back();
            } catch {
              Alert.alert(
                "Erro",
                "Não foi possível excluir a conversa."
              );
            }
          },
        },
      ]
    );
  }

  async function enviarMensagem() {
    const textoTratado = texto.trim();

    const autorEmail =
      usuario?.email?.trim().toLowerCase() || "";

    if (!textoTratado || !conversaId || !autorEmail || enviando) {
      return;
    }

    try {
      setEnviando(true);

      const compradorEmail =
        conversa?.compradorEmail?.trim().toLowerCase();

      const vendedorEmail =
        conversa?.vendedorEmail?.trim().toLowerCase();

      const incrementoNaoLida =
        autorEmail === compradorEmail
          ? {
              naoLidasVendedor: increment(1),
            }
          : autorEmail === vendedorEmail
            ? {
                naoLidasComprador: increment(1),
              }
            : {};

      await addDoc(collection(db, "mensagens"), {
        conversaId,
        texto: textoTratado,
        autorEmail,
        criadoEm: serverTimestamp(),
      });

      await updateDoc(doc(db, "conversas", conversaId), {
        ultimaMensagem: textoTratado,
        atualizadoEm: serverTimestamp(),
        ocultoPara: [],
        ...incrementoNaoLida,
      });

      const outroUsuario =
        autorEmail === compradorEmail ? vendedorEmail : compradorEmail;

      if (outroUsuario) {
        await notificarMensagemLocal(
          conversa?.anuncioTitulo || "Nova mensagem",
          textoTratado
        );
      }

      setTexto("");

      setTimeout(() => {
        scrollRef.current?.scrollToEnd({
          animated: true,
        });
      }, 120);
    } finally {
      setEnviando(false);
    }
  }

  if (carregandoUsuario || carregandoConversa) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />

        <Text style={styles.loadingTexto}>Carregando conversa...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 28 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.flex}>
          <View style={styles.header}>
            <View style={styles.topoHeader}>
              <TouchableOpacity
                style={styles.voltar}
                onPress={() => router.back()}
              >
                <Ionicons
                  name="chevron-back"
                  size={22}
                  color={colors.primary}
                />

                <Text style={styles.voltarTexto}>Conversas</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botaoExcluir}
                onPress={excluirConversa}
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color="#DC2626"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.titulo}>
              {conversa?.anuncioTitulo || "Conversa"}
            </Text>
          </View>

          <View style={styles.cardAnuncio}>
            <Text style={styles.cardLabel}>Conversa sobre anúncio</Text>

            <Text style={styles.cardTitulo} numberOfLines={1}>
              {conversa?.anuncioTitulo || "Veículo anunciado"}
            </Text>

            <Text style={styles.cardInfo}>
              {conversa?.anuncioPreco || ""}
              {conversa?.anuncioCidade
                ? ` • ${conversa.anuncioCidade}`
                : ""}
              {conversa?.anuncioEstado
                ? ` - ${conversa.anuncioEstado}`
                : ""}
            </Text>
          </View>

          <ScrollView
            ref={scrollRef}
            style={styles.lista}
            contentContainerStyle={styles.listaConteudo}
            showsVerticalScrollIndicator={false}
          >
            {mensagens.map((mensagem) => {
              const minha =
                mensagem.autorEmail?.trim().toLowerCase() ===
                usuario?.email?.trim().toLowerCase();

              return (
                <View
                  key={mensagem.id}
                  style={[
                    styles.balaoWrap,
                    minha ? styles.balaoWrapMeu : styles.balaoWrapOutro,
                  ]}
                >
                  <View
                    style={[
                      styles.balao,
                      minha ? styles.balaoMeu : styles.balaoOutro,
                    ]}
                  >
                    <Text
                      style={[
                        styles.textoMensagem,
                        minha ? styles.textoMeu : styles.textoOutro,
                      ]}
                    >
                      {mensagem.texto}
                    </Text>

                    <Text
                      style={[
                        styles.horario,
                        minha ? styles.horarioMeu : styles.horarioOutro,
                      ]}
                    >
                      {formatarHorario(mensagem.criadoEm)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.caixa}>
            <TextInput
              style={styles.input}
              placeholder="Digite sua mensagem..."
              placeholderTextColor={colors.textMuted}
              value={texto}
              onChangeText={setTexto}
              multiline
            />

            <TouchableOpacity
              style={[
                styles.botaoEnviar,
                (!texto.trim() || enviando) && styles.botaoDesativado,
              ]}
              disabled={!texto.trim() || enviando}
              onPress={enviarMensagem}
            >
              {enviando ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  flex: {
    flex: 1,
  },

  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },

  loadingTexto: {
    marginTop: 10,
    color: colors.textMuted,
    fontWeight: "700",
  },

  header: {
    paddingTop: 48,
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  topoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  voltar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  voltarTexto: {
    color: colors.primary,
    fontWeight: "900",
    fontSize: 14,
  },

  botaoExcluir: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },

  titulo: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.text,
  },

  cardAnuncio: {
    marginHorizontal: 18,
    marginTop: 14,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 14,
  },

  cardLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: colors.textMuted,
    textTransform: "uppercase",
  },

  cardTitulo: {
    marginTop: 5,
    fontSize: 16,
    fontWeight: "900",
    color: colors.text,
  },

  cardInfo: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "700",
  },

  lista: {
    flex: 1,
  },

  listaConteudo: {
    padding: 18,
    paddingBottom: 28,
  },

  balaoWrap: {
    width: "100%",
    marginBottom: 10,
  },

  balaoWrapMeu: {
    alignItems: "flex-end",
  },

  balaoWrapOutro: {
    alignItems: "flex-start",
  },

  balao: {
    maxWidth: "82%",
    paddingHorizontal: 14,
    paddingTop: 11,
    paddingBottom: 8,
    borderRadius: 18,
  },

  balaoMeu: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 5,
  },

  balaoOutro: {
    backgroundColor: "#F3F4F6",
    borderBottomLeftRadius: 5,
  },

  textoMensagem: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
  },

  textoMeu: {
    color: "#FFFFFF",
  },

  textoOutro: {
    color: colors.text,
  },

  horario: {
    marginTop: 5,
    fontSize: 10,
    fontWeight: "800",
    alignSelf: "flex-end",
  },

  horarioMeu: {
    color: "rgba(255,255,255,0.72)",
  },

  horarioOutro: {
    color: colors.textMuted,
  },

  caixa: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 28 : 18,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },

  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 110,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },

  botaoEnviar: {
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  botaoDesativado: {
    opacity: 0.45,
  },
});