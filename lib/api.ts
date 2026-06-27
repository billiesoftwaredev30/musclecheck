// lib/api.ts

export const API_BASE_URL =
  typeof window !== "undefined"
    ? "/api"
    : process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export interface ClientResponse {
  id: number;
  full_name: string;
  status: "member" | "non-member" | "subscriber" | "coach" | "helper" | "ba";
  date_joined: string;
  pt_sessions_remaining: number;
  face_descriptor?: string;
}

export interface ClientCreate {
  full_name: string;
  status: "member" | "non-member" | "subscriber" | "coach" | "helper" | "ba";
  pt_sessions_remaining?: number;
  face_descriptor?: string;
}

export interface SubscriptionCreate {
  client_id: number;
  start_date: string;
  end_date: string;
  amount_paid: number;
  pt_fee: number;
  payment_method: "cash" | "gcash";
  pt_sessions_added?: number;
}

export interface SubscriptionResponse extends SubscriptionCreate {
  id: number;
  status: "active" | "expired";
}

export interface DailySessionCreate {
  client_name: string;
  client_id?: number | null;
  time_in: string;
  date: string;
  client_assist: "JAYSON" | "VINCENT" | "TIN" | "NONE";
  is_member: boolean;
  amount_paid: number;
  pt_fee: number;
  payment_method: "cash" | "gcash";
  deduct_coaching?: boolean;
  pt_sessions_added?: number;
}

export interface DailySessionResponse extends DailySessionCreate {
  id: number;
}

export interface ProductSaleCreate {
  product_name: string;
  quantity: number;
  date: string;
  time_sold: string;
  amount_paid: number;
  payment_method: "cash" | "gcash";
}

export interface ProductSaleResponse extends ProductSaleCreate {
  id: number;
}

export interface GymRatesResponse {
  rate_pt_fee: number;
  rate_daily_member: number;
  rate_daily_non_member: number;
  rate_monthly_subscription_1m: number;
  rate_monthly_subscription_6m: number;
  rate_monthly_subscription_12m: number;
  rate_student_subscription_1m: number;
  rate_student_subscription_3m: number;
  rate_student_subscription_6m: number;
  rate_student_subscription_12m: number;
  rate_monthly_subscription_3m: number;
  rate_daily_student: number;
  rate_boxing_fee: number;
  rate_12_sessions_fee: number;
  rate_bottled_water: number;
  rate_black_coffee: number;
  rate_coffee_creamer: number;
  rate_cucumber_lemonade: number;
  rate_trainer_commission: number;
}

export type GymRatesUpdate = Omit<GymRatesResponse, "id">;

