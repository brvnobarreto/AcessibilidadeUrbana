import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, FlatList, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { cores } from '../styles';
import { placesApi, rankingApi } from '../lib/api';

const CATEGORIAS = ['Praça', 'Prédio', 'Rua', 'Escola', 'Hospital', 'Comércio', 'Outro'];
const NOTAS = ['Todas', '2+', '3+', '4+'];

function nivelInfo(avg) {
  const v = Number(avg) || 0;
  if (v >= 4)   return { cor: cores.primaria, label: 'Acessível' };
  if (v >= 2.5) return { cor: '#E67E22',      label: 'Parcial'   };
  return { cor: '#DC2626', label: 'Crítico' };
}

function Chip({ label, active, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[s.chip, active && s.chipActive]} activeOpacity={0.9}>
      <Text style={[s.chipText, active && s.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function CardResultado({ local, onAbrir, onAvaliar }) {
  const { cor, label } = nivelInfo(local.avg_rating);
  return (
    <TouchableOpacity style={[s.resultCard, { borderLeftColor: cor }]} activeOpacity={0.85} onPress={() => onAbrir(local)}>
      <View style={{ flex: 1 }}>
        <Text style={s.resultNome} numberOfLines={1}>{local.name}</Text>
        <Text style={s.resultSub} numberOfLines={1}>
          {[local.category, local.address].filter(Boolean).join(' · ')}
        </Text>
        <View style={[s.nivelTag, { backgroundColor: cor + '20' }]}>
          <Text style={[s.nivelTagTexto, { color: cor }]}>{label}</Text>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 8 }}>
        <View style={[s.notaBadge, { backgroundColor: cor }]}>
          <Text style={s.notaBadgeText}>{Number(local.avg_rating ?? 0).toFixed(1)}</Text>
        </View>
        <TouchableOpacity style={s.avaliarBtn} onPress={() => onAvaliar(local)}>
          <Text style={s.avaliarBtnText}>Avaliar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function TelaBusca({ navigation }) {
  const insets = useSafeAreaInsets();

  const [busca, setBusca]         = useState('');
  const [categoria, setCategoria] = useState('');
  const [regiaoId, setRegiaoId]   = useState(null);
  const [nota, setNota]           = useState('Todas');
  const [regioes, setRegioes]     = useState([]);

  const [resultados, setResultados] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [buscou, setBuscou]         = useState(false);

  const notaMin = useMemo(() => (nota === 'Todas' ? 0 : Number(nota.replace('+', ''))), [nota]);

  useEffect(() => {
    rankingApi.regioes().then(setRegioes).catch(() => {});
  }, []);

  const buscar = useCallback(async () => {
    setCarregando(true);
    try {
      const params = { limit: 50 };
      if (busca.trim()) params.search = busca.trim();
      if (categoria)    params.category = categoria.toLowerCase();
      if (regiaoId)     params.region_id = regiaoId;
      if (notaMin > 0)  params.min_rating = notaMin;
      const dados = await placesApi.listar(params);
      setResultados(dados ?? []);
    } catch {
      setResultados([]);
    } finally {
      setCarregando(false);
      setBuscou(true);
    }
  }, [busca, categoria, regiaoId, notaMin]);

  const abrirDetalhes = (local) => navigation.navigate('DetalhesLocal', { local });
  const avaliar       = (local) => navigation.navigate('Avaliar', { local });

  return (
    <View style={s.screen}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Buscar Locais</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View style={s.searchWrap}>
          <MaterialCommunityIcons name="magnify" size={18} color={cores.textoSecundario} style={{ marginRight: 6 }} />
          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar por nome..."
            placeholderTextColor={cores.textoSecundario}
            style={s.searchInput}
            returnKeyType="search"
            onSubmitEditing={buscar}
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca('')}>
              <MaterialCommunityIcons name="close-circle" size={16} color={cores.textoSecundario} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={s.block}>Categoria</Text>
        <View style={s.row}>
          {CATEGORIAS.map((c) => (
            <Chip key={c} label={c} active={categoria === c}
              onPress={() => setCategoria((p) => (p === c ? '' : c))} />
          ))}
        </View>

        {regioes.length > 0 && (
          <>
            <Text style={s.block}>Região</Text>
            <View style={s.row}>
              {regioes.map((r) => (
                <Chip key={String(r.id)} label={r.name} active={regiaoId === r.id}
                  onPress={() => setRegiaoId((p) => (p === r.id ? null : r.id))} />
              ))}
            </View>
          </>
        )}

        <Text style={s.block}>Nota Mínima</Text>
        <View style={s.row}>
          {NOTAS.map((n) => (
            <Chip key={n} label={n} active={nota === n} onPress={() => setNota(n)} />
          ))}
        </View>

        <TouchableOpacity style={s.btn} onPress={buscar} disabled={carregando}>
          {carregando
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnTxt}>BUSCAR</Text>}
        </TouchableOpacity>

        {buscou && !carregando && (
          <>
            <Text style={[s.block, { marginTop: 24 }]}>
              Resultados ({resultados.length})
            </Text>
            {resultados.length === 0 ? (
              <View style={s.vazio}>
                <MaterialCommunityIcons name="map-search-outline" size={40} color={cores.textoSecundario} />
                <Text style={s.vazioText}>Nenhum local encontrado com esses filtros.</Text>
              </View>
            ) : (
              <FlatList
                data={resultados}
                scrollEnabled={false}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <CardResultado local={item} onAbrir={abrirDetalhes} onAvaliar={avaliar} />
                )}
              />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: cores.fundo },
  header: { backgroundColor: cores.primariaEscura, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 32 },
  searchWrap: {
    height: 52, borderWidth: 2, borderColor: cores.primaria, borderRadius: 24,
    paddingHorizontal: 12, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center',
  },
  searchInput: { flex: 1, color: cores.texto, fontSize: 15 },
  block: { marginTop: 16, color: cores.texto, fontSize: 16, fontWeight: '700' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  chip: { borderWidth: 1, borderColor: cores.borda, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#fff' },
  chipActive: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  chipText: { color: cores.textoSecundario, fontSize: 14 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  btn: { marginTop: 24, height: 54, borderRadius: 14, backgroundColor: cores.primaria, alignItems: 'center', justifyContent: 'center' },
  btnTxt: { color: '#fff', fontSize: 17, fontWeight: '700' },
  resultCard: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginTop: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, borderLeftWidth: 4,
  },
  resultNome: { fontSize: 15, fontWeight: '700', color: cores.texto, textTransform: 'capitalize' },
  resultSub: { fontSize: 12, color: cores.textoSecundario, marginTop: 2, textTransform: 'capitalize' },
  nivelTag: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6 },
  nivelTagTexto: { fontSize: 11, fontWeight: '700' },
  notaBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  notaBadgeText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  avaliarBtn: { borderWidth: 1, borderColor: cores.primaria, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  avaliarBtnText: { color: cores.primaria, fontWeight: '700', fontSize: 12 },
  vazio: { alignItems: 'center', paddingVertical: 32 },
  vazioText: { color: cores.textoSecundario, marginTop: 10, textAlign: 'center' },
});

export default TelaBusca;
