import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
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
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { router } from "expo-router";

import { db } from "../services/firebase";
import { useAuth } from "../contexts/AuthContext";
import { colors } from "../utils/theme";

type Anuncio = {
  id: string;
  titulo?: string;
  status?: string;
  usuarioId?: string;
  motivoPendencia?: string;
};

export default function MeusAnuncios() {
  const { usuario } = useAuth();

  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);

  useEffect(() => {
    if (!usuario) {
      router.replace("/login");
      return;
    }

    const q = query(
      collection(db, "anuncios"),
      where("usuarioId", "==", usuario.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs
        .map((documento) => ({
          id: documento.id,
          ...documento.data(),
        }))
        .filter((item: any) => item.status !== "EXCLUIDO") as Anuncio[];

      setAnuncios(lista);
    });

    return () => unsubscribe();
  }, [usuario]);

  function textoStatus(status?: string) {
    switch (status) {
      case "ATIVO":
        return "Aprovado";
      case "PENDENTE":
        return "Em análise";
      case "RECUSADO":
        return "Recusado";
      default:
        return "Análise";
    }
  }

  function corStatus(status?: string) {
    switch (status) {
      case "ATIVO":
        return colors.success;
      case "PENDENTE":
        return colors.primary;
      case "RECUSADO":
        return colors.danger;
      default:
        return colors.textMuted;
    }
  }

  function confirmarExclusao(id: string) {
    Alert.alert("Excluir anúncio", "Deseja realmente excluir este anúncio?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
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
        excluidoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
      });
    } catch {
      Alert.alert("Erro", "Não foi possível excluir o anúncio.");
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.conteudo}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.titulo}>Meus anúncios</Text>

        <Text style={styles.subtitulo}>
          Acompanhe seus anúncios enviados para análise.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.botaoNovo}
        onPress={() => router.push("/publicar")}
        activeOpacity={0.85}
      >
        <Text style={styles.textoBotaoNovo}>Novo anúncio</Text>
      </TouchableOpacity>

      {anuncios.length === 0 && (
        <View style={styles.vazioBox}>
          <Text style={styles.vazioTitulo}>Nenhum anúncio cadastrado</Text>

          <Text style={styles.vazioTexto}>
            Quando você publicar um veículo, ele aparecerá aqui.
          </Text>
        </View>
      )}

      {anuncios.map((item) => (
        <View key={item.id} style={styles.card}>
          <View style={styles.cardTopo}>
            <Text style={styles.nome} numberOfLines={2}>
              {item.titulo || "Anúncio sem título"}
            </Text>

            <View
              style={[
                styles.statusBox,
                {
                  backgroundColor: `${corStatus(item.status)}18`,
                },
              ]}
            >
              <Text
                style={[
                  styles.status,
                  {
                    color: corStatus(item.status),
                  },
                ]}
              >
                {textoStatus(item.status)}
              </Text>
            </View>
          </View>

          {item.motivoPendencia && (
            <Text style={styles.motivo}>{item.motivoPendencia}</Text>
          )}

          <View style={styles.linhaBotoes}>
            <TouchableOpacity
              style={styles.botaoEditar}
              onPress={() => router.push(`/publicar?id=${item.id}`)}
              activeOpacity={0.85}
            >
              <Text style={styles.textoBotao}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoExcluir}
              onPress={() => confirmarExclusao(item.id)}
              activeOpacity={0.85}
            >
              <Text style={styles.textoExcluir}>Excluir</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  conteudo: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 90,
  },

  header: {
    marginBottom: 10,
  },

  titulo: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.text,
    marginBottom: 2,
    letterSpacing: -0.4,
  },

  subtitulo: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.textMuted,
    fontWeight: "600",
  },

  botaoNovo: {
    backgroundColor: colors.primary,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },

  textoBotaoNovo: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 0.2,
  },

  vazioBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  vazioTitulo: {
    fontSize: 15,
    fontWeight: "900",
    color: colors.text,
    marginBottom: 4,
    textAlign: "center",
  },

  vazioTexto: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
    textAlign: "center",
    fontWeight: "600",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ECEEF2",
  },

  cardTopo: {
    gap: 6,
  },

  nome: {
    fontSize: 14,
    fontWeight: "900",
    color: colors.text,
    lineHeight: 18,
    letterSpacing: -0.2,
  },

  statusBox: {
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },

  status: {
    fontWeight: "900",
    fontSize: 10,
    letterSpacing: 0.3,
  },

  motivo: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textMuted,
    fontWeight: "600",
  },

  linhaBotoes: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },

  botaoEditar: {
    flex: 1,
    backgroundColor: "#111827",
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },

  textoBotao: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 0.2,
  },

  botaoExcluir: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  textoExcluir: {
    color: "#6B7280",
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 0.2,
  },
});