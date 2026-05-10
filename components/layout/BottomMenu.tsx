import { useEffect, useState } from "react";

import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { onAuthStateChanged, User } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";

import { auth, db } from "../../services/firebase";
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

  const [usuario, setUsuario] = useState<User | null>(null);
  const [naoLidas, setNaoLidas] = useState(0);

  const esconderMenu =
    rotaAtual.startsWith("/conversa/") ||
    rotaAtual.startsWith("/detalhe/") ||
    rotaAtual.startsWith("/login") ||
    rotaAtual.startsWith("/publicar") ||
    rotaAtual.startsWith("/publicar-evento") ||
    rotaAtual.startsWith("/admin");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUsuario(user);

      if (!user?.email) {
        setNaoLidas(0);
      }
    });

    return unsubscribeAuth;
  }, []);

  useEffect(() => {
    if (!usuario?.email) return;

    const emailTratado = usuario.email.trim().toLowerCase();

    const q = query(
      collection(db, "conversas"),
      where("participantes", "array-contains", emailTratado)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let total = 0;

      snapshot.docs.forEach((documento) => {
        const dados = documento.data() as Conversa;

        const compradorEmail = dados.compradorEmail?.trim().toLowerCase();
        const vendedorEmail = dados.vendedorEmail?.trim().toLowerCase();

        if (emailTratado === compradorEmail) {
          total += dados.naoLidasComprador || 0;
        }

        if (emailTratado === vendedorEmail) {
          total += dados.naoLidasVendedor || 0;
        }
      });

      setNaoLidas(total);
    });

    return unsubscribe;
  }, [usuario]);

  if (esconderMenu) {
    return null;
  }

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
        const mostrarBadge = item.rota === "/conversas" && naoLidas > 0;

        return (
          <TouchableOpacity
            key={item.rota}
            style={[styles.item, ativo && styles.itemAtivo]}
            onPress={() => navegar(item.rota)}
            activeOpacity={0.85}
          >
            <View style={styles.iconeBox}>
              <Ionicons
                name={
                  ativo
                    ? (item.icone.replace("-outline", "") as any)
                    : item.icone
                }
                size={22}
                color={ativo ? "#FFFFFF" : colors.iconMuted}
              />

              {mostrarBadge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeTexto}>
                    {naoLidas > 9 ? "9+" : naoLidas}
                  </Text>
                </View>
              )}
            </View>

            <Text style={[styles.label, ativo && styles.labelAtivo]}>
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

  iconeBox: {
    position: "relative",
  },

  badge: {
    position: "absolute",
    top: -9,
    right: -13,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  badgeTexto: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
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