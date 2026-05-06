import { Image, StyleSheet, useColorScheme, View } from "react-native";

export default function HomeHeader() {
  const dark = useColorScheme() === "dark";

  return (
    <View style={[styles.header, { backgroundColor: dark ? "#0B120E" : "#F7F3EA" }]}>
      <View style={[styles.logoBox, { backgroundColor: dark ? "#FFFFFF" : "#FFFFFF" }]}>
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 54,
    paddingHorizontal: 22,
    paddingBottom: 18,
    alignItems: "center",
  },
  logoBox: {
    width: 148,
    height: 148,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logo: {
    width: 135,
    height: 135,
  },
});