'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Download,
  Calendar,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Transaction {
  id: string;
  type: 'subscription' | 'payout' | 'refund';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  description: string;
  user_name?: string;
  tier_name?: string;
  created_at: string;
}

export default function CommunityEarningsPage() {
  const params = useParams();
  const { user } = useAuth();
  const communityId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState({
    total: 0,
    thisMonth: 0,
    lastMonth: 0,
    pendingPayout: 0,
    subscriberCount: 0
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchEarningsData();
  }, [communityId, timeFilter]);

  async function fetchEarningsData() {
    try {
      setLoading(true);
      
      // For now, we'll use mock data
      // In production, these would be real API calls
      setEarnings({
        total: 12450,
        thisMonth: 2840,
        lastMonth: 2560,
        pendingPayout: 850,
        subscriberCount: 42
      });

      // Mock transactions
      setTransactions([
        {
          id: '1',
          type: 'subscription',
          amount: 49.99,
          status: 'completed',
          description: 'Premium Tier Subscription',
          user_name: 'John Doe',
          tier_name: 'Premium',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          type: 'subscription',
          amount: 19.99,
          status: 'completed',
          description: 'Basic Tier Subscription',
          user_name: 'Jane Smith',
          tier_name: 'Basic',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          type: 'payout',
          amount: -500.00,
          status: 'completed',
          description: 'Monthly Payout to Bank Account',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '4',
          type: 'subscription',
          amount: 99.99,
          status: 'pending',
          description: 'VIP Tier Subscription',
          user_name: 'Bob Johnson',
          tier_name: 'VIP',
          created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]);
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getTransactionIcon(type: string) {
    if (type === 'subscription') return ArrowDownRight;
    if (type === 'payout') return ArrowUpRight;
    return CreditCard;
  }

  const monthGrowth = earnings.lastMonth > 0 
    ? ((earnings.thisMonth - earnings.lastMonth) / earnings.lastMonth * 100).toFixed(1)
    : '0';

  if (loading) {
    return (
      <div className="h-full p-6 flex items-center justify-center" style={{ backgroundColor: 'var(--surface-secondary)' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--interactive-primary)' }} />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6" style={{ backgroundColor: 'var(--surface-secondary)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              Earnings & Payments
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Track your revenue and manage payouts
            </p>
          </div>
          <button
            className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            style={{
              backgroundColor: 'var(--interactive-primary)',
              color: 'white'
            }}
          >
            <Download className="h-4 w-4" />
            Export Report
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Total Earnings */}
          <div 
            className="p-6 rounded-xl border"
            style={{ 
              backgroundColor: 'var(--surface-primary)',
              borderColor: 'var(--border-default)'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                Total Earnings
              </span>
              <DollarSign className="h-5 w-5" style={{ color: 'var(--interactive-primary)' }} />
            </div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {formatCurrency(earnings.total)}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              All time
            </div>
          </div>

          {/* This Month */}
          <div 
            className="p-6 rounded-xl border"
            style={{ 
              backgroundColor: 'var(--surface-primary)',
              borderColor: 'var(--border-default)'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                This Month
              </span>
              <Calendar className="h-5 w-5" style={{ color: 'var(--interactive-primary)' }} />
            </div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {formatCurrency(earnings.thisMonth)}
            </div>
            <div 
              className="text-xs mt-1 flex items-center gap-1"
              style={{ color: parseFloat(monthGrowth) >= 0 ? 'var(--success-text)' : 'var(--error-text)' }}
            >
              <TrendingUp className="h-3 w-3" />
              {monthGrowth}% from last month
            </div>
          </div>

          {/* Pending Payout */}
          <div 
            className="p-6 rounded-xl border"
            style={{ 
              backgroundColor: 'var(--surface-primary)',
              borderColor: 'var(--border-default)'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                Pending Payout
              </span>
              <CreditCard className="h-5 w-5" style={{ color: 'var(--interactive-primary)' }} />
            </div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {formatCurrency(earnings.pendingPayout)}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Next payout: Jan 1
            </div>
          </div>

          {/* Active Subscribers */}
          <div 
            className="p-6 rounded-xl border"
            style={{ 
              backgroundColor: 'var(--surface-primary)',
              borderColor: 'var(--border-default)'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                Subscribers
              </span>
              <Users className="h-5 w-5" style={{ color: 'var(--interactive-primary)' }} />
            </div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {earnings.subscriberCount}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Active paying members
            </div>
          </div>
        </div>

        {/* Payout Settings Banner */}
        <div 
          className="rounded-xl border p-6 mb-6 flex items-center justify-between"
          style={{ 
            backgroundColor: 'var(--surface-primary)',
            borderColor: 'var(--border-default)'
          }}
        >
          <div>
            <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Payout Settings
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Configure your bank account and payout schedule
            </p>
          </div>
          <button
            className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            style={{
              backgroundColor: 'var(--surface-tertiary)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)'
            }}
          >
            Configure
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>

        {/* Transactions */}
        <div 
          className="rounded-xl border"
          style={{ 
            backgroundColor: 'var(--surface-primary)',
            borderColor: 'var(--border-default)'
          }}
        >
          <div className="p-6 border-b" style={{ borderColor: 'var(--border-default)' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Recent Transactions
              </h2>
              <div className="flex gap-2">
                {(['week', 'month', 'year'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTimeFilter(filter)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: timeFilter === filter ? 'var(--interactive-primary)' : 'var(--surface-tertiary)',
                      color: timeFilter === filter ? 'white' : 'var(--text-primary)'
                    }}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="divide-y" style={{ borderColor: 'var(--border-default)' }}>
            {transactions.map((transaction) => {
              const Icon = getTransactionIcon(transaction.type);
              const isPositive = transaction.amount > 0;
              
              return (
                <div key={transaction.id} className="p-4 hover:bg-opacity-50 transition-colors" style={{ backgroundColor: 'transparent' }}>
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'var(--surface-tertiary)' }}
                    >
                      <Icon 
                        className="h-5 w-5" 
                        style={{ color: isPositive ? 'var(--success-text)' : 'var(--text-muted)' }} 
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                        {transaction.description}
                      </div>
                      <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <span>{formatDate(transaction.created_at)}</span>
                        {transaction.user_name && (
                          <>
                            <span>•</span>
                            <span>{transaction.user_name}</span>
                          </>
                        )}
                        {transaction.tier_name && (
                          <>
                            <span>•</span>
                            <span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--surface-tertiary)' }}>
                              {transaction.tier_name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div 
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{
                          backgroundColor: transaction.status === 'completed' 
                            ? 'var(--success-bg)' 
                            : transaction.status === 'pending'
                            ? 'var(--surface-tertiary)'
                            : 'var(--error-bg)',
                          color: transaction.status === 'completed'
                            ? 'var(--success-text)'
                            : transaction.status === 'pending'
                            ? 'var(--text-muted)'
                            : 'var(--error-text)'
                        }}
                      >
                        {transaction.status}
                      </div>
                      <div 
                        className="text-lg font-semibold min-w-[100px] text-right"
                        style={{ color: isPositive ? 'var(--success-text)' : 'var(--text-primary)' }}
                      >
                        {isPositive ? '+' : ''}{formatCurrency(transaction.amount)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 border-t" style={{ borderColor: 'var(--border-default)' }}>
            <button
              className="w-full py-2 text-sm font-medium transition-colors"
              style={{ color: 'var(--interactive-primary)' }}
            >
              View All Transactions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
