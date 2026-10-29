import {
  Merchant,
  Order,
  Payout,
  LedgerEntry,
  AuditEvent,
  DashboardSummary,
  Milestone,
  AuthUser,
} from '../types/fintech.js';

const API_BASE = '/api';
const TOKEN_KEY = 'escrow_hub_auth_token';

export class ApiRequestError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export function removeStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

function getAuthHeaders(): HeadersInit {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function fetchAuthEndpoint(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch {
    throw new ApiRequestError(
      'Unable to reach the authentication service. Check that the local server is running.',
      0
    );
  }
}

async function handleResponse<T>(res: Response, requiresSession = true): Promise<T> {
  let data: {
    success?: boolean;
    issues?: { message: string }[];
    message?: string;
    error?: string;
    data?: unknown;
  };
  try {
    data = await res.json() as typeof data;
  } catch {
    throw new ApiRequestError(`Request failed with status ${res.status}`, res.status);
  }

  if (res.status === 401 && requiresSession) {
    removeStoredToken();
    window.dispatchEvent(new CustomEvent('escrow:session_expired'));
    throw new ApiRequestError('Authentication session expired. Please sign in again.', 401);
  }

  if (!res.ok || !data.success) {
    const errorMsg = data.issues
      ? data.issues.map((i: { message: string }) => i.message).join(', ')
      : data.message || data.error;
    throw new ApiRequestError(errorMsg || `Request failed with status ${res.status}`, res.status);
  }

  return (data.data !== undefined ? data.data : data) as T;
}

// -------------------------------------------------------------
// Authentication Endpoints
// -------------------------------------------------------------

export async function loginApi(email: string, pass: string): Promise<{ user: AuthUser; token: string }> {
  const res = await fetchAuthEndpoint(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pass }),
  });
  return handleResponse<{ user: AuthUser; token: string }>(res, false);
}

export async function registerApi(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ user: AuthUser }> {
  const res = await fetchAuthEndpoint(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse<{ user: AuthUser }>(res, false);
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const res = await fetchAuthEndpoint(`${API_BASE}/auth/me`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<{ user: AuthUser }>(res);
  return data.user;
}

export async function logoutApi(): Promise<void> {
  try {
    const res = await fetchAuthEndpoint(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    await handleResponse(res);
  } finally {
    removeStoredToken();
  }
}

// -------------------------------------------------------------
// Domain Endpoints
// -------------------------------------------------------------

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const res = await fetch(`${API_BASE}/dashboard/summary`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<DashboardSummary>(res);
}

export async function fetchMerchants(filter?: { status?: string; search?: string }): Promise<Merchant[]> {
  const params = new URLSearchParams();
  if (filter?.status) params.append('status', filter.status);
  if (filter?.search) params.append('search', filter.search);
  const res = await fetch(`${API_BASE}/merchants?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<Merchant[]>(res);
}

export async function fetchMerchantById(id: string): Promise<Merchant> {
  const res = await fetch(`${API_BASE}/merchants/${id}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<Merchant>(res);
}

export async function createMerchant(payload: {
  businessName: string;
  legalName: string;
  contactEmail: string;
  contactPhone?: string;
  bankName: string;
  accountNumberLast4: string;
  ifscCode: string;
  defaultCommissionBps: number;
  fixedFeePaise: number;
}): Promise<Merchant> {
  const res = await fetch(`${API_BASE}/merchants`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<Merchant>(res);
}

export async function updateMerchant(
  id: string,
  payload: Partial<{
    businessName: string;
    legalName: string;
    contactEmail: string;
    contactPhone?: string;
    status: string;
    bankName: string;
    accountNumberLast4: string;
    ifscCode: string;
    defaultCommissionBps: number;
    fixedFeePaise: number;
  }>
): Promise<Merchant> {
  const res = await fetch(`${API_BASE}/merchants/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<Merchant>(res);
}

export async function fetchOrders(filter?: { status?: string; search?: string }): Promise<Order[]> {
  const params = new URLSearchParams();
  if (filter?.status) params.append('status', filter.status);
  if (filter?.search) params.append('search', filter.search);
  const res = await fetch(`${API_BASE}/orders?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<Order[]>(res);
}

export async function fetchOrderById(id: string): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${id}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<Order>(res);
}

export async function createOrder(payload: {
  customerReference: string;
  customerEmail: string;
  description: string;
  totalAmountPaise: number;
  platformFeePaise: number;
  allocations: {
    merchantId: string;
    splitType: 'PERCENTAGE' | 'FIXED_AMOUNT';
    splitValue: number;
    grossAmountPaise: number;
    merchantFeePaise: number;
    netAmountPaise: number;
  }[];
}): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<Order>(res);
}

export async function approveMilestone(
  orderId: string,
  milestoneId: string,
  payload: { approvalReason: string; approvedBy?: string }
): Promise<Milestone> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/milestones/${milestoneId}/approve`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<Milestone>(res);
}

export async function fetchPayouts(filter?: { status?: string; merchantId?: string }): Promise<Payout[]> {
  const params = new URLSearchParams();
  if (filter?.status) params.append('status', filter.status);
  if (filter?.merchantId) params.append('merchantId', filter.merchantId);
  const res = await fetch(`${API_BASE}/payouts?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<Payout[]>(res);
}

export async function createPayout(
  orderId: string,
  payload: {
    merchantId: string;
    allocationId?: string;
    milestoneId?: string;
    amountPaise: number;
    payoutMethod: 'NEFT' | 'RTGS' | 'IMPS' | 'UPI';
    idempotencyKey: string;
  }
): Promise<Payout> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/payouts`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<Payout>(res);
}

export async function retryPayout(payoutId: string): Promise<Payout> {
  const res = await fetch(`${API_BASE}/payouts/${payoutId}/retry`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return handleResponse<Payout>(res);
}

export async function fetchTransactions(accountName?: string): Promise<{
  entries: LedgerEntry[];
  groupBalances: {
    entryGroupRef: string;
    debitsPaise: number;
    creditsPaise: number;
    isBalanced: boolean;
    entryCount: number;
  }[];
}> {
  const params = new URLSearchParams();
  if (accountName) params.append('accountName', accountName);
  const res = await fetch(`${API_BASE}/transactions?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<{
    entries: LedgerEntry[];
    groupBalances: {
      entryGroupRef: string;
      debitsPaise: number;
      creditsPaise: number;
      isBalanced: boolean;
      entryCount: number;
    }[];
  }>(res);
}

export async function fetchAuditLogs(filter?: { entityType?: string; search?: string }): Promise<AuditEvent[]> {
  const params = new URLSearchParams();
  if (filter?.entityType) params.append('entityType', filter.entityType);
  if (filter?.search) params.append('search', filter.search);
  const res = await fetch(`${API_BASE}/audit-logs?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<AuditEvent[]>(res);
}

export async function fetchSystemHealth() {
  const res = await fetch(`${API_BASE}/system/health`);
  return await res.json();
}

export async function seedDemoData(): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/system/seed`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return handleResponse<{ success: boolean; message: string }>(res);
}

export async function resetPlatformState(): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/system/reset`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return handleResponse<{ success: boolean; message: string }>(res);
}
