import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  fotos?: string[];
};

const larguraTela = Dimensions.get("window").width;
const larguraFoto = larguraTela - 32;
const alturaFoto = larguraTela * 0.58;

export default function GaleriaFotos({ fotos }: Props) {
  const [fotoAberta, setFotoAberta] = useState<string | null>(null);
  const [fotoAtual, setFotoAtual] = useState(0);

  if (!fotos || fotos.length === 0) {
    return (
      <View style={styles.semImagem}>
        <Ionicons name="image-outline" size={34} color="#9CA3AF" />
        <Text style={styles.semImagemTexto}>Sem foto disponível</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        snapToInterval={larguraFoto + 10}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(
            event.nativeEvent.contentOffset.x / (larguraFoto + 10)
          );
          setFotoAtual(index);
        }}
      >
        {fotos.map((foto, index) => (
          <TouchableOpacity
            key={`${foto}-${index}`}
            activeOpacity={0.92}
            onPress={() => setFotoAberta(foto)}
          >
            <View style={styles.imagemBox}>
              <Image source={{ uri: foto }} style={styles.imagem} />

              <View style={styles.sombraInferior} />

              <View style={styles.marcaDagua}>
                <Image
                  source={require("../../assets/images/logo.png")}
                  style={styles.logoMarcaDagua}
                  resizeMode="contain"
                />

                <View>
                  <Text style={styles.marcaDaguaTitulo}>Volante</Text>
                  <Text style={styles.marcaDaguaSite}>volante.app.br</Text>
                </View>
              </View>

              <View style={styles.contador}>
                <Ionicons name="images-outline" size={13} color="#FFFFFF" />
                <Text style={styles.contadorTexto}>
                  {index + 1}/{fotos.length}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {fotos.length > 1 && (
        <View style={styles.pontos}>
          {fotos.map((_, index) => (
            <View
              key={index}
              style={[styles.ponto, fotoAtual === index && styles.pontoAtivo]}
            />
          ))}
        </View>
      )}

      <Modal visible={!!fotoAberta} transparent animationType="fade">
        <View style={styles.modal}>
          <Pressable
            style={styles.fecharArea}
            onPress={() => setFotoAberta(null)}
          >
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </Pressable>

          {fotoAberta ? (
            <View style={styles.modalImagemBox}>
              <Image
                source={{ uri: fotoAberta }}
                style={styles.imagemGrande}
                resizeMode="contain"
              />

              <View style={styles.marcaDaguaModal}>
                <Image
                  source={require("../../assets/images/logo.png")}
                  style={styles.logoMarcaDaguaModal}
                  resizeMode="contain"
                />

                <View>
                  <Text style={styles.marcaDaguaTituloModal}>Volante</Text>
                  <Text style={styles.marcaDaguaSiteModal}>
                    volante.app.br
                  </Text>
                </View>
              </View>
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },

  scroll: {
    paddingHorizontal: 16,
  },

  imagemBox: {
    width: larguraFoto,
    height: alturaFoto,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
    marginRight: 10,
  },

  imagem: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  sombraInferior: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 58,
    backgroundColor: "rgba(0,0,0,0.16)",
  },

  marcaDagua: {
    position: "absolute",
    left: 10,
    bottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.30)",
    borderRadius: 999,
    paddingVertical: 3,
    paddingLeft: 4,
    paddingRight: 7,
  },

  logoMarcaDagua: {
    width: 18,
    height: 18,
  },

  marcaDaguaTitulo: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    lineHeight: 10,
  },

  marcaDaguaSite: {
    color: "#E5E7EB",
    fontSize: 7,
    fontWeight: "700",
    lineHeight: 8,
  },

  contador: {
    position: "absolute",
    right: 12,
    bottom: 12,
    backgroundColor: "rgba(0,0,0,0.62)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  contadorTexto: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  pontos: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
    gap: 5,
  },

  ponto: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#D1D5DB",
  },

  pontoAtivo: {
    width: 18,
    backgroundColor: "#1E3A8A",
  },

  semImagem: {
    marginHorizontal: 16,
    height: alturaFoto,
    borderRadius: 22,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  semImagemTexto: {
    marginTop: 8,
    color: "#6B7280",
    fontWeight: "800",
  },

  modal: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },

  fecharArea: {
    position: "absolute",
    top: 48,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },

  modalImagemBox: {
    width: larguraTela,
    height: "84%",
    alignItems: "center",
    justifyContent: "center",
  },

  imagemGrande: {
    width: larguraTela,
    height: "100%",
  },

  marcaDaguaModal: {
    position: "absolute",
    left: 14,
    bottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.34)",
    borderRadius: 999,
    paddingVertical: 4,
    paddingLeft: 5,
    paddingRight: 8,
  },

  logoMarcaDaguaModal: {
    width: 20,
    height: 20,
  },

  marcaDaguaTituloModal: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    lineHeight: 11,
  },

  marcaDaguaSiteModal: {
    color: "#E5E7EB",
    fontSize: 8,
    fontWeight: "700",
    lineHeight: 9,
  },
});