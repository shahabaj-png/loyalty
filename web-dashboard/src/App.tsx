import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAdminStore } from './store';
import { api } from './services/api';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// ─── LOGIN & REGISTER PAGE ───
function LoginPage() {
  const { login } = useAdminStore();
  const [isRegister, setIsRegister] = useState(false);
  const [accountRole, setAccountRole] = useState('MEMBER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isRegister) {
        const res = await api.auth.register({ email, password, firstName, lastName, role: accountRole });
        login(res.accessToken);
      } else {
        const res = await api.auth.login({ email, password });
        login(res.accessToken);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || (isRegister ? 'Registration failed' : 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">🏅 Loyalty Platform</h1>
        <p className="text-gray-500 mb-6">{isRegister ? 'Create a New Account' : 'Sign in to access your portal'}</p>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">Account Purpose / Role</label>
                <select value={accountRole} onChange={e => setAccountRole(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-indigo-50/50 font-semibold text-indigo-900">
                  <option value="MEMBER">👤 Customer Member (Earn & Redeem Points)</option>
                  <option value="BUSINESS_OWNER">🏬 Business / Store Owner (Manage Loyalty & Pay SaaS Subscription)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" required />
                </div>
              </div>
            </>
          )}

          <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 mb-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" required />

          <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 mb-6 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" required />

          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {loading ? (isRegister ? 'Creating Account...' : 'Signing in...') : (isRegister ? 'Create Account & Sign In' : 'Sign In')}
          </button>
        </form>

        <div className="mt-6 text-center border-t pt-4">
          <p className="text-xs text-gray-500">
            {isRegister ? 'Already have an account?' : 'New customer or store owner?'}
            <button onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="ml-1.5 font-bold text-indigo-600 hover:underline focus:outline-none">
              {isRegister ? 'Sign In Here' : 'Create New Account'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR ───
const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/products', label: 'Products / Software', icon: '🚀' },
  { path: '/tenants', label: 'Tenants / Businesses', icon: '🏢' },
  { path: '/business-profile', label: 'Business Profile', icon: '🏢' },
  { path: '/service-plans', label: 'Plans', icon: '📦' },
  { path: '/subscriptions', label: 'Subscriptions', icon: '💳' },
  { path: '/points', label: 'Loyalty Rules & Points', icon: '💎' },
  { path: '/rewards', label: 'Rewards & Redemption', icon: '🎁' },
  { path: '/challenges', label: 'Challenges', icon: '🏆' },
  { path: '/webhooks', label: 'Webhooks & Integrations', icon: '🔗' },
  { path: '/users', label: 'Users', icon: '👥' },
  { path: '/checkout', label: 'Cart & Checkout', icon: '🛒' },
  { path: '/wallet', label: 'Loyalty Wallet', icon: '👛' },
  { path: '/age-verification', label: 'Age Verification (21+)', icon: '🔞' },
];

function Sidebar({ currentUser }: { currentUser?: any }) {
  const location = useLocation();
  const { logout } = useAdminStore();
  const isSuperAdmin = currentUser?.email === 'admin@loyaltyplatform.com';
  const isBusinessOwner = currentUser?.role === 'BUSINESS_OWNER' || currentUser?.role === 'ADMIN';

  // Granular Access Control:
  // - Super Admin sees Users & Tenants, but NOT Business Profile
  // - Business Owner sees Business Profile, but NOT Users or Tenants list
  const visibleNavItems = isSuperAdmin 
    ? NAV_ITEMS.filter(item => item.path !== '/business-profile')  // Super Admin sees everything except personal business profile
    : isBusinessOwner
    ? NAV_ITEMS.filter(item => ['/', '/products', '/business-profile', '/service-plans', '/subscriptions', '/points', '/rewards', '/challenges', '/webhooks', '/checkout', '/wallet', '/age-verification'].includes(item.path)) // Business Owner
    : NAV_ITEMS.filter(item => ['/rewards', '/wallet', '/age-verification'].includes(item.path)); // Customer Member

  const roleBadgeText = isSuperAdmin
    ? '👑 Super Admin'
    : isBusinessOwner
    ? '🏬 Business Owner'
    : '👤 Customer Member';

  const roleBadgeStyle = isSuperAdmin
    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
    : isBusinessOwner
    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
    : 'bg-green-500/20 text-green-300 border border-green-500/30';

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-xl font-bold">🏅 Loyalty Platform</h2>
        <p className="text-xs text-indigo-400 mt-1 font-mono">{currentUser?.email || 'Authenticated User'}</p>
        <span className={`inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${roleBadgeStyle}`}>
          {roleBadgeText}
        </span>
      </div>
      <nav className="flex-1 py-4">
        {visibleNavItems.map(item => (
          <Link key={item.path} to={item.path}
            className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
              location.pathname === item.path ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-800'
            }`}>
            <span className="mr-3">{item.icon}</span>{item.label}
          </Link>
        ))}
      </nav>
      <button onClick={logout} className="p-4 text-gray-400 hover:text-white text-sm border-t border-gray-700">
        🚪 Log Out
      </button>
    </aside>
  );
}

// ─── CUSTOMER PORTAL PAGE ───
function CustomerPortalPage({ currentUser }: { currentUser?: any }) {
  const [profile, setProfile] = useState<any>(currentUser || null);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (currentUser) {
      setProfile(currentUser);
      api.points.walletSummary(currentUser.id).then(w => setTransactions(w.recentLedger || [])).catch(() => {});
    } else {
      api.users.list({ limit: 100 }).then(res => {
        const users = res.data || res || [];
        if (users.length > 0) {
          setProfile(users[0]);
          api.points.walletSummary(users[0].id).then(w => setTransactions(w.recentLedger || []));
        }
      }).catch(() => {});
    }
  }, [currentUser]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg mb-8">
        <div className="flex justify-between items-start">
          <div>
            <span className="bg-white/20 text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider">
              {profile?.tier || 'BRONZE'} TIER MEMBER
            </span>
            <h1 className="text-3xl font-extrabold mt-3">Welcome, {profile?.firstName || 'Customer'}! 👋</h1>
            <p className="text-indigo-100 text-sm mt-1">{profile?.email}</p>
          </div>
          <div className="text-right bg-white/10 p-4 rounded-xl backdrop-blur-md">
            <p className="text-xs text-indigo-200">Available Points</p>
            <p className="text-3xl font-black text-yellow-300 mt-1">💎 {profile?.availablePoints?.toLocaleString() || 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="font-bold text-gray-900 mb-2">🎁 Your Rewards Catalog</h3>
          <p className="text-xs text-gray-500 mb-4">Redeem your points for exclusive discounts & gift vouchers</p>
          <Link to="/rewards" className="inline-block bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-100">
            Browse & Redeem Rewards ➔
          </Link>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="font-bold text-gray-900 mb-2">🔞 Altria Age Verification (21+)</h3>
          <p className="text-xs text-gray-500 mb-4">Verify your age to unlock digital tobacco coupons at stores</p>
          <Link to="/age-verification" className="inline-block bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-100">
            Verify Age Now ➔
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-bold text-gray-900 text-sm">📜 Your Points Activity</h3>
        </div>
        <div className="divide-y text-sm">
          {transactions.length > 0 ? (
            transactions.map(t => (
              <div key={t.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                <div>
                  <p className="font-semibold text-gray-900">{t.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(t.createdAt).toLocaleString()}</p>
                </div>
                <span className={`font-bold ${t.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {t.amount > 0 ? `+${t.amount}` : t.amount} pts
                </span>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-400 text-sm">No transaction activity logged yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── LAYOUT ───
function Layout({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'ADMIN' | 'CUSTOMER'>('ADMIN');

  useEffect(() => {
    api.users.me().then(me => {
      if (me && me.id) {
        setCurrentUser(me);
        if (me.role !== 'ADMIN' && me.email !== 'admin@loyaltyplatform.com') {
          setViewMode('CUSTOMER');
        }
      }
    }).catch(() => {
      // Fallback if users.me fails
      api.users.list({ limit: 10 }).then(res => {
        const users = res.data || res || [];
        if (users.length > 0) {
          const me = users[0];
          setCurrentUser(me);
          if (me.role !== 'ADMIN' && me.email !== 'admin@loyaltyplatform.com') {
            setViewMode('CUSTOMER');
          }
        }
      }).catch(() => {});
    });
  }, []);

  const isSuperAdmin = currentUser?.email === 'admin@loyaltyplatform.com';
  const isBusinessOwner = currentUser?.role === 'BUSINESS_OWNER' || currentUser?.role === 'ADMIN';

  return (
    <div className="flex min-h-screen">
      <Sidebar currentUser={currentUser} />
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
        <header className="bg-white border-b px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active View:</span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
              isSuperAdmin ? 'bg-purple-100 text-purple-800' :
              isBusinessOwner ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
            }`}>
              {isSuperAdmin ? '👑 Super Admin Platform Control' : isBusinessOwner ? '🏬 B2B Business Owner Portal' : '👤 Customer App View'}
            </span>
          </div>
          <div className="text-xs font-semibold text-gray-500">
            Account: <span className="text-indigo-600 font-bold">{currentUser?.email || 'Authenticated User'}</span>
          </div>
        </header>
        <main className="flex-1 p-8 overflow-auto">
          {React.isValidElement(children) ? React.cloneElement(children as React.ReactElement<any>, { currentUser }) : children}
        </main>
      </div>
    </div>
  );
}

// ─── STAT CARD ───
function StatCard({ title, value, change, icon }: { title: string; value: string; change?: string; icon: string }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && <p className={`text-sm mt-1 ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>{change}</p>}
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}

// ─── DASHBOARD PAGE ───
function DashboardPage({ currentUser }: { currentUser?: any }) {
  const isSuperAdmin = currentUser?.email === 'admin@loyaltyplatform.com';

  // Super Admin Stats
  const [stats, setStats] = useState<any>(null);
  const [timeseries, setTimeseries] = useState<any[]>([]);
  const [topRewards, setTopRewards] = useState<any[]>([]);

  // Business Owner State
  const [tenant, setTenant] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [loadingBiz, setLoadingBiz] = useState(true);

  useEffect(() => {
    if (isSuperAdmin) {
      api.analytics.dashboard().then(setStats).catch(() => {});
      api.analytics.pointsTimeseries({ period: '30d' }).then(setTimeseries).catch(() => {});
      api.analytics.topRewards().then(setTopRewards).catch(() => {});
    } else {
      // Business Owner tailored telemetry
      Promise.all([
        api.tenants.list().catch(() => []),
        api.products.list().catch(() => []),
        api.rewards.list().catch(() => []),
      ]).then(([tenants, prods, rews]) => {
        const myTenant = tenants.find((t: any) => t.id === currentUser?.tenantId || t.name.toLowerCase().includes('warehouse') || tenants.length > 0) || tenants[0];
        setTenant(myTenant);
        setProducts(prods);
        setRewards(rews.filter((r: any) => r.isActive));

        if (myTenant) {
          api.subscriptions.list(myTenant.id).then(setSubscriptions).catch(() => {});
        }
      }).finally(() => setLoadingBiz(false));

      // Fetch user's wallet ledger & redemptions
      api.points.walletSummary(currentUser?.id || 'demo-user').then(res => {
        setLedger(res.recentLedger || []);
        setRedemptions(res.recentRedemptions || []);
      }).catch(() => {});
    }
  }, [isSuperAdmin, currentUser]);

  const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  // ─── SUPER ADMIN DASHBOARD ───
  if (isSuperAdmin) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">👑 Super Admin Platform Overview</h1>
            <p className="text-sm text-gray-500">Global metrics across all tenants, users, and point distributions</p>
          </div>
          <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full uppercase">
            Global Admin Telemetry
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Platform Users" value={stats?.totalUsers?.toLocaleString() || '—'} change={stats?.userGrowth} icon="👥" />
          <StatCard title="Active Users (30d)" value={stats?.activeUsers?.toLocaleString() || '—'} icon="📈" />
          <StatCard title="Total Points Issued" value={stats?.totalPointsIssued?.toLocaleString() || '—'} icon="💎" />
          <StatCard title="Rewards Claimed" value={stats?.rewardsClaimed?.toLocaleString() || '—'} icon="🎁" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="font-semibold text-gray-900 mb-4">Points Activity (30 days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeseries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="earned" stroke="#6366F1" strokeWidth={2} name="Earned" />
                <Line type="monotone" dataKey="redeemed" stroke="#EF4444" strokeWidth={2} name="Redeemed" />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="font-semibold text-gray-900 mb-4">Top Rewards Redemptions</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={topRewards} dataKey="claims" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {topRewards.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
          <StatCard title="Avg Check-in Streak" value={stats?.avgStreak || '—'} icon="🔥" />
          <StatCard title="Active Challenges" value={stats?.activeChallenges?.toString() || '—'} icon="🏆" />
          <StatCard title="Verification Rate" value={stats?.verificationRate || '—'} icon="✅" />
        </div>
      </div>
    );
  }

  // ─── BUSINESS OWNER / TENANT DASHBOARD ───
  const activeSubs = subscriptions.filter(s => s.status === 'ACTIVE');
  const availablePoints = tenant?.loyaltyPoints || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏬 Business Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome back, <span className="font-semibold text-indigo-600">{tenant?.name || currentUser?.email || 'Business Owner'}</span></p>
        </div>
        <Link to="/checkout" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 text-sm transition">
          🛒 Upgrade / Renew Software
        </Link>
      </div>

      {/* Top Business Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total / Available Loyalty Points" value={(availablePoints || 0).toLocaleString() + ' PTS'} change="Available for Rewards" icon="💎" />
        <StatCard title="Active Software Subscriptions" value={`${activeSubs.length} Active`} icon="💳" />
        <StatCard title="Purchased Products Suite" value={`${products.length} Software Modules`} icon="🚀" />
        <StatCard title="Available Rewards Catalog" value={`${rewards.length} Rewards`} icon="🎁" />
      </div>

      {/* Software Subscriptions & Available Products Quick View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900 text-lg">💳 Subscribed Software & Status</h3>
            <Link to="/subscriptions" className="text-xs text-indigo-600 font-semibold hover:underline">View All Subscriptions</Link>
          </div>
          {subscriptions.length === 0 ? (
            <div className="bg-gray-50 border rounded-xl p-6 text-center text-gray-500 text-sm">
              <p>No active subscriptions found.</p>
              <Link to="/checkout" className="inline-block mt-2 text-indigo-600 font-semibold hover:underline text-xs">
                + Subscribe to Software
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {subscriptions.map(s => (
                <div key={s.id} className="border rounded-xl p-4 flex justify-between items-center hover:bg-gray-50">
                  <div>
                    <h4 className="font-bold text-gray-900">{s.plan?.name || 'Software Subscription'}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Period: {new Date(s.currentPeriodStart).toLocaleDateString()} - {new Date(s.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900 text-lg">🎁 Redeemable Software Rewards</h3>
            <Link to="/rewards" className="text-xs text-indigo-600 font-semibold hover:underline">Open Catalog</Link>
          </div>
          {rewards.length === 0 ? (
            <div className="bg-gray-50 border rounded-xl p-6 text-center text-gray-500 text-sm">
              <p>No rewards currently active in catalog.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rewards.slice(0, 3).map(r => (
                <div key={r.id} className="border rounded-xl p-3 flex justify-between items-center hover:bg-gray-50">
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{r.title || r.name}</h4>
                    <p className="text-xs text-gray-500">{r.description?.slice(0, 45) || 'Redeem for free module extensions'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-indigo-600 block">{r.cost || r.pointsRequired} PTS</span>
                    <Link to="/rewards" className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold hover:bg-indigo-100">
                      Redeem
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Loyalty Transactions & Redemptions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="font-bold text-gray-900 text-lg mb-4">💎 Recent Point Transactions & History</h3>
        {ledger.length === 0 ? (
          <div className="bg-gray-50 border rounded-xl p-6 text-center text-gray-500 text-sm">
            <p>No recent point transactions recorded.</p>
          </div>
        ) : (
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Points</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {ledger.slice(0, 5).map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{item.description || item.reason}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${item.type === 'EARN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className={`px-4 py-3 font-bold ${item.type === 'EARN' ? 'text-green-600' : 'text-red-600'}`}>
                      {item.type === 'EARN' ? '+' : '-'}{item.amount} PTS
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(item.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── USERS PAGE ───
function UsersPage({ currentUser }: { currentUser?: any }) {
  const isSuperAdmin = currentUser?.email === 'admin@loyaltyplatform.com';

  if (!isSuperAdmin) {
    return (
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl border shadow-sm text-center">
        <span className="text-4xl">🔒</span>
        <h2 className="text-xl font-bold text-gray-900 mt-3">Admin Access Required</h2>
        <p className="text-gray-500 text-sm mt-1">User management is restricted to global Super Admins only.</p>
      </div>
    );
  }

  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '', tier: 'BRONZE', role: 'CUSTOMER' });

  const loadUsers = () => {
    api.users.list({ page, limit: 20, search: search || undefined }).then(r => setUsers(r.data || r || [])).catch(() => {});
  };

  useEffect(() => {
    loadUsers();
  }, [page, search]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.users.create(form);
      setShowForm(false);
      setForm({ firstName: '', lastName: '', email: '', password: '', phone: '', tier: 'BRONZE', role: 'CUSTOMER' });
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating user');
    }
  };

  const TIER_COLORS: Record<string, string> = {
    BRONZE: 'bg-orange-100 text-orange-800', SILVER: 'bg-gray-100 text-gray-800',
    GOLD: 'bg-yellow-100 text-yellow-800', PLATINUM: 'bg-purple-100 text-purple-800',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <div className="flex gap-4">
          <input type="text" placeholder="Search users..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="border rounded-lg px-4 py-2 w-64 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
          <button onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 text-sm">
            + Add User
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
          <h3 className="font-semibold mb-4 text-gray-900">Create New User</h3>
          <form onSubmit={handleCreateUser} className="grid grid-cols-2 gap-4">
            <input placeholder="First Name" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })}
              className="border rounded-lg px-4 py-2 text-sm" required />
            <input placeholder="Last Name" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })}
              className="border rounded-lg px-4 py-2 text-sm" required />
            <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              className="border rounded-lg px-4 py-2 text-sm" required />
            <input placeholder="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              className="border rounded-lg px-4 py-2 text-sm" required />
            <input placeholder="Phone (optional)" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              className="border rounded-lg px-4 py-2 text-sm" />
            <select value={form.tier} onChange={e => setForm({ ...form, tier: e.target.value })}
              className="border rounded-lg px-4 py-2 text-sm">
              <option value="BRONZE">Bronze Tier</option>
              <option value="SILVER">Silver Tier</option>
              <option value="GOLD">Gold Tier</option>
              <option value="PLATINUM">Platinum Tier</option>
            </select>
            <button type="submit" className="bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 col-span-2 text-sm">
              Save User
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Name', 'Email', 'Tier', 'Age Status (21+)', 'Points', 'Streak', 'Joined'].map(h => (
                <th key={h} className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{u.firstName} {u.lastName}</td>
                <td className="px-6 py-4 text-gray-500">{u.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${TIER_COLORS[u.tier] || ''}`}>{u.tier}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      u.identityStatus === 'VERIFIED' ? 'bg-green-100 text-green-800' :
                      u.identityStatus === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {u.identityStatus || 'UNVERIFIED'}
                    </span>
                    {u.isATC21Plus && (
                      <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-purple-300">
                        🔞 ATC21+
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 font-semibold">{u.totalPoints?.toLocaleString()}</td>
                <td className="px-6 py-4">{u.streakDays || 0}d 🔥</td>
                <td className="px-6 py-4 text-gray-500 text-sm">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-between items-center p-4 border-t">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 text-sm">Previous</button>
          <span className="text-sm text-gray-500">Page {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={users.length < 20}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 text-sm">Next</button>
        </div>
      </div>
    </div>
  );
}

// ─── REWARDS PAGE ───
function RewardsPage({ currentUser }: { currentUser?: any }) {
  const [rewards, setRewards] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', pointsCost: '', category: 'MERCHANDISE', stock: '' });
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.email === 'admin@loyaltyplatform.com';

  const loadRewards = () => {
    api.rewards.list().then(r => setRewards(r.data || r || [])).catch(() => {});
  };

  useEffect(() => {
    loadRewards();
  }, []);

  const handleCreate = async () => {
    try {
      await api.rewards.create({ ...form, pointsCost: parseInt(form.pointsCost), stock: parseInt(form.stock) || null });
      setShowForm(false);
      setForm({ name: '', description: '', pointsCost: '', category: 'MERCHANDISE', stock: '' });
      loadRewards();
    } catch {}
  };

  const handleRedeem = async (reward: any) => {
    setRedeemingId(reward.id);
    try {
      const res = await api.points.redeem({ rewardId: reward.id });
      alert(`🎉 Reward Claimed Successfully!\n\nCoupon Code: ${res.redemptionCode || 'CLAIMED-123'}\nPoints Deducted: -${reward.pointsCost} pts`);
      loadRewards();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Redemption failed. Check points balance and tier requirements.');
    } finally {
      setRedeemingId(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🎁 Rewards Catalog</h1>
          <p className="text-sm text-gray-500 mt-1">Browse and redeem points for digital gift vouchers & store discounts</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 text-sm">
            + Add Reward
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
          <h3 className="font-semibold mb-4">New Reward</h3>
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="border rounded-lg px-4 py-2 text-sm" />
            <input placeholder="Points Cost" type="number" value={form.pointsCost}
              onChange={e => setForm({ ...form, pointsCost: e.target.value })} className="border rounded-lg px-4 py-2 text-sm" />
            <input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="border rounded-lg px-4 py-2 text-sm" />
            <input placeholder="Stock (empty = unlimited)" type="number" value={form.stock}
              onChange={e => setForm({ ...form, stock: e.target.value })} className="border rounded-lg px-4 py-2 text-sm" />
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              className="border rounded-lg px-4 py-2 text-sm">
              {['MERCHANDISE', 'DISCOUNT', 'EXPERIENCE', 'DIGITAL', 'CHARITY'].map(c =>
                <option key={c} value={c}>{c}</option>
              )}
            </select>
            <button onClick={handleCreate} className="bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 text-sm">Create</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rewards.map(r => (
          <div key={r.id} className="bg-white rounded-xl p-6 shadow-sm border flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-gray-900 text-lg">{r.name}</h3>
                <span className="text-xs bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full font-semibold">{r.category}</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">{r.description}</p>
            </div>
            
            <div className="mt-6 pt-4 border-t flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-indigo-600 text-lg">💎 {r.pointsCost?.toLocaleString()} pts</span>
                <span className="text-xs text-gray-400 font-medium">
                  {r.stock != null ? `${r.stock} in stock` : 'Unlimited'}
                </span>
              </div>
              <button onClick={() => handleRedeem(r)} disabled={redeemingId === r.id}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 rounded-xl font-bold hover:opacity-90 disabled:opacity-50 text-sm shadow-sm transition-all">
                {redeemingId === r.id ? 'Claiming Reward...' : '🎁 Redeem Reward'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── POINTS & RULES PAGE ───
function PointsPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', event: '', basePoints: '10', multiplierField: '', maxPoints: '', cooldownMinutes: ''
  });

  const fetchRules = () => {
    api.points.rules()
      .then(r => setRules(Array.isArray(r) ? r : (r.data || [])))
      .catch(() => setRules([]));
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleCreate = async () => {
    try {
      await api.points.createRule({
        name: form.name || form.event,
        event: form.event,
        basePoints: parseInt(form.basePoints) || 10,
        multiplierField: form.multiplierField || undefined,
        maxPoints: form.maxPoints ? parseInt(form.maxPoints) : undefined,
        cooldownMinutes: form.cooldownMinutes ? parseInt(form.cooldownMinutes) : undefined,
      });
      setShowForm(false);
      setForm({ name: '', event: '', basePoints: '10', multiplierField: '', maxPoints: '', cooldownMinutes: '' });
      fetchRules();
    } catch {
      alert('Error creating point rule');
    }
  };

  const defaultDisplayRules = rules.length > 0 ? rules : [
    { id: '1', name: 'Purchase Points', event: 'purchase', basePoints: 1, multiplierField: 'amount', cooldownMinutes: 1, isActive: true },
    { id: '2', name: 'Review Bonus', event: 'review_submitted', basePoints: 50, cooldownMinutes: 1440, isActive: true },
    { id: '3', name: 'Profile Complete', event: 'profile_completed', basePoints: 100, isActive: true },
    { id: '4', name: 'Daily Check-in', event: 'daily_checkin', basePoints: 20, cooldownMinutes: 1440, isActive: true },
    { id: '5', name: 'Social Share', event: 'social_share', basePoints: 35, isActive: true },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Points & Rules</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700">
          + Add Rule
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">New Points Earning Rule</h3>
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Rule Name (e.g. Purchase Bonus)" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} className="border rounded-lg px-4 py-2" />
            <input placeholder="Event Name (e.g. purchase, review)" value={form.event}
              onChange={e => setForm({ ...form, event: e.target.value })} className="border rounded-lg px-4 py-2" />
            <input placeholder="Base Points (e.g. 50)" type="number" value={form.basePoints}
              onChange={e => setForm({ ...form, basePoints: e.target.value })} className="border rounded-lg px-4 py-2" />
            <input placeholder="Multiplier Field (optional, e.g. amount)" value={form.multiplierField}
              onChange={e => setForm({ ...form, multiplierField: e.target.value })} className="border rounded-lg px-4 py-2" />
            <input placeholder="Cooldown Minutes (optional, e.g. 1440)" type="number" value={form.cooldownMinutes}
              onChange={e => setForm({ ...form, cooldownMinutes: e.target.value })} className="border rounded-lg px-4 py-2 col-span-2" />
            <button onClick={handleCreate} className="bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 col-span-2">
              Create Point Rule
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Rule Name', 'Event', 'Base Points', 'Multiplier', 'Cooldown', 'Status'].map(h => (
                <th key={h} className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {defaultDisplayRules.map((r: any) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-semibold text-gray-900">{r.name || r.event}</td>
                <td className="px-6 py-4 text-sm font-mono text-indigo-700">{r.event}</td>
                <td className="px-6 py-4 font-semibold text-indigo-600">+{r.basePoints ?? r.points ?? 0} pts</td>
                <td className="px-6 py-4 text-sm text-gray-600">{r.multiplierField || '—'}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{r.cooldownMinutes ? `${r.cooldownMinutes}m` : 'None'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${(r.isActive ?? r.active ?? true) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {(r.isActive ?? r.active ?? true) ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── CHALLENGES PAGE ───
function ChallengesPage() {
  const [challenges, setChallenges] = useState<any[]>([]);

  useEffect(() => {
    api.challenges.list().then(r => setChallenges(r.data || r || [])).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Challenges</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {challenges.map(c => (
          <div key={c.id} className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex justify-between">
              <h3 className="font-semibold text-gray-900">{c.name}</h3>
              <span className={`text-xs px-2 py-1 rounded-full ${
                c.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {c.active ? 'Active' : 'Ended'}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">{c.description}</p>
            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t text-center">
              <div>
                <p className="text-lg font-bold text-indigo-600">{c.rewardPoints}</p>
                <p className="text-xs text-gray-400">Points</p>
              </div>
              <div>
                <p className="text-lg font-bold">{c.targetValue}</p>
                <p className="text-xs text-gray-400">Target</p>
              </div>
              <div>
                <p className="text-lg font-bold">{c.participantCount || 0}</p>
                <p className="text-xs text-gray-400">Joined</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── WEBHOOKS PAGE ───
function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ url: '', events: '', secret: '' });

  useEffect(() => {
    api.webhooks.list().then(r => setWebhooks(r.data || r || [])).catch(() => {});
  }, []);

  const handleCreate = async () => {
    try {
      await api.webhooks.create({ ...form, events: form.events.split(',').map(e => e.trim()) });
      setShowForm(false);
      setForm({ url: '', events: '', secret: '' });
      api.webhooks.list().then(r => setWebhooks(r.data || r || []));
    } catch {}
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Webhooks</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700">
          + Add Endpoint
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
          <div className="grid grid-cols-1 gap-4">
            <input placeholder="Webhook URL (https://...)" value={form.url}
              onChange={e => setForm({ ...form, url: e.target.value })} className="border rounded-lg px-4 py-2" />
            <input placeholder="Events (comma-separated, e.g. points.earned,tier.upgraded)" value={form.events}
              onChange={e => setForm({ ...form, events: e.target.value })} className="border rounded-lg px-4 py-2" />
            <input placeholder="Signing Secret" value={form.secret}
              onChange={e => setForm({ ...form, secret: e.target.value })} className="border rounded-lg px-4 py-2" />
            <button onClick={handleCreate} className="bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700">Create</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {webhooks.map(w => (
          <div key={w.id} className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-mono text-sm text-gray-900">{w.url}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {(w.events || []).map((e: string) => (
                    <span key={e} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{e}</span>
                  ))}
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                w.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {w.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SERVICE PLANS PAGE ───
function ServicePlansPage({ currentUser }: { currentUser?: any }) {
  const [plans, setPlans] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', description: '', price: '', billingCycle: 'MONTHLY', features: '{}' });
  const isSuperAdmin = currentUser?.email === 'admin@loyaltyplatform.com';

  useEffect(() => {
    api.servicePlans.list().then(setPlans).catch(() => {});
  }, []);

  const handleCreate = async () => {
    try {
      if (!form.name || !form.price) {
        alert('Please enter a Plan Name and Price.');
        return;
      }

      let parsedFeatures: Record<string, any> = { maxUsers: 100, maxTenants: 5 };
      if (form.features && form.features.trim()) {
        try {
          parsedFeatures = JSON.parse(form.features);
        } catch {
          // Fallback: convert plain text into object key-values
          parsedFeatures = { text: form.features, maxUsers: 100 };
        }
      }

      const generatedSlug = form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const priceInPaise = Math.round(parseFloat(form.price) * 100);

      await api.servicePlans.create({ 
        name: form.name,
        slug: generatedSlug,
        description: form.description || form.name,
        price: priceInPaise, 
        billingCycle: form.billingCycle,
        features: parsedFeatures 
      });
      setShowForm(false);
      setForm({ name: '', slug: '', description: '', price: '', billingCycle: 'MONTHLY', features: '{}' });
      api.servicePlans.list().then(setPlans);
    } catch (err: any) {
      console.error('Plan Creation Error:', err);
      alert(err.response?.data?.message || err.message || 'Error creating plan');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Plans</h1>
          <p className="text-xs text-gray-500 mt-1">{isSuperAdmin ? 'Manage platform SaaS subscription tiers' : '👁️ View available subscription tiers & features'}</p>
        </div>
        {isSuperAdmin && (
          <button onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700">
            + Create Plan
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
          <h3 className="font-semibold mb-4">New Service Plan</h3>
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Plan Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="border rounded-lg px-4 py-2" />
            <input placeholder="Slug (e.g. basic)" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
              className="border rounded-lg px-4 py-2" />
            <input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="border rounded-lg px-4 py-2 col-span-2" />
            <input placeholder="Price in ₹ Rupees (e.g. 100000 for 1 Lakh)" type="number" value={form.price}
              onChange={e => setForm({ ...form, price: e.target.value })} className="border rounded-lg px-4 py-2" />
            <select value={form.billingCycle} onChange={e => setForm({ ...form, billingCycle: e.target.value })}
              className="border rounded-lg px-4 py-2">
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="YEARLY">Yearly</option>
            </select>
            <textarea placeholder='Features (JSON or plain text, e.g. {"maxUsers": 100})' value={form.features}
              onChange={e => setForm({ ...form, features: e.target.value })} className="border rounded-lg px-4 py-2 col-span-2" rows={3} />
            <button onClick={handleCreate} className="bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 col-span-2">
              Create Plan
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map(plan => (
          <div key={plan.id} className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg text-gray-900">{plan.name}</h3>
              <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">{plan.billingCycle}</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">{plan.description}</p>
            <div className="border-t pt-4">
              <p className="text-2xl font-bold text-indigo-600">
                ₹{(plan.price > 10000 ? (plan.price / 100) : plan.price).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-400">per {plan.billingCycle.toLowerCase()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TENANTS PAGE ───
function TenantsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedKeysTenant, setSelectedKeysTenant] = useState<any>(null);
  const [form, setForm] = useState({
    name: '', slug: '', description: '', gstNumber: '', address: '', city: '', state: '', pincode: ''
  });

  useEffect(() => {
    api.tenants.list().then(setTenants).catch(() => {});
  }, []);

  const handleCreate = async () => {
    try {
      await api.tenants.create(form);
      setShowForm(false);
      setForm({ name: '', slug: '', description: '', gstNumber: '', address: '', city: '', state: '', pincode: '' });
      api.tenants.list().then(setTenants);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating tenant');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tenants & B2B Businesses</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700">
          + Create Tenant
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
          <h3 className="font-semibold mb-4 text-gray-900">New B2B Tenant Registration</h3>
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Tenant Name (e.g. Warehouse CEO)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="border rounded-lg px-4 py-2 text-sm" />
            <input placeholder="Slug (e.g. warehouse-ceo)" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
              className="border rounded-lg px-4 py-2 text-sm" />
            <input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="border rounded-lg px-4 py-2 col-span-2 text-sm" />
            <input placeholder="GSTIN Number (e.g. 22AAAAA0000A1Z5)" value={form.gstNumber} onChange={e => setForm({ ...form, gstNumber: e.target.value })}
              className="border rounded-lg px-4 py-2 uppercase font-mono text-sm" />
            <input placeholder="Street Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
              className="border rounded-lg px-4 py-2 text-sm" />
            <input placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
              className="border rounded-lg px-4 py-2 text-sm" />
            <input placeholder="State" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })}
              className="border rounded-lg px-4 py-2 text-sm" />
            <input placeholder="Pincode" value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })}
              className="border rounded-lg px-4 py-2 text-sm col-span-2" />
            <button onClick={handleCreate} className="bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 col-span-2 text-sm">
              Save & Provision Tenant
            </button>
          </div>
        </div>
      )}

      {/* Integration API Credentials Modal */}
      {selectedKeysTenant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2">🔑 External B2B Integration API Keys</h3>
            <p className="text-sm text-gray-500 mb-4">Provisioned for: <span className="font-semibold text-gray-900">{selectedKeysTenant.name}</span></p>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-gray-500 text-[10px] uppercase mb-1">API Key</label>
                <div className="bg-gray-100 p-2 rounded border flex justify-between items-center">
                  <span className="truncate">{selectedKeysTenant.apiKey}</span>
                  <button onClick={() => navigator.clipboard.writeText(selectedKeysTenant.apiKey)} className="text-indigo-600 font-sans font-medium text-xs ml-2">Copy</button>
                </div>
              </div>
              <div>
                <label className="block text-gray-500 text-[10px] uppercase mb-1">API Secret</label>
                <div className="bg-gray-100 p-2 rounded border flex justify-between items-center">
                  <span className="truncate">{selectedKeysTenant.apiSecret}</span>
                  <button onClick={() => navigator.clipboard.writeText(selectedKeysTenant.apiSecret)} className="text-indigo-600 font-sans font-medium text-xs ml-2">Copy</button>
                </div>
              </div>
              <div>
                <label className="block text-gray-500 text-[10px] uppercase mb-1">Sample Integration Request</label>
                <pre className="bg-gray-900 text-green-400 p-3 rounded text-[11px] overflow-x-auto">
{`curl -X GET https://loyalty-production-033a.up.railway.app/api/v1/users \\
  -H "x-api-key: ${selectedKeysTenant.apiKey}"`}
                </pre>
              </div>
            </div>

            <button onClick={() => setSelectedKeysTenant(null)}
              className="w-full bg-gray-900 text-white py-2 rounded-lg font-medium hover:bg-gray-800 mt-6 text-sm">
              Close
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {tenants.map(tenant => (
          <div key={tenant.id} className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-lg text-gray-900">{tenant.name}</h3>
                  {tenant.gstNumber && (
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-mono">GST: {tenant.gstNumber}</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">{tenant.description || 'No description provided'}</p>
                {tenant.address && (
                  <p className="text-xs text-gray-400 mt-1">📍 {tenant.address}, {tenant.city}, {tenant.state} - {tenant.pincode}</p>
                )}
                <div className="mt-4 flex items-center gap-4">
                  <button onClick={() => setSelectedKeysTenant(tenant)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                    🔑 View Integration API Keys
                  </button>
                  <span className="text-xs text-gray-400">Slug: <code className="font-mono">{tenant.slug}</code></span>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                tenant.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {tenant.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── LOYALTY WALLET & LEDGER PAGE ───
function LoyaltyWalletPage({ currentUser: propUser }: { currentUser?: any }) {
  const [user, setUser] = useState<any>(propUser);
  const [summary, setSummary] = useState<any>(null);
  const [userList, setUserList] = useState<any[]>([]);

  useEffect(() => {
    if (propUser) {
      setUser(propUser);
    } else {
      api.users.me().then(u => setUser(u)).catch(() => {});
    }
  }, [propUser]);

  const isSuperAdmin = user?.email === 'admin@loyaltyplatform.com';
  const [selectedUser, setSelectedUser] = useState<string>('INIT');

  useEffect(() => {
    if (isSuperAdmin) {
      api.users.list({ limit: 100 }).then(u => setUserList(u.data || u || [])).catch(() => {});
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (user && selectedUser === 'INIT') {
      const initialUser = isSuperAdmin ? 'ALL' : user.id;
      setSelectedUser(initialUser);
    }
  }, [user, isSuperAdmin, selectedUser]);

  useEffect(() => {
    if (selectedUser !== 'INIT') {
      const targetId = (selectedUser === 'ALL' || !selectedUser) ? (isSuperAdmin ? undefined : user?.id) : selectedUser;
      if (targetId || isSuperAdmin) {
        api.points.walletSummary(targetId).then(setSummary).catch(() => {});
      }
    }
  }, [selectedUser, user, isSuperAdmin]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">👛 Loyalty Wallet & Points Ledger</h1>
          <p className="text-gray-500 text-sm">Real-time point balances, transaction ledger, and wallet activity</p>
        </div>
        {isSuperAdmin && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-600">Filter Wallet User:</label>
            <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm bg-white font-medium shadow-sm">
              <option value="ALL">🌐 System Platform (All Users Aggregate)</option>
              {userList.map(u => (
                <option key={u.id} value={u.id}>
                  👤 {u.firstName} {u.lastName} ({u.email}) - {u.availablePoints?.toLocaleString()} pts
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 4 Cards matching diagram */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Available Points Wallet" value={summary?.availablePoints?.toLocaleString() || '0'} icon="💎" />
        <StatCard title="Total Earned Points" value={summary?.totalEarned?.toLocaleString() || '0'} change="+100%" icon="📈" />
        <StatCard title="Total Redeemed Points" value={summary?.totalRedeemed?.toLocaleString() || '0'} icon="🎁" />
        <StatCard title="Total Expired Points" value={summary?.totalExpired?.toLocaleString() || '0'} icon="⌛" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 text-sm">📜 Points Ledger Transaction Log</h3>
          <span className="text-xs text-gray-500">Showing last 50 transactions</span>
        </div>
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['User', 'Type', 'Amount', 'Description', 'Source', 'Date'].map(h => (
                <th key={h} className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {(summary?.recentLedger || []).map((t: any) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">
                  {t.user?.firstName} {t.user?.lastName} <span className="text-xs text-gray-400">({t.user?.email})</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    t.type === 'EARN' ? 'bg-green-100 text-green-800' :
                    t.type === 'REDEEM' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {t.type}
                  </span>
                </td>
                <td className={`px-6 py-4 font-bold ${t.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {t.amount > 0 ? `+${t.amount.toLocaleString()}` : t.amount.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-gray-600">{t.description}</td>
                <td className="px-6 py-4 font-mono text-xs text-gray-500">{t.source}</td>
                <td className="px-6 py-4 text-gray-400 text-xs">{new Date(t.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── SUBSCRIPTIONS PAGE ───
function SubscriptionsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  useEffect(() => {
    api.tenants.list().then(setTenants).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedTenant) {
      api.subscriptions.list(selectedTenant).then(setSubscriptions).catch(() => {});
    }
  }, [selectedTenant]);

  const STATUS_COLORS: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    TRIALING: 'bg-blue-100 text-blue-800',
    PAST_DUE: 'bg-yellow-100 text-yellow-800',
    CANCELED: 'bg-red-100 text-red-800',
    EXPIRED: 'bg-gray-100 text-gray-800',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Subscriptions</h1>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Tenant</label>
        <select value={selectedTenant} onChange={e => setSelectedTenant(e.target.value)}
          className="border rounded-lg px-4 py-2 w-full max-w-md">
          <option value="">-- Select a tenant --</option>
          {tenants.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {selectedTenant && (
        <div className="space-y-4">
          {subscriptions.length === 0 ? (
            <div className="bg-white rounded-xl p-8 shadow-sm border text-center text-gray-500">
              No subscriptions found for this tenant
            </div>
          ) : (
            subscriptions.map(sub => (
              <div key={sub.id} className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-lg text-gray-900">{sub.plan?.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[sub.status] || ''}`}>
                        {sub.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Period: {new Date(sub.currentPeriodStart).toLocaleDateString()} - {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                    </p>
                    <div className="mt-3">
                      <span className="text-lg font-bold text-indigo-600">₹{(sub.plan?.price / 100).toFixed(2)}</span>
                      <span className="text-sm text-gray-400"> / {sub.plan?.billingCycle.toLowerCase()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── CHECKOUT PAGE (B2B Cart & Checkout) ───
function CheckoutPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedTenant, setSelectedTenant] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [pointsToUse, setPointsToUse] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [loading, setLoading] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);

  useEffect(() => {
    api.tenants.list().then(setTenants).catch(() => {});
    api.servicePlans.list().then(setPlans).catch(() => {});
  }, []);

  const currentPlan = plans.find(p => p.id === selectedPlan);
  const planPriceRupees = currentPlan ? currentPlan.price / 100 : 0;
  const pointsDiscountRupees = Math.min(planPriceRupees, pointsToUse);
  const finalPayableRupees = Math.max(0, planPriceRupees - pointsDiscountRupees);

  const handleCheckout = async () => {
    if (!selectedTenant || !selectedPlan) {
      alert('Please select both a Tenant and a Service Plan');
      return;
    }
    setLoading(true);
    try {
      const checkoutRes = await api.orders.checkout({
        tenantId: selectedTenant,
        planId: selectedPlan,
        pointsToUse,
        paymentMethod,
        gstNumber,
        address,
        city,
        state: stateName,
        pincode,
      });

      // Simulate payment gateway completion
      const payRes = await api.orders.pay(checkoutRes.order.id, {
        paymentId: `PAY-${Date.now()}`,
        status: 'SUCCESS',
      });

      setOrderResult({ checkout: checkoutRes, pay: payRes });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">🛒 B2B Cart & Subscription Checkout</h1>

      {orderResult ? (
        <div className="bg-white rounded-2xl shadow-sm border p-8 text-center">
          <span className="text-5xl">🎉</span>
          <h2 className="text-2xl font-bold text-gray-900 mt-4">Order & Subscription Confirmed!</h2>
          <p className="text-gray-500 mt-2">Order #{orderResult.checkout?.order?.orderNumber}</p>
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 my-6 text-sm">
            ✅ Payment Verified ({orderResult.checkout?.order?.paymentMethod}) • Tenant Subscription Activated
          </div>
          <div className="grid grid-cols-3 gap-4 text-left border-t border-b py-4 my-6">
            <div>
              <p className="text-xs text-gray-400">Subtotal</p>
              <p className="font-bold text-gray-900">₹{orderResult.checkout?.summary?.subtotalRupees}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Points Discount</p>
              <p className="font-bold text-green-600">-₹{orderResult.checkout?.summary?.discountRupees}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Amount Paid</p>
              <p className="font-bold text-indigo-600">₹{orderResult.checkout?.summary?.totalPayableRupees}</p>
            </div>
          </div>
          <button onClick={() => setOrderResult(null)}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700">
            Create Another Order
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Tenant & Plan Selection */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="font-bold text-gray-900 mb-4">1. Select Business & Service Plan</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Tenant (Business)</label>
                  <select value={selectedTenant} onChange={e => setSelectedTenant(e.target.value)}
                    className="w-full border rounded-lg px-4 py-2">
                    <option value="">-- Choose Tenant --</option>
                    {tenants.map(t => <option key={t.id} value={t.id}>{t.name} ({t.slug})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Service Plan</label>
                  <div className="grid grid-cols-2 gap-3">
                    {plans.map(p => (
                      <div key={p.id} onClick={() => setSelectedPlan(p.id)}
                        className={`border rounded-xl p-4 cursor-pointer transition-all ${
                          selectedPlan === p.id ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500' : 'hover:border-gray-300'
                        }`}>
                        <p className="font-bold text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.description}</p>
                        <p className="text-lg font-bold text-indigo-600 mt-2">₹{(p.price / 100).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Business GST & Address Details */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="font-bold text-gray-900 mb-4">2. Business Tax & Address Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">GSTIN Number</label>
                  <input placeholder="22AAAAA0000A1Z5" value={gstNumber} onChange={e => setGstNumber(e.target.value)}
                    className="w-full border rounded-lg px-4 py-2 uppercase font-mono text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Street Address</label>
                  <input placeholder="123 Business Park, Main St" value={address} onChange={e => setAddress(e.target.value)}
                    className="w-full border rounded-lg px-4 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                  <input placeholder="Mumbai" value={city} onChange={e => setCity(e.target.value)}
                    className="w-full border rounded-lg px-4 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                  <input placeholder="Maharashtra" value={stateName} onChange={e => setStateName(e.target.value)}
                    className="w-full border rounded-lg px-4 py-2 text-sm" />
                </div>
              </div>
            </div>

            {/* 3. Loyalty Points Discount */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="font-bold text-gray-900 mb-2">3. Apply Loyalty Wallet Points</h3>
              <p className="text-xs text-gray-500 mb-4">1 Point = ₹1 Discount on subscription renewal</p>
              <div className="flex items-center gap-4">
                <input type="number" min="0" placeholder="Points to redeem" value={pointsToUse || ''}
                  onChange={e => setPointsToUse(Math.max(0, parseInt(e.target.value) || 0))}
                  className="border rounded-lg px-4 py-2 w-48 text-sm" />
                <span className="text-sm font-semibold text-green-600">-₹{pointsDiscountRupees} Discount</span>
              </div>
            </div>
          </div>

          {/* Cart Summary Side Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="font-bold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-3 border-b pb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Plan Price</span>
                  <span className="font-semibold">₹{planPriceRupees}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Loyalty Discount</span>
                  <span>-₹{pointsDiscountRupees}</span>
                </div>
              </div>
              <div className="flex justify-between items-center py-4">
                <span className="font-bold text-gray-900">Total Payable</span>
                <span className="text-2xl font-bold text-indigo-600">₹{finalPayableRupees}</span>
              </div>

              <div className="space-y-3 mt-4">
                <label className="block text-xs font-medium text-gray-700">Payment Gateway Option</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="NETBANKING">Net Banking</option>
                </select>
                <button onClick={handleCheckout} disabled={loading || !selectedTenant || !selectedPlan}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 mt-4">
                  {loading ? 'Processing Payment...' : 'Pay & Activate Subscription'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AGE VERIFICATION PAGE (Altria 21+ Compliance) ───
function AgeVerificationPage({ currentUser: propUser }: { currentUser?: any }) {
  const [user, setUser] = useState<any>(propUser);
  const [userId, setUserId] = useState(propUser?.id || '');
  const [documentType, setDocumentType] = useState('DRIVERS_LICENSE');
  const [documentNumber, setDocumentNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (propUser) {
      setUser(propUser);
      setUserId(propUser.id);
    } else {
      api.users.me().then(u => {
        setUser(u);
        setUserId(u.id);
      }).catch(() => {});
    }
  }, [propUser]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.ageVerification.verify({
        userId,
        documentType,
        documentNumber,
        dateOfBirth,
      });
      setResult(res);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Age verification failed');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">🔞 Altria Age Verification (21+)</h1>
      <p className="text-gray-500 mb-6">Verify customer age for tobacco offer compliance & ATC21+ status</p>

      <div className="bg-white rounded-xl p-6 shadow-sm border mb-8">
        <form onSubmit={handleVerify} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Your Customer Account ID {user?.email ? `(${user.email})` : ''}
            </label>
            <input placeholder="Auto-filled Customer ID" value={userId} onChange={e => setUserId(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 text-sm bg-gray-50 font-mono text-gray-700" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Document Type</label>
            <select value={documentType} onChange={e => setDocumentType(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 text-sm">
              <option value="DRIVERS_LICENSE">Driver's License</option>
              <option value="PASSPORT">Passport</option>
              <option value="STATE_ID">State ID</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Document Number</label>
            <input placeholder="DL-98765432" value={documentNumber} onChange={e => setDocumentNumber(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 text-sm" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth (YYYY-MM-DD)</label>
            <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 text-sm" required />
          </div>
          <button type="submit" className="col-span-2 bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700">
            Verify Age & Submit
          </button>
        </form>
      </div>

      {result && (
        <div className={`rounded-xl p-6 border ${result.is21Plus ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{result.is21Plus ? '✅' : '❌'}</span>
            <div>
              <h3 className="font-bold text-lg">{result.message}</h3>
              <p className="text-sm mt-1">Calculated Age: {result.age} years old</p>
              <p className="text-sm">AVT Scan Count: {result.scanCount}/3</p>
              <p className="text-sm font-semibold mt-1">
                ATC21+ Qualified: {result.isATC21Plus ? 'YES (Eligible for Digital Tobacco Coupons)' : 'NO'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// ─── PRODUCTS / SOFTWARE PAGE ───
function ProductsPage({ currentUser }: { currentUser?: any }) {
  const isSuperAdmin = currentUser?.email === 'admin@loyaltyplatform.com';
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0');
  const [status, setStatus] = useState('ACTIVE');

  const fetchProducts = async () => {
    try {
      const data = await api.products.list();
      setProducts(data);
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setSlug('');
    setDescription('');
    setPrice('0');
    setStatus('ACTIVE');
    setShowModal(true);
  };

  const handleOpenEdit = (p: any) => {
    setEditingId(p.id);
    setName(p.name);
    setSlug(p.slug);
    setDescription(p.description || '');
    setPrice(String((p.price || 0) / 100));
    setStatus(p.status || 'ACTIVE');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description,
        price: Math.round(parseFloat(price || '0') * 100),
        status,
      };

      if (editingId) {
        await api.products.update(editingId, payload);
      } else {
        await api.products.create(payload);
      }
      setShowModal(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save product');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.products.delete(id);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete product');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🚀 Products & Software Directory</h1>
          <p className="text-gray-500 text-sm">Manage business software suites (e.g. Warehouse CEO, CRM, Accounting)</p>
        </div>
        {isSuperAdmin && (
          <button onClick={handleOpenCreate} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition">
            + Add New Product
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center border text-gray-500">
          No products created yet. {isSuperAdmin && 'Click "+ Add New Product" to create Warehouse CEO, CRM, or Accounting Software.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((p) => (
            <div key={p.id} className="bg-white border rounded-xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-gray-900">{p.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${p.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {p.status}
                  </span>
                </div>
                <p className="text-xs text-indigo-600 font-mono mb-2">Slug: {p.slug}</p>
                <p className="text-sm text-gray-600 mb-4">{p.description || 'No description provided.'}</p>
              </div>

              <div>
                <div className="border-t pt-3 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-gray-400 block">Starting Price</span>
                    <span className="text-xl font-bold text-gray-900">₹{(p.price / 100).toFixed(2)}</span>
                  </div>
                  {isSuperAdmin && (
                    <div className="flex gap-2">
                      <button onClick={() => handleOpenEdit(p)} className="text-indigo-600 hover:text-indigo-900 text-sm font-semibold">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-900 text-sm font-semibold">
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Product' : 'Add New Product/Software'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Product Name</label>
                <input placeholder="e.g. Warehouse CEO" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">URL Slug</label>
                <input placeholder="e.g. warehouse-ceo" value={slug} onChange={(e) => setSlug(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea placeholder="Enter software features or details..." value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" rows={3} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Price (₹ INR)</label>
                <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── BUSINESS PROFILE PAGE (Business Owner Editable Profile) ───
function BusinessProfilePage({ currentUser }: { currentUser?: any }) {
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');

  useEffect(() => {
    // Fetch tenants and find matching tenant for current business owner or default to active business profile
    api.tenants.list().then((tenants: any[]) => {
      const myTenant = tenants.find((t: any) => t.id === currentUser?.tenantId || t.name.toLowerCase().includes('warehouse') || tenants.length > 0) || tenants[0];
      if (myTenant) {
        setTenant(myTenant);
        setName(myTenant.name || '');
        setDescription(myTenant.description || '');
        setGstNumber(myTenant.gstNumber || '');
        setAddress(myTenant.address || '');
        setCity(myTenant.city || '');
        setState(myTenant.state || '');
        setPincode(myTenant.pincode || '');
        setApiKey(myTenant.apiKey || '');
        setApiSecret(myTenant.apiSecret || '');
      }
    }).catch(err => console.error(err)).finally(() => setLoading(false));
  }, [currentUser]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    setSaving(true);
    setMessage('');
    try {
      const updated = await api.tenants.update(tenant.id, {
        name,
        description,
        gstNumber,
        address,
        city,
        state,
        pincode,
      });
      setTenant(updated);
      setMessage('✅ Business Profile updated successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update business profile');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateKeys = async () => {
    if (!tenant || !confirm('Regenerate API keys? Previous integration keys will stop working.')) return;
    try {
      const updated = await api.tenants.regenerateCredentials(tenant.id);
      setTenant(updated);
      setApiKey(updated.apiKey);
      setApiSecret(updated.apiSecret);
      alert('New Integration API keys generated!');
    } catch (err: any) {
      alert('Failed to regenerate API keys');
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Loading Business Profile...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏢 My Business Profile</h1>
          <p className="text-gray-500 text-sm">Manage your store details, GST tax information, and external API integrations</p>
        </div>
        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase">
          🏬 Tenant / Store Account
        </span>
      </div>

      {message && <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl mb-6 text-sm font-medium">{message}</div>}

      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <form onSubmit={handleSave} className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Business Identification</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Company / Store Name</label>
              <input value={name} onChange={e => setName(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">GSTIN Number</label>
              <input value={gstNumber} onChange={e => setGstNumber(e.target.value)} placeholder="22AAAAA0000A1Z5"
                className="w-full border rounded-lg px-4 py-2 text-sm uppercase font-mono focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Business Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                className="w-full border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>

          <h3 className="text-lg font-bold text-gray-900 border-b pb-2 pt-4">Registered Location Address</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Street Address</label>
              <input value={address} onChange={e => setAddress(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
              <input value={city} onChange={e => setCity(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
              <input value={state} onChange={e => setState(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Pincode</label>
              <input value={pincode} onChange={e => setPincode(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button type="submit" disabled={saving}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition">
              {saving ? 'Saving Profile...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Integration Credentials Section */}
      <div className="bg-gray-900 text-white rounded-xl p-6 shadow-sm border">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-bold">🔑 B2B Webhook & API Keys</h3>
            <p className="text-xs text-gray-400">Use these keys to connect Warehouse CEO or POS to award loyalty points automatically</p>
          </div>
          <button onClick={handleRegenerateKeys}
            className="bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs px-3 py-1.5 rounded-lg border border-gray-700">
            🔄 Regenerate Keys
          </button>
        </div>

        <div className="space-y-3 font-mono text-xs">
          <div>
            <span className="text-gray-400 text-[10px] block uppercase">API Key</span>
            <div className="bg-gray-800 p-2.5 rounded border border-gray-700 flex justify-between items-center mt-1">
              <span className="text-indigo-300">{apiKey || 'No key generated'}</span>
              <button onClick={() => { navigator.clipboard.writeText(apiKey); alert('Copied API Key!'); }}
                className="text-xs text-indigo-400 hover:underline">Copy</button>
            </div>
          </div>
          <div>
            <span className="text-gray-400 text-[10px] block uppercase">API Secret</span>
            <div className="bg-gray-800 p-2.5 rounded border border-gray-700 flex justify-between items-center mt-1">
              <span className="text-indigo-300">{apiSecret || 'No secret generated'}</span>
              <button onClick={() => { navigator.clipboard.writeText(apiSecret); alert('Copied API Secret!'); }}
                className="text-xs text-indigo-400 hover:underline">Copy</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── APP ───
export default function App() {
  const { isAuthenticated } = useAdminStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />} />
        <Route path="/*" element={
          isAuthenticated ? (
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/business-profile" element={<BusinessProfilePage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/rewards" element={<RewardsPage />} />
                <Route path="/points" element={<PointsPage />} />
                <Route path="/challenges" element={<ChallengesPage />} />
                <Route path="/webhooks" element={<WebhooksPage />} />
                <Route path="/service-plans" element={<ServicePlansPage />} />
                <Route path="/tenants" element={<TenantsPage />} />
                <Route path="/subscriptions" element={<SubscriptionsPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/wallet" element={<LoyaltyWalletPage />} />
                <Route path="/age-verification" element={<AgeVerificationPage />} />
              </Routes>
            </Layout>
          ) : <Navigate to="/login" />
        } />
      </Routes>
    </BrowserRouter>
  );
}
