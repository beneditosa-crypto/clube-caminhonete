import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { useAuth } from "../contexts/AuthContext";
import { db, storage } from "../services/firebase";
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

type PickerAtivo = "dataInicio" | "dataFim" | "horaInicio" | "horaFim" | null;

export default function PublicarEvento() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  const editando = Boolean(id);
  const { usuario, carregando } = useAuth();

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");

  const [dataInicio, setDataInicio] = useState<Date | null>(null);
  const [dataFim, setDataFim] = useState<Date | null>(null);

  const [diaInteiro, setDiaInteiro] = useState(true);

  const [horaInicio, setHoraInicio] = useState<Date | null>(null);
  const [horaFim, setHoraFim] = useState<Date | null>(null);

  const [pickerAtivo, setPickerAtivo] = useState<PickerAtivo>(null);

  const [linkEvento, setLinkEvento] = useState("");
  const [local, setLocal] = useState("");

  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");

  const [fotos, setFotos] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  const [estados, setEstados] = useState<Estado[]>([]);
  const [cidades, setCidades] = useState<Cidade[]>([]);

  const [modalEstado, setModalEstado] = useState(false);
  const [modalCidade, setModalCidade] = useState(false);

  const [buscaEstado, setBuscaEstado] = useState("");
  const [buscaCidade, setBuscaCidade] = useState("");

  const estadosFiltrados = useMemo(() => {
    const termo = buscaEstado.trim().toLowerCase();

    if (!termo) return estados;

    return estados.filter((item) => {
      const texto = `${item.nome} ${item.sigla}`.toLowerCase();

      return texto.includes(termo);
    });
  }, [estados, buscaEstado]);

  const cidadesFiltradas = useMemo(() => {
    const termo = buscaCidade.trim().toLowerCase();

    if (!termo) return cidades;

    return cidades.filter((item) =>
      item.nome.toLowerCase().includes(termo)
    );
  }, [cidades, buscaCidade]);

  useEffect(() => {
    if (!carregando && !usuario) {
      router.replace("/login");
    }
  }, [usuario, carregando]);

  useEffect(() => {
    buscarEstados();
  }, []);

  useEffect(() => {
    if (id) {
      carregarEvento();
    }
  }, [id]);

  function criarDataDeTexto(valor?: string) {
    if (!valor) return null;

    const partes = valor.split("-");

    if (partes.length === 3) {
      const ano = Number(partes[0]);
      const mes = Number(partes[1]) - 1;
      const dia = Number(partes[2]);

      const data = new Date(ano, mes, dia);

      if (!Number.isNaN(data.getTime())) return data;
    }

    const tentativa = new Date(valor);

    return Number.isNaN(tentativa.getTime()) ? null : tentativa;
  }

  function criarHoraDeTexto(valor?: string) {
    if (!valor) return null;

    const partes = valor.split(":");

    if (partes.length < 2) return null;

    const data = new Date();

    data.setHours(Number(partes[0]));
    data.setMinutes(Number(partes[1]));
    data.setSeconds(0);
    data.setMilliseconds(0);

    return Number.isNaN(data.getTime()) ? null : data;
  }

  function formatarDataBR(data: Date | null) {
    if (!data) return "";

    return data.toLocaleDateString("pt-BR");
  }

  function formatarDataISO(data: Date | null) {
    if (!data) return "";

    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }

  function formatarHora(data: Date | null) {
    if (!data) return "";

    const hora = String(data.getHours()).padStart(2, "0");
    const minuto = String(data.getMinutes()).padStart(2, "0");

    return `${hora}:${minuto}`;
  }

  function obterValorPicker() {
    if (pickerAtivo === "dataInicio") return dataInicio || new Date();
    if (pickerAtivo === "dataFim") return dataFim || dataInicio || new Date();
    if (pickerAtivo === "horaInicio") return horaInicio || new Date();
    if (pickerAtivo === "horaFim") return horaFim || horaInicio || new Date();

    return new Date();
  }

  function obterModoPicker() {
    if (pickerAtivo === "horaInicio" || pickerAtivo === "horaFim") {
      return "time";
    }

    return "date";
  }

  function alterarPicker(event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS === "android") {
      setPickerAtivo(null);
    }

    if (event.type === "dismissed" || !selectedDate) return;

    if (pickerAtivo === "dataInicio") {
      setDataInicio(selectedDate);

      if (!dataFim) {
        setDataFim(selectedDate);
      }
    }

    if (pickerAtivo === "dataFim") {
      setDataFim(selectedDate);
    }

    if (pickerAtivo === "horaInicio") {
      setHoraInicio(selectedDate);
    }

    if (pickerAtivo === "horaFim") {
      setHoraFim(selectedDate);
    }
  }

  async function carregarEvento() {
    try {
      const refEvento = doc(db, "eventos", id as string);
      const snap = await getDoc(refEvento);

      if (!snap.exists()) {
        Alert.alert("Evento não encontrado");
        router.back();
        return;
      }

      const dados = snap.data();

      setTitulo(dados.titulo || "");
      setDescricao(dados.descricao || "");

      setDataInicio(criarDataDeTexto(dados.dataInicio || dados.data || ""));
      setDataFim(criarDataDeTexto(dados.dataFim || dados.data || ""));

      setDiaInteiro(dados.diaInteiro !== false);

      setHoraInicio(criarHoraDeTexto(dados.horaInicio || ""));
      setHoraFim(criarHoraDeTexto(dados.horaFim || ""));

      setLinkEvento(dados.linkEvento || dados.link || "");
      setLocal(dados.local || "");

      setCidade(dados.cidade || "");
      setEstado(dados.estado || "");

      setFotos(Array.isArray(dados.fotos) ? dados.fotos : []);

      if (dados.estado) {
        buscarCidades(dados.estado, false);
      }
    } catch {
      Alert.alert("Erro", "Não foi possível carregar o evento.");
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

  async function buscarCidades(sigla: string, limparCidade = true) {
    try {
      if (limparCidade) {
        setCidade("");
      }

      setCidades([]);
      setBuscaCidade("");

      const resposta = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${sigla}/municipios?orderBy=nome`
      );

      const dados = await resposta.json();

      setCidades(dados);
    } catch {
      Alert.alert("Erro", "Não foi possível carregar as cidades.");
    }
  }

  async function escolherFotos() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissao.granted) {
      Alert.alert("Permissão necessária", "Autorize o acesso às fotos.");
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 6,
      quality: 0.8,
    });

    if (resultado.canceled) return;

    const novasFotos = resultado.assets.map((asset) => asset.uri);

    setFotos((atual) => {
      const combinadas = [...atual, ...novasFotos];
      return combinadas.slice(0, 6);
    });
  }

  function removerFoto(index: number) {
    setFotos((atual) => atual.filter((_, i) => i !== index));
  }

  async function uploadFotos() {
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

      const caminho = `eventos/${usuario.uid}/${Date.now()}_${i}.jpg`;
      const refStorage = ref(storage, caminho);

      await uploadBytes(refStorage, blob);

      const url = await getDownloadURL(refStorage);

      urls.push(url);
    }

    return urls;
  }

  function validarCampos() {
    if (!titulo.trim()) {
      Alert.alert("Atenção", "Informe o título.");
      return false;
    }

    if (!descricao.trim()) {
      Alert.alert("Atenção", "Informe a descrição.");
      return false;
    }

    if (!dataInicio) {
      Alert.alert("Atenção", "Informe a data de início.");
      return false;
    }

    if (!dataFim) {
      Alert.alert("Atenção", "Informe a data de fim.");
      return false;
    }

    if (dataFim.getTime() < dataInicio.getTime()) {
      Alert.alert(
        "Atenção",
        "A data de fim não pode ser anterior à data de início."
      );
      return false;
    }

    if (!diaInteiro) {
      if (!horaInicio) {
        Alert.alert("Atenção", "Informe a hora de início.");
        return false;
      }

      if (!horaFim) {
        Alert.alert("Atenção", "Informe a hora de fim.");
        return false;
      }
    }

    if (!estado) {
      Alert.alert("Atenção", "Selecione o estado.");
      return false;
    }

    if (!cidade) {
      Alert.alert("Atenção", "Selecione a cidade.");
      return false;
    }

    if (!local.trim()) {
      Alert.alert("Atenção", "Informe o local.");
      return false;
    }

    if (fotos.length === 0) {
      Alert.alert("Atenção", "Adicione ao menos uma foto.");
      return false;
    }

    return true;
  }

  async function salvarEvento() {
    if (salvando) return;
    if (!validarCampos()) return;

    try {
      setSalvando(true);

      const fotosUpload = await uploadFotos();

      const dadosEvento = {
        titulo: titulo.trim(),
        descricao: descricao.trim(),

        dataInicio: formatarDataISO(dataInicio),
        dataFim: formatarDataISO(dataFim),

        data: formatarDataBR(dataInicio),

        diaInteiro,

        horaInicio: diaInteiro ? "" : formatarHora(horaInicio),
        horaFim: diaInteiro ? "" : formatarHora(horaFim),

        linkEvento: linkEvento.trim(),
        local: local.trim(),

        cidade,
        estado,

        fotos: fotosUpload,

        status: "PENDENTE",
        motivoPendencia: "",

        usuarioId: usuario?.uid,
        usuarioEmail: usuario?.email,

        atualizadoEm: serverTimestamp(),
      };

      if (editando && id) {
        await updateDoc(doc(db, "eventos", id), dadosEvento);

        Alert.alert("Evento atualizado", "Seu evento voltou para análise.");
      } else {
        await addDoc(collection(db, "eventos"), {
          ...dadosEvento,
          criadoEm: serverTimestamp(),
        });

        Alert.alert("Evento enviado", "Seu evento foi enviado para análise.");
      }

      router.replace("/eventos");
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error?.message || "Não foi possível salvar o evento."
      );
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
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
        <Text style={styles.titulo}>
          {editando ? "Editar evento" : "Cadastrar evento"}
        </Text>

        <Text style={styles.subtitulo}>
          Eventos enviados passam por análise antes de aparecerem no Volante.
        </Text>

        <View style={styles.bloco}>
          <Text style={styles.blocoTitulo}>DADOS DO EVENTO</Text>

          <TextInput
            style={styles.input}
            placeholder="Título"
            placeholderTextColor={colors.iconMuted}
            value={titulo}
            onChangeText={setTitulo}
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

          <TouchableOpacity
            style={styles.select}
            onPress={() => setPickerAtivo("dataInicio")}
          >
            <Text style={dataInicio ? styles.selectTexto : styles.placeholder}>
              {dataInicio
                ? `Data de início: ${formatarDataBR(dataInicio)}`
                : "Selecionar data de início"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.select}
            onPress={() => setPickerAtivo("dataFim")}
          >
            <Text style={dataFim ? styles.selectTexto : styles.placeholder}>
              {dataFim
                ? `Data de fim: ${formatarDataBR(dataFim)}`
                : "Selecionar data de fim"}
            </Text>
          </TouchableOpacity>

          <View style={styles.switchLinha}>
            <Text style={styles.switchTexto}>Evento o dia inteiro</Text>

            <Switch value={diaInteiro} onValueChange={setDiaInteiro} />
          </View>

          {!diaInteiro && (
            <>
              <TouchableOpacity
                style={styles.select}
                onPress={() => setPickerAtivo("horaInicio")}
              >
                <Text
                  style={horaInicio ? styles.selectTexto : styles.placeholder}
                >
                  {horaInicio
                    ? `Hora de início: ${formatarHora(horaInicio)}`
                    : "Selecionar hora de início"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.select}
                onPress={() => setPickerAtivo("horaFim")}
              >
                <Text style={horaFim ? styles.selectTexto : styles.placeholder}>
                  {horaFim
                    ? `Hora de fim: ${formatarHora(horaFim)}`
                    : "Selecionar hora de fim"}
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TextInput
            style={styles.input}
            placeholder="Link do evento (opcional)"
            placeholderTextColor={colors.iconMuted}
            value={linkEvento}
            onChangeText={setLinkEvento}
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

        <View style={styles.bloco}>
          <Text style={styles.blocoTitulo}>LOCALIZAÇÃO</Text>

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

          <TextInput
            style={styles.input}
            placeholder="Local do evento"
            placeholderTextColor={colors.iconMuted}
            value={local}
            onChangeText={setLocal}
          />
        </View>

        <View style={styles.bloco}>
          <Text style={styles.blocoTitulo}>FOTOS</Text>

          <TouchableOpacity style={styles.botaoFoto} onPress={escolherFotos}>
            <Text style={styles.textoBotaoFoto}>Adicionar fotos</Text>
          </TouchableOpacity>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {fotos.map((foto, index) => (
              <View key={`${foto}-${index}`} style={styles.fotoBox}>
                <Image source={{ uri: foto }} style={styles.foto} />

                <TouchableOpacity
                  style={styles.removerFoto}
                  onPress={() => removerFoto(index)}
                >
                  <Text style={styles.removerFotoTexto}>X</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity
          style={[styles.botaoPrimario, salvando && styles.botaoDesativado]}
          onPress={salvarEvento}
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

      {pickerAtivo && (
        <DateTimePicker
          value={obterValorPicker()}
          mode={obterModoPicker()}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={alterarPicker}
        />
      )}

      {Platform.OS === "ios" && pickerAtivo && (
        <View style={styles.pickerIosFooter}>
          <TouchableOpacity
            style={styles.botaoFecharPicker}
            onPress={() => setPickerAtivo(null)}
          >
            <Text style={styles.textoFecharModal}>Concluir</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={modalEstado} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitulo}>Selecionar estado</Text>

          <TextInput
            style={styles.inputBuscaModal}
            placeholder="Buscar estado"
            placeholderTextColor={colors.iconMuted}
            value={buscaEstado}
            onChangeText={setBuscaEstado}
            autoFocus
          />

          <ScrollView showsVerticalScrollIndicator={false}>
            {estadosFiltrados.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.itemLista}
                onPress={() => {
                  setEstado(item.sigla);
                  setCidade("");
                  setBuscaEstado("");
                  setBuscaCidade("");
                  setModalEstado(false);
                  buscarCidades(item.sigla);
                }}
              >
                <Text style={styles.itemTexto}>
                  {item.nome} - {item.sigla}
                </Text>
              </TouchableOpacity>
            ))}

            {estadosFiltrados.length === 0 && (
              <Text style={styles.semResultado}>Nenhum estado encontrado.</Text>
            )}
          </ScrollView>

          <TouchableOpacity
            style={styles.botaoFecharModal}
            onPress={() => {
              setBuscaEstado("");
              setModalEstado(false);
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
            placeholder="Buscar cidade"
            placeholderTextColor={colors.iconMuted}
            value={buscaCidade}
            onChangeText={setBuscaCidade}
            autoFocus
          />

          <ScrollView showsVerticalScrollIndicator={false}>
            {cidadesFiltradas.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.itemLista}
                onPress={() => {
                  setCidade(item.nome);
                  setBuscaCidade("");
                  setModalCidade(false);
                }}
              >
                <Text style={styles.itemTexto}>{item.nome}</Text>
              </TouchableOpacity>
            ))}

            {cidadesFiltradas.length === 0 && (
              <Text style={styles.semResultado}>Nenhuma cidade encontrada.</Text>
            )}
          </ScrollView>

          <TouchableOpacity
            style={styles.botaoFecharModal}
            onPress={() => {
              setBuscaCidade("");
              setModalCidade(false);
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

  inputBuscaModal: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    fontWeight: "600",
  },

  textArea: {
    height: 120,
  },

  switchLinha: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  switchTexto: {
    fontSize: 15,
    color: colors.text,
    fontWeight: "700",
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

  pickerIosFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  botaoFecharPicker: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },

  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  modalTitulo: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.text,
    marginBottom: 16,
  },

  itemLista: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  itemTexto: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },

  semResultado: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 24,
  },

  botaoFecharModal: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },

  textoFecharModal: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
});