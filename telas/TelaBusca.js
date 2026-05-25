import { useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { cores } from '../styles';
import { LOCAIS } from '../lib/dadosAcessibilidade';

function Chip({ label, active, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[s.chip, active && s.chipActive]} activeOpacity={0.9}>
      <Text style={[s.chipText, active && s.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function CardResultado({ local, onAvaliar }) {
  const cor = local.nota >= 4.5 ? cores.primaria : local.nota >= 4 ? '#E4A11B' : '#DC2626';
  return (
    <View style={s.resultCard}>
      <View style={{ flex: 1 }}>
        <Text style={s.resultNome}>{local.nome}</Text>
        <Text style={s.resultSub}>{local.tipo} · {local.bairro}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
          {local.criterios.map((c) => (
            <View key={c} style={s.criterioTag}>
              <Text style={s.criterioTagText}>{c}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 8 }}>
        <View style={[s.notaBadge, { backgroundColor: cor }]}>
          <Text style={s.notaBadgeText}>{local.nota.toFixed(1)}</Text>
        </View>
        <TouchableOpacity style={s.avaliarBtn} onPress={() => onAvaliar(local)}>
          <Text style={s.avaliarBtnText}>Avaliar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function TelaBusca({ navigation }) {
  const [filtros, setFiltros] = useState({
    busca: '',
    tipo: '',
    bairro: '',
    nota: '1+',
    criterio: '',
  });
  const [mostrarResultados, setMostrarResultados] = useState(false);

  const notaMin = useMemo(() => Number(filtros.nota.replace('+', '')), [filtros.nota]);

  const resultados = useMemo(() => {
    return LOCAIS.filter((l) => {
      const okBusca = !filtros.busca.trim() || l.nome.toLowerCase().includes(filtros.busca.toLowerCase().trim());
      const okTipo = !filtros.tipo || l.tipo === filtros.tipo;
      const okBairro = !filtros.bairro || l.bairro === filtros.bairro;
      const okNota = l.nota >= notaMin;
      const okCrit = !filtros.criterio || l.criterios.includes(filtros.criterio);
      return okBusca && okTipo && okBairro && okNota && okCrit;
    });
  }, [filtros, notaMin]);

  return (
    <SafeAreaView style={s.screen}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Buscar Locais</Text>
      </View>

      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View style={s.searchWrap}>
          <MaterialCommunityIcons name="magnify" size={18} color={cores.textoSecundario} style={{ marginRight: 6 }} />
          <TextInput
            value={filtros.busca}
            onChangeText={(t) => { setFiltros((p) => ({ ...p, busca: t })); setMostrarResultados(false); }}
            placeholder="Ex: Praça do Ferreira..."
            placeholderTextColor={cores.textoSecundario}
            style={s.searchInput}
          />
          {filtros.busca.length > 0 && (
            <TouchableOpacity onPress={() => setFiltros((p) => ({ ...p, busca: '' }))}>
              <MaterialCommunityIcons name="close-circle" size={16} color={cores.textoSecundario} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={s.block}>Tipo de Local</Text>
        <View style={s.row}>
          {['Rua', 'Predio', 'Estabelecimento', 'Praca'].map((i) => (
            <Chip
              key={i} label={i}
              active={filtros.tipo === i}
              onPress={() => { setFiltros((p) => ({ ...p, tipo: p.tipo === i ? '' : i })); setMostrarResultados(false); }}
            />
          ))}
        </View>

        <Text style={s.block}>Bairro / Região</Text>
        <View style={s.row}>
          {['Centro', 'Zona Sul', 'Zona Norte', 'Zona Leste'].map((i) => (
            <Chip
              key={i} label={i}
              active={filtros.bairro === i}
              onPress={() => { setFiltros((p) => ({ ...p, bairro: p.bairro === i ? '' : i })); setMostrarResultados(false); }}
            />
          ))}
        </View>

        <Text style={s.block}>Nota Mínima</Text>
        <View style={s.row}>
          {['1+', '2+', '3+', '4+'].map((i) => (
            <Chip key={i} label={i} active={filtros.nota === i} onPress={() => { setFiltros((p) => ({ ...p, nota: i })); setMostrarResultados(false); }} />
          ))}
        </View>

        <Text style={s.block}>Critério</Text>
        <View style={s.row}>
          {['Rampa', 'Calcada', 'Sinalizacao', 'Elevador'].map((i) => (
            <Chip
              key={i} label={i}
              active={filtros.criterio === i}
              onPress={() => { setFiltros((p) => ({ ...p, criterio: p.criterio === i ? '' : i })); setMostrarResultados(false); }}
            />
          ))}
        </View>

        <TouchableOpacity style={s.btn} onPress={() => setMostrarResultados(true)}>
          <Text style={s.btnTxt}>BUSCAR ({resultados.length} resultado{resultados.length !== 1 ? 's' : ''})</Text>
        </TouchableOpacity>

        {mostrarResultados && (
          <>
            <Text style={[s.block, { marginTop: 24 }]}>Resultados</Text>
            {resultados.length === 0 ? (
              <View style={s.vazio}>
                <MaterialCommunityIcons name="map-search-outline" size={40} color={cores.textoSecundario} />
                <Text style={s.vazioText}>Nenhum local encontrado com esses filtros.</Text>
              </View>
            ) : (
              resultados.map((l) => (
                <CardResultado
                  key={l.id}
                  local={l}
                  onAvaliar={(local) => navigation.navigate('Avaliar', {
                    local: { id: local.id, name: local.nome, tipo: local.tipo, bairro: local.bairro },
                  })}
                />
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: cores.fundo },
  header: { height: 84, backgroundColor: cores.primariaEscura, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 32 },
  searchWrap: {
    height: 52,
    borderWidth: 2,
    borderColor: cores.primaria,
    borderRadius: 24,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: cores.primaria,
  },
  resultNome: { fontSize: 15, fontWeight: '700', color: cores.texto },
  resultSub: { fontSize: 12, color: cores.textoSecundario, marginTop: 2 },
  criterioTag: { backgroundColor: cores.fundoCard, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  criterioTagText: { fontSize: 11, color: cores.primaria, fontWeight: '600' },
  notaBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  notaBadgeText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  avaliarBtn: { borderWidth: 1, borderColor: cores.primaria, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  avaliarBtnText: { color: cores.primaria, fontWeight: '700', fontSize: 12 },
  vazio: { alignItems: 'center', paddingVertical: 32 },
  vazioText: { color: cores.textoSecundario, marginTop: 10, textAlign: 'center' },
});

export default TelaBusca;
