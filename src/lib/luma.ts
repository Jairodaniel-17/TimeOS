const LUMA_API_URL = process.env.LUMA_API_URL || 'http://0.0.0.0:1234';
const LUMA_API_KEY = process.env.LUMA_API_KEY || 'dev';

export class LumaClient {
  private baseUrl: string;
  private headers: HeadersInit;

  constructor(baseUrl: string = LUMA_API_URL, apiKey: string = LUMA_API_KEY) {
    this.baseUrl = baseUrl;
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.message || error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // SQL Operations
  async query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
    const response = await this.request<{ rows: T[] }>('/v1/sql/query', {
      method: 'POST',
      body: JSON.stringify({ sql, params }),
    });
    return response.rows;
  }

  async exec(sql: string, params: unknown[] = []): Promise<{ rowsAffected: number }> {
    const response = await this.request<{ rows_affected: number }>('/v1/sql/exec', {
      method: 'POST',
      body: JSON.stringify({ sql, params }),
    });
    return { rowsAffected: response.rows_affected };
  }

  // State Management
  async getState<T = unknown>(key: string): Promise<{ value: T; revision: number } | null> {
    try {
      const response = await this.request<{ value: T; revision: number }>(`/v1/state/${encodeURIComponent(key)}`);
      return response;
    } catch {
      return null;
    }
  }

  async setState<T = unknown>(key: string, value: T, ifRevision?: number): Promise<{ revision: number }> {
    const body: Record<string, unknown> = { value };
    if (ifRevision !== undefined) {
      body.if_revision = ifRevision;
    }
    const response = await this.request<{ revision: number }>(`/v1/state/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    return response;
  }

  async deleteState(key: string): Promise<boolean> {
    const response = await this.request<{ deleted: boolean }>(`/v1/state/${encodeURIComponent(key)}`, {
      method: 'DELETE',
    });
    return response.deleted;
  }

  async listStates(prefix?: string, limit?: number): Promise<Array<{ key: string; value: unknown; revision: number }>> {
    const params = new URLSearchParams();
    if (prefix) params.set('prefix', prefix);
    if (limit) params.set('limit', String(limit));
    const queryString = params.toString();
    return this.request(`/v1/state${queryString ? `?${queryString}` : ''}`);
  }

  // Document Store
  async getDoc<T = unknown>(collection: string, id: string): Promise<{ doc: T; id: string; revision: number } | null> {
    try {
      return await this.request(`/v1/doc/${collection}/${encodeURIComponent(id)}`);
    } catch {
      return null;
    }
  }

  async putDoc<T = unknown>(collection: string, id: string, doc: T): Promise<{ id: string; revision: number }> {
    return this.request(`/v1/doc/${collection}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(doc),
    });
  }

  async deleteDoc(collection: string, id: string): Promise<void> {
    await this.request(`/v1/doc/${collection}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  async findDocs<T = unknown>(collection: string, filter?: Record<string, unknown>, limit?: number): Promise<Array<{ doc: T; id: string; revision: number }>> {
    const response = await this.request<{ documents: Array<{ doc: T; id: string; revision: number }> }>(
      `/v1/doc/${collection}/find`,
      {
        method: 'POST',
        body: JSON.stringify({ filter, limit }),
      }
    );
    return response.documents;
  }

  // Vector Operations
  async createCollection(name: string, dim: number, metric: 'cosine' | 'dot' = 'cosine'): Promise<void> {
    await this.request(`/v1/vector/${name}`, {
      method: 'POST',
      body: JSON.stringify({ dim, metric }),
    });
  }

  async upsertVector(collection: string, id: string, vector: number[], meta?: Record<string, unknown>): Promise<void> {
    await this.request(`/v1/vector/${collection}/upsert`, {
      method: 'POST',
      body: JSON.stringify({ id, vector, meta }),
    });
  }

  async searchVectors(
    collection: string,
    vector: number[],
    k: number,
    filters?: Record<string, unknown>
  ): Promise<Array<{ id: string; score: number; meta?: unknown }>> {
    const response = await this.request<{ hits: Array<{ id: string; score: number; meta?: unknown }> }>(
      `/v1/vector/${collection}/search`,
      {
        method: 'POST',
        body: JSON.stringify({ vector, k, filters, include_meta: true }),
      }
    );
    return response.hits;
  }

  // RAG Search
  async ragSearch(query: string, topK: number = 10, filters?: Record<string, unknown>): Promise<{
    query: string;
    results: Array<{ document: { content: string; metadata: unknown }; score: number }>;
  }> {
    return this.request('/search', {
      method: 'POST',
      body: JSON.stringify({ query, top_k: topK, filters }),
    });
  }
}

export const luma = new LumaClient();
