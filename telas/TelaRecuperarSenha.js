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
  const [email, setEmail]                   = useState('');
  const [novaSenha, setNovaSenha]           = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [carregando, setCarregando]         = useState(false);

  const handleRedefinir = async () => {
    if (!email || !novaSenha || !confirmarSenha) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
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
      await authApi.resetPassword(email.trim().toLowerCase(), novaSenha);
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
        <TouchableOpacity style={s.voltarBtn} onPress={() => navigation.goBack()}>
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
          name="cellphone-key"
          size={64}
          color={cores.primaria}
          style={{ alignSelf: 'center', marginTop: 8, marginBottom: 16 }}
        />

        <Text style={s.titulo}>Redefinir senha</Text>
        <Text style={s.descricao}>
          Informe seu e-mail cadastrado e defina uma nova senha.
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

        <View style={s.infoCard}>
          <MaterialCommunityIcons name="information-outline" size={18} color={cores.primariaEscura} />
          <Text style={s.infoTexto}>
            A senha será alterada imediatamente. Após confirmar, faça login com a nova senha.
          </Text>
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
  corpo:        { paddingHorizontal: 24, paddingBottom: 40 },
  titulo:       { fontSize: 22, fontWeight: 'bold', color: cores.texto, marginBottom: 8 },
  descricao:    { fontSize: 14, color: cores.textoSecundario, marginBottom: 24, lineHeight: 20 },
  campo:        { marginBottom: 16 },
  label:        { fontSize: 14, color: cores.texto, marginBottom: 6, fontWeight: '500' },
  input:        { height: 48, borderWidth: 1, borderColor: cores.borda, borderRadius: 8, paddingHorizontal: 14, fontSize: 15, color: cores.texto, backgroundColor: cores.fundo },
  botao:        { backgroundColor: cores.primaria, height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  botaoTexto:   { color: '#fff', fontSize: 15, fontWeight: 'bold', letterSpacing: 0.5 },
  infoCard:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: cores.fundoCard, borderRadius: 8, padding: 14, marginTop: 20 },
  infoTexto:    { flex: 1, fontSize: 13, color: cores.texto, lineHeight: 18 },
});

export default TelaRecuperarSenha;
