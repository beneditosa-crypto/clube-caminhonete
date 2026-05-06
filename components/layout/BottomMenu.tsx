import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { colors } from "../../utils/theme";

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

const itens: ItemMenu[] = [
  {
    rota: "/",
    label: "Início",
    icone: "home-outline",
  },
  {
    rota: "/anuncios",
    label: "Anúncios",
    icone: "car-sport-outline",
  },
  {
    rota: "/eventos",
    label: "Eventos",
    icone: "calendar-outline",
  },
  {
    rota: "/conversas",
    label: "Conversas",
    icone: "chatbubble-ellipses-outline",
  },
  {
    rota: "/conta",
    label: "Conta",
    icone: "person-outline",
  },
];

export default function BottomMenu() {
  const rotaAtual = usePathname();

  function navegar(rota: Rota) {
    if (rotaAtual === rota) return;

    router.push(rota as any);
  }

  function estaAtivo(rota: Rota) {
    if (rota === "/") {
      return rotaAtual === "/";
    }

    return rotaAtual.startsWith(rota);
  }

  return (
    <View style={styles.container}>
      {itens.map((item) => {
        const ativo = estaAtivo(item.rota);

        return (
          <TouchableOpacity
            key={item.rota}
            style={[styles.item, ativo && styles.itemAtivo]}
            onPress={() => navegar(item.rota)}
            activeOpacity={0.85}
          >
            <Ionicons
              name={ativo ? item.icone.replace("-outline", "") as any : item.icone}
              size={22}
              color={ativo ? "#FFFFFF" : colors.iconMuted}
            />

            <Text
              style={[
                styles.label,
                ativo && styles.labelAtivo,
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

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: Platform.OS === "ios" ? 26 : 18,

    height: 74,
    borderRadius: 26,

    backgroundColor: "#FFFFFF",

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingHorizontal: 8,

    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 6,
    },

    elevation: 12,
  },

  item: {
    flex: 1,

    height: 56,

    borderRadius: 18,

    alignItems: "center",
    justifyContent: "center",
  },

  itemAtivo: {
    backgroundColor: colors.primary,
  },

  label: {
    marginTop: 4,

    fontSize: 10,
    fontWeight: "700",

    color: colors.iconMuted,
  },

  labelAtivo: {
    color: "#FFFFFF",
  },
});