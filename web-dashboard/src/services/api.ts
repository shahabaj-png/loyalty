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
  },
  analytics: {
    dashboard: () => client.get('/analytics/dashboard').then(r => r.data),
    pointsTimeseries: (params?: any) => client.get('/analytics/points-timeseries', { params }).then(r => r.data),
    userGrowth: (params?: any) => client.get('/analytics/user-growth', { params }).then(r => r.data),
    topRewards: () => client.get('/analytics/top-rewards').then(r => r.data),
    engagement: () => client.get('/analytics/engagement').then(r => r.data),
  },
  users: {
    list: (params?: any) => client.get('/users', { params }).then(r => r.data),
    get: (id: string) => client.get(`/users/${id}`).then(r => r.data),
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
  },
  challenges: {
    list: () => client.get('/gamification/challenges').then(r => r.data),
  },
  webhooks: {
    list: () => client.get('/webhooks').then(r => r.data),
    create: (data: any) => client.post('/webhooks', data).then(r => r.data),
    logs: (id: string) => client.get(`/webhooks/${id}/logs`).then(r => r.data),
  },
};

export default client;
