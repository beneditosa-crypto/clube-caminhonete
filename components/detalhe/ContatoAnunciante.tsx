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
  preco?: string | number;
  cidade?: string;
  estado?: string;
  foto?: string;
};

export default function ContatoAnunciante({
  usuarioLogado,
  anuncioId,
  email,
  telefone,
  titulo,
  preco,
  cidade,
  estado,
  foto,
}: Props) {
  const usuarioEmail = usuarioLogado?.email?.trim().toLowerCase();
  const anuncianteEmail = email?.trim().toLowerCase();

  const ehMeuAnuncio =
    !!usuarioEmail &&
    !!anuncianteEmail &&
    usuarioEmail === anuncianteEmail;

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

    if (ehMeuAnuncio) {
      Alert.alert("Atenção", "Este anúncio é seu.");
      return;
    }

    if (!telefone) {
      Alert.alert("Contato indisponível", "WhatsApp não informado.");
      return;
    }

    const numero = telefone.replace(/\D/g, "");

    if (!numero) {
      Alert.alert("Contato indisponível", "Número inválido.");
      return;
    }

    const mensagem = encodeURIComponent(
      `Olá! Vi seu anúncio "${
        titulo || "Veículo anunciado"
      }" no Volante e gostaria de mais informações.`
    );

    Linking.openURL(`https://wa.me/55${numero}?text=${mensagem}`);
  }

  async function compartilhar() {
    if (!exigirLogin()) return;

    const precoTexto =
      preco !== undefined && preco !== null && preco !== ""
        ? `💰 ${preco}`
        : "";

    const localTexto =
      cidade || estado
        ? `📍 ${cidade || ""}${cidade && estado ? " - " : ""}${estado || ""}`
        : "";

    const link = anuncioId
      ? `https://volante.app.br/api/og?tipo=anuncio&id=${anuncioId}`
      : "https://volante.app.br";

    const mensagem =
      `🚗 ${titulo || "Veículo anunciado"}\n\n` +
      `${precoTexto}\n` +
      `${localTexto}\n\n` +
      `Vi este anúncio no Volante.\n\n` +
      `Confira:\n${link}`;

    try {
      await Share.share({
        title: titulo || "Anúncio Volante",
        message: mensagem,
        url: foto,
      });
    } catch {
      Alert.alert("Erro", "Não foi possível compartilhar o anúncio.");
    }
  }

  async function enviarMensagem() {
    if (!exigirLogin()) return;

    if (!email || !anuncioId) {
      Alert.alert("Erro", "Dados do anúncio incompletos.");
      return;
    }

    const compradorEmail = usuarioLogado.email.trim().toLowerCase();
    const vendedorEmail = email.trim().toLowerCase();

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

      const conversaExistente = snapshot.docs.find((documento) => {
        const dados = documento.data();

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
        naoLidasComprador: 0,
        naoLidasVendedor: 0,
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
      {!ehMeuAnuncio && (
        <View style={styles.linhaBotoes}>
          <TouchableOpacity
            style={[styles.botao, styles.botaoMensagem]}
            onPress={enviarMensagem}
            activeOpacity={0.85}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={18}
              color="#FFFFFF"
            />
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
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.botaoCompartilhar,
          ehMeuAnuncio && styles.botaoCompartilharUnico,
        ]}
        onPress={compartilhar}
        activeOpacity={0.85}
      >
        <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
        <Text style={styles.textoBotao}>Compartilhar anúncio</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
  },

  linhaBotoes: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  botao: {
    flex: 1,
    minHeight: 46,
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  botaoMensagem: {
    backgroundColor: "#1E3A8A",
  },

  botaoWhatsApp: {
    backgroundColor: "#22C55E",
  },

  botaoCompartilhar: {
    width: "100%",
    minHeight: 46,
    marginTop: 10,
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#374151",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  botaoCompartilharUnico: {
    marginTop: 0,
  },

  textoBotao: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center",
  },
});