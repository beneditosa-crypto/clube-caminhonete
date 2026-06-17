import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";

import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

import {
  GoogleAuthProvider,
  OAuthProvider,
  User,
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { auth, db } from "../services/firebase";

import {
  solicitarPermissaoNotificacoes,
} from "../services/notificacoes";

type AuthContextType = {
  usuario: User | null;
  carregando: boolean;
  isAdmin: boolean;
  biometriaDisponivel: boolean;
  biometriaAtiva: boolean;
  verificandoBiometria: boolean;
  biometriaValidada: boolean;
  expoPushToken: string;

  login: (email: string, senha: string) => Promise<void>;
  cadastrar: (email: string, senha: string) => Promise<void>;
  loginGoogle: () => Promise<void>;
  loginApple: () => Promise<void>;
  logout: () => Promise<void>;
  excluirConta: () => Promise<void>;
  resetarSenha: (email: string) => Promise<void>;
  ativarBiometria: () => Promise<boolean>;
  desativarBiometria: () => Promise<void>;
  verificarBiometria: () => Promise<boolean>;
  liberarBiometria: () => void;
};

const AuthContext = createContext<AuthContextType>({
  usuario: null,
  carregando: true,
  isAdmin: false,
  biometriaDisponivel: false,
  biometriaAtiva: false,
  verificandoBiometria: false,
  biometriaValidada: false,
  expoPushToken: "",

  login: async () => {},
  cadastrar: async () => {},
  loginGoogle: async () => {},
  loginApple: async () => {},
  logout: async () => {},
  excluirConta: async () => {},
  resetarSenha: async () => {},
  ativarBiometria: async () => false,
  desativarBiometria: async () => {},
  verificarBiometria: async () => false,
  liberarBiometria: () => {},
});

function getBiometriaKey(user: User | null) {
  const id = user?.uid || user?.email || "usuario";

  return `volante_biometria_${id}`;
}

function gerarNonce(length = 32) {
  const charset =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._";

  let resultado = "";

  for (let i = 0; i < length; i++) {
    resultado += charset.charAt(
      Math.floor(Math.random() * charset.length)
    );
  }

  return resultado;
}

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [usuario, setUsuario] =
    useState<User | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  const [
    biometriaDisponivel,
    setBiometriaDisponivel,
  ] = useState(false);

  const [
    biometriaAtiva,
    setBiometriaAtiva,
  ] = useState(false);

  const [
    verificandoBiometria,
    setVerificandoBiometria,
  ] = useState(false);

  const [
    biometriaValidada,
    setBiometriaValidada,
  ] = useState(false);

  const [
    expoPushToken,
    setExpoPushToken,
  ] = useState("");

  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        "559157035885-thrlfdjerl13p9lag6mia5in2ll6lmfj.apps.googleusercontent.com",
      offlineAccess: false,
    });

    let unsubscribeAuth:
      | (() => void)
      | undefined;

    async function iniciar() {
      await verificarDisponibilidadeBiometria();

      const token =
        await registrarPushNotifications();

      unsubscribeAuth =
        onAuthStateChanged(
          auth,
          async (user) => {
            setUsuario(user);

            if (user) {
              await carregarPreferenciaBiometria(user);

              if (token) {
                await salvarPushToken(user, token);
              }
            } else {
              setBiometriaAtiva(false);
              setBiometriaValidada(false);
            }

            setCarregando(false);
          }
        );
    }

    iniciar();

    return () => {
      if (unsubscribeAuth) {
        unsubscribeAuth();
      }
    };
  }, []);

  async function registrarPushNotifications() {
    try {
      const token =
        await solicitarPermissaoNotificacoes();

      if (token) {
        setExpoPushToken(token);

        if (auth.currentUser) {
          await salvarPushToken(
            auth.currentUser,
            token
          );
        }
      }

      return token || "";
    } catch {
      return "";
    }
  }

  async function salvarPushToken(
    user: User,
    token: string
  ) {
    try {
      const email =
        user.email?.trim().toLowerCase() || "";

      if (!email) return;

      await setDoc(
        doc(db, "usuarios", email),
        {
          email,
          pushToken: token,
          atualizadoEm: serverTimestamp(),
        },
        {
          merge: true,
        }
      );
    } catch {}
  }

  async function verificarDisponibilidadeBiometria() {
    try {
      const hardware =
        await LocalAuthentication.hasHardwareAsync();

      const enrolled =
        await LocalAuthentication.isEnrolledAsync();

      setBiometriaDisponivel(
        hardware && enrolled
      );
    } catch {
      setBiometriaDisponivel(false);
    }
  }

  async function carregarPreferenciaBiometria(
    user: User
  ) {
    try {
      const valor =
        await SecureStore.getItemAsync(
          getBiometriaKey(user)
        );

      const ativa =
        valor === "true";

      setBiometriaAtiva(ativa);
      setBiometriaValidada(!ativa);
    } catch {
      setBiometriaAtiva(false);
      setBiometriaValidada(true);
    }
  }

  async function login(
    email: string,
    senha: string
  ) {
    const emailTratado =
      email.trim().toLowerCase();

    await signInWithEmailAndPassword(
      auth,
      emailTratado,
      senha
    );

    setBiometriaValidada(true);
  }

  async function cadastrar(
    email: string,
    senha: string
  ) {
    const emailTratado =
      email.trim().toLowerCase();

    await createUserWithEmailAndPassword(
      auth,
      emailTratado,
      senha
    );

    setBiometriaValidada(true);
  }

  async function resetarSenha(email: string) {
    const emailTratado =
      email.trim().toLowerCase();

    await sendPasswordResetEmail(
      auth,
      emailTratado
    );
  }

  async function loginGoogle() {
    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      await GoogleSignin.signIn();

      const tokens =
        await GoogleSignin.getTokens();

      if (!tokens.idToken) {
        throw new Error(
          "Token do Google não encontrado."
        );
      }

      const credential =
        GoogleAuthProvider.credential(
          tokens.idToken
        );

      await signInWithCredential(
        auth,
        credential
      );

      setBiometriaValidada(true);
    } catch (erro: any) {
      if (
        erro?.code ===
        statusCodes.SIGN_IN_CANCELLED
      ) {
        return;
      }

      throw erro;
    }
  }

  async function loginApple() {
    const disponivel =
      await AppleAuthentication.isAvailableAsync();

    if (!disponivel) {
      throw new Error(
        "Login Apple indisponível neste dispositivo."
      );
    }

    const rawNonce = gerarNonce();

    const hashedNonce =
      await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );

    const appleCredential =
      await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

    if (!appleCredential.identityToken) {
      throw new Error(
        "Token da Apple não encontrado."
      );
    }

    const provider =
      new OAuthProvider("apple.com");

    const credential =
      provider.credential({
        idToken:
          appleCredential.identityToken,
        rawNonce,
      });

    await signInWithCredential(
      auth,
      credential
    );

    setBiometriaValidada(true);
  }

  async function ativarBiometria() {
    if (!usuario) {
      return false;
    }

    await verificarDisponibilidadeBiometria();

    const hardware =
      await LocalAuthentication.hasHardwareAsync();

    const enrolled =
      await LocalAuthentication.isEnrolledAsync();

    if (!hardware || !enrolled) {
      setBiometriaDisponivel(false);
      return false;
    }

    const resultado =
      await LocalAuthentication.authenticateAsync({
        promptMessage:
          "Ativar login por biometria",
        cancelLabel: "Cancelar",
        fallbackLabel:
          "Usar senha do aparelho",
        disableDeviceFallback: false,
      });

    if (!resultado.success) {
      return false;
    }

    await SecureStore.setItemAsync(
      getBiometriaKey(usuario),
      "true"
    );

    setBiometriaAtiva(true);
    setBiometriaValidada(true);

    return true;
  }

  async function desativarBiometria() {
    if (!usuario) {
      return;
    }

    await SecureStore.deleteItemAsync(
      getBiometriaKey(usuario)
    );

    setBiometriaAtiva(false);
    setBiometriaValidada(true);
  }

  async function verificarBiometria() {
    if (!usuario || !biometriaAtiva) {
      setBiometriaValidada(true);
      return true;
    }

    try {
      setVerificandoBiometria(true);

      const resultado =
        await LocalAuthentication.authenticateAsync({
          promptMessage:
            "Entrar no Volante",
          cancelLabel: "Cancelar",
          fallbackLabel:
            "Usar senha do aparelho",
          disableDeviceFallback: false,
        });

      setBiometriaValidada(
        resultado.success
      );

      return resultado.success;
    } catch {
      setBiometriaValidada(false);
      return false;
    } finally {
      setVerificandoBiometria(false);
    }
  }

  function liberarBiometria() {
    setBiometriaValidada(true);
  }

  async function logout() {
    try {
      const isGoogle =
        GoogleSignin.getCurrentUser();

      if (isGoogle) {
        await GoogleSignin.signOut();
      }
    } catch {}

    await signOut(auth);

    setUsuario(null);
    setBiometriaValidada(false);
  }

  async function excluirConta() {
    const user = auth.currentUser;

    if (!user) {
      throw new Error(
        "Usuário não encontrado."
      );
    }

    const email =
      user.email?.trim().toLowerCase() || "";

    try {
      if (email) {
        await deleteDoc(
          doc(db, "usuarios", email)
        );
      }

      await SecureStore.deleteItemAsync(
        getBiometriaKey(user)
      );

      await deleteUser(user);

      setUsuario(null);
      setBiometriaAtiva(false);
      setBiometriaValidada(false);
    } catch (error) {
      throw error;
    }
  }

  const isAdmin =
    usuario?.email
      ?.trim()
      .toLowerCase() ===
    "admin@clube.com";

  return (
    <AuthContext.Provider
      value={{
        usuario,
        carregando,
        isAdmin,
        biometriaDisponivel,
        biometriaAtiva,
        verificandoBiometria,
        biometriaValidada,
        expoPushToken,
        login,
        cadastrar,
        loginGoogle,
        loginApple,
        logout,
        excluirConta,
        resetarSenha,
        ativarBiometria,
        desativarBiometria,
        verificarBiometria,
        liberarBiometria,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}