import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";

import BottomMenu from "../components/layout/BottomMenu";
import { AuthProvider } from "../contexts/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <View style={styles.container}>
        <Stack screenOptions={{ headerShown: false }} />
        <BottomMenu />
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});