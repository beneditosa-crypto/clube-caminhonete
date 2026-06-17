import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  router,
  Stack,
  usePathname,
} from "expo-router";

import {
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";

import BottomMenu from "../components/layout/BottomMenu";

import {
  AuthProvider,
  useAuth,
} from "../contexts/AuthContext";

function AppContainer() {
  const {
    usuario,
    carregando,
    biometriaAtiva,
    verificarBiometria,
  } = useAuth();

  const pathname = usePathname();

  const [liberado, setLiberado] =
    useState(false);

  const biometriaJaValidada =
    useRef(false);

  useEffect(() => {
    async function validar() {
      if (!usuario) {
        biometriaJaValidada.current =
          false;

        setLiberado(false);

        if (pathname !== "/login") {
          router.replace("/login");
        }

        return;
      }

      if (
        biometriaAtiva &&
        !biometriaJaValidada.current
      ) {
        const ok =
          await verificarBiometria();

        if (!ok) {
          setLiberado(false);
          return;
        }

        biometriaJaValidada.current =
          true;
      }

      setLiberado(true);

      if (pathname === "/login") {
        router.replace("/");
      }
    }

    if (!carregando) {
      validar();
    }
  }, [
    usuario,
    carregando,
    biometriaAtiva,
    pathname,
  ]);

  if (
    carregando ||
    (usuario && !liberado)
  ) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color="#1E3A8A"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />

      {usuario && <BottomMenu />}
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppContainer />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  loading: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
});