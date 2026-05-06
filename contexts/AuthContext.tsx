import { createContext, useContext, useEffect, useState } from "react";

import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { auth } from "../services/firebase";

type AuthContextType = {
  usuario: User | null;
  carregando: boolean;
  isAdmin: boolean;
  login: (email: string, senha: string) => Promise<void>;
  cadastrar: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  usuario: null,
  carregando: true,
  isAdmin: false,
  login: async () => {},
  cadastrar: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      setCarregando(false);
    });

    return unsubscribe;
  }, []);

  async function login(email: string, senha: string) {
    const emailTratado = email.trim().toLowerCase();

    await signInWithEmailAndPassword(auth, emailTratado, senha);
  }

  async function cadastrar(email: string, senha: string) {
    const emailTratado = email.trim().toLowerCase();

    await createUserWithEmailAndPassword(auth, emailTratado, senha);
  }

  async function logout() {
    await signOut(auth);
    setUsuario(null);
  }

  const isAdmin =
    usuario?.email?.trim().toLowerCase() === "admin@clube.com";

  return (
    <AuthContext.Provider
      value={{
        usuario,
        carregando,
        isAdmin,
        login,
        cadastrar,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}