import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/auth.store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3333';

let isRefreshing = false;
let failedQueue: Array<{
  onSuccess: (token: string) => void;
  onFailed: (error: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.onFailed(error);
    } else if (token) {
      prom.onSuccess(token);
    }
  });

  failedQueue = [];
};

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Adicionar Bearer token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    try {
      const { accessToken } = useAuthStore.getState();
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    } catch (e) {
      // Store pode não estar inicializado ainda, continuar sem token
      console.debug('Auth store not ready yet');
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Tratar 401 e fazer refresh automático
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    try {
      const { refreshToken, updateAccessToken, clearAuth, setError } = useAuthStore.getState();

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // Aguardar refresh
          return new Promise((resolve, reject) => {
            failedQueue.push({
              onSuccess: (token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(api(originalRequest));
              },
              onFailed: (err) => {
                reject(err);
              },
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          if (!refreshToken) {
            throw new Error('Refresh token não disponível');
          }

          // Fazer refresh
          const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
            refresh_token: refreshToken,
          }, {
            headers: {
              Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
            },
          });

          const { access_token, refresh_token } = response.data.data;

          // Atualizar tokens no store
          updateAccessToken(access_token);
          useAuthStore.setState({ refreshToken: refresh_token });

          // Processar fila de requisições
          processQueue(null, access_token);

          // Retry com novo token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          isRefreshing = false;
          return api(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          processQueue(refreshError as Error, null);
          clearAuth();
          setError('Sessão expirada. Faça login novamente.');
          return Promise.reject(refreshError);
        }
      }
    } catch (e) {
      // Store pode não estar inicializado, rejeitar erro original
      console.debug('Auth store not ready for refresh check');
    }

    return Promise.reject(error);
  }
);

export default api;
export { api };
