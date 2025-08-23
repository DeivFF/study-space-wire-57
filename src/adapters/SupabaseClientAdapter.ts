export interface DatabaseResult<T> {
  data: T[] | null;
  error: Error | null;
}

export interface DatabaseQuery<T> {
  select(fields?: string): DatabaseQuery<T>;
  eq(column: string, value: any): DatabaseQuery<T>;
  neq(column: string, value: any): DatabaseQuery<T>;
  gt(column: string, value: any): DatabaseQuery<T>;
  gte(column: string, value: any): DatabaseQuery<T>;
  lt(column: string, value: any): DatabaseQuery<T>;
  lte(column: string, value: any): DatabaseQuery<T>;
  like(column: string, pattern: string): DatabaseQuery<T>;
  ilike(column: string, pattern: string): DatabaseQuery<T>;
  in(column: string, values: any[]): DatabaseQuery<T>;
  is(column: string, value: any): DatabaseQuery<T>;
  order(column: string, options?: { ascending?: boolean }): DatabaseQuery<T>;
  limit(count: number): DatabaseQuery<T>;
  range(from: number, to: number): DatabaseQuery<T>;
  single(): DatabaseQuery<T>;
  maybeSingle(): DatabaseQuery<T>;
  then<TResult1 = DatabaseResult<T>, TResult2 = never>(
    onfulfilled?: ((value: DatabaseResult<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2>;
}

export interface SupabaseClient {
  from<T>(table: string): DatabaseQuery<T>;
  insert(table: string, data: any): Promise<DatabaseResult<any>>;
  update(table: string, data: any, filters?: Record<string, any>): Promise<DatabaseResult<any>>;
  delete(table: string, filters: Record<string, any>): Promise<DatabaseResult<any>>;
}

class DatabaseQueryImpl<T> implements DatabaseQuery<T> {
  private baseUrl: string;
  private table: string;
  private selectFields: string = '*';
  private filters: string[] = [];
  private orderField?: string;
  private orderDirection: 'asc' | 'desc' = 'asc';
  private limitValue?: number;

  constructor(baseUrl: string, table: string) {
    this.baseUrl = baseUrl;
    this.table = table;
  }

  select(fields?: string): DatabaseQuery<T> {
    if (fields) {
      this.selectFields = fields;
    }
    return this;
  }

  eq(column: string, value: any): DatabaseQuery<T> {
    this.filters.push(`${column}__eq=${encodeURIComponent(value)}`);
    return this;
  }

  neq(column: string, value: any): DatabaseQuery<T> {
    this.filters.push(`${column}__neq=${encodeURIComponent(value)}`);
    return this;
  }

  gt(column: string, value: any): DatabaseQuery<T> {
    this.filters.push(`${column}__gt=${encodeURIComponent(value)}`);
    return this;
  }

  gte(column: string, value: any): DatabaseQuery<T> {
    this.filters.push(`${column}__gte=${encodeURIComponent(value)}`);
    return this;
  }

  lt(column: string, value: any): DatabaseQuery<T> {
    this.filters.push(`${column}__lt=${encodeURIComponent(value)}`);
    return this;
  }

  lte(column: string, value: any): DatabaseQuery<T> {
    this.filters.push(`${column}__lte=${encodeURIComponent(value)}`);
    return this;
  }

  like(column: string, pattern: string): DatabaseQuery<T> {
    this.filters.push(`${column}__like=${encodeURIComponent(pattern)}`);
    return this;
  }

  ilike(column: string, pattern: string): DatabaseQuery<T> {
    this.filters.push(`${column}__ilike=${encodeURIComponent(pattern)}`);
    return this;
  }

  in(column: string, values: any[]): DatabaseQuery<T> {
    this.filters.push(`${column}__in=${values.map(v => encodeURIComponent(v)).join(',')}`);
    return this;
  }

  is(column: string, value: any): DatabaseQuery<T> {
    this.filters.push(`${column}__is=${encodeURIComponent(value)}`);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): DatabaseQuery<T> {
    this.orderField = column;
    this.orderDirection = options?.ascending === false ? 'desc' : 'asc';
    return this;
  }

  limit(count: number): DatabaseQuery<T> {
    this.limitValue = count;
    return this;
  }

  range(from: number, to: number): DatabaseQuery<T> {
    this.limitValue = to - from + 1;
    return this;
  }

  single(): DatabaseQuery<T> {
    this.limitValue = 1;
    return this;
  }

  maybeSingle(): DatabaseQuery<T> {
    this.limitValue = 1;
    return this;
  }

  private buildUrl(): string {
    const params = new URLSearchParams();
    
    this.filters.forEach(filter => {
      const [key, value] = filter.split('=');
      params.append(key, decodeURIComponent(value));
    });

    if (this.orderField) {
      params.append('order', `${this.orderField}:${this.orderDirection}`);
    }

    if (this.limitValue) {
      params.append('limit', this.limitValue.toString());
    }

    const queryString = params.toString();
    return `${this.baseUrl}/api/${this.table}${queryString ? `?${queryString}` : ''}`;
  }

  async execute(): Promise<DatabaseResult<T>> {
    try {
      console.log(`Executing request to: ${this.buildUrl()}`);
      
      const response = await fetch(this.buildUrl(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        data: Array.isArray(data) ? data : [data],
        error: null
      };
    } catch (error) {
      console.error(`Error executing query on ${this.table}:`, error);
      return {
        data: null,
        error: error as Error
      };
    }
  }

  async then<TResult1 = DatabaseResult<T>, TResult2 = never>(
    onfulfilled?: ((value: DatabaseResult<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    try {
      const result = await this.execute();
      return onfulfilled ? onfulfilled(result) : (result as any);
    } catch (error) {
      return onrejected ? onrejected(error) : Promise.reject(error);
    }
  }
}

class SupabaseClientAdapter implements SupabaseClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  from<T = any>(table: string): DatabaseQuery<T> {
    return new DatabaseQueryImpl<T>(this.baseUrl, table);
  }

  async insert(table: string, data: any): Promise<DatabaseResult<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/${table}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return { data: result, error: null };
    } catch (error) {
      console.error(`Error inserting into ${table}:`, error);
      return { data: null, error: error as Error };
    }
  }

  async update(table: string, data: any, filters?: Record<string, any>): Promise<DatabaseResult<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/${table}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...data, ...filters }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return { data: result, error: null };
    } catch (error) {
      console.error(`Error updating ${table}:`, error);
      return { data: null, error: error as Error };
    }
  }

  async delete(table: string, filters: Record<string, any>): Promise<DatabaseResult<any>> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        params.append(`${key}__eq`, value);
      });

      const response = await fetch(`${this.baseUrl}/api/${table}?${params.toString()}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return { data: result, error: null };
    } catch (error) {
      console.error(`Error deleting from ${table}:`, error);
      return { data: null, error: error as Error };
    }
  }
}

export const supabaseAdapter = new SupabaseClientAdapter();
