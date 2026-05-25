import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import TelaLogin          from './telas/TelaLogin';
import TelaCriarConta     from './telas/TelaCriarConta';
import TelaRecuperarSenha from './telas/TelaRecuperarSenha';
import TelaHome           from './telas/TelaHome';
import TelaInicial        from './telas/TelaInicial';
import TelaDetalhesLocal  from './telas/TelaDetalhesLocal';
import TelaAvaliar        from './telas/TelaAvaliar';
import TelaCadastrarLocal from './telas/TelaCadastrarLocal';
import TelaRanking        from './telas/TelaRanking';
import TelaPerfil         from './telas/TelaPerfil';
import TelaBusca               from './telas/TelaBusca';
import TelaEstatisticasRegiao  from './telas/TelaEstatisticasRegiao';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { cores } from './styles';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

// ── Aba Início: Home + Busca (Tela 4) ───────────────────────────────────────
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeList" component={TelaHome} />
      <Stack.Screen name="Busca"    component={TelaBusca} />
    </Stack.Navigator>
  );
}

// ── Aba Cadastrar ────────────────────────────────────────────────────────────
function CadastrarStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CadastrarLocalMain" component={TelaCadastrarLocal} />
    </Stack.Navigator>
  );
}

// ── Aba Perfil: Perfil → Alterar senha ──────────────────────────────────────
function PerfilStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PerfilMain"     component={TelaPerfil} />
      <Stack.Screen name="RecuperarSenha" component={TelaRecuperarSenha} />
    </Stack.Navigator>
  );
}

// ── Bottom Tabs ──────────────────────────────────────────────────────────────
function TabsApp() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: cores.primaria,
        tabBarInactiveTintColor: cores.textoSecundario,
        tabBarStyle: { paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 11, marginBottom: 2 },
      }}>
      <Tab.Screen
        name="Inicio"
        component={HomeStack}
        options={{
          tabBarLabel: 'Início',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Mapa"
        component={TelaInicial}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="map" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Cadastrar"
        component={CadastrarStack}
        options={{
          tabBarLabel: 'Cadastrar',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="plus-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Ranking"
        component={TelaRanking}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="trophy-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={PerfilStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ── Stack do app autenticado: Tabs + telas compartilhadas ────────────────────
// DetalhesLocal e Avaliar ficam ACIMA das tabs para serem acessíveis de
// qualquer aba (Início, Ranking, Mapa etc.) sem duplicar definições.
function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs"         component={TabsApp} />
      <Stack.Screen name="DetalhesLocal"       component={TelaDetalhesLocal} />
      <Stack.Screen name="Avaliar"             component={TelaAvaliar} />
      <Stack.Screen name="EstatisticasRegiao"  component={TelaEstatisticasRegiao} />
    </Stack.Navigator>
  );
}

// ── Roteador raiz (auth gate) ────────────────────────────────────────────────
function Rotas() {
  const { user, carregandoSessao } = useAuth();

  if (carregandoSessao) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={cores.primaria} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="App" component={AppStack} />
      ) : (
        <>
          <Stack.Screen name="Login"          component={TelaLogin} />
          <Stack.Screen name="CriarConta"     component={TelaCriarConta} />
          <Stack.Screen name="RecuperarSenha" component={TelaRecuperarSenha} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <Rotas />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
