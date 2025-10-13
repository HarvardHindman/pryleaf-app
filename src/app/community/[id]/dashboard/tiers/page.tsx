'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Crown,
  Star,
  Zap,
  ArrowUp,
  ArrowDown,
  DollarSign,
  Users,
  Lock,
  Unlock,
  Loader2
} from 'lucide-react';

export default function TierManagementPage() {
  const params = useParams();
  const communityId = params.id as string;
  
  const [tiers, setTiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTier, setEditingTier] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchTiers();
  }, [communityId]);

  async function fetchTiers() {
    try {
      const response = await fetch(`/api/communities/${communityId}`);
      const data = await response.json();
      setTiers(data.tiers || []);
    } catch (error) {
      console.error('Error fetching tiers:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--interactive-primary)' }} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Membership Tiers
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Create and manage your membership pricing and benefits
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4" />
          Create Tier
        </button>
      </div>

      {/* Tier List */}
      <div className="space-y-4">
        {tiers.map((tier, index) => (
          <TierCard
            key={tier.id}
            tier={tier}
            index={index}
            totalTiers={tiers.length}
            onEdit={() => setEditingTier(tier)}
            onMoveUp={() => {/* Handle reorder */}}
            onMoveDown={() => {/* Handle reorder */}}
            onToggleActive={() => {/* Handle toggle */}}
            onDelete={() => {/* Handle delete */}}
          />
        ))}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingTier) && (
        <TierEditorModal
          tier={editingTier}
          onClose={() => {
            setShowCreateModal(false);
            setEditingTier(null);
          }}
          onSave={async (tierData) => {
            // TODO: Save tier
            await fetchTiers();
            setShowCreateModal(false);
            setEditingTier(null);
          }}
        />
      )}
    </div>
  );
}

