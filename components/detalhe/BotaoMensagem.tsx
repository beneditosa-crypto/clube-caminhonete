import { Alert, StyleSheet, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { User } from "firebase/auth";

import { db } from "../../services/firebase";
import { colors } from "../../utils/theme";

type Props = {
  usuarioLogado: User | null;
  anuncioId: string;
  anuncioTitulo?: string;
  vendedorEmail?: string;
};

export default function BotaoMensagem({
  usuarioLogado,
  anuncioId,
  anuncioTitulo,
  vendedorEmail,
}: Props) {
  async function abrirConversa() {
    if (!usuarioLogado?.email) {
      Alert.alert(
        "Login necessário",
        "Faça login para enviar mensagem ao anunciante."
      );
      router.push("/login");
      return;
    }

    if (!vendedorEmail) {
      Alert.alert("Aviso", "Não foi possível identificar o anunciante.");
      return;
    }

    const compradorEmail = usuarioLogado.email.trim().toLowerCase();
    const vendedorEmailTratado = vendedorEmail.trim().toLowerCase();

    if (compradorEmail === vendedorEmailTratado) {
      Alert.alert(
        "Aviso",
        "Este anúncio é seu. Você não pode enviar mensagem para você mesmo."
      );
      return;
    }

    try {
      const q = query(
        collection(db, "conversas"),
        where("anuncioId", "==", anuncioId),
        where("participantes", "array-contains", compradorEmail)
      );

      const resultado = await getDocs(q);

      const conversaExistente = resultado.docs.find((documento) => {
        const dados = documento.data();
        return (
          dados.vendedorEmail === vendedorEmailTratado &&
          dados.compradorEmail === compradorEmail
        );
      });

      if (conversaExistente) {
        router.push(`/conversa/${conversaExistente.id}` as any);
        return;
      }

      const novaConversa = await addDoc(collection(db, "conversas"), {
        anuncioId,
        anuncioTitulo: anuncioTitulo || "Anúncio",
        compradorId: usuarioLogado.uid,
        compradorEmail,
        vendedorEmail: vendedorEmailTratado,
        participantes: [compradorEmail, vendedorEmailTratado],
        ultimaMensagem: "",
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
      });

      router.push(`/conversa/${novaConversa.id}` as any);
    } catch (error) {
      console.log("ERRO AO ABRIR CONVERSA:", error);
      Alert.alert("Erro", "Não foi possível abrir a conversa.");
    }
  }

  return (
    <TouchableOpacity
      style={styles.botao}
      onPress={abrirConversa}
      activeOpacity={0.85}
    >
      <Text style={styles.texto}>Enviar mensagem</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  botao: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 12,
  },

  texto: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
});