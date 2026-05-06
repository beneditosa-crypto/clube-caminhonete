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
import { Ionicons } from "@expo/vector-icons";

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
            <Image
              source={{ uri: fotoAberta }}
              style={styles.imagemGrande}
              resizeMode="contain"
            />
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
    height: 72,
    backgroundColor: "rgba(0,0,0,0.20)",
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

  imagemGrande: {
    width: larguraTela,
    height: "84%",
  },
});