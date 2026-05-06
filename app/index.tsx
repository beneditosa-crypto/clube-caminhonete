import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import { collection, limit, onSnapshot, query, where } from "firebase/firestore";

import { db } from "../services/firebase";
import AppHeader from "../components/layout/AppHeader";

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

function formatarPreco(valor?: string | number) {
  if (!valor) return "Preço sob consulta";

  if (typeof valor === "string" && valor.includes("R$")) return valor;

  const numero = Number(valor);
  if (Number.isNaN(numero)) return String(valor);

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function ordenarPorData(lista: any[]) {
  return [...lista].sort((a, b) => {
    const dataA = a?.criadoEm?.seconds || 0;
    const dataB = b?.criadoEm?.seconds || 0;
    return dataB - dataA;
  });
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
      where("status", "==", "ATIVO"),
      limit(12)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const lista = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
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
      where("status", "==", "ATIVO"),
      limit(8)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const lista = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
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

  const destaques = anunciosFiltrados.slice(0, 4);
  const recentes = anunciosFiltrados.slice(4, 12);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.conteudo}
      showsVerticalScrollIndicator={false}
    >
      <AppHeader slogan="Mais que carros, uma paixão" mostrarNotificacao />

      <View style={styles.buscaBox}>
        <Ionicons name="search-outline" size={20} color="#6B7280" />
        <TextInput
          style={styles.buscaInput}
          placeholder="Buscar por modelo, cidade, marca..."
          placeholderTextColor="#9CA3AF"
          value={busca}
          onChangeText={setBusca}
        />
      </View>

      <View style={styles.secaoCabecalho}>
        <Text style={styles.secaoTitulo}>Destaques</Text>

        <TouchableOpacity onPress={() => router.push("/anuncios" as any)}>
          <Text style={styles.verTudo}>Ver todos</Text>
        </TouchableOpacity>
      </View>

      {carregandoAnuncios ? (
        <View style={styles.carregandoBox}>
          <ActivityIndicator size="small" color="#111111" />
          <Text style={styles.carregandoTexto}>Carregando anúncios...</Text>
        </View>
      ) : destaques.length === 0 ? (
        <View style={styles.vazioBox}>
          <Text style={styles.vazioTitulo}>Nenhum anúncio encontrado</Text>
          <Text style={styles.vazioTexto}>
            Assim que novos veículos forem aprovados, eles aparecerão aqui.
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listaHorizontal}
        >
          {destaques.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.cardDestaqueHorizontal}
              activeOpacity={0.9}
              onPress={() => router.push(`/detalhe/${item.id}` as any)}
            >
              <Image
                source={
                  item.fotos?.[0]
                    ? { uri: item.fotos[0] }
                    : require("../assets/images/logo.png")
                }
                style={styles.cardImagemGrande}
                resizeMode="cover"
              />

              <View style={styles.overlayGradiente} />

              <View style={styles.cardOverlay}>
                <Text style={styles.cardTituloOverlay} numberOfLines={1}>
                  {item.titulo || "Veículo clássico"}
                </Text>

                <Text style={styles.cardSubOverlay} numberOfLines={1}>
                  {[item.marca, item.modelo, item.ano]
                    .filter(Boolean)
                    .join(" • ")}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {recentes.length > 0 && (
        <>
          <View style={styles.secaoCabecalho}>
            <Text style={styles.secaoTitulo}>Recentes</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listaHorizontal}
          >
            {recentes.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.cardHorizontal}
                activeOpacity={0.9}
                onPress={() => router.push(`/detalhe/${item.id}` as any)}
              >
                <Image
                  source={
                    item.fotos?.[0]
                      ? { uri: item.fotos[0] }
                      : require("../assets/images/logo.png")
                  }
                  style={styles.cardHorizontalImagem}
                  resizeMode="cover"
                />

                <Text style={styles.cardHorizontalTitulo} numberOfLines={1}>
                  {item.titulo || "Veículo clássico"}
                </Text>

                <Text style={styles.cardHorizontalPreco}>
                  {formatarPreco(item.preco)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      <View style={styles.secaoCabecalho}>
        <Text style={styles.secaoTitulo}>Eventos</Text>

        <TouchableOpacity onPress={() => router.push("/eventos" as any)}>
          <Text style={styles.verTudo}>Ver eventos</Text>
        </TouchableOpacity>
      </View>

      {carregandoEventos ? (
        <View style={styles.carregandoBox}>
          <ActivityIndicator size="small" color="#111111" />
          <Text style={styles.carregandoTexto}>Carregando eventos...</Text>
        </View>
      ) : eventos.length === 0 ? (
        <View style={styles.vazioBox}>
          <Text style={styles.vazioTitulo}>Nenhum evento aprovado</Text>
          <Text style={styles.vazioTexto}>
            Os próximos encontros aparecerão aqui.
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listaHorizontal}
        >
          {eventos.map((item) => {
            const imagem = item.imagem || item.fotos?.[0];

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.cardEvento}
                activeOpacity={0.9}
                onPress={() =>
                  router.push(`/detalhe-evento/${item.id}` as any)
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

                <View style={styles.eventoConteudo}>
                  <Text style={styles.eventoTitulo} numberOfLines={1}>
                    {item.titulo || "Evento de antigomobilismo"}
                  </Text>

                  <Text style={styles.eventoLocal} numberOfLines={1}>
                    {[item.cidade, item.estado].filter(Boolean).join(" / ")}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
    paddingTop: 10,
    paddingBottom: 120,
    backgroundColor: "#FFFFFF",
  },

  buscaBox: {
    marginTop: 14,
    marginHorizontal: 16,
    height: 50,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  buscaInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#111111",
  },

  secaoCabecalho: {
    marginTop: 24,
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  secaoTitulo: {
    fontSize: 21,
    fontWeight: "900",
    color: "#111111",
  },

  verTudo: {
    fontSize: 13,
    fontWeight: "900",
    color: "#1E3A8A",
  },

  carregandoBox: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 18,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  carregandoTexto: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6B7280",
  },

  vazioBox: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 18,
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
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    lineHeight: 19,
  },

  listaHorizontal: {
    paddingHorizontal: 16,
    gap: 12,
  },

  cardDestaqueHorizontal: {
    width: 300,
    height: 200,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
  },

  cardImagemGrande: {
    width: "100%",
    height: "100%",
  },

  overlayGradiente: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 82,
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  cardOverlay: {
    position: "absolute",
    bottom: 14,
    left: 14,
    right: 14,
  },

  cardTituloOverlay: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  cardSubOverlay: {
    marginTop: 4,
    color: "#E5E7EB",
    fontSize: 12,
    fontWeight: "700",
  },

  cardHorizontal: {
    width: 180,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },

  cardHorizontalImagem: {
    width: "100%",
    height: 120,
    backgroundColor: "#F3F4F6",
  },

  cardHorizontalTitulo: {
    marginTop: 10,
    marginHorizontal: 12,
    fontSize: 14,
    fontWeight: "900",
    color: "#111111",
  },

  cardHorizontalPreco: {
    marginTop: 4,
    marginHorizontal: 12,
    marginBottom: 12,
    fontSize: 14,
    fontWeight: "900",
    color: "#1E3A8A",
  },

  cardEvento: {
    width: 230,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },

  eventoImagem: {
    width: "100%",
    height: 130,
    backgroundColor: "#F3F4F6",
  },

  eventoConteudo: {
    padding: 12,
  },

  eventoTitulo: {
    fontSize: 15,
    fontWeight: "900",
    color: "#111111",
  },

  eventoLocal: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
  },
});