import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Callout, PROVIDER_DEFAULT } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { cores } from '../styles';
import { mapaApi } from '../lib/api';

const FILTROS = [
  { id: 'todos',     label: 'Todos' },
  { id: 'rampas',    label: 'Rampas' },
  { id: 'calcadas',  label: 'Calçadas' },
  { id: '4estrelas', label: '4★+' },
];

const REGIAO_INICIAL = {
  latitude: -3.7319,
  longitude: -38.5267,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const LOCAIS_MOCK = [
  { id: 'm1', name: 'Praça do Ferreira',        avg_rating: 4.3, accessibility_level: 'green',  latitude: -3.7280, longitude: -38.5270 },
  { id: 'm2', name: 'Mercado Central',           avg_rating: 4.2, accessibility_level: 'green',  latitude: -3.7295, longitude: -38.5180 },
  { id: 'm3', name: 'Catedral Metropolitana',    avg_rating: 3.0, accessibility_level: 'orange', latitude: -3.7320, longitude: -38.5240 },
  { id: 'm4', name: 'Theatro José de Alencar',   avg_rating: 3.8, accessibility_level: 'green',  latitude: -3.7290, longitude: -38.5320 },
  { id: 'm5', name: 'Passeio Público',           avg_rating: 2.0, accessibility_level: 'red',    latitude: -3.7345, longitude: -38.5290 },
  { id: 'm6', name: 'Shopping Iguatemi Bosque',  avg_rating: 5.0, accessibility_level: 'green',  latitude: -3.7445, longitude: -38.4822 },
  { id: 'm7', name: 'Beira-Mar de Fortaleza',    avg_rating: 4.8, accessibility_level: 'green',  latitude: -3.7202, longitude: -38.5018 },
  { id: 'm8', name: 'Centro Dragão do Mar',      avg_rating: 4.7, accessibility_level: 'green',  latitude: -3.7248, longitude: -38.5213 },
  { id: 'm9', name: 'Terminal Papicu',           avg_rating: 4.5, accessibility_level: 'green',  latitude: -3.7423, longitude: -38.4838 },
  { id: 'm10', name: 'Parque do Cocó',           avg_rating: 4.4, accessibility_level: 'green',  latitude: -3.7477, longitude: -38.4914 },
  { id: 'm11', name: 'Vila do Mar',              avg_rating: 4.2, accessibility_level: 'green',  latitude: -3.7083, longitude: -38.5678 },
  { id: 'm12', name: 'CUCA Mondubim',            avg_rating: 4.1, accessibility_level: 'green',  latitude: -3.7772, longitude: -38.5778 },
];

const corDoNivel = {
  green:  cores.primaria,
  orange: '#E67E22',
  red:    '#DC2626',
};

const nivelLabel = {
  green:  'Acessível',
  orange: 'Parcial',
  red:    'Crítico',
};

function TelaInicial({ navigation }) {
  const insets = useSafeAreaInsets();
  const [locais, setLocais] = useState(LOCAIS_MOCK);
  const [filtro, setFiltro] = useState('todos');

  useEffect(() => {
    let cancelado = false;
    mapaApi
      .listar(filtro)
      .then((dados) => { if (!cancelado) setLocais(dados ?? []); })
      .catch((err) => console.warn('[mapa] API offline, usando mock:', err.message));
    return () => { cancelado = true; };
  }, [filtro]);

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <Text style={s.headerTitulo}>Mapa de Acessibilidade</Text>
      </View>

      <View style={s.mapaWrapper}>
        <MapView
          provider={PROVIDER_DEFAULT}
          style={s.mapa}
          initialRegion={REGIAO_INICIAL}>
          {locais.map((p) => {
            const cor   = corDoNivel[p.accessibility_level ?? 'orange'];
            const nivel = nivelLabel[p.accessibility_level ?? 'orange'];

            return (
              <Marker
                key={p.id}
                coordinate={{ latitude: p.latitude, longitude: p.longitude }}>

                {/* Marcador colorido */}
                <View style={[s.marker, { backgroundColor: cor }]}>
                  <MaterialCommunityIcons
                    name={p.accessibility_level === 'red' ? 'alert' : 'wheelchair-accessibility'}
                    size={14}
                    color="#fff"
                  />
                </View>

                {/* Popup que aparece ao tocar no marcador */}
                <Callout
                  tooltip
                  onPress={() =>
                    navigation.navigate('DetalhesLocal', {
                      local: {
                        id:         p.id,
                        name:       p.name,
                        avg_rating: p.avg_rating ?? 0,
                        category:   p.category  ?? '',
                        address:    p.address   ?? '',
                      },
                    })
                  }>
                  <View style={s.callout}>
                    {/* Cabeçalho colorido */}
                    <View style={[s.calloutBadge, { backgroundColor: cor }]}>
                      <Text style={s.calloutBadgeTexto}>{nivel}</Text>
                    </View>

                    <Text style={s.calloutNome} numberOfLines={2}>{p.name}</Text>

                    <View style={s.calloutRating}>
                      <MaterialCommunityIcons name="star" size={14} color="#F59E0B" />
                      <Text style={s.calloutRatingTexto}>
                        {Number(p.avg_rating ?? 0).toFixed(1)}
                      </Text>
                    </View>

                    <View style={[s.calloutBtnVer, { backgroundColor: cor }]}>
                      <Text style={s.calloutBtnVerTexto}>Ver detalhes</Text>
                      <MaterialCommunityIcons name="chevron-right" size={14} color="#fff" />
                    </View>

                    {/* Triângulo da bolha */}
                    <View style={s.calloutSeta} />
                  </View>
                </Callout>
              </Marker>
            );
          })}
        </MapView>
      </View>

      {/* Filtros */}
      <View style={s.filtros}>
        {FILTROS.map((f) => (
          <TouchableOpacity
            key={f.id}
            onPress={() => setFiltro(f.id)}
            style={[s.filtroChip, filtro === f.id && s.filtroChipAtivo]}>
            <Text style={[s.filtroTexto, filtro === f.id && s.filtroTextoAtivo]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Legenda */}
      <View style={s.legenda}>
        {[
          { cor: cores.primaria, label: 'Acessível' },
          { cor: '#E67E22',      label: 'Parcial'   },
          { cor: '#DC2626',      label: 'Crítico'   },
        ].map(({ cor, label }) => (
          <View key={label} style={s.legendaItem}>
            <View style={[s.legendaBolinha, { backgroundColor: cor }]} />
            <Text style={s.legendaTexto}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: cores.fundo },
  header:       { backgroundColor: cores.primariaEscura, paddingBottom: 14, paddingHorizontal: 20 },
  headerTitulo: { color: cores.fundo, fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  mapaWrapper:  { flex: 1 },
  mapa:         { flex: 1 },

  // Marcador circular
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },

  // Popup / callout
  callout: {
    width: 180,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
    alignItems: 'flex-start',
  },
  calloutBadge:      { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 6 },
  calloutBadgeTexto: { color: '#fff', fontSize: 11, fontWeight: '700' },
  calloutNome:       { fontSize: 14, fontWeight: '700', color: cores.texto, marginBottom: 4, lineHeight: 18 },
  calloutRating:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  calloutRatingTexto:{ fontSize: 13, fontWeight: '600', color: cores.texto },
  calloutBtnVer:     { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, alignSelf: 'stretch', justifyContent: 'center' },
  calloutBtnVerTexto:{ color: '#fff', fontWeight: '700', fontSize: 13 },
  calloutSeta: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#fff',
    alignSelf: 'center',
    marginTop: 6,
  },

  // Filtros
  filtros:        { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 16, gap: 8 },
  filtroChip:     { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: cores.borda, backgroundColor: cores.fundo },
  filtroChipAtivo:{ backgroundColor: cores.primaria, borderColor: cores.primaria },
  filtroTexto:    { color: cores.texto, fontSize: 13, fontWeight: '600' },
  filtroTextoAtivo: { color: cores.fundo },

  // Legenda
  legenda:      { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 12, gap: 16 },
  legendaItem:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendaBolinha: { width: 10, height: 10, borderRadius: 5 },
  legendaTexto: { fontSize: 12, color: cores.textoSecundario },
});

export default TelaInicial;
