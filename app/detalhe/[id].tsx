import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../../services/firebase";

import AppHeader from "../../components/layout/AppHeader";
import BotaoVoltar from "../../components/detalhe/BotaoVoltar";
import ContatoAnunciante from "../../components/detalhe/ContatoAnunciante";
import GaleriaFotos from "../../components/detalhe/GaleriaFotos";
import InfoVeiculo from "../../components/detalhe/InfoVeiculo";

type Anuncio = {
  id: string;
  titulo?: string;
  marca?: string;
  modelo?: string;
  ano?: string | number;
  preco?: string | number;
  estado?: string;
  cidade?: string;
  descricao?: string;
  fotos?: string[];
  status?: string;
  usuarioEmail?: string;
  telefone?: string;
};

export default function DetalheAnuncio() {
  const params = useLocalSearchParams();
  const id = typeof params.id === "string" ? params.id : "";

  const [usuario, setUsuario] = useState<User | null>(null);
  const [carregandoUsuario, setCarregandoUsuario] = useState(true);
  const [anuncio, setAnuncio] = useState<Anuncio | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      setCarregandoUsuario(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!carregandoUsuario) carregarAnuncio();
  }, [id, carregandoUsuario, usuario]);

  async function carregarAnuncio() {
    if (!id) {
      setCarregando(false);
      return;
    }

    try {
      setCarregando(true);

      const ref = doc(db, "anuncios", id);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        setAnuncio(null);
        return;
      }

      const dados = snap.data() as Omit<Anuncio, "id">;

      const usuarioEhDono =
        usuario?.email &&
        dados.usuarioEmail &&
        usuario.email.trim().toLowerCase() ===
          dados.usuarioEmail.trim().toLowerCase();

      const anuncioAtivo = dados.status === "ATIVO";

      if (!anuncioAtivo && !usuarioEhDono) {
        setAnuncio(null);
        return;
      }

      setAnuncio({
        id: snap.id,
        ...dados,
      });
    } catch {
      Alert.alert("Erro", "Não foi possível carregar o anúncio.");
    } finally {
      setCarregando(false);
    }
  }

  if (carregando || carregandoUsuario) {
    return (
      <View style={styles.centralizado}>
        <ActivityIndicator size="large" color="#111111" />
        <Text style={styles.texto}>Carregando anúncio...</Text>
      </View>
    );
  }

  if (!anuncio) {
    return (
      <View style={styles.centralizado}>
        <Text style={styles.titulo}>Anúncio indisponível</Text>
        <Text style={styles.texto}>Este anúncio não está mais disponível.</Text>

        <View style={styles.voltarBoxIndisponivel}>
          <BotaoVoltar />
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
      <AppHeader slogan="Mais que carros, uma paixão" mostrarNotificacao />

      <View style={styles.espacoAposHeader} />

      {anuncio.status !== "ATIVO" && (
        <View style={styles.aviso}>
          <Text style={styles.avisoTitulo}>Anúncio em análise</Text>
          <Text style={styles.avisoTexto}>
            Status atual: {anuncio.status || "SEM STATUS"}
          </Text>
        </View>
      )}

      <GaleriaFotos fotos={anuncio.fotos} />

      <View style={styles.blocoInfo}>
        <InfoVeiculo
          titulo={anuncio.titulo}
          marca={anuncio.marca}
          modelo={anuncio.modelo}
          ano={String(anuncio.ano || "")}
          cidade={anuncio.cidade}
          estado={anuncio.estado}
          preco={anuncio.preco}
          descricao={anuncio.descricao}
        />
      </View>

      <View style={styles.blocoContato}>
        <ContatoAnunciante
          usuarioLogado={usuario}
          anuncioId={anuncio.id}
          email={anuncio.usuarioEmail}
          telefone={anuncio.telefone}
          titulo={anuncio.titulo}
          preco={anuncio.preco}
          cidade={anuncio.cidade}
          estado={anuncio.estado}
          foto={anuncio.fotos?.[0]}
        />
      </View>

      <View style={styles.blocoSeguranca}>
        <Text style={styles.segurancaTitulo}>Negocie com segurança</Text>
        <Text style={styles.segurancaTexto}>
          Confira os dados do veículo, converse pelo Volante e evite pagamentos
          antecipados sem verificar o anúncio.
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

  blocoInfo: {
    marginTop: 14,
    marginHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  blocoContato: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
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

  voltarBoxIndisponivel: {
    marginTop: 20,
  },

  aviso: {
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  avisoTitulo: {
    fontSize: 15,
    fontWeight: "900",
    color: "#111111",
  },

  avisoTexto: {
    color: "#6B7280",
    marginTop: 4,
    fontWeight: "700",
  },

  centralizado: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#FFFFFF",
  },

  titulo: {
    fontSize: 24,
    fontWeight: "900",
    color: "#111111",
    textAlign: "center",
  },

  texto: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 12,
    textAlign: "center",
  },
});