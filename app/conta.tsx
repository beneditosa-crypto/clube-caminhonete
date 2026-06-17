import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "../contexts/AuthContext";
import { colors } from "../utils/theme";

export default function Conta() {
  const {
    usuario,
    carregando,
    logout,
    excluirConta,
    biometriaDisponivel,
    biometriaAtiva,
    ativarBiometria,
    desativarBiometria,
  } = useAuth();

  const [
    processandoBiometria,
    setProcessandoBiometria,
  ] = useState(false);

  const [
    processandoExclusao,
    setProcessandoExclusao,
  ] = useState(false);

  async function sair() {
    try {
      await logout();

      router.replace(
        "/login"
      );
    } catch {
      Alert.alert(
        "Erro",
        "Não foi possível sair."
      );
    }
  }

  async function confirmarExcluirConta() {
    Alert.alert(
      "Excluir conta",
      "Esta ação removerá permanentemente sua conta do Volante App. Deseja continuar?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Confirmar exclusão",
              "Tem certeza? Esta ação não poderá ser desfeita.",
              [
                {
                  text: "Cancelar",
                  style: "cancel",
                },
                {
                  text: "Excluir definitivamente",
                  style: "destructive",
                  onPress: excluirContaDefinitivamente,
                },
              ]
            );
          },
        },
      ]
    );
  }

  async function excluirContaDefinitivamente() {
    try {
      setProcessandoExclusao(
        true
      );

      await excluirConta();

      Alert.alert(
        "Conta excluída",
        "Sua conta foi excluída com sucesso."
      );

      router.replace(
        "/login"
      );
    } catch (error: any) {
      let mensagem =
        "Não foi possível excluir sua conta. Saia, entre novamente e tente outra vez.";

      if (
        error?.code ===
        "auth/requires-recent-login"
      ) {
        mensagem =
          "Por segurança, entre novamente no aplicativo e tente excluir a conta outra vez.";
      }

      Alert.alert(
        "Erro",
        mensagem
      );
    } finally {
      setProcessandoExclusao(
        false
      );
    }
  }

  async function alternarBiometria() {
    try {
      setProcessandoBiometria(
        true
      );

      if (
        biometriaAtiva
      ) {
        await desativarBiometria();

        Alert.alert(
          "Biometria desativada",
          "O login rápido foi desativado."
        );

        return;
      }

      const sucesso =
        await ativarBiometria();

      if (
        !sucesso
      ) {
        Alert.alert(
          "Biometria indisponível",
          "Não foi possível ativar a biometria neste aparelho."
        );

        return;
      }

      Alert.alert(
        "Biometria ativada",
        "Login rápido ativado com sucesso."
      );
    } finally {
      setProcessandoBiometria(
        false
      );
    }
  }

  async function falarComVolante() {
    const mensagem =
      encodeURIComponent(
        "Olá! Estou utilizando o Volante App e gostaria de tirar uma dúvida."
      );

    const url =
      `https://wa.me/5561991663179?text=${mensagem}`;

    const podeAbrir =
      await Linking.canOpenURL(
        url
      );

    if (
      podeAbrir
    ) {
      await Linking.openURL(
        url
      );

      return;
    }

    Alert.alert(
      "WhatsApp indisponível",
      "Não foi possível abrir o WhatsApp neste aparelho."
    );
  }

  if (
    carregando ||
    !usuario
  ) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
          color={
            colors.primary
          }
        />
      </View>
    );
  }

  return (
    <View
      style={
        styles.container
      }
    >
      <View
        style={
          styles.conteudo
        }
      >
        <Image
          source={
            require(
              "../assets/images/logo.png"
            )
          }
          style={
            styles.logo
          }
          resizeMode="contain"
        />

        <Text
          style={
            styles.nomeApp
          }
        >
          Volante
        </Text>

        <Text
          style={
            styles.titulo
          }
        >
          Minha conta
        </Text>

        <View
          style={
            styles.emailCard
          }
        >
          <Ionicons
            name="person-circle"
            size={24}
            color={
              colors.text
            }
          />

          <Text
            style={
              styles.email
            }
            numberOfLines={1}
          >
            {usuario.email}
          </Text>
        </View>

        <TouchableOpacity
          style={
            styles.linha
          }
          onPress={
            sair
          }
          activeOpacity={0.85}
        >
          <View
            style={
              styles.linhaEsquerda
            }
          >
            <Ionicons
              name="log-out-outline"
              size={22}
              color={
                colors.textMuted
              }
            />

            <Text
              style={
                styles.linhaTitulo
              }
            >
              Sair
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={21}
            color={
              colors.textMuted
            }
          />
        </TouchableOpacity>

        <View
          style={
            styles.linha
          }
        >
          <View
            style={
              styles.linhaEsquerda
            }
          >
            <View
              style={
                styles.iconeVerde
              }
            >
              <Ionicons
                name="finger-print"
                size={22}
                color="#16A34A"
              />
            </View>

            <Text
              style={
                styles.linhaTitulo
              }
            >
              Biometria
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.botaoBiometria,

              (!biometriaDisponivel &&
                !biometriaAtiva) &&
                styles.botaoBiometriaDesabilitado,
            ]}
            onPress={
              alternarBiometria
            }
            activeOpacity={0.85}
            disabled={
              processandoBiometria ||
              (!biometriaDisponivel &&
                !biometriaAtiva)
            }
          >
            {processandoBiometria ? (
              <ActivityIndicator
                size="small"
                color={
                  colors.primary
                }
              />
            ) : (
              <Text
                style={
                  styles.botaoBiometriaTexto
                }
              >
                {biometriaAtiva
                  ? "Desativar"
                  : "Ativar"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={
            styles.linha
          }
          onPress={
            falarComVolante
          }
          activeOpacity={0.85}
        >
          <View
            style={
              styles.linhaEsquerda
            }
          >
            <View
              style={
                styles.iconeVerde
              }
            >
              <Ionicons
                name="logo-whatsapp"
                size={22}
                color="#16A34A"
              />
            </View>

            <View>
              <Text
                style={
                  styles.linhaTitulo
                }
              >
                WhatsApp
              </Text>

              <Text
                style={
                  styles.linhaSubtitulo
                }
              >
                Falar com o Volante
              </Text>
            </View>
          </View>

          <Ionicons
            name="chevron-forward"
            size={21}
            color={
              colors.textMuted
            }
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={
          styles.excluirConta
        }
        onPress={
          confirmarExcluirConta
        }
        activeOpacity={0.85}
        disabled={
          processandoExclusao
        }
      >
        {processandoExclusao ? (
          <ActivityIndicator
            size="small"
            color="#DC2626"
          />
        ) : (
          <>
            <Ionicons
              name="trash-outline"
              size={16}
              color="#DC2626"
            />

            <Text
              style={
                styles.excluirContaTexto
              }
            >
              Excluir conta
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,

    justifyContent:
      "center",

    alignItems:
      "center",

    backgroundColor:
      colors.background,
  },

  container: {
    flex: 1,

    backgroundColor:
      colors.background,

    paddingHorizontal: 22,

    paddingTop: 40,

    paddingBottom: 96,
  },

  conteudo: {
    width: "100%",

    alignItems:
      "center",
  },

  logo: {
    width: 58,

    height: 58,

    marginBottom: 2,

    alignSelf:
      "center",
  },

  nomeApp: {
    fontSize: 18,

    fontWeight:
      "900",

    color:
      colors.text,

    marginBottom: 22,
  },

  titulo: {
    fontSize: 28,

    fontWeight:
      "900",

    color:
      colors.text,

    marginBottom: 22,
  },

  emailCard: {
    width: "100%",

    height: 52,

    borderRadius: 14,

    backgroundColor:
      "#F8FAFC",

    flexDirection:
      "row",

    alignItems:
      "center",

    paddingHorizontal: 14,

    gap: 10,

    marginBottom: 18,
  },

  email: {
    flex: 1,

    fontSize: 13,

    fontWeight:
      "800",

    color:
      colors.text,
  },

  linha: {
    width: "100%",

    minHeight: 56,

    borderRadius: 14,

    backgroundColor:
      "#FFFFFF",

    borderWidth: 1,

    borderColor:
      colors.border,

    flexDirection:
      "row",

    alignItems:
      "center",

    justifyContent:
      "space-between",

    paddingHorizontal: 14,

    marginBottom: 12,
  },

  linhaEsquerda: {
    flexDirection:
      "row",

    alignItems:
      "center",

    gap: 11,
  },

  linhaTitulo: {
    fontSize: 13,

    fontWeight:
      "900",

    color:
      colors.text,
  },

  linhaSubtitulo: {
    fontSize: 10,

    fontWeight:
      "700",

    color:
      colors.textMuted,

    marginTop: 2,
  },

  iconeVerde: {
    width: 30,

    height: 30,

    borderRadius: 9,

    backgroundColor:
      "#DCFCE7",

    alignItems:
      "center",

    justifyContent:
      "center",
  },

  botaoBiometria: {
    minWidth: 58,

    height: 30,

    borderRadius: 8,

    borderWidth: 1,

    borderColor:
      colors.primary,

    backgroundColor:
      "#FFFFFF",

    alignItems:
      "center",

    justifyContent:
      "center",

    paddingHorizontal: 9,
  },

  botaoBiometriaDesabilitado: {
    borderColor:
      colors.border,

    opacity: 0.55,
  },

  botaoBiometriaTexto: {
    fontSize: 11,

    fontWeight:
      "900",

    color:
      colors.primary,
  },

  excluirConta: {
    position:
      "absolute",

    left: 0,

    right: 0,

    bottom: 118,

    flexDirection:
      "row",

    alignItems:
      "center",

    justifyContent:
      "center",

    gap: 6,
  },

  excluirContaTexto: {
    fontSize: 12,

    fontWeight:
      "900",

    color:
      "#DC2626",
  },
});