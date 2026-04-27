import { anuncios } from "./dados";
import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";

export default function Publicar() {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");

  const [titulo, setTitulo] = useState("");
  const [preco, setPreco] = useState("");
  const [cidade, setCidade] = useState("");
  const [ano, setAno] = useState("");
  const [km, setKm] = useState("");
  const [descricao, setDescricao] = useState("");

  const validar = () => {
  const anoAtual = new Date().getFullYear();

  if (!nome || !telefone || !email) {
    Alert.alert("Erro", "Preencha seus dados");
    return;
  }

  if (!ano || anoAtual - Number(ano) < 25) {
    Alert.alert("Regra", "Veículo precisa ter mais de 25 anos");
    return;
  }

  const novoAnuncio = {
    nome,
    telefone,
    email,
    titulo,
    preco,
    cidade,
    ano,
    km,
    descricao,
  };

  anuncios.push(novoAnuncio);

  Alert.alert("Sucesso", "Anúncio publicado 🚀");

  // limpar campos
  setNome("");
  setTelefone("");
  setEmail("");
  setTitulo("");
  setPreco("");
  setCidade("");
  setAno("");
  setKm("");
  setDescricao("");
};

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.logo}>Clube da Caminhonete</Text>
      <Text style={styles.titulo}>Publicar Anúncio</Text>

      <Text style={styles.subtitulo}>Seus dados</Text>

      <TextInput style={styles.input} placeholder="Nome completo" placeholderTextColor="#777" value={nome} onChangeText={setNome} />
      <TextInput style={styles.input} placeholder="Telefone" placeholderTextColor="#777" value={telefone} onChangeText={setTelefone} />
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#777" value={email} onChangeText={setEmail} />

      <Text style={styles.subtitulo}>Dados do veículo</Text>

      <TextInput style={styles.input} placeholder="Título do anúncio" placeholderTextColor="#777" value={titulo} onChangeText={setTitulo} />
      <TextInput style={styles.input} placeholder="Preço" placeholderTextColor="#777" value={preco} onChangeText={setPreco} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Cidade / Estado" placeholderTextColor="#777" value={cidade} onChangeText={setCidade} />
      <TextInput style={styles.input} placeholder="Ano" placeholderTextColor="#777" value={ano} onChangeText={setAno} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Quilometragem" placeholderTextColor="#777" value={km} onChangeText={setKm} keyboardType="numeric" />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Descrição"
        placeholderTextColor="#777"
        value={descricao}
        onChangeText={setDescricao}
        multiline
      />

      <TouchableOpacity style={styles.botao} onPress={validar}>
        <Text style={styles.botaoTexto}>Cadastrar Anúncio</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F14",
    padding: 24,
  },
  logo: {
    color: "#C9A227",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  titulo: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
  },
  subtitulo: {
    color: "#C9A227",
    fontSize: 16,
    marginTop: 10,
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#151B23",
    color: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#263241",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  botao: {
    backgroundColor: "#C9A227",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 40,
  },
  botaoTexto: {
    color: "#0B0F14",
    fontWeight: "bold",
  },
});