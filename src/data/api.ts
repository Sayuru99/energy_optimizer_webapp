import type { Machine, PortalData, SignupInput, User } from '@/types';

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
const DUMMY_DATA_URL = '/dummy.json';
const DUMMY_STORAGE_KEY = 'apex-energy-dummy-data';
const TOKEN_STORAGE_KEY = 'apex-energy-token';
let cache: PortalData | null = null;

export const isBackendMode = Boolean(API_BASE_URL);

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders(), ...(options?.headers ?? {}) },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { detail?: string; message?: string } | null;
    throw new Error(body?.detail ?? body?.message ?? `Request failed with status ${response.status}.`);
  }
  return response.status === 204 ? (undefined as T) : await response.json() as T;
}

async function getDummyData(): Promise<PortalData> {
  const stored = localStorage.getItem(DUMMY_STORAGE_KEY);
  if (stored) return JSON.parse(stored) as PortalData;
  const response = await fetch(DUMMY_DATA_URL);
  if (!response.ok) throw new Error('Unable to load the local demo data.');
  const data = await response.json() as PortalData;
  localStorage.setItem(DUMMY_STORAGE_KEY, JSON.stringify(data));
  return data;
}

function saveDummyData(data: PortalData) {
  cache = data;
  localStorage.setItem(DUMMY_STORAGE_KEY, JSON.stringify(data));
}

function unwrapUser(payload: unknown, fallback?: User): User {
  const body = payload as { token?: string; access_token?: string; user?: User; data?: { token?: string; access_token?: string; user?: User } };
  const token = body.token ?? body.access_token ?? body.data?.token ?? body.data?.access_token;
  if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
  const user = body.user ?? body.data?.user ?? (payload as User);
  if (user && typeof user === 'object' && 'email' in user) return user;
  if (fallback) return fallback;
  throw new Error('The server returned an invalid user response.');
}

export async function fetchData(): Promise<PortalData> {
  if (cache) return cache;
  if (isBackendMode) {
    const [facility, machines, tariffs, dashboard] = await Promise.all([
      request<PortalData['facility']>('/api/v1/factories/me'),
      request<Machine[]>('/api/v1/machines'),
      request<PortalData['tariffs']>('/api/v1/tariffs'),
      request<PortalData['optimization']>('/api/v1/dashboard'),
    ]);
    cache = { users: [], facility, machines, tariffs, optimization: dashboard, reports: [] };
    return cache;
  }
  cache = await getDummyData();
  return cache;
}

export async function authenticate(email: string, password: string): Promise<User | null> {
  if (isBackendMode) {
    const formData = new URLSearchParams();
    formData.append('username', email);   // must be "username"
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.detail ?? 'Login failed');
    }

    const payload = await response.json();
    return unwrapUser(payload, {
      id: 'authenticated',
      email,
      name: email.split('@')[0],
      role: 'Plant Manager',
      facilityCode: '',
      facilityName: '',
    });
  }

  // dummy mode remains the same
  const data = await fetchData();
  return data.users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  ) ?? null;
}

export async function signup(input: SignupInput): Promise<User> {
  if (isBackendMode) {
    const payload = await request<unknown>('/api/v1/auth/signup', { method: 'POST', body: JSON.stringify(input) });
    const user = unwrapUser(payload, { id: 'new-user', email: input.email, name: input.name, role: 'Plant Manager', facilityCode: '', facilityName: input.factoryName });
    if (!localStorage.getItem(TOKEN_STORAGE_KEY)) await authenticate(input.email, input.password);
    return user;
  }
  const data = await fetchData();
  if (data.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) throw new Error('An account with this email already exists.');
  const user: User = { id: `USR-${Date.now()}`, email: input.email, password: input.password, name: input.name, role: 'Plant Manager', facilityCode: `${input.factoryName.slice(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`, facilityName: input.factoryName };
  data.users.push(user);
  saveDummyData(data);
  return user;
}

export async function createMachine(machine: Omit<Machine, 'id'>): Promise<Machine> {
  if (isBackendMode) return request<Machine>('/api/v1/machines', { method: 'POST', body: JSON.stringify(machine) });
  const data = await fetchData();
  const created = { ...machine, id: `MCH-${Date.now()}` };
  data.machines.push(created);
  saveDummyData(data);
  return created;
}

export async function updateMachine(id: string, machine: Partial<Machine>): Promise<Machine> {
  if (isBackendMode) return request<Machine>(`/api/v1/machines/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(machine) });
  const data = await fetchData();
  const index = data.machines.findIndex((item) => item.id === id);
  if (index < 0) throw new Error('Machine not found.');
  data.machines[index] = { ...data.machines[index], ...machine };
  saveDummyData(data);
  return data.machines[index];
}

export async function deleteMachine(id: string): Promise<void> {
  if (isBackendMode) { await request<void>(`/api/v1/machines/${encodeURIComponent(id)}`, { method: 'DELETE' }); return; }
  const data = await fetchData();
  data.machines = data.machines.filter((item) => item.id !== id);
  saveDummyData(data);
}

export async function updateFactory(factory: Partial<PortalData['facility']>): Promise<PortalData['facility']> {
  if (isBackendMode) return request<PortalData['facility']>('/api/v1/factories/me', { method: 'PUT', body: JSON.stringify(factory) });
  const data = await fetchData();
  data.facility = { ...data.facility, ...factory };
  saveDummyData(data);
  return data.facility;
}

export async function runOptimization(): Promise<PortalData['optimization']> {
  if (isBackendMode) return request<PortalData['optimization']>('/api/v1/optimize', { method: 'POST', body: JSON.stringify({}) });
  return (await fetchData()).optimization;
}

export async function getMachines() { return (await fetchData()).machines; }
export async function getOptimization() { return (await fetchData()).optimization; }
export async function getFacility() { return (await fetchData()).facility; }
export async function getTariffs() { return (await fetchData()).tariffs; }
export async function getReports() { return (await fetchData()).reports; }
