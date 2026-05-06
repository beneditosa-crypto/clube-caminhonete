import { StyleSheet, Text, View } from "react-native";

type Props = {
  titulo?: string;
  marca?: string;
  modelo?: string;
  ano?: string | number;
  cidade?: string;
  estado?: string;
  preco?: string | number;
  descricao?: string;
};

export default function InfoVeiculo({
  titulo,
  marca,
  modelo,
  ano,
  cidade,
  estado,
  preco,
  descricao,
}: Props) {
  function formatarPreco(valor?: string | number) {
    if (valor === undefined || valor === null || valor === "") {
      return "Preço sob consulta";
    }

    const numero =
      typeof valor === "number"
        ? valor
        : Number(String(valor).replace(/\D/g, ""));

    if (!numero || Number.isNaN(numero)) {
      return "Preço sob consulta";
    }

    return numero.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>{titulo || "Veículo anunciado"}</Text>

      <Text style={styles.info}>
        {marca || "-"} {modelo || ""} • {ano || "-"}
      </Text>

      <Text style={styles.local}>
        {cidade || "-"} - {estado || "-"}
      </Text>

      <Text style={styles.preco}>{formatarPreco(preco)}</Text>

      <View style={styles.divisor} />

      <Text style={styles.descricaoTitulo}>Descrição</Text>

      <Text style={styles.descricao}>
        {descricao || "Sem descrição informada."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 4,
    marginBottom: 4,
  },

  titulo: {
    fontSize: 24,
    fontWeight: "900",
    color: "#111111",
  },

  info: {
    fontSize: 15,
    color: "#6B7280",
    marginTop: 6,
    fontWeight: "700",
  },

  local: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 4,
    fontWeight: "600",
  },

  preco: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1E3A8A",
    marginTop: 14,
  },

  divisor: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 16,
  },

  descricaoTitulo: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111111",
  },

  descricao: {
    fontSize: 15,
    color: "#4B5563",
    lineHeight: 22,
    marginTop: 8,
  },
});