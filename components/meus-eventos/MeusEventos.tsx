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
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const usuario = auth.currentUser;

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
  }, []);

  function corStatus(status?: string) {
    if (status === "ATIVO") return "#22C55E"; // verde
    if (status === "PENDENTE") return "#F59E0B"; // amarelo
    if (status === "RECUSADO") return "#EF4444"; // vermelho
    return "#9CA3AF";
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

  if (carregando) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

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
          />

          <View style={styles.infoBox}>
            <Text style={styles.titulo} numberOfLines={1}>
              {item.titulo || "Evento"}
            </Text>

            <Text style={styles.info}>
              {item.data || "Data não informada"}
            </Text>

            <Text style={styles.local}>
              {item.cidade} / {item.estado}
            </Text>

            <View
              style={[
                styles.statusBox,
                { backgroundColor: corStatus(item.status) },
              ]}
            >
              <Text style={styles.statusTexto}>
                {textoStatus(item.status)}
              </Text>
            </View>

            <View style={styles.acoes}>
              <TouchableOpacity style={styles.botaoEditar}>
                <Text style={styles.botaoEditarTexto}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botaoExcluir}
                onPress={() => excluir(item.id)}
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
  container: {
    paddingHorizontal: 16,
  },

  vazio: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 18,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
  },

  vazioTitulo: {
    fontSize: 16,
    fontWeight: "900",
  },

  vazioTexto: {
    marginTop: 6,
    color: "#6B7280",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },

  foto: {
    width: "100%",
    height: 150,
  },

  infoBox: {
    padding: 14,
  },

  titulo: {
    fontSize: 16,
    fontWeight: "900",
  },

  info: {
    marginTop: 4,
    color: "#6B7280",
  },

  local: {
    marginTop: 2,
    color: "#6B7280",
  },

  statusBox: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },

  statusTexto: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  acoes: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },

  botaoEditar: {
    flex: 1,
    backgroundColor: "#1E3A8A",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  botaoEditarTexto: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  botaoExcluir: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#EF4444",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  botaoExcluirTexto: {
    color: "#EF4444",
    fontWeight: "900",
  },
});