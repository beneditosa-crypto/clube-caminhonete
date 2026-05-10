import { useEffect, useState } from "react";

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
        buscarCidades(dados.estado);
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

  async function buscarCidades(sigla: string) {
    try {
      setCidade("");
      setCidades([]);

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
        <View style={styles.cabecalho}>
          <Text style={styles.titulo}>
            {editando ? "Editar evento" : "Cadastrar evento"}
          </Text>

          <Text style={styles.subtitulo}>
            Eventos enviados passam por análise antes de aparecerem no Volante.
          </Text>
        </View>

        <View style={styles.bloco}>
          <Text style={styles.blocoTitulo}>Dados do evento</Text>

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

          <View style={styles.linha}>
            <TouchableOpacity
              style={[styles.select, styles.inputLinha]}
              onPress={() => setPickerAtivo("dataInicio")}
            >
              <Text
                style={dataInicio ? styles.selectTexto : styles.placeholder}
                numberOfLines={1}
              >
                {dataInicio
                  ? `Início: ${formatarDataBR(dataInicio)}`
                  : "Data início"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.select, styles.inputLinha]}
              onPress={() => setPickerAtivo("dataFim")}
            >
              <Text
                style={dataFim ? styles.selectTexto : styles.placeholder}
                numberOfLines={1}
              >
                {dataFim ? `Fim: ${formatarDataBR(dataFim)}` : "Data fim"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.switchLinha}>
            <Text style={styles.switchTexto}>Dia inteiro</Text>

            <Switch value={diaInteiro} onValueChange={setDiaInteiro} />
          </View>

          {!diaInteiro && (
            <View style={styles.linha}>
              <TouchableOpacity
                style={[styles.select, styles.inputLinha]}
                onPress={() => setPickerAtivo("horaInicio")}
              >
                <Text
                  style={horaInicio ? styles.selectTexto : styles.placeholder}
                  numberOfLines={1}
                >
                  {horaInicio
                    ? `Início: ${formatarHora(horaInicio)}`
                    : "Hora início"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.select, styles.inputLinha]}
                onPress={() => setPickerAtivo("horaFim")}
              >
                <Text
                  style={horaFim ? styles.selectTexto : styles.placeholder}
                  numberOfLines={1}
                >
                  {horaFim ? `Fim: ${formatarHora(horaFim)}` : "Hora fim"}
                </Text>
              </TouchableOpacity>
            </View>
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
          <Text style={styles.blocoTitulo}>Localização</Text>

          <View style={styles.linha}>
            <TouchableOpacity
              style={[styles.select, styles.inputLinha]}
              onPress={() => setModalEstado(true)}
            >
              <Text
                style={estado ? styles.selectTexto : styles.placeholder}
                numberOfLines={1}
              >
                {estado || "Estado"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.select, styles.inputLinha]}
              onPress={() => {
                if (!estado) {
                  Alert.alert("Atenção", "Selecione primeiro o estado.");
                  return;
                }

                setModalCidade(true);
              }}
            >
              <Text
                style={cidade ? styles.selectTexto : styles.placeholder}
                numberOfLines={1}
              >
                {cidade || "Cidade"}
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Local do evento"
            placeholderTextColor={colors.iconMuted}
            value={local}
            onChangeText={setLocal}
          />
        </View>

        <View style={styles.bloco}>
          <View style={styles.blocoHeader}>
            <Text style={styles.blocoTitulo}>Fotos</Text>
            <Text style={styles.contadorFotos}>{fotos.length}/6</Text>
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

          <ScrollView showsVerticalScrollIndicator={false}>
            {estados.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.itemLista}
                onPress={() => {
                  setEstado(item.sigla);
                  setModalEstado(false);
                  buscarCidades(item.sigla);
                }}
              >
                <Text style={styles.itemTexto}>
                  {item.nome} - {item.sigla}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.botaoFecharModal}
            onPress={() => setModalEstado(false)}
          >
            <Text style={styles.textoFecharModal}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal visible={modalCidade} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitulo}>Selecionar cidade</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {cidades.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.itemLista}
                onPress={() => {
                  setCidade(item.nome);
                  setModalCidade(false);
                }}
              >
                <Text style={styles.itemTexto}>{item.nome}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.botaoFecharModal}
            onPress={() => setModalCidade(false)}
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

  textArea: {
    height: 82,
    paddingTop: 10,
  },

  switchLinha: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 8,
    minHeight: 42,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  switchTexto: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "700",
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

  pickerIosFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  botaoFecharPicker: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
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