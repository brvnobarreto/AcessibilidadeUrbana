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

function TelaBusca({ navigation }) {
  const [filtros, setFiltros] = useState({
    busca: '',
    tipo: 'Estabelecimento',
    bairro: 'Centro',
    nota: '2+',
    criterio: 'Elevador',
  });

  const notaMin = useMemo(() => Number(filtros.nota.replace('+', '')), [filtros.nota]);

  const resultados = useMemo(() => {
    return LOCAIS.filter((l) => {
      const okBusca = l.nome.toLowerCase().includes(filtros.busca.toLowerCase().trim());
      const okTipo = l.tipo === filtros.tipo;
      const okBairro = l.bairro === filtros.bairro;
      const okNota = l.nota >= notaMin;
      const okCrit = l.criterios.includes(filtros.criterio);
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

      <ScrollView contentContainerStyle={s.content}>
        <View style={s.searchWrap}>
          <MaterialCommunityIcons name="magnify" size={18} color={cores.textoSecundario} style={{ marginRight: 6 }} />
          <TextInput
            value={filtros.busca}
            onChangeText={(t) => setFiltros((p) => ({ ...p, busca: t }))}
            placeholder="Ex: Praça do Ferreira..."
            placeholderTextColor={cores.textoSecundario}
            style={s.searchInput}
          />
        </View>

        <Text style={s.block}>Tipo de Local</Text>
        <View style={s.row}>
          {['Rua', 'Predio', 'Estabelecimento', 'Praca'].map((i) => (
            <Chip key={i} label={i} active={filtros.tipo === i} onPress={() => setFiltros((p) => ({ ...p, tipo: i }))} />
          ))}
        </View>

        <Text style={s.block}>Bairro / Região</Text>
        <View style={s.row}>
          {['Centro', 'Zona Sul', 'Zona Norte', 'Zona Leste'].map((i) => (
            <Chip key={i} label={i} active={filtros.bairro === i} onPress={() => setFiltros((p) => ({ ...p, bairro: i }))} />
          ))}
        </View>

        <Text style={s.block}>Nota Mínima</Text>
        <View style={s.row}>
          {['1+', '2+', '3+', '4+'].map((i) => (
            <Chip key={i} label={i} active={filtros.nota === i} onPress={() => setFiltros((p) => ({ ...p, nota: i }))} />
          ))}
        </View>

        <Text style={s.block}>Critério</Text>
        <View style={s.row}>
          {['Rampa', 'Calcada', 'Sinalizacao', 'Elevador'].map((i) => (
            <Chip key={i} label={i} active={filtros.criterio === i} onPress={() => setFiltros((p) => ({ ...p, criterio: i }))} />
          ))}
        </View>

        <TouchableOpacity
          style={s.btn}
          onPress={() => navigation.navigate('Ranking', { listaBase: resultados })}>
          <Text style={s.btnTxt}>APLICAR FILTROS ({resultados.length})</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: cores.fundo },
  header: { height: 84, backgroundColor: cores.primariaEscura, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 24 },
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
  block: { marginTop: 16, color: cores.texto, fontSize: 18, fontWeight: '700' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  chip: { borderWidth: 1, borderColor: cores.borda, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#fff' },
  chipActive: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  chipText: { color: cores.textoSecundario, fontSize: 15 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  btn: { marginTop: 24, height: 54, borderRadius: 14, backgroundColor: cores.primaria, alignItems: 'center', justifyContent: 'center' },
  btnTxt: { color: '#fff', fontSize: 17, fontWeight: '700' },
});

export default TelaBusca;
