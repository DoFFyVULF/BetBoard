/**
 * BetBoard API Client
 * Connects frontend to NestJS backend at /api
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...fetchOptions } = options;

  const url = new URL(`${API_BASE}${endpoint}`, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Add auth token if available
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('betboard_token');
    if (token) {
      (defaultHeaders as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url.toString(), {
    ...fetchOptions,
    headers: defaultHeaders,
    credentials: 'include', // For cookie-based auth if needed
  });

  // Читаем тело как текст один раз — fetch не позволяет прочитать тело дважды.
  // Это защищает от "Unexpected end of JSON input" при пустом ответе
  // (например, 404 без тела или разрыв сети).
  const text = await response.text();

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    if (text) {
      try {
        const error = JSON.parse(text);
        message = error.message || message;
      } catch {
        // Тело не JSON — оставляем стандартный текст.
      }
    }
    throw new Error(message);
  }

  if (response.status === 204 || !text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Ответ не является JSON (HTTP ${response.status})`);
  }
}

export const api = {
  // Auth
  auth: {
    register: (data: { name: string; login: string; password: string }) =>
      request<{ user: any; accessToken: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    login: (data: { login: string; password: string }) =>
      request<{ user: any; accessToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    me: () => request<any>('/auth/me'),
  },

  // Boards
  boards: {
    list: () => request<any[]>('/boards'),
    get: (id: string) => request<any>(`/boards/${id}`),
    getBySlug: (slug: string) => request<any>(`/boards/slug/${slug}`),
    create: (data: { name: string; slug: string; description?: string; currencyName?: string }) =>
      request<any>('/boards', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<{ name: string; description: string }>) =>
      request<any>(`/boards/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/boards/${id}`, { method: 'DELETE' }),

    // Members
    getMembers: (boardId: string) => request<any[]>(`/boards/${boardId}/members`),
    invite: (boardId: string, data: { email?: string; userId?: string; role?: string }) =>
      request<any>(`/boards/${boardId}/members`, { method: 'POST', body: JSON.stringify(data) }),
    updateMember: (boardId: string, userId: string, data: { role?: string; title?: string }) =>
      request<any>(`/boards/${boardId}/members/${userId}`, { method: 'PATCH', body: JSON.stringify(data) }),
    removeMember: (boardId: string, userId: string) =>
      request<void>(`/boards/${boardId}/members/${userId}`, { method: 'DELETE' }),
    joinByCode: (inviteCode: string) =>
      request<any>(`/boards/join/${encodeURIComponent(inviteCode)}`, { method: 'POST' }),
  },

  // Seasons
  seasons: {
    list: (boardId: string) => request<any[]>(`/boards/${boardId}/seasons`),
    get: (id: string) => request<any>(`/seasons/${id}`),
    getActive: (boardId: string) => request<any>(`/boards/${boardId}/seasons/active`),
    start: (boardId: string, data: { name: string; startingBalance?: number; startsAt?: string; endsAt?: string }) =>
      request<any>(`/boards/${boardId}/seasons`, { method: 'POST', body: JSON.stringify(data) }),
    finish: (boardId: string) => request<any>(`/boards/${boardId}/seasons/finish`, { method: 'POST' }),
  },

  // Events
  events: {
    list: (boardId: string, seasonId?: string) =>
      request<any[]>(`/boards/${boardId}/events`, { params: { seasonId } }),
    get: (eventId: string) => request<any>(`/events/${eventId}`),
    create: (boardId: string, data: any) =>
      request<any>(`/boards/${boardId}/events`, { method: 'POST', body: JSON.stringify(data) }),
    update: (eventId: string, data: any) =>
      request<any>(`/events/${eventId}`, { method: 'PATCH', body: JSON.stringify(data) }),
    open: (eventId: string) => request<any>(`/events/${eventId}/open`, { method: 'POST' }),
    close: (eventId: string) => request<any>(`/events/${eventId}/close`, { method: 'POST' }),
    cancel: (eventId: string) => request<any>(`/events/${eventId}/cancel`, { method: 'POST' }),
    delete: (eventId: string) => request<void>(`/events/${eventId}`, { method: 'DELETE' }),

    // Pool summary
    getPool: (eventId: string) => request<any>(`/events/${eventId}/pool`),
  },

  // Bets
  bets: {
    place: (eventId: string, data: { outcomeId: string; amount: number }) =>
      request<any>(`/events/${eventId}/bets`, { method: 'POST', body: JSON.stringify(data) }),
    getMyBets: (eventId?: string) => request<any[]>('/me/bets', { params: { eventId } }),
    getEventBets: (eventId: string) => request<any[]>(`/events/${eventId}/bets`),
  },

  // Resolve
  resolve: {
    resolveEvent: (eventId: string, data: { winningOutcomeIds: string[] }) =>
      request<any>(`/events/${eventId}/resolve`, { method: 'POST', body: JSON.stringify(data) }),
    getResolution: (eventId: string) => request<any>(`/events/${eventId}/resolution`),
    adjustBalance: (data: { userId: string; amount: number; reason?: string }) =>
      request<any>('/wallet/adjust', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Wallet
  // Бекенд держит вложенный маршрут: /seasons/:seasonId/wallet/...
  wallet: {
    get: (seasonId: string, userId: string) =>
      request<any>(`/seasons/${seasonId}/wallet/${userId}`),
    getLedger: (seasonId: string, userId: string) =>
      request<any[]>(`/seasons/${seasonId}/wallet/${userId}/ledger`),
    getSummary: (seasonId: string, userId: string) =>
      request<any>(`/seasons/${seasonId}/wallet/${userId}/summary`),
  },

  // Leaderboard
  leaderboard: {
    getSeason: (seasonId: string) => request<any>(`/seasons/${seasonId}/leaderboard`),
    getBoard: (boardId: string) => request<any>(`/boards/${boardId}/leaderboard`),
    getMyRank: (seasonId: string) => request<any>(`/me/rank`, { params: { seasonId } }),
  },

  // Comments
  comments: {
    list: (eventId: string, page?: number, limit?: number) =>
      request<any>(`/events/${eventId}/comments`, { params: { page, limit } }),
    create: (eventId: string, data: { text: string }) =>
      request<any>(`/events/${eventId}/comments`, { method: 'POST', body: JSON.stringify(data) }),
    delete: (commentId: string) => request<void>(`/comments/${commentId}`, { method: 'DELETE' }),
  },

  // Reactions
  reactions: {
    list: (eventId: string) => request<any[]>(`/events/${eventId}/reactions`),
    add: (eventId: string, emoji: string) =>
      request<any>(`/events/${eventId}/reactions`, { method: 'POST', body: JSON.stringify({ emoji }) }),
    remove: (eventId: string, emoji: string) =>
      request<void>(`/events/${eventId}/reactions/${emoji}`, { method: 'DELETE' }),
  },
};

// Токен дублируется в cookie (`betboard_token`), чтобы SSR (Server Components)
// мог читать его через `cookies()` из next/headers и отправлять в вызовах API.
// Cookie не httpOnly — browser-клиент и так хранит токен в localStorage,
// а серверной стороне нужен доступ к значению.
const TOKEN_COOKIE = 'betboard_token';
const TOKEN_COOKIE_ATTRS = 'path=/; max-age=' + 60 * 60 * 24 * 30 + '; SameSite=Lax';

export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_COOKIE, token);
    document.cookie = `${TOKEN_COOKIE}=${token}; ${TOKEN_COOKIE_ATTRS}`;
  }
}

export function clearAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_COOKIE);
    document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0`;
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('betboard_token');
  }
  return null;
}