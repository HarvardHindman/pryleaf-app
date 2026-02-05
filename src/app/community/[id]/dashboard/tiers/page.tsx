'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Award, Plus, Edit2, Trash2, Users, DollarSign, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Tier {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  tier_level: number;
  features: string[];
  member_count?: number;
}

export default function CommunityTiersPage() {
  const params = useParams();
  const { user } = useAuth();
  const communityId = params.id as string;
  
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchTiers();
  }, [communityId]);

  async function fetchTiers() {
    try {
      const response = await fetch(`/api/communities/${communityId}/tiers`);
      if (response.ok) {
        const data = await response.json();
        setTiers(data.tiers);
      }
    } catch (error) {
      console.error('Error fetching tiers:', error);
    } finally {
      setLoading(false);
    }
  }

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
              Membership Tiers
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Manage your community's membership levels and pricing
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            style={{
              backgroundColor: 'var(--interactive-primary)',
              color: 'white'
            }}
          >
            <Plus className="h-4 w-4" />
            Create Tier
          </button>
        </div>

        {/* Tiers Grid */}
        {tiers.length === 0 ? (
          <div 
            className="rounded-lg p-12 text-center border"
            style={{ 
              backgroundColor: 'var(--surface-primary)',
              borderColor: 'var(--border-default)'
            }}
          >
            <Award className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              No membership tiers yet
            </h3>
            <p className="mb-4" style={{ color: 'var(--text-muted)' }}>
              Create your first membership tier to start monetizing your community.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: 'var(--interactive-primary)',
                color: 'white'
              }}
            >
              Create First Tier
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className="rounded-lg p-6 border"
                style={{
                  backgroundColor: 'var(--surface-primary)',
                  borderColor: 'var(--border-default)'
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5" style={{ color: 'var(--interactive-primary)' }} />
                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {tier.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      className="p-1.5 rounded transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      title="Edit tier"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      className="p-1.5 rounded transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      title="Delete tier"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  {tier.description}
                </p>

                {/* Pricing */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      ${tier.price_monthly}/mo or ${tier.price_yearly}/yr
                    </span>
                  </div>
                  {tier.member_count !== undefined && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {tier.member_count} {tier.member_count === 1 ? 'member' : 'members'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Features */}
                {tier.features && tier.features.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                      Features
                    </h4>
                    <ul className="space-y-1">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="text-xs flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                          <span className="text-[var(--interactive-primary)] mt-0.5">•</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
