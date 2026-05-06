import { useEffect, useState } from "react";
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
import { router } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { useAuth } from "../contexts/AuthContext";
import { db, storage } from "../services/firebase";

export default function PublicarEvento() {
  const { usuario } = useAuth();

  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [descricao, setDescricao] = useState("");
  const [link, setLink] = useState("");

  const [fotos, setFotos] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  const [estados, setEstados] = useState<any[]>([]);
  const [cidades, setCidades] = useState<any[]>([]);

  const [modalEstado, setModalEstado] = useState(false);
  const [modalCidade, setModalCidade] = useState(false);

  useEffect(() => {
    buscarEstados();
  }, []);

  async function buscarEstados() {
    const res = await fetch(
      "https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome"
    );
    const data = await res.json();
    setEstados(data);
  }

  async function buscarCidades(sigla: string) {
    const res = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${sigla}/municipios`
    );
    const data = await res.json();
    setCidades(data);
  }

  async function escolherFotos() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) return;

    const resultado = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      selectionLimit: 6,
      quality: 0.8,
    });

    if (!resultado.canceled) {
      const novas = resultado.assets.map((a) => a.uri);
      setFotos((prev) => [...prev, ...novas]);
    }
  }

  async function uploadFotos() {
    const urls: string[] = [];

    for (let i = 0; i < fotos.length; i++) {
      const response = await fetch(fotos[i]);
      const blob = await response.blob();

      const caminho = `eventos/${usuario?.uid}/${Date.now()}_${i}.jpg`;
      const refStorage = ref(storage, caminho);

      await uploadBytes(refStorage, blob);
      const url = await getDownloadURL(refStorage);

      urls.push(url);
    }

    return urls;
  }

  async function salvarEvento() {
    if (!titulo || !data || !cidade || !estado || !descricao) {
      Alert.alert("Preencha os campos obrigatórios");
      return;
    }

    try {
      setSalvando(true);

      const fotosUpload = await uploadFotos();

      await addDoc(collection(db, "eventos"), {
        titulo,
        data,
        cidade,
        estado,
        descricao,
        link,
        fotos: fotosUpload,
        status: "PENDENTE",
        usuarioId: usuario?.uid,
        usuarioEmail: usuario?.email,
        criadoEm: serverTimestamp(),
      });

      Alert.alert("Evento enviado");
      router.replace("/");
    } catch (e) {
      console.log(e);
      Alert.alert("Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.conteudo}>
        <Text style={styles.titulo}>Cadastrar evento</Text>

        <TextInput style={styles.input} placeholder="Título" value={titulo} onChangeText={setTitulo} />

        <TextInput style={styles.input} placeholder="Data e horário" value={data} onChangeText={setData} />

        <TouchableOpacity style={styles.select} onPress={() => setModalEstado(true)}>
          <Text>{estado || "Selecionar estado"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.select} onPress={() => setModalCidade(true)}>
          <Text>{cidade || "Selecionar cidade"}</Text>
        </TouchableOpacity>

        <TextInput style={[styles.input, styles.textArea]} placeholder="Descrição" value={descricao} onChangeText={setDescricao} />

        <TextInput style={styles.input} placeholder="Link do evento" value={link} onChangeText={setLink} />

        <TouchableOpacity style={styles.botaoFoto} onPress={escolherFotos}>
          <Text style={styles.textoBotao}>Adicionar fotos</Text>
        </TouchableOpacity>

        <ScrollView horizontal>
          {fotos.map((f, i) => (
            <Image key={i} source={{ uri: f }} style={styles.foto} />
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.botao} onPress={salvarEvento}>
          <Text style={styles.textoBotao}>
            {salvando ? "Enviando..." : "Enviar"}
          </Text>
        </TouchableOpacity>

        {/* MODAL ESTADO */}
        <Modal visible={modalEstado}>
          <ScrollView>
            {estados.map((e) => (
              <TouchableOpacity
                key={e.id}
                onPress={() => {
                  setEstado(e.sigla);
                  buscarCidades(e.sigla);
                  setModalEstado(false);
                }}
              >
                <Text style={styles.item}>{e.nome}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Modal>

        {/* MODAL CIDADE */}
        <Modal visible={modalCidade}>
          <ScrollView>
            {cidades.map((c) => (
              <TouchableOpacity
                key={c.id}
                onPress={() => {
                  setCidade(c.nome);
                  setModalCidade(false);
                }}
              >
                <Text style={styles.item}>{c.nome}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  conteudo: { padding: 20, paddingBottom: 120 },
  titulo: { fontSize: 26, fontWeight: "900", marginBottom: 16 },
  input: {
    backgroundColor: "#F9FAFB",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  textArea: { height: 100 },
  select: {
    backgroundColor: "#F3F4F6",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  botaoFoto: {
    backgroundColor: "#111",
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
    alignItems: "center",
  },
  botao: {
    backgroundColor: "#D4A857",
    padding: 16,
    borderRadius: 14,
    marginTop: 14,
    alignItems: "center",
  },
  textoBotao: { color: "#FFF", fontWeight: "900" },
  foto: { width: 100, height: 100, marginRight: 8, borderRadius: 10 },
  item: { padding: 16, borderBottomWidth: 1 },
});