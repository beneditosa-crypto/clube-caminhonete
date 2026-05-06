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
        return "Pendente de análise";
      case "RECUSADO":
        return "Recusado";
      default:
        return "Em análise";
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
    Alert.alert(
      "Excluir anúncio",
      "Deseja realmente excluir este anúncio?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => excluirAnuncio(id),
        },
      ]
    );
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
            Quando você publicar um veículo, ele aparecerá aqui com o status da análise.
          </Text>
        </View>
      )}

      {anuncios.map((item) => (
        <View key={item.id} style={styles.card}>
          <View style={styles.cardTopo}>
            <Text style={styles.nome}>
              {item.titulo || "Anúncio sem título"}
            </Text>

            <View
              style={[
                styles.statusBox,
                { backgroundColor: `${corStatus(item.status)}22` },
              ]}
            >
              <Text
                style={[styles.status, { color: corStatus(item.status) }]}
              >
                {textoStatus(item.status)}
              </Text>
            </View>
          </View>

          {item.motivoPendencia && (
            <Text style={styles.motivo}>{item.motivoPendencia}</Text>
          )}

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
    padding: 20,
    paddingBottom: 130,
  },

  header: {
    marginBottom: 18,
  },

  titulo: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.text,
  },

  subtitulo: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    fontWeight: "600",
  },

  botaoNovo: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 20,
  },

  textoBotaoNovo: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
  },

  vazioBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  vazioTitulo: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.text,
    marginBottom: 8,
    textAlign: "center",
  },

  vazioTexto: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: "center",
    fontWeight: "600",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },

  cardTopo: {
    gap: 10,
  },

  nome: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.text,
  },

  statusBox: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },

  status: {
    fontWeight: "900",
    fontSize: 13,
  },

  motivo: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    fontWeight: "600",
  },

  botaoEditar: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 16,
  },

  textoBotao: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  botaoExcluir: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },

  textoExcluir: {
    color: colors.textMuted,
    fontWeight: "900",
  },
});