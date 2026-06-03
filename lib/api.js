import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL    = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const TOKEN_KEY  = '@acessivel:token';
const USER_KEY   = '@acessivel:user';

let _onUnauthorized = null;
export function setUnauthorizedHandler(fn) { _onUnauthorized = fn; }

async function request(path, options = {}) {
  const token = await AsyncStorage.getItem(TOKEN_KEY);

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    _onUnauthorized?.();
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  if (!res.ok) {
    const erro = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(erro.error ?? 'Erro na requisição.');
  }

  return res.json();
}

export const api = {
  get:    (path)        => request(path),
  post:   (path, body)  => request(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (path, body)  => request(path, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: (path)        => request(path, { method: 'DELETE' }),
};

export const authApi = {
  login:         (email, password)       => api.post('/auth/login',    { email, password }),
  register:      (email, password, name) => api.post('/auth/register', { email, password, name }),
  me:             ()                            => api.get('/auth/me'),
  forgotPassword: (email)                       => api.post('/auth/forgot-password', { email }),
  resetPassword:  (email, code, newPassword)    => api.post('/auth/reset-password', { email, code, newPassword }),
  updateProfile: (dados)                 => api.put('/auth/profile', dados),
  stats:         ()                      => api.get('/auth/stats'),
};

export const placesApi = {
  listar:  (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
    ).toString();
    return api.get(`/places${qs ? `?${qs}` : ''}`);
  },
  summary:  (id)    => api.get(`/places/${id}/summary`),
  detalhes: (id)    => api.get(`/places/${id}`),
  criar:    (dados) => api.post('/places', dados),
  reviews:  (id)    => api.get(`/places/${id}/reviews`),
};

export const reviewsApi = {
  criar: (dados) => api.post('/reviews', dados),
};

export const rankingApi = {
  porRegiao: (regiao) => api.get(`/ranking${regiao ? `?region=${encodeURIComponent(regiao)}` : ''}`),
  stats:     ()       => api.get('/ranking/stats'),
  regioes:   ()       => api.get('/ranking/regioes'),
};

export const mapaApi = {
  listar: (filtro = 'todos') => api.get(`/places/map?filter=${filtro}`),
};
