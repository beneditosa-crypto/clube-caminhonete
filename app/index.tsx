import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { collection, onSnapshot, query, where } from "firebase/firestore";

import AppHeader from "../components/layout/AppHeader";
import { db } from "../services/firebase";

const { width } = Dimensions.get("window");

const CARD_WIDTH = Math.round(width / 2.55);
const CARD_EVENTO_WIDTH = Math.round(width / 2.35);

type Anuncio = {
  id: string;
  titulo?: string;
  marca?: string;
  modelo?: string;
  ano?: string | number;
  preco?: string | number;
  estado?: string;
  cidade?: string;
  fotos?: string[];
  status?: string;
  destaque?: boolean;
  criadoEm?: any;
};

type Evento = {
  id: string;
  titulo?: string;
  cidade?: string;
  estado?: string;
  data?: string;
  imagem?: string;
  fotos?: string[];
  status?: string;
  criadoEm?: any;
};

const REGIOES: Record<string, string[]> = {
  "Centro-Oeste": ["DF", "GO", "MT", "MS"],
  Sudeste: ["SP", "RJ", "MG", "ES"],
  Sul: ["PR", "SC", "RS"],
  Nordeste: ["BA", "SE", "AL", "PE", "PB", "RN", "CE", "PI", "MA"],
  Norte: ["AM", "PA", "AC", "RO", "RR", "AP", "TO"],
};

