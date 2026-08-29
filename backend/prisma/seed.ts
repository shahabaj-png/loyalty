import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.webhookLog.deleteMany();
  await prisma.webhookEndpoint.deleteMany();
  await prisma.spinWheelHistory.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.userChallenge.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.userReward.deleteMany();
  await prisma.pointTransaction.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.identityDocument.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.challenge.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.pointRule.deleteMany();
  await prisma.user.deleteMany();

  // ---- Admin User ----
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@loyaltyplatform.com', passwordHash: adminPassword,
      firstName: 'Admin', lastName: 'User', role: 'ADMIN',
      tier: 'PLATINUM', referralCode: 'ADMIN001',
      totalPoints: 50000, availablePoints: 50000, lifetimePoints: 50000,
      identityStatus: 'VERIFIED', faceEnrolled: true,
    },
  });

  // ---- Demo Users ----
  const demoPassword = await bcrypt.hash('Demo123!', 12);
  const users = await Promise.all([
    prisma.user.create({ data: { email: 'gold@demo.com', passwordHash: demoPassword, firstName: 'Sarah', lastName: 'Johnson', tier: 'GOLD', referralCode: 'GOLD001', totalPoints: 7500, availablePoints: 5200, lifetimePoints: 7500, streakDays: 14, lastCheckIn: new Date(), identityStatus: 'VERIFIED' } }),
    prisma.user.create({ data: { email: 'silver@demo.com', passwordHash: demoPassword, firstName: 'Mike', lastName: 'Chen', tier: 'SILVER', referralCode: 'SILVER01', totalPoints: 2800, availablePoints: 1500, lifetimePoints: 2800, streakDays: 5, lastCheckIn: new Date() } }),
    prisma.user.create({ data: { email: 'bronze@demo.com', passwordHash: demoPassword, firstName: 'Emma', lastName: 'Davis', tier: 'BRONZE', referralCode: 'BRONZE1', totalPoints: 450, availablePoints: 450, lifetimePoints: 450 } }),
  ]);

  // ---- Rewards ----
  const rewards = await Promise.all([
    prisma.reward.create({ data: { name: '$5 Gift Card', description: 'Digital gift card redeemable at participating stores', pointsCost: 500, category: 'Gift Cards', minTier: 'BRONZE', stock: 100, imageUrl: '/rewards/gift-card-5.png' } }),
    prisma.reward.create({ data: { name: '$25 Gift Card', description: 'Premium digital gift card', pointsCost: 2000, category: 'Gift Cards', minTier: 'SILVER', stock: 50, imageUrl: '/rewards/gift-card-25.png' } }),
    prisma.reward.create({ data: { name: 'Free Coffee', description: 'Redeemable at any partner cafe', pointsCost: 200, category: 'Food & Drink', minTier: 'BRONZE', stock: 200, imageUrl: '/rewards/coffee.png' } }),
    prisma.reward.create({ data: { name: 'Movie Ticket', description: 'One movie ticket at AMC theaters', pointsCost: 1500, category: 'Entertainment', minTier: 'SILVER', stock: 75, imageUrl: '/rewards/movie.png' } }),
    prisma.reward.create({ data: { name: 'VIP Event Access', description: 'Exclusive access to special events', pointsCost: 5000, category: 'Experiences', minTier: 'GOLD', stock: 20, imageUrl: '/rewards/vip.png' } }),
    prisma.reward.create({ data: { name: 'Weekend Getaway', description: '2-night stay at a luxury resort', pointsCost: 15000, category: 'Experiences', minTier: 'PLATINUM', stock: 5, imageUrl: '/rewards/resort.png' } }),
    prisma.reward.create({ data: { name: 'Free Merchandise', description: 'Branded T-shirt or hat', pointsCost: 800, category: 'Merchandise', minTier: 'BRONZE', stock: 150, imageUrl: '/rewards/merch.png' } }),
    prisma.reward.create({ data: { name: 'Priority Support', description: '1-month priority support access', pointsCost: 3000, category: 'Services', minTier: 'GOLD', stock: null, imageUrl: '/rewards/support.png' } }),
  ]);

  // ---- Badges ----
  await Promise.all([
    prisma.badge.create({ data: { name: 'Welcome Aboard', description: 'Created your account', iconUrl: '/badges/welcome.png', category: 'Milestones', criteria: { type: 'registration', threshold: 1 }, pointsReward: 50, rarity: 'COMMON' } }),
    prisma.badge.create({ data: { name: 'First Purchase', description: 'Earned points from your first purchase', iconUrl: '/badges/first-purchase.png', category: 'Shopping', criteria: { type: 'purchase_count', threshold: 1 }, pointsReward: 100, rarity: 'COMMON' } }),
    prisma.badge.create({ data: { name: 'Week Warrior', description: '7-day check-in streak', iconUrl: '/badges/week.png', category: 'Streaks', criteria: { type: 'streak', threshold: 7 }, pointsReward: 200, rarity: 'UNCOMMON' } }),
    prisma.badge.create({ data: { name: 'Monthly Master', description: '30-day check-in streak', iconUrl: '/badges/month.png', category: 'Streaks', criteria: { type: 'streak', threshold: 30 }, pointsReward: 500, rarity: 'RARE' } }),
    prisma.badge.create({ data: { name: 'Century Streak', description: '100-day check-in streak', iconUrl: '/badges/century.png', category: 'Streaks', criteria: { type: 'streak', threshold: 100 }, pointsReward: 2000, rarity: 'EPIC' } }),
    prisma.badge.create({ data: { name: 'Year of Loyalty', description: '365-day check-in streak', iconUrl: '/badges/year.png', category: 'Streaks', criteria: { type: 'streak', threshold: 365 }, pointsReward: 10000, rarity: 'LEGENDARY' } }),
    prisma.badge.create({ data: { name: 'Social Butterfly', description: 'Referred 5 friends', iconUrl: '/badges/social.png', category: 'Social', criteria: { type: 'referral_count', threshold: 5 }, pointsReward: 500, rarity: 'RARE' } }),
    prisma.badge.create({ data: { name: 'Big Spender', description: 'Redeemed 10,000 points', iconUrl: '/badges/spender.png', category: 'Redemption', criteria: { type: 'points_redeemed', threshold: 10000 }, pointsReward: 1000, rarity: 'EPIC' } }),
    prisma.badge.create({ data: { name: 'Identity Verified', description: 'Completed identity verification', iconUrl: '/badges/verified.png', category: 'Milestones', criteria: { type: 'identity_verified', threshold: 1 }, pointsReward: 200, rarity: 'UNCOMMON' } }),
    prisma.badge.create({ data: { name: 'Challenge Champion', description: 'Completed 10 challenges', iconUrl: '/badges/champion.png', category: 'Challenges', criteria: { type: 'challenges_completed', threshold: 10 }, pointsReward: 1000, rarity: 'EPIC' } }),
  ]);

  // ---- Challenges ----
  const now = new Date();
  const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const monthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await Promise.all([
    prisma.challenge.create({ data: { name: 'Daily Check-in Sprint', description: 'Check in 5 times this week', type: 'WEEKLY', pointsReward: 200, criteria: { action: 'check_in', target: 5 }, startsAt: now, endsAt: weekLater } }),
    prisma.challenge.create({ data: { name: 'Shopping Spree', description: 'Make 3 purchases this month', type: 'MONTHLY', pointsReward: 500, criteria: { action: 'purchase', target: 3 }, startsAt: now, endsAt: monthLater } }),
    prisma.challenge.create({ data: { name: 'Refer a Friend', description: 'Successfully refer 1 friend', type: 'SPECIAL', pointsReward: 1000, criteria: { action: 'referral', target: 1 }, startsAt: now, endsAt: monthLater } }),
    prisma.challenge.create({ data: { name: 'Point Collector', description: 'Earn 500 points this week', type: 'WEEKLY', pointsReward: 150, criteria: { action: 'earn_points', target: 500 }, startsAt: now, endsAt: weekLater } }),
  ]);

  // ---- Point Rules ----
  await Promise.all([
    prisma.pointRule.create({ data: { name: 'Purchase Points', event: 'purchase', basePoints: 1, multiplierField: 'amount', maxPoints: 5000, cooldownMinutes: 1 } }),
    prisma.pointRule.create({ data: { name: 'Review Bonus', event: 'review_submitted', basePoints: 50, cooldownMinutes: 1440 } }),
    prisma.pointRule.create({ data: { name: 'Profile Complete', event: 'profile_completed', basePoints: 100 } }),
    prisma.pointRule.create({ data: { name: 'Birthday Bonus', event: 'birthday', basePoints: 200 } }),
    prisma.pointRule.create({ data: { name: 'Social Share', event: 'social_share', basePoints: 25, cooldownMinutes: 1440 } }),
  ]);

  // ---- Sample Transactions for Demo Users ----
  const transactionData = [];
  for (const user of users) {
    for (let i = 0; i < 10; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const amount = Math.floor(Math.random() * 200) + 10;
      transactionData.push({
        userId: user.id, type: 'EARN' as const, amount,
        balance: user.availablePoints, description: `Purchase at Store #${Math.floor(Math.random() * 50)}`,
        source: 'purchase', createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      });
    }
  }
  await prisma.pointTransaction.createMany({ data: transactionData });

  console.log('✅ Seed complete!');
  console.log(`   Admin: admin@loyaltyplatform.com / Admin123!`);
  console.log(`   Gold:  gold@demo.com / Demo123!`);
  console.log(`   Silver: silver@demo.com / Demo123!`);
  console.log(`   Bronze: bronze@demo.com / Demo123!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