function TierCard({ tier, index, totalTiers, onEdit, onMoveUp, onMoveDown, onToggleActive, onDelete }: any) {
  const getTierIcon = (level: number) => {
    if (level === 0) return Star;
    if (level === 1) return Crown;
    return Zap;
  };

  const Icon = getTierIcon(tier.tier_level);

  return (
    <div 
      className="p-6 rounded-lg border"
      style={{
        backgroundColor: 'var(--surface-primary)',
        borderColor: tier.is_active ? 'var(--border-default)' : 'var(--border-subtle)',
        opacity: tier.is_active ? 1 : 0.6
      }}
    >
      <div className="flex items-start justify-between">
        {/* Tier Info */}
        <div className="flex items-start gap-4 flex-1">
          <div 
            className="p-3 rounded-lg"
            style={{ backgroundColor: 'var(--info-background)' }}
          >
            <Icon className="h-6 w-6" style={{ color: 'var(--info-text)' }} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {tier.name}
              </h3>
              {!tier.is_active && (
                <span 
                  className="text-xs px-2 py-1 rounded-full"
                  style={{ backgroundColor: 'var(--danger-background)', color: 'var(--danger-text)' }}
                >
                  Inactive
                </span>
              )}
            </div>
            
            <p className="mb-3" style={{ color: 'var(--text-muted)' }}>
              {tier.description}
            </p>

            {/* Pricing */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" style={{ color: 'var(--success-text)' }} />
                <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  ${(tier.price_monthly / 100).toFixed(0)}
                  <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>/mo</span>
                </span>
              </div>
              
              {tier.price_yearly && (
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>or</span>
                  <span className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    ${(tier.price_yearly / 100).toFixed(0)}
                    <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>/yr</span>
                  </span>
                  <span 
                    className="text-xs px-2 py-1 rounded-full"
                    style={{ backgroundColor: 'var(--success-background)', color: 'var(--success-text)' }}
                  >
                    Save {Math.round((1 - tier.price_yearly / (tier.price_monthly * 12)) * 100)}%
                  </span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm" style={{ color: 'var(--text-muted)' }}>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{tier.member_count || 0} members</span>
              </div>
              {tier.max_members && (
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  <span>Limited to {tier.max_members}</span>
                </div>
              )}
            </div>

            {/* Benefits */}
            {tier.perks && tier.perks.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {tier.perks.slice(0, 3).map((perk: string, idx: number) => (
                  <span 
                    key={idx}
                    className="text-xs px-3 py-1 rounded-full"
                    style={{ backgroundColor: 'var(--surface-secondary)', color: 'var(--text-secondary)' }}
                  >
                    {perk}
                  </span>
                ))}
                {tier.perks.length > 3 && (
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    +{tier.perks.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button onClick={onEdit} className="btn btn-ghost btn-sm">
            <Edit className="h-4 w-4" />
            Edit
          </button>
          
          <div className="flex gap-1">
            {index > 0 && (
              <button onClick={onMoveUp} className="btn btn-ghost btn-sm p-2">
                <ArrowUp className="h-4 w-4" />
              </button>
            )}
            {index < totalTiers - 1 && (
              <button onClick={onMoveDown} className="btn btn-ghost btn-sm p-2">
                <ArrowDown className="h-4 w-4" />
              </button>
            )}
          </div>

          <button 
            onClick={onToggleActive}
            className={`btn btn-sm ${tier.is_active ? 'btn-ghost' : 'btn-primary'}`}
          >
            {tier.is_active ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            {tier.is_active ? 'Deactivate' : 'Activate'}
          </button>

          {tier.member_count === 0 && (
            <button onClick={onDelete} className="btn btn-ghost btn-sm text-red-500">
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function TierEditorModal({ tier, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    name: tier?.name || '',
    description: tier?.description || '',
    price_monthly: tier?.price_monthly ? tier.price_monthly / 100 : 0,
    price_yearly: tier?.price_yearly ? tier.price_yearly / 100 : 0,
    tier_level: tier?.tier_level || 1,
    max_members: tier?.max_members || '',
    perks: tier?.perks || [],
    is_active: tier?.is_active !== false
  });

  const [newPerk, setNewPerk] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const tierData = {
      ...formData,
      price_monthly: Math.round(formData.price_monthly * 100),
      price_yearly: formData.price_yearly ? Math.round(formData.price_yearly * 100) : null,
      max_members: formData.max_members || null
    };

    onSave(tierData);
  };

  const addPerk = () => {
    if (newPerk.trim()) {
      setFormData({
        ...formData,
        perks: [...formData.perks, newPerk.trim()]
      });
      setNewPerk('');
    }
  };

  const removePerk = (index: number) => {
    setFormData({
      ...formData,
      perks: formData.perks.filter((_: any, i: number) => i !== index)
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div 
        className="rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--surface-primary)' }}
      >
        {/* Header */}
        <div className="sticky top-0 border-b px-6 py-4" style={{ backgroundColor: 'var(--surface-primary)', borderColor: 'var(--border-default)' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {tier ? 'Edit Tier' : 'Create New Tier'}
            </h2>
            <button onClick={onClose} className="btn btn-ghost btn-sm">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Basic Information
            </h3>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Tier Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Premium, Elite, VIP"
                className="w-full px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--surface-secondary)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Description *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of what this tier includes"
                rows={2}
                className="w-full px-4 py-2 rounded-lg border resize-none"
                style={{
                  backgroundColor: 'var(--surface-secondary)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Tier Level *
              </label>
              <select
                value={formData.tier_level}
                onChange={(e) => setFormData({ ...formData, tier_level: parseInt(e.target.value) })}
                className="w-full px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--surface-secondary)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value={0}>Free Tier (Level 0)</option>
                <option value={1}>Standard Tier (Level 1)</option>
                <option value={2}>Premium Tier (Level 2)</option>
                <option value={3}>Elite Tier (Level 3)</option>
              </select>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Higher tiers get access to lower tier content automatically
              </p>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Pricing
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Monthly Price * ($)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price_monthly}
                  onChange={(e) => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--surface-secondary)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Yearly Price ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price_yearly}
                  onChange={(e) => setFormData({ ...formData, price_yearly: parseFloat(e.target.value) })}
                  placeholder="Optional"
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--surface-secondary)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-primary)'
                  }}
                />
                {formData.price_yearly > 0 && (
                  <p className="text-xs mt-1" style={{ color: 'var(--success-text)' }}>
                    Saves {Math.round((1 - formData.price_yearly / (formData.price_monthly * 12)) * 100)}% vs monthly
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Benefits/Perks */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Benefits & Perks
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={newPerk}
                onChange={(e) => setNewPerk(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPerk())}
                placeholder="Add a benefit (e.g., Access to exclusive content)"
                className="flex-1 px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--surface-secondary)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)'
                }}
              />
              <button
                type="button"
                onClick={addPerk}
                className="btn btn-primary"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>

            {formData.perks.length > 0 && (
              <div className="space-y-2">
                {formData.perks.map((perk: string, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: 'var(--surface-secondary)' }}
                  >
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4" style={{ color: 'var(--success-text)' }} />
                      <span style={{ color: 'var(--text-primary)' }}>{perk}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePerk(index)}
                      className="btn btn-ghost btn-sm text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Advanced Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Advanced Settings
            </h3>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Max Members (Optional)
              </label>
              <input
                type="number"
                min="1"
                value={formData.max_members}
                onChange={(e) => setFormData({ ...formData, max_members: e.target.value })}
                placeholder="Leave empty for unlimited"
                className="w-full px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--surface-secondary)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)'
                }}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Limit the number of members who can join this tier
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="is_active" className="text-sm" style={{ color: 'var(--text-primary)' }}>
                Make this tier available for new members
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
            >
              <Check className="h-4 w-4" />
              {tier ? 'Save Changes' : 'Create Tier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

