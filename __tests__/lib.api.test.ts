import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  ApiClientError,
  getToken,
  setToken,
  clearToken,
  isAuthenticated,
  api,
} from '../lib/api';

// ── Helpers ──────────────────────────────────────────────────────────────────

function mockFetch(status: number, body: unknown) {
  return vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

// ── ApiClientError ────────────────────────────────────────────────────────────

describe('ApiClientError', () => {
  it('debe ser instancia de Error', () => {
    const err = new ApiClientError(404, 'Not found');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApiClientError);
  });

  it('debe exponer statusCode y message', () => {
    const err = new ApiClientError(401, 'Unauthorized');
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('Unauthorized');
    expect(err.name).toBe('ApiClientError');
  });

  it('debe guardar details opcionales', () => {
    const details = { field: 'email' };
    const err = new ApiClientError(422, 'Validation error', details);
    expect(err.details).toEqual(details);
  });
});

// ── Token helpers ─────────────────────────────────────────────────────────────

describe('token helpers', () => {
  beforeEach(() => localStorage.clear());

  it('getToken devuelve null si no hay token', () => {
    expect(getToken()).toBeNull();
  });

  it('setToken / getToken roundtrip', () => {
    setToken('abc123');
    expect(getToken()).toBe('abc123');
  });

  it('clearToken elimina el token', () => {
    setToken('abc123');
    clearToken();
    expect(getToken()).toBeNull();
  });

  it('isAuthenticated es false sin token', () => {
    expect(isAuthenticated()).toBe(false);
  });

  it('isAuthenticated es true con token', () => {
    setToken('abc123');
    expect(isAuthenticated()).toBe(true);
  });
});

// ── api.get ───────────────────────────────────────────────────────────────────

describe('api.get', () => {
  afterEach(() => vi.restoreAllMocks());

  it('retorna datos en respuesta 200', async () => {
    mockFetch(200, { id: '1', name: 'Zona Centro' });
    const result = await api.get<{ id: string; name: string }>('/zones/1');
    expect(result).toEqual({ id: '1', name: 'Zona Centro' });
  });

  it('envía el header Authorization si hay token', async () => {
    setToken('token-test');
    const spy = mockFetch(200, {});
    await api.get('/zones');
    expect(spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer token-test' }),
      }),
    );
    clearToken();
  });

  it('lanza ApiClientError en respuesta 404', async () => {
    mockFetch(404, { message: 'Zona no encontrada' });
    await expect(api.get('/zones/999')).rejects.toBeInstanceOf(ApiClientError);
  });

  it('lanza ApiClientError con statusCode correcto', async () => {
    mockFetch(403, { message: 'Forbidden' });
    try {
      await api.get('/admin');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiClientError);
      expect((err as ApiClientError).statusCode).toBe(403);
    }
  });

  it('lanza ApiClientError con statusCode 0 si fetch falla', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));
    try {
      await api.get('/zones');
    } catch (err) {
      expect((err as ApiClientError).statusCode).toBe(0);
    }
  });
});

// ── api.post ──────────────────────────────────────────────────────────────────

describe('api.post', () => {
  afterEach(() => vi.restoreAllMocks());

  it('envía el body como JSON', async () => {
    const spy = mockFetch(201, { id: '1' });
    await api.post('/zones', { name: 'Nueva Zona' });
    expect(spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Nueva Zona' }),
      }),
    );
  });

  it('retorna datos creados', async () => {
    mockFetch(201, { id: 'new-1', name: 'Test' });
    const result = await api.post<{ id: string }>('/zones', { name: 'Test' });
    expect(result.id).toBe('new-1');
  });
});

// ── api.patch ─────────────────────────────────────────────────────────────────

describe('api.patch', () => {
  afterEach(() => vi.restoreAllMocks());

  it('envía método PATCH', async () => {
    const spy = mockFetch(200, { id: '1', status: 'INACTIVE' });
    await api.patch('/vehicles/1', { status: 'INACTIVE' });
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('/vehicles/1'),
      expect.objectContaining({ method: 'PATCH' }),
    );
  });
});

// ── api.delete ────────────────────────────────────────────────────────────────

describe('api.delete', () => {
  afterEach(() => vi.restoreAllMocks());

  it('envía método DELETE sin body', async () => {
    const spy = mockFetch(200, { active: false });
    await api.delete('/citizen-alarms/1');
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('/citizen-alarms/1'),
      expect.objectContaining({ method: 'DELETE', body: undefined }),
    );
  });
});
