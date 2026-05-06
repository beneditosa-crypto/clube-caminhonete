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

import * as ImagePicker from "expo-image-picker";

import { router, useLocalSearchParams } from "expo-router";

import { onAuthStateChanged, User } from "firebase/auth";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import PoliticaAnuncio from "../components/publicar/PoliticaAnuncio";

import { auth, db, storage } from "../services/firebase";
import { colors } from "../utils/theme";

type Estado = {
  id: number;
  sigla: string;
  nome: string;
};

type Cidade = {
  id: number;
  nome: string;
};

export default function Publicar() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [usuario, setUsuario] = useState<User | null>(null);

  const [carregandoUsuario, setCarregandoUsuario] = useState(true);
  const [carregandoPolitica, setCarregandoPolitica] = useState(true);

  const [politicaAceita, setPoliticaAceita] = useState(false);

  const [salvando, setSalvando] = useState(false);

  const [titulo, setTitulo] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [ano, setAno] = useState("");
  const [preco, setPreco] = useState("");
  const [descricao, setDescricao] = useState("");
  const [telefone, setTelefone] = useState("");

  const [estado, setEstado] = useState("");
  const [cidade, setCidade] = useState("");

  const [estados, setEstados] = useState<Estado[]>([]);
  const [cidades, setCidades] = useState<Cidade[]>([]);

  const [mostrarEstados, setMostrarEstados] = useState(false);
  const [mostrarCidades, setMostrarCidades] = useState(false);

  const [fotos, setFotos] = useState<string[]>([]);

  const editando = Boolean(id);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUsuario(user);
      setCarregandoUsuario(false);

      if (user) {
        await verificarPolitica(user.uid);
      } else {
        setCarregandoPolitica(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    buscarEstados();
  }, []);

  useEffect(() => {
    if (id) {
      carregarAnuncioParaEditar(id);
    }
  }, [id]);

  useEffect(() => {
    if (!carregandoUsuario && !usuario) {
      router.replace("/login");
    }
  }, [usuario, carregandoUsuario]);

  async function verificarPolitica(uid: string) {
    try {
      setCarregandoPolitica(true);

      const refUsuario = doc(db, "usuarios", uid);

      const snap = await getDoc(refUsuario);

      setPoliticaAceita(
        snap.exists() && snap.data().politicaAnuncioAceita === true
      );
    } catch {
      setPoliticaAceita(false);
    } finally {
      setCarregandoPolitica(false);
    }
  }

  async function aceitarPolitica() {
    if (!usuario) return;

    try {
      await setDoc(
        doc(db, "usuarios", usuario.uid),
        {
          uid: usuario.uid,
          email: usuario.email || "",
          politicaAnuncioAceita: true,
          politicaAnuncioAceitaEm: serverTimestamp(),
          atualizadoEm: serverTimestamp(),
        },
        { merge: true }
      );

      setPoliticaAceita(true);

      Alert.alert(
        "Política aceita",
        "Agora você já pode publicar anúncios."
      );
    } catch (error: any) {
      console.log("ERRO POLÍTICA:", error);

      Alert.alert(
        "Erro",
        error?.message || "Não foi possível registrar o aceite da política."
      );
    }
  }

  async function buscarEstados() {
    try {
      const resposta = await fetch(
        "https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome"
      );

      const dados = await resposta.json();

      setEstados(dados);
    } catch {
      Alert.alert("Erro", "Não foi possível carregar os estados.");
    }
  }

  async function buscarCidades(siglaEstado: string) {
    try {
      setCidade("");
      setCidades([]);

      const resposta = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${siglaEstado}/municipios?orderBy=nome`
      );

      const dados = await resposta.json();

      setCidades(dados);
    } catch {
      Alert.alert("Erro", "Não foi possível carregar as cidades.");
    }
  }

  async function carregarAnuncioParaEditar(anuncioId: string) {
    try {
      const refAnuncio = doc(db, "anuncios", anuncioId);

      const snap = await getDoc(refAnuncio);

      if (!snap.exists()) {
        Alert.alert("Aviso", "Anúncio não encontrado.");
        router.back();
        return;
      }

      const dados = snap.data();

      setTitulo(dados.titulo || "");
      setMarca(dados.marca || "");
      setModelo(dados.modelo || "");
      setAno(dados.ano ? String(dados.ano) : "");
      setPreco(formatarPrecoTexto(String(dados.preco || "")));
      setDescricao(dados.descricao || "");
      setTelefone(dados.telefone || "");
      setEstado(dados.estado || "");
      setCidade(dados.cidade || "");

      setFotos(Array.isArray(dados.fotos) ? dados.fotos : []);

      if (dados.estado) {
        buscarCidades(dados.estado);
      }
    } catch {
      Alert.alert("Erro", "Não foi possível carregar o anúncio.");
    }
  }

  function formatarPrecoTexto(valor: string) {
    const apenasNumeros = valor.replace(/\D/g, "");

    if (!apenasNumeros) return "";

    const numero = Number(apenasNumeros) / 100;

    return numero.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function alterarPreco(valor: string) {
    setPreco(formatarPrecoTexto(valor));
  }

  function precoParaNumero(valor: string) {
    const apenasNumeros = valor.replace(/\D/g, "");

    return Number(apenasNumeros) / 100;
  }

  async function escolherFotos() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissao.granted) {
      Alert.alert(
        "Permissão necessária",
        "Autorize o acesso às fotos para escolher imagens."
      );

      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 8,
    });

    if (resultado.canceled) return;

    const novasFotos = resultado.assets.map((asset) => asset.uri);

    setFotos((atual) => {
      const combinadas = [...atual, ...novasFotos];

      return combinadas.slice(0, 8);
    });
  }

  function removerFoto(index: number) {
    setFotos((atual) => atual.filter((_, i) => i !== index));
  }

  async function subirFotosParaStorage() {
    if (!usuario) {
      throw new Error("Usuário não autenticado.");
    }

    const urls: string[] = [];

    for (let i = 0; i < fotos.length; i++) {
      const foto = fotos[i];

      if (foto.startsWith("http")) {
        urls.push(foto);
        continue;
      }

      const resposta = await fetch(foto);

      const blob = await resposta.blob();

      const nomeArquivo = `anuncios/${usuario.uid}/${Date.now()}_${i}.jpg`;

      const storageRef = ref(storage, nomeArquivo);

      await uploadBytes(storageRef, blob);

      const url = await getDownloadURL(storageRef);

      urls.push(url);
    }

    return urls;
  }

  function validarCampos() {
    const anoNumero = Number(ano);

    const anoAtual = new Date().getFullYear();

    if (!usuario) {
      Alert.alert(
        "Login necessário",
        "Faça login para publicar um anúncio."
      );

      router.push("/login");

      return false;
    }

    if (!titulo.trim()) {
      Alert.alert("Atenção", "Informe o título do anúncio.");
      return false;
    }

    if (!marca.trim()) {
      Alert.alert("Atenção", "Informe a marca.");
      return false;
    }

    if (!modelo.trim()) {
      Alert.alert("Atenção", "Informe o modelo.");
      return false;
    }

    if (!ano || ano.length !== 4 || Number.isNaN(anoNumero)) {
      Alert.alert(
        "Atenção",
        "Informe o ano de fabricação com 4 dígitos."
      );

      return false;
    }

    if (anoAtual - anoNumero < 25) {
      Alert.alert(
        "Atenção",
        "Para anunciar, o veículo precisa ter pelo menos 25 anos."
      );

      return false;
    }

    if (!preco || precoParaNumero(preco) <= 0) {
      Alert.alert("Atenção", "Informe o valor do veículo.");
      return false;
    }

    if (!descricao.trim()) {
      Alert.alert("Atenção", "Informe a descrição do veículo.");
      return false;
    }

    if (fotos.length === 0) {
      Alert.alert(
        "Atenção",
        "Adicione pelo menos uma foto válida."
      );

      return false;
    }

    if (!estado) {
      Alert.alert("Atenção", "Selecione o estado.");
      return false;
    }

    if (!cidade) {
      Alert.alert("Atenção", "Selecione a cidade.");
      return false;
    }

    if (!telefone.trim()) {
      Alert.alert("Atenção", "Informe o telefone.");
      return false;
    }

    return true;
  }

  async function salvarAnuncio() {
    if (!validarCampos()) return;

    try {
      setSalvando(true);

      const fotosUpload = await subirFotosParaStorage();

      const dadosAnuncio = {
        titulo: titulo.trim(),
        marca: marca.trim(),
        modelo: modelo.trim(),
        ano: Number(ano),
        preco: precoParaNumero(preco),
        descricao: descricao.trim(),
        fotos: fotosUpload,
        estado,
        cidade,
        telefone: telefone.trim(),

        status: "PENDENTE",

        motivoPendencia: "",

        atualizadoEm: serverTimestamp(),

        usuarioId: usuario?.uid,
        usuarioEmail: usuario?.email,
      };

      if (editando && id) {
        await updateDoc(doc(db, "anuncios", id), {
          ...dadosAnuncio,
          editadoEm: serverTimestamp(),
        });

        Alert.alert(
          "Anúncio enviado",
          "Seu anúncio voltou para análise."
        );
      } else {
        await addDoc(collection(db, "anuncios"), {
          ...dadosAnuncio,
          criadoEm: serverTimestamp(),
        });

        Alert.alert(
          "Anúncio enviado",
          "Seu anúncio foi enviado para análise."
        );
      }

      router.replace("/anuncios");
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error?.message || "Não foi possível salvar o anúncio."
      );
    } finally {
      setSalvando(false);
    }
  }

  if (carregandoUsuario || carregandoPolitica) {
    return (
      <View style={styles.centralizado}>
        <Text style={styles.carregando}>Carregando...</Text>
      </View>
    );
  }

  if (!usuario) return null;

  if (!politicaAceita) {
    return <PoliticaAnuncio onAceitar={aceitarPolitica} />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.conteudo}>
        <Text style={styles.titulo}>
          {editando ? "Editar anúncio" : "Publicar anúncio"}
        </Text>

        <Text style={styles.subtitulo}>
          Veículos com 25 anos ou mais serão enviados para análise.
        </Text>

        <View style={styles.bloco}>
          <Text style={styles.blocoTitulo}>DADOS DO VEÍCULO</Text>

          <TextInput
            style={styles.input}
            placeholder="Título"
            placeholderTextColor={colors.iconMuted}
            value={titulo}
            onChangeText={setTitulo}
          />

          <TextInput
            style={styles.input}
            placeholder="Marca"
            placeholderTextColor={colors.iconMuted}
            value={marca}
            onChangeText={setMarca}
          />

          <TextInput
            style={styles.input}
            placeholder="Modelo"
            placeholderTextColor={colors.iconMuted}
            value={modelo}
            onChangeText={setModelo}
          />

          <TextInput
            style={styles.input}
            placeholder="Ano de fabricação"
            placeholderTextColor={colors.iconMuted}
            value={ano}
            onChangeText={(texto) =>
              setAno(texto.replace(/\D/g, "").slice(0, 4))
            }
            keyboardType="numeric"
            maxLength={4}
          />

          <TextInput
            style={styles.input}
            placeholder="Valor"
            placeholderTextColor={colors.iconMuted}
            value={preco}
            onChangeText={alterarPreco}
            keyboardType="numeric"
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Descrição"
            placeholderTextColor={colors.iconMuted}
            value={descricao}
            onChangeText={setDescricao}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.bloco}>
          <Text style={styles.blocoTitulo}>FOTOS</Text>

          <TouchableOpacity
            style={styles.botaoFoto}
            onPress={escolherFotos}
          >
            <Text style={styles.textoBotaoFoto}>
              Adicionar fotos
            </Text>
          </TouchableOpacity>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {fotos.map((foto, index) => (
              <View
                key={`${foto}-${index}`}
                style={styles.fotoBox}
              >
                <Image
                  source={{ uri: foto }}
                  style={styles.foto}
                />

                <TouchableOpacity
                  style={styles.removerFoto}
                  onPress={() => removerFoto(index)}
                >
                  <Text style={styles.removerFotoTexto}>
                    X
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.bloco}>
          <Text style={styles.blocoTitulo}>LOCALIZAÇÃO</Text>

          <TouchableOpacity
            style={styles.select}
            onPress={() =>
              setMostrarEstados(!mostrarEstados)
            }
          >
            <Text
              style={
                estado
                  ? styles.selectTexto
                  : styles.placeholder
              }
            >
              {estado || "Estado"}
            </Text>
          </TouchableOpacity>

          {mostrarEstados && (
            <View style={styles.lista}>
              {estados.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.itemLista}
                  onPress={() => {
                    setEstado(item.sigla);

                    setMostrarEstados(false);

                    buscarCidades(item.sigla);
                  }}
                >
                  <Text style={styles.itemTexto}>
                    {item.nome} - {item.sigla}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.select}
            onPress={() => {
              if (!estado) {
                Alert.alert(
                  "Atenção",
                  "Selecione primeiro o estado."
                );

                return;
              }

              setMostrarCidades(!mostrarCidades);
            }}
          >
            <Text
              style={
                cidade
                  ? styles.selectTexto
                  : styles.placeholder
              }
            >
              {cidade || "Cidade"}
            </Text>
          </TouchableOpacity>

          {mostrarCidades && (
            <View style={styles.lista}>
              {cidades.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.itemLista}
                  onPress={() => {
                    setCidade(item.nome);

                    setMostrarCidades(false);
                  }}
                >
                  <Text style={styles.itemTexto}>
                    {item.nome}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.bloco}>
          <Text style={styles.blocoTitulo}>CONTATO</Text>

          <TextInput
            style={styles.input}
            placeholder="Telefone"
            placeholderTextColor={colors.iconMuted}
            value={telefone}
            onChangeText={setTelefone}
            keyboardType="phone-pad"
          />
        </View>

        <TouchableOpacity
          style={[
            styles.botaoPrimario,
            salvando && styles.botaoDesativado,
          ]}
          onPress={salvarAnuncio}
          disabled={salvando}
        >
          <Text style={styles.textoBotao}>
            {salvando
              ? "Salvando anúncio..."
              : editando
              ? "Salvar alterações"
              : "Enviar para análise"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botaoSecundario}
          onPress={() => router.back()}
        >
          <Text style={styles.textoBotaoSecundario}>
            Cancelar
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
    padding: 20,
    paddingBottom: 120,
  },

  centralizado: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  carregando: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "700",
  },

  titulo: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.text,
    marginBottom: 8,
  },

  subtitulo: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 20,
    lineHeight: 20,
    fontWeight: "600",
  },

  bloco: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },

  blocoTitulo: {
    fontSize: 17,
    fontWeight: "900",
    color: colors.text,
    marginBottom: 14,
  },

  input: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },

  textArea: {
    height: 120,
  },

  select: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },

  selectTexto: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },

  placeholder: {
    color: colors.iconMuted,
    fontSize: 15,
  },

  lista: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    maxHeight: 220,
  },

  itemLista: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  itemTexto: {
    color: colors.text,
    fontSize: 15,
  },

  botaoFoto: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 14,
  },

  textoBotaoFoto: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  fotoBox: {
    width: 120,
    height: 90,
    marginRight: 10,
    marginBottom: 4,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
  },

  foto: {
    width: "100%",
    height: "100%",
  },

  removerFoto: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },

  removerFotoTexto: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  botaoPrimario: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },

  botaoDesativado: {
    opacity: 0.6,
  },

  textoBotao: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  botaoSecundario: {
    paddingVertical: 16,
    alignItems: "center",
  },

  textoBotaoSecundario: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: "800",
  },
});