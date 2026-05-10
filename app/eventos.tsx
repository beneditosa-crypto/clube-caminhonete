import { router } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AppHeader from "../components/layout/AppHeader";
import MeusEventos from "../components/meus-eventos/MeusEventos";
import { auth } from "../services/firebase";

export default function Eventos() {
  function abrirPublicarEvento() {
    const usuario = auth.currentUser;

    if (!usuario) {
      router.push("/login");
      return;
    }

    router.push("/publicar-evento");
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.conteudo}
      showsVerticalScrollIndicator={false}
    >
      <AppHeader titulo="Meus eventos" />

      <View style={styles.acaoBox}>
        <TouchableOpacity
          style={styles.botao}
          onPress={abrirPublicarEvento}
          activeOpacity={0.9}
        >
          <Text style={styles.botaoTexto}>+ Novo evento</Text>
        </TouchableOpacity>

        <Text style={styles.subTexto}>
          Divulgue encontros e acompanhe a aprovação
        </Text>
      </View>

      <View style={styles.listaBox}>
        <MeusEventos />
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
    paddingBottom: 120,
    backgroundColor: "#FFFFFF",
  },

  acaoBox: {
    marginTop: 8,
    marginHorizontal: 14,
    alignItems: "center",
  },

  botao: {
    backgroundColor: "#1E3A8A",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: "center",
    alignSelf: "center",
    minWidth: 170,
  },

  botaoTexto: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 13,
  },

  subTexto: {
    marginTop: 7,
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    textAlign: "center",
  },

  listaBox: {
    marginTop: 10,
  },
});