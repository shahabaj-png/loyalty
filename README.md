# 🏅 Loyalty Platform

A full-stack loyalty, rewards, and gamification platform with identity verification.

## Architecture

```
┌─────────────────┐  ┌──────────────────┐  ┌───────────────────┐
│  Mobile App     │  │  Web Dashboard   │  │  External APIs    │
│  (React Native) │  │  (React + Vite)  │  │  (Webhooks)       │
└────────┬────────┘  └────────┬─────────┘  └─────────┬─────────┘
         │                    │                       │
         └────────────┬───────┘───────────────────────┘
                      │
              ┌───────▼────────┐
              │  NestJS API    │
              │  (Backend)     │
              └───┬────────┬───┘
                  │        │
          ┌───────▼──┐ ┌───▼──────┐
          │PostgreSQL │ │  Redis   │
          │  (Data)   │ │ (Cache)  │
          └──────────┘ └──────────┘
```

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Mobile     | React Native (Expo), Zustand, Axios     |
| Web        | React, Vite, Tailwind CSS, Recharts     |
| Backend    | NestJS, Prisma ORM, Passport JWT        |
| Database   | PostgreSQL 15, Redis 7                  |
| Infra      | Docker, Docker Compose                  |

## Features

- **Points System** — Earn/redeem with tier multipliers (Bronze → Silver → Gold → Platinum)
- **Rewards Catalog** — Category-based rewards with stock tracking
- **Gamification** — Daily check-ins, challenges, badges, leaderboards, spin wheel
- **Identity Verification** — Document upload + face enrollment/verification
- **Webhooks** — Real-time event dispatch with HMAC signatures
- **Analytics** — Dashboard metrics, timeseries, engagement stats
- **Admin Dashboard** — Full web management portal

## Quick Start

### Docker (Recommended)
```bash
docker-compose up -d
# API: http://localhost:4000/api/docs
# Dashboard: http://localhost:3000
```

### Manual Setup
```bash
# 1. Start Postgres & Redis
# 2. Backend
cd backend
cp .env.example .env   # Edit with your DB/Redis URLs
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev

# 3. Web Dashboard
cd web-dashboard
npm install
npm run dev

# 4. Mobile App
cd mobile
npm install
npx expo start
```

## Demo Credentials

| Role    | Email                      | Password  | Points |
|---------|----------------------------|-----------|--------|
| Admin   | admin@loyaltyplatform.com  | Admin123! | —      |
| Gold    | gold@demo.com              | Demo123!  | 7,500  |
| Silver  | silver@demo.com            | Demo123!  | 2,800  |
| Bronze  | bronze@demo.com            | Demo123!  | 450    |

## Project Structure

```
loyalty-platform/
├── shared/              # Shared TypeScript types & constants
├── backend/             # NestJS API (9 modules, 40+ endpoints)
│   ├── prisma/          # Schema + seed data
│   └── src/
│       ├── auth/        # JWT authentication
│       ├── users/       # User management
│       ├── points/      # Points engine + rules
│       ├── rewards/     # Reward catalog
│       ├── gamification/# Challenges, badges, leaderboard, spin
│       ├── identity/    # Document + face verification
│       ├── webhooks/    # Event dispatch system
│       ├── analytics/   # Dashboard metrics
│       └── common/      # Prisma + Redis services
├── mobile/              # React Native (Expo) app
│   └── src/
│       ├── screens/     # 11 screens
│       ├── services/    # API client
│       ├── store/       # Zustand state
│       └── navigation/  # Tab + stack navigation
├── web-dashboard/       # React admin dashboard
│   └── src/
│       ├── App.tsx      # All pages (Dashboard, Users, Rewards, etc.)
│       ├── services/    # API client
│       └── store/       # Admin auth state
├── docker-compose.yml
└── README.md
```

## API Documentation

Swagger docs available at `http://localhost:4000/api/docs` when the backend is running.

## License

MIT
