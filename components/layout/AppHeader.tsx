import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  titulo?: string;
  subtitulo?: string;
  slogan?: string;
  mostrarNotificacao?: boolean;
};

export default function AppHeader({
  titulo,
  subtitulo,
  slogan = "Mais que carros, paixão",
  mostrarNotificacao = false,
}: Props) {
  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.topo}>
        <View style={styles.espacoIcone} />

        <View style={styles.logoBox}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.nomeApp}>Volante</Text>
        </View>

        {mostrarNotificacao ? (
          <TouchableOpacity
            style={styles.botaoIcone}
            onPress={() => router.push("/notificacoes" as any)}
            activeOpacity={0.85}
          >
            <Ionicons name="notifications-outline" size={22} color="#111111" />
          </TouchableOpacity>
        ) : (
          <View style={styles.espacoIcone} />
        )}
      </View>

      {slogan ? <Text style={styles.slogan}>{slogan}</Text> : null}

      {titulo ? <Text style={styles.titulo}>{titulo}</Text> : null}

      {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#FFFFFF",
  },

  topo: {
    paddingHorizontal: 20,
    paddingTop: 2,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  espacoIcone: {
    width: 44,
    height: 44,
  },

  botaoIcone: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },

  logoBox: {
    alignItems: "center",
  },

  logo: {
    width: 82,
    height: 82,
  },

  nomeApp: {
    marginTop: -8,
    fontSize: 22,
    fontWeight: "900",
    color: "#111111",
    letterSpacing: 0.4,
  },

  slogan: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A", // 🔵 AZUL ESCURO PREMIUM
    textAlign: "center",
  },

  titulo: {
    marginTop: 10,
    fontSize: 26,
    fontWeight: "900",
    color: "#111111",
    textAlign: "center",
    paddingHorizontal: 20,
  },

  subtitulo: {
    marginTop: 6,
    marginBottom: 18,
    fontSize: 14,
    lineHeight: 20,
    color: "#6B7280",
    textAlign: "center",
    fontWeight: "600",
    paddingHorizontal: 24,
  },
});