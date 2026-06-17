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
  updateDoc,
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
    !!usuarioEmail && !!anuncianteEmail && usuarioEmail === anuncianteEmail;

  function exigirLogin() {
    if (!usuarioLogado?.email) {
      Alert.alert(
        "Login necessário",
        "Faça login para entrar em contato com o anunciante."
      );

      router.push("/login");
      return false;
    }

    return true;
  }

  function gerarSlug(texto: string) {
    return texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function gerarLinkCompartilhamento() {
    if (!anuncioId) {
      return "https://volante.app.br";
    }

    const tituloSlug = gerarSlug(titulo || "anuncio");

    return `https://volante.app.br/anuncio/${tituloSlug}-${anuncioId}`;
  }

  function formatarPreco(valor?: string | number) {
    if (valor === undefined || valor === null || valor === "") {
      return "";
    }

    const numero =
      typeof valor === "number"
        ? valor
        : Number(String(valor).replace(/\D/g, ""));

    if (!numero || Number.isNaN(numero)) {
      return "";
    }

    return numero.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function gerarTextoCompartilhamento() {
    const precoTexto = formatarPreco(preco);

    const localTexto =
      cidade || estado
        ? `${cidade || ""}${cidade && estado ? " - " : ""}${estado || ""}`
        : "";

    const linhas = [
      titulo || "Veículo anunciado",
      "",
      precoTexto,
      "",
      localTexto,
      "",
      "Veja este anúncio no Volante:",
      gerarLinkCompartilhamento(),
    ];

    return linhas.join("\n");
  }

  async function chamarWhatsApp() {
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

  async function compartilharAnuncio() {
    try {
      await Share.share({
        title: titulo || "Volante App",
        message: gerarTextoCompartilhamento(),
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
          dados.vendedorEmail === vendedorEmail && dados.anuncioId === anuncioId
        );
      });

      if (conversaExistente) {
        await updateDoc(conversaExistente.ref, {
          ocultoPara: [],
          atualizadoEm: serverTimestamp(),
        });

        router.push(`/conversa/${conversaExistente.id}` as any);
        return;
      }

      const conversa = await addDoc(collection(db, "conversas"), {
        anuncioId,
        anuncioTitulo: titulo || "Veículo anunciado",
        anuncioPreco:
          preco !== undefined && preco !== null ? String(preco) : "",
        anuncioCidade: cidade || "",
        anuncioEstado: estado || "",
        anuncioFoto: foto || "",
        compradorEmail,
        vendedorEmail,
        participantes: [compradorEmail, vendedorEmail],
        ultimaMensagem: "",
        naoLidasComprador: 0,
        naoLidasVendedor: 0,
        ocultoPara: [],
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
        <>
          <View style={styles.topoContato}>
            <Text style={styles.contatoTitulo}>
              Entre em contato com o anunciante
            </Text>

            <Text style={styles.contatoSubtitulo}>
              Tire dúvidas e negocie com segurança.
            </Text>
          </View>

          <View style={styles.linhaPrincipal}>
            <TouchableOpacity
              style={[styles.botaoPrincipal, styles.botaoMensagem]}
              onPress={enviarMensagem}
              activeOpacity={0.85}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={18}
                color="#FFFFFF"
              />

              <Text style={styles.textoBotaoPrincipal}>Mensagem</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.botaoPrincipal, styles.botaoWhatsApp]}
              onPress={chamarWhatsApp}
              activeOpacity={0.85}
            >
              <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
              <Text style={styles.textoBotaoPrincipal}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <View style={styles.areaCompartilhar}>
        <TouchableOpacity
          style={styles.botaoCompartilharUnico}
          onPress={compartilharAnuncio}
          activeOpacity={0.85}
        >
          <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />

          <Text style={styles.textoCompartilharUnico}>
            Compartilhar anúncio
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },

  topoContato: {
    width: "100%",
    marginBottom: 14,
  },

  contatoTitulo: {
    fontSize: 13,
    fontWeight: "900",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  contatoSubtitulo: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    color: "#9CA3AF",
  },

  linhaPrincipal: {
    flexDirection: "row",
    gap: 10,
  },

  botaoPrincipal: {
    flex: 1,
    minHeight: 50,
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  botaoMensagem: {
    backgroundColor: "#1E3A8A",
  },

  botaoWhatsApp: {
    backgroundColor: "#22C55E",
  },

  textoBotaoPrincipal: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  areaCompartilhar: {
    marginTop: 18,
    width: "100%",
    backgroundColor: "#F9FAFB",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: "center",
  },

  botaoCompartilharUnico: {
    width: "100%",
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: "#1E3A8A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  textoCompartilharUnico: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
});