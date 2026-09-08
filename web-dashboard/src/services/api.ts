import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'https://loyalty-production-033a.up.railway.app/api/v1';
const client = axios.create({ baseURL });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const api = {
  auth: {
    login: (data: { email: string; password: string }) => client.post('/auth/login', data).then(r => r.data),
    register: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string; referralCode?: string }) => client.post('/auth/register', data).then(r => r.data),
  },
  analytics: {
    dashboard: () => client.get('/analytics/dashboard').then(r => r.data),
    pointsTimeseries: (params?: any) => client.get('/analytics/points-timeseries', { params }).then(r => r.data),
    userGrowth: (params?: any) => client.get('/analytics/user-growth', { params }).then(r => r.data),
    topRewards: () => client.get('/analytics/top-rewards').then(r => r.data),
    engagement: () => client.get('/analytics/engagement').then(r => r.data),
  },
  users: {
    me: () => client.get('/users/me').then(r => r.data),
    list: (params?: any) => client.get('/users', { params }).then(r => r.data),
    get: (id: string) => client.get(`/users/${id}`).then(r => r.data),
    create: (data: any) => client.post('/users', data).then(r => r.data),
  },
  rewards: {
    list: () => client.get('/rewards/catalog').then(r => r.data),
    create: (data: any) => client.post('/rewards', data).then(r => r.data),
    update: (id: string, data: any) => client.put(`/rewards/${id}`, data).then(r => r.data),
    delete: (id: string) => client.delete(`/rewards/${id}`).then(r => r.data),
  },
  points: {
    rules: () => client.get('/points/rules').then(r => r.data),
    createRule: (data: any) => client.post('/points/rules', data).then(r => r.data),
    earn: (data: any) => client.post('/points/earn', data).then(r => r.data),
    redeem: (data: { rewardId: string }) => client.post('/points/redeem', data).then(r => r.data),
    walletSummary: (userId?: string) => client.get('/points/wallet-summary', { params: { userId } }).then(r => r.data),
  },
  challenges: {
    list: () => client.get('/gamification/challenges').then(r => r.data),
  },
  webhooks: {
    list: () => client.get('/webhooks').then(r => r.data),
    create: (data: any) => client.post('/webhooks', data).then(r => r.data),
    logs: (id: string) => client.get(`/webhooks/${id}/logs`).then(r => r.data),
  },
  servicePlans: {
    list: (includeInactive?: boolean) => client.get('/service-plans', { params: { includeInactive } }).then(r => r.data),
    get: (id: string) => client.get(`/service-plans/${id}`).then(r => r.data),
    create: (data: any) => client.post('/service-plans', data).then(r => r.data),
    update: (id: string, data: any) => client.put(`/service-plans/${id}`, data).then(r => r.data),
    delete: (id: string) => client.delete(`/service-plans/${id}`).then(r => r.data),
  },
  tenants: {
    list: () => client.get('/tenants').then(r => r.data),
    get: (id: string) => client.get(`/tenants/${id}`).then(r => r.data),
    create: (data: any) => client.post('/tenants', data).then(r => r.data),
    update: (id: string, data: any) => client.put(`/tenants/${id}`, data).then(r => r.data),
    regenerateCredentials: (id: string) => client.post(`/tenants/${id}/regenerate-credentials`).then(r => r.data),
  },
  subscriptions: {
    list: (tenantId: string) => client.get(`/subscriptions/tenant/${tenantId}`).then(r => r.data),
    getActive: (tenantId: string) => client.get(`/subscriptions/tenant/${tenantId}/active`).then(r => r.data),
    create: (data: any) => client.post('/subscriptions', data).then(r => r.data),
    renew: (id: string) => client.post(`/subscriptions/${id}/renew`).then(r => r.data),
    cancel: (id: string, immediate?: boolean) => client.post(`/subscriptions/${id}/cancel`, { immediate }).then(r => r.data),
    upgrade: (id: string, newPlanId: string) => client.put(`/subscriptions/${id}/upgrade`, { newPlanId }).then(r => r.data),
  },
  orders: {
    checkout: (data: any) => client.post('/orders/checkout', data).then(r => r.data),
    pay: (orderId: string, data?: any) => client.post(`/orders/${orderId}/pay`, data || {}).then(r => r.data),
    initiateRazorpay: (orderId: string) => client.post(`/orders/${orderId}/initiate-razorpay`).then(r => r.data),
    list: (params?: any) => client.get('/orders', { params }).then(r => r.data),
    get: (id: string) => client.get(`/orders/${id}`).then(r => r.data),
  },
  ageVerification: {
    verify: (data: any) => client.post('/age-verification/verify', data).then(r => r.data),
    status: (userId: string) => client.get(`/age-verification/status/${userId}`).then(r => r.data),
  },
};

export default client;