export interface DashboardMetrics {
  total_revenue: number;
  pt_revenue: number;
  cash_revenue: number;
  gcash_revenue: number;
  daily_session_revenue: number;
  subscription_revenue_1m: number;
  subscription_revenue_6m: number;
  subscription_revenue_12m: number;
  member_visits: number;
  non_member_visits: number;
  active_subscribers: number;
  total_clients: number;
  assist_breakdown: Record<string, number>;
  daily_sessions: DailySessionResponse[];
  clients: ClientResponse[];
  product_sales: ProductSaleResponse[];
  product_revenue: number;
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const response = await fetch(`${API_BASE_URL}/sessions/summary`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard metrics: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchClients(): Promise<ClientResponse[]> {
  const response = await fetch(`${API_BASE_URL}/clients`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch clients: ${response.statusText}`);
  }
  return response.json();
}

export async function createClient(client: ClientCreate): Promise<ClientResponse> {
  const response = await fetch(`${API_BASE_URL}/clients`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(client),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || "Failed to register client");
  }
  return response.json();
}

export async function updateClient(clientId: number, updates: Partial<ClientCreate>): Promise<ClientResponse> {
  const response = await fetch(`${API_BASE_URL}/clients/${clientId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || "Failed to update client");
  }
  return response.json();
}

export async function addSubscription(
  clientId: number,
  sub: Omit<SubscriptionCreate, "client_id">
): Promise<SubscriptionResponse> {
  const response = await fetch(`${API_BASE_URL}/clients/${clientId}/subscriptions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...sub, client_id: clientId }),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || "Failed to add subscription");
  }
  return response.json();
}

export async function logSession(session: DailySessionCreate): Promise<DailySessionResponse> {
  const response = await fetch(`${API_BASE_URL}/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(session),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || "Failed to log session");
  }
  return response.json();
}

export async function fetchRates(): Promise<GymRatesResponse> {
  const response = await fetch(`${API_BASE_URL}/rates`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch gym rates: ${response.statusText}`);
  }
  return response.json();
}

export async function updateRates(rates: GymRatesUpdate): Promise<GymRatesResponse> {
  const response = await fetch(`${API_BASE_URL}/rates`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rates),
  });
  if (!response.ok) {
    throw new Error(`Failed to update gym rates: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchSubscriptions(clientId: number): Promise<SubscriptionResponse[]> {
  const response = await fetch(`${API_BASE_URL}/clients/${clientId}/subscriptions`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch subscriptions: ${response.statusText}`);
  }
  return response.json();
}

export async function updateSubscription(
  subId: number,
  updates: Partial<Omit<SubscriptionResponse, "id" | "client_id">>
): Promise<SubscriptionResponse> {
  const response = await fetch(`${API_BASE_URL}/clients/subscriptions/${subId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || "Failed to update subscription");
  }
  return response.json();
}

export async function deleteSubscription(subId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/clients/subscriptions/${subId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Failed to delete subscription: ${response.statusText}`);
  }
}

export async function deleteClient(clientId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/clients/${clientId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Failed to delete client: ${response.statusText}`);
  }
}

export async function bulkDeleteClients(clientIds: number[]): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/clients/bulk`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: clientIds }),
  });
  if (!response.ok) {
    throw new Error(`Failed to delete clients: ${response.statusText}`);
  }
}

export async function fetchSessionHistory(date?: string): Promise<DailySessionResponse[]> {
  const url = date ? `${API_BASE_URL}/sessions/history?date=${date}` : `${API_BASE_URL}/sessions/history`;
  const response = await fetch(url, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch session history: ${response.statusText}`);
  }
  return response.json();
}

export async function deleteSession(sessionId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Failed to delete session: ${response.statusText}`);
  }
}

export async function bulkDeleteSessions(sessionIds: number[]): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/sessions/bulk`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: sessionIds }),
  });
  if (!response.ok) {
    throw new Error(`Failed to delete sessions: ${response.statusText}`);
  }
}

export async function logProductSale(sale: ProductSaleCreate): Promise<ProductSaleResponse> {
  const response = await fetch(`${API_BASE_URL}/products/sales`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sale),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || "Failed to log product sale");
  }
  return response.json();
}

export async function fetchProductSalesHistory(date?: string): Promise<ProductSaleResponse[]> {
  const url = date ? `${API_BASE_URL}/products/sales/history?date=${date}` : `${API_BASE_URL}/products/sales/history`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch product sales history: ${response.statusText}`);
  }
  return response.json();
}

export async function deleteProductSale(saleId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/products/sales/${saleId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Failed to delete product sale: ${response.statusText}`);
  }
}

export interface TrainerPayrollMetrics {
  trainer_name: string;
  total_assists: number;
  total_commission: number;
}

export async function fetchTrainerPayroll(startDate: string, endDate: string): Promise<TrainerPayrollMetrics[]> {
  const response = await fetch(`${API_BASE_URL}/trainers/payroll?start_date=${startDate}&end_date=${endDate}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch trainer payroll: ${response.statusText}`);
  }
  return response.json();
}

// --- Music Requests ---
export interface SongRequestCreate {
  title: string;
  requested_by: string;
}

export interface SongRequestResponse {
  id: number;
  title: string;
  requested_by: string;
  status: string;
  created_at: string;
}

export async function requestSong(song: SongRequestCreate): Promise<SongRequestResponse> {
  const response = await fetch(`${API_BASE_URL}/music/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(song),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || "Failed to request song");
  }
  return response.json();
}

export async function fetchMusicQueue(): Promise<SongRequestResponse[]> {
  const response = await fetch(`${API_BASE_URL}/music/queue`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch music queue: ${response.statusText}`);
  }
  return response.json();
}

export async function updateSongStatus(id: number, status: string): Promise<SongRequestResponse> {
  const response = await fetch(`${API_BASE_URL}/music/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    throw new Error(`Failed to update song status: ${response.statusText}`);
  }
  return response.json();
}

export async function deleteSongRequest(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/music/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Failed to delete song request: ${response.statusText}`);
  }
}
