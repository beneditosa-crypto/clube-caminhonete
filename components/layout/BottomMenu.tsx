import {
  useEffect,
  useState,
} from "react";

import { Ionicons } from "@expo/vector-icons";

import {
  router,
  usePathname,
} from "expo-router";

import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import { db } from "../../services/firebase";

import { colors } from "../../utils/theme";

import { useAuth } from "../../contexts/AuthContext";

type Rota =
  | "/"
  | "/anuncios"
  | "/eventos"
  | "/conversas"
  | "/conta";

type ItemMenu = {
  rota: Rota;
  label: string;
  icone: keyof typeof Ionicons.glyphMap;
};

type Conversa = {
  compradorEmail?: string;

  vendedorEmail?: string;

  naoLidasComprador?: number;

  naoLidasVendedor?: number;
};

const itens: ItemMenu[] = [
  {
    rota: "/",
    label: "Início",
    icone: "home-outline",
  },

  {
    rota: "/anuncios",
    label: "Anúncios",
    icone:
      "car-sport-outline",
  },

  {
    rota: "/eventos",
    label: "Eventos",
    icone:
      "calendar-outline",
  },

  {
    rota: "/conversas",
    label: "Conversas",
    icone:
      "chatbubble-ellipses-outline",
  },

  {
    rota: "/conta",
    label: "Conta",
    icone:
      "person-outline",
  },
];

export default function BottomMenu() {
  const rotaAtual =
    usePathname();

  const { usuario } =
    useAuth();

  const [naoLidas, setNaoLidas] =
    useState(0);

  const esconderMenu =
    rotaAtual.startsWith(
      "/login"
    ) ||
    rotaAtual.startsWith(
      "/detalhe/"
    ) ||
    rotaAtual.startsWith(
      "/conversa/"
    ) ||
    rotaAtual.startsWith(
      "/publicar"
    ) ||
    rotaAtual.startsWith(
      "/publicar-evento"
    ) ||
    rotaAtual.startsWith(
      "/admin"
    );

  useEffect(() => {
    if (
      !usuario?.email
    ) {
      setNaoLidas(0);

      return;
    }

    const emailTratado =
      usuario.email
        .trim()
        .toLowerCase();

    const q = query(
      collection(
        db,
        "conversas"
      ),

      where(
        "participantes",
        "array-contains",
        emailTratado
      )
    );

    const unsubscribe =
      onSnapshot(
        q,
        (snapshot) => {
          let total = 0;

          snapshot.docs.forEach(
            (documento) => {
              const dados =
                documento.data() as Conversa;

              const compradorEmail =
                dados.compradorEmail
                  ?.trim()
                  .toLowerCase();

              const vendedorEmail =
                dados.vendedorEmail
                  ?.trim()
                  .toLowerCase();

              if (
                emailTratado ===
                compradorEmail
              ) {
                total +=
                  dados.naoLidasComprador ||
                  0;
              }

              if (
                emailTratado ===
                vendedorEmail
              ) {
                total +=
                  dados.naoLidasVendedor ||
                  0;
              }
            }
          );

          setNaoLidas(total);
        }
      );

    return unsubscribe;
  }, [usuario]);

  if (
    esconderMenu ||
    !usuario
  ) {
    return null;
  }

  function navegar(
    rota: Rota
  ) {
    if (
      rotaAtual === rota
    ) {
      return;
    }

    router.push(
      rota as any
    );
  }

  function estaAtivo(
    rota: Rota
  ) {
    if (rota === "/") {
      return (
        rotaAtual === "/"
      );
    }

    return rotaAtual.startsWith(
      rota
    );
  }

  return (
    <View style={styles.container}>
      {itens.map((item) => {
        const ativo =
          estaAtivo(
            item.rota
          );

        const mostrarBadge =
          item.rota ===
            "/conversas" &&
          naoLidas > 0;

        return (
          <TouchableOpacity
            key={item.rota}
            style={[
              styles.item,

              ativo &&
                styles.itemAtivo,
            ]}
            onPress={() =>
              navegar(
                item.rota
              )
            }
            activeOpacity={0.85}
          >
            <View
              style={
                styles.iconeBox
              }
            >
              <Ionicons
                name={
                  ativo
                    ? (item.icone.replace(
                        "-outline",
                        ""
                      ) as any)
                    : item.icone
                }
                size={20}
                color={
                  ativo
                    ? "#FFFFFF"
                    : colors.iconMuted
                }
              />

              {mostrarBadge && (
                <View
                  style={
                    styles.badge
                  }
                >
                  <Text
                    style={
                      styles.badgeTexto
                    }
                  >
                    {naoLidas > 9
                      ? "9+"
                      : naoLidas}
                  </Text>
                </View>
              )}
            </View>

            <Text
              style={[
                styles.label,

                ativo &&
                  styles.labelAtivo,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      position:
        "absolute",

      left: 16,

      right: 16,

      bottom:
        Platform.OS ===
        "ios"
          ? 24
          : 16,

      height: 68,

      borderRadius: 24,

      backgroundColor:
        "rgba(255,255,255,0.98)",

      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "space-between",

      paddingHorizontal: 8,

      borderWidth: 1,

      borderColor:
        "rgba(15,23,42,0.06)",

      shadowColor:
        "#0F172A",

      shadowOpacity: 0.08,

      shadowRadius: 18,

      shadowOffset: {
        width: 0,
        height: 8,
      },

      elevation: 10,
    },

    item: {
      flex: 1,

      height: 52,

      borderRadius: 18,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    itemAtivo: {
      backgroundColor:
        colors.primary,
    },

    iconeBox: {
      position:
        "relative",
    },

    badge: {
      position:
        "absolute",

      top: -9,

      right: -13,

      minWidth: 18,

      height: 18,

      borderRadius: 9,

      backgroundColor:
        colors.danger,

      alignItems:
        "center",

      justifyContent:
        "center",

      paddingHorizontal: 5,

      borderWidth: 2,

      borderColor:
        "#FFFFFF",
    },

    badgeTexto: {
      color: "#FFFFFF",

      fontSize: 9.5,

      fontWeight: "900",
    },

    label: {
      marginTop: 3,

      fontSize: 9.5,

      fontWeight: "800",

      color:
        colors.iconMuted,

      letterSpacing:
        -0.1,
    },

    labelAtivo: {
      color: "#FFFFFF",
    },
  });