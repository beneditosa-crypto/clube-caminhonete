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
    paddingBottom: 130,
    backgroundColor: "#FFFFFF",
  },

  acaoBox: {
    marginTop: 12,
    marginHorizontal: 16,
  },

  botao: {
    backgroundColor: "#1E3A8A",
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
  },

  botaoTexto: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 15,
  },

  subTexto: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    textAlign: "center",
  },

  listaBox: {
    marginTop: 10,
  },
});