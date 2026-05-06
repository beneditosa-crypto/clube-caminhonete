import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";

import { db } from "../../services/firebase";

import AppHeader from "../../components/layout/AppHeader";
import BotaoVoltar from "../../components/detalhe/BotaoVoltar";

type Evento = {
  id: string;
  titulo?: string;
  data?: string;
  cidade?: string;
  estado?: string;
  descricao?: string;
  fotos?: string[];
  link?: string;
  telefone?: string;
  whatsapp?: string;
  status?: string;
};

export default function DetalheEvento() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [evento, setEvento] = useState<Evento | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarEvento();
  }, [id]);

  async function carregarEvento() {
    if (!id) {
      setCarregando(false);
      return;
    }

    try {
      setCarregando(true);

      const ref = doc(db, "eventos", id);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        setEvento(null);
        return;
      }

      const dados = snap.data() as Omit<Evento, "id">;

      if (dados.status !== "ATIVO") {
        setEvento(null);
        return;
      }

      setEvento({
        id: snap.id,
        ...dados,
      });
    } catch {
      Alert.alert("Erro", "Não foi possível carregar o evento.");
      setEvento(null);
    } finally {
      setCarregando(false);
    }
  }

  function montarTextoEvento() {
    const titulo = evento?.titulo || "Evento";
    const data = evento?.data || "Data em breve";
    const local =
      [evento?.cidade, evento?.estado].filter(Boolean).join(" / ") ||
      "Local a confirmar";

    return `🚗 ${titulo}\n\n📅 ${data}\n📍 ${local}\n\nVi este evento no Volante.`;
  }

  async function abrirLink() {
    if (!evento?.link) return;

    const url = evento.link.startsWith("http")
      ? evento.link
      : `https://${evento.link}`;

    const podeAbrir = await Linking.canOpenURL(url);

    if (podeAbrir) {
      Linking.openURL(url);
    } else {
      Alert.alert("Link indisponível", "Não foi possível abrir o link.");
    }
  }

  async function compartilharEvento() {
    if (!evento) return;

    await Share.share({
      message: montarTextoEvento(),
    });
  }

  async function enviarWhatsApp() {
    if (!evento) return;

    const telefoneBase = evento.whatsapp || evento.telefone || "";
    const numero = telefoneBase.replace(/\D/g, "");

    const mensagem = encodeURIComponent(montarTextoEvento());

    if (numero.length >= 10) {
      Linking.openURL(`https://wa.me/55${numero}?text=${mensagem}`);
      return;
    }

    Linking.openURL(`https://wa.me/?text=${mensagem}`);
  }

  if (carregando) {
    return (
      <View style={styles.centralizado}>
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text style={styles.textoCentral}>Carregando evento...</Text>
      </View>
    );
  }

  if (!evento) {
    return (
      <View style={styles.centralizado}>
        <Text style={styles.tituloIndisponivel}>Evento indisponível</Text>
        <Text style={styles.textoCentral}>
          Este evento não está mais disponível.
        </Text>

        <TouchableOpacity
          style={styles.botaoVoltarIndisponivel}
          onPress={() => router.back()}
          activeOpacity={0.85}
        >
          <Text style={styles.botaoVoltarTexto}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.conteudo}
      showsVerticalScrollIndicator={false}
    >
      <AppHeader slogan="Mais que carros, uma paixão" mostrarNotificacao />

      <View style={styles.espacoAposHeader} />

      {evento.fotos?.[0] ? (
        <Image source={{ uri: evento.fotos[0] }} style={styles.foto} />
      ) : (
        <View style={styles.semFoto}>
          <Text style={styles.semFotoTexto}>Evento</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.data}>{evento.data || "Data em breve"}</Text>

        <Text style={styles.titulo}>{evento.titulo || "Evento"}</Text>

        <Text style={styles.local}>
          {[evento.cidade, evento.estado].filter(Boolean).join(" / ") ||
            "Local a confirmar"}
        </Text>

        {evento.descricao ? (
          <Text style={styles.descricao}>{evento.descricao}</Text>
        ) : null}

        {evento.link ? (
          <TouchableOpacity
            style={styles.botaoPrincipal}
            onPress={abrirLink}
            activeOpacity={0.85}
          >
            <Text style={styles.botaoPrincipalTexto}>Abrir link do evento</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.acoesEvento}>
          <TouchableOpacity
            style={[styles.botaoAcao, styles.botaoWhatsApp]}
            onPress={enviarWhatsApp}
            activeOpacity={0.85}
          >
            <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
            <Text style={styles.botaoAcaoTexto}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.botaoAcao, styles.botaoCompartilhar]}
            onPress={compartilharEvento}
            activeOpacity={0.85}
          >
            <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
            <Text style={styles.botaoAcaoTexto}>Compartilhar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.blocoSeguranca}>
        <Text style={styles.segurancaTitulo}>Informações do evento</Text>
        <Text style={styles.segurancaTexto}>
          Confirme data, local e condições diretamente com a organização antes
          de se deslocar.
        </Text>
      </View>

      <View style={styles.voltarBox}>
        <BotaoVoltar />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  conteudo: {
    paddingTop: 10,
    paddingBottom: 120,
    backgroundColor: "#FFFFFF",
  },

  espacoAposHeader: {
    height: 20,
  },

  foto: {
    marginHorizontal: 16,
    width: "auto",
    height: 230,
    borderRadius: 22,
    backgroundColor: "#F3F4F6",
  },

  semFoto: {
    marginHorizontal: 16,
    height: 230,
    borderRadius: 22,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },

  semFotoTexto: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "900",
  },

  card: {
    marginTop: 14,
    marginHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  data: {
    color: "#1E3A8A",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 8,
  },

  titulo: {
    color: "#111111",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 8,
    lineHeight: 30,
  },

  local: {
    color: "#6B7280",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 14,
  },

  descricao: {
    color: "#374151",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
  },

  botaoPrincipal: {
    marginTop: 18,
    backgroundColor: "#1E3A8A",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },

  botaoPrincipalTexto: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  acoesEvento: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },

  botaoAcao: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  botaoWhatsApp: {
    backgroundColor: "#22C55E",
  },

  botaoCompartilhar: {
    backgroundColor: "#374151",
  },

  botaoAcaoTexto: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  blocoSeguranca: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  segurancaTitulo: {
    fontSize: 15,
    fontWeight: "900",
    color: "#111111",
  },

  segurancaTexto: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
    color: "#6B7280",
  },

  voltarBox: {
    marginTop: 14,
    marginHorizontal: 16,
  },

  centralizado: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#FFFFFF",
  },

  tituloIndisponivel: {
    fontSize: 24,
    fontWeight: "900",
    color: "#111111",
    textAlign: "center",
  },

  textoCentral: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 12,
    textAlign: "center",
  },

  botaoVoltarIndisponivel: {
    marginTop: 22,
    backgroundColor: "#1E3A8A",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },

  botaoVoltarTexto: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 15,
  },
});