import {
  Alert,
  Linking,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { db } from "../../services/firebase";

type Props = {
  usuarioLogado: any;
  anuncioId?: string;
  email?: string;
  telefone?: string;
  titulo?: string;
};

export default function ContatoAnunciante({
  usuarioLogado,
  anuncioId,
  email,
  telefone,
  titulo,
}: Props) {
  function exigirLogin() {
    if (!usuarioLogado?.email) {
      Alert.alert(
        "Login necessário",
        "Faça login para entrar em contato ou compartilhar."
      );
      router.push("/login");
      return false;
    }

    return true;
  }

  function chamarWhatsApp() {
    if (!exigirLogin()) return;

    if (!telefone) {
      Alert.alert("Contato indisponível", "WhatsApp não informado.");
      return;
    }

    const numero = telefone.replace(/\D/g, "");

    const mensagem = encodeURIComponent(
      `Olá! Vi seu anúncio "${titulo || "Veículo anunciado"}" no Volante e gostaria de mais informações.`
    );

    Linking.openURL(`https://wa.me/55${numero}?text=${mensagem}`);
  }

  async function compartilhar() {
    if (!exigirLogin()) return;

    await Share.share({
      message: `🚗 ${titulo || "Anúncio"}\n\nVi este anúncio no Volante.`,
    });
  }

  async function enviarMensagem() {
    if (!exigirLogin()) return;

    if (!email || !anuncioId) {
      Alert.alert("Erro", "Dados do anúncio incompletos.");
      return;
    }

    const compradorEmail = usuarioLogado.email.toLowerCase();
    const vendedorEmail = email.toLowerCase();

    if (compradorEmail === vendedorEmail) {
      Alert.alert("Atenção", "Este anúncio é seu.");
      return;
    }

    try {
      const q = query(
        collection(db, "conversas"),
        where("participantes", "array-contains", compradorEmail)
      );

      const snapshot = await getDocs(q);

      const conversaExistente = snapshot.docs.find((doc) => {
        const dados = doc.data();

        return (
          dados.vendedorEmail === vendedorEmail &&
          dados.anuncioId === anuncioId
        );
      });

      if (conversaExistente) {
        router.push(`/conversa/${conversaExistente.id}` as any);
        return;
      }

      const conversa = await addDoc(collection(db, "conversas"), {
        anuncioId,
        anuncioTitulo: titulo || "Veículo anunciado",
        compradorEmail,
        vendedorEmail,
        participantes: [compradorEmail, vendedorEmail],
        ultimaMensagem: "",
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
      });

      router.push(`/conversa/${conversa.id}` as any);
    } catch {
      Alert.alert("Erro", "Não foi possível iniciar a conversa.");
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.botao, styles.botaoMensagem]}
        onPress={enviarMensagem}
        activeOpacity={0.85}
      >
        <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFFFFF" />
        <Text style={styles.textoBotao}>Mensagem</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.botao, styles.botaoWhatsApp]}
        onPress={chamarWhatsApp}
        activeOpacity={0.85}
      >
        <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
        <Text style={styles.textoBotao}>WhatsApp</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.botao, styles.botaoCompartilhar]}
        onPress={compartilhar}
        activeOpacity={0.85}
      >
        <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
        <Text style={styles.textoBotao}>Enviar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },

  botao: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  botaoMensagem: {
    backgroundColor: "#1E3A8A",
  },

  botaoWhatsApp: {
    backgroundColor: "#22C55E",
  },

  botaoCompartilhar: {
    backgroundColor: "#374151",
  },

  textoBotao: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
});