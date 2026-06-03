import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { cores } from '../styles';
import { rankingApi } from '../lib/api';

// Critérios agregados retornados pela view stats_by_region
const CRITERIOS = [
  { key: 'total_ramp',                label: 'Rampa'      },
  { key: 'total_sidewalk',            label: 'Calçada'    },
  { key: 'total_tactile_floor',       label: 'Piso tátil' },
  { key: 'total_sound_signaling',     label: 'Sin. sonora' },
  { key: 'total_disabled_parking',    label: 'Vaga PCD'   },
  { key: 'total_elevator',            label: 'Elevador'   },
  { key: 'total_accessible_bathroom', label: 'Banheiro'   },
];

function Barra({ label, value }) {
  const largura = Math.max(6, Math.round((value / 5) * 100));
  const cor = value >= 4.5 ? cores.primaria : value >= 4 ? '#E4A11B' : '#D84343';
  return (
    <View style={{ marginTop: 10 }}>
      <View style={s.rowTop}>
        <Text style={s.rowLabel}>{label}</Text>
        <Text style={s.rowValue}>{value.toFixed(1)}</Text>
      </View>
      <View style={s.trilha}>
        <View style={[s.progresso, { width: `${largura}%`, backgroundColor: cor }]} />
      </View>
    </View>
  );
}

function Coluna({ label, value, max }) {
  const altura = Math.max(8, Math.round((value / max) * 120));
  return (
    <View style={{ alignItems: 'center', width: 60 }}>
      <View style={[s.coluna, { height: altura }]} />
      <Text style={s.colunaValor}>{value}</Text>
      <Text style={s.colunaLabel}>{label}</Text>
    </View>
  );
}

function TelaEstatisticasRegiao({ navigation }) {
  const insets = useSafeAreaInsets();
  const [stats, setStats]           = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro]             = useState(false);

  useEffect(() => {
    let cancelado = false;
    rankingApi.stats()
      .then((dados) => { if (!cancelado) setStats(dados ?? []); })
      .catch(() => { if (!cancelado) setErro(true); })
      .finally(() => { if (!cancelado) setCarregando(false); });
    return () => { cancelado = true; };
  }, []);

  const medias = useMemo(
    () => stats
      .map((r) => ({ regiao: r.region_name ?? 'Sem região', media: Number(r.avg_rating) || 0 }))
      .filter((m) => m.regiao),
    [stats],
  );

  const criterios = useMemo(() => {
    const arr = CRITERIOS.map((c) => ({
      criterio: c.label,
      total: stats.reduce((soma, r) => soma + (Number(r[c.key]) || 0), 0),
    }));
    return arr.sort((a, b) => b.total - a.total);
  }, [stats]);

  const maxCrit = criterios.length ? Math.max(1, criterios[0].total) : 1;
  const temDados = medias.some((m) => m.media > 0) || criterios.some((c) => c.total > 0);

  return (
    <View style={s.screen}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Estatísticas por Região</Text>
        <View style={{ width: 24 }} />
      </View>

      {carregando ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={cores.primaria} />
      ) : erro ? (
        <View style={s.vazio}>
          <MaterialCommunityIcons name="wifi-off" size={44} color={cores.textoSecundario} />
          <Text style={s.vazioTexto}>Não foi possível carregar as estatísticas.</Text>
        </View>
      ) : !temDados ? (
        <View style={s.vazio}>
          <MaterialCommunityIcons name="chart-bar" size={44} color={cores.textoSecundario} />
          <Text style={s.vazioTexto}>Ainda não há dados suficientes. Cadastre locais e avalie para ver as estatísticas.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.content}>
          <Text style={s.section}>Desempenho médio por região</Text>
          <View style={s.card}>
            {medias.length === 0
              ? <Text style={s.semItem}>Sem regiões cadastradas.</Text>
              : medias.map((m) => <Barra key={m.regiao} label={m.regiao} value={m.media} />)}
          </View>

          <Text style={s.section}>Critérios mais avaliados</Text>
          <View style={s.card}>
            <View style={s.grafico}>
              {criterios.map((c) => (
                <Coluna key={c.criterio} label={c.criterio} value={c.total} max={maxCrit} />
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: cores.fundo },
  header: { backgroundColor: cores.primariaEscura, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 24 },
  section: { color: cores.texto, fontSize: 18, fontWeight: '700', marginBottom: 10, marginTop: 6 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: cores.borda, borderRadius: 12, padding: 12, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  semItem: { color: cores.textoSecundario, fontSize: 13, paddingVertical: 8 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { color: cores.texto, fontWeight: '600' },
  rowValue: { color: cores.textoSecundario, fontWeight: '700' },
  trilha: { marginTop: 6, backgroundColor: cores.borda, borderRadius: 999, height: 10, overflow: 'hidden' },
  progresso: { height: 10, borderRadius: 999 },
  grafico: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', minHeight: 170, paddingTop: 12, flexWrap: 'wrap', gap: 12 },
  coluna: { width: 26, borderTopLeftRadius: 6, borderTopRightRadius: 6, backgroundColor: cores.primaria },
  colunaValor: { color: cores.texto, marginTop: 4, fontSize: 12, fontWeight: '700' },
  colunaLabel: { color: cores.textoSecundario, marginTop: 2, fontSize: 10, textAlign: 'center' },
  vazio: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  vazioTexto: { color: cores.textoSecundario, marginTop: 12, textAlign: 'center', fontSize: 14, lineHeight: 20 },
});

export default TelaEstatisticasRegiao;
