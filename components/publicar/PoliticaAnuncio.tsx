import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  onAceitar: () => void;
};

export default function PoliticaAnuncio({ onAceitar }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Política de anúncios</Text>

      <Text style={styles.texto}>
        O Volante não intermedeia negociações, não avaliza veículos e não
        garante informações, pagamentos, entrega, documentação ou a veracidade
        dos dados informados pelo anunciante.
      </Text>

      <Text style={styles.texto}>
        Toda negociação é feita diretamente entre anunciante e interessado.
      </Text>

      <Text style={styles.texto}>
        Para publicar, o anúncio ou evento deve conter pelo menos uma foto
        válida.
      </Text>

      <Text style={styles.destaque}>
        Ao continuar, você declara estar ciente e de acordo com essa política.
      </Text>

      <TouchableOpacity style={styles.botao} onPress={onAceitar}>
        <Text style={styles.botaoTexto}>Concordo e continuar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 24,
    justifyContent: "center",
  },

  titulo: {
    fontSize: 26,
    fontWeight: "900",
    color: "#111111",
    marginBottom: 18,
  },

  texto: {
    fontSize: 15,
    color: "#4B5563",
    lineHeight: 22,
    marginBottom: 12,
  },

  destaque: {
    fontSize: 15,
    color: "#111111",
    fontWeight: "800",
    lineHeight: 22,
    marginTop: 8,
  },

  botao: {
    marginTop: 28,
    backgroundColor: "#D4A857",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },

  botaoTexto: {
    color: "#111111",
    fontSize: 16,
    fontWeight: "900",
  },
});