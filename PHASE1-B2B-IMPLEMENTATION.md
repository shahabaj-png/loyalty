# Phase 1: B2B Infrastructure Implementation

## Overview
This document describes the Phase 1 implementation of the B2B service infrastructure for the Loyalty Platform, including Service Plans, Tenants, and Subscriptions management.

## Database Schema Changes

### New Models Added

#### 1. ServicePlan
- Represents subscription tiers (Basic, Professional, Enterprise)
- Fields: name, slug, description, features (JSON), price, billingCycle, maxUsers, maxTenants, apiRateLimit
- Supports MONTHLY, QUARTERLY, YEARLY billing cycles

#### 2. Tenant
- Represents a business tenant/warehouse for external B2B services
- Fields: businessId (owner), name, slug, apiKey, apiSecret, webhookUrl, settings (JSON)
- Each tenant has unique API credentials for external service integration
- Linked to business owner (User with BUSINESS_OWNER role)

#### 3. Subscription
- Manages tenant subscriptions to service plans
- Fields: tenantId, planId, status, currentPeriodStart, currentPeriodEnd, trialEndsAt
- Statuses: ACTIVE, TRIALING, PAST_DUE, CANCELED, EXPIRED
- Automatic period calculation based on billing cycle

#### 4. Order
- Tracks purchase orders for subscriptions and renewals
- Fields: orderNumber, tenantId, subscriptionId, userId, items (JSON), subtotal, discount, pointsUsed, pointsDiscount, total
- Statuses: PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED, CANCELED
- Supports loyalty points integration for discounts

### New Enums
- `BillingCycle`: MONTHLY, QUARTERLY, YEARLY
- `SubscriptionStatus`: ACTIVE, TRIALING, PAST_DUE, CANCELED, EXPIRED
- `OrderStatus`: PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED, CANCELED
- Updated `UserRole`: Added BUSINESS_OWNER

## API Modules Implemented

### 1. Service Plans Module (`/api/v1/service-plans`)

**Endpoints:**
- `GET /service-plans` - List all service plans
- `GET /service-plans/:id` - Get plan by ID
- `GET /service-plans/slug/:slug` - Get plan by slug
- `POST /service-plans` - Create plan (admin only)
- `PUT /service-plans/:id` - Update plan (admin only)
- `DELETE /service-plans/:id` - Deactivate plan (admin only)
- `GET /service-plans/:id/subscriptions/count` - Get subscription count

**Features:**
- Public plan browsing
- Admin-only plan management
- Prevents deletion of plans with active subscriptions
- Automatic deactivation instead of hard delete

### 2. Tenants Module (`/api/v1/tenants`)

**Endpoints:**
- `POST /tenants` - Create new tenant
- `GET /tenants` - Get all my tenants
- `GET /tenants/:id` - Get tenant by ID
- `GET /tenants/slug/:slug` - Get tenant by slug
- `PUT /tenants/:id` - Update tenant
- `POST /tenants/:id/regenerate-credentials` - Regenerate API key/secret
- `DELETE /tenants/:id` - Deactivate tenant

**Features:**
- Automatic API key/secret generation (`lp_` prefix for keys)
- Business owner access control
- Tenant-level settings and webhook configuration
- Prevents deletion with active subscriptions

### 3. Subscriptions Module (`/api/v1/subscriptions`)

**Endpoints:**
- `POST /subscriptions` - Create new subscription
- `GET /subscriptions/:id` - Get subscription by ID
- `GET /subscriptions/tenant/:tenantId` - Get tenant subscriptions
- `GET /subscriptions/tenant/:tenantId/active` - Get active subscription
- `POST /subscriptions/:id/renew` - Renew subscription
- `POST /subscriptions/:id/cancel` - Cancel subscription
- `PUT /subscriptions/:id/upgrade` - Upgrade plan
- `PUT /subscriptions/:id/status` - Update status (admin only)
- `POST /subscriptions/check-expired` - Check expired subscriptions (admin/cron)

**Features:**
- Trial period support
- Automatic period calculation based on billing cycle
- Immediate or end-of-period cancellation
- Plan upgrade/downgrade support
- Subscription lifecycle management

