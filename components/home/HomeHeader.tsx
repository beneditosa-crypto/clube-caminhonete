import {
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function HomeHeader() {
  return (
    <View style={styles.header}>
      <View style={styles.logoWrap}>
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.nome}>
        Volante
      </Text>

      <Text style={styles.slogan}>
        Mais que carros, paixão
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 48,
    paddingBottom: 14,

    paddingHorizontal: 18,

    alignItems: "center",

    backgroundColor: "#FFFFFF",
  },

  logoWrap: {
    width: 92,
    height: 92,

    borderRadius: 24,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#FFFFFF",
  },

  logo: {
    width: 86,
    height: 86,
  },

  nome: {
    marginTop: 6,

    fontSize: 20,

    fontWeight: "900",

    color: "#111827",

    letterSpacing: -0.6,
  },

  slogan: {
    marginTop: 2,

    fontSize: 11,

    fontWeight: "600",

    color: "#6B7280",

    letterSpacing: 0.2,
  },
});