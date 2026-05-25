import { useState } from 'react';
import {
  Text, View, TouchableOpacity, TextInput,
  Alert, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { cores } from '../styles';
import { authApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

function TelaCriarConta({ navigation }) {
  const insets = useSafeAreaInsets();
  const { entrar } = useAuth();
  const [nome, setNome]                     = useState('');
  const [email, setEmail]                   = useState('');
  const [senha, setSenha]                   = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [aceitouTermos, setAceitouTermos]   = useState(false);
  const [carregando, setCarregando]         = useState(false);

  const handleCriarConta = async () => {
    if (!nome || !email || !senha || !confirmarSenha) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }
    if (senha.length < 8) {
      Alert.alert('Atenção', 'A senha deve ter no mínimo 8 caracteres.');
      return;
    }
    if (senha !== confirmarSenha) {
      Alert.alert('Atenção', 'As senhas não coincidem.');
      return;
    }
    if (!aceitouTermos) {
      Alert.alert('Atenção', 'Você precisa aceitar os Termos de Uso.');
      return;
    }

    setCarregando(true);
    try {
      const { token, user } = await authApi.register(
        email.trim().toLowerCase(),
        senha,
        nome.trim(),
      );
      await entrar(token, user);
    } catch (err) {
      Alert.alert('Erro ao criar conta', err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <View style={s.container}>
      {/* Header fixo */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={s.voltarBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={cores.texto} />
        </TouchableOpacity>
        <Text style={s.headerTitulo}>Criar Conta</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Conteúdo rolável */}
      <ScrollView
        contentContainerStyle={s.corpo}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        <View style={s.campo}>
          <Text style={s.label}>Nome completo</Text>
          <TextInput
            style={s.input}
            placeholder="Digite seu nome"
            placeholderTextColor={cores.textoSecundario}
            value={nome}
            onChangeText={setNome}
            autoCorrect={false}
          />
        </View>

        <View style={s.campo}>
          <Text style={s.label}>E-mail</Text>
          <TextInput
            style={s.input}
            placeholder="seu@email.com"
            placeholderTextColor={cores.textoSecundario}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={s.campo}>
          <Text style={s.label}>Senha</Text>
          <TextInput
            style={s.input}
            placeholder="Mínimo 8 caracteres"
            placeholderTextColor={cores.textoSecundario}
            value={senha}
            onChangeText={setSenha}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />
        </View>

        <View style={s.campo}>
          <Text style={s.label}>Confirmar senha</Text>
          <TextInput
            style={s.input}
            placeholder="Repita a senha"
            placeholderTextColor={cores.textoSecundario}
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={s.termosLinha}
          onPress={() => setAceitouTermos(!aceitouTermos)}
          activeOpacity={0.7}>
          <View style={[s.checkbox, aceitouTermos && s.checkboxMarcado]}>
            {aceitouTermos && (
              <MaterialCommunityIcons name="check" size={14} color="#fff" />
            )}
          </View>
          <Text style={s.termosTexto}>
            Aceito os{' '}
            <Text style={s.termosLink}>Termos de Uso e Política de Privacidade</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.botao, carregando && { opacity: 0.65 }]}
          onPress={handleCriarConta}
          disabled={carregando}>
          {carregando
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.botaoTexto}>CADASTRAR</Text>
          }
        </TouchableOpacity>

        <View style={s.rodape}>
          <Text style={s.rodapeTexto}>Já tem conta?</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={s.rodapeLink}>Entrar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: cores.fundo },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14 },
  voltarBtn:    { width: 40, height: 40, justifyContent: 'center' },
  headerTitulo: { fontSize: 18, fontWeight: 'bold', color: cores.texto },
  corpo:        { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40 },
  campo:        { marginBottom: 16 },
  label:        { fontSize: 14, color: cores.texto, marginBottom: 6, fontWeight: '500' },
  input:        { height: 48, borderWidth: 1, borderColor: cores.borda, borderRadius: 8, paddingHorizontal: 14, fontSize: 15, color: cores.texto, backgroundColor: cores.fundo },
  termosLinha:  { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 20 },
  checkbox:     { width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, borderColor: cores.borda, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  checkboxMarcado: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  termosTexto:  { flex: 1, fontSize: 13, color: cores.texto },
  termosLink:   { color: cores.primaria, fontWeight: '600' },
  botao:        { backgroundColor: cores.primaria, height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  botaoTexto:   { color: '#fff', fontSize: 15, fontWeight: 'bold', letterSpacing: 0.5 },
  rodape:       { flexDirection: 'row', justifyContent: 'center', marginTop: 20, gap: 4 },
  rodapeTexto:  { color: cores.textoSecundario, fontSize: 14 },
  rodapeLink:   { color: cores.primaria, fontSize: 14, fontWeight: 'bold' },
});

export default TelaCriarConta;
