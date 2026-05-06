import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { router } from "expo-router";
import { colors } from "../utils/theme";

export default function Termos() {
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.titulo}>
          Termos de uso e privacidade
        </Text>

        <Text style={styles.texto}>
          O Volante é uma plataforma destinada à divulgação de veículos
          clássicos, encontros automotivos e eventos relacionados ao
          antigomobilismo.
        </Text>

        <Text style={styles.texto}>
          Ao utilizar o aplicativo, o usuário concorda em fornecer
          informações verdadeiras, respeitar as regras da plataforma e
          utilizar o serviço de forma responsável.
        </Text>

        <Text style={styles.texto}>
          Os anúncios publicados poderão passar por análise administrativa
          antes de serem exibidos publicamente.
        </Text>

        <Text style={styles.texto}>
          O Volante poderá remover conteúdos que violem políticas da
          plataforma, legislação vigente ou apresentem indícios de fraude.
        </Text>

        <Text style={styles.texto}>
          As informações cadastradas são utilizadas apenas para funcionamento
          da plataforma e comunicação entre usuários.
        </Text>

        <Text style={styles.texto}>
          Ao continuar utilizando o aplicativo, você declara estar de acordo
          com estes termos e com a política de privacidade do Volante.
        </Text>

        <TouchableOpacity
          style={styles.botao}
          onPress={() => router.back()}
          activeOpacity={0.85}
        >
          <Text style={styles.botaoTexto}>
            Voltar
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    padding: 24,
    paddingBottom: 120,
  },

  titulo: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.text,
    marginBottom: 24,
  },

  texto: {
    fontSize: 16,
    lineHeight: 26,
    color: colors.textMuted,
    marginBottom: 18,
  },

  botao: {
    marginTop: 20,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },

  botaoTexto: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
});