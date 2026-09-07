import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAdminStore } from './store';
import { api } from './services/api';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// ─── LOGIN PAGE ───
function LoginPage() {
  const { login } = useAdminStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.auth.login({ email, password });
      login(res.accessToken);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-500 mb-6">Loyalty Platform Management</p>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 mb-4 focus:ring-2 focus:ring-indigo-500 outline-none" required />
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 mb-6 focus:ring-2 focus:ring-indigo-500 outline-none" required />
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── SIDEBAR ───
const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/users', label: 'Users', icon: '👥' },
  { path: '/rewards', label: 'Rewards', icon: '🎁' },
  { path: '/points', label: 'Points & Rules', icon: '💎' },
  { path: '/challenges', label: 'Challenges', icon: '🏆' },
  { path: '/webhooks', label: 'Webhooks', icon: '🔗' },
  { path: '/service-plans', label: 'Service Plans', icon: '📦' },
  { path: '/tenants', label: 'Tenants', icon: '🏢' },
  { path: '/subscriptions', label: 'Subscriptions', icon: '💳' },
];

function Sidebar() {
  const location = useLocation();
  const { logout } = useAdminStore();
  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-xl font-bold">🏅 Loyalty Admin</h2>
      </div>
      <nav className="flex-1 py-4">
        {NAV_ITEMS.map(item => (
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
function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [timeseries, setTimeseries] = useState<any[]>([]);
  const [topRewards, setTopRewards] = useState<any[]>([]);

  useEffect(() => {
    api.analytics.dashboard().then(setStats).catch(() => {});
    api.analytics.pointsTimeseries({ period: '30d' }).then(setTimeseries).catch(() => {});
    api.analytics.topRewards().then(setTopRewards).catch(() => {});
  }, []);

  const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Users" value={stats?.totalUsers?.toLocaleString() || '—'} change={stats?.userGrowth} icon="👥" />
        <StatCard title="Active Users (30d)" value={stats?.activeUsers?.toLocaleString() || '—'} icon="📈" />
        <StatCard title="Points Issued" value={stats?.totalPointsIssued?.toLocaleString() || '—'} icon="💎" />
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
          <h3 className="font-semibold text-gray-900 mb-4">Top Rewards</h3>
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

// ─── USERS PAGE ───
function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.users.list({ page, limit: 20, search: search || undefined }).then(r => setUsers(r.data || r || [])).catch(() => {});
  }, [page, search]);

  const TIER_COLORS: Record<string, string> = {
    BRONZE: 'bg-orange-100 text-orange-800', SILVER: 'bg-gray-100 text-gray-800',
    GOLD: 'bg-yellow-100 text-yellow-800', PLATINUM: 'bg-purple-100 text-purple-800',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <input type="text" placeholder="Search users..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="border rounded-lg px-4 py-2 w-64 focus:ring-2 focus:ring-indigo-500 outline-none" />
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Name', 'Email', 'Tier', 'Points', 'Streak', 'Joined'].map(h => (
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
                <td className="px-6 py-4 font-semibold">{u.totalPoints?.toLocaleString()}</td>
                <td className="px-6 py-4">{u.streakDays || 0}d 🔥</td>
                <td className="px-6 py-4 text-gray-500 text-sm">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-between items-center p-4 border-t">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50">Previous</button>
          <span className="text-sm text-gray-500">Page {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={users.length < 20}
            className="px-4 py-2 border rounded-lg disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  );
}

// ─── REWARDS PAGE ───
function RewardsPage() {
  const [rewards, setRewards] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', pointsCost: '', category: 'MERCHANDISE', stock: '' });

  useEffect(() => {
    api.rewards.list().then(r => setRewards(r.data || r || [])).catch(() => {});
  }, []);

  const handleCreate = async () => {
    try {
      await api.rewards.create({ ...form, pointsCost: parseInt(form.pointsCost), stock: parseInt(form.stock) || null });
      setShowForm(false);
      setForm({ name: '', description: '', pointsCost: '', category: 'MERCHANDISE', stock: '' });
      api.rewards.list().then(r => setRewards(r.data || r || []));
    } catch {}
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rewards Catalog</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700">
          + Add Reward
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
          <h3 className="font-semibold mb-4">New Reward</h3>
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="border rounded-lg px-4 py-2" />
            <input placeholder="Points Cost" type="number" value={form.pointsCost}
              onChange={e => setForm({ ...form, pointsCost: e.target.value })} className="border rounded-lg px-4 py-2" />
            <input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="border rounded-lg px-4 py-2" />
            <input placeholder="Stock (empty = unlimited)" type="number" value={form.stock}
              onChange={e => setForm({ ...form, stock: e.target.value })} className="border rounded-lg px-4 py-2" />
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              className="border rounded-lg px-4 py-2">
              {['MERCHANDISE', 'DISCOUNT', 'EXPERIENCE', 'DIGITAL', 'CHARITY'].map(c =>
                <option key={c} value={c}>{c}</option>
              )}
            </select>
            <button onClick={handleCreate} className="bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">Create</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.map(r => (
          <div key={r.id} className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-gray-900">{r.name}</h3>
              <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">{r.category}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">{r.description}</p>
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <span className="font-bold text-indigo-600">{r.pointsCost?.toLocaleString()} pts</span>
              <span className="text-sm text-gray-400">
                {r.stock != null ? `${r.stock} left` : 'Unlimited'}
              </span>
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

  useEffect(() => {
    api.points.rules().then(r => setRules(r.data || r || [])).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Points & Rules</h1>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Event', 'Points', 'Multiplier', 'Cooldown', 'Active'].map(h => (
                <th key={h} className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rules.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{r.eventName}</td>
                <td className="px-6 py-4 font-semibold text-indigo-600">+{r.points}</td>
                <td className="px-6 py-4">{r.multiplierField || '—'}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{r.cooldownMinutes ? `${r.cooldownMinutes}m` : 'None'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${r.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {r.active ? 'Active' : 'Inactive'}
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
function ServicePlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', description: '', price: '', billingCycle: 'MONTHLY', features: '{}' });

  useEffect(() => {
    api.servicePlans.list().then(setPlans).catch(() => {});
  }, []);

  const handleCreate = async () => {
    try {
      await api.servicePlans.create({ 
        ...form, 
        price: parseInt(form.price), 
        features: JSON.parse(form.features) 
      });
      setShowForm(false);
      setForm({ name: '', slug: '', description: '', price: '', billingCycle: 'MONTHLY', features: '{}' });
      api.servicePlans.list().then(setPlans);
    } catch (err) {
      alert('Error creating plan. Check console for details.');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Service Plans</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700">
          + Create Plan
        </button>
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
            <input placeholder="Price (in paise, e.g. 99900 for ₹999)" type="number" value={form.price}
              onChange={e => setForm({ ...form, price: e.target.value })} className="border rounded-lg px-4 py-2" />
            <select value={form.billingCycle} onChange={e => setForm({ ...form, billingCycle: e.target.value })}
              className="border rounded-lg px-4 py-2">
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="YEARLY">Yearly</option>
            </select>
            <textarea placeholder='Features (JSON, e.g. {"maxUsers": 10, "apiAccess": true})' value={form.features}
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
              <p className="text-2xl font-bold text-indigo-600">₹{(plan.price / 100).toFixed(2)}</p>
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
  const [form, setForm] = useState({ name: '', slug: '', description: '' });

  useEffect(() => {
    api.tenants.list().then(setTenants).catch(() => {});
  }, []);

  const handleCreate = async () => {
    try {
      await api.tenants.create(form);
      setShowForm(false);
      setForm({ name: '', slug: '', description: '' });
      api.tenants.list().then(setTenants);
    } catch (err) {
      alert('Error creating tenant');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700">
          + Create Tenant
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
          <h3 className="font-semibold mb-4">New Tenant</h3>
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Tenant Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="border rounded-lg px-4 py-2" />
            <input placeholder="Slug (e.g. my-business)" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
              className="border rounded-lg px-4 py-2" />
            <input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="border rounded-lg px-4 py-2 col-span-2" />
            <button onClick={handleCreate} className="bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 col-span-2">
              Create Tenant
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {tenants.map(tenant => (
          <div key={tenant.id} className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900">{tenant.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{tenant.description}</p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">API Key:</span>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{tenant.apiKey}</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Slug:</span>
                    <span className="text-xs font-medium">{tenant.slug}</span>
                  </div>
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

// ─── LAYOUT ───
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-gray-50 overflow-auto">{children}</main>
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
                <Route path="/users" element={<UsersPage />} />
                <Route path="/rewards" element={<RewardsPage />} />
                <Route path="/points" element={<PointsPage />} />
                <Route path="/challenges" element={<ChallengesPage />} />
                <Route path="/webhooks" element={<WebhooksPage />} />
                <Route path="/service-plans" element={<ServicePlansPage />} />
                <Route path="/tenants" element={<TenantsPage />} />
                <Route path="/subscriptions" element={<SubscriptionsPage />} />
              </Routes>
            </Layout>
          ) : <Navigate to="/login" />
        } />
      </Routes>
    </BrowserRouter>
  );
}