function formatarPreco(valor?: string | number) {
  if (!valor) return "Consultar";

  if (typeof valor === "string" && valor.includes("R$")) {
    return valor;
  }

  const numero = Number(valor);

  if (Number.isNaN(numero)) {
    return String(valor);
  }

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function ordenarPorData<T extends { criadoEm?: any }>(lista: T[]) {
  return [...lista].sort((a, b) => {
    const dataA = a?.criadoEm?.seconds || 0;
    const dataB = b?.criadoEm?.seconds || 0;

    return dataB - dataA;
  });
}

function obterRegiao(estado?: string) {
  if (!estado) return "";

  const uf = estado.trim().toUpperCase();

  return (
    Object.entries(REGIOES).find(([, estados]) =>
      estados.includes(uf)
    )?.[0] || ""
  );
}

function agruparPorRegiao<T extends { estado?: string }>(lista: T[]) {
  const grupos: Record<string, T[]> = {};

  Object.keys(REGIOES).forEach((regiao) => {
    grupos[regiao] = [];
  });

  lista.forEach((item) => {
    const regiao = obterRegiao(item.estado);

    if (regiao) {
      grupos[regiao].push(item);
    }
  });

  return Object.entries(grupos).filter(
    ([, itens]) => itens.length > 0
  );
}

export default function Home() {
  const [busca, setBusca] = useState("");
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [carregandoAnuncios, setCarregandoAnuncios] = useState(true);
  const [carregandoEventos, setCarregandoEventos] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "anuncios"),
      where("status", "==", "ATIVO")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const lista = snapshot.docs.map((documento) => ({
          id: documento.id,
          ...documento.data(),
        })) as Anuncio[];

        setAnuncios(ordenarPorData(lista));
        setCarregandoAnuncios(false);
      },
      () => setCarregandoAnuncios(false)
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "eventos"),
      where("status", "==", "ATIVO")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const lista = snapshot.docs.map((documento) => ({
          id: documento.id,
          ...documento.data(),
        })) as Evento[];

        setEventos(ordenarPorData(lista));
        setCarregandoEventos(false);
      },
      () => setCarregandoEventos(false)
    );

    return unsubscribe;
  }, []);

  const anunciosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return anuncios;

    return anuncios.filter((item) => {
      const texto = [
        item.titulo,
        item.marca,
        item.modelo,
        item.cidade,
        item.estado,
        item.ano,
      ]
        .join(" ")
        .toLowerCase();

      return texto.includes(termo);
    });
  }, [busca, anuncios]);

  const recentes = anunciosFiltrados.slice(0, 12);

  const anunciosPorRegiao =
    agruparPorRegiao(anunciosFiltrados);

  const eventosPorRegiao =
    agruparPorRegiao(eventos);

  function renderCardAnuncio(item: Anuncio) {
    const destacado = item.destaque === true;

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.cardAnuncio,
          destacado && styles.cardAnuncioDestaque,
        ]}
        activeOpacity={0.9}
        onPress={() =>
          router.push(`/detalhe/${item.id}` as any)
        }
      >
        <View style={styles.imagemBox}>
          <Image
            source={
              item.fotos?.[0]
                ? { uri: item.fotos[0] }
                : require("../assets/images/logo.png")
            }
            style={[
              styles.cardImagem,
              destacado && styles.cardImagemDestaque,
            ]}
            resizeMode="cover"
          />

          {destacado && (
            <>
              <View style={styles.overlayDestaque} />

              <View style={styles.estrelaBox}>
                <Ionicons
                  name="star"
                  size={11}
                  color="#E5E7EB"
                />
              </View>
            </>
          )}
        </View>

        <View style={styles.cardInfo}>
          <Text
            style={styles.cardTitulo}
            numberOfLines={1}
          >
            {item.titulo || "Veículo clássico"}
          </Text>

          <Text
            style={styles.cardPreco}
            numberOfLines={1}
          >
            {formatarPreco(item.preco)}
          </Text>

          <Text
            style={styles.cardLocal}
            numberOfLines={1}
          >
            {[item.cidade, item.estado]
              .filter(Boolean)
              .join(" - ")}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  function renderCardEvento(item: Evento) {
    const imagem = item.imagem || item.fotos?.[0];

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.cardEvento}
        activeOpacity={0.9}
        onPress={() =>
          router.push(
            `/detalhe-evento/${item.id}` as any
          )
        }
      >
        <Image
          source={
            imagem
              ? { uri: imagem }
              : require("../assets/images/logo.png")
          }
          style={styles.eventoImagem}
          resizeMode="cover"
        />

        <View style={styles.cardInfo}>
          <Text
            style={styles.cardTitulo}
            numberOfLines={1}
          >
            {item.titulo || "Evento"}
          </Text>

          <Text
            style={styles.cardLocal}
            numberOfLines={1}
          >
            {[item.cidade, item.estado]
              .filter(Boolean)
              .join(" - ")}
          </Text>

          {!!item.data && (
            <Text
              style={styles.eventoData}
              numberOfLines={1}
            >
              {item.data}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  function renderSecaoAnuncios(
    titulo: string,
    lista: Anuncio[],
    verTodos = false
  ) {
    if (lista.length === 0) return null;

    return (
      <>
        <View style={styles.secaoCabecalho}>
          <Text style={styles.secaoTitulo}>
            {titulo}
          </Text>

          {verTodos && (
            <TouchableOpacity
              onPress={() =>
                router.push("/anuncios" as any)
              }
            >
              <Text style={styles.verTudo}>
                Ver todos
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listaHorizontal}
        >
          {lista.map(renderCardAnuncio)}
        </ScrollView>
      </>
    );
  }

  function renderSecaoEventos(
    titulo: string,
    lista: Evento[]
  ) {
    if (lista.length === 0) return null;

    return (
      <>
        <View style={styles.secaoCabecalho}>
          <Text style={styles.secaoTitulo}>
            {titulo}
          </Text>

          <TouchableOpacity
            onPress={() =>
              router.push("/eventos" as any)
            }
          >
            <Text style={styles.verTudo}>
              Ver eventos
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listaHorizontal}
        >
          {lista.map(renderCardEvento)}
        </ScrollView>
      </>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.conteudo}
      showsVerticalScrollIndicator={false}
    >
      <AppHeader
        slogan="Mais que carros, uma paixão"
        mostrarNotificacao
      />

      <View style={styles.buscaBox}>
        <Ionicons
          name="search-outline"
          size={18}
          color="#6B7280"
        />

        <TextInput
          style={styles.buscaInput}
          placeholder="Buscar por modelo, cidade, marca..."
          placeholderTextColor="#9CA3AF"
          value={busca}
          onChangeText={setBusca}
        />
      </View>

      {carregandoAnuncios ? (
        <View style={styles.carregandoBox}>
          <ActivityIndicator
            size="small"
            color="#111111"
          />

          <Text style={styles.carregandoTexto}>
            Carregando anúncios...
          </Text>
        </View>
      ) : anunciosFiltrados.length === 0 ? (
        <View style={styles.vazioBox}>
          <Text style={styles.vazioTitulo}>
            Nenhum anúncio encontrado
          </Text>

          <Text style={styles.vazioTexto}>
            Assim que novos veículos forem aprovados,
            eles aparecerão aqui.
          </Text>
        </View>
      ) : (
        <>
          {renderSecaoAnuncios(
            "Recentes",
            recentes
          )}

          {anunciosPorRegiao.map(
            ([regiao, lista]) => (
              <View
                key={`regiao-${regiao}`}
              >
                {renderSecaoAnuncios(
                  regiao,
                  lista.slice(0, 10)
                )}
              </View>
            )
          )}
        </>
      )}

      {!carregandoEventos &&
        eventosPorRegiao.map(
          ([regiao, lista]) => (
            <View
              key={`eventos-${regiao}`}
            >
              {renderSecaoEventos(
                `Eventos no ${regiao}`,
                lista.slice(0, 10)
              )}
            </View>
          )
        )}

      {carregandoEventos && (
        <View style={styles.carregandoBox}>
          <ActivityIndicator
            size="small"
            color="#111111"
          />

          <Text style={styles.carregandoTexto}>
            Carregando eventos...
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  conteudo: {
    paddingTop: 8,
    paddingBottom: 110,
    backgroundColor: "#FFFFFF",
  },

  buscaBox: {
    marginTop: 10,
    marginHorizontal: 16,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  buscaInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#111111",
  },

  secaoCabecalho: {
    marginTop: 18,
    marginHorizontal: 16,
    marginBottom: 9,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  secaoTitulo: {
    fontSize: 19,
    fontWeight: "900",
    color: "#111111",
  },

  verTudo: {
    fontSize: 12,
    fontWeight: "900",
    color: "#1E3A8A",
  },

  listaHorizontal: {
    paddingLeft: 16,
    paddingRight: 8,
    gap: 10,
  },

  cardAnuncio: {
    width: CARD_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },

  cardAnuncioDestaque: {
    borderColor: "#2B2F36",
    borderWidth: 1.3,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },

  imagemBox: {
    position: "relative",
    width: "100%",
    height: 96,
    backgroundColor: "#F3F4F6",
  },

  cardImagem: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F3F4F6",
  },

  cardImagemDestaque: {
    opacity: 0.95,
  },

  overlayDestaque: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.12)",
  },

  estrelaBox: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.78)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  cardInfo: {
    padding: 9,
  },

  cardTitulo: {
    fontSize: 13,
    fontWeight: "900",
    color: "#111111",
  },

  cardPreco: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "900",
    color: "#1E3A8A",
  },

  cardLocal: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
  },

  cardEvento: {
    width: CARD_EVENTO_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },

  eventoImagem: {
    width: "100%",
    height: 92,
    backgroundColor: "#F3F4F6",
  },

  eventoData: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: "800",
    color: "#1E3A8A",
  },

  carregandoBox: {
    marginTop: 18,
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  carregandoTexto: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
  },

  vazioBox: {
    marginTop: 18,
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  vazioTitulo: {
    fontSize: 15,
    fontWeight: "900",
    color: "#111111",
  },

  vazioTexto: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    lineHeight: 18,
  },
});