import { useEffect, useState } from "react";
import {
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
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { auth } from "../services/firebase";
import { colors } from "../utils/theme";

export default function Conta() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [usuario, setUsuario] = useState<User | null>(null);
  const [modoCadastro, setModoCadastro] = useState(false);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
    });

    return unsubscribe;
  }, []);

  async function fazerLogin() {
    if (!email.trim() || !senha.trim()) {
      Alert.alert("Atenção", "Informe email e senha.");
      return;
    }

    try {
      setCarregando(true);
      await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        senha
      );
    } catch (error: any) {
      Alert.alert("Erro no login", "Email ou senha inválidos.");
    } finally {
      setCarregando(false);
    }
  }

  async function fazerCadastro() {
    if (!email.trim() || !senha.trim()) {
      Alert.alert("Atenção", "Informe email e senha.");
      return;
    }

    if (senha.length < 6) {
      Alert.alert("Atenção", "A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    try {
      setCarregando(true);
      await createUserWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        senha
      );
      Alert.alert("Sucesso", "Conta criada com sucesso!");
    } catch (error: any) {
      Alert.alert("Erro", "Não foi possível criar a conta.");
    } finally {
      setCarregando(false);
    }
  }

  async function recuperarSenha() {
    if (!email.trim()) {
      Alert.alert(
        "Informe o email",
        "Digite seu email para recuperar a senha."
      );
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      Alert.alert("Email enviado", "Verifique sua caixa de entrada.");
    } catch {
      Alert.alert("Erro", "Não foi possível enviar o email.");
    }
  }

  async function sair() {
    await signOut(auth);
    setEmail("");
    setSenha("");
  }

  // LOGADO
  if (usuario) {
    return (
      <View style={styles.containerLogado}>
        <View style={styles.card}>
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.titulo}>Minha conta</Text>

          <Text style={styles.label}>Logado como</Text>
          <Text style={styles.email}>{usuario.email}</Text>

          <TouchableOpacity style={styles.botaoSair} onPress={sair}>
            <Text style={styles.textoBotaoSair}>Sair</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // LOGIN
  return (
    <KeyboardAvoidingView
      style={styles.tela}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.box}>
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

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

          {!modoCadastro && (
            <TouchableOpacity onPress={recuperarSenha}>
              <Text style={styles.esqueci}>Esqueci minha senha</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.botaoPrincipal}
            onPress={modoCadastro ? fazerCadastro : fazerLogin}
            disabled={carregando}
          >
            <Text style={styles.textoBotao}>
              {carregando
                ? "Aguarde..."
                : modoCadastro
                ? "Criar conta"
                : "Entrar"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setModoCadastro(!modoCadastro)}>
            <Text style={styles.link}>
              {modoCadastro ? "Já tenho conta" : "Criar uma conta"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.botaoGoogle}>
            <Ionicons name="logo-google" size={20} color="#555" />
            <Text style={styles.textoGoogle}>Entrar com Google</Text>
          </TouchableOpacity>

          <Text style={styles.info}>Google será ativado em breve</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: colors.background,
  },

  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },

  box: {
    width: "100%",
  },

  logo: {
    width: 120,
    height: 100,
    alignSelf: "center",
    marginBottom: 24,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 15,
    marginBottom: 12,
    backgroundColor: colors.surface,
    color: colors.text,
  },

  esqueci: {
    textAlign: "right",
    color: colors.primary,
    marginBottom: 10,
    fontWeight: "600",
  },

  botaoPrincipal: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 6,
  },

  textoBotao: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  link: {
    marginTop: 15,
    color: colors.primary,
    textAlign: "center",
    fontWeight: "600",
  },

  botaoGoogle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    marginTop: 15,
    backgroundColor: "#FFFFFF",
  },

  textoGoogle: {
    color: "#333333",
    fontWeight: "bold",
  },

  info: {
    marginTop: 8,
    textAlign: "center",
    color: "#999999",
    fontSize: 12,
  },

  containerLogado: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: colors.background,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },

  titulo: {
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 15,
    color: colors.text,
  },

  label: {
    textAlign: "center",
    color: colors.textMuted,
  },

  email: {
    textAlign: "center",
    fontWeight: "bold",
    marginTop: 5,
    color: colors.text,
  },

  botaoSair: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
    alignItems: "center",
  },

  textoBotaoSair: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
});