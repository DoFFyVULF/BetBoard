/**
 * BetBoard API Client for Server Components
 * Connects frontend to NestJS backend at /api
 */

import { cookies } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...fetchOptions } = options;

  const url = new URL(`${API_BASE}${endpoint}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  // Токен берём из cookie (его пишет browser-клиент при входе), чтобы
  // защищённые JwtAuthGuard эндпоинты не отдавали 401 при SSR-рендере.
  const token = (await cookies()).get('betboard_token')?.value;
  const authHeader: HeadersInit = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...authHeader,
    ...headers,
  };

  const response = await fetch(url.toString(), {
    ...fetchOptions,
    headers: defaultHeaders,
    cache: 'no-store', // Always fetch fresh data
  });

  const text = await response.text();

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    if (text) {
      try {
        const error = JSON.parse(text);
        message = error.message || message;
      } catch {
        // не JSON — оставляем стандартный текст
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

export const serverApi = {
  // Auth
  auth: {
    me: () => request<any>(`/auth/me`),
  },

  // Boards
  boards: {
    getBySlug: (slug: string) => request<any>(`/boards/slug/${slug}`),
    get: (id: string) => request<any>(`/boards/${id}`),
    getMembers: (boardId: string) => request<any[]>(`/boards/${boardId}/members`),
  },

  // Seasons
  seasons: {
    getActive: (boardId: string) => request<any>(`/boards/${boardId}/seasons/active`),
    list: (boardId: string) => request<any[]>(`/boards/${boardId}/seasons`),
  },

  // Events
  events: {
    list: (boardId: string, seasonId?: string) =>
      request<any[]>(`/boards/${boardId}/events`, { params: { seasonId } }),
    get: (eventId: string) => request<any>(`/events/${eventId}`),
    getPool: (eventId: string) => request<any>(`/events/${eventId}/pool`),
  },

  // Wallet
  wallet: {
    getSummary: (seasonId: string, userId: string) =>
      request<any>(`/seasons/${seasonId}/wallet/${userId}/summary`),
    getLedger: (seasonId: string, userId: string) =>
      request<any[]>(`/seasons/${seasonId}/wallet/${userId}/ledger`),
  },

  // Bets
  bets: {
    getMyBets: (eventId?: string) =>
      request<any[]>(`/me/bets`, { params: { eventId } }),
    getEventBets: (eventId: string) => request<any[]>(`/events/${eventId}/bets`),
    getPool: (eventId: string) => request<any>(`/events/${eventId}/pool`),
  },

  // Leaderboard
  leaderboard: {
    getSeason: (seasonId: string) => request<any>(`/seasons/${seasonId}/leaderboard`),
    getBoard: (boardId: string) => request<any>(`/boards/${boardId}/leaderboard`),
  },

  // Oracle profile
  oracle: {
    get: (seasonId: string, userId: string) =>
      request<any>(`/seasons/${seasonId}/oracle/${userId}`),
  },

  // Comments
  comments: {
    list: (eventId: string, page?: number, limit?: number) =>
      request<any>(`/events/${eventId}/comments`, { params: { page, limit } }),
  },

  // Reactions
  reactions: {
    list: (eventId: string) => request<any[]>(`/events/${eventId}/reactions`),
  },
};