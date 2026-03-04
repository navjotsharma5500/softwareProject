import React, { useEffect, useState } from 'react';
import { Users, FileText, Package, TrendingUp, CheckCircle, Search, ClipboardList, Ban } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../utils/api';

// eslint-disable-next-line no-unused-vars
const StatCard = ({ icon: Icon, label, value, sub }) => (
  <div className="rounded-xl border border-gray-200 p-6 bg-white shadow-sm flex flex-col gap-3">
    <div className="flex items-center gap-2 text-gray-500">
      <Icon size={18} />
      <span className="text-sm font-medium">{label}</span>
    </div>
    <div className="text-4xl font-bold text-gray-900 tabular-nums">{value}</div>
    {sub && <p className="text-xs text-gray-400">{sub}</p>}
  </div>
);

const Stats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Check localStorage for 10-minute client-side cache (matches backend Redis TTL).
        const cached = localStorage.getItem('publicStats');
        if (cached) {
          const parsed = JSON.parse(cached);
          const isFresh = parsed.lastUpdated &&
            (Date.now() - new Date(parsed.lastUpdated).getTime() < 600000);
          const hasNewFields = parsed.blacklistedUsers !== undefined;
          if (isFresh && hasNewFields) {
            setStats(parsed);
            setLoading(false);
            return;
          }
        }
        const res = await api.get('/stats');
        setStats(res.data);
        localStorage.setItem('publicStats', JSON.stringify(res.data));
      } catch {
        setError('Failed to load stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Our Impact</h1>
          <p className="text-gray-500 max-w-md mx-auto">
            Helping the Thapar community reunite with their belongings — one item at a time.
          </p>
        </div>

        {/* Primary metrics — larger, top row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
          <StatCard
            icon={Users}
            label="Community Members"
            value={stats.totalUsers}
            sub="Registered users on the platform"
          />
          <StatCard
            icon={CheckCircle}
            label="People Helped"
            value={stats.peopleHelped}
            sub="Items successfully returned to owners"
          />
          <StatCard
            icon={TrendingUp}
            label="Recovery Rate"
            value={`${stats.recoveryRate}%`}
            sub="Of registered items have been claimed"
          />
        </div>

        {/* Secondary metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-5 mb-10">
          <StatCard
            icon={Package}
            label="Total Items"
            value={stats.totalItems}
          />
          <StatCard
            icon={Search}
            label="Available"
            value={stats.lostItems}
            sub="Waiting to be claimed"
          />
          <StatCard
            icon={FileText}
            label="Lost Reports"
            value={stats.totalReports}
          />
          <StatCard
            icon={ClipboardList}
            label="Claims Filed"
            value={stats.totalClaims}
          />
          <StatCard
            icon={Ban}
            label="Blacklisted"
            value={stats.blacklistedUsers ?? 0}
            sub="Restricted accounts"
          />
        </div>

        <p className="text-xs text-gray-400 text-center">
          Last updated: {new Date(stats.lastUpdated).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default Stats;
