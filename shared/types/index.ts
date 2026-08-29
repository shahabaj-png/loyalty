// ============================================================
// SHARED TYPES - Used by Backend, Mobile, and Web Dashboard
// ============================================================

export enum UserRole { CUSTOMER = 'CUSTOMER', ADMIN = 'ADMIN', MANAGER = 'MANAGER', API_CLIENT = 'API_CLIENT' }
export enum TierLevel { BRONZE = 'BRONZE', SILVER = 'SILVER', GOLD = 'GOLD', PLATINUM = 'PLATINUM' }
export enum PointTransactionType { EARN = 'EARN', REDEEM = 'REDEEM', BONUS = 'BONUS', EXPIRE = 'EXPIRE', ADJUSTMENT = 'ADJUSTMENT', REFERRAL = 'REFERRAL' }
export enum ChallengeType { DAILY = 'DAILY', WEEKLY = 'WEEKLY', MONTHLY = 'MONTHLY', SPECIAL = 'SPECIAL', STREAK = 'STREAK' }
export enum ChallengeStatus { ACTIVE = 'ACTIVE', COMPLETED = 'COMPLETED', EXPIRED = 'EXPIRED', LOCKED = 'LOCKED' }
export enum RewardStatus { AVAILABLE = 'AVAILABLE', CLAIMED = 'CLAIMED', REDEEMED = 'REDEEMED', EXPIRED = 'EXPIRED' }
export enum IdentityStatus { PENDING = 'PENDING', VERIFIED = 'VERIFIED', FAILED = 'FAILED', EXPIRED = 'EXPIRED' }
export enum WebhookEvent {
  POINTS_EARNED = 'points.earned', POINTS_REDEEMED = 'points.redeemed',
  TIER_UPGRADED = 'tier.upgraded', TIER_DOWNGRADED = 'tier.downgraded',
  REWARD_CLAIMED = 'reward.claimed', CHALLENGE_COMPLETED = 'challenge.completed',
  BADGE_EARNED = 'badge.earned', CHECKIN_CREATED = 'checkin.created',
  IDENTITY_VERIFIED = 'identity.verified', IDENTITY_FAILED = 'identity.failed',
  REFERRAL_COMPLETED = 'referral.completed', USER_CREATED = 'user.created',
}

export interface User {
  id: string; email: string; phone?: string; firstName: string; lastName: string;
  avatarUrl?: string; role: UserRole; tier: TierLevel;
  totalPoints: number; availablePoints: number; lifetimePoints: number;
  referralCode: string; identityStatus: IdentityStatus; faceEnrolled: boolean;
  streakDays: number; lastCheckIn?: string; createdAt: string; updatedAt: string;
}

export interface PointTransaction {
  id: string; userId: string; type: PointTransactionType; amount: number;
  balance: number; description: string; source: string;
  metadata?: Record<string, any>; expiresAt?: string; createdAt: string;
}

export interface Reward {
  id: string; name: string; description: string; imageUrl?: string;
  pointsCost: number; category: string; minTier: TierLevel;
  stock?: number; isActive: boolean; validFrom: string; validUntil?: string;
}

export interface UserReward {
  id: string; userId: string; rewardId: string; reward: Reward;
  status: RewardStatus; redemptionCode?: string;
  claimedAt: string; redeemedAt?: string; expiresAt?: string;
}

export interface Badge {
  id: string; name: string; description: string; iconUrl: string;
  category: string; criteria: { type: string; threshold: number; conditions?: Record<string, any> };
  pointsReward: number; rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
}

export interface UserBadge { id: string; userId: string; badgeId: string; badge: Badge; earnedAt: string; progress: number; }

export interface Challenge {
  id: string; name: string; description: string; type: ChallengeType;
  pointsReward: number; criteria: { action: string; target: number; conditions?: Record<string, any> };
  startsAt: string; endsAt: string; isActive: boolean; maxParticipants?: number;
}

export interface UserChallenge {
  id: string; userId: string; challengeId: string; challenge: Challenge;
  status: ChallengeStatus; progress: number; completedAt?: string;
}

export interface LeaderboardEntry { rank: number; userId: string; userName: string; avatarUrl?: string; score: number; tier: TierLevel; }
export interface CheckIn { id: string; userId: string; locationId?: string; pointsEarned: number; streakDay: number; streakBonus: number; createdAt: string; }

export interface TierConfig { level: TierLevel; name: string; minPoints: number; pointsMultiplier: number; perks: string[]; color: string; icon: string; }

export const TIER_CONFIG: TierConfig[] = [
  { level: TierLevel.BRONZE, name: 'Bronze', minPoints: 0, pointsMultiplier: 1.0, perks: ['Basic rewards access', 'Birthday bonus'], color: '#CD7F32', icon: '🥉' },
  { level: TierLevel.SILVER, name: 'Silver', minPoints: 1000, pointsMultiplier: 1.25, perks: ['Early access to rewards', '10% bonus points', 'Priority support'], color: '#C0C0C0', icon: '🥈' },
  { level: TierLevel.GOLD, name: 'Gold', minPoints: 5000, pointsMultiplier: 1.5, perks: ['Exclusive rewards', '25% bonus points', 'Free shipping', 'Monthly surprise'], color: '#FFD700', icon: '🥇' },
  { level: TierLevel.PLATINUM, name: 'Platinum', minPoints: 15000, pointsMultiplier: 2.0, perks: ['VIP rewards', '50% bonus points', 'Personal concierge', 'Annual gift', 'Event access'], color: '#E5E4E2', icon: '💎' },
];

// API Request/Response Types
export interface AuthRegisterRequest { email: string; password: string; firstName: string; lastName: string; phone?: string; }
export interface AuthLoginRequest { email: string; password: string; }
export interface AuthResponse { accessToken: string; refreshToken: string; user: User; }
export interface EarnPointsRequest { userId: string; amount: number; source: string; description: string; metadata?: Record<string, any>; }
export interface RedeemPointsRequest { userId: string; rewardId: string; }
export interface WebhookConfig { id: string; url: string; events: WebhookEvent[]; secret: string; isActive: boolean; createdAt: string; }
export interface PaginatedResponse<T> { data: T[]; total: number; page: number; limit: number; totalPages: number; }
export interface DashboardStats {
  totalUsers: number; activeUsers: number; totalPointsIssued: number; totalPointsRedeemed: number;
  totalRewardsClaimed: number; averagePointsPerUser: number; tierDistribution: Record<TierLevel, number>;
  recentActivity: { id: string; type: string; userId: string; userName: string; description: string; timestamp: string; }[];
}

export interface PointRule {
  id: string; name: string; event: string; basePoints: number; multiplierField?: string;
  maxPoints?: number; cooldownMinutes?: number;
  conditions?: { field: string; operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains'; value: any }[];
  isActive: boolean;
}
