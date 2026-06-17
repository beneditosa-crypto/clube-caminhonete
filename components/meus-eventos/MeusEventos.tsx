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

import { router } from "expo-router";

import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../services/firebase";

type Evento = {
  id: string;
  titulo?: string;
  data?: string;
  cidade?: string;
  estado?: string;
  fotos?: string[];
  status?: string;
};

export default function MeusEventos() {
  const { usuario, carregando: carregandoAuth } = useAuth();

  const [eventos, setEventos] = useState<Evento[]>([]);
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
      collection(db, "eventos"),
      where("usuarioEmail", "==", usuario.email)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs
        .map((documento) => ({
          id: documento.id,
          ...documento.data(),
        }))
        .filter((item: any) => item.status !== "EXCLUIDO") as Evento[];

      setEventos(lista.reverse());
      setCarregando(false);
    });

    return () => unsubscribe();
  }, [usuario, carregandoAuth]);

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

  async function excluir(id: string) {
    Alert.alert("Excluir evento?", "Deseja realmente excluir este evento?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          await updateDoc(doc(db, "eventos", id), {
            status: "EXCLUIDO",
          });
        },
      },
    ]);
  }

  if (carregandoAuth || carregando) {
    return (
      <View style={styles.containerCarregando}>
        <ActivityIndicator size="small" color="#1E3A8A" />
        <Text style={styles.loadingTexto}>Carregando eventos...</Text>
      </View>
    );
  }

  if (!usuario) return null;

  if (eventos.length === 0) {
    return (
      <View style={styles.vazio}>
        <Text style={styles.vazioTitulo}>Nenhum evento ainda</Text>
        <Text style={styles.vazioTexto}>
          Crie seu primeiro evento para começar
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {eventos.map((item) => (
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
                {item.titulo || "Evento"}
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

            <Text style={styles.info}>
              {item.data || "Data não informada"}
            </Text>

            <Text style={styles.local}>
              {item.cidade || "Cidade"} / {item.estado || "UF"}
            </Text>

            <View style={styles.acoes}>
              <TouchableOpacity
                style={styles.botaoEditar}
                onPress={() =>
                  router.push(`/publicar-evento?id=${item.id}` as any)
                }
                activeOpacity={0.85}
              >
                <Text style={styles.botaoEditarTexto}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botaoExcluir}
                onPress={() => excluir(item.id)}
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