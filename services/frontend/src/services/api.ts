// Configuração base da API - Considerando ambiente Docker com Nginx
const API_BASE_URL = process.env.REACT_APP_API_URL || '/';
const GENIEACS_URL =
  process.env.REACT_APP_GENIEACS_URL || 'http://localhost:7557';

export interface ApiConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
  retryAttempts?: number;
  retryDelay?: number;
}

export const defaultApiConfig: ApiConfig = {
  baseURL: API_BASE_URL,
  timeout: 30000, // 30s para operações GenieACS que podem ser lentas
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  retryAttempts: 3,
  retryDelay: 1000, // 1s
};

// Classe para gerenciar requisições HTTP com retry e fallback
export class HttpClient {
  private config: ApiConfig;

  constructor(config: ApiConfig = defaultApiConfig) {
    this.config = config;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    attemptCount = 0
  ): Promise<T> {
    const url = `${this.config.baseURL}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.config.headers,
        ...options.headers,
      },
    };

    // Adicionar timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    config.signal = controller.signal;

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Se for erro 5xx e ainda temos tentativas, retry
        if (
          response.status >= 500 &&
          attemptCount < (this.config.retryAttempts || 0)
        ) {
          console.warn(
            `Tentativa ${attemptCount + 1} falhou, tentando novamente em ${
              this.config.retryDelay
            }ms...`
          );
          await this.sleep(this.config.retryDelay || 1000);
          return this.request<T>(endpoint, options, attemptCount + 1);
        }

        throw new ApiError(
          errorData.message ||
            `HTTP ${response.status}: ${response.statusText}`,
          response.status.toString(),
          errorData
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        // Se timeout e ainda temos tentativas, retry
        if (attemptCount < (this.config.retryAttempts || 0)) {
          console.warn(
            `Timeout na tentativa ${attemptCount + 1}, tentando novamente...`
          );
          await this.sleep(this.config.retryDelay || 1000);
          return this.request<T>(endpoint, options, attemptCount + 1);
        }
        throw new ApiError(
          'Request timeout - GenieACS pode estar sobrecarregado',
          'TIMEOUT'
        );
      }

      if (
        error instanceof TypeError &&
        error.message.includes('Failed to fetch')
      ) {
        // Se erro de rede e ainda temos tentativas, retry
        if (attemptCount < (this.config.retryAttempts || 0)) {
          console.warn(
            `Erro de rede na tentativa ${
              attemptCount + 1
            }, tentando novamente...`
          );
          await this.sleep(this.config.retryDelay || 1000);
          return this.request<T>(endpoint, options, attemptCount + 1);
        }
        throw new ApiError(
          'Network error - Backend ou GenieACS podem estar offline',
          'NETWORK_ERROR'
        );
      }

      throw new ApiError('Unknown error occurred', 'UNKNOWN_ERROR', error);
    }
  }

  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    const url = params
      ? `${endpoint}?${new URLSearchParams(this.cleanParams(params))}`
      : endpoint;
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Limpa parâmetros undefined/null para URL
  private cleanParams(params: Record<string, unknown>): Record<string, string> {
    const cleaned: Record<string, string> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        cleaned[key] = String(value);
      }
    });
    return cleaned;
  }

  // Método para verificar saúde da conexão
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health');
      return true;
    } catch (error) {
      console.warn('Health check failed:', error);
      return false;
    }
  }
}

// Classe de erro customizada
export class ApiError extends Error {
  public code?: string;
  public details?: unknown;

  constructor(message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }

  // Método para verificar se é erro de conectividade
  public isNetworkError(): boolean {
    return this.code === 'NETWORK_ERROR' || this.code === 'TIMEOUT';
  }

  // Método para verificar se é erro de servidor
  public isServerError(): boolean {
    return this.code?.startsWith('5') || false;
  }

  // Método para verificar se é erro de cliente
  public isClientError(): boolean {
    return this.code?.startsWith('4') || false;
  }
}

// Instância global do cliente HTTP
export const httpClient = new HttpClient();

// Config específica para desenvolvimento (fallback)
export const devConfig = {
  useMockData:
    process.env.NODE_ENV === 'development' && !process.env.REACT_APP_API_URL,
  genieacsUrl: GENIEACS_URL,
  apiUrl: API_BASE_URL,
};
