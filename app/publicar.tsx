import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
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
  updateDoc,
} from "firebase/firestore";

import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

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

  const [modalEstado, setModalEstado] = useState(false);
  const [modalCidade, setModalCidade] = useState(false);

  const [buscaEstado, setBuscaEstado] = useState("");
  const [buscaCidade, setBuscaCidade] = useState("");

  const [fotos, setFotos] = useState<string[]>([]);

  const editando = Boolean(id);

  const estadosFiltrados = useMemo(() => {
    const termo = buscaEstado.trim().toLowerCase();

    if (!termo) return estados;

    return estados.filter((item) =>
      `${item.nome} ${item.sigla}`.toLowerCase().includes(termo)
    );
  }, [buscaEstado, estados]);

  const cidadesFiltradas = useMemo(() => {
    const termo = buscaCidade.trim().toLowerCase();

    if (!termo) return cidades;

    return cidades.filter((item) =>
      item.nome.toLowerCase().includes(termo)
    );
  }, [buscaCidade, cidades]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      setCarregandoUsuario(false);
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

  async function buscarCidades(siglaEstado: string, limparCidade = true) {
    try {
      if (limparCidade) {
        setCidade("");
      }

      setCidades([]);
      setBuscaCidade("");

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
      setPreco(formatarPrecoBanco(dados.preco));
      setDescricao(dados.descricao || "");
      setTelefone(dados.telefone || "");
      setEstado(dados.estado || "");
      setCidade(dados.cidade || "");
      setFotos(Array.isArray(dados.fotos) ? dados.fotos : []);

      if (dados.estado) {
        buscarCidades(dados.estado, false);
      }
    } catch {
      Alert.alert("Erro", "Não foi possível carregar o anúncio.");
    }
  }

  function formatarPrecoBanco(valor: any) {
    if (valor === undefined || valor === null || valor === "") return "";

    if (typeof valor === "number") {
      return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
    }

    const texto = String(valor).trim();

    if (!texto) return "";

    if (texto.startsWith("R$")) {
      return texto;
    }

    const numero = Number(texto.replace(/\./g, "").replace(",", "."));

    if (!Number.isNaN(numero)) {
      return numero.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
    }

    return "";
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
      Alert.alert("Login necessário", "Faça login para publicar um anúncio.");
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
      Alert.alert("Atenção", "Informe o ano de fabricação com 4 dígitos.");
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
      Alert.alert("Atenção", "Adicione pelo menos uma foto válida.");
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
        destaque: false,
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

        Alert.alert("Anúncio enviado", "Seu anúncio voltou para análise.");
      } else {
        await addDoc(collection(db, "anuncios"), {
          ...dadosAnuncio,
          criadoEm: serverTimestamp(),
        });

        Alert.alert("Anúncio enviado", "Seu anúncio foi enviado para análise.");
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

  if (carregandoUsuario) {
    return (
      <View style={styles.centralizado}>
        <Text style={styles.carregando}>Carregando...</Text>
      </View>
    );
  }

  if (!usuario) return null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.conteudo}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cabecalho}>
          <Text style={styles.titulo}>
            {editando ? "Editar anúncio" : "Publicar anúncio"}
          </Text>

          <Text style={styles.subtitulo}>
            Veículos com 25 anos ou mais serão enviados para análise.
          </Text>
        </View>

        <View style={styles.bloco}>
          <Text style={styles.blocoTitulo}>Dados do veículo</Text>

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

          <View style={styles.linha}>
            <TextInput
              style={[styles.input, styles.inputLinha]}
              placeholder="Ano"
              placeholderTextColor={colors.iconMuted}
              value={ano}
              onChangeText={(texto) =>
                setAno(texto.replace(/\D/g, "").slice(0, 4))
              }
              keyboardType="numeric"
              maxLength={4}
            />

            <TextInput
              style={[styles.input, styles.inputLinha]}
              placeholder="Valor"
              placeholderTextColor={colors.iconMuted}
              value={preco}
              onChangeText={alterarPreco}
              keyboardType="numeric"
            />
          </View>

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
          <View style={styles.blocoHeader}>
            <Text style={styles.blocoTitulo}>Fotos</Text>
            <Text style={styles.contadorFotos}>{fotos.length}/8</Text>
          </View>

          <TouchableOpacity style={styles.botaoFoto} onPress={escolherFotos}>
            <Text style={styles.textoBotaoFoto}>Adicionar fotos</Text>
          </TouchableOpacity>

          {fotos.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {fotos.map((foto, index) => (
                <View key={`${foto}-${index}`} style={styles.fotoBox}>
                  <Image source={{ uri: foto }} style={styles.foto} />

                  <TouchableOpacity
                    style={styles.removerFoto}
                    onPress={() => removerFoto(index)}
                  >
                    <Text style={styles.removerFotoTexto}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.bloco}>
          <Text style={styles.blocoTitulo}>Localização</Text>

          <TouchableOpacity
            style={styles.select}
            onPress={() => {
              setBuscaEstado("");
              setModalEstado(true);
            }}
          >
            <Text style={estado ? styles.selectTexto : styles.placeholder}>
              {estado || "Selecionar estado"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.select}
            onPress={() => {
              if (!estado) {
                Alert.alert("Atenção", "Selecione primeiro o estado.");
                return;
              }

              setBuscaCidade("");
              setModalCidade(true);
            }}
          >
            <Text style={cidade ? styles.selectTexto : styles.placeholder}>
              {cidade || "Selecionar cidade"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bloco}>
          <Text style={styles.blocoTitulo}>Contato</Text>

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
          style={[styles.botaoPrimario, salvando && styles.botaoDesativado]}
          onPress={salvarAnuncio}
          disabled={salvando}
        >
          <Text style={styles.textoBotao}>
            {salvando
              ? "Salvando..."
              : editando
              ? "Salvar alterações"
              : "Enviar para análise"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botaoSecundario}
          onPress={() => router.back()}
        >
          <Text style={styles.textoBotaoSecundario}>Cancelar</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={modalEstado} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitulo}>Selecionar estado</Text>

          <TextInput
            style={styles.inputBuscaModal}
            placeholder="Buscar estado..."
            placeholderTextColor={colors.iconMuted}
            value={buscaEstado}
            onChangeText={setBuscaEstado}
            autoCapitalize="words"
          />

          <ScrollView showsVerticalScrollIndicator={false}>
            {estadosFiltrados.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.itemLista}
                onPress={() => {
                  setEstado(item.sigla);
                  setModalEstado(false);
                  setBuscaEstado("");
                  buscarCidades(item.sigla);
                }}
              >
                <Text style={styles.itemTexto}>
                  {item.nome} - {item.sigla}
                </Text>
              </TouchableOpacity>
            ))}

            {estadosFiltrados.length === 0 && (
              <Text style={styles.textoVazioModal}>
                Nenhum estado encontrado.
              </Text>
            )}
          </ScrollView>

          <TouchableOpacity
            style={styles.botaoFecharModal}
            onPress={() => {
              setModalEstado(false);
              setBuscaEstado("");
            }}
          >
            <Text style={styles.textoFecharModal}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal visible={modalCidade} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitulo}>Selecionar cidade</Text>

          <TextInput
            style={styles.inputBuscaModal}
            placeholder="Buscar cidade..."
            placeholderTextColor={colors.iconMuted}
            value={buscaCidade}
            onChangeText={setBuscaCidade}
            autoCapitalize="words"
          />

          <ScrollView showsVerticalScrollIndicator={false}>
            {cidadesFiltradas.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.itemLista}
                onPress={() => {
                  setCidade(item.nome);
                  setModalCidade(false);
                  setBuscaCidade("");
                }}
              >
                <Text style={styles.itemTexto}>{item.nome}</Text>
              </TouchableOpacity>
            ))}

            {cidadesFiltradas.length === 0 && (
              <Text style={styles.textoVazioModal}>
                Nenhuma cidade encontrada.
              </Text>
            )}
          </ScrollView>

          <TouchableOpacity
            style={styles.botaoFecharModal}
            onPress={() => {
              setModalCidade(false);
              setBuscaCidade("");
            }}
          >
            <Text style={styles.textoFecharModal}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  conteudo: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 96,
  },

  centralizado: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  carregando: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "700",
  },

  cabecalho: {
    marginBottom: 12,
  },

  titulo: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.text,
    marginBottom: 4,
  },

  subtitulo: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
    fontWeight: "600",
  },

  bloco: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },

  blocoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  blocoTitulo: {
    fontSize: 13,
    fontWeight: "900",
    color: colors.text,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  contadorFotos: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "800",
    marginBottom: 10,
  },

  linha: {
    flexDirection: "row",
    gap: 8,
  },

  inputLinha: {
    flex: 1,
  },

  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 10,
    minHeight: 42,
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    fontWeight: "600",
  },

  inputBuscaModal: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 10,
    minHeight: 44,
    fontSize: 14,
    color: colors.text,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    fontWeight: "700",
  },

  textArea: {
    height: 86,
    paddingTop: 10,
  },

  select: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 10,
    minHeight: 42,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
  },

  selectTexto: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },

  placeholder: {
    color: colors.iconMuted,
    fontSize: 14,
    fontWeight: "600",
  },

  botaoFoto: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
    marginBottom: 10,
  },

  textoBotaoFoto: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  fotoBox: {
    width: 92,
    height: 68,
    marginRight: 8,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
  },

  foto: {
    width: "100%",
    height: "100%",
  },

  removerFoto: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },

  removerFotoTexto: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 18,
    fontWeight: "900",
  },

  botaoPrimario: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 4,
  },

  botaoDesativado: {
    opacity: 0.6,
  },

  textoBotao: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  botaoSecundario: {
    paddingVertical: 13,
    alignItems: "center",
  },

  textoBotaoSecundario: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "800",
  },

  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 42,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  modalTitulo: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.text,
    marginBottom: 12,
  },

  itemLista: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  itemTexto: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },

  textoVazioModal: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },

  botaoFecharModal: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 14,
  },

  textoFecharModal: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
});