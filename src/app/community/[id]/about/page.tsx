'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  CheckCircle,
  Lock,
  Check,
  Loader2,
  Star
} from 'lucide-react';
import { useCommunityDetails } from '@/hooks/useCommunityDetails';
import { useCommunityCache } from '@/contexts/CommunityCacheContext';

export default function CommunityAboutPage() {
  const params = useParams();
  const communityId = params.id as string;
  
  // Use cached community details
  const { details, loading } = useCommunityDetails(communityId);
  const { invalidateCommunityDetails } = useCommunityCache();
  
  const [joiningTierId, setJoiningTierId] = useState<string | null>(null);

  // Extract data from cached details
  const community = details;
  const tiers = details?.tiers || [];
  const membershipStatus = details?.membershipStatus;

  const handleJoinTier = async (tierId: string, priceCents: number) => {
    if (!tierId) return;

    try {
      setJoiningTierId(tierId);
      
      const response = await fetch(`/api/communities/${communityId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tierId }),
      });

      const data = await response.json();

      if (response.ok) {
        // Invalidate cache to force refresh
        invalidateCommunityDetails(communityId);
        
        if (priceCents === 0) {
          window.location.reload();
        } else {
          alert(data.message || 'Payment integration coming soon!');
        }
      } else {
        alert(data.error || 'Failed to join community');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to join community');
    } finally {
      setJoiningTierId(null);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: 'var(--surface-secondary)' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--interactive-primary)' }} />
      </div>
    );
  }

  if (!community) {
    return null;
  }

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: 'var(--surface-secondary)' }}>
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-12">
        {/* About Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            About this Community
          </h2>
          <div 
            className="prose max-w-none"
            style={{ color: 'var(--text-secondary)' }}
            dangerouslySetInnerHTML={{ __html: community.long_description || community.description || '' }}
          />
        </section>

        {/* Membership Tiers */}
        <section>
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
            Membership Options
          </h2>

          <div className="tier-comparison-grid">
            {tiers.map((tier: any, index: number) => {
              const isCurrentTier = membershipStatus?.membership?.tier_id === tier.id;
              const canAccess = membershipStatus?.tierLevel >= tier.tier_level;
              const isPopular = index === 1 && tiers.length > 1;

              return (
                <div
                  key={tier.id}
                  className={`tier-card ${isPopular ? 'tier-card-popular' : ''}`}
                >
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                      {tier.name}
                    </h3>
                    <div className="tier-price mb-2">
                      ${(tier.price_monthly / 100).toFixed(0)}
                      <span className="tier-price-period">/month</span>
                    </div>
                    {tier.price_yearly && (
                      <p className="text-sm" style={{ color: 'var(--success-text)' }}>
                        Save ${((tier.price_monthly * 12 - tier.price_yearly) / 100).toFixed(0)}/year
                      </p>
                    )}
                    <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                      {tier.description}
                    </p>
                  </div>

                  <ul className="tier-feature-list">
                    {tier.features?.map((feature: any, idx: number) => (
                      <li key={idx} className="tier-feature">
                        <CheckCircle className="h-5 w-5 tier-feature-icon" />
                        <div>
                          <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                            {feature.name}
                          </div>
                          {feature.description && (
                            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                              {feature.description}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                    {tier.perks?.map((perk: string, idx: number) => (
                      <li key={`perk-${idx}`} className="tier-feature">
                        <CheckCircle className="h-5 w-5 tier-feature-icon" />
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6">
                    {isCurrentTier ? (
                      <button className="btn btn-success w-full" disabled>
                        <Check className="h-4 w-4" />
                        Current Plan
                      </button>
                    ) : canAccess && membershipStatus?.isMember ? (
                      <button className="btn btn-outline w-full" disabled>
                        <Lock className="h-4 w-4" />
                        Already Have Access
                      </button>
                    ) : joiningTierId === tier.id ? (
                      <button className="btn btn-primary w-full" disabled>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Joining...
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoinTier(tier.id, tier.price_monthly)}
                        className="btn btn-primary w-full"
                      >
                        {tier.price_monthly === 0 ? 'Join Free' : 'Subscribe Now'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}



