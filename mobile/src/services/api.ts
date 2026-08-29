import axios, { AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = __DEV__ ? 'http://localhost:3000/api/v1' : 'https://api.loyaltyplatform.com/api/v1';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({ baseURL: API_URL, timeout: 15000, headers: { 'Content-Type': 'application/json' } });

    // Auto-attach auth token
    this.client.interceptors.request.use(async (config) => {
      const token = await SecureStore.getItemAsync('accessToken');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    // Auto-refresh on 401
    this.client.interceptors.response.use(
      (res) => res,
      async (error) => {
        if (error.response?.status === 401 && !error.config._retry) {
          error.config._retry = true;
          try {
            const refreshToken = await SecureStore.getItemAsync('refreshToken');
            if (refreshToken) {
              const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
              await SecureStore.setItemAsync('accessToken', data.accessToken);
              await SecureStore.setItemAsync('refreshToken', data.refreshToken);
              error.config.headers.Authorization = `Bearer ${data.accessToken}`;
              return this.client(error.config);
            }
          } catch { /* refresh failed, force logout */ }
        }
        return Promise.reject(error);
      },
    );
  }

  // ---- Auth ----
  async register(dto: { email: string; password: string; firstName: string; lastName: string; phone?: string; referralCode?: string }) {
    const { data } = await this.client.post('/auth/register', dto);
    await this.storeTokens(data.accessToken, data.refreshToken);
    return data;
  }

  async login(email: string, password: string) {
    const { data } = await this.client.post('/auth/login', { email, password });
    await this.storeTokens(data.accessToken, data.refreshToken);
    return data;
  }

  async logout() {
    try { await this.client.post('/auth/logout'); } catch {}
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
  }

  // ---- User ----
  async getProfile() { return (await this.client.get('/users/me')).data; }
  async updateProfile(dto: any) { return (await this.client.put('/users/me', dto)).data; }
  async getNotifications(page = 1) { return (await this.client.get(`/users/me/notifications?page=${page}`)).data; }
  async getReferrals() { return (await this.client.get('/users/me/referrals')).data; }

  // ---- Points ----
  async getBalance() { return (await this.client.get('/points/balance')).data; }
  async getTransactions(page = 1, type?: string) {
    const params = new URLSearchParams({ page: String(page) });
    if (type) params.set('type', type);
    return (await this.client.get(`/points/transactions?${params}`)).data;
  }
  async redeemReward(rewardId: string) { return (await this.client.post('/points/redeem', { rewardId })).data; }

  // ---- Rewards ----
  async getRewardsCatalog(page = 1, category?: string) {
    const params = new URLSearchParams({ page: String(page) });
    if (category) params.set('category', category);
    return (await this.client.get(`/rewards/catalog?${params}`)).data;
  }
  async getMyRewards(status?: string) {
    const params = status ? `?status=${status}` : '';
    return (await this.client.get(`/rewards/mine${params}`)).data;
  }
  async getRewardCategories() { return (await this.client.get('/rewards/categories')).data; }

  // ---- Gamification ----
  async checkIn(locationId?: string, latitude?: number, longitude?: number) {
    return (await this.client.post('/gamification/checkin', { locationId, latitude, longitude })).data;
  }
  async getChallenges() { return (await this.client.get('/gamification/challenges')).data; }
  async joinChallenge(challengeId: string) { return (await this.client.post(`/gamification/challenges/${challengeId}/join`)).data; }
  async getBadges() { return (await this.client.get('/gamification/badges')).data; }
  async getLeaderboard(period = 'monthly', limit = 50) {
    return (await this.client.get(`/gamification/leaderboard?period=${period}&limit=${limit}`)).data;
  }
  async getMyRank(period = 'monthly') { return (await this.client.get(`/gamification/leaderboard/me?period=${period}`)).data; }
  async spinWheel() { return (await this.client.post('/gamification/spin')).data; }

  // ---- Identity ----
  async submitDocument(documentType: string, documentImage: string, issuingCountry?: string) {
    return (await this.client.post('/identity/verify-document', { documentType, documentImage, issuingCountry })).data;
  }
  async getVerificationStatus() { return (await this.client.get('/identity/status')).data; }
  async enrollFace(faceImage: string, livenessData?: any) {
    return (await this.client.post('/identity/face/enroll', { faceImage, livenessData })).data;
  }
  async verifyFace(faceImage: string) { return (await this.client.post('/identity/face/verify', { faceImage })).data; }

  // ---- Helpers ----
  private async storeTokens(access: string, refresh: string) {
    await SecureStore.setItemAsync('accessToken', access);
    await SecureStore.setItemAsync('refreshToken', refresh);
  }
}

export const api = new ApiService();
