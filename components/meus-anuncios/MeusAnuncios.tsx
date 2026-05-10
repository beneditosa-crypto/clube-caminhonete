import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "../../services/firebase";

type Anuncio = {
  id: string;
  titulo?: string;
  marca?: string;
  modelo?: string;
  ano?: number;
  preco?: number;
  cidade?: string;
  estado?: string;
  descricao?: string;
  fotos?: string[];
  status?: string;
  motivoPendencia?: string;
};

export default function MeusAnuncios() {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const usuario = auth.currentUser;

    if (!usuario?.email) {
      setCarregando(false);
      return;
    }

    const q = query(
      collection(db, "anuncios"),
      where("usuarioEmail", "==", usuario.email)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map((documento) => ({
        id: documento.id,
        ...documento.data(),
      })) as Anuncio[];

      const visiveis = lista.filter((item) => item.status !== "EXCLUIDO");

      setAnuncios(visiveis.reverse());
      setCarregando(false);
    });

    return () => unsubscribe();
  }, []);

  function formatarPreco(valor?: number) {
    if (!valor) return "Valor não informado";

    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function corStatus(status?: string) {
    if (status === "ATIVO") return "#22C55E";
    if (status === "PENDENTE") return "#F59E0B";
    if (status === "RECUSADO") return "#EF4444";
    return "#9CA3AF";
  }

  function textoStatus(status?: string) {
    if (status === "ATIVO") return "ATIVO";
    if (status === "PENDENTE") return "EM ANÁLISE";
    if (status === "RECUSADO") return "RECUSADO";
    return "SEM STATUS";
  }

  function confirmarExcluir(id: string) {
    Alert.alert("Excluir anúncio", "Deseja remover este anúncio?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => excluirAnuncio(id),
      },
    ]);
  }

  async function excluirAnuncio(id: string) {
    try {
      await updateDoc(doc(db, "anuncios", id), {
        status: "EXCLUIDO",
      });
    } catch {
      Alert.alert("Erro", "Não foi possível excluir.");
    }
  }

  if (carregando) {
    return (
      <View style={styles.containerCarregando}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  if (anuncios.length === 0) {
    return (
      <View style={styles.vazio}>
        <Text style={styles.vazioTitulo}>Nenhum anúncio ainda</Text>
        <Text style={styles.vazioTexto}>
          Crie seu primeiro anúncio para começar
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {anuncios.map((item) => (
        <View key={item.id} style={styles.card}>
          <Image
            source={
              item.fotos?.[0]
                ? { uri: item.fotos[0] }
                : require("../../assets/images/logo.png")
            }
            style={styles.foto}
            resizeMode="cover"
          />

          <View style={styles.infoBox}>
            <Text style={styles.titulo} numberOfLines={1}>
              {item.titulo || "Veículo"}
            </Text>

            <Text style={styles.info} numberOfLines={1}>
              {[item.marca, item.modelo, item.ano].filter(Boolean).join(" • ")}
            </Text>

            <Text style={styles.preco}>{formatarPreco(item.preco)}</Text>

            <Text style={styles.local}>
              {item.cidade || "Cidade"} / {item.estado || "UF"}
            </Text>

            <View
              style={[
                styles.statusBox,
                { backgroundColor: corStatus(item.status) },
              ]}
            >
              <Text style={styles.statusTexto}>{textoStatus(item.status)}</Text>
            </View>

            {item.status === "RECUSADO" && item.motivoPendencia ? (
              <Text style={styles.motivo}>{item.motivoPendencia}</Text>
            ) : null}

            <View style={styles.acoes}>
              <TouchableOpacity
                style={styles.botaoEditar}
                onPress={() => router.push(`/publicar?id=${item.id}`)}
                activeOpacity={0.85}
              >
                <Text style={styles.botaoEditarTexto}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botaoExcluir}
                onPress={() => confirmarExcluir(item.id)}
                activeOpacity={0.85}
              >
                <Text style={styles.botaoExcluirTexto}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  containerCarregando: {
    paddingHorizontal: 14,
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  container: {
    paddingHorizontal: 14,
    paddingBottom: 90,
  },

  vazio: {
    marginHorizontal: 2,
    padding: 18,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ECEEF2",
  },

  vazioTitulo: {
    fontSize: 15,
    fontWeight: "900",
    color: "#111827",
  },

  vazioTexto: {
    marginTop: 4,
    color: "#6B7280",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    fontWeight: "600",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ECEEF2",
    overflow: "hidden",
  },

  foto: {
    width: "100%",
    height: 132,
  },

  infoBox: {
    padding: 12,
  },

  titulo: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111827",
  },

  info: {
    marginTop: 4,
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "600",
  },

  preco: {
    marginTop: 5,
    fontSize: 15,
    fontWeight: "900",
    color: "#1E3A8A",
  },

  local: {
    marginTop: 2,
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "600",
  },

  statusBox: {
    alignSelf: "flex-start",
    marginTop: 9,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },

  statusTexto: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.3,
  },

  motivo: {
    marginTop: 8,
    color: "#EF4444",
    fontSize: 11,
    fontWeight: "700",
  },

  acoes: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },

  botaoEditar: {
    flex: 1,
    backgroundColor: "#1E3A8A",
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },

  botaoEditarTexto: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 12,
  },

  botaoExcluir: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#FEF2F2",
  },

  botaoExcluirTexto: {
    color: "#DC2626",
    fontWeight: "900",
    fontSize: 12,
  },
});