## Integration Points

### With Existing Systems

1. **User Management**
   - New BUSINESS_OWNER role for tenant creators
   - Users can own multiple tenants
   - Users can place orders

2. **Points System** (Ready for Phase 2)
   - Orders support loyalty points usage
   - Points can provide discounts on subscriptions
   - Integration with existing points ledger

3. **Webhooks**
   - Tenants can configure webhook URLs
   - Ready for subscription events (renewal, cancellation, etc.)

## Next Steps (Phase 2)

1. **Cart & Checkout System**
   - Shopping cart for service selection
   - Loyalty points application during checkout
   - Order creation flow

2. **Payment Gateway Integration**
   - Razorpay/Stripe integration
   - Payment success/failure handling
   - Automatic subscription activation

3. **Order Management**
   - Order fulfillment workflow
   - Invoice generation
   - Subscription renewal automation

## Deployment Notes

### Database Migration
When deployed to Railway, the following will happen automatically:
1. Prisma will generate the new client with all models
2. Migrations will create new tables: ServicePlan, Tenant, Subscription, Order
3. New enums will be added to the database
4. Existing User table will be updated with new relations

### API Documentation
All new endpoints are documented in Swagger at `/api/docs`

### Testing
After deployment, test the APIs in this order:
1. Create service plans (admin)
2. Create a tenant (business owner)
3. Create a subscription for the tenant
4. Test subscription lifecycle (renew, cancel, upgrade)

## Example Workflows

### Creating a Complete B2B Setup

```bash
# 1. Admin creates service plans
POST /api/v1/service-plans
{
  "name": "Professional Plan",
  "slug": "professional",
  "description": "For growing businesses",
  "features": {
    "maxUsers": 50,
    "apiAccess": true,
    "support": "priority"
  },
  "price": 99900,  // ₹999 in paise
  "billingCycle": "MONTHLY"
}

# 2. Business owner creates tenant
POST /api/v1/tenants
{
  "name": "My Business Warehouse",
  "slug": "my-business",
  "description": "Main warehouse for operations"
}

# 3. Subscribe tenant to plan
POST /api/v1/subscriptions
{
  "tenantId": "tenant-uuid",
  "planId": "plan-uuid",
  "trialDays": 14
}

# 4. Get tenant API credentials
GET /api/v1/tenants/{tenantId}
# Returns: apiKey, apiSecret for external service integration
```

## Security Considerations

1. **API Keys**: Generated with `lp_` prefix, 48-character hex strings
2. **API Secrets**: 64-character hex strings, stored securely
3. **Access Control**: Business owners can only access their own tenants
4. **Admin Protection**: Plan management requires admin role

## Performance Optimizations

1. **Database Indexes**: Added on frequently queried fields (slug, apiKey, status, dates)
2. **Eager Loading**: Subscriptions include plan details to reduce queries
3. **Soft Deletes**: Plans and tenants are deactivated, not deleted

## Files Created/Modified

### New Files
- `backend/src/service-plans/service-plans.service.ts`
- `backend/src/service-plans/service-plans.controller.ts`
- `backend/src/service-plans/service-plans.module.ts`
- `backend/src/tenants/tenants.service.ts`
- `backend/src/tenants/tenants.controller.ts`
- `backend/src/tenants/tenants.module.ts`
- `backend/src/subscriptions/subscriptions.service.ts`
- `backend/src/subscriptions/subscriptions.controller.ts`
- `backend/src/subscriptions/subscriptions.module.ts`

### Modified Files
- `backend/prisma/schema.prisma` - Added 4 new models, 3 new enums, updated User model
- `backend/src/app.module.ts` - Registered new modules

## Status

✅ Database schema designed and implemented
✅ Service Plans module complete
✅ Tenants module complete
✅ Subscriptions module complete
✅ Modules registered in app.module.ts
⏳ Pending: Push to GitHub for Railway deployment
⏳ Pending: Database migration on Railway
⏳ Pending: Seed data for service plans
⏳ Pending: API testing via Swagger
