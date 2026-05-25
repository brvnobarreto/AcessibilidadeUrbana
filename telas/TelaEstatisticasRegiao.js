import { useMemo } from 'react';
import { SafeAreaView, View, Text, ScrollView, StyleSheet } from 'react-native';
import { LOCAIS } from '../lib/dadosAcessibilidade';

const HEADER = '#1F7D4A';
const BG = '#1F2329';
const CARD = '#232930';
const TXT = '#E8E8E8';
const MUTED = '#A7AFB8';

function Barra({ label, value }) {
  const largura = Math.max(6, Math.round((value / 5) * 100));
  const cor = value >= 4.5 ? '#21B06B' : value >= 4 ? '#E4A11B' : '#D84343';
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

function TelaEstatisticasRegiao() {
  const medias = useMemo(() => {
    const regioes = ['Centro', 'Zona Sul', 'Zona Norte', 'Zona Leste'];
    return regioes.map((r) => {
      const arr = LOCAIS.filter((l) => l.bairro === r);
      if (!arr.length) return { regiao: r, media: 0 };
      return { regiao: r, media: arr.reduce((s, i) => s + i.nota, 0) / arr.length };
    });
  }, []);

  const criterios = useMemo(() => {
    const mapa = {};
    for (const l of LOCAIS) {
      for (const c of l.criterios) mapa[c] = (mapa[c] ?? 0) + 1;
    }
    const arr = Object.entries(mapa).map(([criterio, total]) => ({ criterio, total }));
    return arr.sort((a, b) => b.total - a.total);
  }, []);

  const maxCrit = criterios.length ? criterios[0].total : 1;

  return (
    <SafeAreaView style={s.screen}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Estatísticas por Região</Text>
      </View>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.section}>Desempenho médio por região</Text>
        <View style={s.card}>
          {medias.map((m) => (
            <Barra key={m.regiao} label={m.regiao} value={m.media} />
          ))}
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
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  header: { height: 84, backgroundColor: HEADER, justifyContent: 'center', paddingHorizontal: 16 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 24 },
  section: { color: TXT, fontSize: 18, fontWeight: '700', marginBottom: 10, marginTop: 6 },
  card: { backgroundColor: CARD, borderWidth: 1, borderColor: '#3E4650', borderRadius: 12, padding: 12, marginBottom: 16 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { color: TXT, fontWeight: '600' },
  rowValue: { color: MUTED, fontWeight: '700' },
  trilha: { marginTop: 6, backgroundColor: '#3C4450', borderRadius: 999, height: 10, overflow: 'hidden' },
  progresso: { height: 10, borderRadius: 999 },
  grafico: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', minHeight: 170, paddingTop: 12 },
  coluna: { width: 26, borderTopLeftRadius: 6, borderTopRightRadius: 6, backgroundColor: '#21B06B' },
  colunaValor: { color: TXT, marginTop: 4, fontSize: 12, fontWeight: '700' },
  colunaLabel: { color: MUTED, marginTop: 2, fontSize: 10, textAlign: 'center' },
});

export default TelaEstatisticasRegiao;
