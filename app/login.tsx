import { useState } from "react";
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
  const { login, cadastrar } = useAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [modoCadastro, setModoCadastro] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [aceitouTermos, setAceitouTermos] = useState(false);

  async function entrarOuCadastrar() {
    const emailTratado = email.trim().toLowerCase();

    if (!emailTratado || !senha) {
      Alert.alert("Atenção", "Preencha email e senha.");
      return;
    }

    if (senha.length < 6) {
      Alert.alert(
        "Atenção",
        "A senha precisa ter pelo menos 6 caracteres."
      );
      return;
    }

    if (modoCadastro && !aceitouTermos) {
      Alert.alert(
        "Termos obrigatórios",
        "Você precisa aceitar os termos para continuar."
      );
      return;
    }

    try {
      setCarregando(true);

      if (modoCadastro) {
        await cadastrar(emailTratado, senha);

        Alert.alert(
          "Conta criada",
          "Cadastro realizado com sucesso."
        );
      } else {
        await login(emailTratado, senha);
      }

      router.replace("/");
    } catch (error: any) {
      let mensagem = "Não foi possível entrar.";

      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        mensagem = "Email ou senha inválidos.";
      } else if (error.code === "auth/email-already-in-use") {
        mensagem = "Este email já está cadastrado.";
      } else if (error.code === "auth/weak-password") {
        mensagem =
          "A senha precisa ter pelo menos 6 caracteres.";
      } else if (error.code === "auth/invalid-email") {
        mensagem = "Email inválido.";
      }

      Alert.alert("Erro", mensagem);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.conteudo}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.nomeApp}>Volante</Text>

          <Text style={styles.titulo}>
            {modoCadastro ? "Criar conta" : "Entrar"}
          </Text>
        </View>

        <View style={styles.card}>
          <TextInput
            placeholder="Email"
            placeholderTextColor={colors.iconMuted}
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            placeholder="Senha"
            placeholderTextColor={colors.iconMuted}
            style={styles.input}
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
          />

          {modoCadastro && (
            <View style={styles.termosBox}>
              <TouchableOpacity
                style={[
                  styles.checkbox,
                  aceitouTermos && styles.checkboxAtivo,
                ]}
                onPress={() =>
                  setAceitouTermos(!aceitouTermos)
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

              <View style={styles.termosTextoBox}>
                <Text style={styles.termosTexto}>
                  Li e aceito os{" "}
                </Text>

                <TouchableOpacity
                  onPress={() => router.push("/termos")}
                >
                  <Text style={styles.linkTermos}>
                    Termos e Política de Privacidade
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.botao,
              carregando && styles.botaoDesativado,
            ]}
            onPress={entrarOuCadastrar}
            disabled={carregando}
            activeOpacity={0.85}
          >
            {carregando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.botaoTexto}>
                {modoCadastro ? "Cadastrar" : "Entrar"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setModoCadastro(!modoCadastro);
              setAceitouTermos(false);
            }}
          >
            <Text style={styles.link}>
              {modoCadastro
                ? "Já tenho conta"
                : "Criar uma conta"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => router.replace("/")}
        >
          <Text style={styles.voltar}>
            Voltar para início
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  conteudo: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 120,
    justifyContent: "center",
    backgroundColor: colors.background,
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
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    padding: 18,
  },

  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    color: colors.text,
    fontSize: 16,
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
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    marginRight: 12,
  },

  checkboxAtivo: {
    backgroundColor: colors.primary,
  },

  termosTextoBox: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
  },

  termosTexto: {
    color: colors.textMuted,
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
    backgroundColor: colors.primary,
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

  voltar: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 22,
    fontSize: 15,
    fontWeight: "700",
  },
});