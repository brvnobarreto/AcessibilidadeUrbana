import { useState } from 'react';
import {
  Text, View, TouchableOpacity, TextInput,
  Alert, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { cores } from '../styles';
import { authApi } from '../lib/api';

function TelaRecuperarSenha({ navigation }) {
  const insets = useSafeAreaInsets();

  // etapa: 'email' (pede o código) | 'codigo' (digita código + nova senha)
  const [etapa, setEtapa]                   = useState('email');
  const [email, setEmail]                   = useState('');
  const [codigo, setCodigo]                 = useState('');
  const [novaSenha, setNovaSenha]           = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [carregando, setCarregando]         = useState(false);

  // Etapa 1 — solicitar o código por e-mail
  const handleEnviarCodigo = async () => {
    if (!email) {
      Alert.alert('Atenção', 'Informe seu e-mail.');
      return;
    }

    setCarregando(true);
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      Alert.alert(
        'Código enviado',
        'Se o e-mail estiver cadastrado, enviamos um código de 6 dígitos. Verifique sua caixa de entrada.',
      );
      setEtapa('codigo');
    } catch (err) {
      Alert.alert('Erro', err.message);
    } finally {
      setCarregando(false);
    }
  };

  // Etapa 2 — validar código e definir nova senha
  const handleRedefinir = async () => {
    if (!codigo || !novaSenha || !confirmarSenha) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }
    if (codigo.length !== 6) {
      Alert.alert('Atenção', 'O código deve ter 6 dígitos.');
      return;
    }
    if (novaSenha.length < 8) {
      Alert.alert('Atenção', 'A senha deve ter no mínimo 8 caracteres.');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      Alert.alert('Atenção', 'As senhas não coincidem.');
      return;
    }

    setCarregando(true);
    try {
      await authApi.resetPassword(email.trim().toLowerCase(), codigo.trim(), novaSenha);
      Alert.alert(
        'Senha redefinida',
        'Sua senha foi alterada com sucesso. Faça login com a nova senha.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (err) {
      Alert.alert('Erro', err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <View style={s.container}>
      {/* Header fixo */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={s.voltarBtn}
          onPress={() => (etapa === 'codigo' ? setEtapa('email') : navigation.goBack())}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={cores.texto} />
        </TouchableOpacity>
        <Text style={s.headerTitulo}>Recuperar Senha</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Conteúdo rolável */}
      <ScrollView
        contentContainerStyle={s.corpo}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        <MaterialCommunityIcons
          name={etapa === 'email' ? 'email-fast-outline' : 'cellphone-key'}
          size={64}
          color={cores.primaria}
          style={{ alignSelf: 'center', marginTop: 8, marginBottom: 16 }}
        />

        {etapa === 'email' ? (
          <>
            <Text style={s.titulo}>Esqueceu a senha?</Text>
            <Text style={s.descricao}>
              Informe seu e-mail cadastrado. Enviaremos um código de 6 dígitos para você redefinir a senha.
            </Text>

            <View style={s.campo}>
              <Text style={s.label}>E-mail cadastrado</Text>
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

            <TouchableOpacity
              style={[s.botao, carregando && { opacity: 0.65 }]}
              onPress={handleEnviarCodigo}
              disabled={carregando}>
              {carregando
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.botaoTexto}>ENVIAR CÓDIGO</Text>
              }
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={s.titulo}>Digite o código</Text>
            <Text style={s.descricao}>
              Enviamos um código de 6 dígitos para {email}. Digite-o abaixo e defina sua nova senha.
            </Text>

            <View style={s.campo}>
              <Text style={s.label}>Código de 6 dígitos</Text>
              <TextInput
                style={[s.input, s.inputCodigo]}
                placeholder="000000"
                placeholderTextColor={cores.textoSecundario}
                value={codigo}
                onChangeText={(t) => setCodigo(t.replace(/[^0-9]/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>

            <View style={s.campo}>
              <Text style={s.label}>Nova senha</Text>
              <TextInput
                style={s.input}
                placeholder="Mínimo 8 caracteres"
                placeholderTextColor={cores.textoSecundario}
                value={novaSenha}
                onChangeText={setNovaSenha}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
            </View>

            <View style={s.campo}>
              <Text style={s.label}>Confirmar nova senha</Text>
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
              style={[s.botao, carregando && { opacity: 0.65 }]}
              onPress={handleRedefinir}
              disabled={carregando}>
              {carregando
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.botaoTexto}>REDEFINIR SENHA</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={s.reenviar}
              onPress={handleEnviarCodigo}
              disabled={carregando}>
              <Text style={s.reenviarTexto}>Não recebeu? Reenviar código</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={s.infoCard}>
          <MaterialCommunityIcons name="information-outline" size={18} color={cores.primariaEscura} />
          <Text style={s.infoTexto}>
            O código expira em 10 minutos. Após redefinir, faça login com a nova senha.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: cores.fundo },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14 },
  voltarBtn:     { width: 40, height: 40, justifyContent: 'center' },
  headerTitulo:  { fontSize: 18, fontWeight: 'bold', color: cores.texto },
  corpo:         { paddingHorizontal: 24, paddingBottom: 40 },
  titulo:        { fontSize: 22, fontWeight: 'bold', color: cores.texto, marginBottom: 8 },
  descricao:     { fontSize: 14, color: cores.textoSecundario, marginBottom: 24, lineHeight: 20 },
  campo:         { marginBottom: 16 },
  label:         { fontSize: 14, color: cores.texto, marginBottom: 6, fontWeight: '500' },
  input:         { height: 48, borderWidth: 1, borderColor: cores.borda, borderRadius: 8, paddingHorizontal: 14, fontSize: 15, color: cores.texto, backgroundColor: cores.fundo },
  inputCodigo:   { fontSize: 24, letterSpacing: 8, textAlign: 'center', fontWeight: 'bold' },
  botao:         { backgroundColor: cores.primaria, height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  botaoTexto:    { color: '#fff', fontSize: 15, fontWeight: 'bold', letterSpacing: 0.5 },
  reenviar:      { alignSelf: 'center', marginTop: 16, padding: 8 },
  reenviarTexto: { color: cores.primaria, fontSize: 14, fontWeight: '500' },
  infoCard:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: cores.fundoCard, borderRadius: 8, padding: 14, marginTop: 20 },
  infoTexto:     { flex: 1, fontSize: 13, color: cores.texto, lineHeight: 18 },
});

export default TelaRecuperarSenha;
