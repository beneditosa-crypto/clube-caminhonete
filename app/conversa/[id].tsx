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
import { router, useLocalSearchParams } from "expo-router";
import { User, onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
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
import { colors } from "../../utils/theme";

type Mensagem = {
  id: string;
  conversaId?: string;
  texto?: string;
  autorEmail?: string;
  criadoEm?: any;
};

type ConversaDados = {
  anuncioTitulo?: string;
  participantes?: string[];
  compradorEmail?: string;
  vendedorEmail?: string;
  naoLidasComprador?: number;
  naoLidasVendedor?: number;
};

export default function Conversa() {
  const params = useLocalSearchParams();
  const conversaId = typeof params.id === "string" ? params.id : "";

  const scrollRef = useRef<ScrollView | null>(null);

  const [usuario, setUsuario] = useState<User | null>(null);
  const [carregandoUsuario, setCarregandoUsuario] = useState(true);
  const [carregandoConversa, setCarregandoConversa] = useState(true);
  const [conversa, setConversa] = useState<ConversaDados | null>(null);
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
    if (!conversaId || !usuario?.email) return;

    const ref = doc(db, "conversas", conversaId);

    const unsubscribe = onSnapshot(
      ref,
      async (snapshot) => {
        if (!snapshot.exists()) {
          setConversa(null);
          setCarregandoConversa(false);
          return;
        }

        const dados = snapshot.data() as ConversaDados;
        const emailTratado = usuario.email?.trim().toLowerCase();

        const autorizado = dados.participantes?.some(
          (email) => email.trim().toLowerCase() === emailTratado
        );

        if (!autorizado) {
          Alert.alert("Acesso negado", "Você não participa desta conversa.");
          router.replace("/conversas");
          return;
        }

        setConversa(dados);
        setCarregandoConversa(false);

        const compradorEmail = dados.compradorEmail?.trim().toLowerCase();
        const vendedorEmail = dados.vendedorEmail?.trim().toLowerCase();

        try {
          if (emailTratado === compradorEmail && dados.naoLidasComprador) {
            await updateDoc(ref, {
              naoLidasComprador: 0,
            });
          }

          if (emailTratado === vendedorEmail && dados.naoLidasVendedor) {
            await updateDoc(ref, {
              naoLidasVendedor: 0,
            });
          }
        } catch {
          // Não bloqueia a conversa se falhar ao limpar contador.
        }
      },
      () => {
        setCarregandoConversa(false);
        Alert.alert("Erro", "Não foi possível carregar a conversa.");
      }
    );

    return unsubscribe;
  }, [conversaId, usuario]);

  useEffect(() => {
    if (!conversaId || !usuario?.email) return;

    const q = query(
      collection(db, "mensagens"),
      where("conversaId", "==", conversaId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
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
          scrollRef.current?.scrollToEnd({ animated: true });
        }, 150);
      },
      () => {
        Alert.alert("Erro", "Não foi possível carregar as mensagens.");
      }
    );

    return () => unsubscribe();
  }, [conversaId, usuario]);

  async function enviarMensagem() {
    const textoTratado = texto.trim();

    if (!usuario?.email) {
      router.replace("/login");
      return;
    }

    if (!conversaId || !conversa) {
      Alert.alert("Erro", "Conversa inválida.");
      return;
    }

    if (!textoTratado || enviando) return;

    try {
      setEnviando(true);

      const autorEmail = usuario.email.trim().toLowerCase();
      const compradorEmail = conversa.compradorEmail?.trim().toLowerCase();
      const vendedorEmail = conversa.vendedorEmail?.trim().toLowerCase();

      const incrementoNaoLida =
        autorEmail === compradorEmail
          ? { naoLidasVendedor: increment(1) }
          : autorEmail === vendedorEmail
          ? { naoLidasComprador: increment(1) }
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
        ...incrementoNaoLida,
      });

      setTexto("");
    } catch {
      Alert.alert("Erro", "Não foi possível enviar a mensagem.");
    } finally {
      setEnviando(false);
    }
  }

  if (carregandoUsuario || carregandoConversa) {
    return (
      <View style={styles.centralizado}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingTexto}>Carregando conversa...</Text>
      </View>
    );
  }

  if (!conversa) {
    return (
      <View style={styles.centralizado}>
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={34}
          color={colors.iconMuted}
        />

        <Text style={styles.indisponivelTitulo}>Conversa indisponível</Text>

        <TouchableOpacity
          style={styles.botaoVoltarLista}
          onPress={() => router.replace("/conversas")}
          activeOpacity={0.85}
        >
          <Text style={styles.botaoVoltarListaTexto}>Voltar para conversas</Text>
        </TouchableOpacity>
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
            <TouchableOpacity
              style={styles.voltarBotao}
              onPress={() => router.back()}
              activeOpacity={0.85}
            >
              <Ionicons name="chevron-back" size={22} color={colors.primary} />
              <Text style={styles.voltarTexto}>Conversas</Text>
            </TouchableOpacity>

            <Text style={styles.titulo} numberOfLines={1}>
              {conversa.anuncioTitulo || "Conversa"}
            </Text>
          </View>

          <ScrollView
            ref={scrollRef}
            style={styles.lista}
            contentContainerStyle={styles.listaConteudo}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() =>
              scrollRef.current?.scrollToEnd({ animated: true })
            }
          >
            {mensagens.length === 0 && (
              <View style={styles.vazio}>
                <View style={styles.vazioIcone}>
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={30}
                    color={colors.primary}
                  />
                </View>

                <Text style={styles.vazioTitulo}>Nenhuma mensagem ainda</Text>

                <Text style={styles.vazioTexto}>
                  Envie a primeira mensagem sobre este anúncio.
                </Text>
              </View>
            )}

            {mensagens.map((mensagem) => {
              const minha =
                mensagem.autorEmail?.trim().toLowerCase() ===
                usuario?.email?.trim().toLowerCase();

              return (
                <View
                  key={mensagem.id}
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
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.caixa}>
            <TextInput
              style={styles.input}
              placeholder="Digite sua mensagem..."
              placeholderTextColor={colors.iconMuted}
              value={texto}
              onChangeText={setTexto}
              multiline
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={enviarMensagem}
              textAlignVertical="center"
            />

            <TouchableOpacity
              style={[
                styles.botaoEnviar,
                (!texto.trim() || enviando) && styles.botaoDesativado,
              ]}
              onPress={enviarMensagem}
              disabled={!texto.trim() || enviando}
              activeOpacity={0.85}
            >
              {enviando ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
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

  centralizado: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: colors.background,
  },

  loadingTexto: {
    marginTop: 10,
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
  },

  indisponivelTitulo: {
    marginTop: 14,
    fontSize: 19,
    fontWeight: "900",
    color: colors.text,
    textAlign: "center",
  },

  botaoVoltarLista: {
    marginTop: 18,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },

  botaoVoltarListaTexto: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  header: {
    paddingTop: 48,
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },

  voltarBotao: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 8,
  },

  voltarTexto: {
    color: colors.primary,
    fontWeight: "900",
    fontSize: 14,
  },

  titulo: {
    fontSize: 21,
    fontWeight: "900",
    color: colors.text,
  },

  lista: {
    flex: 1,
  },

  listaConteudo: {
    padding: 18,
    paddingBottom: 28,
  },

  vazio: {
    alignItems: "center",
    marginTop: 70,
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
    fontSize: 18,
    fontWeight: "900",
    color: colors.text,
  },

  vazioTexto: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "600",
  },

  balao: {
    maxWidth: "82%",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 18,
    marginBottom: 10,
  },

  balaoMeu: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
    borderBottomRightRadius: 5,
  },

  balaoOutro: {
    alignSelf: "flex-start",
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