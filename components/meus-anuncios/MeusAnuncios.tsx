import { router } from "expo-router";
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
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

import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../services/firebase";

type Anuncio = {
  id: string;
  titulo?: string;
  marca?: string;
  modelo?: string;
  ano?: number;
  preco?: number;
  cidade?: string;
  estado?: string;
  fotos?: string[];
  status?: string;
  motivoPendencia?: string;
};

export default function MeusAnuncios() {
  const { usuario, carregando: carregandoAuth } = useAuth();

  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!carregandoAuth && !usuario?.email) {
      router.replace("/login");
    }
  }, [usuario, carregandoAuth]);

  useEffect(() => {
    if (carregandoAuth) return;

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
  }, [usuario, carregandoAuth]);

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

  function fundoStatus(status?: string) {
    if (status === "ATIVO") return "#DCFCE7";
    if (status === "PENDENTE") return "#FEF3C7";
    if (status === "RECUSADO") return "#FEE2E2";

    return "#F3F4F6";
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

  if (carregandoAuth || carregando) {
    return (
      <View style={styles.containerCarregando}>
        <ActivityIndicator size="small" color="#1E3A8A" />
        <Text style={styles.loadingTexto}>Carregando anúncios...</Text>
      </View>
    );
  }

  if (!usuario) return null;

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
            <View style={styles.topo}>
              <Text style={styles.titulo} numberOfLines={1}>
                {item.titulo || "Veículo"}
              </Text>

              <View
                style={[
                  styles.statusBox,
                  { backgroundColor: fundoStatus(item.status) },
                ]}
              >
                <Text
                  style={[
                    styles.statusTexto,
                    { color: corStatus(item.status) },
                  ]}
                >
                  {textoStatus(item.status)}
                </Text>
              </View>
            </View>

            <Text style={styles.info} numberOfLines={1}>
              {[item.marca, item.modelo, item.ano].filter(Boolean).join(" • ")}
            </Text>

            <Text style={styles.preco}>{formatarPreco(item.preco)}</Text>

            <Text style={styles.local}>
              {item.cidade || "Cidade"} / {item.estado || "UF"}
            </Text>

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
    paddingVertical: 22,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  loadingTexto: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "700",
  },

  container: {
    paddingHorizontal: 14,
    paddingBottom: 90,
  },

  vazio: {
    marginHorizontal: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ECEEF2",
  },

  vazioTitulo: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111827",
  },

  vazioTexto: {
    marginTop: 4,
    color: "#6B7280",
    fontSize: 11.5,
    textAlign: "center",
    lineHeight: 17,
    fontWeight: "600",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ECEEF2",
    overflow: "hidden",
  },

  foto: {
    width: "100%",
    height: 108,
  },

  infoBox: {
    padding: 10,
  },

  topo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },

  titulo: {
    flex: 1,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "900",
    color: "#111827",
    letterSpacing: -0.2,
  },

  info: {
    marginTop: 4,
    color: "#6B7280",
    fontSize: 11,
    fontWeight: "600",
  },

  preco: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: "900",
    color: "#1E3A8A",
  },

  local: {
    marginTop: 2,
    color: "#6B7280",
    fontSize: 11,
    fontWeight: "600",
  },

  statusBox: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
  },

  statusTexto: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.3,
  },

  motivo: {
    marginTop: 7,
    color: "#DC2626",
    fontSize: 10.5,
    fontWeight: "700",
    lineHeight: 15,
  },

  acoes: {
    flexDirection: "row",
    gap: 7,
    marginTop: 10,
  },

  botaoEditar: {
    flex: 1,
    backgroundColor: "#111827",
    paddingVertical: 7,
    borderRadius: 9,
    alignItems: "center",
  },

  botaoEditarTexto: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 11,
  },

  botaoExcluir: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 7,
    borderRadius: 9,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  botaoExcluirTexto: {
    color: "#6B7280",
    fontWeight: "800",
    fontSize: 11,
  },
});