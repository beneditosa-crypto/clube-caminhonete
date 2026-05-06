import { StyleSheet, Text, View } from "react-native";

export default function HomeBanner() {
  return (
    <View style={styles.banner}>
      <Text style={styles.titulo}>Venda com confiança</Text>

      <Text style={styles.texto}>
        Apenas veículos com mais de 25 anos. Todos passam por análise antes da
        publicação.
      </Text>

      <View style={styles.selo}>
        <Text style={styles.seloTexto}>APROVAÇÃO MANUAL</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    margin: 18,
    backgroundColor: "#101A14",
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    borderColor: "#1E2B22",
  },

  titulo: {
    fontSize: 24,
    fontWeight: "900",
    color: "#F6EFE3",
  },

  texto: {
    fontSize: 15,
    color: "#D8C8AD",
    marginTop: 10,
    lineHeight: 21,
  },

  selo: {
    marginTop: 18,
    alignSelf: "flex-start",
    backgroundColor: "#D8A348",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },

  seloTexto: {
    fontSize: 11,
    fontWeight: "900",
    color: "#101A14",
    letterSpacing: 1,
  },
});