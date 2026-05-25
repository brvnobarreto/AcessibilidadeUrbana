import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setUnauthorizedHandler } from '../lib/api';

const TOKEN_KEY = '@acessivel:token';
const USER_KEY  = '@acessivel:user';
const API_URL   = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

const AuthContext = createContext({
  user: null,
  token: null,
  carregandoSessao: true,
  entrar: async () => {},
  sair: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser]                   = useState(null);
  const [token, setToken]                 = useState(null);
  const [carregandoSessao, setCarregando] = useState(true);

  useEffect(() => {
    (async () => {
      const t = await AsyncStorage.getItem(TOKEN_KEY);
      const u = await AsyncStorage.getItem(USER_KEY);
      if (t && u) {
        try {
          const res = await fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${t}` },
          });
          if (res.ok) {
            setToken(t);
            setUser(JSON.parse(u));
          } else {
            await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
          }
        } catch {
          // sem rede — restaura sessão localmente e tenta de novo depois
          setToken(t);
          setUser(JSON.parse(u));
        }
      }
      setCarregando(false);
    })();
  }, []);

  const entrar = async (tokenRecebido, userRecebido) => {
    await AsyncStorage.setItem(TOKEN_KEY, tokenRecebido);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(userRecebido));
    setToken(tokenRecebido);
    setUser(userRecebido);
  };

  const sair = async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    setUnauthorizedHandler(sair);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, carregandoSessao, entrar, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
