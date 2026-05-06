import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { User, onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
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
};

export default function Conversa() {
  const params = useLocalSearchParams();
  const conversaId = typeof params.id === "string" ? params.id : "";

  const [usuario, setUsuario] = useState<User | null>(null);
  const [carregandoUsuario, setCarregandoUsuario] = useState(true);
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
    if (!conversaId) return;

    const q = query(
      collection(db, "mensagens"),
      where("conversaId", "==", conversaId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map((documento) => ({
        id: documento.id,
        ...documento.data(),
      })) as Mensagem[];

      setMensagens(lista);
    });

    return () => unsubscribe();
  }, [conversaId]);

  async function enviarMensagem() {
    const textoTratado = texto.trim();

    if (!usuario?.email) {
      router.replace("/login");
      return;
    }

    if (!textoTratado) return;

    try {
      setEnviando(true);

      await addDoc(collection(db, "mensagens"), {
        conversaId,
        texto: textoTratado,
        autorEmail: usuario.email.toLowerCase(),
        criadoEm: serverTimestamp(),
      });

      await updateDoc(doc(db, "conversas", conversaId), {
        ultimaMensagem: textoTratado,
        atualizadoEm: serverTimestamp(),
      });

      setTexto("");
    } catch (error) {
      Alert.alert("Erro", "Não foi possível enviar a mensagem.");
    } finally {
      setEnviando(false);
    }
  }

  if (carregandoUsuario) {
    return (
      <View style={styles.centralizado}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.voltar}>Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.titulo}>Conversa</Text>
      </View>

      <ScrollView
        style={styles.lista}
        contentContainerStyle={styles.listaConteudo}
        showsVerticalScrollIndicator={false}
      >
        {mensagens.length === 0 && (
          <View style={styles.vazio}>
            <Text style={styles.vazioTitulo}>Nenhuma mensagem ainda</Text>
            <Text style={styles.vazioTexto}>
              Envie a primeira mensagem sobre este anúncio.
            </Text>
          </View>
        )}

        {mensagens.map((mensagem) => {
          const minha =
            mensagem.autorEmail?.toLowerCase() ===
            usuario?.email?.toLowerCase();

          return (
            <View
              key={mensagem.id}
              style={[
                styles.balao,
                minha ? styles.balaoMeu : styles.balaoOutro,
              ]}
            >
              <Text style={styles.texto}>{mensagem.texto}</Text>
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
        />

        <TouchableOpacity
          style={[styles.botao, enviando && styles.botaoDesativado]}
          onPress={enviarMensagem}
          disabled={enviando}
        >
          <Text style={styles.botaoTexto}>
            {enviando ? "..." : "Enviar"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  centralizado: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },

  header: {
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },

  voltar: {
    color: colors.primary,
    fontWeight: "900",
    marginBottom: 8,
  },

  titulo: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.text,
  },

  lista: {
    flex: 1,
  },

  listaConteudo: {
    padding: 20,
    paddingBottom: 30,
  },

  vazio: {
    alignItems: "center",
    marginTop: 80,
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
  },

  balao: {
    maxWidth: "82%",
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
  },

  balaoMeu: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },

  balaoOutro: {
    alignSelf: "flex-start",
    backgroundColor: "#F3F4F6",
    borderBottomLeftRadius: 4,
  },

  texto: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  caixa: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 100,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },

  input: {
    flex: 1,
    maxHeight: 110,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15,
  },

  botao: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 14,
  },

  botaoDesativado: {
    opacity: 0.6,
  },

  botaoTexto: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
});