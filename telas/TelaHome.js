import { useEffect, useState, useCallback } from 'react';
import {
  Text, View, FlatList, TouchableOpacity,
  ActivityIndicator, StyleSheet, RefreshControl, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { cores } from '../styles';
import { placesApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

const CATEGORIA_ICONE = {
  praça:   'nature-people',
  prédio:  'office-building',
  rua:     'road',
  escola:  'school',
  hospital:'hospital-building',
  default: 'map-marker',
};

function CardLocal({ local, onPress }) {
  const icone = CATEGORIA_ICONE[local.category?.toLowerCase()] ?? CATEGORIA_ICONE.default;
  const nivel = local.avg_rating >= 4 ? 'green' : local.avg_rating >= 2.5 ? 'orange' : 'red';
  const corNivel = { green: cores.primaria, orange: '#E67E22', red: '#DC2626' };

  return (
    <TouchableOpacity style={s.card} onPress={() => onPress(local)} activeOpacity={0.8}>
      <View style={[s.cardIcone, { backgroundColor: corNivel[nivel] + '20' }]}>
        <MaterialCommunityIcons name={icone} size={28} color={corNivel[nivel]} />
      </View>
      <View style={s.cardInfo}>
        <Text style={s.cardNome} numberOfLines={1}>{local.name}</Text>
        <Text style={s.cardCategoria}>{local.category}</Text>
        <View style={s.cardRodape}>
          <MaterialCommunityIcons name="star" size={14} color="#F59E0B" />
          <Text style={s.cardNota}>{Number(local.avg_rating).toFixed(1)}</Text>
          <View style={[s.nivelBadge, { backgroundColor: corNivel[nivel] }]} />
        </View>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={cores.textoSecundario} />
    </TouchableOpacity>
  );
}

function TelaHome({ navigation }) {
  const insets       = useSafeAreaInsets();
  const { user, sair } = useAuth();
  const [locais, setLocais]         = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro]             = useState(null);

  const nome = user?.name ?? user?.email ?? 'usuário';

  const buscarLocais = useCallback(async (silencioso = false) => {
    if (!silencioso) setCarregando(true);
    setErro(null);
    try {
      const dados = await placesApi.listar({ limit: 20 });
      setLocais(dados ?? []);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => { buscarLocais(); }, [buscarLocais]);

  const confirmarSair = () => {
    Alert.alert('Sair', 'Deseja mesmo encerrar a sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: sair },
    ]);
  };

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={s.headerSaudacao}>Olá, {nome.split(' ')[0]} 👋</Text>
          <Text style={s.headerSubtitulo}>Locais recentes</Text>
        </View>
        <View style={s.headerAcoes}>
          <TouchableOpacity onPress={() => navigation.navigate('Busca')} style={s.headerBtn}>
            <MaterialCommunityIcons name="magnify" size={22} color={cores.fundo} />
          </TouchableOpacity>
          <TouchableOpacity onPress={confirmarSair} style={s.headerBtn}>
            <MaterialCommunityIcons name="logout" size={22} color={cores.fundo} />
          </TouchableOpacity>
        </View>
      </View>

      {carregando ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={cores.primaria} />
      ) : erro ? (
        <View style={s.erroContainer}>
          <MaterialCommunityIcons name="wifi-off" size={48} color={cores.textoSecundario} />
          <Text style={s.erroTexto}>{erro}</Text>
          <TouchableOpacity style={s.tentarNovamente} onPress={() => buscarLocais()}>
            <Text style={s.tentarNovamenteTexto}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={locais}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <CardLocal local={item} onPress={(l) => navigation.navigate('DetalhesLocal', { local: l })} />
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={atualizando}
              onRefresh={() => { setAtualizando(true); buscarLocais(true); }}
              colors={[cores.primaria]}
            />
          }
          ListHeaderComponent={
            <TouchableOpacity
              style={s.cardEstatisticas}
              onPress={() => navigation.navigate('EstatisticasRegiao')}
              activeOpacity={0.85}>
              <MaterialCommunityIcons name="chart-bar" size={28} color={cores.primaria} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.cardEstatisticasTitulo}>Estatísticas por Região</Text>
                <Text style={s.cardEstatisticasDesc}>Desempenho médio e critérios mais avaliados</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={cores.textoSecundario} />
            </TouchableOpacity>
          }
          ListEmptyComponent={
            <View style={s.vazio}>
              <MaterialCommunityIcons name="map-search-outline" size={56} color={cores.textoSecundario} />
              <Text style={s.vazioTexto}>Nenhum local cadastrado ainda.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: cores.fundo },
  header:      { backgroundColor: cores.primariaEscura, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerSaudacao: { color: cores.fundo, fontSize: 18, fontWeight: 'bold' },
  headerSubtitulo: { color: cores.fundo + 'CC', fontSize: 13 },
  headerAcoes: { flexDirection: 'row', gap: 4 },
  headerBtn:   { padding: 8 },
  card:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardIcone:   { width: 52, height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardInfo:    { flex: 1 },
  cardNome:    { fontSize: 15, fontWeight: '600', color: cores.texto },
  cardCategoria: { fontSize: 12, color: cores.textoSecundario, marginTop: 2, textTransform: 'capitalize' },
  cardRodape:  { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  cardNota:    { fontSize: 13, color: cores.texto, fontWeight: '600' },
  nivelBadge:  { width: 8, height: 8, borderRadius: 4, marginLeft: 6 },
  erroContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  erroTexto:   { color: cores.textoSecundario, textAlign: 'center', marginTop: 12 },
  tentarNovamente: { marginTop: 16, backgroundColor: cores.primaria, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  tentarNovamenteTexto: { color: '#fff', fontWeight: '600' },
  vazio:       { alignItems: 'center', paddingTop: 60 },
  vazioTexto:  { color: cores.textoSecundario, marginTop: 12, fontSize: 15 },
  cardEstatisticas: { flexDirection: 'row', alignItems: 'center', backgroundColor: cores.fundoCard, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: cores.primaria + '40' },
  cardEstatisticasTitulo: { fontSize: 14, fontWeight: '700', color: cores.texto },
  cardEstatisticasDesc:   { fontSize: 12, color: cores.textoSecundario, marginTop: 2 },
});

export default TelaHome;
