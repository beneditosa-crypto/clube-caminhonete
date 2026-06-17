import {
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { router } from "expo-router";

import { useAuth } from "../contexts/AuthContext";

import { colors } from "../utils/theme";

export default function Login() {
  const {
    usuario,
    carregando,
    login,
    cadastrar,
    loginGoogle,
    loginApple,
    resetarSenha,
  } = useAuth();

  const [email, setEmail] =
    useState("");

  const [senha, setSenha] =
    useState("");

  const [modoCadastro, setModoCadastro] =
    useState(false);

  const [carregandoLogin, setCarregandoLogin] =
    useState(false);

  const [carregandoGoogle, setCarregandoGoogle] =
    useState(false);

  const [carregandoApple, setCarregandoApple] =
    useState(false);

  const [carregandoReset, setCarregandoReset] =
    useState(false);

  const [aceitouTermos, setAceitouTermos] =
    useState(false);

  useEffect(() => {
    if (
      !carregando &&
      usuario
    ) {
      router.replace("/");
    }
  }, [
    usuario,
    carregando,
  ]);

  async function entrarOuCadastrar() {
    const emailTratado =
      email.trim().toLowerCase();

    if (!emailTratado || !senha) {
      Alert.alert(
        "Atenção",
        "Preencha email e senha."
      );

      return;
    }

    if (senha.length < 6) {
      Alert.alert(
        "Atenção",
        "A senha precisa ter pelo menos 6 caracteres."
      );

      return;
    }

    if (
      modoCadastro &&
      !aceitouTermos
    ) {
      Alert.alert(
        "Termos obrigatórios",
        "Você precisa aceitar os termos para continuar."
      );

      return;
    }

    try {
      setCarregandoLogin(true);

      if (modoCadastro) {
        await cadastrar(
          emailTratado,
          senha
        );

        Alert.alert(
          "Conta criada",
          "Cadastro realizado com sucesso."
        );
      } else {
        await login(
          emailTratado,
          senha
        );
      }
    } catch (error: any) {
      let mensagem =
        "Não foi possível entrar.";

      if (
        error.code ===
          "auth/invalid-credential" ||
        error.code ===
          "auth/user-not-found" ||
        error.code ===
          "auth/wrong-password"
      ) {
        mensagem =
          "Email ou senha inválidos.";
      } else if (
        error.code ===
        "auth/email-already-in-use"
      ) {
        mensagem =
          "Este email já está cadastrado.";
      } else if (
        error.code ===
        "auth/weak-password"
      ) {
        mensagem =
          "A senha precisa ter pelo menos 6 caracteres.";
      } else if (
        error.code ===
        "auth/invalid-email"
      ) {
        mensagem = "Email inválido.";
      }

      Alert.alert(
        "Erro",
        mensagem
      );
    } finally {
      setCarregandoLogin(false);
    }
  }

  async function entrarGoogle() {
    try {
      setCarregandoGoogle(true);

      await loginGoogle();
    } catch {
      Alert.alert(
        "Erro",
        "Não foi possível entrar com Google."
      );
    } finally {
      setCarregandoGoogle(false);
    }
  }

  async function entrarApple() {
    try {
      setCarregandoApple(true);

      await loginApple();
    } catch (error: any) {
      if (
        error?.code === "ERR_REQUEST_CANCELED" ||
        error?.code === "ERR_CANCELED"
      ) {
        return;
      }

      Alert.alert(
        "Erro",
        "Não foi possível entrar com Apple."
      );
    } finally {
      setCarregandoApple(false);
    }
  }

  async function esqueciMinhaSenha() {
    const emailTratado =
      email.trim().toLowerCase();

    if (!emailTratado) {
      Alert.alert(
        "Informe seu email",
        "Digite seu email para redefinir sua senha."
      );

      return;
    }

    try {
      setCarregandoReset(true);

      await resetarSenha(
        emailTratado
      );

      Alert.alert(
        "Email enviado",
        "Verifique sua caixa de entrada."
      );
    } catch (error: any) {
      let mensagem =
        "Não foi possível enviar o email.";

      if (
        error.code ===
        "auth/invalid-email"
      ) {
        mensagem =
          "Email inválido.";
      } else if (
        error.code ===
        "auth/user-not-found"
      ) {
        mensagem =
          "Conta não encontrada.";
      }

      Alert.alert(
        "Erro",
        mensagem
      );
    } finally {
      setCarregandoReset(false);
    }
  }

  if (carregando) {
    return (
      <View
        style={styles.loadingContainer}
      >
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.conteudo
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={
          false
        }
      >
        <View style={styles.header}>
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.nomeApp}>
            Volante
          </Text>

          <Text style={styles.titulo}>
            {modoCadastro
              ? "Criar conta"
              : "Entrar"}
          </Text>
        </View>

        <View style={styles.card}>
          {Platform.OS === "ios" && (
            <TouchableOpacity
              style={
                styles.botaoApple
              }
              onPress={entrarApple}
              disabled={
                carregandoApple
              }
              activeOpacity={0.85}
            >
              {carregandoApple ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name="logo-apple"
                    size={20}
                    color="#FFFFFF"
                  />

                  <Text
                    style={
                      styles.botaoAppleTexto
                    }
                  >
                    Entrar com Apple
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.botaoGoogle,
              Platform.OS === "ios" &&
                styles.botaoGoogleComMargem,
            ]}
            onPress={entrarGoogle}
            disabled={
              carregandoGoogle
            }
            activeOpacity={0.85}
          >
            {carregandoGoogle ? (
              <ActivityIndicator color="#111827" />
            ) : (
              <>
                <Ionicons
                  name="logo-google"
                  size={18}
                  color="#111827"
                />

                <Text
                  style={
                    styles.botaoGoogleTexto
                  }
                >
                  Entrar com Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.divisor}>
            <View style={styles.linha} />

            <Text
              style={
                styles.divisorTexto
              }
            >
              ou
            </Text>

            <View style={styles.linha} />
          </View>

          <TextInput
            placeholder="Email"
            placeholderTextColor={
              colors.iconMuted
            }
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            placeholder="Senha"
            placeholderTextColor={
              colors.iconMuted
            }
            style={styles.input}
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
          />

          {!modoCadastro && (
            <TouchableOpacity
              style={
                styles.esqueciSenhaBotao
              }
              onPress={
                esqueciMinhaSenha
              }
              disabled={
                carregandoReset
              }
              activeOpacity={0.85}
            >
              {carregandoReset ? (
                <ActivityIndicator
                  size="small"
                  color={
                    colors.primary
                  }
                />
              ) : (
                <Text
                  style={
                    styles.esqueciSenhaTexto
                  }
                >
                  Esqueci minha senha
                </Text>
              )}
            </TouchableOpacity>
          )}

          {modoCadastro && (
            <View
              style={
                styles.termosBox
              }
            >
              <TouchableOpacity
                style={[
                  styles.checkbox,
                  aceitouTermos &&
                    styles.checkboxAtivo,
                ]}
                onPress={() =>
                  setAceitouTermos(
                    !aceitouTermos
                  )
                }
                activeOpacity={0.8}
              >
                {aceitouTermos && (
                  <Ionicons
                    name="checkmark"
                    size={16}
                    color="#FFFFFF"
                  />
                )}
              </TouchableOpacity>

              <View
                style={
                  styles.termosTextoBox
                }
              >
                <Text
                  style={
                    styles.termosTexto
                  }
                >
                  Li e aceito os{" "}
                </Text>

                <TouchableOpacity
                  onPress={() =>
                    router.push(
                      "/termos"
                    )
                  }
                >
                  <Text
                    style={
                      styles.linkTermos
                    }
                  >
                    Termos e Política
                    de Privacidade
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.botao,
              carregandoLogin &&
                styles.botaoDesativado,
            ]}
            onPress={
              entrarOuCadastrar
            }
            disabled={
              carregandoLogin
            }
            activeOpacity={0.85}
          >
            {carregandoLogin ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text
                style={
                  styles.botaoTexto
                }
              >
                {modoCadastro
                  ? "Cadastrar"
                  : "Entrar"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setModoCadastro(
                !modoCadastro
              );

              setAceitouTermos(
                false
              );
            }}
          >
            <Text style={styles.link}>
              {modoCadastro
                ? "Já tenho conta"
                : "Criar uma conta"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor:
      colors.background,
  },

  container: {
    flex: 1,
    backgroundColor:
      colors.background,
  },

  conteudo: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 120,
    justifyContent: "center",
    backgroundColor:
      colors.background,
  },

  header: {
    alignItems: "center",
    marginBottom: 24,
  },

  logo: {
    width: 90,
    height: 90,
    marginBottom: 6,
  },

  nomeApp: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.text,
  },

  titulo: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.text,
    marginTop: 14,
  },

  card: {
    backgroundColor:
      "#FFFFFF",
    borderWidth: 1,
    borderColor:
      colors.border,
    borderRadius: 22,
    padding: 18,
  },

  botaoApple: {
    height: 56,
    borderRadius: 14,
    backgroundColor:
      "#000000",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  botaoAppleTexto: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  botaoGoogle: {
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor:
      "#E5E7EB",
    backgroundColor:
      "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  botaoGoogleComMargem: {
    marginTop: 12,
  },

  botaoGoogleTexto: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "800",
  },

  divisor: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
  },

  linha: {
    flex: 1,
    height: 1,
    backgroundColor:
      "#E5E7EB",
  },

  divisorTexto: {
    marginHorizontal: 12,
    color:
      colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },

  input: {
    backgroundColor:
      colors.surface,
    borderWidth: 1,
    borderColor:
      colors.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    color: colors.text,
    fontSize: 16,
  },

  esqueciSenhaBotao: {
    alignSelf: "flex-end",
    minHeight: 28,
    justifyContent: "center",
    marginTop: -4,
    marginBottom: 16,
  },

  esqueciSenhaTexto: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "900",
  },

  termosBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 18,
    marginTop: 4,
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor:
      "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    marginRight: 12,
  },

  checkboxAtivo: {
    backgroundColor:
      colors.primary,
  },

  termosTextoBox: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
  },

  termosTexto: {
    color:
      colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },

  linkTermos: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 22,
  },

  botao: {
    backgroundColor:
      colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
  },

  botaoDesativado: {
    opacity: 0.7,
  },

  botaoTexto: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
  },

  link: {
    color: colors.primary,
    textAlign: "center",
    fontWeight: "900",
    marginTop: 20,
    fontSize: 15,
  },
});