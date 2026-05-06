import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { collection, onSnapshot, query, where } from "firebase/firestore";

import AppHeader from "../components/layout/AppHeader";
import { auth, db } from "../services/firebase";
import { colors } from "../utils/theme";

type Conversa = {
  id: string;
  anuncioTitulo?: string;
  ultimaMensagem?: string;
  participantes?: string[];
  compradorEmail?: string;
  vendedorEmail?: string;
  atualizadoEm?: any;
};

export default function Conversas() {
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const usuario = auth.currentUser;

    if (!usuario?.email) {
      setCarregando(false);
      return;
    }

    const q = query(
      collection(db, "conversas"),
      where("participantes", "array-contains", usuario.email)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map((documento) => ({
        id: documento.id,
        ...documento.data(),
      })) as Conversa[];

      const ordenadas = lista.sort((a, b) => {
        const dataA = a.atualizadoEm?.toMillis?.() || 0;
        const dataB = b.atualizadoEm?.toMillis?.() || 0;
        return dataB - dataA;
      });

      setConversas(ordenadas);
      setCarregando(false);
    });

    return () => unsubscribe();
  }, []);

  if (carregando) {
    return (
      <View style={styles.container}>
        <AppHeader titulo="Conversas" />
        <ActivityIndicator style={styles.carregando} color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.conteudo}
      showsVerticalScrollIndicator={false}
    >
      <AppHeader titulo="Conversas" />

      {conversas.length === 0 ? (
        <View style={styles.vazioBox}>
          <Text style={styles.vazioTitulo}>Nenhuma conversa ainda</Text>
          <Text style={styles.vazioTexto}>
            Quando você enviar ou receber mensagens sobre um anúncio, elas
            aparecerão aqui.
          </Text>
        </View>
      ) : (
        <View style={styles.lista}>
          {conversas.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => router.push(`/conversa/${item.id}` as any)}
            >
              <Text style={styles.titulo} numberOfLines={1}>
                {item.anuncioTitulo || "Conversa"}
              </Text>

              <Text style={styles.mensagem} numberOfLines={2}>
                {item.ultimaMensagem || "Toque para iniciar a conversa."}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  conteudo: {
    paddingBottom: 130,
    backgroundColor: colors.background,
  },

  carregando: {
    marginTop: 24,
  },

  lista: {
    paddingHorizontal: 20,
  },

  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },

  titulo: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.text,
  },

  mensagem: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    fontWeight: "600",
  },

  vazioBox: {
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },

  vazioTitulo: {
    fontSize: 17,
    fontWeight: "900",
    color: colors.text,
    textAlign: "center",
  },

  vazioTexto: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: colors.textMuted,
    textAlign: "center",
  },
});