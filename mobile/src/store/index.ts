import { create } from 'zustand';
import { api } from '../services/api';

interface User {
  id: string; email: string; firstName: string; lastName: string; avatarUrl?: string;
  tier: string; totalPoints: number; availablePoints: number; lifetimePoints: number;
  referralCode: string; identityStatus: string; faceEnrolled: boolean;
  streakDays: number; lastCheckIn?: string;
}

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (dto: any) => Promise<void>;
  logout: () => Promise<void>;
  loadProfile: () => Promise<void>;

  // Points
  balance: { availablePoints: number; expiringIn30Days: number; multiplier: number } | null;
  loadBalance: () => Promise<void>;

  // Gamification
  challenges: any[];
  badges: { earned: any[]; locked: any[]; total: number; unlocked: number } | null;
  leaderboard: any[];
  loadChallenges: () => Promise<void>;
  loadBadges: () => Promise<void>;
  loadLeaderboard: (period?: string) => Promise<void>;
  checkIn: () => Promise<any>;
  spinWheel: () => Promise<any>;

  // Rewards
  rewardsCatalog: any;
  myRewards: any[];
  loadRewardsCatalog: (page?: number, category?: string) => Promise<void>;
  loadMyRewards: () => Promise<void>;
  redeemReward: (rewardId: string) => Promise<any>;

  // Notifications
  notifications: any[];
  loadNotifications: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  // ---- State ----
  user: null, isAuthenticated: false, isLoading: false,
  balance: null, challenges: [], badges: null, leaderboard: [],
  rewardsCatalog: null, myRewards: [], notifications: [],

  // ---- Auth ----
  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const data = await api.login(email, password);
      set({ user: data.user, isAuthenticated: true });
    } finally { set({ isLoading: false }); }
  },

  register: async (dto) => {
    set({ isLoading: true });
    try {
      const data = await api.register(dto);
      set({ user: data.user, isAuthenticated: true });
    } finally { set({ isLoading: false }); }
  },

  logout: async () => {
    await api.logout();
    set({ user: null, isAuthenticated: false, balance: null, challenges: [], badges: null, leaderboard: [], rewardsCatalog: null, myRewards: [], notifications: [] });
  },

  loadProfile: async () => {
    try {
      const user = await api.getProfile();
      set({ user, isAuthenticated: true });
    } catch { set({ isAuthenticated: false }); }
  },

  // ---- Points ----
  loadBalance: async () => {
    const balance = await api.getBalance();
    set({ balance });
  },

  // ---- Gamification ----
  loadChallenges: async () => { set({ challenges: await api.getChallenges() }); },
  loadBadges: async () => { set({ badges: await api.getBadges() }); },
  loadLeaderboard: async (period = 'monthly') => { set({ leaderboard: await api.getLeaderboard(period) }); },

  checkIn: async () => {
    const result = await api.checkIn();
    await get().loadProfile();
    await get().loadBalance();
    return result;
  },

  spinWheel: async () => {
    const result = await api.spinWheel();
    await get().loadBalance();
    return result;
  },

  // ---- Rewards ----
  loadRewardsCatalog: async (page = 1, category?) => {
    const catalog = await api.getRewardsCatalog(page, category);
    set({ rewardsCatalog: catalog });
  },

  loadMyRewards: async () => { set({ myRewards: await api.getMyRewards() }); },

  redeemReward: async (rewardId) => {
    const result = await api.redeemReward(rewardId);
    await get().loadBalance();
    await get().loadMyRewards();
    return result;
  },

  // ---- Notifications ----
  loadNotifications: async () => {
    const data = await api.getNotifications();
    set({ notifications: data.data });
  },
}));
