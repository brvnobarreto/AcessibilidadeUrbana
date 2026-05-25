import { useState, useMemo } from 'react';
import {
  Text, View, TextInput, TouchableOpacity,
  Alert, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { cores } from '../styles';
import { reviewsApi } from '../lib/api';
import { LOCAIS } from '../lib/dadosAcessibilidade';

const CRITERIOS = [
  { key: 'ramp',                label: 'Rampa de acesso',           icone: 'wheelchair-accessibility' },
  { key: 'sidewalk',            label: 'Calçada em boas condições', icone: 'road'          },
  { key: 'sound_signaling',     label: 'Sinalização sonora',        icone: 'volume-high'   },
  { key: 'tactile_floor',       label: 'Piso tátil',                icone: 'dots-grid'     },
  { key: 'disabled_parking',    label: 'Vaga para deficiente',      icone: 'parking'       },
  { key: 'elevator',            label: 'Elevador / plataforma',     icone: 'elevator'      },
  { key: 'accessible_bathroom', label: 'Banheiro acessível',        icone: 'toilet'        },
];

const NOTA_LABEL = ['', 'Péssimo', 'Ruim', 'Regular', 'Bom', 'Ótimo'];

function Estrelas({ valor, onChange }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginVertical: 8 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onChange(n)}>
          <MaterialCommunityIcons
            name={n <= valor ? 'star' : 'star-outline'}
            size={36}
            color="#F59E0B"
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function TelaAvaliar({ route, navigation }) {
  const insets = useSafeAreaInsets();

  // Funciona tanto chamada de DetalhesLocal (com local) quanto da aba Avaliar (sem params)
  const localParam = route?.params?.local ?? null;
  const [localSelecionadoId, setLocalSelecionadoId] = useState(
    localParam ? null : LOCAIS[0]?.id ?? null
  );

  const localAtivo = useMemo(() => {
    if (localParam) return localParam;
    return LOCAIS.find((l) => l.id === localSelecionadoId) ?? null;
  }, [localParam, localSelecionadoId]);

  const [rating, setRating]       = useState(0);
  const [comment, setComment]     = useState('');
  const [checklist, setChecklist] = useState({
    ramp: false, sidewalk: false, sound_signaling: false,
    tactile_floor: false, disabled_parking: false,
    elevator: false, accessible_bathroom: false,
  });
  const [carregando, setCarregando] = useState(false);

  const toggleCriterio = (key) =>
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleEnviar = async () => {
    if (!localAtivo) {
      Alert.alert('Atenção', 'Selecione um local para avaliar.');
      return;
    }
    if (rating === 0) {
      Alert.alert('Atenção', 'Selecione uma nota de 1 a 5.');
      return;
    }
    setCarregando(true);
    try {
      await reviewsApi.criar({
        place_id: localAtivo.id,
        rating,
        comment: comment.trim() || undefined,
        ...checklist,
      });
      Alert.alert('Avaliação enviada!', 'Obrigado pela sua contribuição.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Erro', err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={cores.fundo} />
        </TouchableOpacity>
        <Text style={s.headerTitulo}>Avaliar Local</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}>

        <View style={s.corpo}>

          {/* Seleção de local — visível apenas quando aberta sem params (aba Avaliar) */}
          {!localParam && (
            <>
              <Text style={s.secaoTitulo}>Selecionar local</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                {LOCAIS.map((l) => (
                  <TouchableOpacity
                    key={l.id}
                    onPress={() => setLocalSelecionadoId(l.id)}
                    style={[s.localChip, localSelecionadoId === l.id && s.localChipAtivo]}>
                    <Text style={[s.localChipTexto, localSelecionadoId === l.id && s.localChipTextoAtivo]} numberOfLines={1}>
                      {l.nome}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {localAtivo && (
            <>
              <Text style={s.localNome}>{localAtivo.name ?? localAtivo.nome}</Text>
              {(localAtivo.category || localAtivo.address || localAtivo.tipo) ? (
                <Text style={s.localCategoria}>
                  {[localAtivo.category ?? localAtivo.tipo, localAtivo.address ?? localAtivo.bairro]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              ) : null}
            </>
          )}

          {/* Nota geral */}
          <View style={s.secao}>
            <Text style={s.secaoTitulo}>Nota geral *</Text>
            <Estrelas valor={rating} onChange={setRating} />
            <Text style={s.notaLabel}>{NOTA_LABEL[rating] || ''}</Text>
          </View>

          {/* Comentário */}
          <View style={s.secao}>
            <Text style={s.secaoTitulo}>Comentário (opcional)</Text>
            <TextInput
              style={[s.input, { height: 90, textAlignVertical: 'top' }]}
              placeholder="Descreva sua experiência..."
              placeholderTextColor={cores.textoSecundario}
              value={comment}
              onChangeText={setComment}
              multiline
            />
          </View>

          {/* Critérios de acessibilidade */}
          <View style={s.secao}>
            <Text style={s.secaoTitulo}>Critérios de acessibilidade</Text>
            <Text style={s.secaoDesc}>Marque o que este local possui:</Text>
            {CRITERIOS.map(({ key, label, icone }) => (
              <TouchableOpacity
                key={key}
                style={s.criterioLinha}
                onPress={() => toggleCriterio(key)}
                activeOpacity={0.7}>
                <MaterialCommunityIcons
                  name={icone}
                  size={20}
                  color={checklist[key] ? cores.primaria : cores.textoSecundario}
                />
                <Text style={[s.criterioLabel, checklist[key] && s.criterioLabelAtivo]}>
                  {label}
                </Text>
                <View style={[s.toggle, checklist[key] && s.toggleAtivo]}>
                  {checklist[key] && (
                    <MaterialCommunityIcons name="check" size={14} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[s.botao, carregando && { opacity: 0.7 }]}
            onPress={handleEnviar}
            disabled={carregando}>
            {carregando
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.botaoTexto}>ENVIAR AVALIAÇÃO</Text>
            }
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: cores.fundo },
  header:          { backgroundColor: cores.primariaEscura, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16 },
  headerTitulo:    { color: cores.fundo, fontSize: 18, fontWeight: 'bold' },
  corpo:           { padding: 20 },
  localNome:       { fontSize: 20, fontWeight: 'bold', color: cores.texto, marginTop: 8 },
  localCategoria:  { fontSize: 13, color: cores.textoSecundario, marginTop: 4, textTransform: 'capitalize' },
  localChip:       { borderWidth: 1, borderColor: cores.borda, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14, marginRight: 8, backgroundColor: '#fff' },
  localChipAtivo:  { backgroundColor: cores.primaria, borderColor: cores.primaria },
  localChipTexto:  { color: cores.textoSecundario, fontSize: 13 },
  localChipTextoAtivo: { color: '#fff', fontWeight: '600' },
  secao:           { marginTop: 24 },
  secaoTitulo:     { fontSize: 15, fontWeight: '700', color: cores.texto, marginBottom: 8 },
  secaoDesc:       { fontSize: 13, color: cores.textoSecundario, marginBottom: 12 },
  notaLabel:       { fontSize: 14, color: cores.textoSecundario, marginTop: 4 },
  input:           { borderWidth: 1, borderColor: cores.borda, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: cores.texto, backgroundColor: '#fff' },
  criterioLinha:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', gap: 12 },
  criterioLabel:   { flex: 1, fontSize: 14, color: cores.texto },
  criterioLabelAtivo: { color: cores.primaria },
  toggle:          { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: cores.borda, justifyContent: 'center', alignItems: 'center' },
  toggleAtivo:     { backgroundColor: cores.primaria, borderColor: cores.primaria },
  botao:           { marginTop: 32, backgroundColor: cores.primaria, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  botaoTexto:      { color: '#fff', fontWeight: 'bold', fontSize: 15, letterSpacing: 0.5 },
});

export default TelaAvaliar;
